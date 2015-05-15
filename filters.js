(function(global) {
    "use strict";

    /**
     * Return new matrix where each element is 255 - old element.
     */
    function inverted(M) {
        return matrix.fromFunc(M.length, M[0].length, function(i, j) {
            return 255 - M[i][j];
        });
    }

    /**
     * Apply a Gaussian blur mask to the image matrix M with given radius and
     * sigma. Return the new, blurred matrix.
     */
    function gaussianMask(M, radius, sigma) {
        // construct the blur kernel
        var k = 2 * radius + 1,
            mean = k / 2,
            sum = 0,
            kernel = matrix.fromFunc(k, k, function(x, y) {
                return Math.exp(-0.5 * (Math.pow((x - mean) / sigma, 2) +
                            Math.pow((y - mean) / sigma, 2)) ) / (2 * Math.PI *
                        sigma * sigma);
            });
        // compute sum
        for (var x = 0; x < k; x++)
            for (var y = 0; y < k; y++)
                sum += kernel[x][y];
        // normalize
        for (var x = 0; x < k; x++)
            for (var y = 0; y < k; y++)
                kernel[x][y] /= sum;
        return matrix.convolution(kernel, M, 0, 255);
    }

    /**
     * Round an angle in radians to the nearest 45 degrees.
     */
    function discretizeOrientation(angle) {
        var deg = angle * 180 / Math.PI;
        if (deg >= 22.5 && deg < 67.5)
            return 45;
        else if (deg >= 67.5 && deg < 112.5)
            return 90;
        else if (deg >= 112.5 && deg < 157.5)
            return 135;
        return 0;
    }

    /**
     * Apply a sobel operator to the given grayscale image data matrix, assumed to
     * be in grayscale, and return the result matrix S and gradient matrix G.
     */
    function sobelMask(M) {
        // gradient approximation masks for x and y directions
        var Gx = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]],
            Gy = [[1, 2, 1], [0, 0, 0], [-1, -2, -1]],
            Cx = matrix.convolution(Gx, M),
            Cy = matrix.convolution(Gy, M),
            Csum = matrix.fromFunc(Cx.length, Cx[0].length, function(i, j) {
                return util.clamp(Math.abs(Cx[i][j]) + Math.abs(Cy[i][j]), 0, 255);
            }),
            G = matrix.fromFunc(Cx.length, Cx[0].length, function(i, j) {
                if (Cx[i][j] == 0)
                    return (Cy[i][j]) ? Math.PI / 2 : 0;
                return Math.atan(Math.abs(Cy[i][j]) / Math.abs(Cx[i][j]));
            });
        return { S: Csum, G: G };
    }

    /**
     * Apply a discrete 5x5 Laplacian mask on M.
     */
    function laplaceMask(M) {
        return matrix.convolution([
                [-1, -1, -1, -1, -1],
                [-1, -1, -1, -1, -1],
                [-1, -1, 24, -1, -1],
                [-1, -1, -1, -1, -1],
                [-1, -1, -1, -1, -1]
        ], M, 0, 255);
    }

    /**
     * Given image matrix M, gradient matrix G, construct a new image matrix where
     * edge points lying on non-maximal gradients are set to 0.
     */
    function nonMaxSuppression(M, G) {
        return matrix.fromFunc(M.length, M[0].length, function(i, j) {
            // don't suppress the borders
            if (i == 0 || j == 0 || i == M.length - 1 || j == M[0].length - 1)
                return M[i][j];
            // previous and next values along the approximated gradient
            var prev, next;
            // TODO: interpolate for missing angle rather than rounding to nearest
            switch (discretizeOrientation(G[i][j])) {
                case 0:
                    prev = M[i][j-1];
                    next = M[i][j+1];
                    break;
                case 45:
                    prev = M[i+1][j-1];
                    next = M[i-1][j+1];
                    break;
                case 90:
                    prev = M[i+1][j];
                    next = M[i-1][j];
                    break;
                case 135:
                    prev = M[i-1][j-1];
                    next = M[i+1][j+1];
                    break;
                default:
                    throw "Panic: non-exhaustive switch.";
            }
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
        var histogram = matrix.zeros(1, 256)[0], // length 256 array of zeros
            m = M.length,
            n = M[0].length;
        // construct histogram of pixel values
        M.forEach(function(r) {
            r.forEach(function(e) {
                histogram[e]++;
            });
        });
        // number of pixels we want to target
        var pixels = (m * n - histogram[0]) * high_percentage,
            high_cutoff = 0,
            i = histogram.length,
            j = 1;
        while (high_cutoff < pixels)
            high_cutoff += histogram[i--];
        // increment j up to first non-zero frequency (so we ignore those)
        while (histogram[j] == 0)
            j++;
        j += i * low_percentage;
        //j = (i * low_percentage + j) * low_percentage;
        return { hi: i, lo: j };
    }

    /**
     * Apply hysteresis to trace edges with given lower and upper thresholds
     * and return the resulting matrix. This thins edges by only keeping points
     * connected to "strong" edges, as defined by the threshold function.
     */
    function hysteresis(M, high_percentage, low_percentage) {
        var threshold = estimateThreshold(M, high_percentage, low_percentage),
            m = M.length,
            n = M[0].length,
            realEdges = matrix.zeros(m, n); // 0 if not connected to real edge, 1 if is
        // Return array of neighbors of M[i][j] where M[n] >= threshold.lo
        function collectNeighbors(i, j) {
            var stack = [i * n + j];
            realEdges[i][j] = M[i][j];
            while (stack.length > 0) {
                var v = stack.pop();
                matrix.neighborhood(M, Math.floor(v / n), v % n,
                        function(val, r, c) {
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
                // we consider that these are "strong" pixels, then we trace the
                // edge that they are part of
                // also we skip any pixels we have already marked as real
                if (M[i][j] >= threshold.hi && !realEdges[i][j]) {
                    collectNeighbors(i, j);
                }
            }
        }
        return realEdges;
    }

    global.filters = util.exports({}, [
            inverted, gaussianMask, sobelMask, laplaceMask, nonMaxSuppression,
            hysteresis
    ]);
})(this);
