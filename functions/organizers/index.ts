import * as apex from 'apex.js';
import {spread} from "../../lib/spread";
import {merge} from 'ramda';
import {RemoveTransform} from "../../helpers/CommandToDataTransform";
import {StreamTransform} from "../../lib/StreamTransform";
import {OrganizersAcceptCommand} from 'sparks-schemas/types/commands/OrganizersAccept';
import {OrganizersCreateCommand} from 'sparks-schemas/types/commands/OrganizersCreate';
import {OrganizerInviteEmail} from 'sparks-schemas/types/emails/organizerInvite';
import {CreateData} from 'sparks-schemas/types/data';
import {lookup, firebaseUid} from '../../lib/Firebase';
import {Organizer} from "sparks-schemas/types/models/organizer";

const DOMAIN = process.env['DOMAIN'];

const create = StreamTransform<any,any>('Organizers.create', async function({domain, action, uid, payload: {values}}:OrganizersCreateCommand) {

  const invitedByProfileKey = await lookup('organizers', 'Users', uid);
  const projectName = await lookup('organizers', 'Projects', values.projectKey, 'name');
  const key = firebaseUid();

  const data:CreateData<Organizer> = {
    domain,
    action,
    key,
    values: merge(values, {invitedByProfileKey})
  };

  const email:OrganizerInviteEmail = {
    templateId: 'a005f2a2-74b0-42f4-8ac6-46a4b137b7f1',
    toEmail: values.inviteEmail,
    substitutions: {
      project_name: projectName,
      inviteUrl: `${DOMAIN}/organize/${key}`
    }
  };

  return [
    {
      streamName: 'data.firebase',
      partitionKey: values.projectKey,
      data
    },
    {
      streamName: 'email',
      partitionKey: values.projectKey,
      data: email
    }
  ]
});

const accept = StreamTransform('Organizers.accept', async function({domain, uid, payload: {key}}:OrganizersAcceptCommand) {
  const profileKey = await lookup('organizers', 'Users', uid);

  return [
    {
      streamName: 'data.firebase',
      partitionKey: uid,
      data: {
        domain,
        action: 'update',
        key,
        values: {
          isAccepted: true,
          acceptedAt: Date.now(),
          profileKey
        }
      }
    }
  ]
});

export default apex(spread(
  create,
  accept,
  RemoveTransform('Organizers.remove')
));