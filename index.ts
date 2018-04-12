/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';



// Variables
import KarmiaContext = require("karmia-context");
import KarmiaConverterJSONRPC = require("karmia-converter-jsonrpc");
import KarmiaRPC = require("karmia-rpc");


// Declarations
declare interface Methods {
    [index: string]: Function|object;
}

declare interface Parameters {
    [index: string]: any;
}

declare interface JSONRPCRequest {
    jsonrpc?: string;
    method?: string;
    params?: any;
    id: any;
}

declare class JSONRPCError extends Error {
    code?: number;
    data?: any;
    [index: string]: any;
}


/**
 * KarmiaJSONRPC
 *
 * @class
 */
class KarmiaJSONRPC {
    /**
     * Properties
     */
    public methods: KarmiaRPC;
    public converter: KarmiaConverterJSONRPC;

    /**
     * Constructor
     *
     * @constructs KarmiaJSONRPC
     * @returns {Object}
     */
    constructor(options?: Methods) {
        const self = this;
        self.methods = new KarmiaRPC(options);
        self.converter = new KarmiaConverterJSONRPC();
    }

    /**
     * Call method
     *
     * @param {KarmiaContext} context
     * @param {Array|Object} body
     */
    call(context: KarmiaContext, body: Array<Parameters>|Parameters) {
        const self = this,
            batch = Array.isArray(body),
            requests = (batch) ? body : [body],
            parallels = requests.reduce((collection: Parameters, request: JSONRPCRequest) => {
                if (!request.method || '2.0' !== request.jsonrpc) {
                    const error = new Error('Invalid request') as JSONRPCError;
                    error.code = -32600;

                    collection.push(Promise.resolve(error));

                    return collection;
                }

                collection.push(self.methods.call(context, request).catch((error: Error) => {
                    return Promise.resolve(error);
                }));

                return collection;
            }, []);

        return Promise.all(parallels).then((result) => {
            return self.converter.convert(body, (batch) ? result : result[0]);
        }).then((result) => {
            return {
                status: (null === result) ? 204 : 200,
                body: result
            };
        });
    }
}


// Export modules
export = KarmiaJSONRPC;



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */
