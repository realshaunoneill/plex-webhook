const Busboy = require('busboy');
const express = require('express');
require('dotenv').config();
const app = new express();

const PORT = 9889;
const R7_LOGGING_KEY = process.env.R7_LOGGING_KEY;

const r7Logger = require('r7insight_node');

if (!R7_LOGGING_KEY) {
  console.log('R7_LOGGING_KEY not set');
  process.exit(1);
}

const Logger = new r7Logger({
  token: R7_LOGGING_KEY,
  region: 'eu',
  console: false,
  withLevel: false,
});

app.post('/plex', async function(req, res, next) {
	const busboy = new Busboy({headers: req.headers});
	let payload = null;

	busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
		if (fieldname === 'payload') {
			try {
				payload = JSON.parse(val);
			} catch (e) {
				console.log(e);
			}
		}
	});

	busboy.on('finish', async function() {
		if (payload) {
      if (payload.Metadata && payload.Metadata.Role) {
        payload.Metadata.Role = [];
      }
      Logger.log({
        event: payload.event,
        account: payload.Account,
        server: payload.Server,
        player: payload.Player,
        metadata: payload.Metadata,
      });
		} else {

			console.log(`\n========\n[${payload.Account.title}] ${payload.event}: \n= ${payload.Metadata.grandparentTitle} \n= ${payload.Metadata.parentTitle} \n= ${payload.Metadata.title}\n========`);

		}
    res.writeHead(303, {
      Connection: 'close',
      Location: '/'
    });
    res.end();
	})

	return req.pipe(busboy);
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));