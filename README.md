![Contrib Ads: A Tool for Building Video.js Ad Plugins](logo.png)

[![Build Status](https://travis-ci.org/videojs/videojs-contrib-ads.svg)](https://travis-ci.org/videojs/videojs-contrib-ads) [![Greenkeeper badge](https://badges.greenkeeper.io/videojs/videojs-contrib-ads.svg)](https://greenkeeper.io/)

`videojs-contrib-ads` provides common functionality needed by video advertisement libraries working with [video.js.](http://www.videojs.com/)
It takes care of a number of concerns for you, reducing the code you have to write for your ad integration.

`videojs-contrib-ads` is not a stand-alone ad plugin. It is a library that is used by
other ad plugins (called "integrations") in order to fully support video.js. If you want
to build an ad plugin, you've come to the right place. If you want to play ads in video.js
without writing code, this is not the right project for you.

Lead Maintainer: Greg Smith [https://github.com/incompl](https://github.com/incompl)

Maintenance Status: Stable

## Benefits

* Ad timeouts are implemented by default. If ads take too long to load, content automatically plays.
* Player state is automatically restored after ad playback, even if the ad played back in the content's video element.
* Content is automatically paused and a loading spinner is shown while preroll ads load.
* [Media events](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events) will fire as though ads don't exist. For more information, read the section on [Redispatch](https://github.com/videojs/videojs-contrib-ads#redispatch).
* Useful macros in ad server URLs are provided.
* Preroll checks automatically happen again when the video source changes.

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

### Using a module system

If you are loading `videojs-contrib-ads` using modules, do this:

https://github.com/videojs/videojs-contrib-ads/pull/312

TODO: Update that link once that PR is merged.

With this basic structure in place, you're ready to develop an ad integration.

## Important Note About Initialization

In order to function correctly, videojs-contrib-ads must be initialized immediately after video.js (in the same [tick](http://blog.carbonfive.com/2013/10/27/the-javascript-event-loop-explained/). This is for two reasons:

* This plugin relies on `loadstart` events, and initializing the plugin late means the plugin may miss an initial `loadstart`.
* For [Redispatch](#redispatch) to function it must be initialized before any other code that listens to media events.

The plugin will emit an error if it detects that it it missed a `loadstart` event. If this happens, it is likely that downstream failures will occur, so it's important to resolve this issue.

## Developing an Integration

First you call `player.ads()` to initialize the plugin. Afterwards, the flow of interaction
between your ad integration and contrib-ads looks like this:

* Player triggers `play` (EVENT) -- This media event is triggered when there is a request to play your player.
videojs-contrib-ads responds by preventing content playback and showing a loading spinner.
* Integration triggers `adsready` (EVENT) -- Your integration should trigger this event on the player to indicate that
it is initialized. This can happen before or after the `play` event.
* Contrib Ads triggers `readyforpreroll` (EVENT) -- This event is fired after both `play` and `adsready` have ocurred.
This signals that the integration may begin an ad break by calling `startLinearAdMode`.
* Integration calls `player.ads.startLinearAdMode()` (METHOD) -- This begins an ad break. During this time, your integration
plays ads. videojs-contrib-ads does not handle actual ad playback.
* Integration triggers `ads-ad-started` (EVENT) - Trigger this when each individual ad begins. This removes the loading spinner, which otherwise stays up during the ad break. It's possible for an ad break
to end without an ad starting, in which case the spinner stays up the whole time.
* Integration calls `player.ads.endLinearAdMode()` (METHOD) -- This ends an ad break. As a result, content will play.
* Content plays.
* To play a Midroll ad, start and end an ad break with `player.ads.startLinearAdMode()` and `player.ads.endLinearAdMode()` at any time during content playback.
* Contrib Ads triggers `contentended` (EVENT) -- This event means that it's time to play a postroll ad.
* To play a Postroll ad, start and end an ad break with `player.ads.startLinearAdMode()` and `player.ads.endLinearAdMode()`.
* Contrib Ads triggers `ended` (EVENT) -- This standard media event happens when all ads and content have completed. After this, no additional ads are expected, even if the user seeks backwards.

This is the basic flow for a simple use case, but there are other things the integration can do:

* `skipLinearAdMode` (METHOD) -- At a time when `startLinearAdMode` is expected, calling `skipLinearAdMode` will immediately resume content playback instead.
* `nopreroll` (EVENT) -- You can trigger this event even before `readyforpreroll` to indicate that no preroll will play. The ad plugin will not check for prerolls and will instead begin content playback after the `play` event (or immediately, if playback was already requested).
* `nopostroll` (EVENT) -- Similar to `nopreroll`, you can trigger this event even before `contentended` to indicate that no postroll will play.  The ad plugin will not wait for a postroll to play and will instead immediately trigger the `ended` event.
* `adserror` (EVENT) -- This event skips prerolls when seen before a preroll ad break. It skips postrolls if called after contentended and before a postroll ad break. It ends linear ad mode if seen during an ad break.
* `contentresumed` (EVENT) - If your integration does not result in a "playing" event when resuming content after an ad, send this event to signal that content can resume. This was added to support stitched ads and is not normally necessary.

There are some other useful events that videojs-contrib-ads may trigger:

 * `contentchanged` (EVENT) -- Fires when a new content video has been loaded in the player (specifically, at the same time as the `loadstart` media event for the new source). This means the ad workflow has restarted from the beginning. Your integration will need to trigger `adsready` again, for example. Note that when changing sources, the playback state of the player is retained: if the previous source was playing, the new source will also be playing and the ad workflow will not wait for a new `play` event.

Deprecated events:

* `contentupdate` (EVENT) -- Replaced by `contentchanged`, which is more reliable.
* `adscanceled` (EVENT) -- Intended to cancel all ads, it was never fully implemented. Instead, use `nopreroll` and `nopostroll`.

### Public Methods

These are methods on `player.ads` that can be called at runtime to inspect the ad plugin's state. You do not need to implement them yourself.

#### isInAdMode()

Returns true if the player is in ad mode.

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
* A non-linear ad (such as an overlay) is active

#### isContentResuming()

Returns true if content is resuming after an ad. This is part of ad mode.

#### inAdBreak()

This method returns true during the time between startLinearAdMode and endLinearAdMode where an integration may play ads. This is part of ad mode.

#### isAdPlaying()

Deprecated. Does the same thing as `inAdBreak` but has a misleading name.

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

To manage communication between your ad integration and the video.js player, the ads plugin goes through a number of states. You don't need to be aware of this to build an integration, but it may be useful for videojs-contrib-ads developers or for debugging.

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

The maximum amount of time to wait in ad mode before an ad begins. If this time elapses, ad mode ends and content resumes.

Some ad plugins may want to play a preroll ad even after the timeout has expired and content has begun playing. To facilitate this, videojs-contrib-ads will respond to an `adsready` event during content playback with a `readyforpreroll` event. If you want to avoid this behavior, make sure your plugin does not send `adsready` if `player.ads.isInAdMode()` is `false`.

### prerollTimeout

Type: `number`
No Default Value

Override the `timeout` setting just for preroll ads (the time between `play` and `startLinearAdMode`)

### postrollTimeout

Type: `number`
No Default Value

Override the `timeout` setting just for preroll ads (the time between `contentended` and `startLinearAdMode`)

### stitchedAds

Type: `boolean`
Default Value: `false`

Set this to true if you are using ads stitched into the content video. This is necessary for ad events to be sent correctly.

### debug

Type: `boolean`
Default Value: false

If debug is set to true, the ads plugin will output additional debugging information.
This can be handy for diagnosing issues or unexpected behavior in an ad integration.

## Plugin Events
The plugin triggers a number of custom events on the player during its operation. As an ad provider, you can listen for them to trigger behavior in your implementation. They may also be useful for other plugins to track advertisement playback.

### adstart
The player has entered linear ad playback mode. This event is fired directly as a consequence of calling `startLinearAdMode()`. This event only indicates that an ad break has begun; the start and end of individual ads must be signalled through some other mechanism.

### adend
The player has returned from linear ad playback mode. This event is fired directly as a consequence of calling `endLinearAdMode()`. Note that multiple ads may have played back in the ad break between `adstart` and `adend`.

### adskip
The player is skipping a linear ad opportunity and content-playback should resume immediately.  This event is fired directly as a consequence of calling `skipLinearAdMode()`. For example, it can indicate that an ad response was received but it included no linear ad content or that no ad call is going to be made due to an error.

### adtimeout
A timeout managed by videojs-contrib-ads has expired and regular video content has begun to play. Ad integrations have a fixed amount of time to start an ad break when an opportunity arises. For example, if the ad integration is blocked by network conditions or an error, this event will fire and regular playback will resume rather than the player stalling indefinitely.

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
Advanced option. Prevents videojs-contrib-ads from restoring the previous video source.

If you need to change the video source during an ad break, you can use _disableNextSnapshotRestore_ to prevent videojs-contrib-ads from restoring the snapshot from the previous video source.
```js
if (player.ads.inAdBreak()) {
    player.ads.disableNextSnapshotRestore = true;
    player.src('another-video.mp4');
}
```

Keep in mind that you still need to end linear ad mode.

### Redispatch

This project includes a feature called `redispatch` which will monitor all [media
events](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events) and
modify them with the goal of making the usage of ads transparent. For example, when an
ad is playing, a `playing` event would be sent as an `adplaying` event. Code that
listens to the `playing` event will not see `playing` events that result from an
advertisement playing.

In order for redispatch to work correctly, any ad plugin built using contrib-ads must be
initialized as soon as possible, before any other plugins that attach event listeners.

Different platforms, browsers, devices, etc. send different media events at different
times. Redispatch does not guarentee a specific sequence of events, but instead ensures
that certain expectations are met. The next section describes those expectations.

#### The Law of the Land: Redispatch Event Behavior

##### `play` events

 * Play events represent intention to play, such as clicking the play button.
 * Play events do not occur during [ad playback](#isadplaying).
 * Play events can happen during [ad mode](#isinadmode) when [an ad is not currently
 playing](#isadplaying), but content will not play as a result.

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
 [ad mode](#isinadmode).

## Migration Guides

* [Migrating to 2.0](migration-guides/migrating-to-2.0.md)
* [Migrating to 3.0](migration-guides/migrating-to-3.0.md)
* [Migrating to 4.0](migration-guides/migrating-to-4.0.md)
* [Migrating to 5.0](migration-guides/migrating-to-5.0.md)
* [Migrating to 6.0](migration-guides/migrating-to-6.0.md)

## Testing

### Using command line

```sh
npm run test
```

### In browser

Run `./node_modules/.bin/karma start --no-single-run --browsers Chrome test/karma.conf.js` then open `localhost:9876/debug.html`

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

## Roadmap

### Unplanned Major Version Update

* Pause content video if there is a programmatic call to play (prefixed as adplay) while an ad is playing in an ad container (rather than content video element). Prefixing doesn't prevent the videojs behavior, so this would prevent the content from playing behind the ad. Right now, ad integrations I am aware of are doing this on their own, so this would require a migration to move the behavior into this project.
* `contentended` has a confusing name: real `ended` events are later sent, and that is when content should be considered ended. The `content` prefix is used for events when content is resuming after an ad. A better name would be `readyforpostroll`. That would make it clearer to implementations that the correct response would be to either play a postroll or send the `nopostroll` event.

## License

See [LICENSE-APACHE2](LICENSE-APACHE2).
