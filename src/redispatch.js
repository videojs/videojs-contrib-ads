/*
The goal of this feature is to make player events work as an integrator would
expect despite the presense of ads. For example, an integrator would expect
an `ended` event to happen once the content is ended. If an `ended` event is sent
as a result of an ad ending, that is a bug. The `redispatch` method should recognize
such `ended` events and prefix them so they are sent as `adended`, and so on with
all other player events.
*/

import videojs from 'video.js';

// Stop propogation for an event
const cancelEvent = (player, event) => {
  // Pretend we called stopImmediatePropagation because we want the native
  // element events to continue propagating
  event.isImmediatePropagationStopped = function() {
    return true;
  };
  event.cancelBubble = true;
  event.isPropagationStopped = function() {
    return true;
  };
};

// Stop propogation for an event, then send a new event with the type of the original
// event with the given prefix added.
const prefixEvent = (player, prefix, event) => {
  cancelEvent(player, event);
  player.trigger({
    type: prefix + event.type,
    state: player.ads.state,
    originalEvent: event
  });
};

// Handle a player event, either by redispatching it with a prefix, or by
// letting it go on its way without any meddling.
export default function redispatch(event) {

  // Playing event
  // Requirements:
  // * Normal playing event when there is no preroll
  // * No playing event before preroll
  // * At least one playing event after preroll
  if (event.type === 'playing') {
    if (this.ads.isInAdMode()) {

      // During content resuming, only prefix playing if:
      // * Content element was used for ad playback
      // * OR
      // * This was a postroll
      if (this.ads.isContentResuming()) {

        // This does not happen during normal circumstances. I wasn't able to reproduce
        // it, but the working theory is that it handles cases where restoring the
        // snapshot takes a long time, such as in iOS7 and older Firefox.
        if (this.ads.snapshot && this.ads.videoElementRecycled()) {
          prefixEvent(this, 'content', event);

        // Content resuming after postroll
        } else if (this.ads.snapshot && this.ads.snapshot.ended) {
          prefixEvent(this, 'content', event);
        }

      // If content video element is used for ads, adplaying was already sent by
      // cancelContentPlay. Avoid sending another.
      } else if (this.ads.videoElementRecycled()) {
        cancelEvent(this, event);

      // Prefix ad playing events.
      } else {
        prefixEvent(this, 'ad', event);
      }
    }

  // Ended event
  // Requirements:
  // * A single ended event when there is no postroll
  // * No ended event before postroll
  // * A single ended event after postroll
  } else if (event.type === 'ended') {

    // TODO document this
    if (this.ads.state === 'ad-playback' &&
        (this.ads.videoElementRecycled() || this.ads.stitchedAds())) {
      videojs.log('ENDED MARKER 1');
      videojs.log('adended');
      prefixEvent(this, 'ad', event);

    // Disable normal ended event
    // We will trigger the event manually.
    } else if (this.ads.state === 'content-playback') {
      videojs.log('ENDED MARKER 2');
      prefixEvent(this, 'content', event);

    // Disable normal ended event when content resuming after postroll played.
    // We will trigger the event manually.
    } else if (this.ads.isContentResuming()) {
      videojs.log('ENDED MARKER 3');

      // TODO document
      if (this.ads.snapshot &&
          this.currentSrc() !== this.ads.snapshot.currentSrc) {
        videojs.log('ENDED MARKER 4');
        prefixEvent(this, 'content', event);

      // TODO document
      } else if (this.ads.snapshot && this.ads.snapshot.ended) {
        videojs.log('ENDED MARKER 5');
        videojs.log('ended');
        return;
      }

      // Business as usual
      videojs.log('ENDED MARKER 6');
      prefixEvent(this, 'content', event);

    } else {
      videojs.log('ENDED MARKER 7');
    }

  // Loadstart event
  // Requirements:
  // * A loadstart event occurs when content is resuming
  } else if (event.type === 'loadstart') {

    if (this.ads.isInAdMode()) {
      if (this.ads.isContentResuming()) {

        // Loadstart needs to be unprefixed when src is changed in content-resuming
        // after postroll so that contentupdate is triggered.
        // This does not happen during normal circumstances. I wasn't able to reproduce
        // it, but the working theory is that it handles cases where restoring the
        // snapshot takes a long time, such as in iOS7 and older Firefox.
        if (this.ads.snapshot &&
            this.currentSrc() !== this.ads.snapshot.currentSrc) {
          return;
        }

        // Business as usual
        prefixEvent(this, 'content', event);
      } else {

        // Business as usual
        prefixEvent(this, 'ad', event);
      }
    }

  // Play event
  // Requirements:
  // * Play events are not prefixed because they are needed for cancelContentPlay to work
  } else if (event.type === 'play') {
    return;

  // Standard handling for all other events
  } else if (this.ads.isInAdMode()) {
    if (this.ads.isContentResuming()) {
      prefixEvent(this, 'content', event);
    } else {
      prefixEvent(this, 'ad', event);
    }
  }

}

