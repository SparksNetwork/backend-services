import * as firebase from 'firebase';

const connections = {};

export default {
  establishConnection: function(name:string, cn?:any) {
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
}
