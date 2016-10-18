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
function dataRemove(domain, key, partitionKey) {
    return {
        streamName: 'data.firebase',
        partitionKey,
        data: {
            domain,
            action: 'remove',
            key
        }
    };
}
exports.dataRemove = dataRemove;
//# sourceMappingURL=dataRemove.js.map