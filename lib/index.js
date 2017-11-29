/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';



// Variables
const karmia_rpc = require('karmia-rpc');


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
    }

    /**
     * Convert from KarmiaRPC response to JSON-RPC 2.0 response
     *
     * @param   {Object} request
     * @param   {Object} response
     * @returns {Object}
     */
    convert(request, response) {
        const self = this,
            batch = Array.isArray(request);
        request = (batch) ? request : [(request || {})];
        response = (batch) ? response : [(response || {})];

        const result = response.reduce((result, values, index) => {
            if (!('id' in request[index])) {
                return result;
            }

            const data = {
                jsonrpc: '2.0',
                id: request[index].id
            };
            if (values instanceof Error) {
                data.error = Object.getOwnPropertyNames(values).reduce((error, property_name) => {
                    error[property_name] = values[property_name];

                    return error;
                }, {});

                data.error = self.convertError(data.error, request[index]);
            } else {
                data.result = values;
            }
            result.push(data);

            return result;
        }, []);

        if (!result.length) {
            return null;
        }

        return (batch) ? result : result[0];
    }

    /**
     * Convert error object
     *
     * @param {Object} error
     * @param {Object} request
     * @returns {Object}
     */
    convertError(error, request) {
        const code = error.code,
            message = (error.message) ? error.message.toLowerCase() : '';

        if ('not found' === message) {
            error.code = -32601;
            error.message = 'Method not found';

            return error;
        }

        if ('bad request' === message) {
            error.code = -32602;
            error.message = 'Invalid params';

            return error;
        }

        if ('internal server error' === message) {
            error.code = -32603;
            error.message = 'Internal error';

            return error;
        }

        return error;
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
                }

                collection.push(self.methods.call(context, request).catch((error) => {
                    return Promise.resolve(error);
                }));

                return collection;
            }, []);

        return Promise.all(parallels).then((result) => {
            return self.convert(body, (batch) ? result : result[0]);
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
