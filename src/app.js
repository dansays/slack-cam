// Import dependencies
let nodecam       = require('node-webcam');
let sharp         = require('sharp');
let request       = require('request');
let sound         = require('play-sound')();

// Import config, and establish defaults
let config        = require('./config');
config.delay      = config.delay || 1;
config.frequency  = config.frequency || 5;
config.camOptions = config.camOptions || {};

// Create a new cam instance;
let opts = { callbackReturn: 'buffer' };
if (config.device) opts.device = config.device;
let cam = nodecam.create(config.opts);

////////////////////////////////////////////////////////////////////////////////

// Main app function. Ties the whole room together.
function main() {
	beep();
	setTimeout(captureImage, config.delay * 1000);
	setTimeout(main, config.frequency * 1000 * 60);
}


// Play a shutter sound before taking a picture
function beep() {
	console.log('Say cheese!')
	sound.play('shutter.mp3', err => console.log(err));
}


// Grab an image from the webcam
function captureImage() {
	console.log('Capturing image...');
	cam.capture(`${__dirname}/webcam`, (err, buffer) => {
		if (err) console.error(err);
		else resizeImage(buffer);
	});

}


// Resize and crop the image
function resizeImage(buffer) {
	console.log('Resizing and cropping...')
	sharp(buffer)
		.normalize()
		.resize(480, 480)
		.crop(sharp.strategy.entropy)
		.toBuffer((err, buffer) => {
			if (err) console.error(err)
			else uploadToSlack(buffer);
		});
}


// Upload the image to Slack
function uploadToSlack(buffer) {
	let endpoint = 'https://slack.com/api/users.setPhoto';
	let req = request.post(endpoint);
	let form = req.form();

	form.append('token', config.slackApiToken);
	form.append('image', buffer, {filename: 'me', contentType: 'image/jpg'});

	console.log('Uploading to Slack...')
	req.on('end', () => console.log('Upload complete!'));
}


// Start the app!
main();
