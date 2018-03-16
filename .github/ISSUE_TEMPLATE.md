Welcome to videojs-contrib-ads and thank you for contributing to the project! Below is a template for filing issues that will help us diagnose problems and recommend solutions.

### Description

Include a short description of the problem you are seeing here.

### Steps to Reproduce

Include step-by-step instructions on how to reproduce the issue:

* First step

#### Expected Results

Describe the behavior you expected here.

#### Actual Results

Describe the behavior you observed here.

### Reproducing Unit Test

Please include a unit test that fails in the most recent version of videojs-contrib-ads but should pass according to your expected results. This will help us understand what the root cause is and separate integration bugs from issues with this project. A unit test can be provided like below:

```js
import QUnit from 'qunit';
import {Midroll} from '../../../src/states.js';
import adBreak from '../../../src/adBreak.js';

QUnit.test('starts an ad break on init', function(assert) {
  this.midroll = new Midroll(this.player);
    
  this.midroll.init(this.player);
  assert.equal(this.player.ads.adType, 'midroll', 'ad type is midroll');
  assert.equal(this.adBreakStartStub.callCount, 1, 'ad break started');
});
```

This example was pulled from [test/states/test.Midroll.js](../test/states/test.Midroll.js).

### Versions

**videojs-contrib-ads version**: the version of this plugin that you are using.

**Video-js version**: the version of videojs you are using. If you are using npm, you can check this by running `npm ls video.js --depth=0` in your project.

**Other plugins**: please list other plugins that may affect videojs-contrib-ads behavior, especially ad integration plugins.

### Platforms

**Browsers**: eg. Chrome v56

**OS/Devices**: eg. Windows 10
