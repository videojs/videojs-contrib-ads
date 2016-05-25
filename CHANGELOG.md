## CHANGELOG

## v3.3.0

* [@incompl](https://github.com/incompl): Fix bug with snapshots and live streams
* [@incompl](https://github.com/incompl): Added `videoElementRecycled` method
* [@incompl](https://github.com/incompl): Added `stitchedAds` setting and method
* [@incompl](https://github.com/incompl): Fix to prefixing of events when player has preload set to `none`
* [@bcvio](https://github.com/bcvio): Documented `disableNextSnapshotRestore` option

## v3.2.0

* [@incompl](https://github.com/incompl): Ad impl can now send 'nopreroll' and 'nopostroll' to inform contrib-ads it should not wait for an ad that isn't coming.
* [@incompl](https://github.com/incompl): In live streams, mute live stream and play it in the background during ads, except on platforms where ads reuse the content video element.
* [@bcvio](https://github.com/incompl): Add ability to prevent snapshot restoration

## v3.1.3

* [@gkatsev](https://github.com/gkatsev): Updated path to videojs and media URLs in example page
* [@incompl](https://github.com/incompl): startLinearAdMode now only triggers adstart from appropriate states

## v3.1.2

* [@gkatsev](https://github.com/gkatsev): Addressed issues with some browsers (Firefox with MSE) where the `"canplay"` event fires at the wrong time. [#136](https://github.com/videojs/videojs-contrib-ads/pull/136)
* [@misteroneill](https://github.com/misteroneill): Ensure that editor files and other undesirable assets don't appear in npm packages. [#137](https://github.com/videojs/videojs-contrib-ads/pull/137)

## v3.1.1

* [@alex-phillips](https://github.com/alex-phillips): Fixed issues caused by overly-aggressive DOM node caching, which caused issues when ads and content used different techs. [#131](https://github.com/videojs/videojs-contrib-ads/pull/131)
* [@misteroneill](https://github.com/misteroneill): Fixed logic with determining if the source changed when trying to restore a player snapshot after an ad ends. [#133](https://github.com/videojs/videojs-contrib-ads/pull/133)
* [@misteroneill](https://github.com/misteroneill): Removed or simplified code with methods available in video.js 5.x. [#134](https://github.com/videojs/videojs-contrib-ads/pull/134)

## v3.1.0

* Adds a `"contentresumed"` event to support stitched-in ads.

## v3.0.0

* Mostly transparent to plugin users, this release is a VideoJS 5.0-compatible iteration of the plugin.
* Updated testing to be more modern and robust.
* Renamed `player.ads.timeout` to `player.ads.adTimeoutTimeout`.
* Exposed `player.ads.resumeEndedTimeout`.

## v2.0.0

* Prefix video events during ad playback to simplify the world for non-ad plugins

## v1.0.0

* Simplify ad timeout handling and remove the `ad-timeout-playback` state
* Introduce `aderror` event to get back to content when a problem occurs
* Fire `contentplayback` event any time the `content-playback` state is entered
* Expose the event that caused the transition to the current state

## v0.6.0

* Disable and re-enable text tracks automatically around ads
* Snapshot styles to fix damage caused by ad blockers

## v0.5.0

* Make the ad workflow cancelable through the `adscanceled` event

## v0.4.0

* Ad blocker snapshot restoration fixes
* Post-roll fixes
* Allow content source updates without restarting ad workflow

## v0.3.0

* Post-roll support

## v0.2.0

* Upgrade to video.js 4.4.3
* Added support for burned-in or out-of-band linear ad playback
* Debug mode

## v0.1.0

* Initial release.
