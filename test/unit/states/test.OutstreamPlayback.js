import QUnit from 'qunit';
import sinon from 'sinon';
import OutstreamPlayback from '../../../src/states/OutstreamPlayback.js';
import adBreak from '../../../src/adBreak.js';

/*
 * These tests are intended to be isolated unit tests for one state with all
 * other modules mocked.
 */
QUnit.module('OutstreamPlayback', {
  beforeEach() {
    this.player = {
      addClass: () => {},
      removeClass: () => {},
      trigger: sinon.spy(),
      ads: {
        _inLinearAdMode: true,
        debug: () => {}
      }
    };

    this.adroll = new OutstreamPlayback(this.player);

    this.adBreakStartStub = sinon.stub(adBreak, 'start');
    this.adBreakEndStub = sinon.stub(adBreak, 'end');
  },

  afterEach() {
    this.adBreakStartStub.restore();
    this.adBreakEndStub.restore();
  }
});
// transitions to outstream done after endlinearadmode??s
