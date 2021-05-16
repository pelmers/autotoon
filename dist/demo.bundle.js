/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./canvas.ts":
/*!*******************!*\
  !*** ./canvas.ts ***!
  \*******************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Canvas)
/* harmony export */ });
/* harmony import */ var _matrix__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./matrix */ "./matrix.ts");
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./util */ "./util.ts");


/**
 * Wrap a canvas object with given ID and maximum parameters.
 */
function Canvas(id, maxWidth, maxHeight, maxPixels) {
    var elem = document.getElementById(id), // canvas element
    ctx = elem.getContext('2d'), // drawing context
    image = null; // Image object
    /**
     * Load given image onto the canvas, replacing any existing content,
     * and resize the canvas to fit the picture.
     * Call callback once the image is loaded.
     */
    function loadImage(imgSource, isDataURI, callback) {
        function handler() {
            // downscale factor image to maxWidth or maxHeight if it's too big
            var scaling = (0,_util__WEBPACK_IMPORTED_MODULE_1__.clamp)(1 / Math.max(image.width / maxWidth, image.height / maxHeight), 0.0, 1.0);
            elem.width = Math.floor(scaling * image.width);
            elem.height = Math.floor(scaling * image.height);
            const size = elem.width * elem.height;
            if (size > maxPixels) {
                const maxScale = Math.sqrt(size / maxPixels);
                elem.width = Math.floor(elem.width / maxScale);
                elem.height = Math.floor(elem.height / maxScale);
            }
            ctx.drawImage(image, 0, 0, elem.width, elem.height);
            if (callback)
                callback();
        }
        image = new Image();
        image.onload = handler;
        // for some reason setting this when the src is actually not
        // cross-origin causes firefox to not fire the onload handler
        if (!isDataURI)
            // allow cross-origin requests for supported servers
            image.crossOrigin = 'Anonymous';
        image.src = imgSource;
    }
    /**
     * Reload the canvas with given ImageData.
     */
    function reloadCanvas(data) {
        elem.width = data.width;
        elem.height = data.height;
        ctx.putImageData(data, 0, 0);
    }
    /**
     * Return the image data of the currently drawn context.
     */
    function getImageData() {
        return ctx.getImageData(0, 0, elem.width, elem.height);
    }
    /**
     * Return the currently displayed Image object.
     */
    function getImage() {
        return image;
    }
    /**
     * Return the current canvas 2D context.
     */
    function getContext() {
        return ctx;
    }
    /**
     * Return the current canvas DOM element.
     */
    function getElem() {
        return elem;
    }
    /**
     * Animate the drawing of the edges of M, with speed given in pixels / ms,
     * bgColor defining the grayscale value of the background (either 0 or
     * 255), and matrixIter being a function which takes parameters M and
     * callback(i,j) and iterates over each element of M in some order, calling
     * callback at each element, and transform(edges) optionally provides a
     * function to re-order or otherwise modify the list of edges found and is
     * called before animation begins. Return an object that contains a
     * function .stop(cb) which stops the animation and calls cb on the next
     * frame.
     */
    function autoToon(M, speed, bgColor, matrixIter, transform, onComplete) {
        var m = M.length, n = M[0].length, groupedPixels = {}, groups = [], stopCallback = null, num = 0, // current index in groups
        idx = 0, // current index in groups[num]
        // the current state of the animation, initially all background
        globalmat = (0,_matrix__WEBPACK_IMPORTED_MODULE_0__.fromFunc)(m, n, function () {
            return bgColor;
        }), lastTime, // the last time at which we drew any pixels
        done = false; // is the animation complete?
        // Trace the edge that contains start and return its positions.
        function traceEdge(start) {
            var trace = [], stack = [start];
            groupedPixels[start] = true;
            while (stack.length > 0) {
                var v = stack.pop();
                trace.push(v);
                (0,_matrix__WEBPACK_IMPORTED_MODULE_0__.neighborhood)(M, Math.floor(v / n), v % n, function (val, r, c) {
                    // TODO: order neighbors -- it would be better to try to
                    // continue edges in the same direction if possible
                    var pos = r * n + c;
                    if (val !== bgColor && groupedPixels[pos] === undefined) {
                        stack.push(pos);
                        groupedPixels[pos] = true;
                    }
                });
            }
            return trace;
        }
        // Partition the image into edges in some traversal order
        matrixIter(M, function (i, j) {
            var pos = i * n + j;
            if (M[i][j] !== bgColor && groupedPixels[pos] === undefined)
                groups.push(traceEdge(pos));
        });
        if (transform)
            transform(groups);
        // Before we begin drawing, we first clear the canvas.
        reloadCanvas((0,_matrix__WEBPACK_IMPORTED_MODULE_0__.toImageData)(globalmat));
        // Draw next toDraw pixels, return whether we have reached the end.
        function drawPixels(toDraw) {
            if (toDraw === 0)
                return false;
            var begin = idx, end = Math.min(groups[num].length, begin + toDraw), minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity, leftover = toDraw - (end - begin);
            /* Explanation: collect the next chunk of pixels into a submatrix
             * and then call putImageData to the top left corner. To make sure
             * we don't overwrite previous edges, we initialize submatrix from
             * globalmatrix. Doing this lets the browser animate at a good
             * speed (as opposed to drawing one pixel at a time).
             */
            // First initialize the bounds on this chunk
            for (var i = begin; i < end; i++) {
                var r = Math.floor(groups[num][i] / n), c = groups[num][i] % n;
                minR = Math.min(minR, r);
                maxR = Math.max(maxR, r);
                minC = Math.min(minC, c);
                maxC = Math.max(maxC, c);
            }
            var yRange = maxR - minR + 1, xRange = maxC - minC + 1;
            // Create submatrix from the global matrix
            var submat = (0,_matrix__WEBPACK_IMPORTED_MODULE_0__.fromFunc)(yRange, xRange, function (i, j) {
                return globalmat[i + minR][j + minC];
            });
            // Update entries belonging to pixels in this chunk
            for (var i = begin; i < end; i++) {
                var r = Math.floor(groups[num][i] / n), c = groups[num][i] % n;
                globalmat[r][c] = submat[r - minR][c - minC] = M[r][c];
            }
            // draw this submatrix in the right spot on the canvas
            ctx.putImageData((0,_matrix__WEBPACK_IMPORTED_MODULE_0__.toImageData)(submat), minC, minR);
            // Update counters and decide whether to continue
            idx = end;
            if (idx === groups[num].length) {
                idx = 0;
                num++;
            }
            if (num === groups.length) {
                done = true;
                onComplete && onComplete();
                return true;
            }
            return drawPixels(leftover);
        }
        // Manage the timings and call drawPixels as appropriate.
        function animator(t) {
            if (stopCallback) {
                stopCallback();
                done = true;
                onComplete && onComplete();
                return;
            }
            if (lastTime === undefined) {
                // First time animator is called, just record the time
                lastTime = t;
                window.requestAnimationFrame(animator);
            }
            else {
                var chunkSize = Math.round((t - lastTime) * speed);
                if (chunkSize > 0) {
                    lastTime = t;
                    if (!drawPixels(chunkSize))
                        window.requestAnimationFrame(animator);
                }
                else {
                    // We need more time to elapse before drawing
                    window.requestAnimationFrame(animator);
                }
            }
        }
        // Stop the animation and register onStop callback. If animation
        // already done, call it immediately.
        function stop(onStop) {
            stopCallback = onStop || function () { };
            if (done)
                stopCallback();
        }
        // Begin animating.
        window.requestAnimationFrame(animator);
        return { stop };
    }
    return {
        // exported functions on Canvas objects
        loadImage,
        getImage,
        getImageData,
        reloadCanvas,
        getContext,
        getElem,
        autoToon,
    };
}


/***/ }),

/***/ "./filters.ts":
/*!********************!*\
  !*** ./filters.ts ***!
  \********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "inverted": () => (/* binding */ inverted),
/* harmony export */   "gaussianMask": () => (/* binding */ gaussianMask),
/* harmony export */   "sharpenMask": () => (/* binding */ sharpenMask),
/* harmony export */   "interpolateNeighbor": () => (/* binding */ interpolateNeighbor),
/* harmony export */   "sobelMask": () => (/* binding */ sobelMask),
/* harmony export */   "laplaceMask": () => (/* binding */ laplaceMask),
/* harmony export */   "nonMaxSuppression": () => (/* binding */ nonMaxSuppression),
/* harmony export */   "estimateThreshold": () => (/* binding */ estimateThreshold),
/* harmony export */   "hysteresis": () => (/* binding */ hysteresis)
/* harmony export */ });
/* harmony import */ var _matrix__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./matrix */ "./matrix.ts");
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./util */ "./util.ts");


/**
 * Return new matrix where each element is 255 - old element.
 */
function inverted(M) {
    return (0,_matrix__WEBPACK_IMPORTED_MODULE_0__.fromFunc)(M.length, M[0].length, function (i, j) {
        return 255 - M[i][j];
    });
}
/**
 * Apply a Gaussian blur mask to the image matrix M with given radius and
 * sigma. Return the new, blurred matrix.
 */
function gaussianMask(M, radius, sigma) {
    // construct the blur kernel
    var k = 2 * radius + 1, mean = k / 2, sum = 0, kernel = (0,_matrix__WEBPACK_IMPORTED_MODULE_0__.fromFunc)(k, k, function (x, y) {
        return (Math.exp(-0.5 *
            (Math.pow((x - mean) / sigma, 2) +
                Math.pow((y - mean) / sigma, 2))) /
            (2 * Math.PI * sigma * sigma));
    });
    // compute sum
    for (var x = 0; x < k; x++)
        for (var y = 0; y < k; y++)
            sum += kernel[x][y];
    // normalize
    for (var x = 0; x < k; x++)
        for (var y = 0; y < k; y++)
            kernel[x][y] /= sum;
    return (0,_matrix__WEBPACK_IMPORTED_MODULE_0__.convolution)(kernel, M, 0, 255);
}
/**
 * Apply an image sharpening mask to the matrix M. Return the new matrix.
 */
function sharpenMask(M) {
    return (0,_matrix__WEBPACK_IMPORTED_MODULE_0__.convolution)([
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0],
    ], M, 0, 255);
}
/**
 * Interpolate the value of the neighbor at angle radians from i, j in M.
 */
function interpolateNeighbor(M, i, j, angle) {
    // We transform angle from [0, 2pi) to [0, 8), so 1 radian : 45 degrees
    // so flooring this value gives us direction of the previous value, and
    // ceil-ing this value gives us the next value mod 8 in the
    // neighborhood then we can index into the neighborhood by numbering:
    // 3   2   1                                 (-1,-1)  (-1, 0)  (-1, 1)
    // 4   -   0   then define the mapping to    (0, -1)     -     ( 0, 1)
    // 5   6   7                                 (1, -1)  ( 1, 0)  ( 1, 1)
    // Find value of neighbor to i, j in M in octant o in [0, 8)
    function octantToNeighbor(o) {
        // remark dy(o) == dx(o+2); this map returns the dy value
        var map = function (x) {
            switch (x % 8) {
                case 0:
                case 4:
                    return 0;
                case 1:
                case 2:
                case 3:
                    return -1;
                case 5:
                case 6:
                case 7:
                    return 1;
            }
        };
        return M[i + map(o)][j + map(o + 2)];
    }
    var octant = (angle * 4) / Math.PI, ratio = octant % 1, // Use a trick to get decimal part of octant
    prev = octantToNeighbor(Math.floor(octant)), next = octantToNeighbor(Math.ceil(octant));
    return ratio * prev + (1 - ratio) * next;
}
/**
 * Apply a sobel operator to the given grayscale image data matrix, assumed to
 * be in grayscale, and return the result matrix S and gradient matrix G.
 */
function sobelMask(M) {
    // gradient approximation masks for x and y directions
    var Gx = [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1],
    ], Gy = [
        [1, 2, 1],
        [0, 0, 0],
        [-1, -2, -1],
    ], Cx = (0,_matrix__WEBPACK_IMPORTED_MODULE_0__.convolution)(Gx, M), Cy = (0,_matrix__WEBPACK_IMPORTED_MODULE_0__.convolution)(Gy, M), Csum = (0,_matrix__WEBPACK_IMPORTED_MODULE_0__.fromFunc)(Cx.length, Cx[0].length, function (i, j) {
        return (0,_util__WEBPACK_IMPORTED_MODULE_1__.clamp)(Math.abs(Cx[i][j]) + Math.abs(Cy[i][j]), 0, 255);
    }), G = (0,_matrix__WEBPACK_IMPORTED_MODULE_0__.fromFunc)(Cx.length, Cx[0].length, function (i, j) {
        if (Cx[i][j] === 0)
            return Cy[i][j] ? Math.PI / 2 : 0;
        return Math.atan(Math.abs(Cy[i][j]) / Math.abs(Cx[i][j]));
    });
    return { S: Csum, G: G };
}
/**
 * Apply a discrete 5x5 Laplacian mask on M.
 */
function laplaceMask(M) {
    return (0,_matrix__WEBPACK_IMPORTED_MODULE_0__.convolution)([
        [-1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1],
        [-1, -1, 24, -1, -1],
        [-1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1],
    ], M, 0, 255);
}
/**
 * Given image matrix M, gradient matrix G, construct a new image matrix where
 * edge points lying on non-maximal gradients are set to 0.
 */
function nonMaxSuppression(M, G) {
    return (0,_matrix__WEBPACK_IMPORTED_MODULE_0__.fromFunc)(M.length, M[0].length, function (i, j) {
        // don't suppress the borders
        if (i === 0 || j === 0 || i === M.length - 1 || j === M[0].length - 1)
            return M[i][j];
        // previous and next values along the approximated gradient
        var prev = interpolateNeighbor(M, i, j, G[i][j]), next = interpolateNeighbor(M, i, j, Math.PI + G[i][j]);
        if (M[i][j] < prev || M[i][j] < next)
            // suppress to 0 since it's non-maximum
            return 0;
        return M[i][j];
    });
}
/**
 * Estimate upper and lower hysteresis thresholds, returning {hi: num, lo:
 * num}, where high_percentage is the percentage of pixels that will meet
 * hi, and low_percentage is the ratio of lo to hi.
 */
