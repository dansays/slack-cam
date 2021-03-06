# slack-cam

This is a simple node app to capture a webcam image at a specified interval,
and upload it to Slack as a profile picture. Installation instructions are
written for macOS, but in theory this should run on Windows (just skip step 2).

## Installation

```
brew install imagesnap
brew install imagemagick
brew install graphicsmagick
npm install
```

Then, create a `src/config.json` file with a `slackApiToken` key. You can
also specify one or more optional parameters:

## Config Options

Your `config.json` file can include a number of optional keys:

- `delay`: Number of seconds to wait after "beep" sound before taking a picture (default: 2.5 seconds)
- `frequency`: Number of minutes to wait between image capture (default: 5 minutes)
- `device`: Name of camera device. Type `imagesnap -l` to list options. Defaults to "FaceTime HD Camera".
- `zoom`: Vertical crop factor. Simulates a camera zoom.
- `brightness`: Brightness adjustment (default: 100, no change)

## Issues

This app is dependent on `node-webcam` which, in turn, is dependent on
`imagesnap`, installed by `brew` in `/usr/local/bin`. I've tried a number of
options for running this process in the background, including `launchd` and
[node-mac](https://github.com/coreybutler/node-mac), but all run as
`root` and therefore have issues resolving the path to `imagesnap`.