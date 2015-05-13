(function(global) {
    "use strict";

    /**
     * Put list of functions into namespace of target, and return target.
     */
    function exports(target, funcs) {
        target = target || {};
        for (var i = 0; i < funcs.length; i++)
            target[funcs[i].name] = funcs[i];
        return target;
    }

    /**
     * Clamp num to the range [lo,hi].
     */
    function clamp(num, lo, hi) {
        lo = (lo === undefined) ? -Infinity : lo;
        hi = (hi === undefined) ? Infinity : hi;
        if (num < lo) {
            return lo;
        } else if (num > hi) {
            return hi;
        } else {
            return num;
        }
    }

    /**
     * Construct a matrix from a generator function.
     */
    function matrixFromFunc(m, n, func) {
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
        return matrixFromFunc(m, n, function(__, _) { return 0; });
    }

    /**
     * Get the rgba value of pixel i in given image data.
     * If i is out of bounds, then return (0,0,0,0).
     */
    function getPixel(imageData, i) {
        return (i < imageData.data.length)?
        {
            r: imageData.data[i],
            g: imageData.data[i+1],
            b: imageData.data[i+2],
            a: imageData.data[i+3]
        }:{ r: 0, g: 0, b: 0, a: 0 };
    }

    /**
     * Set the rgba value of pixel i in given image data.
     */
    function setPixel(imageData, i, rgba) {
        imageData.data[i] = rgba.r;
        imageData.data[i+1] = rgba.g;
        imageData.data[i+2] = rgba.b;
        imageData.data[i+3] = rgba.a;
    }

    /**
     * Set pixel i to gray with given value in given image data.
     */
    function setPixelGray(imageData, i, val) {
        imageData.data[i] = val;
        imageData.data[i+1] = val;
        imageData.data[i+2] = val;
    }

    /**
     * Return the grayscale value of given rgb pixel.
     */
    function grayScale(pixel) {
        return 0.3*pixel.r + 0.59*pixel.g + 0.11*pixel.b;
    }

    /**
     * Turn imageData into a two-dimensional width x height matrix, where each
     * entry has properties r, g, b, a.
     */
    function toMatrix(imageData) {
        return matrixFromFunc(imageData.height, imageData.width, function(r,c) {
            return getPixel(imageData, 4 * (r * imageData.width + c));
        });
    }

    /**
     * Turn imageData into a two-dimensional width x height matrix of [0, 255]
     * integers, assuming imageData is in grayscale.
     */
    function toGrayMatrix(imageData) {
        return matrixFromFunc(imageData.height, imageData.width, function(r,c) {
            return grayScale(getPixel(imageData, 4 * (r * imageData.width + c)));
        });
    }

    /**
     * Create an ImageData object from a grayscale matrix, with a given optional
     * original ImageData from which the matrix was created (to recover alpha
     * values).
     */
    function toImageData(matrix, originalData) {
        var m = matrix.length,
        n = matrix[0].length,
        newData = new ImageData(new Uint8ClampedArray(m*n*4), n, m);
        for (var i = 0; i < m * n; i++) {
            setPixelGray(newData, 4*i, matrix[Math.floor(i / n)][i % n]);
            // set alpha channel if originalData is given.
            newData.data[4*i + 3] = (originalData)?originalData.data[4*i + 3]:255;
        }
        return newData;
    }

    /**
     * Trim l columns from left, r columns from right, t rows from top, and b rows
     * from bottom of M and return as a new matrix. Does not modify M.
     */
    function borderTrim(M, l, r, t, b) {
        var ret = [];
        M.slice(t, M.length - b).forEach(function(row) {
            ret.push(row.slice(l, row.length - r));
        })
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
    function matrixConvolution(kernel, matrix, lb, ub) {
        var p = kernel.length,
        q = kernel[0].length,
        m = matrix.length,
        n = matrix[0].length,
        rY = (p - 1) / 2,
        rX = (q - 1) / 2;
        return borderTrim(matrixFromFunc(m, n, function(i, j) {
            if (i < rY || i >= m - rY || j < rX || j >= n - rX)
                // can't apply the operator too close to the boundaries
                return 0;
            var sum = 0;
            for (var a = -rY; a <= rY; a++)
                for (var b = -rX; b <= rX; b++)
                    sum += kernel[a + rY][b + rX] * matrix[i + a][j + b];
            return clamp(Math.round(sum), lb, ub);
        }), rX, rX, rY, rY);
    }

    global.util = exports({}, [
            exports, clamp, matrixFromFunc, zeros, getPixel, setPixel,
            setPixelGray, grayScale, toGrayMatrix, toMatrix, toImageData,
            borderTrim, matrixConvolution
    ]);
})(this);
