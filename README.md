# slack-cam

This is a simple node app to capture a webcam image at a specified interval,
and upload it to Slack as a profile picture.

## Installation

1. Run `npm install` to pull down dependencies
2. Run `brew install imagesnap` (a library required by `node-webcam`)
3. Create a `src/config.json` file with a `slackApiToken` key

## Config Options

Your `config.json` file can include a number of optional keys:

- `delay`: Number of seconds to wait after "beep" sound before taking a picture (default: 1 second)
- `frequency`: Number of minutes to wait between image capture (default: 5 minutes)
- `device`: Name of camera device. Type `imagesnap -l` to list options. Defaults to Facetime camera.