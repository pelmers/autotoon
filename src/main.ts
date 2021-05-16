import Canvas, { CanvasType } from './canvas';
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

declare const plausible: any;

const getMaxWidth = () =>
    document.querySelector('body').getBoundingClientRect().width - 20;
const getMaxHeight = () => window.screen.height - 50;
const getMaxSize = () => 900000;

const $demoCanvas = document.querySelector<HTMLCanvasElement>('#demoCanvas');
const $file = document.querySelector<HTMLInputElement>('#file');
const $dragDrop = document.querySelector<HTMLDivElement>('#dragdrop');
const $findEdges = document.querySelector<HTMLButtonElement>('#find-edges');
const $moreEdges = document.querySelector<HTMLButtonElement>('#more-edges');
const $lessEdges = document.querySelector<HTMLButtonElement>('#less-edges');
const $autotoon = document.querySelector<HTMLButtonElement>('#autotoon');
const $autotoonGroup = document.querySelector<HTMLDivElement>('#autotoonGroup');
const $toonSpeed = document.querySelector<HTMLInputElement>('#toon_speed');
const $toonDir = document.querySelector<HTMLInputElement>('#toon_dir');
const $toonSort = document.querySelector<HTMLInputElement>('#toon_sort');
const $reset = document.querySelector<HTMLButtonElement>('#reset');
const $clearImage = document.querySelector<HTMLButtonElement>('#clear-image');

let sharpenLevel = 0;
let c: CanvasType;
var originalData: ImageData, // original image data
    originalMatrix: Mat, // original image matrix in grayscale
    currentMatrix: Mat, // current grayscale matrix displayed
    currentSobel: { S: Mat; G: Mat }, // last result of sobel mask
    currentToon: { stop: (onStop: () => void) => void }, // currently animating autotoon
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
    originalData = c.getImageData();
    originalMatrix = toMatrix(originalData);
    currentMatrix = originalMatrix;
}

function reset(hideAgain: boolean = false) {
    if (!originalData) {
        return;
    }
    reload();
    c.reloadCanvas(originalData);
    currentMatrix = originalMatrix;
    if (hideAgain) {
        $moreEdges.style.display = 'none';
        $lessEdges.style.display = 'none';
        $autotoonGroup.style.display = 'none';
    }
}

$dragDrop.addEventListener('click', () => $file.click());
$dragDrop.addEventListener('dragenter', (e) => {
    e.preventDefault();
    e.stopPropagation();
});
$dragDrop.addEventListener('dragexit', (e) => {
    e.preventDefault();
    e.stopPropagation();
});
$dragDrop.addEventListener('drag', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
});
$file.addEventListener('change', () => handleFiles($file.files));

function handleFiles(files: FileList) {
    const f = files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
        // keep canvas from stretching too big
        (c = Canvas('demoCanvas', getMaxWidth(), getMaxHeight(), getMaxSize())),
            c.loadImage(e.target.result.toString(), true, setFields);
        $dragDrop.style.display = 'none';
        $demoCanvas.style.display = 'block';
        $findEdges.style.display = 'block';
    };
    reader.readAsDataURL(f);
}

function applySharpenLevel() {
    for (let i = 0; i < sharpenLevel; i++) {
        currentMatrix = sharpenMask(currentMatrix);
    }
    for (let i = sharpenLevel; i < 0; i++) {
        currentMatrix = gaussianMask(currentMatrix, 3, 0.7);
    }
}

function cannyMethod() {
    // Canny edge detection method
    currentMatrix = gaussianMask(currentMatrix, 3, 1.0);
    currentSobel = sobelMask(currentMatrix);
    currentMatrix = currentSobel.S;
    currentMatrix = nonMaxSuppression(currentSobel.S, currentSobel.G);
    currentMatrix = hysteresis(currentMatrix, 0.18, 0.45);
    currentMatrix = inverted(currentMatrix);
}

$findEdges.addEventListener('click', function () {
    reset();
    sharpenLevel = 0;
    applySharpenLevel();
    cannyMethod();
    $moreEdges.style.display = 'block';
    $lessEdges.style.display = 'block';
    reload();
    $autotoonGroup.style.display = 'block';
});

$moreEdges.addEventListener('click', function () {
    reset();
    sharpenLevel++;
    applySharpenLevel();
    cannyMethod();
    reload();
});

$lessEdges.addEventListener('click', function () {
    reset();
    sharpenLevel--;
    applySharpenLevel();
    cannyMethod();
    reload();
});

$autotoon.addEventListener('click', function () {
    if (currentToon) {
        currentToon.stop(() => {
            currentToon = null;
            $autotoon.textContent = 'Autotoon';
        });
        return;
    }
    const speed = parseFloat($toonSpeed.value),
        direction = $toonDir.value,
        sort = $toonSort.value,
        bgColor = 255,
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
        })();
    currentToon = c.autoToon(
        currentMatrix,
        speed,
        bgColor,
        iterators[direction as 'top' | 'bottom' | 'left' | 'right'],
        transform,
        () => {
            currentToon = null;
            $autotoon.textContent = 'Autotoon';
        }
    );
    $autotoon.textContent = 'Stop';
    plausible('autotoon');
});

$reset.addEventListener('click', () => reset(true));
$clearImage.addEventListener('click', () => window.location.reload());

// TODO add a loading spinner as well, and a way to save video?
