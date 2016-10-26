import * as fs from 'fs';

const functions = {};
let left:number = -1;

function generateConfig(functionName:string, config:{stream:string, batchSize?:number}) {
  const streamName = config.stream.replace('.', '_');
  const streamArn = `\${data.terraform_remote_state.main.${streamName}_arn}`;

  return `
resource "aws_lambda_event_source_mapping" "${functionName}-${streamName}" {
  batch_size        = ${config.batchSize || 1}
  event_source_arn  = "${streamArn}"
  enabled           = true
  function_name     = "${functionName}"
  starting_position = "LATEST"
}`;
}

function showOutput() {
  left -= 1;
  if (left !== 0) { return; }

  Object.keys(functions).forEach(fn => {
    console.log(functions[fn]);
  });
}

fs.readdir('functions', function(err, files) {
  if (err) { throw err; }
  left = files.length;

  files.forEach(file => {
    fs.stat(`functions/${file}`, function(err, stats) {
      if (err) { return showOutput(); }
      if (!stats.isDirectory()) { return showOutput(); }

      fs.exists(`functions/${file}/function.json`, function(exists) {
        if (!exists) { return showOutput(); }

        fs.readFile(`functions/${file}/function.json`, function(err, data) {
          if (err) { return showOutput(); }

          try {
            const config = JSON.parse(data as any);
            functions[file] = generateConfig(file, config);
          } catch(err) {
            left--;
          }

          showOutput();
        })
      });
    });
  });
});
