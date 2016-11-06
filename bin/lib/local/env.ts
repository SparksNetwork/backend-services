import * as R from 'ramda';
import {readFile} from "fs";

function validStringPair(pair) {
  return pair.length === 2 &&
    pair[0] && pair[0].length > 0 &&
    pair[1] && pair[1].length > 0
}

export function serializeEnv(env:{}):string[] {
  return R.compose<{}, string[][], string[]>(
    R.map(R.join('=')),
    R.toPairs
  )(env)
}

export function readEnvFile(path:string):Promise<{}> {
  return new Promise(function(resolve, reject) {
    readFile(path, function (err, data) {
      if (err) { return reject(err); }

      const env: {} = R.compose<string, string[], string[][], string[][], {}>(
        R.fromPairs,
        R.filter<string[]>(validStringPair),
        R.map(R.compose(
          R.split("="),
          R.trim
        )),
        R.split("\n")
      )(data.toString());

      resolve(env);
    });
  });
}

export function readFileBase64(path:string):Promise<string> {
  return new Promise(function(resolve, reject) {
    readFile(path, function (err, data) {
      if (err) {
        return reject(err);
      }
      const encoded = data.toString('base64');
      resolve(encoded);
    })
  });
}