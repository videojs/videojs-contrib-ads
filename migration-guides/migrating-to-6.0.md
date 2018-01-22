# Migrating to videojs-contrib-ads 6.0.0

Version 6 of videojs-contrib-ads includes a major refactor and cleanup of the state management logic.

## Migration

* Preroll timeouts are more accurate. The timeout used to restart if ____.
* Ended events are no longer delayed by 1 second.
* Ended events due to an ad ending will no longer be allowed to replace the ended event
that is triggered by linear ad mode ending. Integrations must not emit ended events
after the end of linear ad mode.
* There will no longer be a `contentended` event when content ends after the first time content ends.
* `ads.state` has been removed. Methods have been added to replace state checks, such as `ads.isInAdMode()`. See the README for a list of available methods. `ads._state` has been
added, but it is not compatible with the old `ads.state` and should not be inspected
by integrations.
* The event parameters `triggerevent` and `originalEvent` have been removed. It is unlikely that integrations used them, but any usage must be migrated.
* We no longer trigger a `readyforpreroll` event after receiving a `nopreroll` event.
* adTimeoutTimeout has been removed. It was not part of the documented interface, but make note if your integration inspected it.
* There is no longer a snapshot object while checking for postrolls. Now a snapshot is only taken when a postroll ad break actually begins.
