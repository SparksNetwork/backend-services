"use strict";
const fs = require('fs');
const async = require('async');
const json_1 = require("./json");
function apexDefaults(cb) {
    json_1.readJsonFile('project.json', cb);
}
exports.apexDefaults = apexDefaults;
function getFunctions(cb) {
    fs.readdir('functions', function (err, files) {
        if (err) {
            return cb(err, null);
        }
        async.map(files, function (file, cb) {
            const fn = {
                path: `functions/${file}`,
                name: file,
                config: {}
            };
            fs.exists(`functions/${file}/function.json`, function (exists) {
                if (exists) {
                    json_1.readJsonFile(`functions/${file}/function.json`, function (err, object) {
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
        }, cb);
    });
}
exports.getFunctions = getFunctions;
//# sourceMappingURL=apex.js.map