import Canvas from './canvas';
import {
    gaussianMask,
    sobelMask,
    nonMaxSuppression,
    hysteresis,
    inverted,
    sharpenMask,
    laplaceMask,
} from './filters';
import { Mat, toImageData } from './matrix';
import { toMatrix, clamp } from './util';

var originalData: ImageData, // original image data
    currentMatrix: Mat, // current grayscale matrix displayed
    currentSobel: { S: Mat; G: Mat }, // last result of sobel mask
    currentToon: { stop: (onStop: () => void) => void }, // currently animating autotoon
    matrixStack: Mat[] = [], // stack of previous states for undo function
    // keep canvas from stretching too big
    limit = Math.max(screen.height, screen.width),
    c = Canvas('demoCanvas', limit, limit),
    // matrix traversal orders
    iterators = {
        top: function (M: Mat, cb: (arg0: number, arg1: number) => void) {
            for (var i = 0; i < M.length; i++)
                for (var j = 0; j < M[0].length; j++) cb(i, j);
        },
        bottom: function (M: Mat, cb: (arg0: number, arg1: number) => void) {
            for (var i = M.length - 1; i >= 0; i--)
                for (var j = 0; j < M[0].length; j++) cb(i, j);
        },
        left: function (M: Mat, cb: (arg0: number, arg1: number) => void) {
            for (var j = 0; j < M[0].length; j++)
                for (var i = 0; i < M.length; i++) cb(i, j);
        },
        right: function (M: Mat, cb: (arg0: number, arg1: number) => void) {
            for (var j = M[0].length - 1; j >= 0; j--)
                for (var i = 0; i < M.length; i++) cb(i, j);
        },
    };

// Reload the canvas with current matrix data and stop any animation.
function reload() {
    function update() {
        c.reloadCanvas(toImageData(currentMatrix, originalData));
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
    currentMatrix = toMatrix(originalData);
}

document.querySelector('#submit').addEventListener('click', function () {
    var fileElement = document.querySelector<HTMLInputElement>('#file'),
        urlElement = document.querySelector<HTMLInputElement>('#url');
    if (fileElement.files[0] !== undefined) {
        var reader = new FileReader();
        reader.onload = function (e) {
            c.loadImage(e.target.result.toString(), true, setFields);
        };
        reader.readAsDataURL(fileElement.files[0]);
    } else {
        c.loadImage(urlElement.value, false, setFields);
    }
});

document.querySelector('#auto').addEventListener('click', function () {
    // Canny edge detection method
    matrixStack.push(currentMatrix);
    currentMatrix = gaussianMask(currentMatrix, 3, 1.0);
    currentSobel = sobelMask(currentMatrix);
    currentMatrix = currentSobel.S;
    currentMatrix = nonMaxSuppression(currentSobel.S, currentSobel.G);
    currentMatrix = hysteresis(currentMatrix, 0.2, 0.5);
    currentMatrix = inverted(currentMatrix);
    reload();
});

document.querySelector('#blur').addEventListener('click', function () {
    matrixStack.push(currentMatrix);
    var radius = parseInt(
            document.querySelector<HTMLInputElement>('#blur_radius').value
        ),
        sigma = parseFloat(
            document.querySelector<HTMLInputElement>('#blur_sigma').value
        );
    currentMatrix = gaussianMask(currentMatrix, radius, sigma);
    reload();
});

document.querySelector('#sharpen').addEventListener('click', function () {
    matrixStack.push(currentMatrix);
    currentMatrix = sharpenMask(currentMatrix);
    reload();
});

document.querySelector('#sobel').addEventListener('click', function () {
    matrixStack.push(currentMatrix);
    currentSobel = sobelMask(currentMatrix);
    currentMatrix = currentSobel.S;
    reload();
});

document.querySelector('#laplace').addEventListener('click', function () {
    matrixStack.push(currentMatrix);
    currentMatrix = laplaceMask(currentMatrix);
    reload();
});

document.querySelector('#nonmax').addEventListener('click', function () {
    matrixStack.push(currentMatrix);
    currentMatrix = nonMaxSuppression(currentSobel.S, currentSobel.G);
    reload();
});

document.querySelector('#hysteresis').addEventListener('click', function () {
    matrixStack.push(currentMatrix);
    var high = parseFloat(document.querySelector<HTMLInputElement>('#hys_hi').value),
        low = parseFloat(document.querySelector<HTMLInputElement>('#hys_lo').value);
    currentMatrix = hysteresis(currentMatrix, clamp(high, 0, 1), clamp(low, 0, 1));
    reload();
});

document.querySelector('#invert').addEventListener('click', function () {
    matrixStack.push(currentMatrix);
    currentMatrix = inverted(currentMatrix);
    reload();
});

document.querySelector('#autotoon').addEventListener('click', function () {
    matrixStack.push(currentMatrix);
    var speed = parseFloat(
            document.querySelector<HTMLInputElement>('#toon_speed').value
        ),
        direction = document.querySelector<HTMLInputElement>('#toon_dir').value,
        sort = document.querySelector<HTMLInputElement>('#toon_sort').value,
        bgColor = parseInt(document.querySelector<HTMLInputElement>('#toon_bg').value),
        M = currentMatrix,
        n = M[0].length,
        m = M.length,
        cartesianDistance = function (r1: number, c1: number, r2: number, c2: number) {
            return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(c1 - c2, 2));
        },
        // Number of rows the edge spans
        ySpan = function (edge: number[]) {
            var yMin = Infinity,
                yMax = -Infinity;
            edge.forEach(function (elem: number) {
                var r = elem / n;
                yMin = Math.min(yMin, r);
                yMax = Math.max(yMax, r);
            });
            console.log(yMax, yMin);
            return yMax - yMin;
        },
        // Number of cols the edge spans
        xSpan = function (edge: number[]) {
            var xMin = Infinity,
                xMax = -Infinity;
            edge.forEach(function (elem: number) {
                var c = elem % n;
                xMin = Math.min(xMin, c);
                xMax = Math.max(xMax, c);
            });
            console.log(xMax, xMin);
            return xMax - xMin;
        },
        transform = (function () {
            function longest(edges: number[][]) {
                edges.sort(function (e1: number[], e2: number[]) {
                    return e2.length - e1.length;
                });
            }
            function random(edges: number[][]) {
                // Fisher-Yates shuffle, description on Wikipedia.
                for (var i = 0; i < edges.length - 1; i++) {
                    var j = Math.floor(Math.random() * (edges.length - i)) + i,
                        temp = edges[i];
                    edges[i] = edges[j];
                    edges[j] = temp;
                }
            }
            function darkest(edges: number[][]) {
                edges.sort(function (e1: number[], e2: number[]) {
                    var s1 = 0,
                        s2 = 0;
                    e1.forEach(function (elem: number) {
                        s1 += Math.abs(bgColor - M[Math.floor(elem / n)][elem % n]);
                    });
                    e2.forEach(function (elem: number) {
                        s2 += Math.abs(bgColor - M[Math.floor(elem / n)][elem % n]);
                    });
                    return s2 / e2.length - s1 / e1.length;
                });
            }
            function center(edges: number[][]) {
                edges.sort(function (e1: number[], e2: number[]) {
                    var c1 = 0,
                        c2 = 0;
                    e1.forEach(function (elem: number) {
                        c1 += cartesianDistance(m / 2, n / 2, elem / n, elem % n);
                    });
                    e2.forEach(function (elem: number) {
                        c2 += cartesianDistance(m / 2, n / 2, elem / n, elem % n);
                    });
                    return c1 / e1.length - c2 / e2.length;
                });
            }
            function widest(edges: number[][]) {
                // We sort by the span of the edge: the x-range + y-range
                edges.sort(function (e1: number[], e2: number[]) {
                    return (
                        cartesianDistance(ySpan(e2), xSpan(e2), 0, 0) -
                        cartesianDistance(ySpan(e1), xSpan(e1), 0, 0)
                    );
                });
            }
            // now we select one of these functions and return it
            return { longest, random, darkest, center, widest }[sort];
        })(),
        update = function () {
            currentToon = c.autoToon(
                currentMatrix,
                speed,
                bgColor,
                iterators[direction as 'top' | 'bottom' | 'left' | 'right'],
                transform
            );
        };
    if (currentToon) {
        currentToon.stop(update);
    } else {
        update();
    }
});

