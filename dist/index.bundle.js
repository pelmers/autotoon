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
/*!*****************!*\
  !*** ./main.ts ***!
  \*****************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _canvas__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./canvas */ "./canvas.ts");
/* harmony import */ var _filters__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./filters */ "./filters.ts");
/* harmony import */ var _matrix__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./matrix */ "./matrix.ts");
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./util */ "./util.ts");




const getMaxWidth = () => document.querySelector('body').getBoundingClientRect().width - 20;
const getMaxHeight = () => window.screen.height - 50;
const getMaxSize = () => 900000;
const $demoCanvas = document.querySelector('#demoCanvas');
const $file = document.querySelector('#file');
const $dragDrop = document.querySelector('#dragdrop');
const $findEdges = document.querySelector('#find-edges');
const $moreEdges = document.querySelector('#more-edges');
const $lessEdges = document.querySelector('#less-edges');
const $autotoon = document.querySelector('#autotoon');
const $autotoonGroup = document.querySelector('#autotoonGroup');
const $toonSpeed = document.querySelector('#toon_speed');
const $toonDir = document.querySelector('#toon_dir');
const $toonSort = document.querySelector('#toon_sort');
const $reset = document.querySelector('#reset');
let sharpenLevel = 0;
let c;
var originalData, // original image data
originalMatrix, // original image matrix in grayscale
currentMatrix, // current grayscale matrix displayed
currentSobel, // last result of sobel mask
currentToon, // currently animating autotoon
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
    originalData = c.getImageData();
    originalMatrix = (0,_util__WEBPACK_IMPORTED_MODULE_3__.toMatrix)(originalData);
    currentMatrix = originalMatrix;
}
function reset(hideAgain = false) {
    if (!originalData) {
        return;
    }
    sharpenLevel = 0;
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
function handleFiles(files) {
    const f = files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
        // keep canvas from stretching too big
        (c = (0,_canvas__WEBPACK_IMPORTED_MODULE_0__.default)('demoCanvas', getMaxWidth(), getMaxHeight(), getMaxSize())),
            c.loadImage(e.target.result.toString(), true, setFields);
        $dragDrop.style.display = 'none';
        $demoCanvas.style.display = 'block';
        $findEdges.style.display = 'block';
    };
    reader.readAsDataURL(f);
}
function applySharpenLevel() {
    for (let i = 0; i < sharpenLevel; i++) {
        currentMatrix = (0,_filters__WEBPACK_IMPORTED_MODULE_1__.sharpenMask)(currentMatrix);
    }
    for (let i = sharpenLevel; i < 0; i++) {
        currentMatrix = (0,_filters__WEBPACK_IMPORTED_MODULE_1__.gaussianMask)(currentMatrix, 3, 0.7);
    }
}
function cannyMethod() {
    // Canny edge detection method
    currentMatrix = (0,_filters__WEBPACK_IMPORTED_MODULE_1__.gaussianMask)(currentMatrix, 3, 1.0);
    currentSobel = (0,_filters__WEBPACK_IMPORTED_MODULE_1__.sobelMask)(currentMatrix);
    currentMatrix = currentSobel.S;
    currentMatrix = (0,_filters__WEBPACK_IMPORTED_MODULE_1__.nonMaxSuppression)(currentSobel.S, currentSobel.G);
    currentMatrix = (0,_filters__WEBPACK_IMPORTED_MODULE_1__.hysteresis)(currentMatrix, 0.18, 0.45);
    currentMatrix = (0,_filters__WEBPACK_IMPORTED_MODULE_1__.inverted)(currentMatrix);
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
    const speed = parseFloat($toonSpeed.value), direction = $toonDir.value, sort = $toonSort.value, bgColor = 255, M = currentMatrix, n = M[0].length, m = M.length, cartesianDistance = function (r1, c1, r2, c2) {
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
    })();
    currentToon = c.autoToon(currentMatrix, speed, bgColor, iterators[direction], transform, () => {
        currentToon = null;
        $autotoon.textContent = 'Autotoon';
    });
    $autotoon.textContent = 'Stop';
});
$reset.addEventListener('click', () => reset(true));
// TODO add a loading spinner as well, and a way to save video?

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguYnVuZGxlLmpzIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vLy4vY2FudmFzLnRzIiwid2VicGFjazovLy8uL2ZpbHRlcnMudHMiLCJ3ZWJwYWNrOi8vLy4vbWF0cml4LnRzIiwid2VicGFjazovLy8uL3V0aWwudHMiLCJ3ZWJwYWNrOi8vL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovLy93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vLy4vbWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBmcm9tRnVuYywgTWF0LCBuZWlnaGJvcmhvb2QsIHRvSW1hZ2VEYXRhIH0gZnJvbSAnLi9tYXRyaXgnO1xuaW1wb3J0IHsgY2xhbXAgfSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgdHlwZSBDYW52YXNUeXBlID0ge1xuICAgIC8vIGV4cG9ydGVkIGZ1bmN0aW9ucyBvbiBDYW52YXMgb2JqZWN0c1xuICAgIGxvYWRJbWFnZTogKGltZ1NvdXJjZTogc3RyaW5nLCBpc0RhdGFVUkk6IGJvb2xlYW4sIGNhbGxiYWNrOiAoKSA9PiB2b2lkKSA9PiB2b2lkO1xuICAgIGdldEltYWdlOiAoKSA9PiBIVE1MSW1hZ2VFbGVtZW50O1xuICAgIGdldEltYWdlRGF0YTogKCkgPT4gSW1hZ2VEYXRhO1xuICAgIHJlbG9hZENhbnZhczogKGRhdGE6IEltYWdlRGF0YSkgPT4gdm9pZDtcbiAgICBnZXRDb250ZXh0OiAoKSA9PiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XG4gICAgZ2V0RWxlbTogKCkgPT4gSFRNTENhbnZhc0VsZW1lbnQ7XG4gICAgYXV0b1Rvb246IChcbiAgICAgICAgTTogTWF0LFxuICAgICAgICBzcGVlZDogbnVtYmVyLFxuICAgICAgICBiZ0NvbG9yOiBudW1iZXIsXG4gICAgICAgIG1hdHJpeEl0ZXI6IChhcmcwOiBNYXQsIGFyZzE6IChpOiBudW1iZXIsIGo6IG51bWJlcikgPT4gdm9pZCkgPT4gdm9pZCxcbiAgICAgICAgdHJhbnNmb3JtOiAoYXJnMDogbnVtYmVyW11bXSkgPT4gdm9pZCxcbiAgICAgICAgb25Db21wbGV0ZT86ICgpID0+IHZvaWRcbiAgICApID0+IHsgc3RvcDogKG9uU3RvcDogKCkgPT4gdm9pZCkgPT4gdm9pZCB9O1xufTtcbi8qKlxuICogV3JhcCBhIGNhbnZhcyBvYmplY3Qgd2l0aCBnaXZlbiBJRCBhbmQgbWF4aW11bSBwYXJhbWV0ZXJzLlxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBDYW52YXMoXG4gICAgaWQ6IHN0cmluZyxcbiAgICBtYXhXaWR0aDogbnVtYmVyLFxuICAgIG1heEhlaWdodDogbnVtYmVyLFxuICAgIG1heFBpeGVsczogbnVtYmVyXG4pOiBDYW52YXNUeXBlIHtcbiAgICB2YXIgZWxlbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKSBhcyBIVE1MQ2FudmFzRWxlbWVudCwgLy8gY2FudmFzIGVsZW1lbnRcbiAgICAgICAgY3R4ID0gZWxlbS5nZXRDb250ZXh0KCcyZCcpLCAvLyBkcmF3aW5nIGNvbnRleHRcbiAgICAgICAgaW1hZ2U6IEhUTUxJbWFnZUVsZW1lbnQgPSBudWxsOyAvLyBJbWFnZSBvYmplY3RcblxuICAgIC8qKlxuICAgICAqIExvYWQgZ2l2ZW4gaW1hZ2Ugb250byB0aGUgY2FudmFzLCByZXBsYWNpbmcgYW55IGV4aXN0aW5nIGNvbnRlbnQsXG4gICAgICogYW5kIHJlc2l6ZSB0aGUgY2FudmFzIHRvIGZpdCB0aGUgcGljdHVyZS5cbiAgICAgKiBDYWxsIGNhbGxiYWNrIG9uY2UgdGhlIGltYWdlIGlzIGxvYWRlZC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBsb2FkSW1hZ2UoaW1nU291cmNlOiBzdHJpbmcsIGlzRGF0YVVSSTogYm9vbGVhbiwgY2FsbGJhY2s6ICgpID0+IHZvaWQpIHtcbiAgICAgICAgZnVuY3Rpb24gaGFuZGxlcigpIHtcbiAgICAgICAgICAgIC8vIGRvd25zY2FsZSBmYWN0b3IgaW1hZ2UgdG8gbWF4V2lkdGggb3IgbWF4SGVpZ2h0IGlmIGl0J3MgdG9vIGJpZ1xuICAgICAgICAgICAgdmFyIHNjYWxpbmcgPSBjbGFtcChcbiAgICAgICAgICAgICAgICAxIC8gTWF0aC5tYXgoaW1hZ2Uud2lkdGggLyBtYXhXaWR0aCwgaW1hZ2UuaGVpZ2h0IC8gbWF4SGVpZ2h0KSxcbiAgICAgICAgICAgICAgICAwLjAsXG4gICAgICAgICAgICAgICAgMS4wXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgZWxlbS53aWR0aCA9IE1hdGguZmxvb3Ioc2NhbGluZyAqIGltYWdlLndpZHRoKTtcbiAgICAgICAgICAgIGVsZW0uaGVpZ2h0ID0gTWF0aC5mbG9vcihzY2FsaW5nICogaW1hZ2UuaGVpZ2h0KTtcbiAgICAgICAgICAgIGNvbnN0IHNpemUgPSBlbGVtLndpZHRoICogZWxlbS5oZWlnaHQ7XG4gICAgICAgICAgICBpZiAoc2l6ZSA+IG1heFBpeGVscykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1heFNjYWxlID0gTWF0aC5zcXJ0KHNpemUgLyBtYXhQaXhlbHMpO1xuICAgICAgICAgICAgICAgIGVsZW0ud2lkdGggPSBNYXRoLmZsb29yKGVsZW0ud2lkdGggLyBtYXhTY2FsZSk7XG4gICAgICAgICAgICAgICAgZWxlbS5oZWlnaHQgPSBNYXRoLmZsb29yKGVsZW0uaGVpZ2h0IC8gbWF4U2NhbGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShpbWFnZSwgMCwgMCwgZWxlbS53aWR0aCwgZWxlbS5oZWlnaHQpO1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICAgIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgICAgIGltYWdlLm9ubG9hZCA9IGhhbmRsZXI7XG4gICAgICAgIC8vIGZvciBzb21lIHJlYXNvbiBzZXR0aW5nIHRoaXMgd2hlbiB0aGUgc3JjIGlzIGFjdHVhbGx5IG5vdFxuICAgICAgICAvLyBjcm9zcy1vcmlnaW4gY2F1c2VzIGZpcmVmb3ggdG8gbm90IGZpcmUgdGhlIG9ubG9hZCBoYW5kbGVyXG4gICAgICAgIGlmICghaXNEYXRhVVJJKVxuICAgICAgICAgICAgLy8gYWxsb3cgY3Jvc3Mtb3JpZ2luIHJlcXVlc3RzIGZvciBzdXBwb3J0ZWQgc2VydmVyc1xuICAgICAgICAgICAgaW1hZ2UuY3Jvc3NPcmlnaW4gPSAnQW5vbnltb3VzJztcbiAgICAgICAgaW1hZ2Uuc3JjID0gaW1nU291cmNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbG9hZCB0aGUgY2FudmFzIHdpdGggZ2l2ZW4gSW1hZ2VEYXRhLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJlbG9hZENhbnZhcyhkYXRhOiBJbWFnZURhdGEpIHtcbiAgICAgICAgZWxlbS53aWR0aCA9IGRhdGEud2lkdGg7XG4gICAgICAgIGVsZW0uaGVpZ2h0ID0gZGF0YS5oZWlnaHQ7XG4gICAgICAgIGN0eC5wdXRJbWFnZURhdGEoZGF0YSwgMCwgMCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRoZSBpbWFnZSBkYXRhIG9mIHRoZSBjdXJyZW50bHkgZHJhd24gY29udGV4dC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRJbWFnZURhdGEoKSB7XG4gICAgICAgIHJldHVybiBjdHguZ2V0SW1hZ2VEYXRhKDAsIDAsIGVsZW0ud2lkdGgsIGVsZW0uaGVpZ2h0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gdGhlIGN1cnJlbnRseSBkaXNwbGF5ZWQgSW1hZ2Ugb2JqZWN0LlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdldEltYWdlKCkge1xuICAgICAgICByZXR1cm4gaW1hZ2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRoZSBjdXJyZW50IGNhbnZhcyAyRCBjb250ZXh0LlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdldENvbnRleHQoKSB7XG4gICAgICAgIHJldHVybiBjdHg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRoZSBjdXJyZW50IGNhbnZhcyBET00gZWxlbWVudC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRFbGVtKCkge1xuICAgICAgICByZXR1cm4gZWxlbTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBbmltYXRlIHRoZSBkcmF3aW5nIG9mIHRoZSBlZGdlcyBvZiBNLCB3aXRoIHNwZWVkIGdpdmVuIGluIHBpeGVscyAvIG1zLFxuICAgICAqIGJnQ29sb3IgZGVmaW5pbmcgdGhlIGdyYXlzY2FsZSB2YWx1ZSBvZiB0aGUgYmFja2dyb3VuZCAoZWl0aGVyIDAgb3JcbiAgICAgKiAyNTUpLCBhbmQgbWF0cml4SXRlciBiZWluZyBhIGZ1bmN0aW9uIHdoaWNoIHRha2VzIHBhcmFtZXRlcnMgTSBhbmRcbiAgICAgKiBjYWxsYmFjayhpLGopIGFuZCBpdGVyYXRlcyBvdmVyIGVhY2ggZWxlbWVudCBvZiBNIGluIHNvbWUgb3JkZXIsIGNhbGxpbmdcbiAgICAgKiBjYWxsYmFjayBhdCBlYWNoIGVsZW1lbnQsIGFuZCB0cmFuc2Zvcm0oZWRnZXMpIG9wdGlvbmFsbHkgcHJvdmlkZXMgYVxuICAgICAqIGZ1bmN0aW9uIHRvIHJlLW9yZGVyIG9yIG90aGVyd2lzZSBtb2RpZnkgdGhlIGxpc3Qgb2YgZWRnZXMgZm91bmQgYW5kIGlzXG4gICAgICogY2FsbGVkIGJlZm9yZSBhbmltYXRpb24gYmVnaW5zLiBSZXR1cm4gYW4gb2JqZWN0IHRoYXQgY29udGFpbnMgYVxuICAgICAqIGZ1bmN0aW9uIC5zdG9wKGNiKSB3aGljaCBzdG9wcyB0aGUgYW5pbWF0aW9uIGFuZCBjYWxscyBjYiBvbiB0aGUgbmV4dFxuICAgICAqIGZyYW1lLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGF1dG9Ub29uKFxuICAgICAgICBNOiBNYXQsXG4gICAgICAgIHNwZWVkOiBudW1iZXIsXG4gICAgICAgIGJnQ29sb3I6IG51bWJlcixcbiAgICAgICAgbWF0cml4SXRlcjogKGFyZzA6IE1hdCwgYXJnMTogKGk6IG51bWJlciwgajogbnVtYmVyKSA9PiB2b2lkKSA9PiB2b2lkLFxuICAgICAgICB0cmFuc2Zvcm06IChhcmcwOiBudW1iZXJbXVtdKSA9PiB2b2lkLFxuICAgICAgICBvbkNvbXBsZXRlPzogKCkgPT4gdm9pZFxuICAgICkge1xuICAgICAgICB2YXIgbSA9IE0ubGVuZ3RoLFxuICAgICAgICAgICAgbiA9IE1bMF0ubGVuZ3RoLFxuICAgICAgICAgICAgZ3JvdXBlZFBpeGVsczogeyBbcGl4ZWw6IG51bWJlcl06IGJvb2xlYW4gfSA9IHt9LFxuICAgICAgICAgICAgZ3JvdXBzOiBudW1iZXJbXVtdID0gW10sXG4gICAgICAgICAgICBzdG9wQ2FsbGJhY2s6ICgpID0+IHZvaWQgPSBudWxsLFxuICAgICAgICAgICAgbnVtID0gMCwgLy8gY3VycmVudCBpbmRleCBpbiBncm91cHNcbiAgICAgICAgICAgIGlkeCA9IDAsIC8vIGN1cnJlbnQgaW5kZXggaW4gZ3JvdXBzW251bV1cbiAgICAgICAgICAgIC8vIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBhbmltYXRpb24sIGluaXRpYWxseSBhbGwgYmFja2dyb3VuZFxuICAgICAgICAgICAgZ2xvYmFsbWF0ID0gZnJvbUZ1bmMobSwgbiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBiZ0NvbG9yO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBsYXN0VGltZTogbnVtYmVyLCAvLyB0aGUgbGFzdCB0aW1lIGF0IHdoaWNoIHdlIGRyZXcgYW55IHBpeGVsc1xuICAgICAgICAgICAgZG9uZSA9IGZhbHNlOyAvLyBpcyB0aGUgYW5pbWF0aW9uIGNvbXBsZXRlP1xuXG4gICAgICAgIC8vIFRyYWNlIHRoZSBlZGdlIHRoYXQgY29udGFpbnMgc3RhcnQgYW5kIHJldHVybiBpdHMgcG9zaXRpb25zLlxuICAgICAgICBmdW5jdGlvbiB0cmFjZUVkZ2Uoc3RhcnQ6IG51bWJlcikge1xuICAgICAgICAgICAgdmFyIHRyYWNlID0gW10sXG4gICAgICAgICAgICAgICAgc3RhY2sgPSBbc3RhcnRdO1xuICAgICAgICAgICAgZ3JvdXBlZFBpeGVsc1tzdGFydF0gPSB0cnVlO1xuICAgICAgICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgdiA9IHN0YWNrLnBvcCgpO1xuICAgICAgICAgICAgICAgIHRyYWNlLnB1c2godik7XG4gICAgICAgICAgICAgICAgbmVpZ2hib3Job29kKE0sIE1hdGguZmxvb3IodiAvIG4pLCB2ICUgbiwgZnVuY3Rpb24gKHZhbCwgciwgYykge1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBvcmRlciBuZWlnaGJvcnMgLS0gaXQgd291bGQgYmUgYmV0dGVyIHRvIHRyeSB0b1xuICAgICAgICAgICAgICAgICAgICAvLyBjb250aW51ZSBlZGdlcyBpbiB0aGUgc2FtZSBkaXJlY3Rpb24gaWYgcG9zc2libGVcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBvcyA9IHIgKiBuICsgYztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCAhPT0gYmdDb2xvciAmJiBncm91cGVkUGl4ZWxzW3Bvc10gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaChwb3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBlZFBpeGVsc1twb3NdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRyYWNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUGFydGl0aW9uIHRoZSBpbWFnZSBpbnRvIGVkZ2VzIGluIHNvbWUgdHJhdmVyc2FsIG9yZGVyXG4gICAgICAgIG1hdHJpeEl0ZXIoTSwgZnVuY3Rpb24gKGksIGopIHtcbiAgICAgICAgICAgIHZhciBwb3MgPSBpICogbiArIGo7XG4gICAgICAgICAgICBpZiAoTVtpXVtqXSAhPT0gYmdDb2xvciAmJiBncm91cGVkUGl4ZWxzW3Bvc10gPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICBncm91cHMucHVzaCh0cmFjZUVkZ2UocG9zKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodHJhbnNmb3JtKSB0cmFuc2Zvcm0oZ3JvdXBzKTtcblxuICAgICAgICAvLyBCZWZvcmUgd2UgYmVnaW4gZHJhd2luZywgd2UgZmlyc3QgY2xlYXIgdGhlIGNhbnZhcy5cbiAgICAgICAgcmVsb2FkQ2FudmFzKHRvSW1hZ2VEYXRhKGdsb2JhbG1hdCkpO1xuXG4gICAgICAgIC8vIERyYXcgbmV4dCB0b0RyYXcgcGl4ZWxzLCByZXR1cm4gd2hldGhlciB3ZSBoYXZlIHJlYWNoZWQgdGhlIGVuZC5cbiAgICAgICAgZnVuY3Rpb24gZHJhd1BpeGVscyh0b0RyYXc6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgICAgICAgICAgaWYgKHRvRHJhdyA9PT0gMCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgdmFyIGJlZ2luID0gaWR4LFxuICAgICAgICAgICAgICAgIGVuZCA9IE1hdGgubWluKGdyb3Vwc1tudW1dLmxlbmd0aCwgYmVnaW4gKyB0b0RyYXcpLFxuICAgICAgICAgICAgICAgIG1pblIgPSBJbmZpbml0eSxcbiAgICAgICAgICAgICAgICBtYXhSID0gLUluZmluaXR5LFxuICAgICAgICAgICAgICAgIG1pbkMgPSBJbmZpbml0eSxcbiAgICAgICAgICAgICAgICBtYXhDID0gLUluZmluaXR5LFxuICAgICAgICAgICAgICAgIGxlZnRvdmVyID0gdG9EcmF3IC0gKGVuZCAtIGJlZ2luKTtcbiAgICAgICAgICAgIC8qIEV4cGxhbmF0aW9uOiBjb2xsZWN0IHRoZSBuZXh0IGNodW5rIG9mIHBpeGVscyBpbnRvIGEgc3VibWF0cml4XG4gICAgICAgICAgICAgKiBhbmQgdGhlbiBjYWxsIHB1dEltYWdlRGF0YSB0byB0aGUgdG9wIGxlZnQgY29ybmVyLiBUbyBtYWtlIHN1cmVcbiAgICAgICAgICAgICAqIHdlIGRvbid0IG92ZXJ3cml0ZSBwcmV2aW91cyBlZGdlcywgd2UgaW5pdGlhbGl6ZSBzdWJtYXRyaXggZnJvbVxuICAgICAgICAgICAgICogZ2xvYmFsbWF0cml4LiBEb2luZyB0aGlzIGxldHMgdGhlIGJyb3dzZXIgYW5pbWF0ZSBhdCBhIGdvb2RcbiAgICAgICAgICAgICAqIHNwZWVkIChhcyBvcHBvc2VkIHRvIGRyYXdpbmcgb25lIHBpeGVsIGF0IGEgdGltZSkuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIC8vIEZpcnN0IGluaXRpYWxpemUgdGhlIGJvdW5kcyBvbiB0aGlzIGNodW5rXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gYmVnaW47IGkgPCBlbmQ7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciByID0gTWF0aC5mbG9vcihncm91cHNbbnVtXVtpXSAvIG4pLFxuICAgICAgICAgICAgICAgICAgICBjID0gZ3JvdXBzW251bV1baV0gJSBuO1xuICAgICAgICAgICAgICAgIG1pblIgPSBNYXRoLm1pbihtaW5SLCByKTtcbiAgICAgICAgICAgICAgICBtYXhSID0gTWF0aC5tYXgobWF4Uiwgcik7XG4gICAgICAgICAgICAgICAgbWluQyA9IE1hdGgubWluKG1pbkMsIGMpO1xuICAgICAgICAgICAgICAgIG1heEMgPSBNYXRoLm1heChtYXhDLCBjKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB5UmFuZ2UgPSBtYXhSIC0gbWluUiArIDEsXG4gICAgICAgICAgICAgICAgeFJhbmdlID0gbWF4QyAtIG1pbkMgKyAxO1xuICAgICAgICAgICAgLy8gQ3JlYXRlIHN1Ym1hdHJpeCBmcm9tIHRoZSBnbG9iYWwgbWF0cml4XG4gICAgICAgICAgICB2YXIgc3VibWF0ID0gZnJvbUZ1bmMoeVJhbmdlLCB4UmFuZ2UsIGZ1bmN0aW9uIChpLCBqKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdsb2JhbG1hdFtpICsgbWluUl1baiArIG1pbkNdO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBVcGRhdGUgZW50cmllcyBiZWxvbmdpbmcgdG8gcGl4ZWxzIGluIHRoaXMgY2h1bmtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBiZWdpbjsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHIgPSBNYXRoLmZsb29yKGdyb3Vwc1tudW1dW2ldIC8gbiksXG4gICAgICAgICAgICAgICAgICAgIGMgPSBncm91cHNbbnVtXVtpXSAlIG47XG4gICAgICAgICAgICAgICAgZ2xvYmFsbWF0W3JdW2NdID0gc3VibWF0W3IgLSBtaW5SXVtjIC0gbWluQ10gPSBNW3JdW2NdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBkcmF3IHRoaXMgc3VibWF0cml4IGluIHRoZSByaWdodCBzcG90IG9uIHRoZSBjYW52YXNcbiAgICAgICAgICAgIGN0eC5wdXRJbWFnZURhdGEodG9JbWFnZURhdGEoc3VibWF0KSwgbWluQywgbWluUik7XG5cbiAgICAgICAgICAgIC8vIFVwZGF0ZSBjb3VudGVycyBhbmQgZGVjaWRlIHdoZXRoZXIgdG8gY29udGludWVcbiAgICAgICAgICAgIGlkeCA9IGVuZDtcbiAgICAgICAgICAgIGlmIChpZHggPT09IGdyb3Vwc1tudW1dLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGlkeCA9IDA7XG4gICAgICAgICAgICAgICAgbnVtKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobnVtID09PSBncm91cHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZG9uZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZSAmJiBvbkNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZHJhd1BpeGVscyhsZWZ0b3Zlcik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBNYW5hZ2UgdGhlIHRpbWluZ3MgYW5kIGNhbGwgZHJhd1BpeGVscyBhcyBhcHByb3ByaWF0ZS5cbiAgICAgICAgZnVuY3Rpb24gYW5pbWF0b3IodDogbnVtYmVyKSB7XG4gICAgICAgICAgICBpZiAoc3RvcENhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgc3RvcENhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgZG9uZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZSAmJiBvbkNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGxhc3RUaW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAvLyBGaXJzdCB0aW1lIGFuaW1hdG9yIGlzIGNhbGxlZCwganVzdCByZWNvcmQgdGhlIHRpbWVcbiAgICAgICAgICAgICAgICBsYXN0VGltZSA9IHQ7XG4gICAgICAgICAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRvcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBjaHVua1NpemUgPSBNYXRoLnJvdW5kKCh0IC0gbGFzdFRpbWUpICogc3BlZWQpO1xuICAgICAgICAgICAgICAgIGlmIChjaHVua1NpemUgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGxhc3RUaW1lID0gdDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFkcmF3UGl4ZWxzKGNodW5rU2l6ZSkpIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0b3IpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIG5lZWQgbW9yZSB0aW1lIHRvIGVsYXBzZSBiZWZvcmUgZHJhd2luZ1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdG9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gU3RvcCB0aGUgYW5pbWF0aW9uIGFuZCByZWdpc3RlciBvblN0b3AgY2FsbGJhY2suIElmIGFuaW1hdGlvblxuICAgICAgICAvLyBhbHJlYWR5IGRvbmUsIGNhbGwgaXQgaW1tZWRpYXRlbHkuXG4gICAgICAgIGZ1bmN0aW9uIHN0b3Aob25TdG9wOiAoKSA9PiB2b2lkKSB7XG4gICAgICAgICAgICBzdG9wQ2FsbGJhY2sgPSBvblN0b3AgfHwgZnVuY3Rpb24gKCkge307XG4gICAgICAgICAgICBpZiAoZG9uZSkgc3RvcENhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQmVnaW4gYW5pbWF0aW5nLlxuICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdG9yKTtcbiAgICAgICAgcmV0dXJuIHsgc3RvcCB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIC8vIGV4cG9ydGVkIGZ1bmN0aW9ucyBvbiBDYW52YXMgb2JqZWN0c1xuICAgICAgICBsb2FkSW1hZ2UsXG4gICAgICAgIGdldEltYWdlLFxuICAgICAgICBnZXRJbWFnZURhdGEsXG4gICAgICAgIHJlbG9hZENhbnZhcyxcbiAgICAgICAgZ2V0Q29udGV4dCxcbiAgICAgICAgZ2V0RWxlbSxcbiAgICAgICAgYXV0b1Rvb24sXG4gICAgfTtcbn1cbiIsImltcG9ydCB7IGNvbnZvbHV0aW9uLCBmcm9tRnVuYywgTWF0LCBuZWlnaGJvcmhvb2QsIHplcm9zIH0gZnJvbSAnLi9tYXRyaXgnO1xuaW1wb3J0IHsgY2xhbXAgfSBmcm9tICcuL3V0aWwnO1xuXG4vKipcbiAqIFJldHVybiBuZXcgbWF0cml4IHdoZXJlIGVhY2ggZWxlbWVudCBpcyAyNTUgLSBvbGQgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludmVydGVkKE06IE1hdCk6IE1hdCB7XG4gICAgcmV0dXJuIGZyb21GdW5jKE0ubGVuZ3RoLCBNWzBdLmxlbmd0aCwgZnVuY3Rpb24gKGksIGopIHtcbiAgICAgICAgcmV0dXJuIDI1NSAtIE1baV1bal07XG4gICAgfSk7XG59XG5cbi8qKlxuICogQXBwbHkgYSBHYXVzc2lhbiBibHVyIG1hc2sgdG8gdGhlIGltYWdlIG1hdHJpeCBNIHdpdGggZ2l2ZW4gcmFkaXVzIGFuZFxuICogc2lnbWEuIFJldHVybiB0aGUgbmV3LCBibHVycmVkIG1hdHJpeC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdhdXNzaWFuTWFzayhNOiBNYXQsIHJhZGl1czogbnVtYmVyLCBzaWdtYTogbnVtYmVyKTogTWF0IHtcbiAgICAvLyBjb25zdHJ1Y3QgdGhlIGJsdXIga2VybmVsXG4gICAgdmFyIGsgPSAyICogcmFkaXVzICsgMSxcbiAgICAgICAgbWVhbiA9IGsgLyAyLFxuICAgICAgICBzdW0gPSAwLFxuICAgICAgICBrZXJuZWwgPSBmcm9tRnVuYyhrLCBrLCBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICBNYXRoLmV4cChcbiAgICAgICAgICAgICAgICAgICAgLTAuNSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAoTWF0aC5wb3coKHggLSBtZWFuKSAvIHNpZ21hLCAyKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5wb3coKHkgLSBtZWFuKSAvIHNpZ21hLCAyKSlcbiAgICAgICAgICAgICAgICApIC9cbiAgICAgICAgICAgICAgICAoMiAqIE1hdGguUEkgKiBzaWdtYSAqIHNpZ21hKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgLy8gY29tcHV0ZSBzdW1cbiAgICBmb3IgKHZhciB4ID0gMDsgeCA8IGs7IHgrKykgZm9yICh2YXIgeSA9IDA7IHkgPCBrOyB5KyspIHN1bSArPSBrZXJuZWxbeF1beV07XG4gICAgLy8gbm9ybWFsaXplXG4gICAgZm9yICh2YXIgeCA9IDA7IHggPCBrOyB4KyspIGZvciAodmFyIHkgPSAwOyB5IDwgazsgeSsrKSBrZXJuZWxbeF1beV0gLz0gc3VtO1xuICAgIHJldHVybiBjb252b2x1dGlvbihrZXJuZWwsIE0sIDAsIDI1NSk7XG59XG5cbi8qKlxuICogQXBwbHkgYW4gaW1hZ2Ugc2hhcnBlbmluZyBtYXNrIHRvIHRoZSBtYXRyaXggTS4gUmV0dXJuIHRoZSBuZXcgbWF0cml4LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2hhcnBlbk1hc2soTTogTWF0KTogTWF0IHtcbiAgICByZXR1cm4gY29udm9sdXRpb24oXG4gICAgICAgIFtcbiAgICAgICAgICAgIFswLCAtMSwgMF0sXG4gICAgICAgICAgICBbLTEsIDUsIC0xXSxcbiAgICAgICAgICAgIFswLCAtMSwgMF0sXG4gICAgICAgIF0sXG4gICAgICAgIE0sXG4gICAgICAgIDAsXG4gICAgICAgIDI1NVxuICAgICk7XG59XG5cbi8qKlxuICogSW50ZXJwb2xhdGUgdGhlIHZhbHVlIG9mIHRoZSBuZWlnaGJvciBhdCBhbmdsZSByYWRpYW5zIGZyb20gaSwgaiBpbiBNLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGVOZWlnaGJvcihcbiAgICBNOiBNYXQsXG4gICAgaTogbnVtYmVyLFxuICAgIGo6IG51bWJlcixcbiAgICBhbmdsZTogbnVtYmVyXG4pOiBudW1iZXIge1xuICAgIC8vIFdlIHRyYW5zZm9ybSBhbmdsZSBmcm9tIFswLCAycGkpIHRvIFswLCA4KSwgc28gMSByYWRpYW4gOiA0NSBkZWdyZWVzXG4gICAgLy8gc28gZmxvb3JpbmcgdGhpcyB2YWx1ZSBnaXZlcyB1cyBkaXJlY3Rpb24gb2YgdGhlIHByZXZpb3VzIHZhbHVlLCBhbmRcbiAgICAvLyBjZWlsLWluZyB0aGlzIHZhbHVlIGdpdmVzIHVzIHRoZSBuZXh0IHZhbHVlIG1vZCA4IGluIHRoZVxuICAgIC8vIG5laWdoYm9yaG9vZCB0aGVuIHdlIGNhbiBpbmRleCBpbnRvIHRoZSBuZWlnaGJvcmhvb2QgYnkgbnVtYmVyaW5nOlxuICAgIC8vIDMgICAyICAgMSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICgtMSwtMSkgICgtMSwgMCkgICgtMSwgMSlcbiAgICAvLyA0ICAgLSAgIDAgICB0aGVuIGRlZmluZSB0aGUgbWFwcGluZyB0byAgICAoMCwgLTEpICAgICAtICAgICAoIDAsIDEpXG4gICAgLy8gNSAgIDYgICA3ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDEsIC0xKSAgKCAxLCAwKSAgKCAxLCAxKVxuXG4gICAgLy8gRmluZCB2YWx1ZSBvZiBuZWlnaGJvciB0byBpLCBqIGluIE0gaW4gb2N0YW50IG8gaW4gWzAsIDgpXG4gICAgZnVuY3Rpb24gb2N0YW50VG9OZWlnaGJvcihvOiBudW1iZXIpIHtcbiAgICAgICAgLy8gcmVtYXJrIGR5KG8pID09IGR4KG8rMik7IHRoaXMgbWFwIHJldHVybnMgdGhlIGR5IHZhbHVlXG4gICAgICAgIHZhciBtYXAgPSBmdW5jdGlvbiAoeDogbnVtYmVyKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKHggJSA4KSB7XG4gICAgICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICAgICAgY2FzZSA2OlxuICAgICAgICAgICAgICAgIGNhc2UgNzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBNW2kgKyBtYXAobyldW2ogKyBtYXAobyArIDIpXTtcbiAgICB9XG4gICAgdmFyIG9jdGFudCA9IChhbmdsZSAqIDQpIC8gTWF0aC5QSSxcbiAgICAgICAgcmF0aW8gPSBvY3RhbnQgJSAxLCAvLyBVc2UgYSB0cmljayB0byBnZXQgZGVjaW1hbCBwYXJ0IG9mIG9jdGFudFxuICAgICAgICBwcmV2ID0gb2N0YW50VG9OZWlnaGJvcihNYXRoLmZsb29yKG9jdGFudCkpLFxuICAgICAgICBuZXh0ID0gb2N0YW50VG9OZWlnaGJvcihNYXRoLmNlaWwob2N0YW50KSk7XG4gICAgcmV0dXJuIHJhdGlvICogcHJldiArICgxIC0gcmF0aW8pICogbmV4dDtcbn1cblxuLyoqXG4gKiBBcHBseSBhIHNvYmVsIG9wZXJhdG9yIHRvIHRoZSBnaXZlbiBncmF5c2NhbGUgaW1hZ2UgZGF0YSBtYXRyaXgsIGFzc3VtZWQgdG9cbiAqIGJlIGluIGdyYXlzY2FsZSwgYW5kIHJldHVybiB0aGUgcmVzdWx0IG1hdHJpeCBTIGFuZCBncmFkaWVudCBtYXRyaXggRy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNvYmVsTWFzayhNOiBNYXQpOiB7IFM6IE1hdDsgRzogTWF0IH0ge1xuICAgIC8vIGdyYWRpZW50IGFwcHJveGltYXRpb24gbWFza3MgZm9yIHggYW5kIHkgZGlyZWN0aW9uc1xuICAgIHZhciBHeCA9IFtcbiAgICAgICAgICAgIFstMSwgMCwgMV0sXG4gICAgICAgICAgICBbLTIsIDAsIDJdLFxuICAgICAgICAgICAgWy0xLCAwLCAxXSxcbiAgICAgICAgXSxcbiAgICAgICAgR3kgPSBbXG4gICAgICAgICAgICBbMSwgMiwgMV0sXG4gICAgICAgICAgICBbMCwgMCwgMF0sXG4gICAgICAgICAgICBbLTEsIC0yLCAtMV0sXG4gICAgICAgIF0sXG4gICAgICAgIEN4ID0gY29udm9sdXRpb24oR3gsIE0pLFxuICAgICAgICBDeSA9IGNvbnZvbHV0aW9uKEd5LCBNKSxcbiAgICAgICAgQ3N1bSA9IGZyb21GdW5jKEN4Lmxlbmd0aCwgQ3hbMF0ubGVuZ3RoLCBmdW5jdGlvbiAoaSwgaikge1xuICAgICAgICAgICAgcmV0dXJuIGNsYW1wKE1hdGguYWJzKEN4W2ldW2pdKSArIE1hdGguYWJzKEN5W2ldW2pdKSwgMCwgMjU1KTtcbiAgICAgICAgfSksXG4gICAgICAgIEcgPSBmcm9tRnVuYyhDeC5sZW5ndGgsIEN4WzBdLmxlbmd0aCwgZnVuY3Rpb24gKGksIGopIHtcbiAgICAgICAgICAgIGlmIChDeFtpXVtqXSA9PT0gMCkgcmV0dXJuIEN5W2ldW2pdID8gTWF0aC5QSSAvIDIgOiAwO1xuICAgICAgICAgICAgcmV0dXJuIE1hdGguYXRhbihNYXRoLmFicyhDeVtpXVtqXSkgLyBNYXRoLmFicyhDeFtpXVtqXSkpO1xuICAgICAgICB9KTtcbiAgICByZXR1cm4geyBTOiBDc3VtLCBHOiBHIH07XG59XG5cbi8qKlxuICogQXBwbHkgYSBkaXNjcmV0ZSA1eDUgTGFwbGFjaWFuIG1hc2sgb24gTS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxhcGxhY2VNYXNrKE06IE1hdCk6IE1hdCB7XG4gICAgcmV0dXJuIGNvbnZvbHV0aW9uKFxuICAgICAgICBbXG4gICAgICAgICAgICBbLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgICAgICAgICAgIFstMSwgLTEsIC0xLCAtMSwgLTFdLFxuICAgICAgICAgICAgWy0xLCAtMSwgMjQsIC0xLCAtMV0sXG4gICAgICAgICAgICBbLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgICAgICAgICAgIFstMSwgLTEsIC0xLCAtMSwgLTFdLFxuICAgICAgICBdLFxuICAgICAgICBNLFxuICAgICAgICAwLFxuICAgICAgICAyNTVcbiAgICApO1xufVxuXG4vKipcbiAqIEdpdmVuIGltYWdlIG1hdHJpeCBNLCBncmFkaWVudCBtYXRyaXggRywgY29uc3RydWN0IGEgbmV3IGltYWdlIG1hdHJpeCB3aGVyZVxuICogZWRnZSBwb2ludHMgbHlpbmcgb24gbm9uLW1heGltYWwgZ3JhZGllbnRzIGFyZSBzZXQgdG8gMC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vbk1heFN1cHByZXNzaW9uKE06IE1hdCwgRzogTWF0KTogTWF0IHtcbiAgICByZXR1cm4gZnJvbUZ1bmMoTS5sZW5ndGgsIE1bMF0ubGVuZ3RoLCBmdW5jdGlvbiAoaSwgaikge1xuICAgICAgICAvLyBkb24ndCBzdXBwcmVzcyB0aGUgYm9yZGVyc1xuICAgICAgICBpZiAoaSA9PT0gMCB8fCBqID09PSAwIHx8IGkgPT09IE0ubGVuZ3RoIC0gMSB8fCBqID09PSBNWzBdLmxlbmd0aCAtIDEpXG4gICAgICAgICAgICByZXR1cm4gTVtpXVtqXTtcbiAgICAgICAgLy8gcHJldmlvdXMgYW5kIG5leHQgdmFsdWVzIGFsb25nIHRoZSBhcHByb3hpbWF0ZWQgZ3JhZGllbnRcbiAgICAgICAgdmFyIHByZXYgPSBpbnRlcnBvbGF0ZU5laWdoYm9yKE0sIGksIGosIEdbaV1bal0pLFxuICAgICAgICAgICAgbmV4dCA9IGludGVycG9sYXRlTmVpZ2hib3IoTSwgaSwgaiwgTWF0aC5QSSArIEdbaV1bal0pO1xuICAgICAgICBpZiAoTVtpXVtqXSA8IHByZXYgfHwgTVtpXVtqXSA8IG5leHQpXG4gICAgICAgICAgICAvLyBzdXBwcmVzcyB0byAwIHNpbmNlIGl0J3Mgbm9uLW1heGltdW1cbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICByZXR1cm4gTVtpXVtqXTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBFc3RpbWF0ZSB1cHBlciBhbmQgbG93ZXIgaHlzdGVyZXNpcyB0aHJlc2hvbGRzLCByZXR1cm5pbmcge2hpOiBudW0sIGxvOlxuICogbnVtfSwgd2hlcmUgaGlnaF9wZXJjZW50YWdlIGlzIHRoZSBwZXJjZW50YWdlIG9mIHBpeGVscyB0aGF0IHdpbGwgbWVldFxuICogaGksIGFuZCBsb3dfcGVyY2VudGFnZSBpcyB0aGUgcmF0aW8gb2YgbG8gdG8gaGkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlc3RpbWF0ZVRocmVzaG9sZChcbiAgICBNOiBNYXQsXG4gICAgaGlnaF9wZXJjZW50YWdlOiBudW1iZXIsXG4gICAgbG93X3BlcmNlbnRhZ2U6IG51bWJlclxuKSB7XG4gICAgdmFyIGhpc3RvZ3JhbSA9IHplcm9zKDEsIDI1NilbMF0sIC8vIGxlbmd0aCAyNTYgYXJyYXkgb2YgemVyb3NcbiAgICAgICAgbSA9IE0ubGVuZ3RoLFxuICAgICAgICBuID0gTVswXS5sZW5ndGg7XG4gICAgLy8gQ29uc3RydWN0IGhpc3RvZ3JhbSBvZiBwaXhlbCB2YWx1ZXNcbiAgICBNLmZvckVhY2goKHIpID0+IHtcbiAgICAgICAgci5mb3JFYWNoKChlKSA9PiB7XG4gICAgICAgICAgICBoaXN0b2dyYW1bZV0rKztcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgLy8gQ29tcHV0ZSBudW1iZXIgb2YgcGl4ZWxzIHdlIHdhbnQgdG8gdGFyZ2V0LlxuICAgIHZhciBwaXhlbHMgPSAobSAqIG4gLSBoaXN0b2dyYW1bMF0pICogaGlnaF9wZXJjZW50YWdlLFxuICAgICAgICBoaWdoX2N1dG9mZiA9IDAsXG4gICAgICAgIGkgPSBoaXN0b2dyYW0ubGVuZ3RoLFxuICAgICAgICBqID0gMTtcbiAgICB3aGlsZSAoaGlnaF9jdXRvZmYgPCBwaXhlbHMpIGhpZ2hfY3V0b2ZmICs9IGhpc3RvZ3JhbVtpLS1dO1xuICAgIC8vIEluY3JlbWVudCBqIHVwIHRvIGZpcnN0IG5vbi16ZXJvIGZyZXF1ZW5jeSAoc28gd2UgaWdub3JlIHRob3NlKS5cbiAgICB3aGlsZSAoaGlzdG9ncmFtW2pdID09PSAwKSBqKys7XG4gICAgaiArPSBpICogbG93X3BlcmNlbnRhZ2U7XG4gICAgLy8gaiA9IChpICogbG93X3BlcmNlbnRhZ2UgKyBqKSAqIGxvd19wZXJjZW50YWdlO1xuICAgIHJldHVybiB7IGhpOiBpLCBsbzogaiB9O1xufVxuXG4vKipcbiAqIEFwcGx5IGh5c3RlcmVzaXMgdG8gdHJhY2UgZWRnZXMgd2l0aCBnaXZlbiBsb3dlciBhbmQgdXBwZXIgdGhyZXNob2xkc1xuICogYW5kIHJldHVybiB0aGUgcmVzdWx0aW5nIG1hdHJpeC4gVGhpcyB0aGlucyBlZGdlcyBieSBvbmx5IGtlZXBpbmcgcG9pbnRzXG4gKiBjb25uZWN0ZWQgdG8gXCJzdHJvbmdcIiBlZGdlcywgYXMgZGVmaW5lZCBieSB0aGUgdGhyZXNob2xkIGZ1bmN0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaHlzdGVyZXNpcyhNOiBNYXQsIGhpZ2hfcGVyY2VudGFnZTogbnVtYmVyLCBsb3dfcGVyY2VudGFnZTogbnVtYmVyKSB7XG4gICAgdmFyIHRocmVzaG9sZCA9IGVzdGltYXRlVGhyZXNob2xkKE0sIGhpZ2hfcGVyY2VudGFnZSwgbG93X3BlcmNlbnRhZ2UpLFxuICAgICAgICBtID0gTS5sZW5ndGgsXG4gICAgICAgIG4gPSBNWzBdLmxlbmd0aCxcbiAgICAgICAgcmVhbEVkZ2VzID0gemVyb3MobSwgbik7IC8vIDAgaWYgbm90IGNvbm5lY3RlZCB0byByZWFsIGVkZ2UsIDEgaWYgaXNcbiAgICAvLyBSZXR1cm4gYXJyYXkgb2YgbmVpZ2hib3JzIG9mIE1baV1bal0gd2hlcmUgTVtuXSA+PSB0aHJlc2hvbGQubG8uXG4gICAgZnVuY3Rpb24gY29sbGVjdE5laWdoYm9ycyhpOiBudW1iZXIsIGo6IG51bWJlcikge1xuICAgICAgICB2YXIgc3RhY2sgPSBbaSAqIG4gKyBqXTtcbiAgICAgICAgcmVhbEVkZ2VzW2ldW2pdID0gTVtpXVtqXTtcbiAgICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHZhciB2ID0gc3RhY2sucG9wKCk7XG4gICAgICAgICAgICBuZWlnaGJvcmhvb2QoTSwgTWF0aC5mbG9vcih2IC8gbiksIHYgJSBuLCAodmFsLCByLCBjKSA9PiB7XG4gICAgICAgICAgICAgICAgdmFyIHBvcyA9IHIgKiBuICsgYztcbiAgICAgICAgICAgICAgICBpZiAodmFsID49IHRocmVzaG9sZC5sbyAmJiAhcmVhbEVkZ2VzW3JdW2NdKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlYWxFZGdlc1tyXVtjXSA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaChwb3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbTsgaSsrKSB7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbjsgaisrKSB7XG4gICAgICAgICAgICAvLyBXZSBjb25zaWRlciB0aGF0IHRoZXNlIGFyZSBcInN0cm9uZ1wiIHBpeGVscywgdGhlbiB3ZSB0cmFjZVxuICAgICAgICAgICAgLy8gdGhlIGVkZ2UgdGhhdCB0aGV5IGFyZSBwYXJ0IG9mLiBBbHNvIHdlIHNraXAgYW55IHBpeGVscyB3ZVxuICAgICAgICAgICAgLy8gaGF2ZSBhbHJlYWR5IG1hcmtlZCBhcyByZWFsXG4gICAgICAgICAgICBpZiAoTVtpXVtqXSA+PSB0aHJlc2hvbGQuaGkgJiYgIXJlYWxFZGdlc1tpXVtqXSkge1xuICAgICAgICAgICAgICAgIGNvbGxlY3ROZWlnaGJvcnMoaSwgaik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlYWxFZGdlcztcbn1cbiIsImltcG9ydCB7IGNsYW1wIH0gZnJvbSAnLi91dGlsJztcblxuZXhwb3J0IHR5cGUgTWF0ID0gbnVtYmVyW11bXTtcblxuLyoqXG4gKiBDb25zdHJ1Y3QgYSBtYXRyaXggZnJvbSBhIGdlbmVyYXRvciBmdW5jdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZyb21GdW5jKFxuICAgIG06IG51bWJlcixcbiAgICBuOiBudW1iZXIsXG4gICAgZnVuYzogKGk6IG51bWJlciwgajogbnVtYmVyKSA9PiBudW1iZXJcbik6IE1hdCB7XG4gICAgdmFyIG1hdHJpeCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbTsgaSsrKSB7XG4gICAgICAgIG1hdHJpeC5wdXNoKFtdKTtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBuOyBqKyspIHtcbiAgICAgICAgICAgIG1hdHJpeFtpXS5wdXNoKGZ1bmMoaSwgaikpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtYXRyaXg7XG59XG5cbi8qKlxuICogQ29uc3RydWN0IG4gYnkgbSBtYXRyaXggb2YgemVyb3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB6ZXJvcyhtOiBudW1iZXIsIG46IG51bWJlcik6IE1hdCB7XG4gICAgcmV0dXJuIGZyb21GdW5jKG0sIG4sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfSk7XG59XG5cbi8qKlxuICogVHJhdmVyc2UgdGhlIGluLWJvdW5kcyBuZWlnaGJvcmhvb2Qgb2YgZ2l2ZW4gcG9zaXRpb24sIGluY2x1ZGluZyBpdHNlbGYuXG4gKiBDYWxsIGZ1bmModmFsLCByLCBjKSBmb3IgZWFjaCBuZWlnaGJvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5laWdoYm9yaG9vZChcbiAgICBNOiBNYXQsXG4gICAgaTogbnVtYmVyLFxuICAgIGo6IG51bWJlcixcbiAgICBmdW5jOiAodmFsOiBudW1iZXIsIHI6IG51bWJlciwgYzogbnVtYmVyKSA9PiB2b2lkXG4pIHtcbiAgICB2YXIgbSA9IE0ubGVuZ3RoLFxuICAgICAgICBuID0gTVswXS5sZW5ndGg7XG4gICAgZm9yICh2YXIgciA9IGNsYW1wKGkgLSAxLCAwKTsgciA8PSBjbGFtcChpICsgMSwgMCwgbSAtIDEpOyByKyspXG4gICAgICAgIGZvciAodmFyIGMgPSBjbGFtcChqIC0gMSwgMCk7IGMgPD0gY2xhbXAoaiArIDEsIDAsIG4gLSAxKTsgYysrKVxuICAgICAgICAgICAgZnVuYyhNW3JdW2NdLCByLCBjKTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYW4gSW1hZ2VEYXRhIG9iamVjdCBmcm9tIGEgZ3JheXNjYWxlIG1hdHJpeCwgd2l0aCBhIGdpdmVuIG9wdGlvbmFsXG4gKiBvcmlnaW5hbCBJbWFnZURhdGEgZnJvbSB3aGljaCB0aGUgbWF0cml4IHdhcyBjcmVhdGVkICh0byByZWNvdmVyIGFscGhhXG4gKiB2YWx1ZXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9JbWFnZURhdGEoTTogTWF0LCBvcmlnaW5hbERhdGE/OiBJbWFnZURhdGEpOiBJbWFnZURhdGEge1xuICAgIHZhciBtID0gTS5sZW5ndGgsXG4gICAgICAgIG4gPSBNWzBdLmxlbmd0aCxcbiAgICAgICAgbmV3RGF0YSA9IG5ldyBJbWFnZURhdGEobmV3IFVpbnQ4Q2xhbXBlZEFycmF5KG0gKiBuICogNCksIG4sIG0pO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbSAqIG47IGkrKykge1xuICAgICAgICB2YXIgciA9IE1hdGguZmxvb3IoaSAvIG4pLFxuICAgICAgICAgICAgYyA9IGkgJSBuO1xuICAgICAgICAvLyByLCBnLCBiIHZhbHVlc1xuICAgICAgICBuZXdEYXRhLmRhdGFbNCAqIGldID0gbmV3RGF0YS5kYXRhWzQgKiBpICsgMV0gPSBuZXdEYXRhLmRhdGFbNCAqIGkgKyAyXSA9XG4gICAgICAgICAgICBNW3JdW2NdO1xuICAgICAgICAvLyBzZXQgYWxwaGEgY2hhbm5lbCBpZiBvcmlnaW5hbERhdGEgaXMgZ2l2ZW4uXG4gICAgICAgIG5ld0RhdGEuZGF0YVs0ICogaSArIDNdID0gb3JpZ2luYWxEYXRhID8gb3JpZ2luYWxEYXRhLmRhdGFbNCAqIGkgKyAzXSA6IDI1NTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld0RhdGE7XG59XG5cbi8qKlxuICogVHJpbSBsIGNvbHVtbnMgZnJvbSBsZWZ0LCByIGNvbHVtbnMgZnJvbSByaWdodCwgdCByb3dzIGZyb20gdG9wLCBhbmQgYiByb3dzXG4gKiBmcm9tIGJvdHRvbSBvZiBNIGFuZCByZXR1cm4gYXMgYSBuZXcgbWF0cml4LiBEb2VzIG5vdCBtb2RpZnkgTS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyaW1Cb3JkZXIoTTogTWF0LCBsOiBudW1iZXIsIHI6IG51bWJlciwgdDogbnVtYmVyLCBiOiBudW1iZXIpOiBNYXQge1xuICAgIHZhciByZXQ6IG51bWJlcltdW10gPSBbXTtcbiAgICBNLnNsaWNlKHQsIE0ubGVuZ3RoIC0gYikuZm9yRWFjaCgocm93KSA9PiB7XG4gICAgICAgIHJldC5wdXNoKHJvdy5zbGljZShsLCByb3cubGVuZ3RoIC0gcikpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXQ7XG59XG5cbi8qKlxuICogQXBwbHkgZGlzY3JldGUgY29udm9sdXRpb24gd2l0aCBnaXZlbiBweHEgbWFzayB0byB0aGUgZ2l2ZW4gbWF0cml4LCB3aGVyZSBwXG4gKiBhbmQgcSBhcmUgb2RkLCBhbmQgYSBtYXRyaXggaXMgYW4gYXJyYXkgb2YgYXJyYXlzIG9mIG51bWJlcnMuIFJldHVybiBhIG5ld1xuICogbWF0cml4IG9mIHNsaWdodGx5IHNtYWxsZXIgc2l6ZSwgd2hlcmUgZWFjaCBlbGVtZW50IGlzIHRoZSBvdXRwdXQgb2YgdGhlXG4gKiBtYXNrIG9wZXJhdG9yIGNlbnRlcmVkIGF0IHRoYXQgcG9pbnQgYW5kIGVkZ2VzIGFyZSB0cmltbWVkIHdoZXJlIHRoZVxuICogb3BlcmF0b3IgY291bGQgbm90IGJlIGFwcGxpZWQsIGNsYW1wZWQgdG8gbGIgYW5kIHViIGlmIHByb3ZpZGVkIGFuZCByb3VuZGVkXG4gKiB0byB0aGUgbmVhcmVzdCBpbnRlZ2VyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udm9sdXRpb24oa2VybmVsOiBNYXQsIG1hdHJpeDogTWF0LCBsYj86IG51bWJlciwgdWI/OiBudW1iZXIpIHtcbiAgICB2YXIgcCA9IGtlcm5lbC5sZW5ndGgsXG4gICAgICAgIHEgPSBrZXJuZWxbMF0ubGVuZ3RoLFxuICAgICAgICBtID0gbWF0cml4Lmxlbmd0aCxcbiAgICAgICAgbiA9IG1hdHJpeFswXS5sZW5ndGgsXG4gICAgICAgIHJZID0gKHAgLSAxKSAvIDIsXG4gICAgICAgIHJYID0gKHEgLSAxKSAvIDI7XG4gICAgcmV0dXJuIHRyaW1Cb3JkZXIoXG4gICAgICAgIGZyb21GdW5jKG0sIG4sIGZ1bmN0aW9uIChpLCBqKSB7XG4gICAgICAgICAgICBpZiAoaSA8IHJZIHx8IGkgPj0gbSAtIHJZIHx8IGogPCByWCB8fCBqID49IG4gLSByWClcbiAgICAgICAgICAgICAgICAvLyBjYW4ndCBhcHBseSB0aGUgb3BlcmF0b3IgdG9vIGNsb3NlIHRvIHRoZSBib3VuZGFyaWVzXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICB2YXIgc3VtID0gMDtcbiAgICAgICAgICAgIGZvciAodmFyIGEgPSAtclk7IGEgPD0gclk7IGErKylcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBiID0gLXJYOyBiIDw9IHJYOyBiKyspXG4gICAgICAgICAgICAgICAgICAgIHN1bSArPSBrZXJuZWxbYSArIHJZXVtiICsgclhdICogbWF0cml4W2kgKyBhXVtqICsgYl07XG4gICAgICAgICAgICByZXR1cm4gY2xhbXAoTWF0aC5yb3VuZChzdW0pLCBsYiwgdWIpO1xuICAgICAgICB9KSxcbiAgICAgICAgclgsXG4gICAgICAgIHJYLFxuICAgICAgICByWSxcbiAgICAgICAgcllcbiAgICApO1xufVxuIiwiaW1wb3J0IHsgZnJvbUZ1bmMgfSBmcm9tICcuL21hdHJpeCc7XG5cbi8qKlxuICogQ2xhbXAgbnVtIHRvIHRoZSByYW5nZSBbbG8saGldLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xhbXAobnVtOiBudW1iZXIsIGxvPzogbnVtYmVyLCBoaT86IG51bWJlcikge1xuICAgIGxvID0gbG8gPT09IHVuZGVmaW5lZCA/IC1JbmZpbml0eSA6IGxvO1xuICAgIGhpID0gaGkgPT09IHVuZGVmaW5lZCA/IEluZmluaXR5IDogaGk7XG4gICAgaWYgKG51bSA8IGxvKSB7XG4gICAgICAgIHJldHVybiBsbztcbiAgICB9IGVsc2UgaWYgKG51bSA+IGhpKSB7XG4gICAgICAgIHJldHVybiBoaTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVtO1xuICAgIH1cbn1cblxuLyoqXG4gKiBHZXQgdGhlIHJnYmEgdmFsdWUgb2YgcGl4ZWwgaSBpbiBnaXZlbiBpbWFnZSBkYXRhLlxuICogSWYgaSBpcyBvdXQgb2YgYm91bmRzLCB0aGVuIHJldHVybiAoMCwwLDAsMCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQaXhlbChpbWFnZURhdGE6IEltYWdlRGF0YSwgaTogbnVtYmVyKSB7XG4gICAgcmV0dXJuIGkgPCBpbWFnZURhdGEuZGF0YS5sZW5ndGhcbiAgICAgICAgPyB7XG4gICAgICAgICAgICAgIHI6IGltYWdlRGF0YS5kYXRhW2ldLFxuICAgICAgICAgICAgICBnOiBpbWFnZURhdGEuZGF0YVtpICsgMV0sXG4gICAgICAgICAgICAgIGI6IGltYWdlRGF0YS5kYXRhW2kgKyAyXSxcbiAgICAgICAgICAgICAgYTogaW1hZ2VEYXRhLmRhdGFbaSArIDNdLFxuICAgICAgICAgIH1cbiAgICAgICAgOiB7IHI6IDAsIGc6IDAsIGI6IDAsIGE6IDAgfTtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIGdyYXlzY2FsZSB2YWx1ZSBvZiBnaXZlbiByZ2IgcGl4ZWwuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBncmF5U2NhbGUocGl4ZWw6IHsgcjogbnVtYmVyOyBnOiBudW1iZXI7IGI6IG51bWJlcjsgYT86IG51bWJlciB9KSB7XG4gICAgcmV0dXJuIDAuMyAqIHBpeGVsLnIgKyAwLjU5ICogcGl4ZWwuZyArIDAuMTEgKiBwaXhlbC5iO1xufVxuXG4vKipcbiAqIFR1cm4gaW1hZ2VEYXRhIGludG8gYSB0d28tZGltZW5zaW9uYWwgd2lkdGggeCBoZWlnaHQgbWF0cml4IG9mIFswLCAyNTVdXG4gKiBpbnRlZ2VycyBvZiBncmF5c2NhbGUgdmFsdWVzIG9mIGVhY2ggcGl4ZWwuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b01hdHJpeChpbWFnZURhdGE6IEltYWdlRGF0YSkge1xuICAgIHJldHVybiBmcm9tRnVuYyhpbWFnZURhdGEuaGVpZ2h0LCBpbWFnZURhdGEud2lkdGgsIGZ1bmN0aW9uIChyLCBjKSB7XG4gICAgICAgIHJldHVybiBncmF5U2NhbGUoZ2V0UGl4ZWwoaW1hZ2VEYXRhLCA0ICogKHIgKiBpbWFnZURhdGEud2lkdGggKyBjKSkpO1xuICAgIH0pO1xufVxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgQ2FudmFzLCB7IENhbnZhc1R5cGUgfSBmcm9tICcuL2NhbnZhcyc7XG5pbXBvcnQge1xuICAgIGdhdXNzaWFuTWFzayxcbiAgICBzb2JlbE1hc2ssXG4gICAgbm9uTWF4U3VwcHJlc3Npb24sXG4gICAgaHlzdGVyZXNpcyxcbiAgICBpbnZlcnRlZCxcbiAgICBzaGFycGVuTWFzayxcbiAgICBsYXBsYWNlTWFzayxcbn0gZnJvbSAnLi9maWx0ZXJzJztcbmltcG9ydCB7IE1hdCwgdG9JbWFnZURhdGEgfSBmcm9tICcuL21hdHJpeCc7XG5pbXBvcnQgeyB0b01hdHJpeCwgY2xhbXAgfSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCBnZXRNYXhXaWR0aCA9ICgpID0+XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoIC0gMjA7XG5jb25zdCBnZXRNYXhIZWlnaHQgPSAoKSA9PiB3aW5kb3cuc2NyZWVuLmhlaWdodCAtIDUwO1xuY29uc3QgZ2V0TWF4U2l6ZSA9ICgpID0+IDkwMDAwMDtcblxuY29uc3QgJGRlbW9DYW52YXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxDYW52YXNFbGVtZW50PignI2RlbW9DYW52YXMnKTtcbmNvbnN0ICRmaWxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MSW5wdXRFbGVtZW50PignI2ZpbGUnKTtcbmNvbnN0ICRkcmFnRHJvcCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTERpdkVsZW1lbnQ+KCcjZHJhZ2Ryb3AnKTtcbmNvbnN0ICRmaW5kRWRnZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxCdXR0b25FbGVtZW50PignI2ZpbmQtZWRnZXMnKTtcbmNvbnN0ICRtb3JlRWRnZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxCdXR0b25FbGVtZW50PignI21vcmUtZWRnZXMnKTtcbmNvbnN0ICRsZXNzRWRnZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxCdXR0b25FbGVtZW50PignI2xlc3MtZWRnZXMnKTtcbmNvbnN0ICRhdXRvdG9vbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+KCcjYXV0b3Rvb24nKTtcbmNvbnN0ICRhdXRvdG9vbkdyb3VwID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MRGl2RWxlbWVudD4oJyNhdXRvdG9vbkdyb3VwJyk7XG5jb25zdCAkdG9vblNwZWVkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MSW5wdXRFbGVtZW50PignI3Rvb25fc3BlZWQnKTtcbmNvbnN0ICR0b29uRGlyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MSW5wdXRFbGVtZW50PignI3Rvb25fZGlyJyk7XG5jb25zdCAkdG9vblNvcnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxJbnB1dEVsZW1lbnQ+KCcjdG9vbl9zb3J0Jyk7XG5jb25zdCAkcmVzZXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxJbnB1dEVsZW1lbnQ+KCcjcmVzZXQnKTtcblxubGV0IHNoYXJwZW5MZXZlbCA9IDA7XG5sZXQgYzogQ2FudmFzVHlwZTtcbnZhciBvcmlnaW5hbERhdGE6IEltYWdlRGF0YSwgLy8gb3JpZ2luYWwgaW1hZ2UgZGF0YVxuICAgIG9yaWdpbmFsTWF0cml4OiBNYXQsIC8vIG9yaWdpbmFsIGltYWdlIG1hdHJpeCBpbiBncmF5c2NhbGVcbiAgICBjdXJyZW50TWF0cml4OiBNYXQsIC8vIGN1cnJlbnQgZ3JheXNjYWxlIG1hdHJpeCBkaXNwbGF5ZWRcbiAgICBjdXJyZW50U29iZWw6IHsgUzogTWF0OyBHOiBNYXQgfSwgLy8gbGFzdCByZXN1bHQgb2Ygc29iZWwgbWFza1xuICAgIGN1cnJlbnRUb29uOiB7IHN0b3A6IChvblN0b3A6ICgpID0+IHZvaWQpID0+IHZvaWQgfSwgLy8gY3VycmVudGx5IGFuaW1hdGluZyBhdXRvdG9vblxuICAgIC8vIG1hdHJpeCB0cmF2ZXJzYWwgb3JkZXJzXG4gICAgaXRlcmF0b3JzID0ge1xuICAgICAgICB0b3A6IGZ1bmN0aW9uIChNOiBNYXQsIGNiOiAoYXJnMDogbnVtYmVyLCBhcmcxOiBudW1iZXIpID0+IHZvaWQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgTS5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IE1bMF0ubGVuZ3RoOyBqKyspIGNiKGksIGopO1xuICAgICAgICB9LFxuICAgICAgICBib3R0b206IGZ1bmN0aW9uIChNOiBNYXQsIGNiOiAoYXJnMDogbnVtYmVyLCBhcmcxOiBudW1iZXIpID0+IHZvaWQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBNLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgTVswXS5sZW5ndGg7IGorKykgY2IoaSwgaik7XG4gICAgICAgIH0sXG4gICAgICAgIGxlZnQ6IGZ1bmN0aW9uIChNOiBNYXQsIGNiOiAoYXJnMDogbnVtYmVyLCBhcmcxOiBudW1iZXIpID0+IHZvaWQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgTVswXS5sZW5ndGg7IGorKylcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IE0ubGVuZ3RoOyBpKyspIGNiKGksIGopO1xuICAgICAgICB9LFxuICAgICAgICByaWdodDogZnVuY3Rpb24gKE06IE1hdCwgY2I6IChhcmcwOiBudW1iZXIsIGFyZzE6IG51bWJlcikgPT4gdm9pZCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IE1bMF0ubGVuZ3RoIC0gMTsgaiA+PSAwOyBqLS0pXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBNLmxlbmd0aDsgaSsrKSBjYihpLCBqKTtcbiAgICAgICAgfSxcbiAgICB9O1xuXG4vLyBSZWxvYWQgdGhlIGNhbnZhcyB3aXRoIGN1cnJlbnQgbWF0cml4IGRhdGEgYW5kIHN0b3AgYW55IGFuaW1hdGlvbi5cbmZ1bmN0aW9uIHJlbG9hZCgpIHtcbiAgICBmdW5jdGlvbiB1cGRhdGUoKSB7XG4gICAgICAgIGMucmVsb2FkQ2FudmFzKHRvSW1hZ2VEYXRhKGN1cnJlbnRNYXRyaXgsIG9yaWdpbmFsRGF0YSkpO1xuICAgIH1cbiAgICBpZiAoY3VycmVudFRvb24pIHtcbiAgICAgICAgY3VycmVudFRvb24uc3RvcCh1cGRhdGUpO1xuICAgICAgICBjdXJyZW50VG9vbiA9IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdXBkYXRlKCk7XG4gICAgfVxufVxuXG4vLyBTZXQgb3VyIGdsb2JhbCB2YXJpYWJsZXMgZnJvbSB3aGF0IGlzIG9uIHRoZSBjYW52YXMuXG5mdW5jdGlvbiBzZXRGaWVsZHMoKSB7XG4gICAgb3JpZ2luYWxEYXRhID0gYy5nZXRJbWFnZURhdGEoKTtcbiAgICBvcmlnaW5hbE1hdHJpeCA9IHRvTWF0cml4KG9yaWdpbmFsRGF0YSk7XG4gICAgY3VycmVudE1hdHJpeCA9IG9yaWdpbmFsTWF0cml4O1xufVxuXG5mdW5jdGlvbiByZXNldChoaWRlQWdhaW46IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgIGlmICghb3JpZ2luYWxEYXRhKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc2hhcnBlbkxldmVsID0gMDtcbiAgICByZWxvYWQoKTtcbiAgICBjLnJlbG9hZENhbnZhcyhvcmlnaW5hbERhdGEpO1xuICAgIGN1cnJlbnRNYXRyaXggPSBvcmlnaW5hbE1hdHJpeDtcbiAgICBpZiAoaGlkZUFnYWluKSB7XG4gICAgICAgICRtb3JlRWRnZXMuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgJGxlc3NFZGdlcy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAkYXV0b3Rvb25Hcm91cC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIH1cbn1cblxuJGRyYWdEcm9wLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gJGZpbGUuY2xpY2soKSk7XG4kZHJhZ0Ryb3AuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ2VudGVyJywgKGUpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbn0pO1xuJGRyYWdEcm9wLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdleGl0JywgKGUpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbn0pO1xuJGRyYWdEcm9wLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWcnLCAoZSkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGhhbmRsZUZpbGVzKGUuZGF0YVRyYW5zZmVyLmZpbGVzKTtcbn0pO1xuJGZpbGUuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKCkgPT4gaGFuZGxlRmlsZXMoJGZpbGUuZmlsZXMpKTtcblxuZnVuY3Rpb24gaGFuZGxlRmlsZXMoZmlsZXM6IEZpbGVMaXN0KSB7XG4gICAgY29uc3QgZiA9IGZpbGVzWzBdO1xuICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAvLyBrZWVwIGNhbnZhcyBmcm9tIHN0cmV0Y2hpbmcgdG9vIGJpZ1xuICAgICAgICAoYyA9IENhbnZhcygnZGVtb0NhbnZhcycsIGdldE1heFdpZHRoKCksIGdldE1heEhlaWdodCgpLCBnZXRNYXhTaXplKCkpKSxcbiAgICAgICAgICAgIGMubG9hZEltYWdlKGUudGFyZ2V0LnJlc3VsdC50b1N0cmluZygpLCB0cnVlLCBzZXRGaWVsZHMpO1xuICAgICAgICAkZHJhZ0Ryb3Auc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgJGRlbW9DYW52YXMuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgICRmaW5kRWRnZXMuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgfTtcbiAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmKTtcbn1cblxuZnVuY3Rpb24gYXBwbHlTaGFycGVuTGV2ZWwoKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaGFycGVuTGV2ZWw7IGkrKykge1xuICAgICAgICBjdXJyZW50TWF0cml4ID0gc2hhcnBlbk1hc2soY3VycmVudE1hdHJpeCk7XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSBzaGFycGVuTGV2ZWw7IGkgPCAwOyBpKyspIHtcbiAgICAgICAgY3VycmVudE1hdHJpeCA9IGdhdXNzaWFuTWFzayhjdXJyZW50TWF0cml4LCAzLCAwLjcpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY2FubnlNZXRob2QoKSB7XG4gICAgLy8gQ2FubnkgZWRnZSBkZXRlY3Rpb24gbWV0aG9kXG4gICAgY3VycmVudE1hdHJpeCA9IGdhdXNzaWFuTWFzayhjdXJyZW50TWF0cml4LCAzLCAxLjApO1xuICAgIGN1cnJlbnRTb2JlbCA9IHNvYmVsTWFzayhjdXJyZW50TWF0cml4KTtcbiAgICBjdXJyZW50TWF0cml4ID0gY3VycmVudFNvYmVsLlM7XG4gICAgY3VycmVudE1hdHJpeCA9IG5vbk1heFN1cHByZXNzaW9uKGN1cnJlbnRTb2JlbC5TLCBjdXJyZW50U29iZWwuRyk7XG4gICAgY3VycmVudE1hdHJpeCA9IGh5c3RlcmVzaXMoY3VycmVudE1hdHJpeCwgMC4xOCwgMC40NSk7XG4gICAgY3VycmVudE1hdHJpeCA9IGludmVydGVkKGN1cnJlbnRNYXRyaXgpO1xufVxuXG4kZmluZEVkZ2VzLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgIHJlc2V0KCk7XG4gICAgc2hhcnBlbkxldmVsID0gMDtcbiAgICBhcHBseVNoYXJwZW5MZXZlbCgpO1xuICAgIGNhbm55TWV0aG9kKCk7XG4gICAgJG1vcmVFZGdlcy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAkbGVzc0VkZ2VzLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgIHJlbG9hZCgpO1xuICAgICRhdXRvdG9vbkdyb3VwLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xufSk7XG5cbiRtb3JlRWRnZXMuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgcmVzZXQoKTtcbiAgICBzaGFycGVuTGV2ZWwrKztcbiAgICBhcHBseVNoYXJwZW5MZXZlbCgpO1xuICAgIGNhbm55TWV0aG9kKCk7XG4gICAgcmVsb2FkKCk7XG59KTtcblxuJGxlc3NFZGdlcy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXNldCgpO1xuICAgIHNoYXJwZW5MZXZlbC0tO1xuICAgIGFwcGx5U2hhcnBlbkxldmVsKCk7XG4gICAgY2FubnlNZXRob2QoKTtcbiAgICByZWxvYWQoKTtcbn0pO1xuXG4kYXV0b3Rvb24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGN1cnJlbnRUb29uKSB7XG4gICAgICAgIGN1cnJlbnRUb29uLnN0b3AoKCkgPT4ge1xuICAgICAgICAgICAgY3VycmVudFRvb24gPSBudWxsO1xuICAgICAgICAgICAgJGF1dG90b29uLnRleHRDb250ZW50ID0gJ0F1dG90b29uJztcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc3BlZWQgPSBwYXJzZUZsb2F0KCR0b29uU3BlZWQudmFsdWUpLFxuICAgICAgICBkaXJlY3Rpb24gPSAkdG9vbkRpci52YWx1ZSxcbiAgICAgICAgc29ydCA9ICR0b29uU29ydC52YWx1ZSxcbiAgICAgICAgYmdDb2xvciA9IDI1NSxcbiAgICAgICAgTSA9IGN1cnJlbnRNYXRyaXgsXG4gICAgICAgIG4gPSBNWzBdLmxlbmd0aCxcbiAgICAgICAgbSA9IE0ubGVuZ3RoLFxuICAgICAgICBjYXJ0ZXNpYW5EaXN0YW5jZSA9IGZ1bmN0aW9uIChyMTogbnVtYmVyLCBjMTogbnVtYmVyLCByMjogbnVtYmVyLCBjMjogbnVtYmVyKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KHIxIC0gcjIsIDIpICsgTWF0aC5wb3coYzEgLSBjMiwgMikpO1xuICAgICAgICB9LFxuICAgICAgICAvLyBOdW1iZXIgb2Ygcm93cyB0aGUgZWRnZSBzcGFuc1xuICAgICAgICB5U3BhbiA9IGZ1bmN0aW9uIChlZGdlOiBudW1iZXJbXSkge1xuICAgICAgICAgICAgdmFyIHlNaW4gPSBJbmZpbml0eSxcbiAgICAgICAgICAgICAgICB5TWF4ID0gLUluZmluaXR5O1xuICAgICAgICAgICAgZWRnZS5mb3JFYWNoKGZ1bmN0aW9uIChlbGVtOiBudW1iZXIpIHtcbiAgICAgICAgICAgICAgICB2YXIgciA9IGVsZW0gLyBuO1xuICAgICAgICAgICAgICAgIHlNaW4gPSBNYXRoLm1pbih5TWluLCByKTtcbiAgICAgICAgICAgICAgICB5TWF4ID0gTWF0aC5tYXgoeU1heCwgcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB5TWF4IC0geU1pbjtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gTnVtYmVyIG9mIGNvbHMgdGhlIGVkZ2Ugc3BhbnNcbiAgICAgICAgeFNwYW4gPSBmdW5jdGlvbiAoZWRnZTogbnVtYmVyW10pIHtcbiAgICAgICAgICAgIHZhciB4TWluID0gSW5maW5pdHksXG4gICAgICAgICAgICAgICAgeE1heCA9IC1JbmZpbml0eTtcbiAgICAgICAgICAgIGVkZ2UuZm9yRWFjaChmdW5jdGlvbiAoZWxlbTogbnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgdmFyIGMgPSBlbGVtICUgbjtcbiAgICAgICAgICAgICAgICB4TWluID0gTWF0aC5taW4oeE1pbiwgYyk7XG4gICAgICAgICAgICAgICAgeE1heCA9IE1hdGgubWF4KHhNYXgsIGMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4geE1heCAtIHhNaW47XG4gICAgICAgIH0sXG4gICAgICAgIHRyYW5zZm9ybSA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBsb25nZXN0KGVkZ2VzOiBudW1iZXJbXVtdKSB7XG4gICAgICAgICAgICAgICAgZWRnZXMuc29ydChmdW5jdGlvbiAoZTE6IG51bWJlcltdLCBlMjogbnVtYmVyW10pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGUyLmxlbmd0aCAtIGUxLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIHJhbmRvbShlZGdlczogbnVtYmVyW11bXSkge1xuICAgICAgICAgICAgICAgIC8vIEZpc2hlci1ZYXRlcyBzaHVmZmxlLCBkZXNjcmlwdGlvbiBvbiBXaWtpcGVkaWEuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlZGdlcy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGogPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAoZWRnZXMubGVuZ3RoIC0gaSkpICsgaSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXAgPSBlZGdlc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgZWRnZXNbaV0gPSBlZGdlc1tqXTtcbiAgICAgICAgICAgICAgICAgICAgZWRnZXNbal0gPSB0ZW1wO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIGRhcmtlc3QoZWRnZXM6IG51bWJlcltdW10pIHtcbiAgICAgICAgICAgICAgICBlZGdlcy5zb3J0KGZ1bmN0aW9uIChlMTogbnVtYmVyW10sIGUyOiBudW1iZXJbXSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgczEgPSAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgczIgPSAwO1xuICAgICAgICAgICAgICAgICAgICBlMS5mb3JFYWNoKGZ1bmN0aW9uIChlbGVtOiBudW1iZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHMxICs9IE1hdGguYWJzKGJnQ29sb3IgLSBNW01hdGguZmxvb3IoZWxlbSAvIG4pXVtlbGVtICUgbl0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgZTIuZm9yRWFjaChmdW5jdGlvbiAoZWxlbTogbnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzMiArPSBNYXRoLmFicyhiZ0NvbG9yIC0gTVtNYXRoLmZsb29yKGVsZW0gLyBuKV1bZWxlbSAlIG5dKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzMiAvIGUyLmxlbmd0aCAtIHMxIC8gZTEubGVuZ3RoO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gY2VudGVyKGVkZ2VzOiBudW1iZXJbXVtdKSB7XG4gICAgICAgICAgICAgICAgZWRnZXMuc29ydChmdW5jdGlvbiAoZTE6IG51bWJlcltdLCBlMjogbnVtYmVyW10pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGMxID0gMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGMyID0gMDtcbiAgICAgICAgICAgICAgICAgICAgZTEuZm9yRWFjaChmdW5jdGlvbiAoZWxlbTogbnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjMSArPSBjYXJ0ZXNpYW5EaXN0YW5jZShtIC8gMiwgbiAvIDIsIGVsZW0gLyBuLCBlbGVtICUgbik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBlMi5mb3JFYWNoKGZ1bmN0aW9uIChlbGVtOiBudW1iZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGMyICs9IGNhcnRlc2lhbkRpc3RhbmNlKG0gLyAyLCBuIC8gMiwgZWxlbSAvIG4sIGVsZW0gJSBuKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjMSAvIGUxLmxlbmd0aCAtIGMyIC8gZTIubGVuZ3RoO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gd2lkZXN0KGVkZ2VzOiBudW1iZXJbXVtdKSB7XG4gICAgICAgICAgICAgICAgLy8gV2Ugc29ydCBieSB0aGUgc3BhbiBvZiB0aGUgZWRnZTogdGhlIHgtcmFuZ2UgKyB5LXJhbmdlXG4gICAgICAgICAgICAgICAgZWRnZXMuc29ydChmdW5jdGlvbiAoZTE6IG51bWJlcltdLCBlMjogbnVtYmVyW10pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcnRlc2lhbkRpc3RhbmNlKHlTcGFuKGUyKSwgeFNwYW4oZTIpLCAwLCAwKSAtXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJ0ZXNpYW5EaXN0YW5jZSh5U3BhbihlMSksIHhTcGFuKGUxKSwgMCwgMClcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIG5vdyB3ZSBzZWxlY3Qgb25lIG9mIHRoZXNlIGZ1bmN0aW9ucyBhbmQgcmV0dXJuIGl0XG4gICAgICAgICAgICByZXR1cm4geyBsb25nZXN0LCByYW5kb20sIGRhcmtlc3QsIGNlbnRlciwgd2lkZXN0IH1bc29ydF07XG4gICAgICAgIH0pKCk7XG4gICAgY3VycmVudFRvb24gPSBjLmF1dG9Ub29uKFxuICAgICAgICBjdXJyZW50TWF0cml4LFxuICAgICAgICBzcGVlZCxcbiAgICAgICAgYmdDb2xvcixcbiAgICAgICAgaXRlcmF0b3JzW2RpcmVjdGlvbiBhcyAndG9wJyB8ICdib3R0b20nIHwgJ2xlZnQnIHwgJ3JpZ2h0J10sXG4gICAgICAgIHRyYW5zZm9ybSxcbiAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgY3VycmVudFRvb24gPSBudWxsO1xuICAgICAgICAgICAgJGF1dG90b29uLnRleHRDb250ZW50ID0gJ0F1dG90b29uJztcbiAgICAgICAgfVxuICAgICk7XG4gICAgJGF1dG90b29uLnRleHRDb250ZW50ID0gJ1N0b3AnO1xufSk7XG5cbiRyZXNldC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHJlc2V0KHRydWUpKTtcblxuLy8gVE9ETyBhZGQgYSBsb2FkaW5nIHNwaW5uZXIgYXMgd2VsbCwgYW5kIGEgd2F5IHRvIHNhdmUgdmlkZW8/XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUNBO0FBbUJBOztBQUVBO0FBQ0E7QUFNQTtBQUNBO0FBQ0E7QUFFQTs7OztBQUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUVBOzs7Ozs7Ozs7O0FBVUE7QUFDQTtBQVFBO0FBTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBRUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBRUE7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUFBO0FBQ0E7QUFPQTs7Ozs7QUFLQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQ0E7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzlRQTtBQUNBO0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBSUE7QUFHQTtBQUNBO0FBRUE7QUFFQTtBQUNBO0FBQ0E7QUFBQTtBQUFBO0FBQ0E7QUFDQTtBQUFBO0FBQUE7QUFDQTtBQUNBO0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFLQTtBQUVBOztBQUVBO0FBQ0E7QUFNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBRUE7QUFDQTtBQUVBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFJQTtBQUNBO0FBRUE7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBS0E7QUFFQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBOzs7O0FBSUE7QUFDQTtBQUtBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBSUE7QUFBQTtBQUNBO0FBQ0E7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7Ozs7QUFJQTtBQUNBO0FBQ0E7QUFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0E7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3pPQTtBQUlBOztBQUVBO0FBQ0E7QUFLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTs7O0FBR0E7QUFDQTtBQU1BO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTs7OztBQUlBO0FBQ0E7QUFDQTtBQUdBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTs7Ozs7OztBQU9BO0FBQ0E7QUFDQTtBQU1BO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBTUE7QUFDQTtBQUNBO0E7Ozs7Ozs7Ozs7Ozs7Ozs7QUNsSEE7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQ0E7QUFDQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUVBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0E7Ozs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDUEE7Ozs7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7OztBQ05BO0FBQ0E7QUFTQTtBQUNBO0FBRUE7QUFFQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFPQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBRUE7QUFFQTs7Ozs7QSIsInNvdXJjZVJvb3QiOiIifQ==