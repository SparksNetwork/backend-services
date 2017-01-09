import service from './index';
import {test} from 'ava';
import {AcceptedEmail} from '@sparksnetwork/sparks-schemas/types/emails/accepted';
import {StreamFunction} from "../../test/StreamFunction";
import {mock} from 'sinon';
import {sendgrid} from "../../lib/ExternalFactories/Sendgrid";

const Sendgrid = {
  emptyRequest() {},
  API() {}
};
const mockSendgrid = mock(Sendgrid);
sendgrid(Sendgrid);
test.afterEach(() => mockSendgrid.restore());

test.serial('template email', async function(t) {
  const message:AcceptedEmail = {
    templateId: "dec62dab-bf8e-4000-975a-0ef6b264dafe",
    toEmail: "sample@example.com",
    substitutions: {
      username: "Jeremy Wells",
      project_name: "Project 1",
      opp_name: "Opp 1",
      engagementUrl: "http://example.com"
    }
  };

  const mockRequest = 'mocked';

  const emptyRequest = mockSendgrid
    .expects('emptyRequest')
    .once()
    .withArgs({
      method: 'POST',
      path: '/v3/mail/send',
      body: {
        personalizations: [
          {
            to: [{email: 'sample@example.com'}],
            substitutions: {
              '-username-': 'Jeremy Wells',
              '-project_name-': 'Project 1',
              '-opp_name-': 'Opp 1',
              '-engagementUrl-': 'http://example.com'
            }
          }
        ],
        from: {
          email: 'help@sparks.network',
          name: 'Sparks Network'
        },
        template_id: 'dec62dab-bf8e-4000-975a-0ef6b264dafe'
      }
    })
    .returns(mockRequest);

  const API = mockSendgrid
    .expects('API')
    .once()
    .withArgs(mockRequest)
    .returns(Promise.resolve(true));

  await StreamFunction(message, service);

  mockSendgrid.verify();
});

