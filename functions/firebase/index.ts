import * as apex from 'apex.js'
import Record = Kinesis.Record;
import {spread} from "../../lib/spread";
import * as Ajv from 'ajv';
import {CreateData, UpdateData, RemoveData} from 'sparks-schemas/types/data'
import {ref} from '../../lib/Firebase';
import {KinesisFunction} from "../../lib/KinesisFunction";

const firebaseUid = 'firebase-service';
const ajv = Ajv();
ajv.addSchema(require('sparks-schemas/schemas/data/create.json'), 'create');
ajv.addSchema(require('sparks-schemas/schemas/data/update.json'), 'update');
ajv.addSchema(require('sparks-schemas/schemas/data/remove.json'), 'remove');

export const create = KinesisFunction(ajv.getSchema('create'), async function create(message:CreateData<any>) {
  const childRef = ref(firebaseUid, message.domain, message.key);
  return await childRef.set(message.values);
});

export const update = KinesisFunction(ajv.getSchema('update'), async function update(message: UpdateData<any>) {
  const childRef = ref(firebaseUid, message.domain, message.key);
  return await childRef.update(message.values);
});

export const remove = KinesisFunction(ajv.getSchema('remove'), async function remove(message: RemoveData) {
  const childRef = ref(firebaseUid, message.domain, message.key);
  return await childRef.remove();
});

export default apex(spread(create, update, remove));