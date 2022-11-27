/* Summary
  GETp(httpurl, opts) - asynchronous function returns promise that resolves to json or rejects on error
  GET(httpurl, opts, cb(err, json)) - calls cb with json or err
  EL(tag, { attributes }, [ children ]) return a new element.
    Semi-intelligent attribute handling of textContent, onsubmit, onclick, innerHTML, style,
    and where attribute is object or undefined
    nested arrays of children are flattened and undefined/null eliminated
  getUrl(domain, {args})  Return a suitable URL by passing args through as parameters and encoding
  ErrorLoadingWrapper({url, qdata, err}, children)
    Wrap around a function if want to replace with an error message if err, or "Loading" if no data yet
// ... TODO fill docs in after ErrorLoadingWrapper and backcopy to mitra.biz
// ...TODO fill in docs after Standardized
// ClickableBase visible
//   shadowEls OneEntryStyle, fontAwesome;
//   show(); hide(); render_control() (chevron)
//   attribute: visible
// - ClickableLine visible title="" (trailing <hr>): show <span slot=title
// - OneEntry id=123 title= server= url= text= visible: one entry with a more.. link
//     loadContent()
// ...TODO fill in docs before bottom
*/

// ===== STANDARD PART IN {mitrabiz, dist-recommendations, localcoin}/webcomponents.js and map_browser/imap_webcomponents.js, and promise-oriented in simulator.js}
/*

  //Generally to construct a new Element class
  const Tstyle = `span {color: red}`; // Define any styles for this element
  class MyBar extends HTMLElementExtended {
    constructor() {
      super(); // Always call super
    }
    loadContent() { // If defined it will call this when the element is defined enough to pass the test at shouldLoadWhenConnected
        this.loadSetRenderAndReplace(`/foo.json`, { case: this.state.myparm }, (err)=>{}); // Call a URL often passing state in the query, can postprocess using this.state.data
    }
    shouldLoadWhenConnected() { return !this.state.mydata && this.state.myparm}; // a test to define when it needs loading
    static get observedAttributes() { return ['myparm']; }; // Tell it what parms to load - note these are string parms, not objects which are handled differently
    render() {
            return ( [
                EL('style' {textContent: Tstyle}) ), // Using styles defined above
                EL('link', {rel: 'stylesheet', href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" }), // Or on the net
                EL('span', {textContent: "I am a T"})
            ]); // build an element tree for this element
    }
    changeAttribute(name, newValue) {super.changeAttribute(name, name = "x" ? f(newValue): newValue) } // Useful preprocess of attributes
  }
  customElements.define('my-bar', MyBar); // Pass it to browser, note it MUST be xxx-yyy
*/

async function GETp(httpurl, opts) {
    /**
     *  Asynchronous function - returns promise that resolves to JSON or rejects an error
     **/
    if (typeof httpurl !== 'string') httpurl = httpurl.href;    // Assume it is a URL as no way to use "instanceof" on URL across node/browser
    const headers = new Headers();
    if (opts.start || opts.end) headers.append('range', `bytes=${opts.start || 0}-${(opts.end < Infinity) ? opts.end : ''}`);
    // if (opts.noCache) headers.append("Cache-Control", "no-cache"); It complains about preflight with no-cache
    //UNSUPPORTED const retries = typeof opts.retries === 'undefined' ? 12 : opts.retries;
    const init = {    // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
        method: 'GET',
        headers,
        mode: 'cors',
        cache: opts.noCache ? 'no-cache' : 'default', // In Chrome, This will set Cache-Control: max-age=0
        redirect: 'follow',  // Chrome defaults to manual
        keepalive: true    // Keep alive - mostly we'll be going back to same places a lot
    };
    const req = new Request(httpurl, init);
    let response = await fetch(req);
    if (!response.ok) {
        throw new Error(`${httpurl} ${response.status}: ${response.statusText}`);
    } else if (!response.headers.get('Content-Type').startsWith('application/json')) {
        throw new Error(`Query for ${httpurl} Did not return JSON`);
    } else {
        return response.json(); // Promise resolving to json
    }
}

function GET(httpurl, opts, cb ) {
    /**
     * Fetch a URL and cb(err, json)
     */
    GETp(httpurl, opts)
        .then((json) => cb(null, json))
        .catch(err => {
            cb(err); // Tell queue done with an error
        });
}

// Standardish routing to allow nesting Elements inside JS
function EL(tag, attributes = {}, children) {
    /**
     * Simplify element creation
     * tag: String for the tag e.g. "FORM"
     * attributes: object setting attributes, properties and state of the tag (state typically used for extensions)
     * children: Elements inside this tag
     */
    const el = document.createElement(tag);
    Object.entries(attributes)
        .forEach((kv) => {
            if (['textContent', 'onsubmit', 'onclick', 'onchange', 'innerHTML', 'style', 'action'].includes(kv[0])) {
                el[kv[0]] = kv[1];
            } else if ((typeof(kv[1]) === 'object') && (typeof(el.state) !== 'undefined')) { // e.g tagcloud, data
                el.state[kv[0]] = kv[1];
            } else if ((typeof(kv[1]) === 'function') && (typeof(el.state) !== 'undefined')) {
                // Experimental e.g passing function on parent to daughtr
                el.state[kv[0]] = kv[1];
            } else if ((kv[1] !== null) && (typeof(kv[1]) !== "undefined"))  {
                // Do not set attributes to null or undefined, they will end up as 'null' or 'undefined'
                el.setAttribute(kv[0], kv[1]);
            }
        });
    if (children) {
        if (Array.isArray(children)) {
            el.append(...children.flat(3).filter(n => !!n));
        } else {
            el.append(children);
        }
    }
    return el;
}

