"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const firebase = require('firebase');
firebase.initializeApp({
    databaseURL: process.env['FIREBASE_DATABASE_URL'],
    serviceAccount: './credentials.json',
    databaseAuthVariableOverride: {
        uid: 'crud'
    }
});
class InvalidPayloadError extends Error {
    constructor(message, payload) {
        super(message);
        this.message = message;
        this._payload = payload;
    }
    get payload() { return this._payload; }
}
function createAction(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const parentRef = firebase.database().ref().child(message.domain);
        const values = message.payload.values;
        if (values && typeof values === 'object') {
            return yield parentRef.push(values);
        }
        else {
            throw new InvalidPayloadError('Invalid payload', message);
        }
    });
}
exports.createAction = createAction;
function updateAction(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const parentRef = firebase.database().ref().child(message.domain);
        const key = message.payload.key;
        const values = message.payload.values;
        console.log('update', key, values);
        if (key && values && typeof values === 'object') {
            return yield parentRef.child(key).update(values);
        }
        else {
            throw new InvalidPayloadError('Invalid payload', message);
        }
    });
}
exports.updateAction = updateAction;
function removeAction(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const parentRef = firebase.database().ref().child(message.domain);
        const key = message.payload.key;
        if (key) {
            return yield parentRef.child(key).remove();
        }
        else {
            throw new InvalidPayloadError('Invalid payload', message);
        }
    });
}
exports.removeAction = removeAction;
