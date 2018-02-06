# Migrating to videojs-contrib-ads 6.0.0

Version 6 of videojs-contrib-ads includes a major refactor and cleanup of the state management logic.

## Migration

* Timeouts have a more intuitive behavior. See the next section for more information.
* Ended events are no longer delayed by 1 second.
* Ended events due to an ad ending will no longer be allowed to replace the ended event
that is triggered by linear ad mode ending. Integrations must not emit ended events
after the end of linear ad mode.
* There will no longer be a `contentended` event when content ends after the first time content ends.
* `ads.state` has been removed. Methods have been added to replace state checks, such as `ads.isInAdMode()`. See the README for a list of available methods. `ads._state` has been
added, but it is not compatible with the old `ads.state` and should not be inspected
by integrations.
* The event parameter `triggerevent` has been removed. It is unlikely that integrations used it, but any usage must be migrated.
* We no longer trigger a `readyforpreroll` event after receiving a `nopreroll` event.
* adTimeoutTimeout has been removed. It was not part of the documented interface, but make note if your integration inspected it.
* There is no longer a snapshot object while checking for postrolls. Now a snapshot is only taken when a postroll ad break actually begins.
* The `contentplayback` event has been removed. Use the `playing` event instead.

## Timeout behavior changes

Previous behavior:

* The `timeout` setting was the number of milliseconds that we waited for `adsready` after the `play` event if `adsready` was not before `play`.
* The `prerollTimeout` setting was the number of milliseconds we waited for `startLinearAdMode` after `readyforpreroll`. It was a separate timeout period after `timeout`.
* The `postrollTimeout` setting was the number of milliseconds we waited for `startLinearAdMode` after `contentended`.

Previous Defaults:

* timeout: 5000
* prerollTimeout: 100
* postrollTimeout: 100

New Behavior:

* The `timeout` setting is now the default setting for all timeouts. It can be overridden by `prerollTimeout` and/or `postrollTimeout`.
* `prerollTimeout` is the number of milliseconds we wait for `startLinearAdMode after `play`.
* `postrollTimeout` is the number of milliseconds we wait for `startLinearAdMode` after `contentended`.

New Defaults:

* timeout: 5000
* prerollTimeout: no default
* postrollTimeout: no default
