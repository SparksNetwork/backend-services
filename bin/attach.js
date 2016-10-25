"use strict";
var terraform_1 = require("./lib/terraform");
var apex_1 = require("./lib/apex");
var util_1 = require("./lib/util");
function generateConfig(functionName, config) {
    var streamName = config.stream.replace('.', '_');
    var streamArn = "${data.terraform_remote_state.main." + streamName + "_arn}";
    return terraform_1.resource("aws_lambda_event_source_mapping", [functionName, streamName].join('-'), {
        batch_size: config.batchSize || 1,
        event_source_arn: streamArn,
        enabled: true,
        function_name: "${aws_lambda_function." + functionName + ".arn}",
        starting_position: "LATEST",
        depends_on: ["aws_iam_role_policy." + functionName + "-stream"]
    });
}
apex_1.getFunctions(function (err, functions) {
    if (err) {
        util_1.exitErr(err);
    }
    functions.filter(function (fn) { return fn.config['stream']; }).forEach(function (fn) {
        console.log(generateConfig(fn.name, fn.config));
    });
});
//# sourceMappingURL=attach.js.map