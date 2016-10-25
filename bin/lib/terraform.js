"use strict";
function configToString(config) {
    return Object.keys(config).map(function (key) {
        var val = config[key];
        if (val.map) {
            return "  " + key + " = [" + val.map(function (v) { return "\"" + v + "\""; }).join(', ') + "]";
        }
        if (typeof val === 'object') {
            return "  " + key + " {\n  " + configToString(val) + "\n}";
        }
        if (typeof val === 'string') {
            return "  " + key + " = \"" + val + "\"";
        }
        if (typeof val === 'function') {
            return val(key);
        }
        return "  " + key + " = " + val;
    }).join("\n");
}
function resource(type, name, config) {
    return "resource \"" + type + "\" \"" + name + "\" {\n" + configToString(config) + "\n}";
}
exports.resource = resource;
function terraformJson(object) {
    return function (key) {
        var objString = JSON.stringify(object, null, 2);
        return "  " + key + " = <<JSON\n" + objString + "\nJSON";
    };
}
exports.terraformJson = terraformJson;
//# sourceMappingURL=terraform.js.map