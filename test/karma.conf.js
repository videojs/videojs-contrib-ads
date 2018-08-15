module.exports = function(config) {
  var detectBrowsers = {
    enabled: false,
    usePhantomJS: false,
    postDetection: function(browsers) {
      const toKeep = ['Firefox', 'Chrome'];
      const filteredBrowsers = [];

      browsers.forEach((e) => {
        if (e === 'Chrome') {
          filteredBrowsers.push('autoplayDisabledChrome');
        } else if (toKeep.indexOf(e) !== -1) {
          filteredBrowsers.push(e);
        }
      });

      return filteredBrowsers;
    }
  };

  // On Travis CI, we can only run in Firefox and Chrome; so, enforce that.
  if (process.env.TRAVIS) {
    config.browsers = ['Firefox', 'travisChrome'];
  }

  // If no browsers are specified, we enable `karma-detect-browsers`
  // this will detect all browsers that are available for testing
  if (!config.browsers.length) {
    detectBrowsers.enabled = true;
  }

  config.set({
    basePath: '..',
    frameworks: ['qunit', 'detectBrowsers'],
    files: [
      'node_modules/video.js/dist/video-js.css',
      'node_modules/lodash/lodash.js',
      'node_modules/es5-shim/es5-shim.js',
      'node_modules/sinon/pkg/sinon.js',
      'node_modules/video.js/dist/video.js',
      {pattern: 'dist/videojs-contrib-ads.js', nocache: true},
      {pattern: 'dist/videojs-contrib-ads.css', nocache: true},
      {pattern: 'test/integration/lib/shared-module-hooks.js', nocache: true},
      {pattern: 'test/dist/bundle.js', nocache: true},

      // Test Data
      {pattern: 'test/integration/lib/inventory.json', included: false, served: true},
      {pattern: 'examples/basic-ad-plugin/superclip-low.webm', included: false, served: true},
      {pattern: 'test/integration/lib/testcaption.vtt', included: false, served: true}
    ],
    customLaunchers: {
      travisChrome: {
        base: 'Chrome',
        flags: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required']
      },
      autoplayDisabledChrome: {
        base: 'Chrome',
        flags: ['--autoplay-policy=no-user-gesture-required']
      }
    },
    detectBrowsers: detectBrowsers,
    reporters: ['dots'],
    port: 9876,
    colors: true,
    autoWatch: false,
    singleRun: true,
    concurrency: 1,
    browserNoActivityTimeout: 300000,
    client: {
      qunit: {
        testTimeout: 15000
      }
    }
  });
};
