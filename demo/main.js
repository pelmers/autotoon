var originalData,
    currentMatrix,
    currentSobel,
    matrixStack = [],
    // limit the canvas size to the screen's size
    limit = Math.max(screen.height, screen.width),
    c = Canvas("demoCanvas", limit, limit);

function reload() {
    c.reloadCanvas(util.toImageData(currentMatrix, originalData));
}

document.querySelector("#submit").addEventListener('click', function() {
    var fileElement = document.querySelector("#file"),
        urlElement = document.querySelector("#url");
    matrixStack = [];
    function setParams() {
        originalData = c.getImageData();
        currentMatrix = util.toGrayMatrix(originalData);
    }
    if (fileElement.files[0] !== undefined) {
        var reader = new FileReader();
        reader.onload = function(e) {
            c.loadImage(e.target.result, true, setParams);
        };
        reader.readAsDataURL(fileElement.files[0]);
    } else {
        c.loadImage(urlElement.value, false, setParams);
    }
});

document.querySelector("#blur").addEventListener('click', function() {
    matrixStack.push(currentMatrix);
    currentMatrix = filters.gaussianMask(currentMatrix, 3, 1.0);
    reload();
});

document.querySelector("#sobel").addEventListener('click', function() {
    matrixStack.push(currentMatrix);
    currentSobel = filters.sobelMask(currentMatrix);
    currentMatrix = currentSobel.S;
    reload();
});

document.querySelector("#laplace").addEventListener('click', function() {
    matrixStack.push(currentMatrix);
    currentMatrix = filters.laplaceMask(currentMatrix);
    reload();
});

document.querySelector("#nonmax").addEventListener('click', function() {
    matrixStack.push(currentMatrix);
    currentMatrix = filters.nonMaxSuppression(currentSobel.S, currentSobel.G);
    reload();
});

document.querySelector("#hysteresis").addEventListener('click', function() {
    matrixStack.push(currentMatrix);
    currentMatrix = filters.hysteresis(currentMatrix);
    reload();
});

document.querySelector("#invert").addEventListener('click', function() {
    matrixStack.push(currentMatrix);
    currentMatrix = filters.inverted(currentMatrix);
    reload();
});

document.querySelector("#undo").addEventListener('click', function() {
    currentMatrix = matrixStack.pop();
    reload();
});

document.querySelector("#reset").addEventListener('click', function() {
    c.reloadCanvas(originalData);
    matrixStack.push(currentMatrix);
    currentMatrix = util.toGrayMatrix(originalData);
});

document.querySelector("#save").addEventListener('click', function() {
    window.location.href = c.getElem().toDataURL("image/png");
});
