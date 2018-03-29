import videojs from 'video.js';

export default class State {

  static _getName() {
    return 'Anonymous State';
  }

  constructor(player) {
    this.player = player;
  }

  /*
   * This is the only allowed way to perform state transitions. State transitions usually
   * happen in player event handlers. They can also happen recursively in `init`. They
   * should _not_ happen in `cleanup`.
   */
  transitionTo(NewState, ...args) {
    const player = this.player;
    const previousState = this;

    previousState.cleanup(player);
    const newState = new NewState(player);

    player.ads._state = newState;
    player.ads.debug(previousState.constructor._getName() + ' -> ' +
      newState.constructor._getName());
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
    videojs.log.warn('Unexpected adsready event');
  }
  onAdsError() {}
  onAdsCanceled() {}
  onAdTimeout() {}
  onAdStarted() {}
  onContentChanged() {}
  onContentResumed() {}
  onContentEnded() {
    videojs.log.warn('Unexpected contentended event');
  }
  onNoPreroll() {}
  onNoPostroll() {}

  /*
   * Method handlers. Different states can override these to provide behaviors.
   */
  startLinearAdMode() {
    videojs.log.warn('Unexpected startLinearAdMode invocation ' +
      '(State via ' + this.constructor._getName() + ')');
  }
  endLinearAdMode() {
    videojs.log.warn('Unexpected endLinearAdMode invocation ' +
      '(State via ' + this.constructor._getName() + ')');
  }
  skipLinearAdMode() {
    videojs.log.warn('Unexpected skipLinearAdMode invocation ' +
      '(State via ' + this.constructor._getName() + ')');
  }

  /*
   * Overridden by ContentState and AdState. Should not be overriden elsewhere.
   */
  isAdState() {
    throw new Error('isAdState unimplemented for ' + this.constructor._getName());
  }

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
    const player = this.player;

    if (type === 'play') {
      this.onPlay(player);
    } else if (type === 'adsready') {
      this.onAdsReady(player);
    } else if (type === 'adserror') {
      this.onAdsError(player);
    } else if (type === 'adscanceled') {
      this.onAdsCanceled(player);
    } else if (type === 'adtimeout') {
      this.onAdTimeout(player);
    } else if (type === 'ads-ad-started') {
      this.onAdStarted(player);
    } else if (type === 'contentchanged') {
      this.onContentChanged(player);
    } else if (type === 'contentresumed') {
      this.onContentResumed(player);
    } else if (type === 'contentended') {
      this.onContentEnded(player);
    } else if (type === 'playing') {
      this.onPlaying(player);
    } else if (type === 'ended') {
      this.onEnded(player);
    } else if (type === 'nopreroll') {
      this.onNoPreroll(player);
    } else if (type === 'nopostroll') {
      this.onNoPostroll(player);
    }
  }

}
