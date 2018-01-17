import {State, BeforePreroll, Preroll} from '../RenameMe.js';

export default class ContentState extends State {

  constructor(player) {
    super(player);
  }

  isAdState() {
    return false;
  }

  onContentUpdate() {
    const player = this.player;

    if (player.paused()) {
      player.ads.stateInstance = new BeforePreroll(player);
    } else {
      player.ads.stateInstance = new Preroll(player, false);
    }
  }

}
