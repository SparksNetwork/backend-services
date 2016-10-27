import {S3} from 'aws-sdk';
import {getFunction, ApexFunction, writeConfig} from "./lib/apex";
import {exitErr} from "./lib/util";
import {exists} from "fs";
import {join} from "path";
import async = require("async");
import {exec} from "child_process";
import {writeFile} from "fs";
import {readFile} from "fs";
import {readJsonFile, execJson} from "./lib/json";
import {SourceMapConsumer, SourceMapGenerator} from 'source-map';
import Mapping = SourceMap.Mapping;
import GetObjectResponse = S3.GetObjectResponse;
import {unlink} from "fs";
import * as glob from 'glob';
import * as clc from 'cli-color';
import * as Throbber from 'cli-color/throbber';

const path = process.argv[2];

if (!path || path === '') {
  console.error('Must specify path to function');
  process.exit(1);
}

const name:string = path.split('/').slice(-1)[0];

function asyncTime(name, fn) {
  const grey = clc.xterm(252);
  return function(...args) {
    const start = Date.now();
    process.stdout.write(grey('[', name, '] '));

    const throbber = Throbber(str => {
      process.stdout.write(str);
    }, 200);
    throbber.start();

    const cb = args.slice(-1)[0];
    const newcb = function(err, ...cbargs) {
      throbber.stop();
      process.stdout.write(clc.erase.line);
      process.stdout.write(clc.move.left(clc.windowSize.width));

      if (err) {
        process.stdout.write(clc.red('[', name, '] error: ', err));
      } else {
        const time = Date.now() - start;
        process.stdout.write(clc.green('[', name, '] done ') + clc.cyan(time, 'ms'));
      }

      process.stdout.write("\n");
      cb(err, ...cbargs);
    };
    args.splice(-1, 1, newcb);
    fn.apply(this, args);
  }
}

function tsc(fn:ApexFunction) {
  return function(cb) {
    exists(join(fn.path, 'index.js'), function(tsExists) {
      if (!tsExists) {
        exec('node_modules/.bin/tsc', cb);
      } else {
        cb(null);
      }
    });
  }
}

function sourceMapSupport(fn) {
  return function(cb) {
    async.auto({
      writeSms: function (cb) {
        writeFile(`${fn.path}/sms.js`, `require('source-map-support').install();\n`, cb)
      },
      main: function (cb) {
        readFile(join(fn.path, 'main.js'), cb)
      },
      maps: function(cb) {
        glob('**/*.map', {ignore: ['node_modules/**/*', `functions/!(${fn.name})/**/*`], nodir: true}, function(err, files) {
          const tasks = files.reduce(function(acc, file) {
            const name = file.split('.').slice(0,-1).join('.');
            acc[name] = async.apply(readJsonFile, file);
            return acc;
          }, {});

          async.parallel(tasks, cb);
        });
      },
      sms: ['writeSms', function (results, cb) {
        const cmd = `browserify --debug --node -s default ${fn.path}/sms.js \
        | exorcist ${fn.path}/sms.js.map`;

        exec(cmd, function (err, stdout, stderr) {
          cb(err, stdout.toString());
        });
      }],
      removeSms: ['writeMap', function(results, cb) {
        unlink(join(fn.path, 'sms.js'), cb);
      }],
      removeSmsMap: ['writeMap', function(results, cb) {
        unlink(join(fn.path, 'sms.js.map'), cb);
      }],
      writeMain: ['sms', 'main', function ({sms, main}, cb) {
        const data = [sms, main.toString()].join("\n");
        writeFile(join(fn.path, 'main.js'), data, cb);
      }],
      writeMap: ['sms', 'maps', function ({sms, maps}, cb) {
        const lines: number = sms.split("\n").length;

        const consumers = Object.keys(maps).reduce(function(acc, name) {
          acc[name] = new SourceMapConsumer(maps[name]);
          return acc;
        }, {});

        const gen = new SourceMapGenerator();

        consumers[join(fn.path, 'main.js')].eachMapping(function (mappingItem) {
          const original:SourceMapConsumer = consumers[mappingItem.source];
          const originalMapping = original ? original.originalPositionFor({
            line: mappingItem.originalLine,
            column: mappingItem.originalColumn
          }) : null;

          if (originalMapping && originalMapping.source) {
            gen.addMapping({
              name: originalMapping.name,
              source: originalMapping.source,
              generated: {
                line: mappingItem.generatedLine + lines,
                column: mappingItem.generatedColumn
              },
              original: {
                line: originalMapping.line,
                column: originalMapping.column
              }
            });
          } else {
            gen.addMapping({
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
            });
          }
        });

        writeFile(join(fn.path, 'main.js.map'), gen.toString(), cb);
      }]
    }, 100, function (err) {
      cb(err);
    });
  }
}

function browserify(fn) {
  return function(cb) {
    const cmd = `browserify --debug --node -s default -t babelify ${fn.path}/index.js \
    | exorcist ${fn.path}/main.js.map > ${fn.path}/main.js`;

    exec(cmd, cb);
  }
}

function injectFirebaseCredentials(fn) {
  return function(cb) {
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

  async.series([
    asyncTime('firebase', injectFirebaseCredentials(fn)),
    asyncTime('tsc', tsc(fn)),
    asyncTime('browserify', browserify(fn)),
    asyncTime('source-map-support', sourceMapSupport(fn))
  ], function(err) {
    if (err) {
      console.log("\n");
      console.log('ERROR', err);
      process.exit(1);
    }
  });
});

