/* Summary
  GETp(httpurl, opts) - asynchronous function returns promise that resolves to json or rejects on error
  GET(httpurl, opts, cb(err, json)) - calls cb with json or err
  EL(tag, { attributes }, [ children ]) return a new element.
    Semi-intelligent attribute handling of textContent, onsubmit, onclick, innerHTML, style,
    and where attribute is object or undefined
    nested arrays of children are flattened and undefined/null eliminated
  getUrl(domain, {args})  Return a suitable URL by passing args through as parameters and encoding
// ... TODO fill in after EL and backcopy to mitra.biz
// ...TODO fill in after Standardized
// ClickableBase visible
//   shadowEls OneEntryStyle, fontAwesome;
//   show(); hide(); render_control() (chevron)
//   attribute: visible
// - ClickableLine visible title="" (trailing <hr>): show <span slot=title
// - OneEntry id=123 title= server= url= text= visible: one entry with a more.. link
//     loadContent()
// ...TODO fill in before bottom
*/

// ===== STANDARD PART IN {mitrabiz, dist-recommendations, localcoin}/webcomponents.js and map_browser/imap_webcomponents.js, and promise-oriented in simulator.js}
// TODO review standard stuff from here down, probably remove styleNodes count
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
     * tag: String for the tag eg. "FORM"
     * attributes: object setting attributes, properties and state of the tag (state typically used for extensions)
     * children: Elements inside this tag
     */
    const el = document.createElement(tag);
    Object.entries(attributes)
        .forEach((kv) => {
            if (['textContent', 'onsubmit', 'onclick', 'innerHTML', 'style'].includes(kv[0])) {
                el[kv[0]] = kv[1];
            } else if ((typeof(kv[1]) === 'object') && (typeof(el.state) !== 'undefined')) { // e.g tagcloud, data
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
     */
    const query = Object.entries(q).map(kv => `${kv[0]}=${encodeURIComponent(kv[1])}`).join('&');
    return query.length ? `${domain}?${query}` : domain;
}

//TODO document from here down - in function and at top of file
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

    renderAndReplace() {
        /* render() a new set of nodes, then remove existing ones and add new ones */
        const rendered = [ this.render() ];
        const skipNodes = 0; // = this.shadowRoot.styleNodes
        while (this.shadowRoot.childNodes.length > skipNodes) this.shadowRoot.childNodes[skipNodes].remove()
        /* Flatten render (not sure why at depth=3), eliminate any undefined */
        this.shadowRoot.append(...rendered.flat(3).filter(n=>!!n));
    }
}
// ===== END OF STANDARD PART IN webcomponents.js ON mitrabiz and dist-recommendations

//Generally to construct a new Element class
const MainStyle = `span {color: red} div.logo {padding: 10px}`; // TODO Define any styles for this element
class Main extends HTMLElementExtended {
    constructor() {
        super(); // Always call super
    }
    static get observedAttributes() { return ['menu']; }; // Tell it what parms to load - note these are string parms, not objects which are handled differently
    top() {
        return ([
            EL('div',{class: 'logo'},[
                EL('span', {textContent: 'LocalCoin'}),
            ]),
            EL('div',{class: 'menu'}, [
                EL('localcoin-button', {text: 'Request', action: "xxx"}),
                EL('localcoin-button', {text: 'Send', action: "xxx"}),
                EL('localcoin-button', {text: 'Receive', action: "xxx"}),
                EL('localcoin-button', {text: 'Wallet', action: "xxx"}),
            ])
        ]);
    }
    request() {
        return ([
            EL('button', {text: 'Request not done', action: "xxx"}),
        ]);
    }
    render() {
        return ( [
            EL('style', {textContent: MainStyle}), // Using styles defined above
            (this.getAttribute('menu') == 'top')
            ? this.top()
            : (this.getAttribute('menu') == 'request')
            ? this.request()
            : null, // TODO add other menu opts from top()
        ]);
    }
}
customElements.define('localcoin-main', Main); // Pass it to browser, note it MUST be xxx-yyy

//Generally to construct a new Element class
const ButtonStyle = `span {color: black; border: 2px grey solid; padding: 2px; margin: 2px}`; // Define any styles for this element
class Button extends HTMLElementExtended {
    constructor() {
        super(); // Always call super
    }
    static get observedAttributes() { return ['text', 'action']; }; // Tell it what parms to load - note these are string parms, not objects which are handled differently
    render() {
        return ( [
            EL('style', {textContent: ButtonStyle}), // Using styles defined above
            EL('span', {textContent: this.getAttribute('text')}),
        ]); // build an element tree for this element
    }
}
customElements.define('localcoin-button', Button); // Pass it to browser, note it MUST be xxx-yyy
