import * as minimatch from 'minimatch';
import Ajv from 'sparks-schemas/lib/ajv';
import {ApexFunction} from "../bin/lib/apex";
const ajv = Ajv();

export function getSchemasFor(fn:ApexFunction) {
  const schemaPatterns = fn.config['schemas'] || [];
  const schemas = schemaPatterns
    .reduce((acc, p) =>
      acc.concat(minimatch.match(Object.keys(ajv['_schemas']), p)), []
    )
    .map(name => ajv.getSchema(name));
  return schemas;
}
