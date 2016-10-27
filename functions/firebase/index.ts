import * as apex from 'apex.js'
import {spread} from "../../lib/spread";
import {CreateData, UpdateData, RemoveData} from 'sparks-schemas/types/data'
import {ref} from '../../lib/ExternalFactories/Firebase';
import {StreamFunction} from "../../lib/StreamFunction";
import Ajv from 'sparks-schemas/lib/ajv';

const firebaseUid = 'firebase-service';

const ajv = Ajv();
const schema = ajv.getSchema('data');
const validateCreate = message => schema(message) && message.action === 'create';
const validateUpdate = message => schema(message) && message.action === 'update';
const validateRemove = message => schema(message) && message.action === 'remove';

export const create = StreamFunction(validateCreate, async function create(message: CreateData<any>) {
  const childRef = ref(firebaseUid, message.domain, message.key);
  return await childRef.set(message.values);
});

export const update = StreamFunction(validateUpdate, async function update(message: UpdateData<any>) {
  const childRef = ref(firebaseUid, message.domain, message.key);
  return await childRef.update(message.values);
});

export const remove = StreamFunction(validateRemove, async function remove(message: RemoveData) {
  const childRef = ref(firebaseUid, message.domain, message.key);
  return await childRef.remove();
});

export default apex(spread(create, update, remove));
