import videojs from 'video.js';

export default class State {

  constructor(player) {
    this.player = player;
  }

  /*
   * This is the only allowed way to perform state transitions.
   *
   * State transitions usually happen in player event handlers.
   *
   * State transitions can also be caused by state constructors. As a result, we'll
   * see a multi-state jump. This is logged out all as one message, in this format:
   * "StateOne -> StateTwo -> StateThree". In this case the sequence of invocations
   * will look like this:
   *
   * * transitionTo(StateTwo)
   * * cleanup StateOne
   * * constructor StateTwo
   *   * transitionTo(StateThree)
   *   * cleanup StateTwo
   *   * constructor StateThree
   *   * update `player.ads.stateInstance`
   *   * log message for multi-step transition
   */
  transitionTo(NewState, ...args) {
    const player = this.player;

    // Save transition steps for logging
    if (!player.ads._transition) {
      player.ads._transition = [player.ads.stateInstance.constructor.name, NewState.name];
    } else {
      player.ads._transition.push(NewState.name);
    }

    // We guarantee that cleanup is always called when leaving a state.
    this.cleanup();

    player.ads.stateInstance = new NewState(player, ...args);

    const stateBeforeInit = player.ads.stateInstance;

    // Only log the state transition once. Multi-step jumps are logged out in one line.
    if (player.ads.stateInstance === stateBeforeInit) {
      videojs.log(player.ads._transition.join(' -> '));
      player.ads._transition = null;
    }

    player.ads.stateInstance.init(player, ...args);

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
