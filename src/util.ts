import { fromFunc } from './matrix';

/**
 * Clamp num to the range [lo,hi].
 */
export function clamp(num: number, lo?: number, hi?: number) {
    lo = lo === undefined ? -Infinity : lo;
    hi = hi === undefined ? Infinity : hi;
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
export function getPixel(imageData: ImageData, i: number) {
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
export function grayScale(pixel: { r: number; g: number; b: number; a?: number }) {
    return 0.3 * pixel.r + 0.59 * pixel.g + 0.11 * pixel.b;
}

/**
 * Turn imageData into a two-dimensional width x height matrix of [0, 255]
 * integers of grayscale values of each pixel.
 */
export function toMatrix(imageData: ImageData) {
    return fromFunc(imageData.height, imageData.width, function (r, c) {
        return grayScale(getPixel(imageData, 4 * (r * imageData.width + c)));
    });
}
