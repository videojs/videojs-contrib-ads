import videojs from 'video.js';

export default class State {

  constructor(player) {
    this.player = player;
  }

  /*
   * This is the only allowed way to perform state transitions. State transitions usually
   * happen in player event handlers. They can also happen recursively in `init`.
   */
  transitionTo(NewState, ...args) {
    const player = this.player;
    const previousState = this;

    previousState.cleanup();
    const newState = new NewState(player, ...args);
    
    player.ads.stateInstance = newState;
    videojs.log(previousState.constructor.name + ' -> ' + newState.constructor.name);
    newState.init(player, ...args);
  }

  /*
   * Implemented by subclasses to provide initialization logic when transitioning
   * to a new state.
   */
  init() {}

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
    videojs.log('Unexpected startLinearAdMode invocation (State)');
  }
  endLinearAdMode() {
    videojs.log('Unexpected endLinearAdMode invocation (State)');
  }
  skipLinearAdMode() {
    videojs.log('Unexpected skipLinearAdMode invocation (State)');
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
