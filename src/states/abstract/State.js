export default class State {

  constructor(player) {
    this.player = player;
    this.name = 'Unknown';
  }

  /*
   * Event handlers. Different states can override these to provide behaviors.
   */
  onPlay() {}
  onAdsReady() {}
  onAdsError() {}
  onAdSkip() {}
  onAdsCanceled() {}

  /*
   * Method handlers. Different states can override these to provide behaviors.
   */
  skipLinearAdMode() {}

  /*
   * Overridden by ContentState and AdState. Should not be overriden elsewhere.
   */
  isAdState() {}

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
    } else if (type === 'adskip') {
      this.onAdSkip();
    } else if (type === 'adscanceled') {
      this.onAdsCanceled();
    }
  }

}
