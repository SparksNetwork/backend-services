"use strict";
const apex_1 = require("./lib/apex");
const util_1 = require("./lib/util");
const terraform_1 = require("./lib/terraform");
function generateRole(fn) {
    return terraform_1.resource("aws_iam_role", fn.name, {
        name_prefix: fn.name,
        path: '/',
        assume_role_policy: '${file("policies/lambda.json")}',
        lifecycle: {
            create_before_destroy: true
        }
    });
}
function generateRolePolicy(fn) {
    const streamName = fn.config['stream'].replace('.', '_');
    return terraform_1.resource("aws_iam_role_policy", [fn.name, 'stream'].join('-'), {
        name: streamName,
        role: `\${aws_iam_role.${fn.name}.id}`,
        policy: terraform_1.terraformJson({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": [
                        "kinesis:ListStreams",
                        "kinesis:DescribeStream",
                        "kinesis:GetRecords",
                        "kinesis:GetShardIterator"
                    ],
                    "Effect": "Allow",
                    "Resource": [
                        `\${data.terraform_remote_state.main.${streamName}_arn}`
                    ]
                }
            ]
        })
    });
}
apex_1.getFunctions(function (err, functions) {
    if (err) {
        util_1.exitErr(err);
    }
    functions.forEach(function (fn) {
        console.log(generateRole(fn));
        if (fn.config['stream']) {
            console.log(generateRolePolicy(fn));
        }
    });
    const roles = functions.map(fn => `\${aws_iam_role.${fn.name}.id}`);
    console.log(terraform_1.resource("aws_iam_policy_attachment", "logs", {
        name: "logs",
        policy_arn: "${aws_iam_policy.logs.arn}",
        roles
    }));
    console.log(terraform_1.resource("aws_iam_policy_attachment", "write-to-data-firebase", {
        name: "write-to-data-firebase-attachment",
        policy_arn: "${aws_iam_policy.write-to-data-firebase.arn}",
        roles
    }));
    console.log(terraform_1.resource("aws_iam_policy_attachment", "write-to-data-emails", {
        name: "write-to-data-emails-attachment",
        policy_arn: "${aws_iam_policy.write-to-data-emails.arn}",
        roles
    }));
});
//# sourceMappingURL=roles.js.map