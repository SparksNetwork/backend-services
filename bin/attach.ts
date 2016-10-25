import {resource} from "./lib/terraform";
import {getFunctions} from "./lib/apex";
import {exitErr} from "./lib/util";

function generateConfig(functionName:string, config:{stream:string, batchSize?:number}) {
  const streamName = config.stream.replace('.', '_');
  const streamArn = `\${data.terraform_remote_state.main.${streamName}_arn}`;

  return resource("aws_lambda_event_source_mapping", [functionName, streamName].join('-'), {
    batch_size: config.batchSize || 1,
    event_source_arn: streamArn,
    enabled: true,
    function_name: `\${aws_lambda_function.${functionName}.arn}`,
    starting_position: "LATEST",
    depends_on: [`aws_iam_role_policy.${functionName}-stream`]
  });
}

getFunctions(function(err, functions) {
  if (err) { exitErr(err); }

  functions.filter(fn => fn.config['stream']).forEach(function(fn) {
    console.log(generateConfig(fn.name, fn.config as any))
  });
});