/*

// Handle a player event, either by redispatching it with a prefix, or by
// letting it go on its way without any meddling.
export default function redispatch(event) {

  videojs.log('MARKER 0');

  // We do a quick play/pause before we check for prerolls. This creates a "playing"
  // event. This conditional block prefixes that event so it's "adplaying" if it
  // happens while we're in the "preroll?" state. Not every browser is in the
  // "preroll?" state for this event, so the following browsers come through here:
  //  * iPad
  //  * iPhone
  //  * Android
  //  * Safari
  // This is too soon to check videoElementRecycled because there is no snapshot
  // yet. We rely on the coincidence that all browsers for which
  // videoElementRecycled would be true also happen to send their initial playing
  // event during "preroll?"
  if (event.type === 'playing' && this.ads.state === 'preroll?') {
    videojs.log('MARKER 1');
    prefixEvent(this, 'ad', event);

  // Here we send "adplaying" for browsers that send their initial "playing" event
  // (caused by the the initial play/pause) during the "ad-playback" state.
  // The following browsers come through here:
  // * Chrome
  // * IE11
  // If the ad plays in the content tech (aka videoElementRecycled) there will be
  // another playing event when the ad starts. We check videoElementRecycled to
  // avoid a second adplaying event. Thankfully, at this point a snapshot exists
  // so we can safely check videoElementRecycled.
  } else if (event.type === 'playing' &&
      this.ads.state === 'ad-playback' &&
      !this.ads.videoElementRecycled()) {
    videojs.log('MARKER 2');
    prefixEvent(this, 'ad', event);

  // If the ad takes a long time to load, "playing" caused by play/pause can happen
  // during "ads-ready?" instead of "preroll?" or "ad-playback", skipping the
  // other conditions that would normally catch it
  } else if (event.type === 'playing' && this.ads.state === 'ads-ready?') {
    videojs.log('MARKER 3');
    prefixEvent(this, 'ad', event);

  // When an ad is playing in content tech, we would normally prefix
  // "playing" with "ad" to send "adplaying". However, when we did a play/pause
  // before the preroll, we already sent "adplaying". This condition prevents us
  // from sending another.
  } else if (event.type === 'playing' &&
      this.ads.state === 'ad-playback' &&
      this.ads.videoElementRecycled()) {
    videojs.log('MARKER 4');
    cancelEvent(this, event);
    return;

  // When ad is playing in content tech, prefix everything with "ad".
  // This block catches many events such as emptied, play, timeupdate, and ended.
  } else if (this.ads.state === 'ad-playback') {
    videojs.log('MARKER 5');
    if (this.ads.videoElementRecycled() || this.ads.stitchedAds()) {
      prefixEvent(this, 'ad', event);
    }

  // Send contentended if ended happens during content.
  // We will make sure an ended event is sent after postrolls.
  } else if (this.ads.state === 'content-playback' && event.type === 'ended') {
    videojs.log('MARKER 6');
    prefixEvent(this, 'content', event);

  // Event prefixing during content resuming is complicated
  } else if (this.ads.state === 'content-resuming') {
    videojs.log('MARKER 7');

    // This does not happen during normal circumstances. I wasn't able to reproduce
    // it, but the working theory is that it handles cases where restoring the
    // snapshot takes a long time, such as in iOS7 and older Firefox.
    if (this.ads.snapshot &&
        this.currentSrc() !== this.ads.snapshot.currentSrc) {
      videojs.log('MARKER 8');

      // Don't prefix `loadstart` event
      if (event.type === 'loadstart') {
        videojs.log('MARKER 10');
        return;
      }

      // All other events get "content" prefix
      return prefixEvent(this, 'content', event);

    // Content resuming after postroll
    } else if (this.ads.snapshot && this.ads.snapshot.ended) {
      videojs.log('MARKER 9');

      // Don't prefix `pause` and `ended` events
      // They don't always happen during content-resuming, but they might.
      // It seems to happen most often on iOS and Android.
      if ((event.type === 'pause' ||
          event.type === 'ended')) {
        videojs.log('MARKER 11');
        return;
      }

      videojs.log('MARKER 12');
      // All other events get "content" prefix
      return prefixEvent(this, 'content', event);

    }

    // Content resuming after preroll or midroll
    // Events besides "playing" get "content" prefix
    if (event.type !== 'playing') {
      videojs.log('MARKER 13 ' + event.type);
      prefixEvent(this, 'content', event);
    }

  }

  videojs.log('MARKER 14');
}
*/
