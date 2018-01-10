import videojs from 'video.js';

import {ContentState, BeforePreroll, Preroll, Midroll, Postroll} from './RenameMe.js';

export default class ContentPlayback extends ContentState {

  constructor(player) {
    super(player);
    this.name = 'ContentPlayback';

    videojs.log('Now in ' + this.name + ' state');

    // Cleanup for cancelContentPlay
    if (player.ads.cancelPlayTimeout) {
      player.clearTimeout(player.ads.cancelPlayTimeout);
      player.ads.cancelPlayTimeout = null;
    }

    // The contentplayback event was removed because integrations should use the
    // "playing" event instead. However, we found out some 3rd party code relied
    // on this event, so we've temporarily added it back in to give people more
    // time to update their code.
    player.trigger({
      type: 'contentplayback',
      triggerevent: player.ads.triggerevent
    });

    // Play the content if cancelContentPlay happened and we haven't played yet.
    // This happens if there was no preroll or if it errored, timed out, etc.
    // Otherwise snapshot restore would play.
    if (player.ads._cancelledPlay) {
      if (player.paused()) {
        player.play();
      }
    }
  }

  /*
   * In the case of a timeout, adsready might come in late. This assumes the behavior
   * that if an ad times out, it could still interrupt the content and start playing.
   * An integration could behave otherwise by ignoring this event.
   */
  onAdsReady() {
    videojs.log('Received adsready event');
    videojs.log('Triggered readyforpreroll event');
    this.player.trigger('readyforpreroll');
  }

  onContentUpdate() {
    const player = this.player;

    if (player.paused()) {
      player.ads.stateInstance = new BeforePreroll(player);
    } else {
      player.ads.stateInstance = new Preroll(player, false);
    }
  }

  onContentEnded() {
    const player = this.player;

    videojs.log('Received contentended event');

    // If _contentHasEnded is false it means we need to check for postrolls.
    if (!player.ads._contentHasEnded) {
      player.ads._contentEnding = false;
      player.ads._contentHasEnded = true;
      player.ads.stateInstance = new Postroll(player);

    // If _contentHasEnded is true it means we already checked for postrolls and
    // played postrolls if needed, so now we're ready to send an ended event.
    } else {
      // TODO make sure this is redispatched correctly
      // Old comment:
      // Causes ended event to trigger in content-resuming.enter.
      // From there, the ended event event is not redispatched.
      // Then we end up back in content-playback state.
      videojs.log('Triggered ended event: ContentPlayback.onContentEnded');
      player.trigger('ended');
    }

  }

  startLinearAdMode() {
    const player = this.player;

    player.ads.stateInstance = new Midroll(player);
    player.ads.stateInstance.startLinearAdMode();
  }

}
