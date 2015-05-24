var originalData, // original image data
    currentMatrix,// current grayscale matrix displayed
    currentSobel, // last result of sobel mask
    currentToon,  // currently animating autotoon
    matrixStack = [], // stack of previous states for undo function
    // keep canvas from stretching too big
    limit = Math.max(screen.height, screen.width),
    c = Canvas("demoCanvas", limit, limit),
    // matrix traversal orders
    iterators = {
        "top": function(M, cb) {
            for (var i = 0; i < M.length; i++)
                for (var j = 0; j < M[0].length; j++)
                    cb(i, j);
        },
        "bottom": function(M, cb) {
            for (var i = M.length - 1; i >= 0; i--)
                for (var j = 0; j < M[0].length; j++)
                    cb(i, j);
        },
        "left": function(M, cb) {
            for (var j = 0; j < M[0].length; j++)
                for (var i = 0; i < M.length; i++)
                    cb(i, j);
        },
        "right": function(M, cb) {
            for (var j = M[0].length - 1; j >= 0; j--)
                for (var i = 0; i < M.length; i++)
                    cb(i, j);
        },
    };


// Reload the canvas with current matrix data and stop any animation.
function reload() {
    function update() {
        c.reloadCanvas(matrix.toImageData(currentMatrix, originalData));
    }
    if (currentToon) {
        currentToon.stop(update);
        currentToon = null;
    } else {
        update();
    }
}

// Set our global variables from what is on the canvas.
function setFields() {
    matrixStack = [];
    originalData = c.getImageData();
    currentMatrix = util.toMatrix(originalData);
}

document.querySelector("#submit").addEventListener('click', function() {
    var fileElement = document.querySelector("#file"),
        urlElement = document.querySelector("#url");
    if (fileElement.files[0] !== undefined) {
        var reader = new FileReader();
        reader.onload = function(e) {
            c.loadImage(e.target.result, true, setFields);
        };
        reader.readAsDataURL(fileElement.files[0]);
    } else {
        c.loadImage(urlElement.value, false, setFields);
    }
});

document.querySelector("#auto").addEventListener('click', function() {
    // Canny edge detection method
    matrixStack.push(currentMatrix);
    currentMatrix = filters.gaussianMask(currentMatrix, 3, 1.0);
    currentSobel = filters.sobelMask(currentMatrix);
    currentMatrix = currentSobel.S;
    currentMatrix = filters.nonMaxSuppression(currentSobel.S, currentSobel.G);
    currentMatrix = filters.hysteresis(currentMatrix, 0.2, 0.5);
    currentMatrix = filters.inverted(currentMatrix);
    reload();
});

document.querySelector("#blur").addEventListener('click', function() {
    matrixStack.push(currentMatrix);
    var radius = parseInt(document.querySelector("#blur_radius").value),
        sigma = parseFloat(document.querySelector("#blur_sigma").value);
    currentMatrix = filters.gaussianMask(currentMatrix, radius, sigma);
    reload();
});

document.querySelector("#sobel").addEventListener('click', function() {
    matrixStack.push(currentMatrix);
    currentSobel = filters.sobelMask(currentMatrix);
    currentMatrix = currentSobel.S;
    reload();
});

document.querySelector("#laplace").addEventListener('click', function() {
    matrixStack.push(currentMatrix);
    currentMatrix = filters.laplaceMask(currentMatrix);
    reload();
});

document.querySelector("#nonmax").addEventListener('click', function() {
    matrixStack.push(currentMatrix);
    currentMatrix = filters.nonMaxSuppression(currentSobel.S, currentSobel.G);
    reload();
});

document.querySelector("#hysteresis").addEventListener('click', function() {
    matrixStack.push(currentMatrix);
    var high = parseFloat(document.querySelector("#hys_hi").value),
        low = parseFloat(document.querySelector("#hys_lo").value);
    currentMatrix = filters.hysteresis(
            currentMatrix,
            util.clamp(high, 0, 1),
            util.clamp(low, 0, 1));
    reload();
});

document.querySelector("#invert").addEventListener('click', function() {
    matrixStack.push(currentMatrix);
    currentMatrix = filters.inverted(currentMatrix);
    reload();
});

