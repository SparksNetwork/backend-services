"use strict";
const fs = require('fs');
function readJsonFile(path, cb) {
    fs.readFile(path, function (err, data) {
        if (err) {
            return cb(err, null);
        }
        let obj;
        try {
            obj = JSON.parse(data);
        }
        catch (error) {
            return cb(error, null);
        }
        cb(null, obj);
    });
}
exports.readJsonFile = readJsonFile;
function writeJsonFile(path, obj, cb) {
    try {
        const data = new Buffer(JSON.stringify(obj, null, 2));
        fs.writeFile(path, data, cb);
    }
    catch (error) {
        cb(error);
    }
}
exports.writeJsonFile = writeJsonFile;
//# sourceMappingURL=json.js.map