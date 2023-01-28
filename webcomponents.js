import { HTMLElementExtended, EL, getUrl } from "./modules/htmlelementextended.js";
/* global QRCode */

//TODO-NEXT document from here down - in function and at top of file
const MainStyle = `span {color: red} div.logo {padding: 10px}`; // TODO Define any styles for this element

class Main extends HTMLElementExtended { // TMove this to WebComponents standard section
    // constructor() { super(); }
    static get observedAttributes() { return ['page']; }; // Tell it what parms to load - note these are string parms, not objects which are handled differently
}

const QRstyle = `div.qrcode {color: black; border: 2px grey solid; background-color: aquamarine; padding: 2px; margin: 2px}`; // Define any styles for this element

class QRcodeComponent extends HTMLElementExtended {
    // constructor() { super(); } // Default calls super
    static get observedAttributes() { return ['text']; }; // Tell it what parms to load - note these are string parms, not objects which are handled differently
    render() {
        let myCanvas = EL('canvas');
        let text =  this.getAttribute('text');
        QRCode.toCanvas(myCanvas,text, function (error) {
            if (error) console.error(error);
            console.log('QR displayed', text);
        })
        return [ myCanvas ];
    }
}
customElements.define('common-qrcode', QRcodeComponent); // Pass it to browser, note it MUST be xxx-yyy

class LocalCoinQRcode extends HTMLElementExtended {
    // constructor() { super(); } // Default calls super
    static get observedAttributes() { return ['amount', 'page']; }; // Tell it what parms to load - note these are string parms, not objects which are handled differently
    render() {
        // TODO-next-3
        let MYPUBLICKEY="a1b2c3"; // TODO-next-3
        //let basepage = 'http://nowhere.com/localcoin';
        let basepage = ''; // TODO replace when not testing
        let qrUrl = getUrl(basepage, {page: this.getAttribute('page'), to: MYPUBLICKEY, amount: this.getAttribute('amount') });

        return [
            EL('style', {textContent: QRstyle}), // Using styles defined above
            EL('span', {textContent: 'QR code for:'}),
            EL('div', {class: 'qrcode'}, [
                EL('a', {href: qrUrl}, [
                    EL('span', {textContent: qrUrl}),
                ]),
            ]),
            EL('common-qrcode', {text: qrUrl}), // TODO pass other parameters e.g. security
        ];
    }
}
customElements.define('localcoin-qrcode', LocalCoinQRcode); // Pass it to browser, note it MUST be xxx-yyy

class Request extends HTMLElementExtended {
    //constructor() {  super();  } // Default calls super
    static get observedAttributes() { return ['amount']; }; // Tell it what parms to load - note these are string parms, not objects which are handled differently
    change = (e) => {
        this.setAttribute('amount', e.target.value);
        e.preventDefault(); // Don't trigger click on any parent
    }
    render() {
        // TODO replace this with a prettier value collector
        return ([
            EL('localcoin-qrcode', {page: 'send', amount: this.getAttribute('amount')}), // Note amount may be null
            EL('form',{onsubmit: this.submit}, [
                EL('span', {textContent: 'How many units are you requesting'}), // TODO multicurrency
                EL('br'),
                EL('input', {type: 'number', value: this.getAttribute('amount'), onchange: this.change}),
            ])
        ]);
    }
}
customElements.define('localcoin-request', Request); // Pass it to browser, note it MUST be xxx-yyy

class Send extends HTMLElementExtended {
    //constructor() {  super();  } // Default calls super
    static get observedAttributes() { return ['amount', 'to']; }; // Tell it what parms to load - note these are string parms, not objects which are handled differently
    submit = (e) => {
        this.setAttribute('amount', e.target.elements[0].value);
        e.preventDefault(); // Don't trigger click on any parent
    }
    //TODO have to find a token to send, and mint a new token here
    render() {
        // TODO replace this with a prettier value collector
        return ([
            EL('localcoin-qrcode', {page: 'receive', amount: this.getAttribute('amount')}), // TODO need to rethink this QRCode as need sigs etc
            this.getAttribute('amount')
            ? EL('span', {textContent: `Sending ${this.getAttribute('amount')} units`}) // TODO multicurrency
            : EL('form',{onsubmit: this.submit}, [
                EL('span', {textContent: 'How many units are you sending'}), // TODO multicurrency
                EL('br'),
                EL('input', {type: 'number'}),
                EL('input', {type: 'submit', value: 'request'}),
            ])
        ]);
    }
}
customElements.define('localcoin-send', Send); // Pass it to browser, note it MUST be xxx-yyy

