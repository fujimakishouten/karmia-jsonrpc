import KarmiaRPC = require("karmia-rpc");
import KarmiaContext = require("karmia-context");
import KarmiaConverterJSONRPC = require("karmia-converter-jsonrpc");

declare class KarmiaJSONRPC {
    methods: KarmiaRPC;
    converter: KarmiaConverterJSONRPC;

    constructor(options?: object);
    call(context: KarmiaContext, body: Array<object>|object): Promise<any>;
}

export = KarmiaJSONRPC;
