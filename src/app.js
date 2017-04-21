// Import dependencies
let nodecam       = require('node-webcam');
let sharp         = require('sharp');
let request       = require('request-promise');
let gm            = require('gm');
let sound         = require('play-sound')();
let imgToAscii    = require('image-to-ascii');

// Emit console log messages?
let verbose = false;

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
	let slackResponse;

	// Play a sound a few seconds before capture
	if (verbose) console.log('\n\nHere we go...');
	if (verbose) console.log('...say cheese!');
	sound.play('shutter.mp3');

	// Grab an image from the webcam
	if (verbose) console.log('...capturing image');
	try {	buffer = await capture(); }
	catch (err) { console.error(err); }

	// Enhance
	if (verbose) console.log('...enhancing');
	try { buffer = await enhance(buffer); }
	catch (err) { console.log(err); }

	// Zoom!
	if (verbose) console.log('...squishing vertically');
	try { buffer = await zoom(buffer); }
	catch (err) { console.log(err); }

	// Crop!
	if (verbose) console.log('...cropping horizontally');
	try { buffer = await crop(buffer); }
	catch (err) { console.log(err); }	

	// Send the new image to Slack.
	if (verbose) console.log('...uploading to Slack');
	try { slackResponse = JSON.parse(await upload(buffer)); }
	catch (err) { console.error(err); }
	
	// Done!
	let imageUrl = slackResponse.profile.image_512;
	try { process.stdout.write(await showAsciiPic(imageUrl)); }
	catch (err) { console.error(err); }

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

	async function showAsciiPic(urlOrPath) {
		return new Promise((resolve, reject) => {
			let options = {
				size: { width: process.stdout.columns / 2, height: process.stdout.rows },
				size_options: { preserve_aspect_ratio: false }
			};

			imgToAscii(urlOrPath, options, (err, converted) => {
				if (err) reject(err);
				else resolve(converted);
			});
		});
	}
}