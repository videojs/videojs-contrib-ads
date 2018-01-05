import ContentState from './abstract/ContentState.js';

export default class ContentPlayback extends ContentState {

  constructor(player) {
    super(player);
    this.name = 'ContentPlayback';
  }

}
