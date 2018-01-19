# Migrating to videojs-contrib-ads 6.0.0

Version 6 of videojs-contrib-ads includes a major refactor and cleanup of the state management logic.

## Migration

* Preroll timeouts are more accurate. The timeout used to restart if ____.
* Ended events are no longer delayed by 1 second.
* Ended events due to an ad ending will no longer be allowed to replace the ended event
that is triggered by linear ad mode ending. Integrations must not emit ended events
after the end of linear ad mode.
* There will no longer be a `contentended` event when content ends after the first time content ends.
* We no longer recommend checking `ads.state` in integration code. Existing checks will not continue to work. Methods have been added to replace such checks, such as `ads.isInAdMode()`.
* The event parameters `triggerevent` and `originalEvent` have been removed. It is unlikely that integrations used them, but any usage must be migrated.
* We no longer trigger a `readyforpreroll` event after receiving a `nopreroll` event.
* adTimeoutTimeout has been removed. It was not part of the documented interface, but make note if your integration inspected it.
* There is no longer a snapshot object while checking for postrolls. Now a snapshot is only taken when a postroll ad break actually begins.
