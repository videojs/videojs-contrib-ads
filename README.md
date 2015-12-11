# videojs-contrib-ads [![Build Status](https://travis-ci.org/videojs/videojs-contrib-ads.svg)](https://travis-ci.org/videojs/videojs-contrib-ads)


The `videojs-contrib-ads` plugin provides common functionality needed by video advertisement libraries working with [video.js.](http://www.videojs.com/)
It takes care of a number of concerns for you, reducing the code you have to write for your ad integration.

## Getting Started

In addition to the video.js library, you'll need two files from this project: `videojs.ads.js` and `videojs.ads.css`.
Both are in the `src/` directory.

For development, include the CSS in your HTML's `<head>` section with a `<link>` tag:

```html
<link rel="stylesheet" href="videojs.ads.css">
```

Then, include the JavaScript file after video.js, but before your integration code:

```html
<video id="video" src="movie.mp4" controls></video>
<script src="video.js"></script>
<script src="videojs.ads.js"></script>
<script>
videojs('video', {}, function() {
  var player = this;
  player.ads(); // initialize the ad framework
  // your custom ad integration code
});
</script>
```

With this basic structure in place, you're ready to develop an ad integration.

## Developing an Integration

Once you call `player.ads()` to initialize the plugin, it provides six interaction points (four events and two methods) which you can use in your integration.

Here are the events that communicate information to your integration from the ads plugin:

 * `contentupdate` (EVENT) — Fires when a new content video has been assigned to the player, so your integration can update its ad inventory. _NOTE: This will NOT fire while your ad integration is playing a linear Ad._
 * `readyforpreroll` (EVENT) — Fires when a content video is about to play for the first time, so your integration can indicate that it wants to play a preroll.
 * `contentplayback` (EVENT) - Fires whenever the state changes to content-playback state.  Included in this event is a 'triggerevent' property which indicates what event type triggered the state change.

And here are the interaction points you use to send information to the ads plugin:

 * `adsready` (EVENT) — Trigger this event after to signal that your integration is ready to play ads.
 * `adscanceled` (EVENT) — Trigger this event after starting up the player or setting a new video to skip ads entirely. This event is optional; if you always plan on displaying ads, you don't need to worry about triggering it.
 * `adserror` (EVENT) - Trigger this event to indicate that an error in the ad integration has ocurred and any ad states should abort so that content can resume.
 * `ads.startLinearAdMode()` (METHOD) — Call this method to signal that your integration is about to play a linear ad. This method triggers `adstart` to be emitted by the player.
 * `ads.endLinearAdMode()` (METHOD) — Call this method to signal that your integration is finished playing linear ads, ready for content video to resume. This method triggers `adend` to be emitted by the player.
 * `ads.skipLinearAdMode()` (METHOD) — Call this method to signal that your integration has received an ad response but is not going to play a linear ad.  This method triggers `adskip` to be emitted by the player.


In addition, video.js provides a number of events and APIs that might be useful to you.
For example, the `ended` event signals that the content video has played to completion.

## Single Preroll Example

Here's an outline of what a basic ad integration might look like.
It only plays a single preroll ad before each content video, but does demonstrate the interaction points offered by the ads plugin.

This is not actually a runnable example, as it needs more information as specified in the code comments.

```js
videojs('video', {}, function() {

  var player = this;
  player.ads(); // initialize the ad framework

  // request ads whenever there's new video content
  player.on('contentupdate', function(){
    // fetch ad inventory asynchronously, then ...
    player.trigger('adsready');
  });

  player.on('readyforpreroll', function() {
    player.ads.startLinearAdMode();
    // play your linear ad content
    player.src('http://url/to/your/ad.content');

    // when all your linear ads have finished… do not confuse this with `ended`
    player.one('adended', function() {
      player.ads.endLinearAdMode();
    });
  });

});
```

Your actual integration will be significantly more complex.
To implement midroll ads, you'd want to listen to `timeupdate` events to monitor the progress of the content video's playback.

For a more involved example that plays both prerolls and midrolls, see the [example directory](example) in this project.

## State Diagram

To manage communication between your ad integration and the video.js player, the ads plugin goes through a number of states.
Here's a state diagram which shows the states of the ads plugin and how it transitions between them:

![](ad-states.png)

The ads plugin starts in the `init` state and immediately transitions to `content-set` if a video is loaded.
Transitions with solid arrows are traversed when an event with the appropriate type is triggered on the player.
Dotted-line arrows indicate a transition that occurs when a timeout expires.
The timeline at right shows how the ads plugin communicates with your integration.

## Plugin Options

The ad framework can be configured with custom settings by providing a settings object at initialization:

```js
player.ads({
  timeout: 3000
});
```

The current set of options are described in detail below.

### timeout

Type: `number`
Default Value: 5000

The maximum amount of time to wait for an ad implementation to initialize before playback, in milliseconds.
If the viewer has requested playback and the ad implementation does not fire `adsready` before this timeout expires, the content video will begin playback.
It's still possible for an ad implementation to play ads after this waiting period has finished but video playback will already be in progress.

Once the ad plugin starts waiting for the `adsready` event, one of these things will happen:

 * integration ready within the timeout — this is the best case, preroll(s) will play without the user seeing any content video first.
 * integration ready, but after timeout has expired — preroll(s) still play, but the user will see a bit of content video.
 * integration never becomes ready — content video starts playing after timeout.

This timeout is necessary to ensure a good viewer experience in cases where the ad implementation suffers an unexpected or irreparable error and never fires an `adsready` event.
Without this timeout, the ads plugin would wait forever, and neither the content video nor ads would ever play.

If the ad implementation takes a long time to initialize and this timeout is too short, then the content video will beging playing before the first preroll opportunity.
This has the jarring effect that the viewer would see a little content before the preroll cuts in.

During development, we found that five seconds seemed to be long enough to accommodate slow initialization in most cases, but still short enough that failures to initialize didn't look like failures of the player or content video.

### prerollTimeout

Type: `number`
Default Value: 100

The maximum amount of time to wait for an ad implementation to initiate a preroll, in milliseconds.
If `readyforpreroll` has been fired and the ad implementation does not call `startLinearAdMode()` before `prerollTimeout` expires, the content video will begin playback.
`prerollTimeout` is cumulative with the standard timeout parameter.

Once the ad plugin fires `readyforpreroll`, one of these things will happen:

 * `startLinearAdMode()` called within the timeout — preroll(s) will play without the user seeing any content video first.
 * `skipLinearAdMode()` is called within the timeout because there are no linear ads in the response or you already know you won't be making a preroll request - content video plays without preroll(s).
 * `startLinearAdMode()` is never called — content video plays without preroll(s).
 * `startLinearAdMode()` is called, but after the prerollTimeout expired — bad user experience; content video plays a bit, then preroll(s) cut in.

The prerollTimeout should be as short as possible so that the viewer does not have to wait unnecessarily if no preroll is scheduled for a video.
Make this longer if your ad integration needs a long time to decide whether it has preroll inventory to play or not.
Ideally, your ad integration should already know if it wants to play a preroll before the `readyforpreroll` event.  In this case, skipLinearAdMode() should be called to resume content quickly.

### postrollTimeout

Type: `number`
Default Value: 100

The maximum amount of time to wait for an ad implementation to initiate a postroll, in milliseconds.
If `contentended` has been fired and the ad implementation does not call `startLinearAdMode()` before `postrollTimeout` expires, the content video will end playback.

Once the ad plugin fires `contentended`, one of these things will happen:

 * `startLinearAdMode()` called within the timeout — postroll(s) will play without the user seeing any content video first.
 * `skipLinearAdMode()` is called within the timeout - content video stops.
 * `startLinearAdMode()` is never called — content video stops.
 * `startLinearAdMode()` is called, but after the postrollTimeout expired — content video stops

The postrollTimeout should be as short as possible so that the viewer does not have to wait unnecessarily if no postroll is scheduled for a video.
Make this longer if your ad integration needs a long time to decide whether it has postroll inventory to play or not.
Ideally, your ad integration should already know if it wants to play a postroll before the `contentended` event.


### debug

Type: `boolean`
Default Value: false

If debug is set to true, the ads plugin will output additional information about its current state during playback.
This can be handy for diagnosing issues or unexpected behavior in an ad integration.

## Plugin Events
The plugin triggers a number of custom events on the player during its operation. As an ad provider, you can listen for them to trigger behavior in your implementation. They may also be useful for other plugins to track advertisement playback.

### adstart
The player has entered linear ad playback mode. This event is fired directly as a consequence of calling `startLinearAdMode()`. This event only indicates that an ad break has begun; the start and end of individual ads must be signalled through some other mechanism.

### adend
The player has returned from linear ad playback mode. This event is fired directly as a consequence of calling `startLinearAdMode()`. Note that multiple ads may have played back between `adstart` and `adend`.

### adskip
The player is skipping a linear ad opportunity and content-playback should resume immediately.  This event is fired directly as a consequence of calling `skipLinearAdMode()`. It can indicate that an ad response was made but returned no linear ad content or that no ad call is going to be made at either the preroll or postroll timeout opportunities.

### adtimeout
A timeout managed by the plugin has expired and regular video content has begun to play. Ad integrations have a fixed amount of time to inform the plugin of their intent during playback. If the ad integration is blocked by network conditions or an error, this event will fire and regular playback resumes rather than stalling the player indefinitely.

## Runtime Settings
Once the plugin is initialized, there are a couple properties you can
access to inspect the plugin's state and modify its behavior.

### contentSrc
In order to detect changes to the content video, videojs-contrib-ads
monitors the src attribute of the player. If you need to make a change
to the src attribute during content playback that should *not* be
interpreted as loading a new video, you can update this property with
the new source you will be loading:

```js
// you might want to switch from a low bitrate version of a video to a
// higher quality one at the user's request without forcing them to
// re-watch all the ad breaks they've already viewed

// first, you'd update contentSrc on the ads plugin to the URL of the
// higher bitrate rendition:
player.ads.contentSrc = 'movie-high.mp4';

// then, modify the src attribute as usual
player.src('movie-high.mp4');
```

## Migration

### Migrating to 2.0

If you've previously developed an ad plugin on the 1.0 releases of this project, you may need to make some changes to operate correctly with 2.0.
Check out the [migration guide](migrating-to-2.0.md) for more details.

### Migrating to 3.0

If you've previously developed an ad plugin on the 1.0 or 2.0 releases of this project, you may need to make some changes to operate correctly with 3.0.
Check out the [migration guide](migrating-to-3.0.md) for more details.

## Building

You can use the `videojs.ads.js` file as it is in the `src/` directory, or you can use a minified version.

The ads plugin is designed to be built with `npm` and `grunt`.

If you don't already have `npm`, then download and install [Node.js](http://nodejs.org/) (which comes with npm).
Then you can install the build tool [grunt](http://gruntjs.com/):

```sh
$ npm install -g grunt
```

With grunt ready, you can download the ads plugin's build-time dependencies and then build the ads plugin.
Open a terminal to the directory where you've cloned this repository, then:

```sh
$ npm install
$ grunt
```

grunt will run a suite of unit tests and code formatting checks, then create a `dist/` directory.
Inside you'll find the minified ads plugin file `videojs-ads.min.js`.

## Release History

A short list of features, fixes and changes for each release.

### v3.1.2

* [@gkatsev](https://github.com/gkatsev): Addressed issues with some browsers (Firefox with MSE) where the `"canplay"` event fires at the wrong time. [#136](https://github.com/videojs/videojs-contrib-ads/pull/136)
* [@misteroneill](https://github.com/misteroneill): Ensure that editor files and other undesirable assets don't appear in npm packages. [#137](https://github.com/videojs/videojs-contrib-ads/pull/137)

### v3.1.1
 
* [@alex-phillips](https://github.com/alex-phillips): Fixed issues caused by overly-aggressive DOM node caching, which caused issues when ads and content used different techs. [#131](https://github.com/videojs/videojs-contrib-ads/pull/131)
* [@misteroneill](https://github.com/misteroneill): Fixed logic with determining if the source changed when trying to restore a player snapshot after an ad ends. [#133](https://github.com/videojs/videojs-contrib-ads/pull/133)
* [@misteroneill](https://github.com/misteroneill): Removed or simplified code with methods available in video.js 5.x. [#134](https://github.com/videojs/videojs-contrib-ads/pull/134)

### v3.1.0

* Adds a `"contentresumed"` event to support stitched-in ads.

### v3.0.0

* Mostly transparent to plugin users, this release is a VideoJS 5.0-compatible iteration of the plugin.
* Updated testing to be more modern and robust.
* Renamed `player.ads.timeout` to `player.ads.adTimeoutTimeout`.
* Exposed `player.ads.resumeEndedTimeout`.

### v2.0.0

* Prefix video events during ad playback to simplify the world for non-ad plugins

### v1.0.0

* Simplify ad timeout handling and remove the `ad-timeout-playback` state
* Introduce `aderror` event to get back to content when a problem occurs
* Fire `contentplayback` event any time the `content-playback` state is entered
* Expose the event that caused the transition to the current state

### v0.6.0

* Disable and re-enable text tracks automatically around ads
* Snapshot styles to fix damage caused by ad blockers

### v0.5.0

* Make the ad workflow cancelable through the `adscanceled` event

### v0.4.0

* Ad blocker snapshot restoration fixes
* Post-roll fixes
* Allow content source updates without restarting ad workflow

### v0.3.0

* Post-roll support

### v0.2.0

* Upgrade to video.js 4.4.3
* Added support for burned-in or out-of-band linear ad playback
* Debug mode

### v0.1.0

* Initial release.

## License

See [LICENSE-APACHE2](LICENSE-APACHE2).
