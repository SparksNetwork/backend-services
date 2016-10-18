"use strict";
/**
 * Helper to produce data update messages
 *
 * @param domain
 * @param key
 * @param partitionKey
 * @param values
 * @returns {{streamName: string, partitionKey: string, data: {domain: string, action: string, key: string, values: any}}}
 */
function dataUpdate(domain, key, partitionKey, values) {
    return {
        streamName: 'data.firebase',
        partitionKey,
        data: {
            domain,
            action: 'update',
            key,
            values
        }
    };
}
exports.dataUpdate = dataUpdate;
//# sourceMappingURL=dataUpdate.js.map