import * as fs from 'fs';

let left:number = 0;
const variables = [];

function showOutput() {
  left -= 1;
  if (left !== 0) { return; }
  console.log(variables.join("\n"))
}

fs.readdir('functions', function(err, files) {
  if (err) {
    throw err;
  }
  left = files.length;

  files.forEach(file => {
    fs.stat(`functions/${file}`, function (err, stats) {
      if (err) {
        return showOutput();
      }
      if (!stats.isDirectory()) {
        return showOutput();
      }

      variables.push(`variable "apex_function_${file}" {}`)
      showOutput();
    });
  });
});
