// TODO-next-1 get the QR code scanner in temp.js working and then integrate into webcomponents.js

/* Create a javascript program to capture an image from the camera and decode it as a QR code */

// Create a javascript program to capture an image from the camera and decode it as a QR code
// The program should be able to decode the QR code and display the contents on the screen
// The program should also be able to generate a QR code from a string and display it on the screen


var video = document.createElement("video");
var canvasElement = document.getElementById("canvas");
var loadingMessage = document.getElementById("loadingMessage");
var canvas = canvasElement.getContext("2d", {willReadFrequently: true});
var qrResult = document.getElementById("qr-result");
var outputData = document.getElementById("outputData");
var result = undefined;
var btnScanQR = document.getElementById("btn-scan-qr");

function canvas_drawLine(context, start, end) {
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.lineWidth = 5;
    context.strokeStyle = 'white';
    context.stroke();
}
function tick() {
    loadingMessage.innerText = "⌛ Loading video...";
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        loadingMessage.hidden = true;
        canvasElement.hidden = false;

        canvasElement.height = video.videoHeight;
        canvasElement.width = video.videoWidth;
        canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

        var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
        //

        BarcodeDetector.getSupportedFormats()
            .then((formats) => {
                //console.log(formats);
                //let detector = new BarcodeDetector({ formats: ['aztec','data_matrix','qr_code'] });
                let detector = new BarcodeDetector({ formats });
                detector.detect(imageData)
                    //.catch((err) =>
                    //    console.log("Barcode detect error",err))
                    .then((barcodes) => {
                        if (barcodes.length > 0) {
                            const qr = barcodes[0];
                            console.log("barcodes",barcodes);
                            canvas_drawLine(canvas, qr.cornerPoints[0], qr.cornerPoints[1])
                            canvas_drawLine(canvas, qr.cornerPoints[1], qr.cornerPoints[2])
                            canvas_drawLine(canvas, qr.cornerPoints[2], qr.cornerPoints[3])
                            canvas_drawLine(canvas, qr.cornerPoints[3], qr.cornerPoints[0])
                            outputData.innerText = qr.rawValue;
                            result = qr.rawValue;
                            //canvas.draw
                            // Intentionally not going back for a new frame
                        } else {
                            requestAnimationFrame(tick);
                        }
                    }); // Saw something about barcode.rawValue
                //TODO-next use canvas directly instead of imageata
            });
         // Following example in https://www.npmjs.com/package/@undecaf/barcode-detector-polyfill
    } else {
        requestAnimationFrame(tick);
    }
}
// Use facingMode: environment to attemt to get the front camera on phones
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
    video.srcObject = stream;
    video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscre
    // Next line gets a play() request interrupted by a new load request - says uncaughtn
    video.play().then(
        () => requestAnimationFrame(tick),
        (err) => console.log(err)
    );
});
