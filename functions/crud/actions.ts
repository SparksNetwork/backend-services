import * as firebase from 'firebase';
import {Command} from 'sparks-schemas/types/command'

firebase.initializeApp({
  databaseURL: process.env['FIREBASE_DATABASE_URL'],
  serviceAccount: './credentials.json',
  databaseAuthVariableOverride: {
    uid: 'crud'
  }
});

class InvalidPayloadError extends Error {
  private _payload:any
  get payload() { return this._payload; }

  constructor(message, payload) {
    super(message);
    this.message = message;
    this._payload = payload;
  }
}

export async function createAction(message:Command) {
  const parentRef = firebase.database().ref().child(message.domain);
  const values = message.payload.values;

  if (values && typeof values === 'object') {
    return await parentRef.push(values);
  } else {
    throw new InvalidPayloadError('Invalid payload', message);
  }
}

export async function updateAction(message:Command) {
  const parentRef = firebase.database().ref().child(message.domain);
  const key = message.payload.key;
  const values = message.payload.values;

  console.log('update', key, values);

  if (key && values && typeof values === 'object') {
    return await parentRef.child(key).update(values);
  } else {
    throw new InvalidPayloadError('Invalid payload', message);
  }
}

export async function removeAction(message:Command) {
  const parentRef = firebase.database().ref().child(message.domain);
  const key = message.payload.key;

  if (key) {
    return await parentRef.child(key).remove();
  } else {
    throw new InvalidPayloadError('Invalid payload', message);
  }
}
