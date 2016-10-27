"use strict";
const apex_1 = require("./lib/apex");
const terraform_1 = require("./lib/terraform");
const async = require('async');
const util_1 = require("./lib/util");
async.parallel([
    apex_1.apexDefaults,
    apex_1.getFunctions
], function (err, [defaults, functions]) {
    if (err) {
        util_1.exitErr(err);
    }
    functions.forEach(function (fn) {
        console.log(terraform_1.resource("aws_lambda_function", fn.name, {
            filename: `../dist/${fn.name}.zip`,
            function_name: `sparks_${fn.name}`,
            handler: "_apex_index.handle",
            role: `\${aws_iam_role.${fn.name}.arn}`,
            memory_size: fn.config['memory'] || defaults['memory'] || 128,
            runtime: fn.config['runtime'] || defaults['runtime'] || 'nodejs4.3',
            timeout: fn.config['timeout'] || defaults['timeout'] || 10,
            source_code_hash: `\${base64sha256(file("../dist/${fn.name}.zip"))}`
        }));
    });
});
//# sourceMappingURL=lambda.js.map