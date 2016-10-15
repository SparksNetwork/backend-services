import * as firebase from 'firebase';

const connections = {};

/**
 * This function returns a Firebase app. If the app has been previously
 * initialized then that same app will be returned. The name passed in is used
 * as the uid, which in turn is used by firebase security rules.
 *
 * The credentials are taken from the process environment. The following need
 * to be set:
 *
 * * FIREBASE_DATABASE_URL
 * * FIREBASE_PROJECT_ID
 * * FIREBASE_CLIENT_EMAIL
 * * FIREBASE_PRIVATE_KEY
 *
 * If an existing app is passed in as the second param then that app will be
 * returned to any new callers requesting the app of the given name. This is
 * primarily for testing as it allows the injection of a mock firebase app.
 *
 * @param name
 * @param cn
 * @returns {any}
 */
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

/**
 * Return the ref of an app at a given path
 *
 * @example
 *
 *   // Get the profile at key abc123
 *   const profile = ref('profile-service', 'Profiles', 'abc123');
 *   profile.once('value').then(s => s.val());
 *
 * @param app The firebase app or app name
 * @param path The path to the ref wanted
 */
export function ref(app, ...path:string[]) {
  const root = (typeof app === 'string' ? establishConnection(app) : app)
    .database()
    .ref();

  return path.reduce((parent, key) => {
    return parent.child(key);
  }, root);
}

/**
 * This is a helper function for performing a search using the Firebase
 * orderByChild API.
 *
 * @example Search for profiles by uid:
 *
 *   const profiles = await search('profile-service', ['uid', uidToFind], 'Profiles');
 *
 * @param app The app name or connection
 * @param key The key to search on
 * @param value The value to search for
 * @param path The path to the records parent
 * @returns {Promise<TResult>}
 */
export function search(app, [key, value]:[string, any], ...path:string[]):Promise<any> {
  return ref(app, ...path)
    .orderByChild(key)
    .equalTo(value)
    .once('value')
    .then(s => s.val());
}

/**
 * This is a helper function for looking up a record in Firebase
 *
 * @example Look up a profile:
 *
 *   const profile = await lookup('profile-service', Profiles, 'abc123');
 *
 * @param app The app name or connection
 * @param path The path to the record
 * @returns {Promise<any>}
 */
export function lookup(app, ...path:string[]):Promise<any> {
  return ref(app, ...path)
    .once('value')
    .then(s => s.val())
}
