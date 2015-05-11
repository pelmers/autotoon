/**
 * Wrap a canvas object with given ID and maximum parameters.
 */
function Canvas(id, maxWidth, maxHeight) {
    var elem = document.getElementById(id), // canvas element
        ctx = elem.getContext('2d'),        // drawing context
        image = null;                       // Image object

    /**
     * Load given image onto the canvas, replacing any existing content,
     * and resize the canvas to fit the picture.
     * Call callback once the image is loaded.
     */
    function loadImage(imgSource, callback) {
        image = new Image();
        // allow cross-origin requests for supported servers
        image.crossOrigin = "Anyonymous";
        image.onload = function() {
            image.width = clamp(image.width, 0, maxWidth);
            image.height = clamp(image.width, 0, maxHeight);
            elem.width = image.width;
            elem.height = image.height;
            ctx.drawImage(image, 0, 0);
            if (callback)
                callback();
        };
        image.src = imgSource;
    }

    /**
     * Reload the canvas with given ImageData.
     */
    function reloadCanvas(data) {
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
    function getImage() { return image; }
    return function(exports) {
        var obj = {}
        for (var i = 0; i < exports.length; i++)
            obj[exports[i].name] = exports[i];
        return obj;
    }([
            // exported functions
            loadImage, getImage, getImageData, reloadCanvas
    ]);
}


/**
 * Get the rgba value of pixel i in given image data.
 * If i is out of bounds, then return (255,255,255,255).
 */
function getPixel(imageData, i) {
    return (i < imageData.length)?
    {
        r: imageData.data[i],
        g: imageData.data[i+1],
        b: imageData.data[i+2],
        a: imageData.data[i+3],
    }:{ r: 255, g: 255, b: 255, a: 255, };
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

