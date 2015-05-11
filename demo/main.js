var c = Canvas("demoCanvas", 1000, 800);
var imageURL = "http://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Comparison_convolution_correlation.svg/300px-Comparison_convolution_correlation.svg.png";
c.loadImage(imageURL, function() {
    var data = c.getImageData();
    grayScale(data);
    c.reloadCanvas(data);
});

