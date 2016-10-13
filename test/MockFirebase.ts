export class MockSnapshot {
  constructor(private _key:string, private _val:any) {

  }

  get key() { return this._key; }
  val() { return this._val; }
}

export class MockRef {
  private _refs:{[index:string]:MockRef};
  private _values:any;

  constructor(private parent:MockRef, private key:string) {
    this._refs = {};
  }

  ref() {
    return this;
  }

  child(path:string) {
    return this._refs[path] = this._refs[path] || new MockRef(this, path);
  }

  update(values:any) {
    if (this._values) {
      return Promise.resolve(Object.assign(this._values, values));
    } else {
      return this.set(values);
    }
  }

  remove() {
    this._values = null;
    return Promise.resolve(this.key);
  }

  push(values:any) {

  }

  set(values:any) {
    this._values = values;
    return Promise.resolve(values);
  }

  once(type:string) {
    if (type === 'value') {
      return Promise.resolve(new MockSnapshot(this.key, this._values));
    }
  }
}

export class MockDatabase {
  private _ref:MockRef;

  constructor() {
    this._ref = new MockRef(null, '');
  }

  ref() {
    return this._ref;
  }

  child(path:string) {
    return this.ref().child(path);
  }
}

export class MockFirebase {
  private _database:MockDatabase;

  constructor() {
    this._database = new MockDatabase();
  }

  database() {
    return this._database;
  }
}