function estimateThreshold(M, high_percentage, low_percentage) {
    var histogram = (0,_matrix__WEBPACK_IMPORTED_MODULE_0__.zeros)(1, 256)[0], // length 256 array of zeros
    m = M.length, n = M[0].length;
    // Construct histogram of pixel values
    M.forEach((r) => {
        r.forEach((e) => {
            histogram[e]++;
        });
    });
    // Compute number of pixels we want to target.
    var pixels = (m * n - histogram[0]) * high_percentage, high_cutoff = 0, i = histogram.length, j = 1;
    while (high_cutoff < pixels)
        high_cutoff += histogram[i--];
    // Increment j up to first non-zero frequency (so we ignore those).
    while (histogram[j] === 0)
        j++;
    j += i * low_percentage;
    // j = (i * low_percentage + j) * low_percentage;
    return { hi: i, lo: j };
}
/**
 * Apply hysteresis to trace edges with given lower and upper thresholds
 * and return the resulting matrix. This thins edges by only keeping points
 * connected to "strong" edges, as defined by the threshold function.
 */
function hysteresis(M, high_percentage, low_percentage) {
    var threshold = estimateThreshold(M, high_percentage, low_percentage), m = M.length, n = M[0].length, realEdges = (0,_matrix__WEBPACK_IMPORTED_MODULE_0__.zeros)(m, n); // 0 if not connected to real edge, 1 if is
    // Return array of neighbors of M[i][j] where M[n] >= threshold.lo.
    function collectNeighbors(i, j) {
        var stack = [i * n + j];
        realEdges[i][j] = M[i][j];
        while (stack.length > 0) {
            var v = stack.pop();
            (0,_matrix__WEBPACK_IMPORTED_MODULE_0__.neighborhood)(M, Math.floor(v / n), v % n, (val, r, c) => {
                var pos = r * n + c;
                if (val >= threshold.lo && !realEdges[r][c]) {
                    realEdges[r][c] = val;
                    stack.push(pos);
                }
            });
        }
    }
    for (var i = 0; i < m; i++) {
        for (var j = 0; j < n; j++) {
            // We consider that these are "strong" pixels, then we trace
            // the edge that they are part of. Also we skip any pixels we
            // have already marked as real
            if (M[i][j] >= threshold.hi && !realEdges[i][j]) {
                collectNeighbors(i, j);
            }
        }
    }
    return realEdges;
}


/***/ }),

/***/ "./matrix.ts":
/*!*******************!*\
  !*** ./matrix.ts ***!
  \*******************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "fromFunc": () => (/* binding */ fromFunc),
/* harmony export */   "zeros": () => (/* binding */ zeros),
/* harmony export */   "neighborhood": () => (/* binding */ neighborhood),
/* harmony export */   "toImageData": () => (/* binding */ toImageData),
/* harmony export */   "trimBorder": () => (/* binding */ trimBorder),
/* harmony export */   "convolution": () => (/* binding */ convolution)
/* harmony export */ });
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./util */ "./util.ts");

/**
 * Construct a matrix from a generator function.
 */
function fromFunc(m, n, func) {
    var matrix = [];
    for (var i = 0; i < m; i++) {
        matrix.push([]);
        for (var j = 0; j < n; j++) {
            matrix[i].push(func(i, j));
        }
    }
    return matrix;
}
/**
 * Construct n by m matrix of zeros.
 */
function zeros(m, n) {
    return fromFunc(m, n, function () {
        return 0;
    });
}
/**
 * Traverse the in-bounds neighborhood of given position, including itself.
 * Call func(val, r, c) for each neighbor.
 */
function neighborhood(M, i, j, func) {
    var m = M.length, n = M[0].length;
    for (var r = (0,_util__WEBPACK_IMPORTED_MODULE_0__.clamp)(i - 1, 0); r <= (0,_util__WEBPACK_IMPORTED_MODULE_0__.clamp)(i + 1, 0, m - 1); r++)
        for (var c = (0,_util__WEBPACK_IMPORTED_MODULE_0__.clamp)(j - 1, 0); c <= (0,_util__WEBPACK_IMPORTED_MODULE_0__.clamp)(j + 1, 0, n - 1); c++)
            func(M[r][c], r, c);
}
/**
 * Create an ImageData object from a grayscale matrix, with a given optional
 * original ImageData from which the matrix was created (to recover alpha
 * values).
 */
function toImageData(M, originalData) {
    var m = M.length, n = M[0].length, newData = new ImageData(new Uint8ClampedArray(m * n * 4), n, m);
    for (var i = 0; i < m * n; i++) {
        var r = Math.floor(i / n), c = i % n;
        // r, g, b values
        newData.data[4 * i] = newData.data[4 * i + 1] = newData.data[4 * i + 2] =
            M[r][c];
        // set alpha channel if originalData is given.
        newData.data[4 * i + 3] = originalData ? originalData.data[4 * i + 3] : 255;
    }
    return newData;
}
/**
 * Trim l columns from left, r columns from right, t rows from top, and b rows
 * from bottom of M and return as a new matrix. Does not modify M.
 */
function trimBorder(M, l, r, t, b) {
    var ret = [];
    M.slice(t, M.length - b).forEach((row) => {
        ret.push(row.slice(l, row.length - r));
    });
    return ret;
}
/**
 * Apply discrete convolution with given pxq mask to the given matrix, where p
 * and q are odd, and a matrix is an array of arrays of numbers. Return a new
 * matrix of slightly smaller size, where each element is the output of the
 * mask operator centered at that point and edges are trimmed where the
 * operator could not be applied, clamped to lb and ub if provided and rounded
 * to the nearest integer.
 */
function convolution(kernel, matrix, lb, ub) {
    var p = kernel.length, q = kernel[0].length, m = matrix.length, n = matrix[0].length, rY = (p - 1) / 2, rX = (q - 1) / 2;
    return trimBorder(fromFunc(m, n, function (i, j) {
        if (i < rY || i >= m - rY || j < rX || j >= n - rX)
            // can't apply the operator too close to the boundaries
            return 0;
        var sum = 0;
        for (var a = -rY; a <= rY; a++)
            for (var b = -rX; b <= rX; b++)
                sum += kernel[a + rY][b + rX] * matrix[i + a][j + b];
        return (0,_util__WEBPACK_IMPORTED_MODULE_0__.clamp)(Math.round(sum), lb, ub);
    }), rX, rX, rY, rY);
}


/***/ }),

/***/ "./util.ts":
/*!*****************!*\
  !*** ./util.ts ***!
  \*****************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "clamp": () => (/* binding */ clamp),
/* harmony export */   "getPixel": () => (/* binding */ getPixel),
/* harmony export */   "grayScale": () => (/* binding */ grayScale),
/* harmony export */   "toMatrix": () => (/* binding */ toMatrix)
/* harmony export */ });
/* harmony import */ var _matrix__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./matrix */ "./matrix.ts");

/**
 * Clamp num to the range [lo,hi].
 */
function clamp(num, lo, hi) {
    lo = lo === undefined ? -Infinity : lo;
    hi = hi === undefined ? Infinity : hi;
    if (num < lo) {
        return lo;
    }
    else if (num > hi) {
        return hi;
    }
    else {
        return num;
    }
}
/**
 * Get the rgba value of pixel i in given image data.
 * If i is out of bounds, then return (0,0,0,0).
 */
function getPixel(imageData, i) {
    return i < imageData.data.length
        ? {
            r: imageData.data[i],
            g: imageData.data[i + 1],
            b: imageData.data[i + 2],
            a: imageData.data[i + 3],
        }
        : { r: 0, g: 0, b: 0, a: 0 };
}
/**
 * Return the grayscale value of given rgb pixel.
 */
function grayScale(pixel) {
    return 0.3 * pixel.r + 0.59 * pixel.g + 0.11 * pixel.b;
}
/**
 * Turn imageData into a two-dimensional width x height matrix of [0, 255]
 * integers of grayscale values of each pixel.
 */
function toMatrix(imageData) {
    return (0,_matrix__WEBPACK_IMPORTED_MODULE_0__.fromFunc)(imageData.height, imageData.width, function (r, c) {
        return grayScale(getPixel(imageData, 4 * (r * imageData.width + c)));
    });
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./demo/main.ts ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _canvas__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../canvas */ "./canvas.ts");
/* harmony import */ var _filters__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../filters */ "./filters.ts");
/* harmony import */ var _matrix__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../matrix */ "./matrix.ts");
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../util */ "./util.ts");




