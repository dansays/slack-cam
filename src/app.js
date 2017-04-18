// Import dependencies
let nodecam       = require('node-webcam');
let sharp         = require('sharp');
let request       = require('request-promise');
let gm            = require('gm');
let sound         = require('play-sound')();

// Import config, and establish defaults
let config        = require('./config');
config.delay      = config.delay || 2.5;
config.frequency  = config.frequency || 5;
config.zoom       = config.zoom || 475;
config.brightness = config.brightness || 100;

// Create a new cam instance;
let cam = nodecam.create({
	callbackReturn  : 'buffer'
, output          : 'png'
, verbose         : false
, device          : config.device
, delay           : config.delay
});

// Let's get this party started!
let freq = config.frequency * 1000 * 60;
setInterval(captureImage, freq);
captureImage(); // Trigger immediately on load

////////////////////////////////////////////////////////////////////////////////

async function captureImage() {

	let buffer;

	// Play a sound a few seconds before capture
	console.log('Here we go...')
	console.log('...say cheese!')
	sound.play('shutter.mp3');

	// Grab an image from the webcam
	console.log('...capturing image');
	try {	buffer = await capture(); }
	catch (err) { console.error(err); }

	// Enhance
	console.log('...enhancing');
	try { buffer = await enhance(buffer); }
	catch (err) { console.log(err); }

	// Zoom!
	console.log('...squishing vertically');
	try { buffer = await zoom(buffer); }
	catch (err) { console.log(err); }

	// Crop!
	console.log('...cropping horizontally');
	try { buffer = await crop(buffer); }
	catch (err) { console.log(err); }	

	// Send the new image to Slack.
	console.log('...uploading to Slack');
	try { await upload(buffer); }
	catch (err) { console.error(err); }
	
	// Done!
	console.log('Done!');
	console.log('');

	//////////////////////////////////////////////////////////////

	// Grab an image from the webcam
	async function capture() {
		return new Promise((resolve, reject) => {
			cam.capture('webcam', (err, buffer) => {
				if (err) reject(err);
				else resolve(buffer);
			})
		});
	}

	async function enhance(buffer) {
		return new Promise((resolve, reject) => {
			gm(buffer)
				.enhance()
				.modulate(config.brightness)
				.toBuffer((err, buffer, info) => {
					if (err) reject(err);
					else resolve(buffer);
				})
		});
	}

	// Crop the image vertically, to create a zoom effect
	async function zoom(buffer) {
		return sharp(buffer)
			.crop(sharp.gravity.center)
			.resize(1280, config.zoom)
			.toBuffer();
	}

	// Crop the image into a square, so it's avatar-shaped
	async function crop(buffer) {
		return sharp(buffer)
			.crop(sharp.strategy.entropy)
			.resize(500, 500)
			.jpeg({ quality: 40 })
			.toBuffer();
	}

	// Upload the image to Slack
	async function upload(buffer) {
		let endpoint = 'https://slack.com/api/users.setPhoto';
		let req = request.post(endpoint);
		let form = req.form();
		form.append('token', config.slackApiToken);
		form.append('image', buffer, {filename: 'me', contentType: 'image/jpg'});
		return req;
	}
}