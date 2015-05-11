/**
 * Wrap a canvas object with given ID and maximum parameters.
 */
function Canvas(id, maxWidth, maxHeight) {
    maxWidth = maxWidth || 1/0;
    maxHeight = maxHeight || 1/0;
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
            image.height = clamp(image.height, 0, maxHeight);
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
        elem.width = data.width;
        elem.height = data.height;
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
            // exported functions on Canvas objects
            loadImage, getImage, getImageData, reloadCanvas
    ]);
}
