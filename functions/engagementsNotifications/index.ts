import * as apex from 'apex.js';
import {StreamTransform} from "../../lib/StreamTransform";
import {data} from '@sparksnetwork/sparks-schemas/generators/data';
import {whereEq, both, compose, prop} from 'ramda';
import {dataCreate} from "../../helpers/dataCreate";
import {dataRemove} from "../../helpers/dataRemove";
import {spread} from "../../lib/spread";

const engUpdate = data('Engagements.update');

function pred(p) {
  return both(
    engUpdate as any,
    compose(whereEq(p), prop('values'))
  );
}

const SECOND = 1000;
const MINUTE = SECOND * 60;

const isAccepted = StreamTransform(pred({isAccepted: true}), async function({key}) {

  return [dataCreate(
    'Notifications',
    [key, 'accepted'].join('-'),
    key,
    {
      engagementKey: key,
      type: 'accepted',
      sendAt: Date.now() + 30 * MINUTE
    }
  )]
})

const isNotAccepted = StreamTransform(pred({isAccepted: false}), async function({key}) {
  return [dataRemove(
    'Notifications',
    [key, 'accepted'].join('-'),
    key
  )];
});

const isConfirmed = StreamTransform(pred({isConfirmed: true}), async function({key}) {

  return [dataCreate(
    'Notifications',
    [key, 'confirmed'].join('-'),
    key,
    {
      engagementKey: key,
      type: 'confirmed',
      sendAt: Date.now() + 30 * MINUTE
    }
  )];
});

const isNotConfirmed = StreamTransform(pred({isConfirmed: false}), async function({key}) {

  return [dataRemove(
    'Notifications',
    [key, 'confirmed'].join('-'),
    key
  )]
});

export default apex(spread(
  isAccepted,
  isNotAccepted,
  isConfirmed,
  isNotConfirmed
));