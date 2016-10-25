import {S3} from 'aws-sdk';
import {getFunction, ApexFunction, writeConfig} from "./lib/apex";
import {exitErr} from "./lib/util";
import {exists} from "fs";
import {join} from "path";
import async = require("async");
import {exec} from "child_process";
import {writeFile} from "fs";
import {readFile} from "fs";
import {readJsonFile, execJson, tryParse} from "./lib/json";
import {SourceMapConsumer, SourceMapGenerator} from 'source-map';
import Mapping = SourceMap.Mapping;
import GetObjectResponse = S3.GetObjectResponse;
import {unlink} from "fs";
const path = process.argv[2];

if (!path || path === '') {
  console.error('Must specify path to function');
  process.exit(1);
}

const name:string = path.split('/').slice(-1)[0];

function output(name:string, cb:(err:Error) => void) {
  console.log(`[${name}] start`);
  return function(err, stdout, stderr) {
    if (stdout && stdout.length > 0) {
      console.log(`[${name}]`, stdout);
    }
    if (stderr && stderr.length > 0) {
      console.log(`[${name}] ERR`, stderr);
    }
    console.log(`[${name}] done`);
    cb(err);
  }
}

function tsc(fn:ApexFunction) {
  return function(cb) {
    console.log('[tsc] start');
    exists(join(fn.path, 'index.js'), function(tsExists) {
      if (!tsExists) {
        exec('node_modules/.bin/tsc', output('tsc', cb));
      } else {
        console.log('[tsc] not required');
        cb(null);
      }
    });
  }
}

function sourceMapSupport(fn) {
  return function(b, cb) {
    console.log('[source-map-support] start');
    async.auto({
      writeSms: function (cb) {
        writeFile(`${fn.path}/sms.js`, `require('source-map-support').install();\n`, cb)
      },
      main: function (cb) {
        readFile(join(fn.path, 'main.js'), cb)
      },
      rawMap: function (cb) {
        readJsonFile(join(fn.path, 'main.js.map'), cb);
      },
      index: function (cb) {
        readFile(join(fn.path, 'index.js'), cb);
      },
      sms: ['writeSms', function (results, cb) {
        const cmd = `browserify --debug --node -s default ${fn.path}/sms.js \
        | exorcist ${fn.path}/sms.js.map`;

        exec(cmd, function (err, stdout, stderr) {
          cb(err, stdout.toString());
        });
      }],
      removeSms: ['sms', function(results, cb) {
        unlink(join(fn.path, 'sms.js'), cb);
      }],
      removeSmsMap: ['sms', function(results, cb) {
        unlink(join(fn.path, 'sms.js.map'), cb);
      }],
      writeMain: ['sms', 'main', function ({sms, main}, cb) {
        const data = [sms, main.toString()].join("\n");
        writeFile(join(fn.path, 'main.js'), data, cb);
      }],
      writeMap: ['sms', 'rawMap', 'index', function ({sms, rawMap, index}, cb) {
        const lines: number = sms.split("\n").length;
        const consumer = new SourceMapConsumer(rawMap);
        const gen = new SourceMapGenerator();
        gen.setSourceContent('index.js', index.toString());

        consumer.eachMapping(function (mappingItem) {
          const mapping: Mapping = {
            name: mappingItem.name,
            source: mappingItem.source,
            generated: {
              line: mappingItem.generatedLine + lines,
              column: mappingItem.generatedColumn
            },
            original: {
              line: mappingItem.originalLine,
              column: mappingItem.originalColumn
            }
          };

          gen.addMapping(mapping);
        });

        writeFile(join(fn.path, 'main.js.map'), gen.toString(), cb);
      }]
    }, 100, function (err) {
      console.log('[source-map-support] done');
      cb(err);
    });
  }
}

function browserify(fn) {
  return function(tsc, cb) {
    const cmd = `browserify --debug --node -s default -t babelify ${fn.path}/index.js \
    | exorcist ${fn.path}/main.js.map > ${fn.path}/main.js`;
    exec(cmd, output('browserify', cb))
  }
}

function injectFirebaseCredentials(fn) {
  return function(cb) {
    console.log('[firebase] inject credentials')
    async.waterfall([
      function(cb) {
        const cmd = "cd infrastructure; terraform output -json";
        execJson(cmd, cb);
      },
      function(object, cb) {
        const s3:S3 = new S3({
          signatureVersion: 'v4'
        });
        s3.getObject({
          Bucket: object.firebase_credentials_bucket.value,
          Key: object.firebase_credentials_key.value
        }, cb)
      },
      function(response:GetObjectResponse, cb) {
        writeFile(join(fn.path, 'credentials.json'), response.Body, cb);
      }
    ], cb)
  }
}

getFunction(name, function(err, fn:ApexFunction) {
  if (err) { exitErr(err); }

  async.auto({
    firebase: injectFirebaseCredentials(fn),
    tsc: tsc(fn),
    browserify: ['tsc', browserify(fn)],
    sourceMapSupport: ['browserify', sourceMapSupport(fn)]
  }, 100, function(err) {
    if (err) { exitErr(err); }
  });
});


