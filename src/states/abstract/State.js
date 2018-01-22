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

    const stateBeforeConstructor = player.ads.stateInstance;

    const newState = new NewState(player, ...args);

    if (player.ads.stateInstance !== stateBeforeConstructor) {
      // This means that `transitionTo` was invoked by the constructor. We will let
      // the recursive call do the rest of the work so that `player.ads.stateInstance`
      // is only updated once, to the correct state.
      return;
    }

    player.ads.stateInstance = newState;

    // Log out transition. Multi-step jumps are logged out in one line.
    videojs.log(player.ads._transition.join(' -> '));
    player.ads._transition = null;
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
