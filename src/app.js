let cam      = require('node-webcam');
let sharp    = require('sharp');
let request  = require('request');
let fs       = require('fs');

let token    = 'xoxp-2503027866-2503027868-2580285326-6594fd';
let endpoint = 'https://slack.com/api/users.setPhoto'
let opts     = { callbackReturn: 'buffer' };

cam.capture('webcam', opts, function(err, buffer) {

	sharp(buffer)
		.resize(480, 480)
		.toBuffer(uploadToSlack);

	function uploadToSlack(err, buffer) {

		let req = request({ method: 'POST', uri: endpoint });
		let form = req.form();

		form.append('token', token);
		form.append('image', buffer, {filename: 'me', contentType: 'image/jpg'});
	}

});

