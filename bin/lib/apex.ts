import * as fs from 'fs';
import * as async from 'async';
import {readJsonFile, writeJsonFile} from "./json";
import {join} from "path";

export interface ApexFunction {
  path:string;
  name:string;
  config:{};
}

export function apexDefaults(cb:(err:Error, config:{}) => void) {
  readJsonFile('project.json', cb);
}

export function getFunction(name:string, cb:(err:Error, fn:ApexFunction) => void) {
  const path = `functions/${name}`;

  fs.exists(path, function(exists) {
    if (!exists) { return cb(new Error(`Function ${name} does not exist`), null); }

    const fn:ApexFunction = {
      path,
      name,
      config: {}
    };

    const configPath = join(path, 'function.json');

    fs.exists(configPath, function(exists) {
      if (exists) {
        readJsonFile(configPath, function(err, object) {
          if (err) { return cb(err, null); }
          fn.config = object;
          cb(null, fn);
        });
      } else {
        cb(null, fn);
      }
    });
  });
}

export function getFunctions(cb:(err:Error, functions:ApexFunction[]) => void) {
  fs.readdir('functions', function(err, files) {
    if (err) { return cb(err, null); }
    async.map<string,ApexFunction>(files, getFunction, cb);
  });
}

export function writeConfig(fn:ApexFunction, cb:(err:Error) => void) {
  writeJsonFile(join(fn.path, 'function.json'), fn.config, cb);
}