import * as fs from 'fs';
import * as async from 'async';
import {readJsonFile} from "./json";

export interface ApexFunction {
  path:string;
  name:string;
  config:{};
}

export function apexDefaults(cb:(err:Error, config:{}) => void) {
  readJsonFile('project.json', cb);
}

export function getFunctions(cb:(err:Error, functions:ApexFunction[]) => void) {
  fs.readdir('functions', function(err, files) {
    if (err) { return cb(err, null); }

    async.map<string,ApexFunction>(files, function(file, cb) {
      const fn:ApexFunction = {
        path: `functions/${file}`,
        name: file,
        config: {}
      };

      fs.exists(`functions/${file}/function.json`, function(exists) {
        if (exists) {
          readJsonFile(`functions/${file}/function.json`, function(err, object) {
            if (err) { return cb(err, null); }
            fn.config = object;
            cb(null, fn);
          });
        } else {
          cb(null, fn);
        }
      })
    }, cb);
  });
}