import * as firebase from 'firebase';
import getFunctions from './server/get-functions';
import dispatch, {Dispatch, QueueMessage, DispatchResponse} from '@sparksnetwork/sparks-dispatch';

async function start() {
  const functions = await getFunctions();
  const commandFunctions = functions.filter(fn => fn.stream === 'commands');

  const dispatcher:Dispatch = function(message:QueueMessage):Promise<DispatchResponse> {
    return Promise.all(
      commandFunctions.map(fn => new Promise((resolve, reject) => {
        fn.fn(message, {clientContext: {context: 'local'}}, function (err, responseMessages) {
          if (err) {
            return reject(err);
          }
          resolve(responseMessages);
        })
      }))
    ).then(responses => {
      console.log('responses:', responses);

      return {
        ok: true
      }
    });
  };

  return dispatch(Promise.resolve(dispatcher))
}

firebase.initializeApp({
  databaseURL: process.env['FIREBASE_DATABASE_URL'],
  serviceAccount: 'firebase.json',
  databaseAuthVariableOverride: {
    uid: 'firebase-queue'
  }
});

start()
  .then(() => {
    console.log('Started');
  });



