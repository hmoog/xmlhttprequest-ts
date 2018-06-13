// import required node.js core dependencies ///////////////////////////////////////////////////////
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as Url from 'url';
import { ClientRequest, IncomingMessage } from 'http';
import { spawn } from 'child_process';

// import required local dependencies //////////////////////////////////////////////////////////////
import { HttpHeaders } from './HttpHeaders';
import { XMLHttpRequestSettings } from './XMLHttpRequestSettings';
import { XMLHttpRequestListeners } from './XMLHttpRequestListeners';

/**
 * defines the node implementaton of the XMLHttpRequest object specs
 *
 * see: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
 */
export class XMLHttpRequest {
    // class constants /////////////////////////////////////////////////////////////////////////////

    /**
     * constant representing the state an XMLHttpRequest is in after being constructed
     */
    public static UNSENT = 0;

    /**
     * constant representing the state an XMLHttpRequest is in after 'open' was called
     */
    public static OPENED = 1;

    /**
     * constant representing the state an XMLHttpRequest is in when all response headers have been received
     */
    public static HEADERS_RECEIVED = 2;

    /**
     * constant representing the state an XMLHttpRequest is in when either the data transfer has been completed or something went wrong
     */
    public static LOADING = 3;

    /**
     * constant representing the state an XMLHttpRequest is in when the response entity body is being received
     */
    public static DONE = 4;

    // instance constants //////////////////////////////////////////////////////////////////////////

    /**
     * constant representing the state an XMLHttpRequest is in after being constructed
     */
    public UNSENT = XMLHttpRequest.UNSENT;

    /**
     * constant representing the state an XMLHttpRequest is in after 'open' was called
     */
    public OPENED = XMLHttpRequest.OPENED;

    /**
     * constant representing the state an XMLHttpRequest is in when all response headers have been received
     */
    public HEADERS_RECEIVED = XMLHttpRequest.HEADERS_RECEIVED;

    /**
     * constant representing the state an XMLHttpRequest is in when either the data transfer has been completed or something went wrong
     */
    public LOADING = XMLHttpRequest.LOADING;

    /**
     * constant representing the state an XMLHttpRequest is in when the response entity body is being received
     */
    public DONE = XMLHttpRequest.DONE;

    // public instance members /////////////////////////////////////////////////////////////////////

    /**
     * option to disable the builtin header blacklist
     *
     * IMPORTANT: this is not part of the XHR specs
     */
    public disableHeaderCheck = false;

    /**
     * an EventHandler that is called whenever the readyState attribute changes
     */
    public onreadystatechange?: () => any;

    /**
     * an EventHandler that is called whenever an abort occurs
     */
    public onabort?: () => any;

    /**
     * an EventHandler that is called whenever an error occurs
     */
    public onerror?: (err: Error) => any;

    /**
     * an EventHandler that is called whenever a request loads successfully
     */
    public onload?: () => any;

    /**
     * an EventHandler that is called whenever a request finished
     */
    public onloadend?: () => any;

    /**
     * an EventHandler that is called whenever a request starts to load
     */
    public onloadstart?: () => any;

    /**
     * an EventHandler that is called whenever a timeout occurs
     */
    public ontimeout?: (err: Error) => any;

    /**
     * stores the ready state of the request (see UNSENT, OPENED, HEADERS_RECEIVED, LOADING, DONE)
     */
    public readyState = XMLHttpRequest.UNSENT;

    /**
     * the text received from a server following a request being sent
     */
    public responseText = '';

    /**
     * usually contains a document instance of the parsed request result but since the dom isn't available in node, this is always null
     */
    public responseXML: null = null;

    /**
     * the numerical status code of the response
     */
    public status = 0;

    /**
     * the text received from a server following a request being sent
     */
    public statusText = '';

    /**
     * timeout in milliseconds after a request should time out
     */
    public timeout = 0;

    /**
     * indicates whether or not cross-site Access-Control requests should be made using credentials like authorization headers
     */
    public withCredentials = false;

