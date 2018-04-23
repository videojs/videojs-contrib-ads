# Integration API

This page contains reference documentation for the interaction points between videojs-contrib-ads and ad plugins that use it.

## Public Methods

These are methods on `player.ads` that can be called at runtime to inspect the ad plugin's state.

### isInAdMode()

Returns true if the player is in ad mode.

#### Ad mode definition:

> If content playback is blocked by the ad plugin.

##### Examples of ad mode:

* Waiting to find out if an ad is going to play while content would normally be
  playing.
* Waiting for an ad to start playing while content would normally be playing.
* A linear ad is playing
* An ad has completed and content is about to resume, but content has not resumed
  yet.

##### Examples of not ad mode:

* Content playback has not been requested
* Content playback is paused
* An asynchronous ad request is ongoing while content is playing
* A non-linear ad (such as an overlay) is active

### isContentResuming()

Returns true if content is resuming after an ad. This is part of ad mode.

### inAdBreak()

This method returns true during the time between startLinearAdMode and endLinearAdMode where an integration may play ads. This is part of ad mode.

### isAdPlaying()

Deprecated. Does the same thing as `inAdBreak` but has a misleading name.

## Events

The plugin triggers a number of custom events on the player during its operation. As an ad provider, you can listen for them to trigger behavior in your implementation. They may also be useful for other plugins to track advertisement playback.

### adstart
The player has entered linear ad playback mode. This event is fired directly as a consequence of calling `startLinearAdMode()`. This event only indicates that an ad break has begun; the start and end of individual ads must be signalled through some other mechanism.

### adend
The player has returned from linear ad playback mode. This event is fired directly as a consequence of calling `endLinearAdMode()`. Note that multiple ads may have played back in the ad break between `adstart` and `adend`.

### adskip
The player is skipping a linear ad opportunity and content-playback should resume immediately.  This event is fired directly as a consequence of calling `skipLinearAdMode()`. For example, it can indicate that an ad response was received but it included no linear ad content or that no ad call is going to be made due to an error.

### adtimeout
A timeout managed by videojs-contrib-ads has expired and regular video content has begun to play. Ad integrations have a fixed amount of time to start an ad break when an opportunity arises. For example, if the ad integration is blocked by network conditions or an error, this event will fire and regular playback will resume rather than the player stalling indefinitely.

## Properties

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

## Deprecated

The following are slated for removal from contrib-ads and will have no special behavior once removed. These should no longer be used in integrating ad plugins. Replacements are provided for matching functionality that will continue to be supported.

* `contentupdate` (EVENT) -- In the future, contrib-ads will no longer trigger this event. Listen to the new `contentchanged` event instead; it is is more reliable.
* `adscanceled` (EVENT) -- In the future, this event will no longer result in special behavior in contrib-ads. It was intended to cancel all ads, but it was never fully implemented. Instead, trigger `nopreroll` and `nopostroll`.
* `adserror` (EVENT) -- In the future, this event will no longer result in special behavior in contrib-ads. Today, this event skips prerolls when seen before a preroll ad break. It skips postrolls if seen after contentended and before a postroll ad break. It ends linear ad mode if seen during an ad break. These behaviors should be replaced using `skipLinearAdMode` and `endLinearAdMode` in the ad integration.
* `adplaying` (EVENT)  -- In the future, this event is no longer guaranteed to happen once per ad break. The `ads-pod-started` event should be used to to detect the beginning of an ad break instead. The `ads-ad-started` event can be used to detect the start of an individual ad in an ad break. There will be multiple `ads-ad-started` events corresponding to each ad in the ad break.
