# videojs-contrib-ads [![Build Status](https://travis-ci.org/videojs/videojs-contrib-ads.svg)](https://travis-ci.org/videojs/videojs-contrib-ads)

The `videojs-contrib-ads` plugin provides common functionality needed by video advertisement libraries working with [video.js.](http://www.videojs.com/)
It takes care of a number of concerns for you, reducing the code you have to write for your ad integration.

Lead Maintainer: Greg Smith [https://github.com/incompl](https://github.com/incompl)

Maintenance Status: Stable, in its own interesting way

## Getting Started

In addition to the video.js library, you'll need two files from this project: `videojs.ads.js` and `videojs.ads.css`.
After you build the project they are both in the `dist` directory.

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

### CDN Link

You may also use the Javascript and CSS links from the following to get started:
[https://cdnjs.com/libraries/videojs-contrib-ads](https://cdnjs.com/libraries/videojs-contrib-ads)


With this basic structure in place, you're ready to develop an ad integration.

## Developing an Integration

Once you call `player.ads()` to initialize the plugin, it provides six interaction points (four events and two methods) which you can use in your integration.

Here are the events that communicate information to your integration from the ads plugin:

 * `contentupdate` (EVENT) — Fires when a new content video has been assigned to the player, so your integration can update its ad inventory. _NOTE: This will NOT fire while your ad integration is playing a linear Ad._
 * `readyforpreroll` (EVENT) — Fires when a content video is about to play for the first time, so your integration can indicate that it wants to play a preroll.

Note: A `contentplayback` event is sent but should not be used as it is being removed. The `playing` event has the same meaning and is far more reliable.
 
And here are the interaction points you use to send information to the ads plugin:

* `adsready` (EVENT) — Trigger this event after to signal that your integration is ready to play ads.
* `adplaying` (EVENT) - Trigger this event when an ads starts playing. If your integration triggers `playing` event when an ad begins, it will automatically be redispatched as `adplaying`.
* `adscanceled` (EVENT) — Trigger this event after starting up the player or setting a new video to skip ads entirely. This event is optional; if you always plan on displaying ads, you don't need to worry about triggering it.
* `adserror` (EVENT) - Trigger this event to indicate that an error in the ad integration has ocurred and any ad states should abort so that content can resume.
* `nopreroll` (EVENT) - Trigger this event to indicate that there will be no preroll ad. Otherwise, the player will wait until a timeout occurs before playing content. This event is optional, but can improve user experience.
* `nopostroll` (EVENT) - Trigger this event to indicate that there will be no postroll ad. Otherwise, contrib-ads will trigger an adtimeout event after content ends if there is no postroll.
* `ads-ad-started` (EVENT) - Trigger this when each individual ad begins.
* `contentresumed` (EVENT) - If your integration does not result in a "playing" event when resuming content after an ad, send this event to signal that content can resume. This was added to support stitched ads and is not normally necessary.
* `ads.startLinearAdMode()` (METHOD) — Call this method to signal that your integration is about to play a linear ad. This method triggers `adstart` to be emitted by the player.
* `ads.endLinearAdMode()` (METHOD) — Call this method to signal that your integration is finished playing linear ads, ready for content video to resume. This method triggers `adend` to be emitted by the player.
* `ads.skipLinearAdMode()` (METHOD) — Call this method to signal that your integration has received an ad response but is not going to play a linear ad.  This method triggers `adskip` to be emitted by the player.
* `ads.stitchedAds()` (METHOD) — Get or set the `stitchedAds` setting.
* `ads.videoElementRecycled()` (METHOD) - Returns true if ad playback is taking place in the content element.

In addition, video.js provides a number of events and APIs that might be useful to you.
For example, the `ended` event signals that the content video has played to completion.

### Public Methods

These are methods that can be called at runtime to inspect the ad plugin's state. You do
not need to implement them yourself.

#### isInAdMode()

Returns true if player is in ad mode.

##### Ad mode definition:

> If content playback is blocked by the ad plugin.

###### Examples of ad mode:

* Waiting to find out if an ad is going to play while content would normally be
  playing.
* Waiting for an ad to start playing while content would normally be playing.
* A linear ad is playing
* An ad has completed and content is about to resume, but content has not resumed
  yet.

###### Examples of not ad mode:

* Content playback has not been requested
* Content playback is paused
* An asynchronous ad request is ongoing while content is playing
* A non-linear ad is active

#### isContentResuming()

Returns true if content is resuming after an ad. This is part of ad mode.

#### isAdPlaying()

Returns true if a linear ad is playing. This is part of ad mode.
This relies on `startLinearAdMode` and `endLinearAdMode` because that is the
most authoritative way of determinining if an ad is playing.

### Additional Events And Properties Your Integration May Want To Include

This project does not send these events, but these events are a convention used some some integrations that you may want to consider sending for consistency.

#### Events

* `ads-request`: Fired when ad data is requested.
* `ads-load`: Fired when ad data is available following an ad request.
* `ads-pod-started`: Fired when a LINEAR ad pod has started.
* `ads-pod-ended`: Fired when a LINEAR ad pod has completed.
* `ads-allpods-completed`: Fired when all LINEAR ads are completed.
* `ads-ad-started`: Fired when the ad starts playing.
* `ads-ad-ended`: Fired when the ad completes playing.
* `ads-first-quartile`: Fired when the ad playhead crosses first quartile.
* `ads-midpoint`: Fired when the ad playhead crosses midpoint.
* `ads-third-quartile`: Fired when the ad playhead crosses third quartile.
* `ads-pause`: Fired when the ad is paused.
* `ads-play`: Fired when the ad is resumed.
* `ads-mute`: Fired when the ad volume has been muted.
* `ads-click`: Fired when the ad is clicked.

#### Properties

```
player.ads.provider = {
  "type": `String`,
  "event": `Object`
}

player.ads.ad = {
  "type": `String`,
  "index": `Number`,
  "id": `String`,
  "duration": `Number`,
  "currentTime": `Function`
}
```

### Macros

An optional feature that contrib-ads supports is ad macros. Ad macros are often used by ad integrations
to support addition of run-time values into a server URL or configuration.

For example, an ad integration that supports this feature might accept an ad server URL like this:

`'http://example.com/vmap.xml?id={player.id}'`

In the ad integration, it would use the videojs-contrib-ads macro feature to process that URL like this:

`serverUrl = player.ads.adMacroReplacement(serverUrl, true, additionalMacros);`

This would result in a server URL like this:

`'http://example.com/vmap.xml?id=12345'`

where 12345 is the player ID.

adMacroReplacement takes 3 arguments:

1. The string that has macros to be replaced.
2. `true` if the macro values should be URI encoded when they are inserted, else `false` (default `false`)
3. An optional object that defines additional macros, such as `{'{five}': 5}` (default `{}`)

#### Static Macros

| Name                     | Value                          |
|:-------------------------|:-------------------------------|
| {player.id}              | The player ID                  |
| {player.duration}        | The duration of current video* |
| {timestamp}              | Current epoch time             |
| {document.referrer}      | Value of document.referrer     |
| {window.location.href}   | Value of window.location.href  |
| {random}                 | A random number 0-1 trillion   |
| {mediainfo.id}           | Pulled from mediainfo object   |
| {mediainfo.name}         | Pulled from mediainfo object   |
| {mediainfo.description}  | Pulled from mediainfo object   |
| {mediainfo.tags}         | Pulled from mediainfo object   |
| {mediainfo.reference_id} | Pulled from mediainfo object   |
| {mediainfo.duration}     | Pulled from mediainfo object   |
| {mediainfo.ad_keys}      | Pulled from mediainfo object   |

\* Returns 0 if video is not loaded. Be careful timing your ad request with this macro.

#### Dynamic Macro: mediainfo.custom_fields.*

A macro such as {mediainfo.custom_fields.foobar} allows the user to access the value of any property in `mediainfo.custom_fields`.

#### Dynamic Macro: pageVariable.*

A macro such as {pageVariable.foobar} allows the user access the value of any property on the `window` object. Only certain value types are allowed, per this table:

| Type      | What happens                          |
|:----------|:--------------------------------------|
| String    | Used without any change               |
| Number    | Converted to string automatically     |
| Boolean   | Converted to string automatically     |
| Null      | Returns the string `"null"`           |
| Undefined | Logs warning and returns empty string |
| Other     | Logs warning and returns empty string |

## Cue Metadata Tracks

An optional feature that allows the manipulation of metadata tracks, specifically in the case of working with advertising cue points.

For example, an ad integration may want to make an ad request when a cuepoint change has been observed. To do this, an ad integration would need to do something like this:

`player.ads.cueTextTracks.processMetadataTracks(player, processMetadataTrack)`

where processMetadataTrack could be something like this:

```
function processMetadataTrack(player, track) {
  track.addEventListener('cuechange', function() {
    var cues = this.cues;
    var processCue = function() {
      // Make an ad request
      ...
    };
    var cancelAds = function() {
      // Optional method to dynamically cancel ads
      // This will depend on the ad implementation
      ...
    };

    player.ads.cueTextTracks.processAdTrack(player, cues, processCue, cancelAds);
  });
}
```

For more information on the utility methods that are available, see [cueTextTracks.js](https://github.com/videojs/videojs-contrib-ads/blob/master/src/cueTextTracks.js).

### setMetadataTrackMode

A track is 'enabled' if the track.mode is set to `hidden` or `showing`. Otherwise, a track is `disabled` and is not updated. It is important to note that some tracks may be disabled as a workaround of not being able to remove them, and so should not be re-enabled. Ad integrations should be careful about setting the mode of tracks in these cases and shadow `setMetadataTrackMode` to determine which tracks are safe to change. For example, if all tracks should be hidden:

```
player.ads.cueTextTracks.setMetadataTrackMode = function(track) {
  // Hide the tracks so they are enabled and get updated
  // but are not shown in the UI
  track.mode = 'hidden';
}
```

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

### stitchedAds

Type: `boolean`
Default Value: `false`

Set this to true if you are using ads stitched into the content video. This is necessary for ad events to be sent correctly.

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

### disableNextSnapshotRestore
Prevents videojs-contrib-ads from restoring the previous video source

If you need to change the video source during ad playback, you can use _disableNextSnapshotRestore_ to prevent videojs-contrib-ads to restore to the previous video source.
```js
if (player.ads.state  === 'ad-playback') {
    player.ads.disableNextSnapshotRestore = true;
    player.src('another-video.mp4');
}
```

### Redispatch

This project includes a feature called `redispatch` which will monitor all [media
events](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events) and
modify them with the goal of making the usage of ads transparent. For example, when an
ad plays, an `adplaying` event will be sent rather than a `playing` event. Code that
listens to the `playing` event will not see additional `playing` events due to an
advertisement playing.

In order for redispatch to work correctly, any ad plugin built using contrib-ads must be
initialized as soon as possible, before any other plugins that attach event listeners.

Different platforms, browsers, devices, etc. send different media events at different
times. Redispatch does not guarentee a specific sequence of events, but instead ensures
that certain expectations are met. The next section describes those expectations.

#### The Law of the Land: Redispatch Event Behavior

##### `play` events

 * Play events represent intention to play, such as clicking the play button.
 * Play events do not occur during [ad playback](#isAdPlaying).
 * Play events can happen during [ad mode](#isInAdMode) when [an ad is not currently
 playing](#isAdPlaying), but content will not play as a result.

##### `playing` events

 * Playing events may occur when content plays.
 * If there is a preroll, there is no playing event before the preroll.
 * If there is a preroll, there is at least one playing event after the preroll.

##### `ended` events

 * If there is no postroll, there is a single ended event when content ends.
 * If there is a postroll, there is no ended event before the postroll.
 * If there is a postroll, there is a single ended event after the postroll.

##### `loadstart` events

 * There is always a loadstart event after content starts loading.
 * There is always a loadstart when the source changes.
 * There is never a loadstart due to an ad loading.

##### Other events

 * As a general rule, usual events are not sent if the plugin is in
 (ad mode)[#isInAdMode].

## Migration Guides

* [Migrating to 2.0](migrating-to-2.0.md)
* [Migrating to 3.0](migrating-to-3.0.md)
* [Migrating to 4.0](migrating-to-4.0.md)

## Building

The ads plugin is designed to be built with `npm`.

If you don't already have `npm`, then download and install [Node.js](http://nodejs.org/) (which comes with npm).

With NPM ready, you can download the ads plugin's build-time dependencies and then build the ads plugin.
Open a terminal to the directory where you've cloned this repository, then:

```sh
$ npm install
$ npm run build
```

We will run a suite of unit tests and code formatting checks, then create a `dist/` directory.
Inside you'll find the minified ads plugin file `videojs.ads.min.js`, the unminified `videojs.ads.js`, and the CSS `videojs.ads.css`.

## Release History

A short list of features, fixes and changes for each release is available in [CHANGELOG.md](https://github.com/videojs/videojs-contrib-ads/blob/master/CHANGELOG.md).

## License

See [LICENSE-APACHE2](LICENSE-APACHE2).
