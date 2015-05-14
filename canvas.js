/**
 * Wrap a canvas object with given ID and maximum parameters.
 */
function Canvas(id, maxWidth, maxHeight) {
    "use strict";
    var elem = document.getElementById(id), // canvas element
        ctx = elem.getContext('2d'),        // drawing context
        image = null;                       // Image object
    ctx.globalCompositeOperation = "source-atop";

    /**
     * Load given image onto the canvas, replacing any existing content,
     * and resize the canvas to fit the picture.
     * Call callback once the image is loaded.
     */
    function loadImage(imgSource, isDataURI, callback) {
        function handler() {
            // downscale factor image to maxWidth or maxHeight if it's too big
            var scaling = util.clamp(
                    1 / Math.max(image.width / maxWidth, image.height / maxHeight),
                    0.0,
                    1.0);
            elem.width = Math.floor(scaling*image.width);
            elem.height = Math.floor(scaling*image.height);
            ctx.drawImage(image, 0, 0, elem.width, elem.height);
            if (callback)
                callback();
        }
        image = new Image();
        image.onload = handler;
        // for some reason setting this when the src is actually not
        // cross-origin causes firefox to not fire the onload handler
        if (!isDataURI)
            // allow cross-origin requests for supported servers
            image.crossOrigin = "Anonymous";
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

    /**
     * Return the current canvas 2D context.
     */
    function getContext() { return ctx; }

    /**
     * Return the current canvas DOM element.
     */
    function getElem() { return elem; }

    /**
     * Animate the drawing of the edges of M, with speed given in pixels / ms.
     */
    function autoToon(M, speed) {
        // TODO: refactor a lot
        // TODO: different behavior for whether image is inverted
        var m = M.length,
            n = M[0].length,
            groupedPixels = {},
            groups = [];
        // Trace the edge that contains pos and return its positions.
        function traceEdge(start) {
            var trace = [],
                stack = [start];
            groupedPixels[start] = true;
            while (stack.length > 0) {
                var v = stack.pop();
                trace.push(v);
                util.traverseNeighborhood(M, Math.floor(v / n), v % n, function(val, r, c) {
                    // TODO: order neighbors
                    var pos = r * n + c;
                    if (val > 0 && groupedPixels[pos] === undefined) {
                        stack.push(pos);
                        groupedPixels[pos] = true;
                    }
                });
            }
            return trace;
        }
        // consequence: edges will be drawn down-right
        // TODO: allow different traversal orders
        for (var i = 0; i < m; i++) {
            for (var j = 0; j < n; j++) {
                var pos = i * n + j;
                // if 0, it's not an edge. if it's grouped then we've seen it.
                if (M[i][j] === 0 || groupedPixels[pos] !== undefined)
                    continue;
                groups.push(traceEdge(pos));
            }
        }
        // we have partitioned the edges into groups, now we can draw them.
        var start; // starting time
        var num = 0, idx = 0; // current group number, index in current group
        // the current state of the animation, initialize to blank
        var globalmat = util.matrixFromFunc(m, n, function() { return 255; });
        ctx.clearRect(0, 0, elem.width, elem.height);
        function animator(t) {
            start = start || t; // initialize start time if this is first frame
            var dt = t - start,
                chunk = Math.ceil(Math.max(speed * dt, 1)),
                minR = Infinity, maxR = -Infinity,
                minC = Infinity, maxC = -Infinity,
                begin = idx,
                end = Math.min(groups[num].length, begin + chunk);
            // get the range of x and y for this chunk
            for (var i = begin; i < end; i++) {
                var r = Math.floor(groups[num][i] / n),
                    c = groups[num][i] % n;
                minR = Math.min(minR, r);
                maxR = Math.max(maxR, r);
                minC = Math.min(minC, c);
                maxC = Math.max(maxC, c);
            }
            var yRange = maxR - minR + 1,
                xRange = maxC - minC + 1;
            var submat = util.matrixFromFunc(yRange, xRange,
                    function(i, j) { return globalmat[i + minR][j + minC]; });
            for (var i = begin; i < end; i++) {
                var r = Math.floor(groups[num][i] / n),
                    c = groups[num][i] % n;
                submat[r - minR][c - minC] = 255 - M[r][c];
                globalmat[r][c] = 255 - M[r][c];
            }
            idx = end;
            ctx.putImageData(util.toImageData(submat), minC, minR);
            if (idx === groups[num].length) {
                idx = 0;
                num++;
            }
            // TODO: put leftover chunk onto the next num and continue
            if (num < groups.length)
                window.requestAnimationFrame(animator);
            else
                reloadCanvas(util.toImageData(globalmat));
        }
        window.requestAnimationFrame(animator);
    }

    return util.exports({}, [
            // exported functions on Canvas objects
            loadImage, getImage, getImageData, reloadCanvas, getContext,
            getElem, autoToon
    ]);
}
