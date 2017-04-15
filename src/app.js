// Import dependencies
let nodecam       = require('node-webcam');
let sharp         = require('sharp');
let request       = require('request-promise');
let sound         = require('play-sound')();

// Import config, and establish defaults
let config        = require('./config');
config.delay      = config.delay || 2.5;
config.frequency  = config.frequency || 5;

// Create a new cam instance;
let cam = nodecam.create({
	callbackReturn  : 'buffer'
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

	console.log('Here we go...')
	console.log('...say cheese!')
	await beep(config.delay);

	// First we grab an image from the webcam
	console.log('...capturing image');
	let camImageBuffer = await capture();

	// Raw images are way too big. Let's resize it,
	// and crop it down to a square.
	console.log('...resizing and cropping');
	let croppedImageBuffer = await resize(camImageBuffer);

	// Lastly, let's send the new image to Slack.
	console.log('...uploading to Slack');
	await upload(croppedImageBuffer);
	
	// Done!
	console.log('Done!');
	console.log('');

	//////////////////////////////////////////////////////////////

	// Play a shutter sound before taking a picture
	async function beep(delay) {
		return new Promise((resolve, reject) => {
			sound.play('shutter.mp3');
			setTimeout(() => resolve(), delay * 1000);
		});
	}


	// Grab an image from the webcam
	async function capture() {
		return new Promise((resolve, reject) => {
			cam.capture('webcam', (err, buffer) => {
				if (err) reject(err);
				else resolve(buffer);
			})
		});
	}

	// Resize and crop the image
	async function resize(buffer) {
		return new Promise((resolve, reject) => {
			sharp(buffer)
				.normalize()
				.crop(sharp.strategy.entropy)
				.resize(480, 480)
				.toBuffer((err, buffer) => {
					if (err) reject(err)
					else resolve(buffer);
				});
		});
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