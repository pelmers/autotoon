import { convolution, fromFunc, Mat, neighborhood, zeros } from './matrix';
import { clamp } from './util';

/**
 * Return new matrix where each element is 255 - old element.
 */
export function inverted(M: Mat): Mat {
    return fromFunc(M.length, M[0].length, function (i, j) {
        return 255 - M[i][j];
    });
}

/**
 * Apply a Gaussian blur mask to the image matrix M with given radius and
 * sigma. Return the new, blurred matrix.
 */
export function gaussianMask(M: Mat, radius: number, sigma: number): Mat {
    // construct the blur kernel
    var k = 2 * radius + 1,
        mean = k / 2,
        sum = 0,
        kernel = fromFunc(k, k, function (x, y) {
            return (
                Math.exp(
                    -0.5 *
                        (Math.pow((x - mean) / sigma, 2) +
                            Math.pow((y - mean) / sigma, 2))
                ) /
                (2 * Math.PI * sigma * sigma)
            );
        });
    // compute sum
    for (var x = 0; x < k; x++) for (var y = 0; y < k; y++) sum += kernel[x][y];
    // normalize
    for (var x = 0; x < k; x++) for (var y = 0; y < k; y++) kernel[x][y] /= sum;
    return convolution(kernel, M, 0, 255);
}

/**
 * Apply an image sharpening mask to the matrix M. Return the new matrix.
 */
export function sharpenMask(M: Mat): Mat {
    return convolution(
        [
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0],
        ],
        M,
        0,
        255
    );
}

/**
 * Interpolate the value of the neighbor at angle radians from i, j in M.
 */
export function interpolateNeighbor(
    M: Mat,
    i: number,
    j: number,
    angle: number
): number {
    // We transform angle from [0, 2pi) to [0, 8), so 1 radian : 45 degrees
    // so flooring this value gives us direction of the previous value, and
    // ceil-ing this value gives us the next value mod 8 in the
    // neighborhood then we can index into the neighborhood by numbering:
    // 3   2   1                                 (-1,-1)  (-1, 0)  (-1, 1)
    // 4   -   0   then define the mapping to    (0, -1)     -     ( 0, 1)
    // 5   6   7                                 (1, -1)  ( 1, 0)  ( 1, 1)

    // Find value of neighbor to i, j in M in octant o in [0, 8)
    function octantToNeighbor(o: number) {
        // remark dy(o) == dx(o+2); this map returns the dy value
        var map = function (x: number) {
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
    var octant = (angle * 4) / Math.PI,
        ratio = octant % 1, // Use a trick to get decimal part of octant
        prev = octantToNeighbor(Math.floor(octant)),
        next = octantToNeighbor(Math.ceil(octant));
    return ratio * prev + (1 - ratio) * next;
}

/**
 * Apply a sobel operator to the given grayscale image data matrix, assumed to
 * be in grayscale, and return the result matrix S and gradient matrix G.
 */
export function sobelMask(M: Mat): { S: Mat; G: Mat } {
    // gradient approximation masks for x and y directions
    var Gx = [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1],
        ],
        Gy = [
            [1, 2, 1],
            [0, 0, 0],
            [-1, -2, -1],
        ],
        Cx = convolution(Gx, M),
        Cy = convolution(Gy, M),
        Csum = fromFunc(Cx.length, Cx[0].length, function (i, j) {
            return clamp(Math.abs(Cx[i][j]) + Math.abs(Cy[i][j]), 0, 255);
        }),
        G = fromFunc(Cx.length, Cx[0].length, function (i, j) {
            if (Cx[i][j] === 0) return Cy[i][j] ? Math.PI / 2 : 0;
            return Math.atan(Math.abs(Cy[i][j]) / Math.abs(Cx[i][j]));
        });
    return { S: Csum, G: G };
}

/**
 * Apply a discrete 5x5 Laplacian mask on M.
 */
export function laplaceMask(M: Mat): Mat {
    return convolution(
        [
            [-1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1],
            [-1, -1, 24, -1, -1],
            [-1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1],
        ],
        M,
        0,
        255
    );
}

/**
 * Given image matrix M, gradient matrix G, construct a new image matrix where
 * edge points lying on non-maximal gradients are set to 0.
 */
export function nonMaxSuppression(M: Mat, G: Mat): Mat {
    return fromFunc(M.length, M[0].length, function (i, j) {
        // don't suppress the borders
        if (i === 0 || j === 0 || i === M.length - 1 || j === M[0].length - 1)
            return M[i][j];
        // previous and next values along the approximated gradient
        var prev = interpolateNeighbor(M, i, j, G[i][j]),
            next = interpolateNeighbor(M, i, j, Math.PI + G[i][j]);
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
export function estimateThreshold(
    M: Mat,
    high_percentage: number,
    low_percentage: number
) {
    var histogram = zeros(1, 256)[0], // length 256 array of zeros
        m = M.length,
        n = M[0].length;
    // Construct histogram of pixel values
    M.forEach((r) => {
        r.forEach((e) => {
            histogram[e]++;
        });
    });
    // Compute number of pixels we want to target.
    var pixels = (m * n - histogram[0]) * high_percentage,
        high_cutoff = 0,
        i = histogram.length,
        j = 1;
    while (high_cutoff < pixels) high_cutoff += histogram[i--];
    // Increment j up to first non-zero frequency (so we ignore those).
    while (histogram[j] === 0) j++;
    j += i * low_percentage;
    // j = (i * low_percentage + j) * low_percentage;
    return { hi: i, lo: j };
}

/**
 * Apply hysteresis to trace edges with given lower and upper thresholds
 * and return the resulting matrix. This thins edges by only keeping points
 * connected to "strong" edges, as defined by the threshold function.
 */
export function hysteresis(M: Mat, high_percentage: number, low_percentage: number) {
    var threshold = estimateThreshold(M, high_percentage, low_percentage),
        m = M.length,
        n = M[0].length,
        realEdges = zeros(m, n); // 0 if not connected to real edge, 1 if is
    // Return array of neighbors of M[i][j] where M[n] >= threshold.lo.
    function collectNeighbors(i: number, j: number) {
        var stack = [i * n + j];
        realEdges[i][j] = M[i][j];
        while (stack.length > 0) {
            var v = stack.pop();
            neighborhood(M, Math.floor(v / n), v % n, (val, r, c) => {
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
