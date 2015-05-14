var originalData,
    currentMatrix,
    currentSobel,
    currentToon,
    matrixStack = [],
    // limit the canvas size to the screen's size
    limit = Math.max(screen.height, screen.width),
    c = Canvas("demoCanvas", limit, limit);

function reload() {
    function update() {
        c.reloadCanvas(util.toImageData(currentMatrix, originalData));
    }
    if (currentToon) {
        currentToon.stop(update);
        currentToon = null;
    } else {
        update();
    }
}

document.querySelector("#submit").addEventListener('click', function() {
    var fileElement = document.querySelector("#file"),
        urlElement = document.querySelector("#url");
    matrixStack = [];
    function setParams() {
        originalData = c.getImageData();
        currentMatrix = util.toGrayMatrix(originalData);
    }
    if (fileElement.files[0] !== undefined) {
        var reader = new FileReader();
        reader.onload = function(e) {
            c.loadImage(e.target.result, true, setParams);
        };
        reader.readAsDataURL(fileElement.files[0]);
    } else {
        c.loadImage(urlElement.value, false, setParams);
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
        iterator = function(M, cb) {
            if (direction === "top")
                for (var i = 0; i < M.length; i++)
                    for (var j = 0; j < M[0].length; j++)
                        cb(i, j);
            else if (direction === "bottom")
                for (var i = M.length - 1; i >= 0; i--)
                    for (var j = 0; j < M[0].length; j++)
                        cb(i, j);
            else if (direction === "left")
                for (var j = 0; j < M[0].length; j++)
                    for (var i = 0; i < M.length; i++)
                        cb(i, j);
            else if (direction === "right")
                for (var j = M[0].length - 1; j >= 0; j--)
                    for (var i = 0; i < M.length; i++)
                        cb(i, j);
        },
        comparator = function(e1, e2) {
            if (sort === "first")
                return 0;
            else if (sort === "longest")
                return e2.length - e1.length;
            else if (sort === "random")
                return Math.random() - Math.random();
        };
    function update() {
        currentToon = c.autoToon(currentMatrix, speed, bgColor, iterator, comparator);
    }
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
    currentMatrix = util.toGrayMatrix(originalData);
});

document.querySelector("#save").addEventListener('click', function() {
    window.location.href = c.getElem().toDataURL("image/png");
});