function getUrl(domain, q) {
    /*
     * Get a suitable URL for a query passed as an object
     * domain: String containing domain part of URL e.g. "http://mitra.biz/foo"
     * query: Object containing parameters for query part of url.
     *  Will strip out nulls
     */
    const query = Object.entries(q).filter(kv => ((kv[1] != null) && (typeof(kv[1]) !== 'undefined'))).map(kv => `${kv[0]}=${encodeURIComponent(kv[1])}`).join('&');
    return query.length ? `${domain}?${query}` : domain;
}

const ErrorLoadingWrapper = ({url, qdata, err}, children) => (
    /*
      Wrapped around element tree to replace it with Error message or loading warning
     */
    err
        ? EL("div", {class: "error"},[`Error on ${url}`, EL("br"), err.message])
        : !qdata
            ? EL("span", { textContent: "Loading..."})
            : children
);

//TODO document from here down - in function and at top of file
class HTMLElementExtended extends HTMLElement {
    /*
      Parent class for extending HTMLElement for a new element, usually an element will extend this instead of HTMLElement
     */
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this.state = {}; // Equivalent of React .state
    }
    static get observedAttributes() { return []; }; // Override with array of (string) attributes passed
    loadSetRenderAndReplace(url, q, cb) {
        GET(getUrl(url, q), {}, (err, data) => {
            this.setState({url, err, data});
            this.renderAndReplace();
            if (cb) cb(err); // Usually there is no extra CB
        });
    }
    changeAttribute(name, newValue) {
        if ((name === "visible") && (newValue === "false")) newValue = false;
        this.state[name] = newValue;
    }
    setState(obj) {
        Object.keys(obj).forEach(k => this.changeAttribute(k, obj[k]));
        // Never calling loadContent() from here as setState is called from loadContent!
    }
    // This function typically indicates we have enough information to initiate what might be a slow load process (e.g. fetch from net)
    shouldLoadWhenConnected() { return false; } // Overridden with condition to initiate load
    connectedCallback() {
        this.constructor.observedAttributes
            .forEach(name => this.changeAttribute(name, this.getAttribute(name)));
        if (this.shouldLoadWhenConnected()) this.loadContent();
        this.renderAndReplace(); // Note this render is done before loadContent complete, loadContent typically will call renderAndReplace again
    }
    attributeChangedCallback(name, oldValue, newValue) {
        this.changeAttribute(name, newValue);
        if (this.isConnected && this.constructor.observedAttributes.includes(name) && this.shouldLoadWhenConnected()) {
            this.loadContent(); }
        this.renderAndReplace(); // note this happens before the loadContent completes
    }
    loadContent() {
        console.error("loadContent should be defined in a subclass if shouldLoadWhenConnected is set");
    }
    renderAndReplace() {
        /* render() a new set of nodes, then remove existing ones and add new ones */
        const rendered = [ this.render() ];
        const skipNodes = 0; // = this.shadowRoot.styleNodes - note deprecated, typically render style each time now
        while (this.shadowRoot.childNodes.length > skipNodes) this.shadowRoot.childNodes[skipNodes].remove()
        /* Flatten render (not sure why at depth=3), eliminate any undefined */
        this.shadowRoot.append(...rendered.flat(3).filter(n=>!!n));
    }
}
// ===== END OF STANDARD PART IN webcomponents.js ON mitrabiz and dist-recommendations
const MainStyle = `span {color: red} div.logo {padding: 10px}`; // TODO Define any styles for this element

class Main extends HTMLElementExtended { // TMove this to WebComponents standard section
    constructor() {
        super(); // Always call super
    }
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
    // TODO split this into the part that makes the url and the part that renders it (which gets passed qrUrl)
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
    constructor() { super(); } // Always call super
    button_clicked = (e) => {
        this.state.changemenu(e.target.getAttribute('value'));
        e.preventDefault(); // Don't trigger click on any parent
    }
    button_TODO = (e) => {
        console.log("DEBUG: this button is not yet implemented"); // TODO implement wherever this is used
        e.preventDefault(); // Don't trigger click on any parent
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
            ])
        ]);
    }
}
customElements.define('localcoin-top', Top); // Pass it to browser, note it MUST be xxx-yyy

// This is the main app - runs once and keeps running unless reload page
class LocalCoinMain extends Main {
    constructor() {
        super();
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
    constructor() {
        super(); // Always call super
    }
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