class Top extends HTMLElementExtended {
    //constructor() { super(); } // Always call super
    button_clicked = (e) => {
        this.state.changemenu(e.target.getAttribute('value'));
        e.preventDefault(); // Don't trigger click on any parent
    }
    button_TODO = (e) => {
        console.log("DEBUG: this button is not yet implemented"); // TODO implement wherever this is used
        e.preventDefault(); // Don't trigger click on any parent
    }
    qr_found = (msg) => {
        // TODO-next3 scan this message and decide what to do.
        console.log('Found QR code', msg);
    }
    render() {
        return ([
            EL('style', {textContent: MainStyle}), // Using styles defined above
            EL('div',{class: 'logo'},[
                EL('span', {textContent: 'LocalCoin'}),
            ]),
            EL('div',{class: 'page'}, [
                EL('localcoin-button', {text: 'Request', value: 'request', onclick: this.button_clicked }),
                EL('localcoin-button', {text: 'Send', value: 'send', onclick: this.button_clicked }),
                EL('localcoin-button', {text: 'Receive', value: 'receive', onclick: this.button_clicked }),
                EL('localcoin-button', {text: 'Wallet', value: 'wallet', onclick: this.button_clicked }),
            ]),
            EL('qr-scanner', { onfound: this.qr_found } )
        ]);
    }
}
customElements.define('localcoin-top', Top); // Pass it to browser, note it MUST be xxx-yyy
// This is the main app - runs once and keeps running unless reload page
class LocalCoinMain extends Main { //TODO some of this class may be generic, move that to Main
    constructor() {
        super();
        // extend constructor get params from URL
        for (let kv of new URLSearchParams(window.location.search).entries()) {
            if (LocalCoinMain.observedAttributes.includes(kv[0])) { // Stop any hack on other attributes
                this.setAttribute(kv[0], kv[1]);
            }
        }
    }  // Default calls super
    static get observedAttributes() { return ['page', 'amount']; }; // Tell it what parms to load - note these are string parms, not objects which are handled differently
   changemenu = (x) =>  {
       this.setAttribute('page', x);
    }
    initSession() {
       // TODO save and reload data from browser storage
        if (!document.localcoinwallet) {
            document.localcoinwallet = new Wallet();
        }
    }
    render() {
        // First load will be "top" unless set in the URL, after will be set functionally
        // TODO next line may not be fully needed since setting from search aprms
        let page = this.getAttribute('page') || 'top'
        return ( [
            EL('style', {textContent: MainStyle}), // Using styles defined above
            (page === 'top') ? EL('localcoin-top', {'changemenu': this.changemenu})
            : page === 'request' ? EL('localcoin-request')
            : page === 'send' ? EL('localcoin-send', {amount: this.getAttribute('amount')})
            : EL('span', {textContent: `${page} is not implemented`}), // TODO add other page opts from top()
        ]);
    }
}
customElements.define('localcoin-main', LocalCoinMain); // Pass it to browser, note it MUST be xxx-yyy

//Generally to construct a new Element class
const ButtonStyle = `span {color: black; border: 2px grey solid; padding: 2px; margin: 2px}`; // Define any styles for this element
class Button extends HTMLElementExtended {
    // Note action is handled by setting onclick
    // constructor() { super(); }
    static get observedAttributes() { return ['text', 'action', 'value']; }; // Tell it what parms to load - note these are string parms, not objects which are handled differently
    render() {
        return ( [
            EL('style', {textContent: ButtonStyle}), // Using styles defined above
            EL('span', {textContent: this.getAttribute('text')}),
        ]); // build an element tree for this element
    }
}
customElements.define('localcoin-button', Button); // Pass it to browser, note it MUST be xxx-yyy

// ---- QR Scanner component ---------------
// https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector/detect - but needs image from camera
// see also https://www.dynamsoft.com/codepool/web-qr-code-scanner-barcode-detection-api.html
// see also https://github.com/xulihang/barcode-detection-api-demo/blob/main/scanner.js
// see also https://dev.to/ycmjason/detecting-barcode-from-the-browser-d7n
// see also https://www.npmjs.com/package/@undecaf/barcode-detector-polyfill I'm following this example
const QRScannerStyle = `div.wrap {width: 320px; height: 240px; border: 2px grey solid; padding: 2px; margin: 2px}`; // Define any styles for this element
class QRscanner extends HTMLElementExtended {
    // TODO-NEXT wire this to send an event when QRcode detected
    // TODO-NEXT move this to a module
    constructor() {
        super();
        this.boundtick = this.tick.bind(this);
    } // default does nothing
    static get observedAttributes() { return []; }

