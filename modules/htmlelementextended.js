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
  class HTMLElementExtended
  - never used directly, its a base class, extends HTMLElement, and is itself extended for each webcomponent
  - for documentation see the class
*/
// ...TODO-DOCS backcopy to dist-recommendations, imap_browser/imap_webcomponents.js and simulator.js

// TODO - extract from {mitrabiz(done), dist-recommendations, localcoin}/webcomponents.js and map_browser/imap_webcomponents.js, and promise-oriented in simulator.js}
// TODO - move to git, then to node module
// TODO - rework ErrorloadingWrapper - use methods or variables and also build into render (maybe shouldRender flag)
// TODO - document component life cycle
/*

  //Generally to construct a new Element class
  const Tstyle = `span {color: red}`; // Define any styles for this element
  const MyBar extends HTMLElementExtended {
    // constructor() { super(); } // Only subclass constructor if adding something, but call super() if do so.
    loadContent() { // If defined it will call this when the element is defined enough to pass the test at shouldLoadWhenConnected
        this.loadSetRenderAndReplace(`/foo.json`, { case: this.state.myparm }, (err)=>{}); // Call a URL often passing state in the query, can postprocess using this.state.data
    }
    shouldLoadWhenConnected() { return !this.state.mydata && this.state.myparm}; // a test to define when it needs loading
    static get observedAttributes() { return ['myparm']; }; // Tell it what parms to load - note these are string parms, not objects which are handled differently
    render() {
            return [
              EL('style' {textContent: Tstyle}) ); // Using styles defined above
              EL('link', {rel: 'stylesheet', href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" }); // Or on the net
              EL(tag'span', {textContent: "I am a T"}),
            ]; // build an element tree for this element
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
    // Strangely - at least on Firefox - this seems to get run before the constructor of the element
    // hence the creation of el.state if required
    // TODO confirm that behavior which seems strange (see also in HTMLElement.constructor())
    Object.entries(attributes)
        .forEach((kv) => {
            if (['textContent', 'onsubmit', 'onclick', 'onchange', 'innerHTML', 'style', 'action'].includes(kv[0])) {
                el[kv[0]] = kv[1];
            } else if (typeof(kv[1]) === 'object') {
                if (typeof el.state === 'undefined') el.state = {};
                el.state[kv[0]] = kv[1]; // e.g tagcloud, data
            } else if (typeof(kv[1]) === 'function') {
                if (typeof el.state === 'undefined') el.state = {};
                // Experimental e.g passing function on parent to daughter
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

//TODO merge ErrorLoadingWrapper into HTLMElementExtended, e.g. if loading message is defined
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
    /*
    constructor() - sets state, pulls variables from URL, or storage, binds functions etc
    static get observedAttributes - return array of names of attributes (just strings) passed
    loadSetRenderAndReplace(url, q, cb) - fetch URL, set state from data, render new version
    changeAttribute(name, newValue) - set attributes on state{}, typically converts strings to numbers or bools etc
    setState(obj) - loop over obj calling changeAttribute
    bool shouldLoadWhenConnected() - test if have sufficient state to load data for the element.
    connectedCallback - called when attached to DOM, sets state{}; maybe load data; and renders
    attributeChangedCallback(name, oldValue, newValue) - called when attributes change or added; set state{}; maybe load data; render
    loadContent() - fetch data from server
    renderAndReplace() - render, and then replace existing nodes
    [EL] render() - render an array of nodes  ALWAYS subclassed
    */
    // extend this to setup initial data, e.g. to get params from URL; or to bind functions (e.g. tick)
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        // At least on firefox the attribute handling part of "EL" is run before this constructor, and needs to create this.state
        // TODO confirm that behavior which seems strange. (see also in EL())
        if (typeof this.state === 'undefined') this.state = {}; // Equivalent of React .state, store local state here
    }

    // Override this to return an array of (string) attributes passed
    static get observedAttributes() { return []; };

    // Called to load a URL, set state based on the data returned, render and then call the callback,
    // it should not need subclassing and is usually called by subclasses of loadContent
    loadSetRenderAndReplace(url, q, cb) {
        GET(getUrl(url, q), {}, (err, data) => {
            this.setState({url, err, data});
            this.renderAndReplace();
            if (cb) cb(err); // Usually there is no extra CB
        });
    }

    // changeAttribute will be called for each attribute changed,
    // its most common use is to turn string values into data and is subclassed to do so.
    // This is called by attributeChangedCallback so new values end up in attributes (as strings) and in state (as bools, numbrs etc)
    // TODO this could be more generalized for boolean, integer, etc attributes
    changeAttribute(name, newValue) {
        if ((name === "visible") && (newValue === "false")) newValue = false;
        this.state[name] = newValue;
    }
    // Loop through all the object returned from a query and set state,
    // typically not subclassed (subclass changeAttribute instead)
    setState(obj) {
        Object.keys(obj).forEach(k => this.changeAttribute(k, obj[k]));
        // Never calling loadContent() from here as setState is called from loadContent!
    }
    // This function typically indicates we have enough information to initiate what might be a slow load process (e.g. fetch from net)
    // Overridden with a test specific to the required parameters of a webcomponent
    shouldLoadWhenConnected() { return false; }

    //Called when the element is connected into the DOM - copy attributes to state; maybe load content; and render
    //https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#using_the_lifecycle_callbacks
    //This should not need subclassing, more likely to sublass functions it calls.
    connectedCallback() {
        // TODO Its not clear this loop is needed, check if attributeChangedCallback already called ?
        this.constructor.observedAttributes
            .forEach(name => this.changeAttribute(name, this.getAttribute(name)));
        if (this.shouldLoadWhenConnected()) this.loadContent();
        // Note this render is done before loadContent complete, loadContent typically will call renderAndReplace again
        // renderAndReplace should test if it wants to render an empty element if there is no data
        this.renderAndReplace();

    }
    // Called whenever a attribute is added or changed,
    // https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#using_the_lifecycle_callbacks
    // unlikely to be subclassed
    attributeChangedCallback(name, oldValue, newValue) {
        this.changeAttribute(name, newValue); // Sets state{} may also munge value (e.g. string to boolean)
        // reconsider if now have sufficient data to load content
        if (this.isConnected && this.constructor.observedAttributes.includes(name) && this.shouldLoadWhenConnected()) {
            this.loadContent(); }
        // note this render happens before the loadContent completes
        this.renderAndReplace();
    }
    // subclass this to call server side and fetch data
    loadContent() {
        console.error("loadContent should be defined in a subclass if shouldLoadWhenConnected ever returns true");
    }
    // render() a new set of nodes, then remove existing ones and add new ones
    // Unlikely to be subclassed (subclass this.render)
    renderAndReplace() {
        const rendered = [ this.render() ];
        const skipNodes = 0;
        while (this.shadowRoot.childNodes.length > skipNodes) this.shadowRoot.childNodes[skipNodes].remove()
        /* Flatten render (not sure why at depth=3), eliminate any undefined */
        this.shadowRoot.append(...rendered.flat(3).filter(n=>!!n));
    }
    /*
    // Intentionally not defined in the parent class, and must be defined in each subclass, return array of HTMLElement
    render() {}
     */
}

//TODO deprecate ErrorLoadingWrapper - see definition of function, GETp and GET probably will not be used.
export {GETp, GET, EL, getUrl, ErrorLoadingWrapper, HTMLElementExtended};
