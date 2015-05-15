(function(global) {
    "use strict";

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
        return fromFunc(m, n, function(__, _) { return 0; });
    }

    /**
     * Traverse the in-bounds neighborhood of given position, including itself.
     * Call func(val, r, c) for each neighbor.
     */
    function neighborhood(M, i, j, func) {
        var m = M.length,
            n = M[0].length;
        for (var r = util.clamp(i - 1, 0); r <= util.clamp(i + 1, 0, m - 1); r++)
            for (var c = util.clamp(j - 1, 0); c <= util.clamp(j + 1, 0, n - 1); c++)
                func(M[r][c], r, c);
    }

    /**
     * Create an ImageData object from a grayscale matrix, with a given optional
     * original ImageData from which the matrix was created (to recover alpha
     * values).
     */
    function toImageData(M, originalData) {
        var m = M.length,
            n = M[0].length,
            newData = new ImageData(new Uint8ClampedArray(m*n*4), n, m);
        for (var i = 0; i < m * n; i++) {
            var r = Math.floor(i / n),
                c = i % n;
            // r, g, b values
            newData.data[4*i] = newData.data[4*i+1] = newData.data[4*i+2] = M[r][c];
            // set alpha channel if originalData is given.
            newData.data[4*i + 3] = (originalData)?originalData.data[4*i + 3]:255;
        }
        return newData;
    }

    /**
     * Trim l columns from left, r columns from right, t rows from top, and b rows
     * from bottom of M and return as a new matrix. Does not modify M.
     */
    function trimBorder(M, l, r, t, b) {
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
    function convolution(kernel, matrix, lb, ub) {
        var p = kernel.length,
            q = kernel[0].length,
            m = matrix.length,
            n = matrix[0].length,
            rY = (p - 1) / 2,
            rX = (q - 1) / 2;
        return trimBorder(fromFunc(m, n, function(i, j) {
            if (i < rY || i >= m - rY || j < rX || j >= n - rX)
                // can't apply the operator too close to the boundaries
                return 0;
            var sum = 0;
            for (var a = -rY; a <= rY; a++)
                for (var b = -rX; b <= rX; b++)
                    sum += kernel[a + rY][b + rX] * matrix[i + a][j + b];
            return util.clamp(Math.round(sum), lb, ub);
        }), rX, rX, rY, rY);
    }

    global.matrix = util.exports({}, [
            convolution, fromFunc, toImageData, neighborhood, trimBorder, zeros
    ]);
})(this);
