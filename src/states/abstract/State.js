export default class State {

  constructor(player) {
    this.player = player;
    this.name = 'Unknown';
  }

  onPlay() {}

  onAdsReady() {}

  onReadyForPreroll() {}

  isAdState() {}

  /*
   * Invoke event handler methods when events come in.
   */
  handleEvent(type) {
    if (type === 'play') {
      this.onPlay();
    } else if (type === 'adsready') {
      this.onAdsReady();
    }
  }

}
