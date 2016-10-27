import {toPairs, fromPairs, compose, sortBy, prop, nth, propEq, filter} from 'ramda';

export class MockSnapshot {
  constructor(private _key:string, private _val:any) {
  }

  get key() { return this._key; }
  val() { return this._val; }
}

export class MockRef {
  private _refs:{[index:string]:MockRef};
  protected _values:any;

  get values() { return this._values; }

  constructor(protected parent:MockRef, protected key:string) {
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
      return Promise.resolve(new MockSnapshot(this.key, this.values));
    }
  }

  orderByChild(key:string) {
    const ref = new RefOrderedByChild(this.parent, this.key, key);
    ref.set(this.values);
    return ref;
  }
}

export class RefOrderedByChild extends MockRef {
  constructor(parent:MockRef, key:string, protected childKey:string) {
    super(parent, key);
  }

  get values() {
    return compose(
      fromPairs,
      sortBy(compose<any,any,any>(prop(this.childKey), nth(1))),
      toPairs
    )(this._values);
  }

  equalTo(value:any) {
    const ref = new RefOrderedByChildEqualTo(this.parent, this.key, this.childKey, value);
    ref.set(this.values);
    return ref;
  }
}

export class RefOrderedByChildEqualTo extends RefOrderedByChild {
  constructor(parent:MockRef, key:string, childKey:string, private childValue:any) {
    super(parent, key, childKey);
  }

  private get filter() {
    return compose(
      fromPairs,
      filter(compose(propEq(this.childKey, this.childValue), nth(1))),
      toPairs
    );
  }

  get values() {
    return this.filter(this._values);
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

/**
 * A mock firebase. This implements some but not all of the firebase API
 * in memory for testing purposes.
 */
export class MockFirebase {
  private _database:MockDatabase;
  private _deleted:boolean = false;

  constructor() {
    this.reset();
  }

  reset() {
    this._database = new MockDatabase();
  }

  database() {
    return this._database;
  }

  delete() {
    this._deleted = true;
    return Promise.resolve(true);
  }
}