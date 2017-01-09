import * as apex from 'apex.js';
import {StreamFunction} from "../../lib/StreamFunction";
import {email} from "@sparksnetwork/sparks-schemas/generators/email";
import {TransactionEmail} from '@sparksnetwork/sparks-schemas/types/transactionEmail'
import {sendgrid} from "../../lib/ExternalFactories/Sendgrid";
import {assoc} from 'ramda'

function convertSubstitutions(subs) {
  return Object.keys(subs).reduce((acc, key) =>
    assoc(`-${key}-`, subs[key], acc), {});
}

const send = StreamFunction(email(), async function(message:TransactionEmail) {
  const sg = sendgrid();

  const request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: {
      personalizations: [
        {
          to: [{email: message.toEmail}],
          substitutions: convertSubstitutions(message.substitutions)
        }
      ],
      from: {
        email: message.fromEmail || 'help@sparks.network',
        name: message.fromName || 'Sparks Network'
      },
      template_id: message.templateId
    }
  } as any);

  return await sg.API(request);
});

export default apex(send);