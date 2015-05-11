/**
 * Make imageData grayscale.
 */
function grayScale(imageData) {
    var data = imageData.data;
    for (var i = 0; i  < data.length; i += 4) {
        var gray = (data[i] + data[i+1] + data[i+2]) / 3.0;
        setPixelGray(imageData, i, gray);
    }
}

/**
 * Apply a sobel operator to the given grayscale image data matrix, assumed to be in gray scale.
 */
function sobelMask(M) {
    // gradient approximation masks for x and y directions
    var Gx = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]],
        Gy = [[1, 2, 1], [0, 0, 0], [-1, -2, -1]],
        Cx = matrixConvolution(Gx, M),
        Cy = matrixConvolution(Gy, M),
        Csum = zeros(Cx.length, Cx[0].length);
    Csum.forEach(function(row, i) {
        row.forEach(function(_, j) {
            Csum[i][j] = clamp(Math.abs(Cx[i][j]) + Math.abs(Cy[i][j]), 0, 255);
        });
    });
    return Csum;
}

/**
 * Apply a Gaussian blur mask to the image matrix M with given radius and sigma.
 */
function gaussianMask(M, radius, sigma) {
    // construct the blur kernel
    var k = 2 * radius + 1,
        mean = k / 2,
        sum = 0,
        kernel = zeros(k, k);
    for (var x = 0; x < k; x++) {
        for (var y = 0; y < k; y++) {
            kernel[x][y] = Math.exp(-0.5 * (Math.pow((x - mean) / sigma, 2.0) +
                        Math.pow((y - mean) / sigma, 2)) ) / (2 * Math.PI *
                    sigma * sigma);
            sum += kernel[x][y];
        }
    }
    // normalize
    for (var x = 0; x < k; x++)
        for (var y = 0; y < k; y++)
            kernel[x][y] /= sum;
    return matrixConvolution(kernel, M);
}
