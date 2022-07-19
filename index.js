const Busboy = require('busboy');
const express = require('express');
const app = new express();

const PORT = 9889 // Change Port here if needed

const r7Logger = require('r7insight_node');
const Logger = new r7Logger({
  token: '3074d776-4639-424b-889f-3f2c569b0d7c',
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