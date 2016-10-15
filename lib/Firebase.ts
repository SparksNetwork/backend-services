import * as firebase from 'firebase';

const connections = {};

export function establishConnection(name:string, cn?:any) {
  if (cn) { connections[name] = cn; }
  if (connections[name]) { return connections[name]; }

  const app = firebase.initializeApp({
    databaseURL: process.env["FIREBASE_DATABASE_URL"],
    serviceAccount: {
      projectId: process.env["FIREBASE_PROJECT_ID"],
      clientEmail: process.env["FIREBASE_CLIENT_EMAIL"],
      privateKey: process.env["FIREBASE_PRIVATE_KEY"].replace(/\\n/g, "\n")
    },
    databaseAuthVariableOverride: {
      uid: name
    }
  }, name);

  connections[name] = app;
  return app;
}

export function connect(name:string, fn):Function {
  return function(...args) {
    return fn(...args, establishConnection(name));
  }
}

export function ref(root, ...path:string[]) {
  return path.reduce((parent, key) => {
    return parent.child(key);
  }, root);
}

export function search(app, [key, value]:[string, any], ...path:string[]):Promise<any> {
  const root = (typeof app === 'string' ? establishConnection(app) : app)
    .database()
    .ref();

  return ref(root, ...path)
    .orderByChild(key)
    .equalTo(value)
    .once('value')
    .then(s => s.val());
}

export function lookup(app, ...path:string[]):Promise<any> {
  const root = (typeof app === 'string' ? establishConnection(app) : app)
    .database()
    .ref();

  const childRef = ref(root, ...path);

  return childRef
    .once('value')
    .then(s => s.val())
}
