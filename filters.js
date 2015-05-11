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
 * Apply a sobel operator to the given image data, assumed to be in gray scale.
 */
function sobelMask(imageData) {
    // ref: Edge Detection Tutorial by Bill Green (2002)
    // gradient approximation masks for x and y
    var Gx = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]],
        Gy = [[1, 2, 1], [0, 0, 0], [-1, -2, -1]];
}

/**
 * Apply a Gaussian blur mask to the image data.
 */
function gaussianMask(imageData) {
}
