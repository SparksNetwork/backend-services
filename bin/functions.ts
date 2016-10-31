import async = require("async");
import {apexDefaults, getFunctions, ApexFunction} from "./lib/apex";
import {exitErr} from "./lib/util";

async.parallel([
  apexDefaults,
  getFunctions
], function(err, [defaults, functions]:[{name:string}, ApexFunction[]]) {
  if (err) { exitErr(err); }

  const output = functions.map(fn => {
    const lambda_function_name = [defaults.name, fn.name].join('_');
    return Object.assign({lambda_function_name}, fn);
  });

  console.log(
    JSON.stringify(output, null, 2)
  );
});
