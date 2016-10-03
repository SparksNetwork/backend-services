"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const apex = require('apex.js');
const actions_1 = require("./actions");
const actions = {
    create: actions_1.createAction,
    update: actions_1.updateAction,
    remove: actions_1.removeAction
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = apex(function (e) {
    return __awaiter(this, void 0, void 0, function* () {
        const message = JSON.parse(e.Data);
        const action = actions[message.action];
        console.log(message);
        console.log(action);
        if (action) {
            return yield action(message);
        }
    });
});
