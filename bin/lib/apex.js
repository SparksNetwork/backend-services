"use strict";
var fs = require("fs");
var async = require("async");
var json_1 = require("./json");
var path_1 = require("path");
function apexDefaults(cb) {
    json_1.readJsonFile('project.json', cb);
}
exports.apexDefaults = apexDefaults;
function getFunction(name, cb) {
    var path = "functions/" + name;
    fs.exists(path, function (exists) {
        if (!exists) {
            return cb(new Error("Function " + name + " does not exist"), null);
        }
        var fn = {
            path: path,
            name: name,
            config: {}
        };
        var configPath = path_1.join(path, 'function.json');
        fs.exists(configPath, function (exists) {
            if (exists) {
                json_1.readJsonFile(configPath, function (err, object) {
                    if (err) {
                        return cb(err, null);
                    }
                    fn.config = object;
                    cb(null, fn);
                });
            }
            else {
                cb(null, fn);
            }
        });
    });
}
exports.getFunction = getFunction;
function getFunctions(cb) {
    fs.readdir('functions', function (err, files) {
        if (err) {
            return cb(err, null);
        }
        async.map(files, getFunction, cb);
    });
}
exports.getFunctions = getFunctions;
function writeConfig(fn, cb) {
    json_1.writeJsonFile(path_1.join(fn.path, 'function.json'), fn.config, cb);
}
exports.writeConfig = writeConfig;
//# sourceMappingURL=apex.js.map