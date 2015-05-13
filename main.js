var originalData,
    currentMatrix,
    currentSobel,
    c = Canvas("demoCanvas");

function reload() {
    c.reloadCanvas(toImageData(currentMatrix, originalData));
}

document.querySelector("#submit").addEventListener('click', function() {
    var fileElement = document.querySelector("#file"),
        urlElement = document.querySelector("#url");
    function setParams() {
        originalData = c.getImageData();
        currentMatrix = toGrayMatrix(originalData);
    }
    if (fileElement.files[0] !== undefined) {
        var reader = new FileReader();
        reader.onload = function(e) {
            c.loadImage(e.target.result, setParams);
        };
        reader.readAsDataURL(fileElement.files[0]);
    } else {
        c.loadImage(urlElement.value, setParams);
    }
});

document.querySelector("#blur").addEventListener('click', function() {
    currentMatrix = gaussianMask(currentMatrix, 3, 1.0);
    reload();
});

document.querySelector("#sobel").addEventListener('click', function() {
    currentSobel = sobelMask(currentMatrix);
    currentMatrix = currentSobel.S;
    reload();
});

document.querySelector("#laplace").addEventListener('click', function() {
    currentMatrix = laplaceMask(currentMatrix);
    reload();
});

document.querySelector("#nonmax").addEventListener('click', function() {
    currentMatrix = nonMaxSuppression(currentSobel.S, currentSobel.G);
    reload();
});

document.querySelector("#hysteresis").addEventListener('click', function() {
    currentMatrix = hysteresis(currentMatrix);
    reload();
});

document.querySelector("#invert").addEventListener('click', function() {
    currentMatrix = inverted(currentMatrix);
    reload();
});

document.querySelector("#reset").addEventListener('click', function() {
    c.reloadCanvas(originalData);
    currentMatrix = toGrayMatrix(originalData);
});
