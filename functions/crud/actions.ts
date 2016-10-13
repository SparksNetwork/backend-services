import {Command} from 'sparks-schemas/types/command'

class InvalidPayloadError extends Error {
  private _payload:any
  get payload() { return this._payload; }

  constructor(message, payload) {
    super(message);
    this.message = message;
    this._payload = payload;
  }
}

export default function(firebase) {
  async function create(message: Command) {
    const parentRef = firebase.database().ref().child(message.domain);
    const values = message.payload.values;

    if (values && typeof values === 'object') {
      return await parentRef.push(values);
    } else {
      throw new InvalidPayloadError('Invalid payload', message);
    }
  }

  async function update(message: Command) {
    const parentRef = firebase.database().ref().child(message.domain);
    const key = message.payload.key;
    const values = message.payload.values;

    if (key && values && typeof values === 'object') {
      return await parentRef.child(key).update(values);
    } else {
      throw new InvalidPayloadError('Invalid payload', message);
    }
  }

  async function remove(message: Command) {
    const parentRef = firebase.database().ref().child(message.domain);
    const key = message.payload.key;

    if (key) {
      return await parentRef.child(key).remove();
    } else {
      throw new InvalidPayloadError('Invalid payload', message);
    }
  }

  return {create, update, remove}
}
