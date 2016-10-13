import {Data, CreateData, UpdateData, RemoveData} from 'sparks-schemas/types/data'

class InvalidMessageError extends Error {
  private _payload:any;
  get payload() { return this._payload; }

  constructor(message, payload) {
    super(message);
    this.message = message;
    this._payload = payload;
  }
}

export default function(firebase) {
  async function create(message:CreateData<any>) {
    const parentRef = firebase.database().ref().child(message.domain);
    const key = message.key;
    const values = message.values;

    if (key && values && typeof values === 'object') {
      return await parentRef.child(key).set(values);
    } else {
      throw new InvalidMessageError('Invalid message', message);
    }
  }

  async function update(message: UpdateData<any>) {
    const parentRef = firebase.database().ref().child(message.domain);
    const key = message.key;
    const values = message.values;

    if (key && values && typeof values === 'object') {
      return await parentRef.child(key).update(values);
    } else {
      throw new InvalidMessageError('Invalid message', message);
    }
  }

  async function remove(message: RemoveData) {
    const parentRef = firebase.database().ref().child(message.domain);
    const key = message.key;

    if (key) {
      return await parentRef.child(key).remove();
    } else {
      throw new InvalidMessageError('Invalid message', message);
    }
  }

  return {create, update, remove}
}
