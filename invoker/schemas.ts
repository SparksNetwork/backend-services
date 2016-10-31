import * as minimatch from 'minimatch';
import * as Ajv from 'ajv';
import {ApexFunction} from "../bin/lib/apex";
import {S3} from 'aws-sdk';

function ajv(schemas:any[]) {
  const ajv = Ajv({
    coerceTypes: true
  });

  schemas.forEach(schema => ajv.addSchema(schema));
  return ajv;
}

export async function localSchemas() {
  return ajv(require('sparks-schemas/schemas.json'));
}

export async function remoteSchemas() {
  const s3 = new S3();

  const response = await s3.getObject({
    Bucket: 'terraform.sparks.network',
    Key: 'schemas.json'
  }).promise();

  const schemas = JSON.parse(response.Body as any);
  return ajv(schemas);
}

export function getSchemasFor(ajv, fn:ApexFunction) {
  const schemaPatterns = fn.config['schemas'] || [];
  const schemas = schemaPatterns
    .reduce((acc, p) =>
      acc.concat(minimatch.match(Object.keys(ajv['_schemas']), p)), []
    )
    .map(name => ajv.getSchema(name));
  return schemas;
}
