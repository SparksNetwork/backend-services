function configToString(config:{}) {
  return Object.keys(config).map(function(key:string) {
    const val = config[key];

    if (val.map) {
      return `  ${key} = [${val.map(v => `"${v}"`).join(', ')}]`
    }

    if (typeof val === 'object') {
      return `  ${key} {
  ${configToString(val)}
}`
    }

    if (typeof val === 'string') {
      return `  ${key} = "${val}"`
    }

    if (typeof val === 'function') {
      return val(key);
    }

    return `  ${key} = ${val}`
  }).join("\n");
}

export function resource(type:string, name:string, config:{}) {
  return `resource "${type}" "${name}" {
${configToString(config)}
}`;
}

export function terraformJson(object) {
  return function(key:string):string {
    const objString = JSON.stringify(object, null, 2);
    return `  ${key} = <<JSON
${objString}
JSON`;
  }
}