    // private instance members ////////////////////////////////////////////////////////////////////

    /**
     * defines the default headers sent by our requests
     */
    private defaultHeaders: HttpHeaders = {
        'User-Agent': 'ts-XMLHttpRequest',
        'Accept': '*/*'
    };

    /**
     * error flag, used when errors occur or abort is called
     */
    private errorFlag = false;

    /**
     * list of headers that are not setable by the user according to the specs
     *
     * IMPORTNAT: this can optionally be disabled by setting disableHeaderCheck to true
     */
    private forbiddenRequestHeaders: Array<string> = [
        'accept-charset',
        'accept-encoding',
        'access-control-request-headers',
        'access-control-request-method',
        'connection',
        'content-length',
        'content-transfer-encoding',
        'cookie',
        'cookie2',
        'date',
        'expect',
        'host',
        'keep-alive',
        'origin',
        'referer',
        'te',
        'trailer',
        'transfer-encoding',
        'upgrade',
        'via'
    ];

    /**
     * list of request methods that are not setable by the user according to the specs
     */
    private forbiddenRequestMethods: Array<string> = [
        'TRACE',
        'TRACK',
        'CONNECT'
    ];

    /**
     * stores the headers that are used for this request
     */
    private headers: HttpHeaders = {};

    /**
     * stores the headers that are used for this request with the name being lower-cased
     */
    private headersLowerCase: HttpHeaders = {};

    /**
     * stores the event listeners that have been set via the addEventListener method
     */
    private listeners: XMLHttpRequestListeners = {};

    /**
     * stores a reference to the request object of node.js
     */
    private request?: ClientRequest;

    /**
     * stores a reference to the response object of node.js
     */
    private response?: IncomingMessage;

    /**
     * flag indicating if a request was sent already
     */
    private sendFlag = false;

    /**
     * stores the settings of this object which are set when calling "open"
     */
    private settings?: XMLHttpRequestSettings;

    // public instance methods /////////////////////////////////////////////////////////////////////

    /**
     * Open the connection. Currently supports local server requests.
     *
     * @param method Connection method (eg GET, POST)
     * @param url URL for the connection.
     * @param async Asynchronous connection (optional - default is true)
     * @param user Username for basic authentication (optional)
     * @param password Password for basic authentication (optional)
     */
    public open(method: string, url: string, async: boolean = true, user?: string, password?: string) {
        this.abort();

        this.errorFlag = false;

        // Check for valid request method
        if(!this.isAllowedHttpMethod(method)) {
            throw new Error('SecurityError: Request method not allowed');
        }

        this.settings = {
            'method': method,
            'url': url,
            'async': (typeof async !== 'boolean' ? true : async),
            'user': user,
            'password': password
        };

        this.setState(this.OPENED);
    }

    /**
     * disables or enables the check of allowed headers in the request
     *
     * IMPORTANT: this is not part of the W3C spec
     *
     * @param state Enable or disable header checking.
     */
    public setDisableHeaderCheck(state: boolean): void {
        this.disableHeaderCheck = state;
    }

    /**
     * sets a header for the request or appends the value if one is already set
     *
     * @param header header name
     * @param value header value
     */
    public setRequestHeader(header: string, value: string) {
        if(this.readyState !== this.OPENED) {
            throw new Error('INVALID_STATE_ERR: setRequestHeader can only be called when state is OPEN');
        }

        if(!this.isAllowedHttpHeader(header)) {
            console.warn('Refused to set unsafe header \"' + header + '\"');

            return;
        }

        if(this.sendFlag) {
            throw new Error('INVALID_STATE_ERR: send flag is true');
        }

        header = this.headersLowerCase[header.toLowerCase()] || header;
        this.headersLowerCase[header.toLowerCase()] = header;
        this.headers[header] = this.headers[header] ? this.headers[header] + ', ' + value : value;
    }

