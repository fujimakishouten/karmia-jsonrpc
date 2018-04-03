/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';



// Variables
const expect = require('expect.js'),
    karmia_context = require('karmia-context'),
    karmia_jsonrpc = require('../'),
    context = new karmia_context(),
    jsonrpc = new karmia_jsonrpc();

// RPC
jsonrpc.methods.set('success', function () {
    return Promise.resolve({success: true});
});
jsonrpc.methods.set('error', function () {
    const error = new Error('TEST_EXCEPTION');
    error.code = 500;

    return Promise.reject(error);
});
jsonrpc.methods.set('badRequest', function () {
    return Promise.reject(new Error('Bad Request'));
});
jsonrpc.methods.set('internalServerError', function () {
    return Promise.reject(new Error('Internal Server Error'));
});
jsonrpc.methods.set('400', function () {
    const error = new Error();
    error.code = 400;

    return Promise.reject(error);
});
jsonrpc.methods.set('500', function () {
    const error = new Error();
    error.code = 500;

    return Promise.reject(error);
});


describe('karmia-jsonrpc', function () {
    describe('RPC', function () {
        describe('RPC request', function () {
            it('success', function (done) {
                const data = {jsonrpc: '2.0', method: 'success', id: 'success'};
                jsonrpc.call(context, data).then((result) => {
                    expect(result.status).to.be(200);
                    expect(result.body.jsonrpc).to.be('2.0');
                    expect(result.body.result).to.eql({success: true});
                    expect(result.body.id).to.be(data.id);

                    done();
                });
            });

            it('fail', function (done) {
                const data = {jsonrpc: '2.0', method: 'error', id: 'error'};
                jsonrpc.call(context, data).then(function (result) {
                    expect(result.status).to.be(200);
                    expect(result.body.jsonrpc).to.be('2.0');
                    expect(result.body.error.code).to.eql(500);
                    expect(result.body.error.message).to.eql('TEST_EXCEPTION');
                    expect(result.body.id).to.be(data.id);

                    done();
                });
            });

            it('ID is null', function (done) {
                const data = {jsonrpc: '2.0', method: 'success', id: null};
                jsonrpc.call(context, data).then(function (result) {
                    expect(result.status).to.be(200);
                    expect(result.body.jsonrpc).to.be('2.0');
                    expect(result.body.result).to.eql({success: true});
                    expect(result.body.id).to.be(data.id);

                    done();
                });
            });
        });

        describe('Notification request', function () {
            it('success', function (done) {
                const data = {jsonrpc: '2.0', method: 'success'};
                jsonrpc.call(context, data).then(function (result) {
                    expect(result.status).to.be(204);
                    expect(result.body).to.be(null);

                    done();
                });
            });

            it('fail', function (done) {
                const data = {jsonrpc: '2.0', method: 'error'};
                jsonrpc.call(context, data).then(function (result) {
                    expect(result.status).to.be(204);
                    expect(result.body).to.be(null);

                    done();
                });
            });
        });

        it('Batch request', function (done) {
            const data = [
                {jsonrpc: '2.0', method: 'success', id: 'success'},
                {jsonrpc: '2.0', method: 'error', id: 'error'}
            ];
            jsonrpc.call(context, data).then(function (result) {
                expect(result.status).to.be(200);
                result.body.forEach(function (value, index) {
                    expect(result.body[index].jsonrpc).to.be('2.0');
                    expect(result.body[index].id).to.be(data[index].id);
                });

                expect(result.body[0].result).to.eql({success: true});
                expect(result.body[1].error.code).to.be(500);
                expect(result.body[1].error.message).to.be('TEST_EXCEPTION');

                done();
            });
        });

        describe('Error converter', function () {
            describe('Should convert error', function () {
                it('Version not specified', function (done) {
                    const data = {method: 'error', id: 'error'};
                    jsonrpc.call(context, data).then(function (result) {
                        expect(result.status).to.be(200);
                        expect(result.body.error.code).to.be(-32600);
                        expect(result.body.error.message).to.be('Invalid request');
                        expect(result.body.id).to.be(data.id);

                        done();
                    });
                });

                it('Method not specified', function (done) {
                    const data = {jsonrpc: '2.0', id: 'error'};
                    jsonrpc.call(context, data).then(function (result) {
                        expect(result.status).to.be(200);
                        expect(result.body.error.code).to.be(-32600);
                        expect(result.body.error.message).to.be('Invalid request');
                        expect(result.body.id).to.be(data.id);

                        done();
                    });
                });

                it('Method not found', function (done) {
                    const data = {jsonrpc: '2.0', method: 'not_found', id: 'error'};
                    jsonrpc.call(context, data).then(function (result) {
                        expect(result.status).to.be(200);
                        expect(result.body.error.code).to.be(-32601);
                        expect(result.body.error.message).to.be('Method not found');
                        expect(result.body.id).to.be(data.id);

                        done();
                    });
                });

                it('Invalid params', function (done) {
                    const data = {jsonrpc: '2.0', method: 'badRequest', id: 'error'};
                    jsonrpc.call(context, data).then(function (result) {
                        expect(result.status).to.be(200);
                        expect(result.body.error.code).to.be(-32602);
                        expect(result.body.error.message).to.be('Invalid params');
                        expect(result.body.id).to.be(data.id);

                        done();
                    });
                });

                it('Internal error', function (done) {
                    const data = {jsonrpc: '2.0', method: 'internalServerError', id: 'error'};
                    jsonrpc.call(context, data).then(function (result) {
                        expect(result.status).to.be(200);
                        expect(result.body.error.code).to.be(-32603);
                        expect(result.body.error.message).to.be('Internal error');
                        expect(result.body.id).to.be(data.id);

                        done();
                    });
                });
            });
        });
    });
});


/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */
