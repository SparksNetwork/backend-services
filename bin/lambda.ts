import {getFunctions, apexDefaults, ApexFunction} from "./lib/apex";
import {resource} from "./lib/terraform";
import * as async from 'async';
import {exitErr} from "./lib/util";

async.parallel([
  apexDefaults,
  getFunctions
], function(err, [defaults, functions]:[{}, ApexFunction[]]) {
  if (err) { exitErr(err); }

  functions.forEach(function(fn) {
    console.log(resource("aws_lambda_function", fn.name, {
      filename: `../dist/${fn.name}.zip`,
      function_name: `sparks_${fn.name}`,
      handler: "_apex_index.handle",
      role: `\${aws_iam_role.${fn.name}.arn}`,
      memory_size: fn.config['memory'] || defaults['memory'] || 128,
      runtime: fn.config['runtime'] || defaults['runtime'] || 'nodejs4.3',
      timeout: fn.config['timeout'] || defaults['timeout'] || 10,
      source_code_hash: `\${base64sha256(file("../dist/${fn.name}.zip"))}`,

      depends_on: ["aws_s3_bucket_object.functions"]
    }));
  })
});


