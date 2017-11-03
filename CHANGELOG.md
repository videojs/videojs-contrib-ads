<a name="5.1.2"></a>
## [5.1.2](https://github.com/videojs/videojs-contrib-ads/compare/v5.0.4-0...v5.1.2) (2017-11-03)

### Bug Fixes

* snapshot.trackChangeHandler is undefined ([#293](https://github.com/videojs/videojs-contrib-ads/issues/293)) ([8a66140](https://github.com/videojs/videojs-contrib-ads/commit/8a66140))

<a name="5.1.1"></a>
## [5.1.1](https://github.com/videojs/videojs-contrib-ads/compare/v5.0.4-0...v5.1.1) (2017-11-02)

### Bug Fixes

* snapshot.trackChangeHandler is undefined ([#293](https://github.com/videojs/videojs-contrib-ads/issues/293)) ([8a66140](https://github.com/videojs/videojs-contrib-ads/commit/8a66140))

<a name="5.1.0"></a>
# [5.1.0](https://github.com/videojs/videojs-contrib-ads/compare/v3.3.13...v5.1.0) (2017-09-12)

### Bug Fixes

* Fix mis-named dists and potentially breaking change in package.json 'main' field. ([#280](https://github.com/videojs/videojs-contrib-ads/issues/280)) ([7633161](https://github.com/videojs/videojs-contrib-ads/commit/7633161))
* Remove old call to player.load() during snapshot restoration for players which share the video element with the ad integration. This is causing problems in Chrome/Edge with Video.js 6 due to the asynchronous nature of calling player.src(). ([#257](https://github.com/videojs/videojs-contrib-ads/issues/257)) ([afb3ccf](https://github.com/videojs/videojs-contrib-ads/commit/afb3ccf))

### Chores

* Cross-compatibility between Video.js 5 and 6 ([#241](https://github.com/videojs/videojs-contrib-ads/issues/241)) ([eec856a](https://github.com/videojs/videojs-contrib-ads/commit/eec856a))

### Code Refactoring

* Better support for multiple module systems. ([#272](https://github.com/videojs/videojs-contrib-ads/issues/272)) ([0da0c1c](https://github.com/videojs/videojs-contrib-ads/commit/0da0c1c))

# CHANGELOG

## 5.1.0

* [@misteroneill](http://github.com/misteroneill): Better support for multiple module systems
* [@alex-barstow](http://github.com/alex-barstow): Fix issue where captions were showing during ads on iOS

## 5.0.3

* [@ldayananda](http://github.com/ldayananda): Bugfixes for ad cancellation by cues
* [@ldayananda](http://github.com/ldayananda): cueTextTracks should always listen to addtrack event

## 5.0.2

* [@incompl](http://github.com/incompl): Fixed dispatching of `loadeddata` and `loadedmetadata` events
* [@incompl](http://github.com/incompl): Adserror ends linear ad mode

## 5.0.1

* [@incompl](http://github.com/incompl): Emit an error if plugin is initialized too late. [More info](https://github.com/videojs/videojs-contrib-ads#important-note-about-initialization)

## 5.0.0
  		  
Please refer to the [Migrating to 5.0](https://github.com/videojs/videojs-contrib-ads/blob/master/migration-guides/migrating-to-5.0.md) guide when updating to this version.
  		  
* [@incompl](http://github.com/incompl): Added integration tests for Redispatch		
* [@incompl](http://github.com/incompl): Added documentation for Redispatch		
* [@incompl](http://github.com/incompl): A more reliable and maintainable Redispatch implementation

## 4.2.8

* [@nochev](http://github.com/nochev): Clear registered timeouts when player is disposed

## 4.2.7

* [@nochev](http://github.com/nochev): Remove error throwing for live videos
* [@alex-barstow](https://github.com/alex-barstow): Placeholder div's CSS position and top values now match the player's 

## 4.2.6

* [@brandonocasey](https://github.com/brandonocasey): Cross-compatibility between Video.js 5 and 6

## 4.2.5

* [@ldayananda](https://github.com/ldayananda): Adding a way to estimate adType
* [@ldayananda](https://github.com/ldayananda): Adding back support for es3
* [@ldayananda](https://github.com/ldayananda): Reverting "No longer take a postroll snapshot when we already know there will not be a postroll" to fix a bug with missing `ended` events.


## 4.2.4

This version introduces a bug with missing `ended` events. It is fixed in the next version.

* [@ldayananda](https://github.com/ldayananda): No longer take a postroll snapshot when we already know there will not be a postroll

## 4.2.3

* [@misteroneill](https://github.com/misteroneill): Video.js 5/6 cross-compatibility

## 4.2.2

* [@incompl](https://github.com/incompl): Re-fix iOS content flash
* [@ldayananda](https://github.com/ldayananda): Added cuepoints example
* [@incompl](https://github.com/incompl): Documented contentresumed event

## 4.2.1

* [@incompl](https://github.com/incompl): Revert progress bar clickthrough CSS
* [@ldayananda](https://github.com/ldayananda): Started using ES6 exports

## 4.2.0

* [@ldayananda](https://github.com/ldayananda): Adding a new module to process metadata tracks for ad cue point manipulation
* [@incompl](http://github.com/incompl): Update videojs-standard dependency

## 4.1.6

* [@marguinbc](http://github.com/marguinbc): Fix placeholder div on ios10 playsinline
* [@incompl](http://github.com/incompl): No longer send an undocumented `adcontentplaying` event, which was only sent to cancel an extra `adplaying` event. Code has been refactored to not need this extra event.

## 4.1.5

* [@incompl](http://github.com/incompl): Hide captions and audio track buttons during ads
* [@incompl](http://github.com/incompl): Prevent ad clickthrough when clicking progress bar during ad
* [@incompl](http://github.com/incompl): Trigger ended event for successive times the content ends after the first time

## 4.1.4

* [@marguinbc](https://github.com/marguinbc): Fix issue where blank div to prevent content flash covers ad on iPad
* [@ldayananda](https://github.com/ldayananda): Fix to snapshot test to avoid relying on track src

## 4.1.3

* [@Ambroos](https://github.com/Ambroos): Add missing import of videojs
* [@vdeshpande](https://github.com/vdeshpande): Fix for content playing behind ad on Android

## 4.1.2

* [@incompl](http://github.com/incompl): Fix bug with snapshot and text tracks

## 4.1.1

* [@incompl](http://github.com/incompl): Temporarily re-added `contentplayback` as a transitionary step. Do not use this event.

## 4.1.0

* [@incompl](http://github.com/incompl): New ad macros feature

## 4.0.0

Please refer to the [Migrating to 4.0](https://github.com/videojs/videojs-contrib-ads/blob/master/migration-guides/migrating-to-4.0.md) guide when updating to this version.

* [@incompl](http://github.com/incompl): `playing` event no longer sent before preroll
* [@incompl](http://github.com/incompl): `contentplayback` event removed
* [@incompl](http://github.com/incompl): Fixed a flash of content introduced in Chrome 53 where ads-loading class was being removed too soon
* [@ldayananda](http://github.com/ldayananda): Added `player.ads.VERSION`
* [@incompl](http://github.com/incompl): Updated to use conventions put forward by [generator-videojs-plugin](https://github.com/videojs/generator-videojs-plugin).
* [@incompl](http://github.com/incompl): Created separate files for feature modules

## 3.3.13

* [@marguinbc](https://github.com/marguinbc): Fix check to reset snapshot on contentupdate

## 3.3.12

* [@vdeshpande](https://github.com/vdeshpande): Fix for metrics on empty ad

## 3.3.11

* [@incompl](https://github.com/incompl): Fix for iOS in which a flash of video content is seen before a preroll
* [@ldayananda](https://github.com/ldayananda): Fix a bug in which the ended event does not trigger after video content source is changed

## 3.3.10

* [@incompl](https://github.com/incompl): Fix a bug in which content would replay after postrolls under certain circumstances

## 3.3.9

* [@incompl](https://github.com/incompl): Fix a bug in which contentupdate is missed in postroll? state

## 3.3.8

* [@incompl](https://github.com/incompl): Fix for issue resuming after ads on Android
* [@incompl](https://github.com/incompl): Fix for issue requesting ads for subsequent videos

## 3.3.7

* [@bcvio](https://github.com/bcvio): Fix a bug where content would replay after a postroll completed.

## 3.3.6

* Due to a build error, this version has no dist folder.

## 3.3.5

* Last version release was done in an abnormal way. No issues have been observed, but this release is guaranteed to be correct.

## 3.3.4

* [@incompl](https://github.com/incompl): Fix bug where content would not pause for preroll ad in cases where the "play" event fires before the "loadstart" event after a source change

## 3.3.3

* [@bcvio](https://github.com/bcvio): Fix a bug where two ad-end events would fire

## 3.3.2

* [@incompl](https://github.com/incompl): Fix bug related to snapshots during live streams on older devices
* [@incompl](https://github.com/incompl): Added `videoElementRecycled` method
* [@incompl](https://github.com/incompl): Added `stitchedAds` setting and method
* [@incompl](https://github.com/incompl): Fix prefixing of events when preload is set to `none`
* [@bcvio](https://github.com/bcvio): Document `disableNextSnapshotRestore` option

## 3.2.0

* [@incompl](https://github.com/incompl): Ad impl can now send 'nopreroll' and 'nopostroll' to inform contrib-ads it should not wait for an ad that isn't coming.
* [@incompl](https://github.com/incompl): In live streams, mute live stream and play it in the background during ads, except on platforms where ads reuse the content video element.
* [@bcvio](https://github.com/bcvio): Add ability to prevent snapshot restoration

## 3.1.3

* [@gkatsev](https://github.com/gkatsev): Updated path to videojs and media URLs in example page
* [@incompl](https://github.com/incompl): startLinearAdMode now only triggers adstart from appropriate states

## 3.1.2

* [@gkatsev](https://github.com/gkatsev): Addressed issues with some browsers (Firefox with MSE) where the `"canplay"` event fires at the wrong time. [#136](https://github.com/videojs/videojs-contrib-ads/pull/136)
* [@misteroneill](https://github.com/misteroneill): Ensure that editor files and other undesirable assets don't appear in npm packages. [#137](https://github.com/videojs/videojs-contrib-ads/pull/137)

## 3.1.1

* [@alex-phillips](https://github.com/alex-phillips): Fixed issues caused by overly-aggressive DOM node caching, which caused issues when ads and content used different techs. [#131](https://github.com/videojs/videojs-contrib-ads/pull/131)
* [@misteroneill](https://github.com/misteroneill): Fixed logic with determining if the source changed when trying to restore a player snapshot after an ad ends. [#133](https://github.com/videojs/videojs-contrib-ads/pull/133)
* [@misteroneill](https://github.com/misteroneill): Removed or simplified code with methods available in video.js 5.x. [#134](https://github.com/videojs/videojs-contrib-ads/pull/134)

## 3.1.0

* Adds a `"contentresumed"` event to support stitched-in ads.

## 3.0.0

* Mostly transparent to plugin users, this release is a VideoJS 5.0-compatible iteration of the plugin.
* Updated testing to be more modern and robust.
* Renamed `player.ads.timeout` to `player.ads.adTimeoutTimeout`.
* Exposed `player.ads.resumeEndedTimeout`.

## 2.0.0

* Prefix video events during ad playback to simplify the world for non-ad plugins

## 1.0.0

* Simplify ad timeout handling and remove the `ad-timeout-playback` state
* Introduce `aderror` event to get back to content when a problem occurs
* Fire `contentplayback` event any time the `content-playback` state is entered
* Expose the event that caused the transition to the current state

## 0.6.0

* Disable and re-enable text tracks automatically around ads
* Snapshot styles to fix damage caused by ad blockers

## 0.5.0

* Make the ad workflow cancelable through the `adscanceled` event

## 0.4.0

* Ad blocker snapshot restoration fixes
* Post-roll fixes
* Allow content source updates without restarting ad workflow

## 0.3.0

* Post-roll support

## 0.2.0

* Upgrade to video.js 4.4.3
* Added support for burned-in or out-of-band linear ad playback
* Debug mode

## 0.1.0

* Initial release.