    canvas_drawLine(start, end) {
        let context = this.context;
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
        context.lineWidth = 5;
        context.strokeStyle = 'white';
        context.stroke();
    }
    canvas_drawLine3(start, end) {
        let p1 = { x: start.x + (end.x - start.x)/4, y: start.y + (end.y - start.y)/4 };
        let p2 = { x: start.x + (end.x - start.x)*3/4, y: start.y + (end.y - start.y)*3/4};
        this.canvas_drawLine(start, p1);
        this.canvas_drawLine(p2, end);
    }
    canvas_drawSquare(cornerPoints) {
        this.canvas_drawLine3(cornerPoints[0], cornerPoints[1]);
        this.canvas_drawLine3(cornerPoints[1], cornerPoints[2]);
        this.canvas_drawLine3(cornerPoints[2], cornerPoints[3]);
        this.canvas_drawLine3(cornerPoints[3], cornerPoints[0]);
    }
    message(msg, err) {
        if (msg) {
            console.log(msg);
            if (err) console.error(err);
            this.loadingMessage.innerText = msg;
            this.loadingMessage.hidden = false;
        } else {
            this.loadingMessage.hidden = true;
        }
    }
    tick() {
        // Names correspond to old code TODO-NEXT refactor to use the new names in the rest of this code
        let loadingMessage = this.loadingMessage;
        let video = this.video;
        let canvasElement = this.canvas;
        let outputData = this.outputData;
        // END Names corresponding to old code
        this.message("⌛ Loading video...");
        let boundtick = this.boundtick; // Have to find it here. where "this" is still defined
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            this.message();
            canvasElement.hidden = false;
            //Use the height defined in the canvas element
            //canvasElement.height = video.videoHeight;
            //canvasElement.width = video.videoWidth;
            this.context.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
            //Example pulls imageData, but BarcodeDetector can use canvasElement
            //var imageData = this.context.getImageData(0, 0, canvasElement.width, canvasElement.height);
            //TODO-NEXT move BarcodeDetector to module - see node_modules/@undecaf/barcode-detector-polyfill/README.md
            BarcodeDetector.getSupportedFormats()
                .then((supportedFormats) => {
                    //let detector = new BarcodeDetector({ formats: ['aztec','data_matrix','qr_code'] });
                    //Polyfill currently doesnt support aztec or data_matrix QRcodes, just qr_code
                    let formats = ['aztec','data_matrix','qr_code'].filter(s => supportedFormats.includes(s));
                    let detector = new BarcodeDetector({ formats });
                    detector.detect(canvasElement)
                        .catch((err) =>
                            this.message('Barcode detect error', err))
                        .then((barcodes, err) => {
                            if (barcodes.length > 0) {
                                const qr = barcodes[0]; // Ignore after first found
                                this.canvas_drawSquare(qr.cornerPoints);
                                this.message(qr.rawValue);
                                this.result = qr.rawValue; // Allow value to be found passively
                                if (this.state.onfound) this.state.onfound(qr.rawValue);
                                // Intentionally not going back for a new frame
                            } else {
                                requestAnimationFrame(boundtick);
                            }
                        });
                });
            // Following example in
        } else {
            requestAnimationFrame(boundtick);
        }
    }
    wire_camera_to_video_and_tick() {
        // Wire the camera to the video
        let video = this.video;
        let boundtick = this.boundtick; // Have to find it here. where "this" is still defined
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then(function(stream) {
                video.srcObject = stream;
                video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
                // Next line gets a play() request interrupted by a new load request - says uncaught
                video.play().then(
                    () => requestAnimationFrame(boundtick),
                    (err) => this.message(err)
                );
            });
    }
    render() {
        //this.canvas = EL("canvas", {id: 'canvas', width: '640', height: '480'});
        this.canvas = EL("canvas", {id: 'canvas', width: '320', height: '240'});
        this.video = EL("video", {width: '320', height: '240'}); // Not displayed
        this.context = this.canvas.getContext("2d", {willReadFrequently: true});
        this.loadingMessage = EL('div'); // We might pass loadingMessage in as a parameter
        this.outputData = EL('div');
        this.wire_camera_to_video_and_tick();
        return ( [
            EL('style', {textContent: QRScannerStyle}), // Using styles defined above
            EL("div", {class: 'wrap'}, [
                this.canvas,
                this.loadingMessage,
                this.outputData,
            ]),
        ]);
    }

}
customElements.define('qr-scanner', QRscanner); // Pass it to browser, note it MUST be xxx-yyy

// This is not a Web Component, one of these should exist
class Wallet extends Object {
    constructor() {
        super();
        this.state = {};
        this.state.testing="ONE TWO THREE"
        this.readFromStorage() || true; // TODO_NEXTUP looks like was doing something here - replaced with "true" for now.
    }
    readFromStorage() {
        return false;
    }
}


