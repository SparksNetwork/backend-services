import * as Sendgrid from 'Sendgrid';

let staticSendgrid = Sendgrid(process.env['SENDGRID_API_KEY']);

export function sendgrid(sg?) {
  if (sg) { staticSendgrid = sg; }
  return staticSendgrid;
}

