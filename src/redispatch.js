/*
The goal of this feature is to make player events work as an integrator would
expect despite the presense of ads. For example, an integrator would expect
an `ended` event to happen once the content is ended. If an `ended` event is sent
as a result of a preroll ending, that is a bug. The `redispatch` method should recognize
such `ended` events and prefix them so they are sent as `adended`, and so on with
all other player events.
*/

// Cancel an event.
// Video.js wraps native events. This technique stops propagation for the Video.js event
// (AKA player event or wrapper event) while native events continue propagating.
const cancelEvent = (player, event) => {
  event.isImmediatePropagationStopped = function() {
    return true;
  };
  event.cancelBubble = true;
  event.isPropagationStopped = function() {
    return true;
  };
};

// Redispatch an event with a prefix.
// Cancels the event, then sends a new event with the type of the original
// event with the given prefix added.
// The inclusion of the "state" property should be removed in a future
// major version update with instructions to migrate any code that relies on it.
// It is an implementation detail and relying on it creates fragility.
const prefixEvent = (player, prefix, event) => {
  cancelEvent(player, event);
  player.trigger({
    type: prefix + event.type,
    state: player.ads.state,
    originalEvent: event
  });
};

// Playing event
// Requirements:
// * Normal playing event when there is no preroll
// * No playing event before preroll
// * At least one playing event after preroll
// * A single adplaying event when an ad begins
const handlePlaying = (player, event) => {
  if (player.ads.isInAdMode()) {

    if (player.ads.isContentResuming()) {

      // Prefix playing event when switching back to content after postroll.
      if (player.ads._contentEnding) {
        prefixEvent(player, 'content', event);
      }

    // adplaying was already sent due to cancelContentPlay. Avoid sending another.
    } else if (player.ads._cancelledPlay) {
      cancelEvent(player, event);

    // Prefix all other playing events during ads.
    } else {
      prefixEvent(player, 'ad', event);
    }
  }
};

// Ended event
// Requirements:
// * A single ended event when there is no postroll
// * No ended event before postroll
// * A single ended event after postroll
const handleEnded = (player, event) => {
  if (player.ads.isInAdMode()) {
    if (player.ads.isContentResuming()) {

      // The final and true ended event
      if (player.ads._contentHasEnded) {
        return;
      }

      // Prefix ended during content resuming
      prefixEvent(player, 'content', event);

    } else {

      // Prefix ended due to ad ending.
      prefixEvent(player, 'ad', event);
    }
  } else {

    // Prefix ended due to content ending.
    prefixEvent(player, 'content', event);
  }
};

// Loadstart event
// Requirements:
// * Initial content loadstart is not prefixed
// * Loadstart due to snapshot restore is prefixed
// * Loadstart due to ad loading is prefixed
// * Loadstart due to content source change is not prefixed
const handleLoadStart = (player, event) => {

  // Don't prefix first loadstart event. The timing for this one can vary wildly.
  if (player.ads._dontPrefixNextLoadstart) {
    player.ads._dontPrefixNextLoadstart = false;

  // Ad mode
  } else if (player.ads.isInAdMode()) {
    if (player.ads.isContentResuming()) {

      // Loadstart due to content source change is unprefixed
      if (player.currentSrc() !== player.ads.contentSrc) {
        return;
      }

      // Loadstart due to snapshot restore
      prefixEvent(player, 'content', event);

    } else if (player.ads.isAdPlaying()) {

      // Loadstart for ad
      prefixEvent(player, 'ad', event);

    }
  }
};

// Play event
// Requirements:
// * Play events have the "ad" prefix when an ad is playing
// * Play events have the "content" prefix when content is resuming
// Play requests are unique because they represent user intention to play. They happen
// because the user clicked play, or someone called player.play(), etc. It could happen
// multiple times during ad loading, regardless of where we are in the process. With our
// current architecture, this will always cause the content to play. Therefor, contrib-ads
// must always cancelContentPlay if there is any possible chance the play caused the
// content to play, even if we are technically in ad mode. In order for that to happen,
// play events need to be unprefixed until the last possible moment. A better solution
// would be to have a way to intercept play events rather than "cancel" them by pausing
// after each one. To be continued...
const handlePlay = (player, event) => {
  if (player.ads.isAdPlaying()) {
    prefixEvent(player, 'ad', event);
  } else if (player.ads.isContentResuming()) {
    prefixEvent(player, 'content', event);
  }
};

// Handle a player event, either by redispatching it with a prefix, or by
// letting it go on its way without any meddling.
export default function redispatch(event) {

  // Events with special treatment
  if (event.type === 'playing') {
    handlePlaying(this, event);
  } else if (event.type === 'ended') {
    handleEnded(this, event);
  } else if (event.type === 'loadstart') {
    handleLoadStart(this, event);
  } else if (event.type === 'play') {
    handlePlay(this, event);

  // Standard handling for all other events
  } else if (this.ads.isInAdMode()) {
    if (this.ads.isContentResuming()) {

      // Event came from snapshot restore after an ad, use "content" prefix
      prefixEvent(this, 'content', event);
    } else {

      // Event came from ad playback, use "ad" prefix
      prefixEvent(this, 'ad', event);
    }
  }

}
