"use strict";
const fs = require('fs');
let left = 0;
const roles = [];
function errExit(error) {
    console.error('An error:');
    console.error(error);
    process.exit(1);
}
function showOutput() {
    left -= 1;
    if (left !== 0) {
        return;
    }
    console.log(roles.join("\n"));
}
function generateRole(fnName, path) {
    return `
resource "aws_iam_role" "${fnName}" {
  name = "sparks_${fnName}"
  path = "/"
  assume_role_policy = "\${file("policies/lambda.json")}"
}
`;
}
function readJsonFile(path, cb) {
    fs.readFile(path, function (err, data) {
        if (err) {
            return cb(err, null);
        }
        try {
            const obj = JSON.parse(data);
            cb(null, obj);
        }
        catch (error) {
            cb(error, null);
        }
    });
}
function writeJsonFile(path, obj, cb) {
    try {
        const data = new Buffer(JSON.stringify(obj));
        fs.writeFile(path, data, cb);
    }
    catch (error) {
        cb(error);
    }
}
function writeRoleArn(path, arn, cb) {
    fs.exists(`${path}/function.json`, function (exists) {
        if (exists) {
            readJsonFile(`${path}/function.json`, function (err, object) {
                object['role'] = arn;
                writeJsonFile(`${path}/function.json`, object, cb);
            });
        }
        else {
            writeJsonFile(`${path}/function.json`, { role: arn }, cb);
        }
    });
}
fs.readdir('functions', function (err, files) {
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
            roles.push(generateRole(file, `functions/${file}`));
            const roleArn = `arn:aws:iam::878160042194:role/sparks_${file}`;
            writeRoleArn(`functions/${file}`, roleArn, function (err) {
                if (err) {
                    return errExit(err);
                }
                showOutput();
            });
        });
    });
});
//# sourceMappingURL=roles.js.map