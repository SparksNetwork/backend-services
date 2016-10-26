import * as apex from 'apex.js';
import {
  establishConnection,
  firebaseUid
} from "../../lib/ExternalFactories/Firebase";
import {merge, omit} from 'ramda';

const MAX_TIME = 1000*60;

interface Notification {
  lockKey: string;
}

function ref(key) {
  const db = establishConnection('notifications');
  return db.database().ref().child('Notifications').child(key);
}

async function canSend(notification:Notification):Promise<boolean> {
  return false;
}

async function doSend(notification:Notification) {
  return false;
}

function lock(key:string):Promise<Notification> {
  return new Promise((resolve, reject) => {
    ref(key).transaction(function (value) {
      if (value.lockKey) {
        return null;
      }
      return merge(value, {lockKey: firebaseUid()})
    }, function (error, committed, snapshot) {
      if (error) {
        return reject(error);
      }
      if (!committed) {
        return resolve(null);
      }
      resolve(snapshot.val())
    });
  });
}

function unlock(key:string, lockKey:string) {
  ref(key).transaction(function(value) {
    if (value.lockKey === lockKey) {
      return omit(['lockKey'], value);
    }
  });
}

async function remove(key) {
  return await ref(key).remove();
}

async function processNotification(snapshot) {
  const notification = await lock(snapshot.key);

  if (notification) {
    if (await canSend(notification)) {
      await doSend(notification);
      await remove(snapshot.key);
    } else {
      await unlock(snapshot.key, notification.lockKey);
    }
  }
}

export default apex(async function() {
  const db = establishConnection('notifications');
  const notificationsRef = db.database().ref().child('Notifications');

  notificationsRef.orderByChild('sendAt')
    .on('child_added', processNotification);

  setTimeout(() => {
    notificationsRef.off('child_added');
  }, MAX_TIME);
})