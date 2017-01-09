import {merge} from 'ramda';
import {RemoveTransform} from "../../helpers/CommandToDataTransform";
import {StreamTransform} from "../../lib/StreamTransform";
import {OrganizersAcceptCommand} from '@sparksnetwork/sparks-schemas/types/commands/OrganizersAccept';
import {OrganizersCreateCommand} from '@sparksnetwork/sparks-schemas/types/commands/OrganizersCreate';
import {OrganizerInviteEmail} from '@sparksnetwork/sparks-schemas/types/emails/organizerInvite';
import {CreateData} from '@sparksnetwork/sparks-schemas/types/data';
import {lookup, firebaseUid} from '../../lib/ExternalFactories/Firebase';
import {Organizer} from "@sparksnetwork/sparks-schemas/types/models/organizer";
import {dataUpdate} from "../../helpers/dataUpdate";
import {λ} from "../../lib/lambda";

const DOMAIN = process.env['DOMAIN'];

const create = StreamTransform<any,any>('command.Organizers.create', async function({domain, action, uid, payload: {values}}:OrganizersCreateCommand) {

  const invitedByProfileKey = await lookup('Users', uid);
  const projectName = await lookup('Projects', values.projectKey, 'name');
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

const accept = StreamTransform('command.Organizers.accept', async function({domain, uid, payload: {key}}:OrganizersAcceptCommand) {
  const profileKey = await lookup('Users', uid);

  return [dataUpdate(domain, key, uid, {
    isAccepted: true,
    acceptedAt: Date.now(),
    profileKey
  })];
});

export default λ(
  'organizers',
  create,
  accept,
  RemoveTransform('command.Organizers.remove')
);
