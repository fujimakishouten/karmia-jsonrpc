# karmia-jsonrpc

Karmia JSON-RPC 2.0 library

## Installation

```Shell
npm install karmia-jsonrpc
```

## Example
### API Gateway / Lambda
#### Request mapping template
```
#set($parameters = $input.params())
{
    "stage": "$context.stage",
    "user_id": "$context.identity.cognitoIentityId",
    "headers": {
        #foreach($name in $parameters.heaer)
            "$name": "$util.escapeJavaScript($parameters.header.get($name))"
            #if($foreach.hasNext),#end
        #end
    },
    "body": {
        "jsonrpc": "2.0",
        "method": $input.json('$.method'),
        "params": $input.json('$.params'),
        "id": "$context.requestId"
    }
}
```

#### Response mapping template
```
$input.json('$.body');
```

#### Sample function
```javascript
// Import modules
const karmia_context = require('karmia-context'),
    karmia_jsonrpc = require('karmia-jsonrpc'),
    jsonrpc = karmia_jsonrpc();

// Add methods
jsonrpc.methods.set('method', function () {
    return Promise.resolve({success: true});
});

/*
// Add multiple method
jsonrpc.methods.set({
    method1: () => {},
    method2: () => {}
});
*/

// Export handler
exports.handler = (event, context, callback) => {
    const context = karmia_context();
    jsonrpc.call(context, event.body).then((result) => {
        callback(null, result);
    }).catch((error) => {
        const result = {
            jsonrpc: '2.0',
            error: {
                code: -32603,
                message: "Internal error",
                data: error
            },
            id: event.body.id
        };

        callback(JSON.stringify(result));
    });
};
```

