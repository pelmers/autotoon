import { fromFunc, Mat, neighborhood, toImageData } from './matrix';
import { clamp } from './util';

export type CanvasType = {
    // exported functions on Canvas objects
    loadImage: (imgSource: string, isDataURI: boolean, callback: () => void) => void;
    getImage: () => HTMLImageElement;
    getImageData: () => ImageData;
    reloadCanvas: (data: ImageData) => void;
    getContext: () => CanvasRenderingContext2D;
    getElem: () => HTMLCanvasElement;
    autoToon: (
        M: Mat,
        speed: number,
        bgColor: number,
        matrixIter: (arg0: Mat, arg1: (i: number, j: number) => void) => void,
        transform: (arg0: number[][]) => void,
        onComplete?: () => void
    ) => { stop: (onStop: () => void) => void };
};
/**
 * Wrap a canvas object with given ID and maximum parameters.
 */
export default function Canvas(
    id: string,
    maxWidth: number,
    maxHeight: number,
    maxPixels: number
): CanvasType {
    var elem = document.getElementById(id) as HTMLCanvasElement, // canvas element
        ctx = elem.getContext('2d'), // drawing context
        image: HTMLImageElement = null; // Image object

    /**
     * Load given image onto the canvas, replacing any existing content,
     * and resize the canvas to fit the picture.
     * Call callback once the image is loaded.
     */
    function loadImage(imgSource: string, isDataURI: boolean, callback: () => void) {
        function handler() {
            // downscale factor image to maxWidth or maxHeight if it's too big
            var scaling = clamp(
                1 / Math.max(image.width / maxWidth, image.height / maxHeight),
                0.0,
                1.0
            );
            elem.width = Math.floor(scaling * image.width);
            elem.height = Math.floor(scaling * image.height);
            const size = elem.width * elem.height;
            if (size > maxPixels) {
                const maxScale = Math.sqrt(size / maxPixels);
                elem.width = Math.floor(elem.width / maxScale);
                elem.height = Math.floor(elem.height / maxScale);
            }
            ctx.drawImage(image, 0, 0, elem.width, elem.height);
            if (callback) callback();
        }
        image = new Image();
        image.onload = handler;
        // for some reason setting this when the src is actually not
        // cross-origin causes firefox to not fire the onload handler
        if (!isDataURI)
            // allow cross-origin requests for supported servers
            image.crossOrigin = 'Anonymous';
        image.src = imgSource;
    }

    /**
     * Reload the canvas with given ImageData.
     */
    function reloadCanvas(data: ImageData) {
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
    function getImage() {
        return image;
    }

    /**
     * Return the current canvas 2D context.
     */
    function getContext() {
        return ctx;
    }

    /**
     * Return the current canvas DOM element.
     */
    function getElem() {
        return elem;
    }

    /**
     * Animate the drawing of the edges of M, with speed given in pixels / ms,
     * bgColor defining the grayscale value of the background (either 0 or
     * 255), and matrixIter being a function which takes parameters M and
     * callback(i,j) and iterates over each element of M in some order, calling
     * callback at each element, and transform(edges) optionally provides a
     * function to re-order or otherwise modify the list of edges found and is
     * called before animation begins. Return an object that contains a
     * function .stop(cb) which stops the animation and calls cb on the next
     * frame.
     */
    function autoToon(
        M: Mat,
        speed: number,
        bgColor: number,
        matrixIter: (arg0: Mat, arg1: (i: number, j: number) => void) => void,
        transform: (arg0: number[][]) => void,
        onComplete?: () => void
    ) {
        var m = M.length,
            n = M[0].length,
            groupedPixels: { [pixel: number]: boolean } = {},
            groups: number[][] = [],
            stopCallback: () => void = null,
            num = 0, // current index in groups
            idx = 0, // current index in groups[num]
            // the current state of the animation, initially all background
            globalmat = fromFunc(m, n, function () {
                return bgColor;
            }),
            lastTime: number, // the last time at which we drew any pixels
            done = false; // is the animation complete?

        // Trace the edge that contains start and return its positions.
        function traceEdge(start: number) {
            var trace = [],
                stack = [start];
            groupedPixels[start] = true;
            while (stack.length > 0) {
                var v = stack.pop();
                trace.push(v);
                neighborhood(M, Math.floor(v / n), v % n, function (val, r, c) {
                    // TODO: order neighbors -- it would be better to try to
                    // continue edges in the same direction if possible
                    var pos = r * n + c;
                    if (val !== bgColor && groupedPixels[pos] === undefined) {
                        stack.push(pos);
                        groupedPixels[pos] = true;
                    }
                });
            }
            return trace;
        }

        // Partition the image into edges in some traversal order
        matrixIter(M, function (i, j) {
            var pos = i * n + j;
            if (M[i][j] !== bgColor && groupedPixels[pos] === undefined)
                groups.push(traceEdge(pos));
        });
        if (transform) transform(groups);

        // Before we begin drawing, we first clear the canvas.
        reloadCanvas(toImageData(globalmat));

        // Draw next toDraw pixels, return whether we have reached the end.
        function drawPixels(toDraw: number): boolean {
            if (toDraw === 0) return false;
            var begin = idx,
                end = Math.min(groups[num].length, begin + toDraw),
                minR = Infinity,
                maxR = -Infinity,
                minC = Infinity,
                maxC = -Infinity,
                leftover = toDraw - (end - begin);
            /* Explanation: collect the next chunk of pixels into a submatrix
             * and then call putImageData to the top left corner. To make sure
             * we don't overwrite previous edges, we initialize submatrix from
             * globalmatrix. Doing this lets the browser animate at a good
             * speed (as opposed to drawing one pixel at a time).
             */
            // First initialize the bounds on this chunk
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
            // Create submatrix from the global matrix
            var submat = fromFunc(yRange, xRange, function (i, j) {
                return globalmat[i + minR][j + minC];
            });
            // Update entries belonging to pixels in this chunk
            for (var i = begin; i < end; i++) {
                var r = Math.floor(groups[num][i] / n),
                    c = groups[num][i] % n;
                globalmat[r][c] = submat[r - minR][c - minC] = M[r][c];
            }

            // draw this submatrix in the right spot on the canvas
            ctx.putImageData(toImageData(submat), minC, minR);

            // Update counters and decide whether to continue
            idx = end;
            if (idx === groups[num].length) {
                idx = 0;
                num++;
            }
            if (num === groups.length) {
                done = true;
                onComplete && onComplete();
                return true;
            }
            return drawPixels(leftover);
        }

        // Manage the timings and call drawPixels as appropriate.
        function animator(t: number) {
            if (stopCallback) {
                stopCallback();
                done = true;
                onComplete && onComplete();
                return;
            }
            if (lastTime === undefined) {
                // First time animator is called, just record the time
                lastTime = t;
                window.requestAnimationFrame(animator);
            } else {
                var chunkSize = Math.round((t - lastTime) * speed);
                if (chunkSize > 0) {
                    lastTime = t;
                    if (!drawPixels(chunkSize)) window.requestAnimationFrame(animator);
                } else {
                    // We need more time to elapse before drawing
                    window.requestAnimationFrame(animator);
                }
            }
        }
        // Stop the animation and register onStop callback. If animation
        // already done, call it immediately.
        function stop(onStop: () => void) {
            stopCallback = onStop || function () {};
            if (done) stopCallback();
        }
        // Begin animating.
        window.requestAnimationFrame(animator);
        return { stop };
    }

    return {
        // exported functions on Canvas objects
        loadImage,
        getImage,
        getImageData,
        reloadCanvas,
        getContext,
        getElem,
        autoToon,
    };
}
