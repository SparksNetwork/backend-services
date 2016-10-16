"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const Firebase_1 = require('../lib/Firebase');
const StreamTransform_1 = require('../lib/StreamTransform');
const ramda_1 = require('ramda');
function CreateWithOwnerProfileKey(schemaName) {
    return StreamTransform_1.StreamTransform('Projects.create', function ({ domain, action, uid, payload: { values } }) {
        return __awaiter(this, void 0, void 0, function* () {
            const ownerProfileKey = yield Firebase_1.lookup('projects', 'Users', uid);
            return [
                {
                    streamName: 'data.firebase',
                    partitionKey: uid,
                    data: {
                        domain,
                        action,
                        key: Firebase_1.firebaseUid(),
                        values: ramda_1.merge(values, { ownerProfileKey })
                    }
                }
            ];
        });
    });
}
exports.CreateWithOwnerProfileKey = CreateWithOwnerProfileKey;
//# sourceMappingURL=CreateWithOwnerProfileKey.js.map