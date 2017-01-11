import * as fb from 'firebase';
import * as fs from 'fs';

let connection;

class NoConnectionError extends Error {
  constructor() {
    super('No firebase connection has been established.');
  }
}

export function firebase(serviceName:string, fn:(...args:any[]) => Promise<any>) {
  return async function(...givenArgs:any[]):Promise<any> {
    establishConnection(serviceName);
    givenArgs.push(getConnection());

    try {
      return await fn(...givenArgs);
    } finally {
      try {
        await getConnection().delete();
      } catch(err) {}
      connection = null;
    }
  }
}

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
export function establishConnection(name:string, cn?:any):firebase.app.App {
  if (cn) { connection = cn; }
  if (connection) { return connection; }

  const credentials = JSON.parse(fs.readFileSync('firebase.json') as any);
  const project = credentials['project_id'];
  const url = `https://${project}.firebaseio.com`;

  const app = fb.initializeApp({
    databaseURL: url,
    serviceAccount: 'firebase.json',
    databaseAuthVariableOverride: {
      uid: name
    }
  }, name);

  connection = app;
  return app;
}

function getConnection():firebase.app.App {
  if (!connection) {
    throw new NoConnectionError();
  }

  return connection;
}

/**
 * Return the ref of an app at a given path
 *
 * @example
 *
 *   // Get the profile at key abc123
 *   const profile = ref('Profiles', 'abc123');
 *   profile.once('value').then(s => s.val());
 *
 * @param path The path to the ref wanted
 */
export function ref(...path:string[]) {
  const root = getConnection()
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
 *   const profiles = await search(['uid', uidToFind], 'Profiles');
 *
 * @param key The key to search on
 * @param value The value to search for
 * @param path The path to the records parent
 * @returns {Promise<TResult>}
 */
export function search([key, value]:[string, any], ...path:string[]):Promise<{}> {
  return Promise.resolve(
    ref(...path)
      .orderByChild(key)
      .equalTo(value)
      .once('value')
      .then(s => s.val() || {})
  );
}

/**
 * This is a helper function for looking up a record in Firebase
 *
 * @example Look up a profile:
 *
 *   const profile = await lookup(Profiles, 'abc123');
 *
 * @param path The path to the record
 * @returns {Promise<any>}
 */
export function lookup(...path:string[]):Promise<any> {
  return Promise.resolve(
    ref(...path)
    .once('value')
    .then(s => s.val())
  );
}

// Modeled after base64 web-safe chars, but ordered by ASCII.
const PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';

// Timestamp of last push, used to prevent local collisions if you push twice in one ms.
let lastPushTime = 0;

// We generate 72-bits of randomness which get turned into 12 characters and appended to the
// timestamp to prevent collisions with other clients.  We store the last characters we
// generated because in the event of a collision, we'll use those same characters except
// "incremented" by one.
let lastRandChars = [];

export function firebaseUid():string {
  let i;
  let now = new Date().getTime();
  const duplicateTime = (now === lastPushTime);
  lastPushTime = now;

  const timeStampChars = new Array(8);
  for (i = 7; i >= 0; i--) {
    timeStampChars[i] = PUSH_CHARS.charAt(now % 64);
    // NOTE: Can't use << here because javascript will convert to int and lose the upper bits.
    now = Math.floor(now / 64);
  }
  if (now !== 0) throw new Error('We should have converted the entire timestamp.');

  let id:string = timeStampChars.join('');

  if (!duplicateTime) {
    for (i = 0; i < 12; i++) {
      lastRandChars[i] = Math.floor(Math.random() * 64);
    }
  } else {
    // If the timestamp hasn't changed since last push, use the same random number, except incremented by 1.
    for (i = 11; i >= 0 && lastRandChars[i] === 63; i--) {
      lastRandChars[i] = 0;
    }
    lastRandChars[i]++;
  }
  for (i = 0; i < 12; i++) {
    id += PUSH_CHARS.charAt(lastRandChars[i]);
  }
  if(id.length != 20) throw new Error('Length should be 20.');

  return id;
}