"use strict";
const fs = require('fs');
const async = require('async');
const json_1 = require("./json");
const path_1 = require("path");
function apexDefaults(cb) {
    json_1.readJsonFile('project.json', cb);
}
exports.apexDefaults = apexDefaults;
function getFunction(name, cb) {
    const path = `functions/${name}`;
    fs.exists(path, function (exists) {
        if (!exists) {
            return cb(new Error(`Function ${name} does not exist`), null);
        }
        const fn = {
            path,
            name,
            config: {}
        };
        const configPath = path_1.join(path, 'function.json');
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