    /**
     * returns all the response headers, separated by CRLF, as a string, or null if no response has been received
     *
     * @return a string with all response headers separated by CR+LF, or null if no response has been received
     */
    public getAllResponseHeaders() {
        if(this.readyState < this.HEADERS_RECEIVED || this.errorFlag) {
            return null;
        }

        let result = '';
        if(this.response) {
            for(const i in this.response.headers) {
                // Cookie headers are excluded
                if(i !== 'set-cookie' && i !== 'set-cookie2') {
                    const headerValue: string | Array<string> | undefined = this.response.headers[i];

                    if(typeof headerValue === 'string') {
                        result += i + ': ' + headerValue + '\r\n';
                    } else if(Array.isArray(headerValue)) {
                        result += i + ': ' + headerValue.join(', ') + '\r\n';
                    } else {
                        result += i + ':\r\n';
                    }
                }
            }
        }

        return result.substr(0, result.length - 2);
    }

    /**
     * gets a header from the server response.
     *
     * @return text of the header or null if it doesn't exist.
     */
    public getResponseHeader(header: string): string | null {
        if(
            typeof header === 'string' &&
            this.readyState > this.OPENED &&
            this.response &&
            this.response.headers &&
            this.response.headers[header.toLowerCase()] &&
            !this.errorFlag
        ) {
            const responseHeader: string | string[] | undefined = this.response.headers[header.toLowerCase()];

            if(typeof responseHeader === 'string') {
                return responseHeader;
            }

            if(Array.isArray(responseHeader)) {
                return responseHeader.join(', ');
            }
        }

        return null;
    }

    /**
     * gets a request header that was set in this instance
     *
     * IMPORTANT: this is not part of the W3C specs
     *
     * @return returns the request header or empty string if not set
     */
    public getRequestHeader(name: string): string | undefined {
        if(typeof name === 'string' && this.headersLowerCase[name.toLowerCase()]) {
            return this.headers[this.headersLowerCase[name.toLowerCase()]];
        }

        return undefined;
    }

    /**
     * sends the request to the server.
     *
     * @param string data Optional data to send as request body.
     */
    public send(data?: any) {
        const self = this;

        if(this.settings === undefined) {
            throw new Error('INVALID_STATE_ERR: connection must be opened before send() is called');
        }

        if(this.readyState !== this.OPENED) {
            throw new Error('INVALID_STATE_ERR: connection must be opened before send() is called');
        }

        if(this.sendFlag) {
            throw new Error('INVALID_STATE_ERR: send has already been called');
        }

        let ssl = false, local = false;
        const url = Url.parse(this.settings.url);
        let host;

        // Determine the server
        switch(url.protocol) {
            case 'https:':
                ssl = true;
                // SSL & non-SSL both need host, no break here.
            case 'http:':
                host = url.hostname;
            break;

            case 'file:':
                local = true;
            break;

            case undefined:
            case null:
            case '':
                host = 'localhost';
            break;

            default:
                throw new Error('Protocol not supported.');
        }

        // Load files off the local filesystem (file://)
        if(local) {
            if(this.settings.method !== 'GET') {
                throw new Error('XMLHttpRequest: Only GET method is supported');
            }

            if(this.settings.async) {
                fs.readFile(url.pathname || '/', 'utf8', function(error: any, fileData: string) {
                    if(error) {
                        self.handleError(error);
                    } else {
                        self.status = 200;
                        self.responseText = fileData;
                        self.setState(self.DONE);
                    }
                });
            } else {
                try {
                    this.responseText = fs.readFileSync(url.pathname || '/', 'utf8');
                    this.status = 200;
                    this.setState(self.DONE);
                } catch(e) {
                    this.handleError(e);
                }
            }

            return;
        }

        // Default to port 80. If accessing localhost on another port be sure
        // to use http://localhost:port/path
        const port = url.port || (ssl ? 443 : 80);

        // Add query string if one is used
        const uri = url.pathname + (url.search ? url.search : '');

        // Set the defaults if they haven't been set
        for(const name in this.defaultHeaders) {
            if(!this.headersLowerCase[name.toLowerCase()]) {
                this.headers[name] = this.defaultHeaders[name];
            }
        }

        if(host) {
            // Set the Host header or the server may reject the request
            this.headers.Host = host;
        }

        // IPv6 addresses must be escaped with brackets
        if(url.host && url.host[0] === '[') {
            this.headers.Host = '[' + this.headers.Host + ']';
        }

        if(!((ssl && port === 443) || port === 80)) {
            this.headers.Host += ':' + url.port;
        }

        // Set Basic Auth if necessary
        if(this.settings.user) {
            if(typeof this.settings.password === 'undefined') {
                this.settings.password = '';
            }
            const authBuf = Buffer.from(this.settings.user + ':' + this.settings.password);
            this.headers.Authorization = 'Basic ' + authBuf.toString('base64');
        }

        // Set content length header
        if(this.settings.method === 'GET' || this.settings.method === 'HEAD') {
            data = null;
        } else if (data) {
            this.headers['Content-Length'] = '' + (Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data));

            if(!this.getRequestHeader('Content-Type')) {
                this.headers['Content-Type'] = 'text/plain;charset=UTF-8';
            }
        } else if (this.settings.method === 'POST') {
            // For a post with no data set Content-Length: 0.
            // This is required by buggy servers that don't meet the specs.
            this.headers['Content-Length'] = '0';
        }

