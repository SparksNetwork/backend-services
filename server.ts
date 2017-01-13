import * as firebase from 'firebase';
import getFunctions from './server/get-functions';
import dispatch, {Dispatch, QueueMessage, DispatchResponse} from '@sparksnetwork/sparks-dispatch';
import * as R from 'ramda';
import {error, debug} from "./lib/log";
import {ServerFunction} from "./server/get-functions";
import {StreamRecord} from "./lib/StreamPublish";

async function start() {
  const functions = await getFunctions();

  function streamFunctions(stream:string):ServerFunction[] {
    return R.filter<ServerFunction>(R.propEq('stream', stream))(functions)
  }

  function dispatchTo(fn:ServerFunction, data):Promise<StreamRecord<any>|undefined> {
    return new Promise((resolve, reject) => {
      fn.fn(data, {clientContext: {context: 'local'}}, function (err, responseMessages) {
        if (err) { return reject(err); }
        resolve(responseMessages);
      })
    });
  }

  function broadcast(stream, data):Promise<StreamRecord<any>[]> {
    debug('broadcasting to ', stream);

    return Promise.all(
      streamFunctions(stream).map(fn => dispatchTo(fn, data))
    ).then(R.flatten).then(R.filter(Boolean));
  }

  function broadcastIteratively(stream, data):Promise<void> {
    return new Promise((resolve, reject) => {
      broadcast(stream, data).then(responses => {
        if (responses.length === 0) { return resolve(); }

        Promise.all(responses.map(response => broadcastIteratively(response.streamName, response.data)))
          .then(() => resolve()).catch(err => reject(err))
      }).catch(err => reject(err))
    });
  }

  const dispatcher:Dispatch = function(message:QueueMessage):Promise<DispatchResponse> {
    return broadcastIteratively('commands', message)
    .then(() => ({
        ok: true
    }))
    .catch(err => {
      error('dispatch error', err);

      return {
        error: err,
        ok: false
      };
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



