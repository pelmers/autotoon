/**
 * Construct n by m matrix of zeros.
 */
function zeros(m, n) {
    matrix = [];
    for (var i = 0; i < m; i++) {
        matrix.push([]);
        for (var j = 0; j < n; j++) {
            matrix[i].push(0);
        }
    }
    return matrix;
}

/**
 * Clamp num to the range [lo,hi].
 */
function clamp(num, lo, hi) {
    if (num < lo) {
        return lo;
    } else if (num > hi) {
        return hi;
    } else {
        return num;
    }
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
    }:{ r: 255, g: 255, b: 255, a: 255 };
}

/**
 * Set the rgba value of pixel i in given image data.
 */
function setPixel(imageData, i, rgba) {
    imageData.data[i] = rgb.r;
    imageData.data[i+1] = rgb.g;
    imageData.data[i+2] = rgb.b;
    imageData.data[i+3] = rgb.a;
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
 * Turn imageData into a two-dimensional width x height matrix, where each
 * entry has properties r, g, b, a.
 */
function toMatrix(imageData) {
    matrix = zeros(imageData.height, imageData.width);
    for (var r = 0; r < imageData.height; r++)
        for (var c = 0; c < imageData.width; c++)
            matrix[r][c] = getPixel(imageData, 4 * (r * imageData.width + c));
    return matrix;
}

/**
 * Turn imageData into a two-dimensional width x height matrix, assuming
 * imageData is in grayscale.
 */
function toGrayMatrix(imageData) {
    matrix = zeros(imageData.height, imageData.width);
    for (var r = 0; r < imageData.height; r++)
        for (var c = 0; c < imageData.width; c++)
            matrix[r][c] = imageData.data[4*(imageData.width*r + c)];
    return matrix;
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
    for (var i = t; i < M.length - b; i++)
        ret.push(M[i].slice(l, M[i].length - r));
    return ret;
}

/** Apply discrete convolution with given pxq mask to the given matrix, where p
 * and q are odd, and a matrix is an array of arrays of numbers. Return a new
 * matrix of slightly smaller size, where each element is the output of the
 * mask operator centered at that point and edges are trimmed where the
 * operator could not be applied.
 */
function matrixConvolution(kernel, matrix) {
    var p = kernel.length,
        q = kernel[0].length,
        m = matrix.length,
        n = matrix[0].length,
        rY = (p - 1) / 2,
        rX = (q - 1) / 2,
        conv = zeros(m, n);
    // Double loop over each reachable element of matrix (i,j)
    for (var i = rY; i < m - rY; i++) {
        for (var j = rX; j < n - rX; j++) {
            // Loop over each element of kernel (a,b) to construct conv (i,j)
            for (var a = -rY; a <= rY; a++) {
                for (var b = -rX; b <= rX; b++) {
                    conv[i][j] += kernel[a + rY][b + rX] * matrix[i + a][j + b];
                }
            }
        }
    }
    return borderTrim(conv, rX, rX, rY, rY);
}