document.querySelector('#undo').addEventListener('click', function () {
    currentMatrix = matrixStack.pop();
    reload();
});

document.querySelector('#reset').addEventListener('click', function () {
    c.reloadCanvas(originalData);
    matrixStack.push(currentMatrix);
    currentMatrix = toMatrix(originalData);
    document.querySelector<HTMLInputElement>('#file').value = ''; // remove selected file
});

document.querySelector('#save').addEventListener('click', function () {
    window.location.href = c.getElem().toDataURL('image/png');
});

document.querySelector('#share').addEventListener('click', function () {
    var src = encodeURI(c.getImage().src),
        loc = window.location.href,
        query = loc.indexOf('?'),
        url = loc.slice(0, query > 0 ? query : loc.length) + '?src=' + src,
        textArea = document.querySelector<HTMLTextAreaElement>('#sharetext');
    if (src.length > 2000) {
        alert('Too long. Try submitting file by URL, then sharing.');
    } else {
        textArea.value = url;
        textArea.style.display = 'block';
    }
});

// if src param is given, try to load canvas from that
window.location.search
    .slice(1)
    .split('&')
    .forEach(function (param) {
        if (!param) return;
        var split = param.split('='),
            key = split[0],
            val = decodeURI(split[1]);
        if (key === 'src')
            c.loadImage(val, val.indexOf('data:image/') !== -1, function () {
                setFields();
                if (window.location.hash === '#auto') {
                    document.querySelector<HTMLButtonElement>('#auto').click();
                    document.querySelector<HTMLButtonElement>('#autotoon').click();
                }
            });
    });

// TODO resize the image to fit canvas, make max size e.g. 1MP or size of viewport
// TODO simplify the page, reduce the # of buttons and instead make sliders such as
// Maybe add a loading spinner as well, and a way to save video?
// edge trimming (hysteresis), edge sharpness (sharpening)
