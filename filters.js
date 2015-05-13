(function(global) {
    "use strict";

    /**
     * Return new matrix where each element is 255 - old element.
     */
    function inverted(matrix) {
        return util.matrixFromFunc(matrix.length, matrix[0].length, function(i, j) {
            return 255 - matrix[i][j];
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
        kernel = util.matrixFromFunc(k, k, function(x, y) {
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
        return util.matrixConvolution(kernel, M);
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
        Cx = util.matrixConvolution(Gx, M),
        Cy = util.matrixConvolution(Gy, M),
        Csum = util.matrixFromFunc(Cx.length, Cx[0].length, function(i, j) {
            return util.clamp(Math.abs(Cx[i][j]) + Math.abs(Cy[i][j]), 0, 255);
        }),
        G = util.matrixFromFunc(Cx.length, Cx[0].length, function(i, j) {
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
        return util.matrixConvolution([
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
        return util.matrixFromFunc(M.length, M[0].length, function(i, j) {
            // don't suppress the borders
            if (i == 0 || j == 0 || i == M.length - 1 || j == M[0].length - 1)
                return M[i][j];
            // previous and next values along the approximated gradient
            var prev, next;
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
     * Estimate upper and lower hysteresis thresholds, returning {hi: num, lo: num}.
     */
    function estimateThreshold(M) {
        var high_percentage = 0.2, // percentage of pixels that meet high threshold
        low_percentage = 0.5, // ratio of low threshold to high
        histogram = util.zeros(1, 256)[0], // length 256 array of zeros
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
        j = (i + j) * low_percentage;
        return { hi: i, lo: j };
    }

    /**
     * Apply hysteresis to trace edges with given lower and upper thresholds and
     * return the resulting matrix.
     */
    function hysteresis(M) {
        var threshold = estimateThreshold(M),
            m = M.length,
            n = M[0].length,
            realEdges = util.zeros(m, n); // 0 if not connected to real edge, 1 if is
        // Return array of neighbors of M[i][j] where M[n] >= threshold.lo
        function collectNeighbors(i, j, group) {
            group = (group === undefined) ? [] : group;
            group.push(i * n + j);
            for (var offsetY = -1; offsetY <= 1; offsetY++) {
                for (var offsetX = -1; offsetX <= 1; offsetX++) {
                    var r = i + offsetY,
                        c = j + offsetX;
                    // bounds check
                    if (r >= 0 && r < m && c >= 0 && c < n)
                        // check threshold and not already in group or real
                        if (M[r][c] >= threshold.lo && !realEdges[r][c] &&
                                group.indexOf(r * n + c) === -1)
                            collectNeighbors(r, c, group);
                }
            }
            return group;
        }
        for (var i = 0; i < m; i++) {
            for (var j = 0; j < n; j++) {
                // we consider that these are "strong" pixels, then we trace the
                // edge that they are part of
                // also we skip any pixels we have already marked as real
                if (M[i][j] >= threshold.hi && !realEdges[i][j]) {
                    var group = collectNeighbors(i, j);
                    group.forEach(function(g) {
                        realEdges[Math.floor(g / n)][g % n] = 1;
                    });
                }
            }
        }
        // now we suppress all values not part of a real edge
        return util.matrixFromFunc(m, n, function(i, j) {
            return (realEdges[i][j]) ? M[i][j] : 0;
        });
    }

    global.filters = util.exports({}, [
            inverted, gaussianMask, sobelMask, laplaceMask, nonMaxSuppression,
            hysteresis
    ]);
})(this);
