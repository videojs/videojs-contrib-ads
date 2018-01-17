# Migrating to videojs-contrib-ads 6.0.0

Version 6 of videojs-contrib-ads includes a major refactor and cleanup of the state management logic.

## Migration

* Preroll timeouts are more accurate. The timeout used to restart if ____.
* Ended events are no longer delayed by 1 second after the first time content ends.
* There will no longer be a `contentended` event when content ends after the first time content ends.
* We no longer recommend checking `ads.state` in integration code. The new values will not match the pre-6 implementations and any such checks must be migrated. Methods have been added to replace such checks, such as `ads.isInAdMode()`.
* The event parameter `triggerevent` has been removed. It is unlikely that integrations used it, but any usage must be migrated.