import videojs from 'video.js';

export default class State {

  constructor(player) {
    this.player = player;
    this.name = 'Unknown';
  }

  /*
   * This is the only allowed way to perform state transitions.
   */
  transitionTo(NewState, ...args) {

    // We guarantee that cleanup is always called when leaving a state.
    this.cleanup();

    const stateBeforeConstructor = this.player.ads.stateInstance;

    const newState = new NewState(this.player, ...args);

    if (this.player.ads.stateInstance !== stateBeforeConstructor) {
      // This means the state was changed again by the constructor. We shouldn't
      // set the state because we've already moved on.
      return;
    }

    this.player.ads.stateInstance = newState;
  }

  /*
   * Implemented by subclasses to provide cleanup logic when transitioning
   * to a new state.
   */
  cleanup() {}

  /*
   * Default event handlers. Different states can override these to provide behaviors.
   */
  onPlay() {}
  onPlaying() {}
  onEnded() {}
  onAdsReady() {
    videojs.log('Unexpected adsready event');
  }
  onAdsError() {}
  onAdsCanceled() {}
  onAdTimeout() {}
  onAdStarted() {}
  onContentUpdate() {}
  onContentResumed() {}
  onContentEnded() {
    videojs.log('Unexpected contentended event');
  }
  onNoPreroll() {}
  onNoPostroll() {}

  /*
   * Method handlers. Different states can override these to provide behaviors.
   */
  startLinearAdMode() {
    videojs.log('Unexpected startLinearAdMode invocation');
  }
  endLinearAdMode() {
    videojs.log('Unexpected endLinearAdMode invocation');
  }
  skipLinearAdMode() {
    videojs.log('Unexpected skipLinearAdMode invocation');
  }

  /*
   * Overridden by ContentState and AdState. Should not be overriden elsewhere.
   */
  isAdState() {}

  /*
   * Overridden by PrerollState, MidrollState, and PostrollState.
   */
  isContentResuming() {
    return false;
  }

  inAdBreak() {
    return false;
  }

  /*
   * Invoke event handler methods when events come in.
   */
  handleEvent(type) {
    if (type === 'play') {
      this.onPlay();
    } else if (type === 'adsready') {
      this.onAdsReady();
    } else if (type === 'adserror') {
      this.onAdsError();
    } else if (type === 'adscanceled') {
      this.onAdsCanceled();
    } else if (type === 'adtimeout') {
      this.onAdTimeout();
    } else if (type === 'ads-ad-started') {
      this.onAdStarted();
    } else if (type === 'contentupdate') {
      this.onContentUpdate();
    } else if (type === 'contentresumed') {
      this.onContentResumed();
    } else if (type === 'contentended') {
      this.onContentEnded();
    } else if (type === 'playing') {
      this.onPlaying();
    } else if (type === 'ended') {
      this.onEnded();
    } else if (type === 'nopreroll') {
      this.onNoPreroll();
    } else if (type === 'nopostroll') {
      this.onNoPostroll();
    }
  }

}
