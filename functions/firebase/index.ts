import {CreateData, UpdateData, RemoveData} from '@sparksnetwork/sparks-schemas/types/data'
import {ref} from '../../lib/ExternalFactories/Firebase';
import {StreamFunction} from "../../lib/StreamFunction";
import Ajv from '@sparksnetwork/sparks-schemas/lib/ajv';
import {λ} from "../../lib/lambda";

const ajv = Ajv();
const schema = ajv.getSchema('data');
const validateCreate = message => schema(message) && message.action === 'create';
const validateUpdate = message => schema(message) && message.action === 'update';
const validateRemove = message => schema(message) && message.action === 'remove';

export const create = StreamFunction(validateCreate, async function create(message: CreateData<any>) {
  const childRef = ref(message.domain, message.key);
  return await childRef.set(message.values);
});

export const update = StreamFunction(validateUpdate, async function update(message: UpdateData<any>) {
  const childRef = ref(message.domain, message.key);
  return await childRef.update(message.values);
});

export const remove = StreamFunction(validateRemove, async function remove(message: RemoveData) {
  const childRef = ref(message.domain, message.key);
  return await childRef.remove();
});

export default λ('firebase-service', create, update, remove);
