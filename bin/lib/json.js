"use strict";
var fs = require("fs");
var child_process_1 = require("child_process");
function tryParse(data, cb) {
    var obj;
    try {
        obj = JSON.parse(data);
    }
    catch (error) {
        return cb(error, null);
    }
    cb(null, obj);
}
exports.tryParse = tryParse;
function readJsonFile(path, cb) {
    fs.readFile(path, function (err, data) {
        if (err) {
            return cb(err, null);
        }
        tryParse(data, cb);
    });
}
exports.readJsonFile = readJsonFile;
function writeJsonFile(path, obj, cb) {
    try {
        var data = new Buffer(JSON.stringify(obj, null, 2));
        fs.writeFile(path, data, cb);
    }
    catch (error) {
        cb(error);
    }
}
exports.writeJsonFile = writeJsonFile;
function execJson(cmd, cb) {
    child_process_1.exec(cmd, function (err, stdout, stderr) {
        if (err) {
            return cb(err, null);
        }
        tryParse(stdout, cb);
    });
}
exports.execJson = execJson;
//# sourceMappingURL=json.js.map