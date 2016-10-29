import {S3} from 'aws-sdk';
import {getFunction, ApexFunction} from "./lib/apex";
import {exitErr, asyncTime} from "./lib/util";
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

const path = process.argv[2];

if (!path || path === '') {
  console.error('Must specify path to function');
  process.exit(1);
}

const name:string = path.split('/').slice(-1)[0];

/**
 * Runs tsc, but only if the index.js file does not exist already.
 *
 * @param fn
 * @returns {(cb:any)=>undefined}
 */
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

/**
 * This function installs the source-map-support library into the lambda function
 * code. It does this by creating a new bundle that just calls the install
 * and then prepending that to the main bundle.
 *
 * After doing this it rewrites the bundle source map by loading all of the
 * typescript source maps and looking up the original positions. It also has
 * to increment the line count to take into account the source-map-support
 * bundle.
 *
 * @param fn
 * @returns {(cb:any)=>undefined}
 */
function sourceMapSupport(fn:ApexFunction) {
  return function(cb) {
    async.auto({
      // Write the source map support code into a file
      writeSms: function (cb) {
        writeFile(`${fn.path}/sms.js`, `require('source-map-support').install();\n`, cb)
      },
      // Read the main.js file
      main: function (cb) {
        readFile(join(fn.path, 'main.js'), cb)
      },
      // Load every map file we can find in the code, excluding node_modules and
      // the other lambda functions
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
      // bundle the source map support file
      sms: ['writeSms', function (results, cb) {
        const cmd = `browserify --debug --node -s default ${fn.path}/sms.js \
        | exorcist ${fn.path}/sms.js.map`;

        exec(cmd, function (err, stdout, stderr) {
          cb(err, stdout.toString());
        });
      }],
      // remove the temporary source map support code
      removeSms: ['sms', 'writeMap', function(results, cb) {
        exists(join(fn.path, 'sms.js'), function(ex) {
          if (ex) {
            unlink(join(fn.path, 'sms.js'), cb);
          } else {
            cb(null);
          }
        });
      }],
      // remove the source map support map
      removeSmsMap: ['sms', 'writeMap', function(results, cb) {
        unlink(join(fn.path, 'sms.js.map'), cb);
      }],
      // Write the new main.js with the prepended source map support bundle
      writeMain: ['sms', 'main', function ({sms, main}, cb) {
        const data = [sms, main.toString()].join("\n");
        writeFile(join(fn.path, 'main.js'), data, cb);
      }],
      // Taking all the maps, rewrite the main.js.map file using those maps
      // and add the line count from the source map support bundle.
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
          let newMapping;

          if (originalMapping && originalMapping.source) {
            newMapping = {
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
            };
          } else {
            newMapping = {
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
          }

          if (newMapping.original.line) {
            gen.addMapping(newMapping);
          }
        });

        // Finally write the main.js.map file.
        writeFile(join(fn.path, 'main.js.map'), gen.toString(), cb);
      }]
    }, 100, function (err) {
      cb(err);
    });
  }
}

/**
 * Execute browserify on the lambda function code
 *
 * @param fn
 * @returns {(cb:any)=>undefined}
 */
function browserify(fn) {
  return function(cb) {
    const cmd = `browserify --debug --node -s default -t babelify ${fn.path}/index.js \
    | exorcist ${fn.path}/main.js.map > ${fn.path}/main.js`;

    exec(cmd, cb);
  }
}

/**
 * Download the firebase credentials from s3 and inject them into the lambda
 * function. Terraform knows where the credentials live.
 *
 * @param fn
 * @returns {(cb:any)=>undefined}
 */
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

