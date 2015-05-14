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
     * Animate the drawing of the edges of M, with speed given in pixels / ms,
     * bgColor defining the grayscale value of the background (either 0 or 255),
     * and matrixIter being a function which takes parameters M and
     * callback(i,j) and iterates over each element of M in some order, calling
     * callback at each element, and comparator(edge1, edge2) provides a
     * function to sort the edges found.
     */
    function autoToon(M, speed, bgColor, matrixIter, comparator) {
        // TODO: refactor a lot
        var m = M.length,
            n = M[0].length,
            groupedPixels = {},
            groups = [],
            stopped = false;
        bgColor = (bgColor === undefined) ? 255 : bgColor;
        matrixIter = matrixIter || function(mat, cb) {
            for (var i = 0; i < mat.length; i++)
                for (var j =  0; j < mat[0].length; j++)
                    cb(i, j);
        };
        comparator = comparator || function(a, b) { return b.length - a.length; };

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
                    if (val !== bgColor && groupedPixels[pos] === undefined) {
                        stack.push(pos);
                        groupedPixels[pos] = true;
                    }
                });
            }
            return trace;
        }

        // partition the image into edges in some traversal order
        matrixIter(M, function(i, j) {
            var pos = i * n + j;
            if (M[i][j] !== bgColor && groupedPixels[pos] === undefined)
                groups.push(traceEdge(pos));
        });
        groups.sort(comparator);

        // we have partitioned the edges into groups, now we can draw them.
        var num = 0, idx = 0; // current group number, index in current group
        // the current state of the animation, initialize to blank
        var globalmat = util.matrixFromFunc(m, n, function()
                { return bgColor; });
        reloadCanvas(util.toImageData(globalmat));

        // Return whether we have reached the end.
        function drawPixels(toDraw) {
            if (toDraw === 0)
                return false;
            var begin = idx,
                end = Math.min(groups[num].length, begin + toDraw),
                minR = Infinity, maxR = -Infinity,
                minC = Infinity, maxC = -Infinity,
                leftover = toDraw - (end - begin);
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
                submat[r - minR][c - minC] = M[r][c];
                globalmat[r][c] = M[r][c];
            }

            ctx.putImageData(util.toImageData(submat), minC, minR);
            idx = end;
            // move to the next edge group
            if (idx === groups[num].length) {
                idx = 0;
                num++;
            }
            // no more edges, signal completion
            if (num === groups.length)
                return true;
            return drawPixels(leftover);
        }

        var lastTime; // the last time at which we drew any pixels
        function animator(t) {
            if (stopped) {
                stopped();
                return;
            }
            if (lastTime === undefined) {
                // first time animator is called, just record the time
                lastTime = t;
                window.requestAnimationFrame(animator);
            } else {
                var chunkSize = Math.round((t - lastTime) * speed);
                if (chunkSize > 0) {
                    lastTime = t;
                    if (!drawPixels(chunkSize))
                        window.requestAnimationFrame(animator);
                } else {
                    window.requestAnimationFrame(animator);
                }
            }
        }
        window.requestAnimationFrame(animator);
        // stop the animation and call onStop when the stop happens.
        function stop(onStop) {
            stopped = onStop || function() {};
        }
        return util.exports({}, [stop]);
    }

    return util.exports({}, [
            // exported functions on Canvas objects
            loadImage, getImage, getImageData, reloadCanvas, getContext,
            getElem, autoToon
    ]);
}
