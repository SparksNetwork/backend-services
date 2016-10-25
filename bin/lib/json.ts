import * as fs from 'fs';
import {exec} from "child_process";

export function tryParse(data:string|Buffer, cb:(err:Error, object:{}) => void) {
  let obj;
  try {
    obj = JSON.parse(data as any);
  } catch(error) {
    return cb(error, null);
  }

  cb(null, obj);
}

export function readJsonFile(path:string, cb:(err:Error, object:{}) => void) {
  fs.readFile(path, function(err, data) {
    if (err) { return cb(err, null); }
    tryParse(data, cb);
  });
}

export function writeJsonFile(path:string, obj:{}, cb:(err:Error) => void) {
  try {
    const data = new Buffer(JSON.stringify(obj, null, 2));
    fs.writeFile(path, data, cb);
  } catch(error) {
    cb(error);
  }
}

export function execJson(cmd:string, cb:(err:Error, object:{}) => void) {
  exec(cmd, function(err, stdout, stderr) {
    if (err) { return cb(err, null); }
    tryParse(stdout, cb);
  })
}