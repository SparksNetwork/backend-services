import * as fs from 'fs';

export function readJsonFile(path:string, cb:(err:Error, object:{}) => void) {
  fs.readFile(path, function(err, data) {
    if (err) { return cb(err, null); }
    let obj;
    try {
      obj = JSON.parse(data as any);
    } catch(error) {
      return cb(error, null);
    }
    cb(null, obj);
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
