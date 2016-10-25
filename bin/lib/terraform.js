"use strict";
function configToString(config) {
    return Object.keys(config).map(function (key) {
        const val = config[key];
        if (val.map) {
            return `  ${key} = [${val.map(v => `"${v}"`).join(', ')}]`;
        }
        if (typeof val === 'object') {
            return `  ${key} {
  ${configToString(val)}
}`;
        }
        if (typeof val === 'string') {
            return `  ${key} = "${val}"`;
        }
        if (typeof val === 'function') {
            return val(key);
        }
        return `  ${key} = ${val}`;
    }).join("\n");
}
function resource(type, name, config) {
    return `resource "${type}" "${name}" {
${configToString(config)}
}`;
}
exports.resource = resource;
function terraformJson(object) {
    return function (key) {
        const objString = JSON.stringify(object, null, 2);
        return `  ${key} = <<JSON
${objString}
JSON`;
    };
}
exports.terraformJson = terraformJson;
//# sourceMappingURL=terraform.js.map