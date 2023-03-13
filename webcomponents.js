import { HTMLElementExtended, EL, getUrl } from "./modules/htmlelementextended.js";
import { QRScanExtended, QRCodeExtended } from "./modules/qrelementextended.js";

/* global QRCode */

//TODO-NEXT document from here down - in function and at top of file
const MainStyle = `span {color: red} div.logo {padding: 10px}`; // TODO Define any styles for this element

class Main extends HTMLElementExtended { // TMove this to WebComponents standard section
    // constructor() { super(); }
    static get observedAttributes() { return ['page']; }; // Tell it what parms to load - note these are string parms, not objects which are handled differently
}

const QRstyle = `div.qrcode {color: black; border: 2px grey solid; background-color: aquamarine; padding: 2px; margin: 2px}`; // Define any styles for this element
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
            EL('qrcode-extended', {text: qrUrl}), // TODO pass other parameters e.g. security maybe style
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
            EL('qrscan-extended', { onfound: this.qr_found } )
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


