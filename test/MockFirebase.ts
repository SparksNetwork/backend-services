
export class MockRef {
  private _refs:{[index:string]:MockRef};

  constructor(private parent:MockRef, private path:string) {
    this._refs = {};
  }

  ref() {
    return this;
  }

  child(path:string) {
    return this._refs[path] = this._refs[path] || new MockRef(this, path);
  }

  update(values:any) {

  }

  remove() {

  }

  push(values:any) {

  }

  set(values:any) {

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