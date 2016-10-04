/*
The goal of this feature is to make player events work as an integrator would
expect despite the presense of ads. For example, an integrator would expect
an `ended` event to happen once the content is ended. If an `ended` event is sent
as a result of an ad ending, that is a bug. The `redispatch` method should recognize
such `ended` events and prefix them so they are sent as `adended`, and so on with
all other player events.
*/

import videojs from 'video.js';

let player;

// Stop propogation for an event, then send a new event with the type of the original
// event with the given prefix added.
const prefixEvent = (prefix, event) => {
  // Pretend we called stopImmediatePropagation because we want the native
  // element events to continue propagating
  event.isImmediatePropagationStopped = function() {
    return true;
  };
  event.cancelBubble = true;
  event.isPropagationStopped = function() {
    return true;
  };
  player.trigger({
    type: prefix + event.type,
    state: player.ads.state,
    originalEvent: event
  });
}

// Handle a player event, either by redispatching it with a prefix, or by
// letting it go on its way without any meddling.
const redispatch = function(event) {

  player = this;

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
  if (event.type === 'playing' && player.ads.state === 'preroll?') {
    prefixEvent('ad', event);

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
      player.ads.state === 'ad-playback' &&
      !player.ads.videoElementRecycled()) {
    prefixEvent('ad', event);

  // If the ad takes a long time to load, "playing" caused by play/pause can happen
  // during "ads-ready?" instead of "preroll?" or "ad-playback", skipping the
  // other conditions that would normally catch it
  } else if (event.type === 'playing' && player.ads.state === 'ads-ready?') {
    prefixEvent('ad', event);

  // When an ad is playing in content tech, we would normally prefix
  // "playing" with "ad" to send "adplaying". However, when we did a play/pause
  // before the preroll, we already sent "adplaying". This condition prevents us
  // from sending another.
  } else if (event.type === 'playing' &&
      player.ads.state === 'ad-playback' &&
      player.ads.videoElementRecycled()) {

    // Triggering an event prevents the unprefixed one from firing.
    // "adcontentplaying" is only seen in this very specific condition.
    prefixEvent('adcontent', event);
    return;

  // When ad is playing in content tech, prefix everything with "ad".
  // This block catches many events such as emptied, play, timeupdate, and ended.
  } else if (player.ads.state === 'ad-playback') {
    if (player.ads.videoElementRecycled() || player.ads.stitchedAds()) {
      prefixEvent('ad', event);
    }

  // Send contentended if ended happens during content.
  // We will make sure an ended event is sent after postrolls.
  } else if (player.ads.state === 'content-playback' && event.type === 'ended') {
    prefixEvent('content', event);

  // Event prefixing during content resuming is complicated
  } else if (player.ads.state === 'content-resuming') {

    // This does not happen during normal circumstances. I wasn't able to reproduce
    // it, but the working theory is that it handles cases where restoring the
    // snapshot takes a long time, such as in iOS7 and older Firefox.
    if (player.ads.snapshot &&
        player.currentSrc() !== player.ads.snapshot.currentSrc) {

      // Don't prefix `loadstart` event
      if (event.type === 'loadstart') {
        return;
      }

      // All other events get "content" prefix
      return prefixEvent('content', event);

    // Content resuming after postroll
    } else if (player.ads.snapshot && player.ads.snapshot.ended) {

      // Don't prefix `pause` and `ended` events
      // They don't always happen during content-resuming, but they might.
      // It seems to happen most often on iOS and Android.
      if ((event.type === 'pause' ||
          event.type === 'ended')) {
        return;
      }

      // All other events get "content" prefix
      return prefixEvent('content', event);

    }

    // Content resuming after preroll or midroll
    // Events besides "playing" get "content" prefix
    if (event.type !== 'playing') {
      prefixEvent('content', event);
    }

  }
}

module.exports = redispatch;
