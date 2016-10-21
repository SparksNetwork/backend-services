import * as Sendgrid from 'Sendgrid';

let staticSendgrid = Sendgrid(process.env['SENDGRID_API_KEY']);

/**
 * Factory that returns sendgrid object appropricate for the local environment.
 * Requires SENDGRID_API_KEY environment variable.
 *
 * In a test situation this function allows a mock to be injected.
 *
 * @param sg
 * @returns {SendGrid}
 */
export function sendgrid(sg?) {
  if (sg) { staticSendgrid = sg; }
  return staticSendgrid;
}

