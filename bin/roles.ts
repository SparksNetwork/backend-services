import ErrnoException = NodeJS.ErrnoException;
import {getFunctions, ApexFunction} from "./lib/apex";
import {exitErr} from "./lib/util";
import {resource, terraformJson} from "./lib/terraform";
import * as fs from 'fs';
import {readJsonFile} from "./lib/json";
import async = require("async");

function generateRole(fn:ApexFunction) {
  return resource("aws_iam_role", fn.name, {
    name_prefix: fn.name,
    path: '/',
    assume_role_policy: '${file("policies/lambda.json")}',
    lifecycle: {
      create_before_destroy: true
    }
  });
}

function generateRolePolicy(fn:ApexFunction) {
  const streamName = fn.config['stream'].replace('.', '_');

  return resource("aws_iam_role_policy", [fn.name, 'stream'].join('-'), {
    name: streamName,
    role: `\${aws_iam_role.${fn.name}.id}`,
    policy: terraformJson({
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
  })
}

function generateCustomPolicy(fn:ApexFunction, cb:(err:Error, policy:string) => void) {
  fs.exists(`${fn.path}/policy.json`, function(exists) {
    if (!exists) { return cb(null, ''); }

    readJsonFile(`${fn.path}/policy.json`, function(err, policy) {
      if (err) { return cb(err, null); }

      cb(null, resource("aws_iam_role_policy", `${fn.name}-custom`, {
        name: 'custom',
        role: `\${aws_iam_role.${fn.name}.id}`,
        policy: terraformJson(policy)
      }));
    });
  });
}

getFunctions(function(err, functions) {
  if (err) { exitErr(err); }

  async.map<ApexFunction, string>(functions, generateCustomPolicy, function(err, customPolicies) {
    functions.forEach(function (fn) {
      console.log(generateRole(fn));

      if (fn.config['stream']) {
        console.log(generateRolePolicy(fn));
      }
    });

    console.log(customPolicies.join("\n"));

    const roles = functions.map(fn => `\${aws_iam_role.${fn.name}.id}`);

    console.log(
      resource("aws_iam_policy_attachment", "logs", {
        name: "logs",
        policy_arn: "${aws_iam_policy.logs.arn}",
        roles
      })
    );

    console.log(
      resource("aws_iam_policy_attachment", "write-to-data-firebase", {
        name: "write-to-data-firebase-attachment",
        policy_arn: "${aws_iam_policy.write-to-data-firebase.arn}",
        roles
      })
    );

    console.log(
      resource("aws_iam_policy_attachment", "write-to-data-emails", {
        name: "write-to-data-emails-attachment",
        policy_arn: "${aws_iam_policy.write-to-data-emails.arn}",
        roles
      })
    );
  });
});

