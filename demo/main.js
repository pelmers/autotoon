var c = Canvas("demoCanvas");
var imageURL = "https://upload.wikimedia.org/wikipedia/en/thumb/a/a4/Flag_of_the_United_States.svg/1235px-Flag_of_the_United_States.svg.png";
c.loadImage(imageURL, function() {
    window.data = c.getImageData();
    grayScale(data);
    c.reloadCanvas(data);
});

