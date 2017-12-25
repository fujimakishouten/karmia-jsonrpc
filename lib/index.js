/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';



// Variables
const karmia_rpc = require('karmia-rpc'),
    karmia_converter_jsonrpc = require('karmia-converter-jsonrpc');


/**
 * KarmiaJSONRPC
 *
 * @class
 */
class KarmiaJSONRPC {
    /**
     * Constructor
     *
     * @constructs KarmiaJSONRPC
     * @returns {Object}
     */
    constructor(options) {
        const self = this;
        self.methods = karmia_rpc(options);
        self.converter = karmia_converter_jsonrpc();
    }

    /**
     * Call method
     *
     * @param {KarmiaContext} context
     * @param {Array|Object} body
     */
    call(context, body) {
        const self = this,
            batch = Array.isArray(body),
            requests = (batch) ? body : [body],
            parallels = requests.reduce((collection, request) => {
                if (!request.method || '2.0' !== request.jsonrpc) {
                    const error = new Error('Invalid request');
                    error.code = -32600;

                    collection.push(Promise.resolve(error));

                    return collection;
                }

                collection.push(self.methods.call(context, request).catch((error) => {
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
module.exports = (options) => {
    return new KarmiaJSONRPC(options);
};



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */
