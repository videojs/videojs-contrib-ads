# Integration API

This page contains reference documentation for the interaction points between videojs-contrib-ads and ad plugins that use it.

## Informational Methods

These are methods on `player.ads` that can be called at runtime to inspect the ad plugin's state.

* `isInAdMode()` (METHOD) -- Returns true if the player is in ad mode. See the next section for the definition of ad mode.
* `isWaitingForAdBreak()` (METHOD) -- This method returns true during ad mode if an ad break hasn't started yet.
* `inAdBreak()` (METHOD) -- This method returns true after `startLinearAdMode` and before `endLinearAdMode`. This is the part of ad mode when an integration may play ads.
* `isContentResuming()` (METHOD) -- This method returns true during ad mode after an ad break has ended but before content has resumed playing.

## Ad mode definition

> If content playback is blocked by the ad plugin.

### Examples of ad mode:

* Waiting to find out if an ad is going to play while content would normally be playing
* Waiting for an ad to start playing while content would normally be playing.
* A linear ad is playing
* An ad has completed and content is about to resume, but content has not resumed yet

### Examples of not ad mode:

* Content playback has not been requested
* Content playback is paused
* An asynchronous ad request is ongoing while content is playing
* A non-linear ad (such as an overlay) is active

## Events triggered by contrib-ads

The plugin triggers a number of custom events on the player during its operation. As an ad provider, you can listen for them to trigger behavior in your implementation. They may also be useful for other plugins to track advertisement playback.

* `readyforpreroll` (EVENT) -- Indicates that your integration may start a preroll ad break by calling `startLinearAdMode`.
* `contentended` (EVENT) -- Indicates that your integration may start a postroll ad break by calling `startLinearAdMode`.
* `adstart` (EVENT) -- The player has entered linear ad playback mode. This event is fired directly as a consequence of calling `startLinearAdMode()`. This event only indicates that an ad break has begun; the start and end of individual ads must be signalled through some other mechanism.
* `adend` (EVENT) -- The player has returned from linear ad playback mode. This event is fired directly as a consequence of calling `endLinearAdMode()`. Note that multiple ads may have played back in the ad break between `adstart` and `adend`.
* `adskip` (EVENT) -- The player is skipping a linear ad opportunity and content-playback should resume immediately.  This event is fired directly as a consequence of calling `skipLinearAdMode()`.
* `adtimeout` (EVENT) -- A timeout managed by videojs-contrib-ads has expired and regular video content has begun to play. Ad integrations have a fixed amount of time to start an ad break when an opportunity arises. For example, if the ad integration is blocked by network conditions or an error, this event will fire and regular playback will resume rather than the player stalling indefinitely.
* `contentchanged` (EVENT) -- Fires when a new content video has been loaded in the player (specifically, at the same time as the `loadstart` media event for the new source). This means the ad workflow has restarted from the beginning. Your integration will need to trigger `adsready` again, for example. Note that when changing sources, the playback state of the player is retained: if the previous source was playing, the new source will also be playing and the ad workflow will not wait for a new `play` event.

## How your integration talks to contrib-ads

Your integration can invoke these methods and events to play (or skip) ads. See [Getting Started](getting-started.md) for more information.

* `adsready` (EVENT) -- Trigger this event to indicate that the ad plugin is ready to play prerolls. `readyforpreroll` will not be sent until after you trigger `adsready`, but it may not be sent right away (for example, if the user has not clicked play yet).
* `startLinearAdMode()` (METHOD) -- Invoke this method to start an ad break.
  * For a preroll ad, you can invoke `startLinearAdMode` after the `readyforpreroll` event if `isWaitingForAdBreak` is true.
  * For a midroll ad, you can invoke `startLinearAdMode` during content playback if `isInAdMode()` is false.
  * For a postroll ad, you can invoke `startLinearAdMode` after the `contentended` event if `isWaitingForAdBreak` is true.
* `ads-ad-started` (event) -- Trigger this event during an ad break to indicate that an ad has actually started playing. This will hide the loading spinner. It is possible for an ad break to end without playing any ads.
* `endLinearAdMode()` (method) -- Invoke this method to end an ad break. This will cause content to resume. You can check if an ad break is active using `inAdBreak()`.
* `skipLinearAdMode()` (METHOD) -- At a time when `startLinearAdMode` is expected, calling `skipLinearAdMode` will immediately resume content playback instead.
* `nopreroll` (EVENT) -- You can trigger this event even before `readyforpreroll` to indicate that no preroll will play. The ad plugin will not check for prerolls and will instead begin content playback after the `play` event (or immediately, if playback was already requested).
* `nopostroll` (EVENT) -- Similar to `nopreroll`, you can trigger this event even before `contentended` to indicate that no postroll will play.  The ad plugin will not wait for a postroll to play and will instead immediately trigger the `ended` event.
* `contentresumed` (EVENT) - If your integration does not result in a "playing" event when resuming content after an ad, send this event to signal that content can resume. This was added to support stitched ads and is not normally necessary.

## Advanced Properties

Once the plugin is initialized, there are a couple properties you can
access modify its behavior.

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

## Deprecated

The following are slated for removal from contrib-ads and will have no special behavior once removed. These should no longer be used in integrating ad plugins. Replacements are provided for matching functionality that will continue to be supported.

* `contentupdate` (EVENT) -- In the future, contrib-ads will no longer trigger this event. Listen to the new `contentchanged` event instead; it is is more reliable.
* `adscanceled` (EVENT) -- In the future, this event will no longer result in special behavior in contrib-ads. It was intended to cancel all ads, but it was never fully implemented. Instead, trigger `nopreroll` and `nopostroll`.
* `adserror` (EVENT) -- In the future, this event will no longer result in special behavior in contrib-ads. Today, this event skips prerolls when seen before a preroll ad break. It skips postrolls if seen after contentended and before a postroll ad break. It ends linear ad mode if seen during an ad break. These behaviors should be replaced using `skipLinearAdMode` and `endLinearAdMode` in the ad integration.
* `adplaying` (EVENT)  -- In the future, this event is no longer guaranteed to happen once per ad break. The `ads-pod-started` event should be used to to detect the beginning of an ad break instead. The `ads-ad-started` event can be used to detect the start of an individual ad in an ad break. There will be multiple `ads-ad-started` events corresponding to each ad in the ad break.
* `isAdPlaying()` (METHOD) -- Does the same thing as `inAdBreak` but has a misleading name. Being in an ad break doesn't strictly mean that an ad is playing.
