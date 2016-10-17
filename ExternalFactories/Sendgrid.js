"use strict";
const Sendgrid = require('Sendgrid');
let staticSendgrid = Sendgrid(process.env['SENDGRID_API_KEY']);
function sendgrid(sg) {
    if (sg) {
        staticSendgrid = sg;
    }
    return staticSendgrid;
}
exports.sendgrid = sendgrid;
//# sourceMappingURL=Sendgrid.js.map