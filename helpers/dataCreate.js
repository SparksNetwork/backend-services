"use strict";
function dataCreate(domain, key, partitionKey, values) {
    return {
        streamName: 'data.firebase',
        partitionKey,
        data: {
            domain,
            action: 'create',
            key,
            values
        }
    };
}
exports.dataCreate = dataCreate;
//# sourceMappingURL=dataCreate.js.map