        const options = {
            host: host,
            port: port,
            path: uri,
            method: this.settings.method,
            headers: this.headers,
            agent: false,
            withCredentials: this.withCredentials
        };

        // Reset error flag
        this.errorFlag = false;

        // Handle async requests
        if(this.settings.async) {
            // handle timeouts correctly
            if(this.timeout >= 1) {
                setTimeout(() => {
                    if(this.readyState !== this.DONE) {
                        self.handleTimeout(new Error('request timed out after ' + this.timeout + 'ms'));
                    }
                }, this.timeout);
            }

            // Use the proper protocol
            const doRequest = ssl ? https.request : http.request;

            // Request is being sent, set send flag
            this.sendFlag = true;

            // As per spec, this is called here for historical reasons.
            self.dispatchEvent('readystatechange');

            // Error handler for the request
            const errorHandler = function(error: any) {
                self.handleError(error);
            };

            let redirectCount = 0;

            // Handler for the response
            const responseHandler = function(resp: IncomingMessage) {
                // Set response let to the response we got back
                // This is so it remains accessable outside this scope
                self.response = resp;

                if(self.settings === undefined) {
                    throw new Error('INVALID_STATE_ERR: connection must be opened before send() is called');
                }

                // Check for redirect
                if(
                    self.response.headers.location && (
                        self.response.statusCode === 301 ||
                        self.response.statusCode === 302 ||
                        self.response.statusCode === 303 ||
                        self.response.statusCode === 307
                    )
                ) {
                    // increase redirect count
                    redirectCount++;

                    // prevent looped redirects
                    if(redirectCount >= 10) {
                        throw new Error('XMLHttpRequest: Request failed - too many redirects');
                    }

                    // Change URL to the redirect location
                    self.settings.url = self.response.headers.location;
                    const parsedUrl = Url.parse(self.settings.url);
                    // Set host let in case it's used later
                    host = parsedUrl.hostname;
                    // Options for the new request
                    const newOptions = {
                        hostname: parsedUrl.hostname,
                        port: parsedUrl.port,
                        path: parsedUrl.path,
                        method: self.response.statusCode === 303 ? 'GET' : self.settings.method,
                        headers: self.headers,
                        withCredentials: self.withCredentials
                    };

                    // Issue the new request
                    self.request = doRequest(newOptions, responseHandler).on('error', errorHandler);
                    self.request.end();

                    // @TODO Check if an XHR event needs to be fired here
                    return;
                }

                self.response.setEncoding('utf8');

                self.setState(self.HEADERS_RECEIVED);
                self.status = self.response.statusCode || 0;

                self.response.on('data', function(chunk) {
                    // Make sure there's some data
                    if (chunk) {
                        self.responseText += chunk;
                    }
                    // Don't emit state changes if the connection has been aborted.
                    if(self.sendFlag) {
                        self.setState(self.LOADING);
                    }
                });

                self.response.on('end', function() {
                    if(self.sendFlag) {
                        // Discard the end event if the connection has been aborted
                        self.setState(self.DONE);
                        self.sendFlag = false;
                    }
                });

                self.response.on('error', function(error) {
                    self.handleError(error);
                });
            };

            // Create the request
            self.request = doRequest(options, responseHandler).on('error', errorHandler);

            // Node 0.4 and later won't accept empty data. Make sure it's needed.
            if(data) {
                self.request.write(data);
            }

            self.request.end();

            self.dispatchEvent('loadstart');
        } else { // Synchronous
            const startTime = new Date().getTime();

            // Create a temporary file for communication with the other Node process
            const contentFile = '.node-xmlhttprequest-content-' + process.pid;
            const syncFile = '.node-xmlhttprequest-sync-' + process.pid;
            fs.writeFileSync(syncFile, '', 'utf8');

            // The async request the other Node process executes
            const execString = 'let http = require(\'http\'), https = require(\'https\'), fs = require(\'fs\');'
                             + 'let doRequest = http' + (ssl ? 's' : '') + '.request;'
                             + 'let options = ' + JSON.stringify(options) + ';'
                             + 'let responseText = \'\';'
                             + 'let req = doRequest(options, function(response) {'
                             + 'response.setEncoding(\'utf8\');'
                             + 'response.on(\'data\', function(chunk) {'
                             + '    responseText += chunk;'
                             + '});'
                             + 'response.on(\'end\', function() {'
                             + 'fs.writeFileSync('
                             + '    \'' + contentFile + '\','
                             + '    JSON.stringify({'
                             + '        err: null,'
                             + '        data: {statusCode: response.statusCode, headers: response.headers, text: responseText}'
                             + '    }),'
                             + '    \'utf8\''
                             + ');'
                             + 'fs.unlinkSync(\'' + syncFile + '\');'
                             + '});'
                             + 'response.on(\'error\', function(error) {'
                             + 'fs.writeFileSync(\'' + contentFile + '\', JSON.stringify({err: error}), \'utf8\');'
                             + 'fs.unlinkSync(\'' + syncFile + '\');'
                             + '});'
                             + '}).on(\'error\', function(error) {'
                             + 'fs.writeFileSync(\'' + contentFile + '\', JSON.stringify({err: error}), \'utf8\');'
                             + 'fs.unlinkSync(\'' + syncFile + '\');'
                             + '});'
                             + (data ? 'req.write(\'' + JSON.stringify(data).slice(1, -1).replace(/'/g, '\\\'') + '\');' : '')
                             + 'req.end();';

            self.dispatchEvent('loadstart');
            this.setState(self.LOADING);

            // Start the other Node Process, executing this string
            const syncProc = spawn(process.argv[0], ['-e', execString]);

            // since this method will run syncronized - this callback always get's called after everything is done
            syncProc.on('exit', function (code, signal) {
                // clean up the temp files
                try { fs.unlinkSync(syncFile); } catch(e) {}
                try { fs.unlinkSync(contentFile); } catch(e) {}
            });

            while(fs.existsSync(syncFile)) {
                if(this.timeout !== 0 && new Date().getTime() >= startTime + this.timeout) {
                    // kill the process when we face an error
                    syncProc.stdin.end();
                    syncProc.kill();

                    // handle the timeout error
                    return self.handleTimeout(new Error('request timed out after ' + this.timeout + 'ms'));
                }
            }

            // Kill the child process once the file has data
            syncProc.stdin.end();
            syncProc.kill();

            const resp = JSON.parse(fs.readFileSync(contentFile, 'utf8'));

            // Remove the temporary file
            fs.unlinkSync(contentFile);

            if(resp.err) {
                self.handleError(resp.err);
            } else {
                self.response = resp.data;
                self.status = resp.data.statusCode;
                self.responseText = resp.data.text;
                self.setState(self.DONE);
            }
        }
    }

    /**
     * aborts a request
     */
    public abort() {
        if(this.request) {
            this.request.abort();
            this.request = undefined;
        }

        this.headers = this.defaultHeaders;
        this.status = 0;
        this.responseText = '';
        this.responseXML = null;

        this.errorFlag = true;

        if(
            this.readyState !== this.UNSENT &&
            (this.readyState !== this.OPENED || this.sendFlag) &&
            this.readyState !== this.DONE
        ) {
            this.sendFlag = false;
            this.setState(this.DONE);
        }

        this.readyState = this.UNSENT;

        this.dispatchEvent('abort');
    }

    /**
     * adds an event listener to the XMLHttpRequest - this is the preferred method of binding to events
     */
    public addEventListener(event: string, callback: (xhr: XMLHttpRequest) => any) {
        if(!(event in this.listeners)) {
            this.listeners[event] = [];
        }

        // Currently allows duplicate callbacks. Should it?
        this.listeners[event].push(callback);
    }

    /**
     * removes an event callback that has been added with the addEventListener method.
     */
    public removeEventListener(event: string, callback: (xhr: XMLHttpRequest) => any) {
        if(event in this.listeners) {
            // Filter will return a new array with the callback removed
            this.listeners[event] = this.listeners[event].filter(function(ev: (xhr: XMLHttpRequest) => any) {
                return ev !== callback;
            });
        }
    }

    /**
     * dispatches events, including the "on" methods and events attached using addEventListener
     */
    public dispatchEvent(event: string, parameter?: any) {
        const eventHandlerMethodName: string = 'on' + event;
        if(typeof (<any> this)[eventHandlerMethodName] === 'function') {
            (<any> this)[eventHandlerMethodName](parameter);
        }

        if(event in this.listeners) {
            for(let i = 0, len = this.listeners[event].length; i < len; i++) {
                this.listeners[event][i].call(this, parameter);
            }
        }
    }

    // private instance methods ////////////////////////////////////////////////////////////////////

    /**
     * changes readyState and calls onreadystatechange
     */
    private setState(state: number) {
        if(state === this.LOADING || this.readyState !== state) {
            this.readyState = state;

            if((this.settings && this.settings.async) || this.readyState < this.OPENED || this.readyState === this.DONE) {
                this.dispatchEvent('readystatechange');
            }

            if(this.readyState === this.DONE) {
                if(!this.errorFlag) {
                    this.dispatchEvent('load');
                }

                this.dispatchEvent('loadend');
            }
        }
    }

    /**
     * called when a timeout is encountered
     */
    private handleTimeout(error: Error) {
        if(this.request) {
            this.request.abort();
            this.request = undefined;
        }

        this.status = 0;
        this.statusText = error.toString();
        this.responseText = error.stack || '';
        this.errorFlag = true;
        this.dispatchEvent('timeout', error);
        this.setState(this.DONE);
    }

    /**
     * called when an error is encountered
     */
    private handleError(error: Error) {
        this.status = 0;
        this.statusText = error.toString();
        this.responseText = error.stack || '';
        this.errorFlag = true;
        this.dispatchEvent('error', error);
        this.setState(this.DONE);
    }

    /**
     * checks if the specified header is allowed
     */
    private isAllowedHttpHeader(header: string): boolean {
        return (this.disableHeaderCheck || (header && this.forbiddenRequestHeaders.indexOf(header.toLowerCase()) === -1)) === true;
    }

    /**
     * checks if the specified request method is allowed
     */
    private isAllowedHttpMethod(method: string): boolean {
        return (method && this.forbiddenRequestMethods.indexOf(method) === -1) === true;
    }
}