document.querySelector("#autotoon").addEventListener('click', function() {
    matrixStack.push(currentMatrix);
    var speed = parseFloat(document.querySelector("#toon_speed").value),
        direction = document.querySelector("#toon_dir").value,
        sort = document.querySelector("#toon_sort").value,
        bgColor = parseInt(document.querySelector("#toon_bg").value),
        M = currentMatrix,
        n = M[0].length,
        m = M.length,
        cartesianDistance = function(r1, c1, r2, c2) {
            return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(c1 - c2, 2));
        },
        // Number of rows the edge spans
        ySpan = function(edge) {
            var yMin = Infinity, yMax = -Infinity;
            edge.forEach(function(elem) {
                var r = elem / n;
                yMin = Math.min(yMin, r);
                yMax = Math.max(yMax, r);
            });
            console.log(yMax, yMin);
            return yMax - yMin;
        },
        // Number of cols the edge spans
        xSpan = function(edge) {
            var xMin = Infinity, xMax = -Infinity;
            edge.forEach(function(elem) {
                var c = elem % n;
                xMin = Math.min(xMin, c);
                xMax = Math.max(xMax, c);
            });
            console.log(xMax, xMin);
            return xMax - xMin;
        },
        transform = (function() {
            function longest(edges) {
                edges.sort(function(e1, e2) { return e2.length - e1.length; });
            }
            function random(edges) {
                // Fisher-Yates shuffle, description on Wikipedia.
                for (var i = 0; i < edges.length - 1; i++) {
                    var j = Math.floor(Math.random() * (edges.length - i)) + i,
                        temp = edges[i];
                    edges[i] = edges[j];
                    edges[j] = temp;
                }
            }
            function darkest(edges) {
                edges.sort(function(e1, e2) {
                    var s1 = 0, s2 = 0;
                    e1.forEach(function(elem) {
                        s1 += Math.abs(bgColor - M[Math.floor(elem / n)][elem % n]);
                    });
                    e2.forEach(function(elem) {
                        s2 += Math.abs(bgColor - M[Math.floor(elem / n)][elem % n]);
                    });
                    return (s2 / e2.length) - (s1 / e1.length);
                });
            }
            function center(edges) {
                edges.sort(function(e1, e2) {
                    var c1 = 0, c2 = 0;
                    e1.forEach(function(elem) {
                        c1 += cartesianDistance(m / 2, n / 2, elem / n, elem % n);
                    });
                    e2.forEach(function(elem) {
                        c2 += cartesianDistance(m / 2, n / 2, elem / n, elem % n);
                    });
                    return (c1 / e1.length) - (c2 / e2.length);
                });
            }
            function widest(edges) {
                // We sort by the span of the edge: the x-range + y-range
                edges.sort(function(e1, e2) {
                    return cartesianDistance(ySpan(e2), xSpan(e2), 0, 0) -
                        cartesianDistance(ySpan(e1), xSpan(e1), 0, 0);
                });
            }
            // now we select one of these functions and return it
            return util.exports({}, [longest, random, darkest, center, widest])[sort];
        })(),
        update = function() {
            currentToon = c.autoToon(currentMatrix, speed, bgColor,
                    iterators[direction], transform);
        };
    if (currentToon) {
        currentToon.stop(update);
    } else {
        update();
    }
});

document.querySelector("#undo").addEventListener('click', function() {
    currentMatrix = matrixStack.pop();
    reload();
});

document.querySelector("#reset").addEventListener('click', function() {
    c.reloadCanvas(originalData);
    matrixStack.push(currentMatrix);
    currentMatrix = util.toMatrix(originalData);
    document.querySelector("#file").value = ""; // remove selected file
});

document.querySelector("#save").addEventListener('click', function() {
    window.location.href = c.getElem().toDataURL("image/png");
});

document.querySelector("#share").addEventListener('click', function() {
    var src = encodeURI(c.getImage().src),
        loc = window.location.href,
        query = loc.indexOf("?"),
        url = loc.slice(0, (query > 0) ? query: loc.length) + "?src=" + src,
        textArea = document.querySelector("#sharetext");
    if (src.length > 2000) {
        alert("Too long. Try submitting file by URL, then sharing.");
    } else {
        textArea.value = url;
        textArea.style.display = 'block';
    }
});

// if src param is given, try to load canvas from that
window.location.search.slice(1).split("&").forEach(function(param) {
    if (!param) return;
    var split = param.split("="),
        key = split[0],
        val = decodeURI(split[1]);
    if (key === "src")
        c.loadImage(val, val.indexOf("data:image/") !== -1, setFields);
});
