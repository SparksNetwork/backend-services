"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const StreamTransform_1 = require("../lib/StreamTransform");
const spread_1 = require("../lib/spread");
const Firebase_1 = require("../lib/ExternalFactories/Firebase");
const ramda_1 = require('ramda');
function CreateTransform(schemaName, transform) {
    return StreamTransform_1.StreamTransform(schemaName, function (message) {
        return __awaiter(this, void 0, void 0, function* () {
            const { domain, action, uid, payload } = message;
            const { values } = payload;
            const key = Firebase_1.firebaseUid();
            return yield (transform || ramda_1.identity)([{
                    streamName: 'data.firebase',
                    partitionKey: uid,
                    data: {
                        domain,
                        action,
                        key,
                        values
                    }
                }]);
        });
    });
}
exports.CreateTransform = CreateTransform;
function UpdateTransform(schemaName, transform) {
    return StreamTransform_1.StreamTransform(schemaName, function (message) {
        return __awaiter(this, void 0, void 0, function* () {
            const { domain, action, uid, payload } = message;
            const { key, values } = payload;
            return yield (transform || ramda_1.identity)([{
                    streamName: 'data.firebase',
                    partitionKey: uid,
                    data: {
                        domain,
                        action,
                        key,
                        values
                    }
                }]);
        });
    });
}
exports.UpdateTransform = UpdateTransform;
function RemoveTransform(schemaName, transform) {
    return StreamTransform_1.StreamTransform(schemaName, function (message) {
        return __awaiter(this, void 0, void 0, function* () {
            const { domain, action, uid, payload } = message;
            const { key } = payload;
            return (transform || ramda_1.identity)([{
                    streamName: 'data.firebase',
                    partitionKey: uid,
                    data: {
                        domain,
                        action,
                        key
                    }
                }]);
        });
    });
}
exports.RemoveTransform = RemoveTransform;
function CommandTransform(domain) {
    return spread_1.spread(CreateTransform(domain + '.create'), UpdateTransform(domain + '.update'), RemoveTransform(domain + '.remove'));
}
exports.CommandTransform = CommandTransform;
//# sourceMappingURL=CommandToDataTransform.js.map