var originalData, // original image data
currentMatrix, // current grayscale matrix displayed
currentSobel, // last result of sobel mask
currentToon, // currently animating autotoon
matrixStack = [], // stack of previous states for undo function
// keep canvas from stretching too big
limit = Math.max(screen.height, screen.width), c = (0,_canvas__WEBPACK_IMPORTED_MODULE_0__.default)('demoCanvas', limit, limit, 2000000), 
// matrix traversal orders
iterators = {
    top: function (M, cb) {
        for (var i = 0; i < M.length; i++)
            for (var j = 0; j < M[0].length; j++)
                cb(i, j);
    },
    bottom: function (M, cb) {
        for (var i = M.length - 1; i >= 0; i--)
            for (var j = 0; j < M[0].length; j++)
                cb(i, j);
    },
    left: function (M, cb) {
        for (var j = 0; j < M[0].length; j++)
            for (var i = 0; i < M.length; i++)
                cb(i, j);
    },
    right: function (M, cb) {
        for (var j = M[0].length - 1; j >= 0; j--)
            for (var i = 0; i < M.length; i++)
                cb(i, j);
    },
};
// Reload the canvas with current matrix data and stop any animation.
function reload() {
    function update() {
        c.reloadCanvas((0,_matrix__WEBPACK_IMPORTED_MODULE_2__.toImageData)(currentMatrix, originalData));
    }
    if (currentToon) {
        currentToon.stop(update);
        currentToon = null;
    }
    else {
        update();
    }
}
// Set our global variables from what is on the canvas.
function setFields() {
    matrixStack = [];
    originalData = c.getImageData();
    currentMatrix = (0,_util__WEBPACK_IMPORTED_MODULE_3__.toMatrix)(originalData);
}
document.querySelector('#submit').addEventListener('click', function () {
    var fileElement = document.querySelector('#file'), urlElement = document.querySelector('#url');
    if (fileElement.files[0] !== undefined) {
        var reader = new FileReader();
        reader.onload = function (e) {
            c.loadImage(e.target.result.toString(), true, setFields);
        };
        reader.readAsDataURL(fileElement.files[0]);
    }
    else {
        c.loadImage(urlElement.value, false, setFields);
    }
});
document.querySelector('#auto').addEventListener('click', function () {
    // Canny edge detection method
    matrixStack.push(currentMatrix);
    currentMatrix = (0,_filters__WEBPACK_IMPORTED_MODULE_1__.gaussianMask)(currentMatrix, 3, 1.0);
    currentSobel = (0,_filters__WEBPACK_IMPORTED_MODULE_1__.sobelMask)(currentMatrix);
    currentMatrix = currentSobel.S;
    currentMatrix = (0,_filters__WEBPACK_IMPORTED_MODULE_1__.nonMaxSuppression)(currentSobel.S, currentSobel.G);
    currentMatrix = (0,_filters__WEBPACK_IMPORTED_MODULE_1__.hysteresis)(currentMatrix, 0.2, 0.5);
    currentMatrix = (0,_filters__WEBPACK_IMPORTED_MODULE_1__.inverted)(currentMatrix);
    reload();
});
document.querySelector('#blur').addEventListener('click', function () {
    matrixStack.push(currentMatrix);
    var radius = parseInt(document.querySelector('#blur_radius').value), sigma = parseFloat(document.querySelector('#blur_sigma').value);
    currentMatrix = (0,_filters__WEBPACK_IMPORTED_MODULE_1__.gaussianMask)(currentMatrix, radius, sigma);
    reload();
});
document.querySelector('#sharpen').addEventListener('click', function () {
    matrixStack.push(currentMatrix);
    currentMatrix = (0,_filters__WEBPACK_IMPORTED_MODULE_1__.sharpenMask)(currentMatrix);
    reload();
});
document.querySelector('#sobel').addEventListener('click', function () {
    matrixStack.push(currentMatrix);
    currentSobel = (0,_filters__WEBPACK_IMPORTED_MODULE_1__.sobelMask)(currentMatrix);
    currentMatrix = currentSobel.S;
    reload();
});
document.querySelector('#laplace').addEventListener('click', function () {
    matrixStack.push(currentMatrix);
    currentMatrix = (0,_filters__WEBPACK_IMPORTED_MODULE_1__.laplaceMask)(currentMatrix);
    reload();
});
document.querySelector('#nonmax').addEventListener('click', function () {
    matrixStack.push(currentMatrix);
    currentMatrix = (0,_filters__WEBPACK_IMPORTED_MODULE_1__.nonMaxSuppression)(currentSobel.S, currentSobel.G);
    reload();
});
document.querySelector('#hysteresis').addEventListener('click', function () {
    matrixStack.push(currentMatrix);
    var high = parseFloat(document.querySelector('#hys_hi').value), low = parseFloat(document.querySelector('#hys_lo').value);
    currentMatrix = (0,_filters__WEBPACK_IMPORTED_MODULE_1__.hysteresis)(currentMatrix, (0,_util__WEBPACK_IMPORTED_MODULE_3__.clamp)(high, 0, 1), (0,_util__WEBPACK_IMPORTED_MODULE_3__.clamp)(low, 0, 1));
    reload();
});
document.querySelector('#invert').addEventListener('click', function () {
    matrixStack.push(currentMatrix);
    currentMatrix = (0,_filters__WEBPACK_IMPORTED_MODULE_1__.inverted)(currentMatrix);
    reload();
});
document.querySelector('#autotoon').addEventListener('click', function () {
    matrixStack.push(currentMatrix);
    var speed = parseFloat(document.querySelector('#toon_speed').value), direction = document.querySelector('#toon_dir').value, sort = document.querySelector('#toon_sort').value, bgColor = parseInt(document.querySelector('#toon_bg').value), M = currentMatrix, n = M[0].length, m = M.length, cartesianDistance = function (r1, c1, r2, c2) {
        return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(c1 - c2, 2));
    }, 
    // Number of rows the edge spans
    ySpan = function (edge) {
        var yMin = Infinity, yMax = -Infinity;
        edge.forEach(function (elem) {
            var r = elem / n;
            yMin = Math.min(yMin, r);
            yMax = Math.max(yMax, r);
        });
        console.log(yMax, yMin);
        return yMax - yMin;
    }, 
    // Number of cols the edge spans
    xSpan = function (edge) {
        var xMin = Infinity, xMax = -Infinity;
        edge.forEach(function (elem) {
            var c = elem % n;
            xMin = Math.min(xMin, c);
            xMax = Math.max(xMax, c);
        });
        console.log(xMax, xMin);
        return xMax - xMin;
    }, transform = (function () {
        function longest(edges) {
            edges.sort(function (e1, e2) {
                return e2.length - e1.length;
            });
        }
        function random(edges) {
            // Fisher-Yates shuffle, description on Wikipedia.
            for (var i = 0; i < edges.length - 1; i++) {
                var j = Math.floor(Math.random() * (edges.length - i)) + i, temp = edges[i];
                edges[i] = edges[j];
                edges[j] = temp;
            }
        }
        function darkest(edges) {
            edges.sort(function (e1, e2) {
                var s1 = 0, s2 = 0;
                e1.forEach(function (elem) {
                    s1 += Math.abs(bgColor - M[Math.floor(elem / n)][elem % n]);
                });
                e2.forEach(function (elem) {
                    s2 += Math.abs(bgColor - M[Math.floor(elem / n)][elem % n]);
                });
                return s2 / e2.length - s1 / e1.length;
            });
        }
        function center(edges) {
            edges.sort(function (e1, e2) {
                var c1 = 0, c2 = 0;
                e1.forEach(function (elem) {
                    c1 += cartesianDistance(m / 2, n / 2, elem / n, elem % n);
                });
                e2.forEach(function (elem) {
                    c2 += cartesianDistance(m / 2, n / 2, elem / n, elem % n);
                });
                return c1 / e1.length - c2 / e2.length;
            });
        }
        function widest(edges) {
            // We sort by the span of the edge: the x-range + y-range
            edges.sort(function (e1, e2) {
                return (cartesianDistance(ySpan(e2), xSpan(e2), 0, 0) -
                    cartesianDistance(ySpan(e1), xSpan(e1), 0, 0));
            });
        }
        // now we select one of these functions and return it
        return { longest, random, darkest, center, widest }[sort];
    })(), update = function () {
        currentToon = c.autoToon(currentMatrix, speed, bgColor, iterators[direction], transform);
    };
    if (currentToon) {
        currentToon.stop(update);
    }
    else {
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
    currentMatrix = (0,_util__WEBPACK_IMPORTED_MODULE_3__.toMatrix)(originalData);
    document.querySelector('#file').value = ''; // remove selected file
});
document.querySelector('#save').addEventListener('click', function () {
    window.location.href = c.getElem().toDataURL('image/png');
});
document.querySelector('#share').addEventListener('click', function () {
    var src = encodeURI(c.getImage().src), loc = window.location.href, query = loc.indexOf('?'), url = loc.slice(0, query > 0 ? query : loc.length) + '?src=' + src, textArea = document.querySelector('#sharetext');
    if (src.length > 2000) {
        alert('Too long. Try submitting file by URL, then sharing.');
    }
    else {
        textArea.value = url;
        textArea.style.display = 'block';
    }
});
// if src param is given, try to load canvas from that
window.location.search
    .slice(1)
    .split('&')
    .forEach(function (param) {
    if (!param)
        return;
    var split = param.split('='), key = split[0], val = decodeURI(split[1]);
    if (key === 'src')
        c.loadImage(val, val.indexOf('data:image/') !== -1, function () {
            setFields();
            if (window.location.hash === '#auto') {
                document.querySelector('#auto').click();
                document.querySelector('#autotoon').click();
            }
        });
});
// TODO resize the image to fit canvas, make max size e.g. 1MP or size of viewport
// TODO simplify the page, reduce the # of buttons and instead make sliders such as
// Maybe add a loading spinner as well, and a way to save video?
// edge trimming (hysteresis), edge sharpness (sharpening)

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVtby5idW5kbGUuanMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jYW52YXMudHMiLCJ3ZWJwYWNrOi8vLy4vZmlsdGVycy50cyIsIndlYnBhY2s6Ly8vLi9tYXRyaXgudHMiLCJ3ZWJwYWNrOi8vLy4vdXRpbC50cyIsIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly8vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly8vd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly8vLi9kZW1vL21haW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZnJvbUZ1bmMsIE1hdCwgbmVpZ2hib3Job29kLCB0b0ltYWdlRGF0YSB9IGZyb20gJy4vbWF0cml4JztcbmltcG9ydCB7IGNsYW1wIH0gZnJvbSAnLi91dGlsJztcblxuZXhwb3J0IHR5cGUgQ2FudmFzVHlwZSA9IHtcbiAgICAvLyBleHBvcnRlZCBmdW5jdGlvbnMgb24gQ2FudmFzIG9iamVjdHNcbiAgICBsb2FkSW1hZ2U6IChpbWdTb3VyY2U6IHN0cmluZywgaXNEYXRhVVJJOiBib29sZWFuLCBjYWxsYmFjazogKCkgPT4gdm9pZCkgPT4gdm9pZDtcbiAgICBnZXRJbWFnZTogKCkgPT4gSFRNTEltYWdlRWxlbWVudDtcbiAgICBnZXRJbWFnZURhdGE6ICgpID0+IEltYWdlRGF0YTtcbiAgICByZWxvYWRDYW52YXM6IChkYXRhOiBJbWFnZURhdGEpID0+IHZvaWQ7XG4gICAgZ2V0Q29udGV4dDogKCkgPT4gQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xuICAgIGdldEVsZW06ICgpID0+IEhUTUxDYW52YXNFbGVtZW50O1xuICAgIGF1dG9Ub29uOiAoXG4gICAgICAgIE06IE1hdCxcbiAgICAgICAgc3BlZWQ6IG51bWJlcixcbiAgICAgICAgYmdDb2xvcjogbnVtYmVyLFxuICAgICAgICBtYXRyaXhJdGVyOiAoYXJnMDogTWF0LCBhcmcxOiAoaTogbnVtYmVyLCBqOiBudW1iZXIpID0+IHZvaWQpID0+IHZvaWQsXG4gICAgICAgIHRyYW5zZm9ybTogKGFyZzA6IG51bWJlcltdW10pID0+IHZvaWQsXG4gICAgICAgIG9uQ29tcGxldGU/OiAoKSA9PiB2b2lkXG4gICAgKSA9PiB7IHN0b3A6IChvblN0b3A6ICgpID0+IHZvaWQpID0+IHZvaWQgfTtcbn07XG4vKipcbiAqIFdyYXAgYSBjYW52YXMgb2JqZWN0IHdpdGggZ2l2ZW4gSUQgYW5kIG1heGltdW0gcGFyYW1ldGVycy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gQ2FudmFzKFxuICAgIGlkOiBzdHJpbmcsXG4gICAgbWF4V2lkdGg6IG51bWJlcixcbiAgICBtYXhIZWlnaHQ6IG51bWJlcixcbiAgICBtYXhQaXhlbHM6IG51bWJlclxuKTogQ2FudmFzVHlwZSB7XG4gICAgdmFyIGVsZW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkgYXMgSFRNTENhbnZhc0VsZW1lbnQsIC8vIGNhbnZhcyBlbGVtZW50XG4gICAgICAgIGN0eCA9IGVsZW0uZ2V0Q29udGV4dCgnMmQnKSwgLy8gZHJhd2luZyBjb250ZXh0XG4gICAgICAgIGltYWdlOiBIVE1MSW1hZ2VFbGVtZW50ID0gbnVsbDsgLy8gSW1hZ2Ugb2JqZWN0XG5cbiAgICAvKipcbiAgICAgKiBMb2FkIGdpdmVuIGltYWdlIG9udG8gdGhlIGNhbnZhcywgcmVwbGFjaW5nIGFueSBleGlzdGluZyBjb250ZW50LFxuICAgICAqIGFuZCByZXNpemUgdGhlIGNhbnZhcyB0byBmaXQgdGhlIHBpY3R1cmUuXG4gICAgICogQ2FsbCBjYWxsYmFjayBvbmNlIHRoZSBpbWFnZSBpcyBsb2FkZWQuXG4gICAgICovXG4gICAgZnVuY3Rpb24gbG9hZEltYWdlKGltZ1NvdXJjZTogc3RyaW5nLCBpc0RhdGFVUkk6IGJvb2xlYW4sIGNhbGxiYWNrOiAoKSA9PiB2b2lkKSB7XG4gICAgICAgIGZ1bmN0aW9uIGhhbmRsZXIoKSB7XG4gICAgICAgICAgICAvLyBkb3duc2NhbGUgZmFjdG9yIGltYWdlIHRvIG1heFdpZHRoIG9yIG1heEhlaWdodCBpZiBpdCdzIHRvbyBiaWdcbiAgICAgICAgICAgIHZhciBzY2FsaW5nID0gY2xhbXAoXG4gICAgICAgICAgICAgICAgMSAvIE1hdGgubWF4KGltYWdlLndpZHRoIC8gbWF4V2lkdGgsIGltYWdlLmhlaWdodCAvIG1heEhlaWdodCksXG4gICAgICAgICAgICAgICAgMC4wLFxuICAgICAgICAgICAgICAgIDEuMFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGVsZW0ud2lkdGggPSBNYXRoLmZsb29yKHNjYWxpbmcgKiBpbWFnZS53aWR0aCk7XG4gICAgICAgICAgICBlbGVtLmhlaWdodCA9IE1hdGguZmxvb3Ioc2NhbGluZyAqIGltYWdlLmhlaWdodCk7XG4gICAgICAgICAgICBjb25zdCBzaXplID0gZWxlbS53aWR0aCAqIGVsZW0uaGVpZ2h0O1xuICAgICAgICAgICAgaWYgKHNpemUgPiBtYXhQaXhlbHMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXhTY2FsZSA9IE1hdGguc3FydChzaXplIC8gbWF4UGl4ZWxzKTtcbiAgICAgICAgICAgICAgICBlbGVtLndpZHRoID0gTWF0aC5mbG9vcihlbGVtLndpZHRoIC8gbWF4U2NhbGUpO1xuICAgICAgICAgICAgICAgIGVsZW0uaGVpZ2h0ID0gTWF0aC5mbG9vcihlbGVtLmhlaWdodCAvIG1heFNjYWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UoaW1hZ2UsIDAsIDAsIGVsZW0ud2lkdGgsIGVsZW0uaGVpZ2h0KTtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgICAgICBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgICAgICBpbWFnZS5vbmxvYWQgPSBoYW5kbGVyO1xuICAgICAgICAvLyBmb3Igc29tZSByZWFzb24gc2V0dGluZyB0aGlzIHdoZW4gdGhlIHNyYyBpcyBhY3R1YWxseSBub3RcbiAgICAgICAgLy8gY3Jvc3Mtb3JpZ2luIGNhdXNlcyBmaXJlZm94IHRvIG5vdCBmaXJlIHRoZSBvbmxvYWQgaGFuZGxlclxuICAgICAgICBpZiAoIWlzRGF0YVVSSSlcbiAgICAgICAgICAgIC8vIGFsbG93IGNyb3NzLW9yaWdpbiByZXF1ZXN0cyBmb3Igc3VwcG9ydGVkIHNlcnZlcnNcbiAgICAgICAgICAgIGltYWdlLmNyb3NzT3JpZ2luID0gJ0Fub255bW91cyc7XG4gICAgICAgIGltYWdlLnNyYyA9IGltZ1NvdXJjZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWxvYWQgdGhlIGNhbnZhcyB3aXRoIGdpdmVuIEltYWdlRGF0YS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiByZWxvYWRDYW52YXMoZGF0YTogSW1hZ2VEYXRhKSB7XG4gICAgICAgIGVsZW0ud2lkdGggPSBkYXRhLndpZHRoO1xuICAgICAgICBlbGVtLmhlaWdodCA9IGRhdGEuaGVpZ2h0O1xuICAgICAgICBjdHgucHV0SW1hZ2VEYXRhKGRhdGEsIDAsIDApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiB0aGUgaW1hZ2UgZGF0YSBvZiB0aGUgY3VycmVudGx5IGRyYXduIGNvbnRleHQuXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0SW1hZ2VEYXRhKCkge1xuICAgICAgICByZXR1cm4gY3R4LmdldEltYWdlRGF0YSgwLCAwLCBlbGVtLndpZHRoLCBlbGVtLmhlaWdodCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRoZSBjdXJyZW50bHkgZGlzcGxheWVkIEltYWdlIG9iamVjdC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRJbWFnZSgpIHtcbiAgICAgICAgcmV0dXJuIGltYWdlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiB0aGUgY3VycmVudCBjYW52YXMgMkQgY29udGV4dC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRDb250ZXh0KCkge1xuICAgICAgICByZXR1cm4gY3R4O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiB0aGUgY3VycmVudCBjYW52YXMgRE9NIGVsZW1lbnQuXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0RWxlbSgpIHtcbiAgICAgICAgcmV0dXJuIGVsZW07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQW5pbWF0ZSB0aGUgZHJhd2luZyBvZiB0aGUgZWRnZXMgb2YgTSwgd2l0aCBzcGVlZCBnaXZlbiBpbiBwaXhlbHMgLyBtcyxcbiAgICAgKiBiZ0NvbG9yIGRlZmluaW5nIHRoZSBncmF5c2NhbGUgdmFsdWUgb2YgdGhlIGJhY2tncm91bmQgKGVpdGhlciAwIG9yXG4gICAgICogMjU1KSwgYW5kIG1hdHJpeEl0ZXIgYmVpbmcgYSBmdW5jdGlvbiB3aGljaCB0YWtlcyBwYXJhbWV0ZXJzIE0gYW5kXG4gICAgICogY2FsbGJhY2soaSxqKSBhbmQgaXRlcmF0ZXMgb3ZlciBlYWNoIGVsZW1lbnQgb2YgTSBpbiBzb21lIG9yZGVyLCBjYWxsaW5nXG4gICAgICogY2FsbGJhY2sgYXQgZWFjaCBlbGVtZW50LCBhbmQgdHJhbnNmb3JtKGVkZ2VzKSBvcHRpb25hbGx5IHByb3ZpZGVzIGFcbiAgICAgKiBmdW5jdGlvbiB0byByZS1vcmRlciBvciBvdGhlcndpc2UgbW9kaWZ5IHRoZSBsaXN0IG9mIGVkZ2VzIGZvdW5kIGFuZCBpc1xuICAgICAqIGNhbGxlZCBiZWZvcmUgYW5pbWF0aW9uIGJlZ2lucy4gUmV0dXJuIGFuIG9iamVjdCB0aGF0IGNvbnRhaW5zIGFcbiAgICAgKiBmdW5jdGlvbiAuc3RvcChjYikgd2hpY2ggc3RvcHMgdGhlIGFuaW1hdGlvbiBhbmQgY2FsbHMgY2Igb24gdGhlIG5leHRcbiAgICAgKiBmcmFtZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBhdXRvVG9vbihcbiAgICAgICAgTTogTWF0LFxuICAgICAgICBzcGVlZDogbnVtYmVyLFxuICAgICAgICBiZ0NvbG9yOiBudW1iZXIsXG4gICAgICAgIG1hdHJpeEl0ZXI6IChhcmcwOiBNYXQsIGFyZzE6IChpOiBudW1iZXIsIGo6IG51bWJlcikgPT4gdm9pZCkgPT4gdm9pZCxcbiAgICAgICAgdHJhbnNmb3JtOiAoYXJnMDogbnVtYmVyW11bXSkgPT4gdm9pZCxcbiAgICAgICAgb25Db21wbGV0ZT86ICgpID0+IHZvaWRcbiAgICApIHtcbiAgICAgICAgdmFyIG0gPSBNLmxlbmd0aCxcbiAgICAgICAgICAgIG4gPSBNWzBdLmxlbmd0aCxcbiAgICAgICAgICAgIGdyb3VwZWRQaXhlbHM6IHsgW3BpeGVsOiBudW1iZXJdOiBib29sZWFuIH0gPSB7fSxcbiAgICAgICAgICAgIGdyb3VwczogbnVtYmVyW11bXSA9IFtdLFxuICAgICAgICAgICAgc3RvcENhbGxiYWNrOiAoKSA9PiB2b2lkID0gbnVsbCxcbiAgICAgICAgICAgIG51bSA9IDAsIC8vIGN1cnJlbnQgaW5kZXggaW4gZ3JvdXBzXG4gICAgICAgICAgICBpZHggPSAwLCAvLyBjdXJyZW50IGluZGV4IGluIGdyb3Vwc1tudW1dXG4gICAgICAgICAgICAvLyB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgYW5pbWF0aW9uLCBpbml0aWFsbHkgYWxsIGJhY2tncm91bmRcbiAgICAgICAgICAgIGdsb2JhbG1hdCA9IGZyb21GdW5jKG0sIG4sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYmdDb2xvcjtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbGFzdFRpbWU6IG51bWJlciwgLy8gdGhlIGxhc3QgdGltZSBhdCB3aGljaCB3ZSBkcmV3IGFueSBwaXhlbHNcbiAgICAgICAgICAgIGRvbmUgPSBmYWxzZTsgLy8gaXMgdGhlIGFuaW1hdGlvbiBjb21wbGV0ZT9cblxuICAgICAgICAvLyBUcmFjZSB0aGUgZWRnZSB0aGF0IGNvbnRhaW5zIHN0YXJ0IGFuZCByZXR1cm4gaXRzIHBvc2l0aW9ucy5cbiAgICAgICAgZnVuY3Rpb24gdHJhY2VFZGdlKHN0YXJ0OiBudW1iZXIpIHtcbiAgICAgICAgICAgIHZhciB0cmFjZSA9IFtdLFxuICAgICAgICAgICAgICAgIHN0YWNrID0gW3N0YXJ0XTtcbiAgICAgICAgICAgIGdyb3VwZWRQaXhlbHNbc3RhcnRdID0gdHJ1ZTtcbiAgICAgICAgICAgIHdoaWxlIChzdGFjay5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIHYgPSBzdGFjay5wb3AoKTtcbiAgICAgICAgICAgICAgICB0cmFjZS5wdXNoKHYpO1xuICAgICAgICAgICAgICAgIG5laWdoYm9yaG9vZChNLCBNYXRoLmZsb29yKHYgLyBuKSwgdiAlIG4sIGZ1bmN0aW9uICh2YWwsIHIsIGMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogb3JkZXIgbmVpZ2hib3JzIC0tIGl0IHdvdWxkIGJlIGJldHRlciB0byB0cnkgdG9cbiAgICAgICAgICAgICAgICAgICAgLy8gY29udGludWUgZWRnZXMgaW4gdGhlIHNhbWUgZGlyZWN0aW9uIGlmIHBvc3NpYmxlXG4gICAgICAgICAgICAgICAgICAgIHZhciBwb3MgPSByICogbiArIGM7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWwgIT09IGJnQ29sb3IgJiYgZ3JvdXBlZFBpeGVsc1twb3NdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2gocG9zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwZWRQaXhlbHNbcG9zXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cmFjZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFBhcnRpdGlvbiB0aGUgaW1hZ2UgaW50byBlZGdlcyBpbiBzb21lIHRyYXZlcnNhbCBvcmRlclxuICAgICAgICBtYXRyaXhJdGVyKE0sIGZ1bmN0aW9uIChpLCBqKSB7XG4gICAgICAgICAgICB2YXIgcG9zID0gaSAqIG4gKyBqO1xuICAgICAgICAgICAgaWYgKE1baV1bal0gIT09IGJnQ29sb3IgJiYgZ3JvdXBlZFBpeGVsc1twb3NdID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICAgZ3JvdXBzLnB1c2godHJhY2VFZGdlKHBvcykpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRyYW5zZm9ybSkgdHJhbnNmb3JtKGdyb3Vwcyk7XG5cbiAgICAgICAgLy8gQmVmb3JlIHdlIGJlZ2luIGRyYXdpbmcsIHdlIGZpcnN0IGNsZWFyIHRoZSBjYW52YXMuXG4gICAgICAgIHJlbG9hZENhbnZhcyh0b0ltYWdlRGF0YShnbG9iYWxtYXQpKTtcblxuICAgICAgICAvLyBEcmF3IG5leHQgdG9EcmF3IHBpeGVscywgcmV0dXJuIHdoZXRoZXIgd2UgaGF2ZSByZWFjaGVkIHRoZSBlbmQuXG4gICAgICAgIGZ1bmN0aW9uIGRyYXdQaXhlbHModG9EcmF3OiBudW1iZXIpOiBib29sZWFuIHtcbiAgICAgICAgICAgIGlmICh0b0RyYXcgPT09IDApIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIHZhciBiZWdpbiA9IGlkeCxcbiAgICAgICAgICAgICAgICBlbmQgPSBNYXRoLm1pbihncm91cHNbbnVtXS5sZW5ndGgsIGJlZ2luICsgdG9EcmF3KSxcbiAgICAgICAgICAgICAgICBtaW5SID0gSW5maW5pdHksXG4gICAgICAgICAgICAgICAgbWF4UiA9IC1JbmZpbml0eSxcbiAgICAgICAgICAgICAgICBtaW5DID0gSW5maW5pdHksXG4gICAgICAgICAgICAgICAgbWF4QyA9IC1JbmZpbml0eSxcbiAgICAgICAgICAgICAgICBsZWZ0b3ZlciA9IHRvRHJhdyAtIChlbmQgLSBiZWdpbik7XG4gICAgICAgICAgICAvKiBFeHBsYW5hdGlvbjogY29sbGVjdCB0aGUgbmV4dCBjaHVuayBvZiBwaXhlbHMgaW50byBhIHN1Ym1hdHJpeFxuICAgICAgICAgICAgICogYW5kIHRoZW4gY2FsbCBwdXRJbWFnZURhdGEgdG8gdGhlIHRvcCBsZWZ0IGNvcm5lci4gVG8gbWFrZSBzdXJlXG4gICAgICAgICAgICAgKiB3ZSBkb24ndCBvdmVyd3JpdGUgcHJldmlvdXMgZWRnZXMsIHdlIGluaXRpYWxpemUgc3VibWF0cml4IGZyb21cbiAgICAgICAgICAgICAqIGdsb2JhbG1hdHJpeC4gRG9pbmcgdGhpcyBsZXRzIHRoZSBicm93c2VyIGFuaW1hdGUgYXQgYSBnb29kXG4gICAgICAgICAgICAgKiBzcGVlZCAoYXMgb3Bwb3NlZCB0byBkcmF3aW5nIG9uZSBwaXhlbCBhdCBhIHRpbWUpLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAvLyBGaXJzdCBpbml0aWFsaXplIHRoZSBib3VuZHMgb24gdGhpcyBjaHVua1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IGJlZ2luOyBpIDwgZW5kOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgciA9IE1hdGguZmxvb3IoZ3JvdXBzW251bV1baV0gLyBuKSxcbiAgICAgICAgICAgICAgICAgICAgYyA9IGdyb3Vwc1tudW1dW2ldICUgbjtcbiAgICAgICAgICAgICAgICBtaW5SID0gTWF0aC5taW4obWluUiwgcik7XG4gICAgICAgICAgICAgICAgbWF4UiA9IE1hdGgubWF4KG1heFIsIHIpO1xuICAgICAgICAgICAgICAgIG1pbkMgPSBNYXRoLm1pbihtaW5DLCBjKTtcbiAgICAgICAgICAgICAgICBtYXhDID0gTWF0aC5tYXgobWF4QywgYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgeVJhbmdlID0gbWF4UiAtIG1pblIgKyAxLFxuICAgICAgICAgICAgICAgIHhSYW5nZSA9IG1heEMgLSBtaW5DICsgMTtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBzdWJtYXRyaXggZnJvbSB0aGUgZ2xvYmFsIG1hdHJpeFxuICAgICAgICAgICAgdmFyIHN1Ym1hdCA9IGZyb21GdW5jKHlSYW5nZSwgeFJhbmdlLCBmdW5jdGlvbiAoaSwgaikge1xuICAgICAgICAgICAgICAgIHJldHVybiBnbG9iYWxtYXRbaSArIG1pblJdW2ogKyBtaW5DXTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gVXBkYXRlIGVudHJpZXMgYmVsb25naW5nIHRvIHBpeGVscyBpbiB0aGlzIGNodW5rXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gYmVnaW47IGkgPCBlbmQ7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciByID0gTWF0aC5mbG9vcihncm91cHNbbnVtXVtpXSAvIG4pLFxuICAgICAgICAgICAgICAgICAgICBjID0gZ3JvdXBzW251bV1baV0gJSBuO1xuICAgICAgICAgICAgICAgIGdsb2JhbG1hdFtyXVtjXSA9IHN1Ym1hdFtyIC0gbWluUl1bYyAtIG1pbkNdID0gTVtyXVtjXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gZHJhdyB0aGlzIHN1Ym1hdHJpeCBpbiB0aGUgcmlnaHQgc3BvdCBvbiB0aGUgY2FudmFzXG4gICAgICAgICAgICBjdHgucHV0SW1hZ2VEYXRhKHRvSW1hZ2VEYXRhKHN1Ym1hdCksIG1pbkMsIG1pblIpO1xuXG4gICAgICAgICAgICAvLyBVcGRhdGUgY291bnRlcnMgYW5kIGRlY2lkZSB3aGV0aGVyIHRvIGNvbnRpbnVlXG4gICAgICAgICAgICBpZHggPSBlbmQ7XG4gICAgICAgICAgICBpZiAoaWR4ID09PSBncm91cHNbbnVtXS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBpZHggPSAwO1xuICAgICAgICAgICAgICAgIG51bSsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG51bSA9PT0gZ3JvdXBzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIG9uQ29tcGxldGUgJiYgb25Db21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRyYXdQaXhlbHMobGVmdG92ZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTWFuYWdlIHRoZSB0aW1pbmdzIGFuZCBjYWxsIGRyYXdQaXhlbHMgYXMgYXBwcm9wcmlhdGUuXG4gICAgICAgIGZ1bmN0aW9uIGFuaW1hdG9yKHQ6IG51bWJlcikge1xuICAgICAgICAgICAgaWYgKHN0b3BDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHN0b3BDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIG9uQ29tcGxldGUgJiYgb25Db21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChsYXN0VGltZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgLy8gRmlyc3QgdGltZSBhbmltYXRvciBpcyBjYWxsZWQsIGp1c3QgcmVjb3JkIHRoZSB0aW1lXG4gICAgICAgICAgICAgICAgbGFzdFRpbWUgPSB0O1xuICAgICAgICAgICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0b3IpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgY2h1bmtTaXplID0gTWF0aC5yb3VuZCgodCAtIGxhc3RUaW1lKSAqIHNwZWVkKTtcbiAgICAgICAgICAgICAgICBpZiAoY2h1bmtTaXplID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBsYXN0VGltZSA9IHQ7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZHJhd1BpeGVscyhjaHVua1NpemUpKSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdG9yKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBXZSBuZWVkIG1vcmUgdGltZSB0byBlbGFwc2UgYmVmb3JlIGRyYXdpbmdcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIFN0b3AgdGhlIGFuaW1hdGlvbiBhbmQgcmVnaXN0ZXIgb25TdG9wIGNhbGxiYWNrLiBJZiBhbmltYXRpb25cbiAgICAgICAgLy8gYWxyZWFkeSBkb25lLCBjYWxsIGl0IGltbWVkaWF0ZWx5LlxuICAgICAgICBmdW5jdGlvbiBzdG9wKG9uU3RvcDogKCkgPT4gdm9pZCkge1xuICAgICAgICAgICAgc3RvcENhbGxiYWNrID0gb25TdG9wIHx8IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICAgICAgaWYgKGRvbmUpIHN0b3BDYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICAgIC8vIEJlZ2luIGFuaW1hdGluZy5cbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRvcik7XG4gICAgICAgIHJldHVybiB7IHN0b3AgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICAvLyBleHBvcnRlZCBmdW5jdGlvbnMgb24gQ2FudmFzIG9iamVjdHNcbiAgICAgICAgbG9hZEltYWdlLFxuICAgICAgICBnZXRJbWFnZSxcbiAgICAgICAgZ2V0SW1hZ2VEYXRhLFxuICAgICAgICByZWxvYWRDYW52YXMsXG4gICAgICAgIGdldENvbnRleHQsXG4gICAgICAgIGdldEVsZW0sXG4gICAgICAgIGF1dG9Ub29uLFxuICAgIH07XG59XG4iLCJpbXBvcnQgeyBjb252b2x1dGlvbiwgZnJvbUZ1bmMsIE1hdCwgbmVpZ2hib3Job29kLCB6ZXJvcyB9IGZyb20gJy4vbWF0cml4JztcbmltcG9ydCB7IGNsYW1wIH0gZnJvbSAnLi91dGlsJztcblxuLyoqXG4gKiBSZXR1cm4gbmV3IG1hdHJpeCB3aGVyZSBlYWNoIGVsZW1lbnQgaXMgMjU1IC0gb2xkIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnZlcnRlZChNOiBNYXQpOiBNYXQge1xuICAgIHJldHVybiBmcm9tRnVuYyhNLmxlbmd0aCwgTVswXS5sZW5ndGgsIGZ1bmN0aW9uIChpLCBqKSB7XG4gICAgICAgIHJldHVybiAyNTUgLSBNW2ldW2pdO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIEFwcGx5IGEgR2F1c3NpYW4gYmx1ciBtYXNrIHRvIHRoZSBpbWFnZSBtYXRyaXggTSB3aXRoIGdpdmVuIHJhZGl1cyBhbmRcbiAqIHNpZ21hLiBSZXR1cm4gdGhlIG5ldywgYmx1cnJlZCBtYXRyaXguXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnYXVzc2lhbk1hc2soTTogTWF0LCByYWRpdXM6IG51bWJlciwgc2lnbWE6IG51bWJlcik6IE1hdCB7XG4gICAgLy8gY29uc3RydWN0IHRoZSBibHVyIGtlcm5lbFxuICAgIHZhciBrID0gMiAqIHJhZGl1cyArIDEsXG4gICAgICAgIG1lYW4gPSBrIC8gMixcbiAgICAgICAgc3VtID0gMCxcbiAgICAgICAga2VybmVsID0gZnJvbUZ1bmMoaywgaywgZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgTWF0aC5leHAoXG4gICAgICAgICAgICAgICAgICAgIC0wLjUgKlxuICAgICAgICAgICAgICAgICAgICAgICAgKE1hdGgucG93KCh4IC0gbWVhbikgLyBzaWdtYSwgMikgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgucG93KCh5IC0gbWVhbikgLyBzaWdtYSwgMikpXG4gICAgICAgICAgICAgICAgKSAvXG4gICAgICAgICAgICAgICAgKDIgKiBNYXRoLlBJICogc2lnbWEgKiBzaWdtYSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuICAgIC8vIGNvbXB1dGUgc3VtXG4gICAgZm9yICh2YXIgeCA9IDA7IHggPCBrOyB4KyspIGZvciAodmFyIHkgPSAwOyB5IDwgazsgeSsrKSBzdW0gKz0ga2VybmVsW3hdW3ldO1xuICAgIC8vIG5vcm1hbGl6ZVxuICAgIGZvciAodmFyIHggPSAwOyB4IDwgazsgeCsrKSBmb3IgKHZhciB5ID0gMDsgeSA8IGs7IHkrKykga2VybmVsW3hdW3ldIC89IHN1bTtcbiAgICByZXR1cm4gY29udm9sdXRpb24oa2VybmVsLCBNLCAwLCAyNTUpO1xufVxuXG4vKipcbiAqIEFwcGx5IGFuIGltYWdlIHNoYXJwZW5pbmcgbWFzayB0byB0aGUgbWF0cml4IE0uIFJldHVybiB0aGUgbmV3IG1hdHJpeC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNoYXJwZW5NYXNrKE06IE1hdCk6IE1hdCB7XG4gICAgcmV0dXJuIGNvbnZvbHV0aW9uKFxuICAgICAgICBbXG4gICAgICAgICAgICBbMCwgLTEsIDBdLFxuICAgICAgICAgICAgWy0xLCA1LCAtMV0sXG4gICAgICAgICAgICBbMCwgLTEsIDBdLFxuICAgICAgICBdLFxuICAgICAgICBNLFxuICAgICAgICAwLFxuICAgICAgICAyNTVcbiAgICApO1xufVxuXG4vKipcbiAqIEludGVycG9sYXRlIHRoZSB2YWx1ZSBvZiB0aGUgbmVpZ2hib3IgYXQgYW5nbGUgcmFkaWFucyBmcm9tIGksIGogaW4gTS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRlTmVpZ2hib3IoXG4gICAgTTogTWF0LFxuICAgIGk6IG51bWJlcixcbiAgICBqOiBudW1iZXIsXG4gICAgYW5nbGU6IG51bWJlclxuKTogbnVtYmVyIHtcbiAgICAvLyBXZSB0cmFuc2Zvcm0gYW5nbGUgZnJvbSBbMCwgMnBpKSB0byBbMCwgOCksIHNvIDEgcmFkaWFuIDogNDUgZGVncmVlc1xuICAgIC8vIHNvIGZsb29yaW5nIHRoaXMgdmFsdWUgZ2l2ZXMgdXMgZGlyZWN0aW9uIG9mIHRoZSBwcmV2aW91cyB2YWx1ZSwgYW5kXG4gICAgLy8gY2VpbC1pbmcgdGhpcyB2YWx1ZSBnaXZlcyB1cyB0aGUgbmV4dCB2YWx1ZSBtb2QgOCBpbiB0aGVcbiAgICAvLyBuZWlnaGJvcmhvb2QgdGhlbiB3ZSBjYW4gaW5kZXggaW50byB0aGUgbmVpZ2hib3Job29kIGJ5IG51bWJlcmluZzpcbiAgICAvLyAzICAgMiAgIDEgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoLTEsLTEpICAoLTEsIDApICAoLTEsIDEpXG4gICAgLy8gNCAgIC0gICAwICAgdGhlbiBkZWZpbmUgdGhlIG1hcHBpbmcgdG8gICAgKDAsIC0xKSAgICAgLSAgICAgKCAwLCAxKVxuICAgIC8vIDUgICA2ICAgNyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICgxLCAtMSkgICggMSwgMCkgICggMSwgMSlcblxuICAgIC8vIEZpbmQgdmFsdWUgb2YgbmVpZ2hib3IgdG8gaSwgaiBpbiBNIGluIG9jdGFudCBvIGluIFswLCA4KVxuICAgIGZ1bmN0aW9uIG9jdGFudFRvTmVpZ2hib3IobzogbnVtYmVyKSB7XG4gICAgICAgIC8vIHJlbWFyayBkeShvKSA9PSBkeChvKzIpOyB0aGlzIG1hcCByZXR1cm5zIHRoZSBkeSB2YWx1ZVxuICAgICAgICB2YXIgbWFwID0gZnVuY3Rpb24gKHg6IG51bWJlcikge1xuICAgICAgICAgICAgc3dpdGNoICh4ICUgOCkge1xuICAgICAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgY2FzZSA1OlxuICAgICAgICAgICAgICAgIGNhc2UgNjpcbiAgICAgICAgICAgICAgICBjYXNlIDc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gTVtpICsgbWFwKG8pXVtqICsgbWFwKG8gKyAyKV07XG4gICAgfVxuICAgIHZhciBvY3RhbnQgPSAoYW5nbGUgKiA0KSAvIE1hdGguUEksXG4gICAgICAgIHJhdGlvID0gb2N0YW50ICUgMSwgLy8gVXNlIGEgdHJpY2sgdG8gZ2V0IGRlY2ltYWwgcGFydCBvZiBvY3RhbnRcbiAgICAgICAgcHJldiA9IG9jdGFudFRvTmVpZ2hib3IoTWF0aC5mbG9vcihvY3RhbnQpKSxcbiAgICAgICAgbmV4dCA9IG9jdGFudFRvTmVpZ2hib3IoTWF0aC5jZWlsKG9jdGFudCkpO1xuICAgIHJldHVybiByYXRpbyAqIHByZXYgKyAoMSAtIHJhdGlvKSAqIG5leHQ7XG59XG5cbi8qKlxuICogQXBwbHkgYSBzb2JlbCBvcGVyYXRvciB0byB0aGUgZ2l2ZW4gZ3JheXNjYWxlIGltYWdlIGRhdGEgbWF0cml4LCBhc3N1bWVkIHRvXG4gKiBiZSBpbiBncmF5c2NhbGUsIGFuZCByZXR1cm4gdGhlIHJlc3VsdCBtYXRyaXggUyBhbmQgZ3JhZGllbnQgbWF0cml4IEcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzb2JlbE1hc2soTTogTWF0KTogeyBTOiBNYXQ7IEc6IE1hdCB9IHtcbiAgICAvLyBncmFkaWVudCBhcHByb3hpbWF0aW9uIG1hc2tzIGZvciB4IGFuZCB5IGRpcmVjdGlvbnNcbiAgICB2YXIgR3ggPSBbXG4gICAgICAgICAgICBbLTEsIDAsIDFdLFxuICAgICAgICAgICAgWy0yLCAwLCAyXSxcbiAgICAgICAgICAgIFstMSwgMCwgMV0sXG4gICAgICAgIF0sXG4gICAgICAgIEd5ID0gW1xuICAgICAgICAgICAgWzEsIDIsIDFdLFxuICAgICAgICAgICAgWzAsIDAsIDBdLFxuICAgICAgICAgICAgWy0xLCAtMiwgLTFdLFxuICAgICAgICBdLFxuICAgICAgICBDeCA9IGNvbnZvbHV0aW9uKEd4LCBNKSxcbiAgICAgICAgQ3kgPSBjb252b2x1dGlvbihHeSwgTSksXG4gICAgICAgIENzdW0gPSBmcm9tRnVuYyhDeC5sZW5ndGgsIEN4WzBdLmxlbmd0aCwgZnVuY3Rpb24gKGksIGopIHtcbiAgICAgICAgICAgIHJldHVybiBjbGFtcChNYXRoLmFicyhDeFtpXVtqXSkgKyBNYXRoLmFicyhDeVtpXVtqXSksIDAsIDI1NSk7XG4gICAgICAgIH0pLFxuICAgICAgICBHID0gZnJvbUZ1bmMoQ3gubGVuZ3RoLCBDeFswXS5sZW5ndGgsIGZ1bmN0aW9uIChpLCBqKSB7XG4gICAgICAgICAgICBpZiAoQ3hbaV1bal0gPT09IDApIHJldHVybiBDeVtpXVtqXSA/IE1hdGguUEkgLyAyIDogMDtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmF0YW4oTWF0aC5hYnMoQ3lbaV1bal0pIC8gTWF0aC5hYnMoQ3hbaV1bal0pKTtcbiAgICAgICAgfSk7XG4gICAgcmV0dXJuIHsgUzogQ3N1bSwgRzogRyB9O1xufVxuXG4vKipcbiAqIEFwcGx5IGEgZGlzY3JldGUgNXg1IExhcGxhY2lhbiBtYXNrIG9uIE0uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsYXBsYWNlTWFzayhNOiBNYXQpOiBNYXQge1xuICAgIHJldHVybiBjb252b2x1dGlvbihcbiAgICAgICAgW1xuICAgICAgICAgICAgWy0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gICAgICAgICAgICBbLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgICAgICAgICAgIFstMSwgLTEsIDI0LCAtMSwgLTFdLFxuICAgICAgICAgICAgWy0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gICAgICAgICAgICBbLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgICAgICAgXSxcbiAgICAgICAgTSxcbiAgICAgICAgMCxcbiAgICAgICAgMjU1XG4gICAgKTtcbn1cblxuLyoqXG4gKiBHaXZlbiBpbWFnZSBtYXRyaXggTSwgZ3JhZGllbnQgbWF0cml4IEcsIGNvbnN0cnVjdCBhIG5ldyBpbWFnZSBtYXRyaXggd2hlcmVcbiAqIGVkZ2UgcG9pbnRzIGx5aW5nIG9uIG5vbi1tYXhpbWFsIGdyYWRpZW50cyBhcmUgc2V0IHRvIDAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub25NYXhTdXBwcmVzc2lvbihNOiBNYXQsIEc6IE1hdCk6IE1hdCB7XG4gICAgcmV0dXJuIGZyb21GdW5jKE0ubGVuZ3RoLCBNWzBdLmxlbmd0aCwgZnVuY3Rpb24gKGksIGopIHtcbiAgICAgICAgLy8gZG9uJ3Qgc3VwcHJlc3MgdGhlIGJvcmRlcnNcbiAgICAgICAgaWYgKGkgPT09IDAgfHwgaiA9PT0gMCB8fCBpID09PSBNLmxlbmd0aCAtIDEgfHwgaiA9PT0gTVswXS5sZW5ndGggLSAxKVxuICAgICAgICAgICAgcmV0dXJuIE1baV1bal07XG4gICAgICAgIC8vIHByZXZpb3VzIGFuZCBuZXh0IHZhbHVlcyBhbG9uZyB0aGUgYXBwcm94aW1hdGVkIGdyYWRpZW50XG4gICAgICAgIHZhciBwcmV2ID0gaW50ZXJwb2xhdGVOZWlnaGJvcihNLCBpLCBqLCBHW2ldW2pdKSxcbiAgICAgICAgICAgIG5leHQgPSBpbnRlcnBvbGF0ZU5laWdoYm9yKE0sIGksIGosIE1hdGguUEkgKyBHW2ldW2pdKTtcbiAgICAgICAgaWYgKE1baV1bal0gPCBwcmV2IHx8IE1baV1bal0gPCBuZXh0KVxuICAgICAgICAgICAgLy8gc3VwcHJlc3MgdG8gMCBzaW5jZSBpdCdzIG5vbi1tYXhpbXVtXG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgcmV0dXJuIE1baV1bal07XG4gICAgfSk7XG59XG5cbi8qKlxuICogRXN0aW1hdGUgdXBwZXIgYW5kIGxvd2VyIGh5c3RlcmVzaXMgdGhyZXNob2xkcywgcmV0dXJuaW5nIHtoaTogbnVtLCBsbzpcbiAqIG51bX0sIHdoZXJlIGhpZ2hfcGVyY2VudGFnZSBpcyB0aGUgcGVyY2VudGFnZSBvZiBwaXhlbHMgdGhhdCB3aWxsIG1lZXRcbiAqIGhpLCBhbmQgbG93X3BlcmNlbnRhZ2UgaXMgdGhlIHJhdGlvIG9mIGxvIHRvIGhpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXN0aW1hdGVUaHJlc2hvbGQoXG4gICAgTTogTWF0LFxuICAgIGhpZ2hfcGVyY2VudGFnZTogbnVtYmVyLFxuICAgIGxvd19wZXJjZW50YWdlOiBudW1iZXJcbikge1xuICAgIHZhciBoaXN0b2dyYW0gPSB6ZXJvcygxLCAyNTYpWzBdLCAvLyBsZW5ndGggMjU2IGFycmF5IG9mIHplcm9zXG4gICAgICAgIG0gPSBNLmxlbmd0aCxcbiAgICAgICAgbiA9IE1bMF0ubGVuZ3RoO1xuICAgIC8vIENvbnN0cnVjdCBoaXN0b2dyYW0gb2YgcGl4ZWwgdmFsdWVzXG4gICAgTS5mb3JFYWNoKChyKSA9PiB7XG4gICAgICAgIHIuZm9yRWFjaCgoZSkgPT4ge1xuICAgICAgICAgICAgaGlzdG9ncmFtW2VdKys7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIC8vIENvbXB1dGUgbnVtYmVyIG9mIHBpeGVscyB3ZSB3YW50IHRvIHRhcmdldC5cbiAgICB2YXIgcGl4ZWxzID0gKG0gKiBuIC0gaGlzdG9ncmFtWzBdKSAqIGhpZ2hfcGVyY2VudGFnZSxcbiAgICAgICAgaGlnaF9jdXRvZmYgPSAwLFxuICAgICAgICBpID0gaGlzdG9ncmFtLmxlbmd0aCxcbiAgICAgICAgaiA9IDE7XG4gICAgd2hpbGUgKGhpZ2hfY3V0b2ZmIDwgcGl4ZWxzKSBoaWdoX2N1dG9mZiArPSBoaXN0b2dyYW1baS0tXTtcbiAgICAvLyBJbmNyZW1lbnQgaiB1cCB0byBmaXJzdCBub24temVybyBmcmVxdWVuY3kgKHNvIHdlIGlnbm9yZSB0aG9zZSkuXG4gICAgd2hpbGUgKGhpc3RvZ3JhbVtqXSA9PT0gMCkgaisrO1xuICAgIGogKz0gaSAqIGxvd19wZXJjZW50YWdlO1xuICAgIC8vIGogPSAoaSAqIGxvd19wZXJjZW50YWdlICsgaikgKiBsb3dfcGVyY2VudGFnZTtcbiAgICByZXR1cm4geyBoaTogaSwgbG86IGogfTtcbn1cblxuLyoqXG4gKiBBcHBseSBoeXN0ZXJlc2lzIHRvIHRyYWNlIGVkZ2VzIHdpdGggZ2l2ZW4gbG93ZXIgYW5kIHVwcGVyIHRocmVzaG9sZHNcbiAqIGFuZCByZXR1cm4gdGhlIHJlc3VsdGluZyBtYXRyaXguIFRoaXMgdGhpbnMgZWRnZXMgYnkgb25seSBrZWVwaW5nIHBvaW50c1xuICogY29ubmVjdGVkIHRvIFwic3Ryb25nXCIgZWRnZXMsIGFzIGRlZmluZWQgYnkgdGhlIHRocmVzaG9sZCBmdW5jdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGh5c3RlcmVzaXMoTTogTWF0LCBoaWdoX3BlcmNlbnRhZ2U6IG51bWJlciwgbG93X3BlcmNlbnRhZ2U6IG51bWJlcikge1xuICAgIHZhciB0aHJlc2hvbGQgPSBlc3RpbWF0ZVRocmVzaG9sZChNLCBoaWdoX3BlcmNlbnRhZ2UsIGxvd19wZXJjZW50YWdlKSxcbiAgICAgICAgbSA9IE0ubGVuZ3RoLFxuICAgICAgICBuID0gTVswXS5sZW5ndGgsXG4gICAgICAgIHJlYWxFZGdlcyA9IHplcm9zKG0sIG4pOyAvLyAwIGlmIG5vdCBjb25uZWN0ZWQgdG8gcmVhbCBlZGdlLCAxIGlmIGlzXG4gICAgLy8gUmV0dXJuIGFycmF5IG9mIG5laWdoYm9ycyBvZiBNW2ldW2pdIHdoZXJlIE1bbl0gPj0gdGhyZXNob2xkLmxvLlxuICAgIGZ1bmN0aW9uIGNvbGxlY3ROZWlnaGJvcnMoaTogbnVtYmVyLCBqOiBudW1iZXIpIHtcbiAgICAgICAgdmFyIHN0YWNrID0gW2kgKiBuICsgal07XG4gICAgICAgIHJlYWxFZGdlc1tpXVtqXSA9IE1baV1bal07XG4gICAgICAgIHdoaWxlIChzdGFjay5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB2YXIgdiA9IHN0YWNrLnBvcCgpO1xuICAgICAgICAgICAgbmVpZ2hib3Job29kKE0sIE1hdGguZmxvb3IodiAvIG4pLCB2ICUgbiwgKHZhbCwgciwgYykgPT4ge1xuICAgICAgICAgICAgICAgIHZhciBwb3MgPSByICogbiArIGM7XG4gICAgICAgICAgICAgICAgaWYgKHZhbCA+PSB0aHJlc2hvbGQubG8gJiYgIXJlYWxFZGdlc1tyXVtjXSkge1xuICAgICAgICAgICAgICAgICAgICByZWFsRWRnZXNbcl1bY10gPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2gocG9zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG07IGkrKykge1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG47IGorKykge1xuICAgICAgICAgICAgLy8gV2UgY29uc2lkZXIgdGhhdCB0aGVzZSBhcmUgXCJzdHJvbmdcIiBwaXhlbHMsIHRoZW4gd2UgdHJhY2VcbiAgICAgICAgICAgIC8vIHRoZSBlZGdlIHRoYXQgdGhleSBhcmUgcGFydCBvZi4gQWxzbyB3ZSBza2lwIGFueSBwaXhlbHMgd2VcbiAgICAgICAgICAgIC8vIGhhdmUgYWxyZWFkeSBtYXJrZWQgYXMgcmVhbFxuICAgICAgICAgICAgaWYgKE1baV1bal0gPj0gdGhyZXNob2xkLmhpICYmICFyZWFsRWRnZXNbaV1bal0pIHtcbiAgICAgICAgICAgICAgICBjb2xsZWN0TmVpZ2hib3JzKGksIGopO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZWFsRWRnZXM7XG59XG4iLCJpbXBvcnQgeyBjbGFtcCB9IGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCB0eXBlIE1hdCA9IG51bWJlcltdW107XG5cbi8qKlxuICogQ29uc3RydWN0IGEgbWF0cml4IGZyb20gYSBnZW5lcmF0b3IgZnVuY3Rpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmcm9tRnVuYyhcbiAgICBtOiBudW1iZXIsXG4gICAgbjogbnVtYmVyLFxuICAgIGZ1bmM6IChpOiBudW1iZXIsIGo6IG51bWJlcikgPT4gbnVtYmVyXG4pOiBNYXQge1xuICAgIHZhciBtYXRyaXggPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG07IGkrKykge1xuICAgICAgICBtYXRyaXgucHVzaChbXSk7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbjsgaisrKSB7XG4gICAgICAgICAgICBtYXRyaXhbaV0ucHVzaChmdW5jKGksIGopKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWF0cml4O1xufVxuXG4vKipcbiAqIENvbnN0cnVjdCBuIGJ5IG0gbWF0cml4IG9mIHplcm9zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gemVyb3MobTogbnVtYmVyLCBuOiBudW1iZXIpOiBNYXQge1xuICAgIHJldHVybiBmcm9tRnVuYyhtLCBuLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIFRyYXZlcnNlIHRoZSBpbi1ib3VuZHMgbmVpZ2hib3Job29kIG9mIGdpdmVuIHBvc2l0aW9uLCBpbmNsdWRpbmcgaXRzZWxmLlxuICogQ2FsbCBmdW5jKHZhbCwgciwgYykgZm9yIGVhY2ggbmVpZ2hib3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuZWlnaGJvcmhvb2QoXG4gICAgTTogTWF0LFxuICAgIGk6IG51bWJlcixcbiAgICBqOiBudW1iZXIsXG4gICAgZnVuYzogKHZhbDogbnVtYmVyLCByOiBudW1iZXIsIGM6IG51bWJlcikgPT4gdm9pZFxuKSB7XG4gICAgdmFyIG0gPSBNLmxlbmd0aCxcbiAgICAgICAgbiA9IE1bMF0ubGVuZ3RoO1xuICAgIGZvciAodmFyIHIgPSBjbGFtcChpIC0gMSwgMCk7IHIgPD0gY2xhbXAoaSArIDEsIDAsIG0gLSAxKTsgcisrKVxuICAgICAgICBmb3IgKHZhciBjID0gY2xhbXAoaiAtIDEsIDApOyBjIDw9IGNsYW1wKGogKyAxLCAwLCBuIC0gMSk7IGMrKylcbiAgICAgICAgICAgIGZ1bmMoTVtyXVtjXSwgciwgYyk7XG59XG5cbi8qKlxuICogQ3JlYXRlIGFuIEltYWdlRGF0YSBvYmplY3QgZnJvbSBhIGdyYXlzY2FsZSBtYXRyaXgsIHdpdGggYSBnaXZlbiBvcHRpb25hbFxuICogb3JpZ2luYWwgSW1hZ2VEYXRhIGZyb20gd2hpY2ggdGhlIG1hdHJpeCB3YXMgY3JlYXRlZCAodG8gcmVjb3ZlciBhbHBoYVxuICogdmFsdWVzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvSW1hZ2VEYXRhKE06IE1hdCwgb3JpZ2luYWxEYXRhPzogSW1hZ2VEYXRhKTogSW1hZ2VEYXRhIHtcbiAgICB2YXIgbSA9IE0ubGVuZ3RoLFxuICAgICAgICBuID0gTVswXS5sZW5ndGgsXG4gICAgICAgIG5ld0RhdGEgPSBuZXcgSW1hZ2VEYXRhKG5ldyBVaW50OENsYW1wZWRBcnJheShtICogbiAqIDQpLCBuLCBtKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG0gKiBuOyBpKyspIHtcbiAgICAgICAgdmFyIHIgPSBNYXRoLmZsb29yKGkgLyBuKSxcbiAgICAgICAgICAgIGMgPSBpICUgbjtcbiAgICAgICAgLy8gciwgZywgYiB2YWx1ZXNcbiAgICAgICAgbmV3RGF0YS5kYXRhWzQgKiBpXSA9IG5ld0RhdGEuZGF0YVs0ICogaSArIDFdID0gbmV3RGF0YS5kYXRhWzQgKiBpICsgMl0gPVxuICAgICAgICAgICAgTVtyXVtjXTtcbiAgICAgICAgLy8gc2V0IGFscGhhIGNoYW5uZWwgaWYgb3JpZ2luYWxEYXRhIGlzIGdpdmVuLlxuICAgICAgICBuZXdEYXRhLmRhdGFbNCAqIGkgKyAzXSA9IG9yaWdpbmFsRGF0YSA/IG9yaWdpbmFsRGF0YS5kYXRhWzQgKiBpICsgM10gOiAyNTU7XG4gICAgfVxuICAgIHJldHVybiBuZXdEYXRhO1xufVxuXG4vKipcbiAqIFRyaW0gbCBjb2x1bW5zIGZyb20gbGVmdCwgciBjb2x1bW5zIGZyb20gcmlnaHQsIHQgcm93cyBmcm9tIHRvcCwgYW5kIGIgcm93c1xuICogZnJvbSBib3R0b20gb2YgTSBhbmQgcmV0dXJuIGFzIGEgbmV3IG1hdHJpeC4gRG9lcyBub3QgbW9kaWZ5IE0uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmltQm9yZGVyKE06IE1hdCwgbDogbnVtYmVyLCByOiBudW1iZXIsIHQ6IG51bWJlciwgYjogbnVtYmVyKTogTWF0IHtcbiAgICB2YXIgcmV0OiBudW1iZXJbXVtdID0gW107XG4gICAgTS5zbGljZSh0LCBNLmxlbmd0aCAtIGIpLmZvckVhY2goKHJvdykgPT4ge1xuICAgICAgICByZXQucHVzaChyb3cuc2xpY2UobCwgcm93Lmxlbmd0aCAtIHIpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmV0O1xufVxuXG4vKipcbiAqIEFwcGx5IGRpc2NyZXRlIGNvbnZvbHV0aW9uIHdpdGggZ2l2ZW4gcHhxIG1hc2sgdG8gdGhlIGdpdmVuIG1hdHJpeCwgd2hlcmUgcFxuICogYW5kIHEgYXJlIG9kZCwgYW5kIGEgbWF0cml4IGlzIGFuIGFycmF5IG9mIGFycmF5cyBvZiBudW1iZXJzLiBSZXR1cm4gYSBuZXdcbiAqIG1hdHJpeCBvZiBzbGlnaHRseSBzbWFsbGVyIHNpemUsIHdoZXJlIGVhY2ggZWxlbWVudCBpcyB0aGUgb3V0cHV0IG9mIHRoZVxuICogbWFzayBvcGVyYXRvciBjZW50ZXJlZCBhdCB0aGF0IHBvaW50IGFuZCBlZGdlcyBhcmUgdHJpbW1lZCB3aGVyZSB0aGVcbiAqIG9wZXJhdG9yIGNvdWxkIG5vdCBiZSBhcHBsaWVkLCBjbGFtcGVkIHRvIGxiIGFuZCB1YiBpZiBwcm92aWRlZCBhbmQgcm91bmRlZFxuICogdG8gdGhlIG5lYXJlc3QgaW50ZWdlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnZvbHV0aW9uKGtlcm5lbDogTWF0LCBtYXRyaXg6IE1hdCwgbGI/OiBudW1iZXIsIHViPzogbnVtYmVyKSB7XG4gICAgdmFyIHAgPSBrZXJuZWwubGVuZ3RoLFxuICAgICAgICBxID0ga2VybmVsWzBdLmxlbmd0aCxcbiAgICAgICAgbSA9IG1hdHJpeC5sZW5ndGgsXG4gICAgICAgIG4gPSBtYXRyaXhbMF0ubGVuZ3RoLFxuICAgICAgICByWSA9IChwIC0gMSkgLyAyLFxuICAgICAgICByWCA9IChxIC0gMSkgLyAyO1xuICAgIHJldHVybiB0cmltQm9yZGVyKFxuICAgICAgICBmcm9tRnVuYyhtLCBuLCBmdW5jdGlvbiAoaSwgaikge1xuICAgICAgICAgICAgaWYgKGkgPCByWSB8fCBpID49IG0gLSByWSB8fCBqIDwgclggfHwgaiA+PSBuIC0gclgpXG4gICAgICAgICAgICAgICAgLy8gY2FuJ3QgYXBwbHkgdGhlIG9wZXJhdG9yIHRvbyBjbG9zZSB0byB0aGUgYm91bmRhcmllc1xuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgdmFyIHN1bSA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBhID0gLXJZOyBhIDw9IHJZOyBhKyspXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgYiA9IC1yWDsgYiA8PSByWDsgYisrKVxuICAgICAgICAgICAgICAgICAgICBzdW0gKz0ga2VybmVsW2EgKyByWV1bYiArIHJYXSAqIG1hdHJpeFtpICsgYV1baiArIGJdO1xuICAgICAgICAgICAgcmV0dXJuIGNsYW1wKE1hdGgucm91bmQoc3VtKSwgbGIsIHViKTtcbiAgICAgICAgfSksXG4gICAgICAgIHJYLFxuICAgICAgICByWCxcbiAgICAgICAgclksXG4gICAgICAgIHJZXG4gICAgKTtcbn1cbiIsImltcG9ydCB7IGZyb21GdW5jIH0gZnJvbSAnLi9tYXRyaXgnO1xuXG4vKipcbiAqIENsYW1wIG51bSB0byB0aGUgcmFuZ2UgW2xvLGhpXS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsYW1wKG51bTogbnVtYmVyLCBsbz86IG51bWJlciwgaGk/OiBudW1iZXIpIHtcbiAgICBsbyA9IGxvID09PSB1bmRlZmluZWQgPyAtSW5maW5pdHkgOiBsbztcbiAgICBoaSA9IGhpID09PSB1bmRlZmluZWQgPyBJbmZpbml0eSA6IGhpO1xuICAgIGlmIChudW0gPCBsbykge1xuICAgICAgICByZXR1cm4gbG87XG4gICAgfSBlbHNlIGlmIChudW0gPiBoaSkge1xuICAgICAgICByZXR1cm4gaGk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bTtcbiAgICB9XG59XG5cbi8qKlxuICogR2V0IHRoZSByZ2JhIHZhbHVlIG9mIHBpeGVsIGkgaW4gZ2l2ZW4gaW1hZ2UgZGF0YS5cbiAqIElmIGkgaXMgb3V0IG9mIGJvdW5kcywgdGhlbiByZXR1cm4gKDAsMCwwLDApLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGl4ZWwoaW1hZ2VEYXRhOiBJbWFnZURhdGEsIGk6IG51bWJlcikge1xuICAgIHJldHVybiBpIDwgaW1hZ2VEYXRhLmRhdGEubGVuZ3RoXG4gICAgICAgID8ge1xuICAgICAgICAgICAgICByOiBpbWFnZURhdGEuZGF0YVtpXSxcbiAgICAgICAgICAgICAgZzogaW1hZ2VEYXRhLmRhdGFbaSArIDFdLFxuICAgICAgICAgICAgICBiOiBpbWFnZURhdGEuZGF0YVtpICsgMl0sXG4gICAgICAgICAgICAgIGE6IGltYWdlRGF0YS5kYXRhW2kgKyAzXSxcbiAgICAgICAgICB9XG4gICAgICAgIDogeyByOiAwLCBnOiAwLCBiOiAwLCBhOiAwIH07XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBncmF5c2NhbGUgdmFsdWUgb2YgZ2l2ZW4gcmdiIHBpeGVsLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ3JheVNjYWxlKHBpeGVsOiB7IHI6IG51bWJlcjsgZzogbnVtYmVyOyBiOiBudW1iZXI7IGE/OiBudW1iZXIgfSkge1xuICAgIHJldHVybiAwLjMgKiBwaXhlbC5yICsgMC41OSAqIHBpeGVsLmcgKyAwLjExICogcGl4ZWwuYjtcbn1cblxuLyoqXG4gKiBUdXJuIGltYWdlRGF0YSBpbnRvIGEgdHdvLWRpbWVuc2lvbmFsIHdpZHRoIHggaGVpZ2h0IG1hdHJpeCBvZiBbMCwgMjU1XVxuICogaW50ZWdlcnMgb2YgZ3JheXNjYWxlIHZhbHVlcyBvZiBlYWNoIHBpeGVsLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9NYXRyaXgoaW1hZ2VEYXRhOiBJbWFnZURhdGEpIHtcbiAgICByZXR1cm4gZnJvbUZ1bmMoaW1hZ2VEYXRhLmhlaWdodCwgaW1hZ2VEYXRhLndpZHRoLCBmdW5jdGlvbiAociwgYykge1xuICAgICAgICByZXR1cm4gZ3JheVNjYWxlKGdldFBpeGVsKGltYWdlRGF0YSwgNCAqIChyICogaW1hZ2VEYXRhLndpZHRoICsgYykpKTtcbiAgICB9KTtcbn1cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IENhbnZhcyBmcm9tICcuLi9jYW52YXMnO1xuaW1wb3J0IHtcbiAgICBnYXVzc2lhbk1hc2ssXG4gICAgc29iZWxNYXNrLFxuICAgIG5vbk1heFN1cHByZXNzaW9uLFxuICAgIGh5c3RlcmVzaXMsXG4gICAgaW52ZXJ0ZWQsXG4gICAgc2hhcnBlbk1hc2ssXG4gICAgbGFwbGFjZU1hc2ssXG59IGZyb20gJy4uL2ZpbHRlcnMnO1xuaW1wb3J0IHsgTWF0LCB0b0ltYWdlRGF0YSB9IGZyb20gJy4uL21hdHJpeCc7XG5pbXBvcnQgeyB0b01hdHJpeCwgY2xhbXAgfSBmcm9tICcuLi91dGlsJztcblxudmFyIG9yaWdpbmFsRGF0YTogSW1hZ2VEYXRhLCAvLyBvcmlnaW5hbCBpbWFnZSBkYXRhXG4gICAgY3VycmVudE1hdHJpeDogTWF0LCAvLyBjdXJyZW50IGdyYXlzY2FsZSBtYXRyaXggZGlzcGxheWVkXG4gICAgY3VycmVudFNvYmVsOiB7IFM6IE1hdDsgRzogTWF0IH0sIC8vIGxhc3QgcmVzdWx0IG9mIHNvYmVsIG1hc2tcbiAgICBjdXJyZW50VG9vbjogeyBzdG9wOiAob25TdG9wOiAoKSA9PiB2b2lkKSA9PiB2b2lkIH0sIC8vIGN1cnJlbnRseSBhbmltYXRpbmcgYXV0b3Rvb25cbiAgICBtYXRyaXhTdGFjazogTWF0W10gPSBbXSwgLy8gc3RhY2sgb2YgcHJldmlvdXMgc3RhdGVzIGZvciB1bmRvIGZ1bmN0aW9uXG4gICAgLy8ga2VlcCBjYW52YXMgZnJvbSBzdHJldGNoaW5nIHRvbyBiaWdcbiAgICBsaW1pdCA9IE1hdGgubWF4KHNjcmVlbi5oZWlnaHQsIHNjcmVlbi53aWR0aCksXG4gICAgYyA9IENhbnZhcygnZGVtb0NhbnZhcycsIGxpbWl0LCBsaW1pdCwgMjAwMDAwMCksXG4gICAgLy8gbWF0cml4IHRyYXZlcnNhbCBvcmRlcnNcbiAgICBpdGVyYXRvcnMgPSB7XG4gICAgICAgIHRvcDogZnVuY3Rpb24gKE06IE1hdCwgY2I6IChhcmcwOiBudW1iZXIsIGFyZzE6IG51bWJlcikgPT4gdm9pZCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBNLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgTVswXS5sZW5ndGg7IGorKykgY2IoaSwgaik7XG4gICAgICAgIH0sXG4gICAgICAgIGJvdHRvbTogZnVuY3Rpb24gKE06IE1hdCwgY2I6IChhcmcwOiBudW1iZXIsIGFyZzE6IG51bWJlcikgPT4gdm9pZCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IE0ubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBNWzBdLmxlbmd0aDsgaisrKSBjYihpLCBqKTtcbiAgICAgICAgfSxcbiAgICAgICAgbGVmdDogZnVuY3Rpb24gKE06IE1hdCwgY2I6IChhcmcwOiBudW1iZXIsIGFyZzE6IG51bWJlcikgPT4gdm9pZCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBNWzBdLmxlbmd0aDsgaisrKVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgTS5sZW5ndGg7IGkrKykgY2IoaSwgaik7XG4gICAgICAgIH0sXG4gICAgICAgIHJpZ2h0OiBmdW5jdGlvbiAoTTogTWF0LCBjYjogKGFyZzA6IG51bWJlciwgYXJnMTogbnVtYmVyKSA9PiB2b2lkKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gTVswXS5sZW5ndGggLSAxOyBqID49IDA7IGotLSlcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IE0ubGVuZ3RoOyBpKyspIGNiKGksIGopO1xuICAgICAgICB9LFxuICAgIH07XG5cbi8vIFJlbG9hZCB0aGUgY2FudmFzIHdpdGggY3VycmVudCBtYXRyaXggZGF0YSBhbmQgc3RvcCBhbnkgYW5pbWF0aW9uLlxuZnVuY3Rpb24gcmVsb2FkKCkge1xuICAgIGZ1bmN0aW9uIHVwZGF0ZSgpIHtcbiAgICAgICAgYy5yZWxvYWRDYW52YXModG9JbWFnZURhdGEoY3VycmVudE1hdHJpeCwgb3JpZ2luYWxEYXRhKSk7XG4gICAgfVxuICAgIGlmIChjdXJyZW50VG9vbikge1xuICAgICAgICBjdXJyZW50VG9vbi5zdG9wKHVwZGF0ZSk7XG4gICAgICAgIGN1cnJlbnRUb29uID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1cGRhdGUoKTtcbiAgICB9XG59XG5cbi8vIFNldCBvdXIgZ2xvYmFsIHZhcmlhYmxlcyBmcm9tIHdoYXQgaXMgb24gdGhlIGNhbnZhcy5cbmZ1bmN0aW9uIHNldEZpZWxkcygpIHtcbiAgICBtYXRyaXhTdGFjayA9IFtdO1xuICAgIG9yaWdpbmFsRGF0YSA9IGMuZ2V0SW1hZ2VEYXRhKCk7XG4gICAgY3VycmVudE1hdHJpeCA9IHRvTWF0cml4KG9yaWdpbmFsRGF0YSk7XG59XG5cbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzdWJtaXQnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZmlsZUVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxJbnB1dEVsZW1lbnQ+KCcjZmlsZScpLFxuICAgICAgICB1cmxFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MSW5wdXRFbGVtZW50PignI3VybCcpO1xuICAgIGlmIChmaWxlRWxlbWVudC5maWxlc1swXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGMubG9hZEltYWdlKGUudGFyZ2V0LnJlc3VsdC50b1N0cmluZygpLCB0cnVlLCBzZXRGaWVsZHMpO1xuICAgICAgICB9O1xuICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlRWxlbWVudC5maWxlc1swXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgYy5sb2FkSW1hZ2UodXJsRWxlbWVudC52YWx1ZSwgZmFsc2UsIHNldEZpZWxkcyk7XG4gICAgfVxufSk7XG5cbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhdXRvJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgLy8gQ2FubnkgZWRnZSBkZXRlY3Rpb24gbWV0aG9kXG4gICAgbWF0cml4U3RhY2sucHVzaChjdXJyZW50TWF0cml4KTtcbiAgICBjdXJyZW50TWF0cml4ID0gZ2F1c3NpYW5NYXNrKGN1cnJlbnRNYXRyaXgsIDMsIDEuMCk7XG4gICAgY3VycmVudFNvYmVsID0gc29iZWxNYXNrKGN1cnJlbnRNYXRyaXgpO1xuICAgIGN1cnJlbnRNYXRyaXggPSBjdXJyZW50U29iZWwuUztcbiAgICBjdXJyZW50TWF0cml4ID0gbm9uTWF4U3VwcHJlc3Npb24oY3VycmVudFNvYmVsLlMsIGN1cnJlbnRTb2JlbC5HKTtcbiAgICBjdXJyZW50TWF0cml4ID0gaHlzdGVyZXNpcyhjdXJyZW50TWF0cml4LCAwLjIsIDAuNSk7XG4gICAgY3VycmVudE1hdHJpeCA9IGludmVydGVkKGN1cnJlbnRNYXRyaXgpO1xuICAgIHJlbG9hZCgpO1xufSk7XG5cbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNibHVyJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgbWF0cml4U3RhY2sucHVzaChjdXJyZW50TWF0cml4KTtcbiAgICB2YXIgcmFkaXVzID0gcGFyc2VJbnQoXG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxJbnB1dEVsZW1lbnQ+KCcjYmx1cl9yYWRpdXMnKS52YWx1ZVxuICAgICAgICApLFxuICAgICAgICBzaWdtYSA9IHBhcnNlRmxvYXQoXG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxJbnB1dEVsZW1lbnQ+KCcjYmx1cl9zaWdtYScpLnZhbHVlXG4gICAgICAgICk7XG4gICAgY3VycmVudE1hdHJpeCA9IGdhdXNzaWFuTWFzayhjdXJyZW50TWF0cml4LCByYWRpdXMsIHNpZ21hKTtcbiAgICByZWxvYWQoKTtcbn0pO1xuXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hhcnBlbicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgIG1hdHJpeFN0YWNrLnB1c2goY3VycmVudE1hdHJpeCk7XG4gICAgY3VycmVudE1hdHJpeCA9IHNoYXJwZW5NYXNrKGN1cnJlbnRNYXRyaXgpO1xuICAgIHJlbG9hZCgpO1xufSk7XG5cbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzb2JlbCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgIG1hdHJpeFN0YWNrLnB1c2goY3VycmVudE1hdHJpeCk7XG4gICAgY3VycmVudFNvYmVsID0gc29iZWxNYXNrKGN1cnJlbnRNYXRyaXgpO1xuICAgIGN1cnJlbnRNYXRyaXggPSBjdXJyZW50U29iZWwuUztcbiAgICByZWxvYWQoKTtcbn0pO1xuXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGFwbGFjZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgIG1hdHJpeFN0YWNrLnB1c2goY3VycmVudE1hdHJpeCk7XG4gICAgY3VycmVudE1hdHJpeCA9IGxhcGxhY2VNYXNrKGN1cnJlbnRNYXRyaXgpO1xuICAgIHJlbG9hZCgpO1xufSk7XG5cbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNub25tYXgnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICBtYXRyaXhTdGFjay5wdXNoKGN1cnJlbnRNYXRyaXgpO1xuICAgIGN1cnJlbnRNYXRyaXggPSBub25NYXhTdXBwcmVzc2lvbihjdXJyZW50U29iZWwuUywgY3VycmVudFNvYmVsLkcpO1xuICAgIHJlbG9hZCgpO1xufSk7XG5cbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNoeXN0ZXJlc2lzJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgbWF0cml4U3RhY2sucHVzaChjdXJyZW50TWF0cml4KTtcbiAgICB2YXIgaGlnaCA9IHBhcnNlRmxvYXQoZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MSW5wdXRFbGVtZW50PignI2h5c19oaScpLnZhbHVlKSxcbiAgICAgICAgbG93ID0gcGFyc2VGbG9hdChkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxJbnB1dEVsZW1lbnQ+KCcjaHlzX2xvJykudmFsdWUpO1xuICAgIGN1cnJlbnRNYXRyaXggPSBoeXN0ZXJlc2lzKGN1cnJlbnRNYXRyaXgsIGNsYW1wKGhpZ2gsIDAsIDEpLCBjbGFtcChsb3csIDAsIDEpKTtcbiAgICByZWxvYWQoKTtcbn0pO1xuXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW52ZXJ0JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgbWF0cml4U3RhY2sucHVzaChjdXJyZW50TWF0cml4KTtcbiAgICBjdXJyZW50TWF0cml4ID0gaW52ZXJ0ZWQoY3VycmVudE1hdHJpeCk7XG4gICAgcmVsb2FkKCk7XG59KTtcblxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2F1dG90b29uJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgbWF0cml4U3RhY2sucHVzaChjdXJyZW50TWF0cml4KTtcbiAgICB2YXIgc3BlZWQgPSBwYXJzZUZsb2F0KFxuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MSW5wdXRFbGVtZW50PignI3Rvb25fc3BlZWQnKS52YWx1ZVxuICAgICAgICApLFxuICAgICAgICBkaXJlY3Rpb24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxJbnB1dEVsZW1lbnQ+KCcjdG9vbl9kaXInKS52YWx1ZSxcbiAgICAgICAgc29ydCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTElucHV0RWxlbWVudD4oJyN0b29uX3NvcnQnKS52YWx1ZSxcbiAgICAgICAgYmdDb2xvciA9IHBhcnNlSW50KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTElucHV0RWxlbWVudD4oJyN0b29uX2JnJykudmFsdWUpLFxuICAgICAgICBNID0gY3VycmVudE1hdHJpeCxcbiAgICAgICAgbiA9IE1bMF0ubGVuZ3RoLFxuICAgICAgICBtID0gTS5sZW5ndGgsXG4gICAgICAgIGNhcnRlc2lhbkRpc3RhbmNlID0gZnVuY3Rpb24gKHIxOiBudW1iZXIsIGMxOiBudW1iZXIsIHIyOiBudW1iZXIsIGMyOiBudW1iZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3cocjEgLSByMiwgMikgKyBNYXRoLnBvdyhjMSAtIGMyLCAyKSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIE51bWJlciBvZiByb3dzIHRoZSBlZGdlIHNwYW5zXG4gICAgICAgIHlTcGFuID0gZnVuY3Rpb24gKGVkZ2U6IG51bWJlcltdKSB7XG4gICAgICAgICAgICB2YXIgeU1pbiA9IEluZmluaXR5LFxuICAgICAgICAgICAgICAgIHlNYXggPSAtSW5maW5pdHk7XG4gICAgICAgICAgICBlZGdlLmZvckVhY2goZnVuY3Rpb24gKGVsZW06IG51bWJlcikge1xuICAgICAgICAgICAgICAgIHZhciByID0gZWxlbSAvIG47XG4gICAgICAgICAgICAgICAgeU1pbiA9IE1hdGgubWluKHlNaW4sIHIpO1xuICAgICAgICAgICAgICAgIHlNYXggPSBNYXRoLm1heCh5TWF4LCByKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coeU1heCwgeU1pbik7XG4gICAgICAgICAgICByZXR1cm4geU1heCAtIHlNaW47XG4gICAgICAgIH0sXG4gICAgICAgIC8vIE51bWJlciBvZiBjb2xzIHRoZSBlZGdlIHNwYW5zXG4gICAgICAgIHhTcGFuID0gZnVuY3Rpb24gKGVkZ2U6IG51bWJlcltdKSB7XG4gICAgICAgICAgICB2YXIgeE1pbiA9IEluZmluaXR5LFxuICAgICAgICAgICAgICAgIHhNYXggPSAtSW5maW5pdHk7XG4gICAgICAgICAgICBlZGdlLmZvckVhY2goZnVuY3Rpb24gKGVsZW06IG51bWJlcikge1xuICAgICAgICAgICAgICAgIHZhciBjID0gZWxlbSAlIG47XG4gICAgICAgICAgICAgICAgeE1pbiA9IE1hdGgubWluKHhNaW4sIGMpO1xuICAgICAgICAgICAgICAgIHhNYXggPSBNYXRoLm1heCh4TWF4LCBjKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coeE1heCwgeE1pbik7XG4gICAgICAgICAgICByZXR1cm4geE1heCAtIHhNaW47XG4gICAgICAgIH0sXG4gICAgICAgIHRyYW5zZm9ybSA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBsb25nZXN0KGVkZ2VzOiBudW1iZXJbXVtdKSB7XG4gICAgICAgICAgICAgICAgZWRnZXMuc29ydChmdW5jdGlvbiAoZTE6IG51bWJlcltdLCBlMjogbnVtYmVyW10pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGUyLmxlbmd0aCAtIGUxLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIHJhbmRvbShlZGdlczogbnVtYmVyW11bXSkge1xuICAgICAgICAgICAgICAgIC8vIEZpc2hlci1ZYXRlcyBzaHVmZmxlLCBkZXNjcmlwdGlvbiBvbiBXaWtpcGVkaWEuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlZGdlcy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGogPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAoZWRnZXMubGVuZ3RoIC0gaSkpICsgaSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXAgPSBlZGdlc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgZWRnZXNbaV0gPSBlZGdlc1tqXTtcbiAgICAgICAgICAgICAgICAgICAgZWRnZXNbal0gPSB0ZW1wO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIGRhcmtlc3QoZWRnZXM6IG51bWJlcltdW10pIHtcbiAgICAgICAgICAgICAgICBlZGdlcy5zb3J0KGZ1bmN0aW9uIChlMTogbnVtYmVyW10sIGUyOiBudW1iZXJbXSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgczEgPSAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgczIgPSAwO1xuICAgICAgICAgICAgICAgICAgICBlMS5mb3JFYWNoKGZ1bmN0aW9uIChlbGVtOiBudW1iZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHMxICs9IE1hdGguYWJzKGJnQ29sb3IgLSBNW01hdGguZmxvb3IoZWxlbSAvIG4pXVtlbGVtICUgbl0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgZTIuZm9yRWFjaChmdW5jdGlvbiAoZWxlbTogbnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzMiArPSBNYXRoLmFicyhiZ0NvbG9yIC0gTVtNYXRoLmZsb29yKGVsZW0gLyBuKV1bZWxlbSAlIG5dKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzMiAvIGUyLmxlbmd0aCAtIHMxIC8gZTEubGVuZ3RoO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gY2VudGVyKGVkZ2VzOiBudW1iZXJbXVtdKSB7XG4gICAgICAgICAgICAgICAgZWRnZXMuc29ydChmdW5jdGlvbiAoZTE6IG51bWJlcltdLCBlMjogbnVtYmVyW10pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGMxID0gMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGMyID0gMDtcbiAgICAgICAgICAgICAgICAgICAgZTEuZm9yRWFjaChmdW5jdGlvbiAoZWxlbTogbnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjMSArPSBjYXJ0ZXNpYW5EaXN0YW5jZShtIC8gMiwgbiAvIDIsIGVsZW0gLyBuLCBlbGVtICUgbik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBlMi5mb3JFYWNoKGZ1bmN0aW9uIChlbGVtOiBudW1iZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGMyICs9IGNhcnRlc2lhbkRpc3RhbmNlKG0gLyAyLCBuIC8gMiwgZWxlbSAvIG4sIGVsZW0gJSBuKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjMSAvIGUxLmxlbmd0aCAtIGMyIC8gZTIubGVuZ3RoO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gd2lkZXN0KGVkZ2VzOiBudW1iZXJbXVtdKSB7XG4gICAgICAgICAgICAgICAgLy8gV2Ugc29ydCBieSB0aGUgc3BhbiBvZiB0aGUgZWRnZTogdGhlIHgtcmFuZ2UgKyB5LXJhbmdlXG4gICAgICAgICAgICAgICAgZWRnZXMuc29ydChmdW5jdGlvbiAoZTE6IG51bWJlcltdLCBlMjogbnVtYmVyW10pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcnRlc2lhbkRpc3RhbmNlKHlTcGFuKGUyKSwgeFNwYW4oZTIpLCAwLCAwKSAtXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJ0ZXNpYW5EaXN0YW5jZSh5U3BhbihlMSksIHhTcGFuKGUxKSwgMCwgMClcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIG5vdyB3ZSBzZWxlY3Qgb25lIG9mIHRoZXNlIGZ1bmN0aW9ucyBhbmQgcmV0dXJuIGl0XG4gICAgICAgICAgICByZXR1cm4geyBsb25nZXN0LCByYW5kb20sIGRhcmtlc3QsIGNlbnRlciwgd2lkZXN0IH1bc29ydF07XG4gICAgICAgIH0pKCksXG4gICAgICAgIHVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGN1cnJlbnRUb29uID0gYy5hdXRvVG9vbihcbiAgICAgICAgICAgICAgICBjdXJyZW50TWF0cml4LFxuICAgICAgICAgICAgICAgIHNwZWVkLFxuICAgICAgICAgICAgICAgIGJnQ29sb3IsXG4gICAgICAgICAgICAgICAgaXRlcmF0b3JzW2RpcmVjdGlvbiBhcyAndG9wJyB8ICdib3R0b20nIHwgJ2xlZnQnIHwgJ3JpZ2h0J10sXG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtXG4gICAgICAgICAgICApO1xuICAgICAgICB9O1xuICAgIGlmIChjdXJyZW50VG9vbikge1xuICAgICAgICBjdXJyZW50VG9vbi5zdG9wKHVwZGF0ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdXBkYXRlKCk7XG4gICAgfVxufSk7XG5cbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyN1bmRvJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgY3VycmVudE1hdHJpeCA9IG1hdHJpeFN0YWNrLnBvcCgpO1xuICAgIHJlbG9hZCgpO1xufSk7XG5cbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNyZXNldCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgIGMucmVsb2FkQ2FudmFzKG9yaWdpbmFsRGF0YSk7XG4gICAgbWF0cml4U3RhY2sucHVzaChjdXJyZW50TWF0cml4KTtcbiAgICBjdXJyZW50TWF0cml4ID0gdG9NYXRyaXgob3JpZ2luYWxEYXRhKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxJbnB1dEVsZW1lbnQ+KCcjZmlsZScpLnZhbHVlID0gJyc7IC8vIHJlbW92ZSBzZWxlY3RlZCBmaWxlXG59KTtcblxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3NhdmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGMuZ2V0RWxlbSgpLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJyk7XG59KTtcblxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3NoYXJlJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNyYyA9IGVuY29kZVVSSShjLmdldEltYWdlKCkuc3JjKSxcbiAgICAgICAgbG9jID0gd2luZG93LmxvY2F0aW9uLmhyZWYsXG4gICAgICAgIHF1ZXJ5ID0gbG9jLmluZGV4T2YoJz8nKSxcbiAgICAgICAgdXJsID0gbG9jLnNsaWNlKDAsIHF1ZXJ5ID4gMCA/IHF1ZXJ5IDogbG9jLmxlbmd0aCkgKyAnP3NyYz0nICsgc3JjLFxuICAgICAgICB0ZXh0QXJlYSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTFRleHRBcmVhRWxlbWVudD4oJyNzaGFyZXRleHQnKTtcbiAgICBpZiAoc3JjLmxlbmd0aCA+IDIwMDApIHtcbiAgICAgICAgYWxlcnQoJ1RvbyBsb25nLiBUcnkgc3VibWl0dGluZyBmaWxlIGJ5IFVSTCwgdGhlbiBzaGFyaW5nLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRleHRBcmVhLnZhbHVlID0gdXJsO1xuICAgICAgICB0ZXh0QXJlYS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICB9XG59KTtcblxuLy8gaWYgc3JjIHBhcmFtIGlzIGdpdmVuLCB0cnkgdG8gbG9hZCBjYW52YXMgZnJvbSB0aGF0XG53aW5kb3cubG9jYXRpb24uc2VhcmNoXG4gICAgLnNsaWNlKDEpXG4gICAgLnNwbGl0KCcmJylcbiAgICAuZm9yRWFjaChmdW5jdGlvbiAocGFyYW0pIHtcbiAgICAgICAgaWYgKCFwYXJhbSkgcmV0dXJuO1xuICAgICAgICB2YXIgc3BsaXQgPSBwYXJhbS5zcGxpdCgnPScpLFxuICAgICAgICAgICAga2V5ID0gc3BsaXRbMF0sXG4gICAgICAgICAgICB2YWwgPSBkZWNvZGVVUkkoc3BsaXRbMV0pO1xuICAgICAgICBpZiAoa2V5ID09PSAnc3JjJylcbiAgICAgICAgICAgIGMubG9hZEltYWdlKHZhbCwgdmFsLmluZGV4T2YoJ2RhdGE6aW1hZ2UvJykgIT09IC0xLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2V0RmllbGRzKCk7XG4gICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5sb2NhdGlvbi5oYXNoID09PSAnI2F1dG8nKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+KCcjYXV0bycpLmNsaWNrKCk7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+KCcjYXV0b3Rvb24nKS5jbGljaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgIH0pO1xuXG4vLyBUT0RPIHJlc2l6ZSB0aGUgaW1hZ2UgdG8gZml0IGNhbnZhcywgbWFrZSBtYXggc2l6ZSBlLmcuIDFNUCBvciBzaXplIG9mIHZpZXdwb3J0XG4vLyBUT0RPIHNpbXBsaWZ5IHRoZSBwYWdlLCByZWR1Y2UgdGhlICMgb2YgYnV0dG9ucyBhbmQgaW5zdGVhZCBtYWtlIHNsaWRlcnMgc3VjaCBhc1xuLy8gTWF5YmUgYWRkIGEgbG9hZGluZyBzcGlubmVyIGFzIHdlbGwsIGFuZCBhIHdheSB0byBzYXZlIHZpZGVvP1xuLy8gZWRnZSB0cmltbWluZyAoaHlzdGVyZXNpcyksIGVkZ2Ugc2hhcnBuZXNzIChzaGFycGVuaW5nKVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQW1CQTs7QUFFQTtBQUNBO0FBTUE7QUFDQTtBQUNBO0FBRUE7Ozs7QUFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTs7Ozs7Ozs7OztBQVVBO0FBQ0E7QUFRQTtBQU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUVBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUVBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFBQTtBQUNBO0FBT0E7Ozs7O0FBS0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUNBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUM5UUE7QUFDQTtBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUlBO0FBR0E7QUFDQTtBQUVBO0FBRUE7QUFDQTtBQUNBO0FBQUE7QUFBQTtBQUNBO0FBQ0E7QUFBQTtBQUFBO0FBQ0E7QUFDQTtBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBS0E7QUFFQTs7QUFFQTtBQUNBO0FBTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUVBO0FBQ0E7QUFFQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBSUE7QUFDQTtBQUVBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUtBO0FBRUE7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTs7OztBQUlBO0FBQ0E7QUFLQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUlBO0FBQUE7QUFDQTtBQUNBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBOzs7O0FBSUE7QUFDQTtBQUNBO0FBSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN6T0E7QUFJQTs7QUFFQTtBQUNBO0FBS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7OztBQUdBO0FBQ0E7QUFNQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7Ozs7QUFJQTtBQUNBO0FBQ0E7QUFHQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7Ozs7Ozs7QUFPQTtBQUNBO0FBQ0E7QUFNQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQU1BO0FBQ0E7QUFDQTtBOzs7Ozs7Ozs7Ozs7Ozs7O0FDbEhBO0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUNBO0FBQ0E7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUVBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBOzs7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ1BBOzs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7QUNOQTtBQUNBO0FBU0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBTUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQVVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQU9BO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFLQTtBQUNBO0FBQ0E7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFDQTtBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBOzs7OztBIiwic291cmNlUm9vdCI6IiJ9