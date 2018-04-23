# Architecture Overview

videojs-contrib-ads is separated into files by module.

## Modules

### plugin.js

The entry point of the application. Registers the plugin with video.js. Implements [public API](../integrator/api.md). Manages application-level state on `player.ads`, including resetting it on source change. Initializes other feature modules.

### adBreak.js

Common code that is invoked when ad breaks start and end. Called by ad states.

### cancelContentPlay.js

Feature that prevents content playback before ads when video.js middleware is not available.

### contentupdate

Implements the `contentchanged` event.

### playMiddleware.js

Feature that prevents content playback before ads when video.js middleware is available.

### plugin.scss

Styles for the ad player.

### redispatch.js

Feature that makes the presense of ads transparent to event listeners.

### snapshot.js

Feature that captures the player state and restores it before and after ads.

### states.js

Used to import any files in the `tates` folder.

### states

The states folder contains the various states that videojs-contrib-ads can be in.

### states/abstract

 States in the `abstract` subfolder are subclassed by the main states in the `states` folder itself. They implement common functionality used by related states.
