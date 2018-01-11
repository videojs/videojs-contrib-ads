module.exports = function(config) {
  var detectBrowsers = {
    enabled: false,
    usePhantomJS: false,
    postDetection: function(browsers) {
      const toRemove = ['Safari', 'SafariTechPreview'];
      return browsers.filter((e) => {
        return toRemove.indexOf(e) === -1;
      });
    }
  };

  // On Travis CI, we can only run in Firefox and Chrome; so, enforce that.
  if (process.env.TRAVIS) {
    config.browsers = ['Firefox', 'travisChrome'];
  } else {
    config.browsers = ['Firefox', 'Chrome'];
  }

  // If no browsers are specified, we enable `karma-detect-browsers`
  // this will detect all browsers that are available for testing
  if (!config.browsers.length) {
    detectBrowsers.enabled = true;
  }

  config.set({
    basePath: '..',
    frameworks: ['qunit'],
    files: [
      'node_modules/video.js/dist/video-js.css',
      'node_modules/lodash/lodash.js',
      'node_modules/es5-shim/es5-shim.js',
      'node_modules/sinon/pkg/sinon.js',
      'node_modules/video.js/dist/video.js',
      'dist/videojs-contrib-ads.js',
      'dist/videojs-contrib-ads.css',
      'test/shared-module-hooks.js',
      'test/dist/bundle.js',

      // Test Data
      {pattern: 'test/inventory.json', included: false, served: true},
      {pattern: 'example/superclip-low.webm', included: false, served: true}
    ],
    customLaunchers: {
      travisChrome: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },
    reporters: ['dots'],
    port: 9876,
    colors: true,
    autoWatch: false,
    singleRun: true,
    concurrency: 1,
    browserNoActivityTimeout: 300000,
    client: {
      qunit: {
        testTimeout: 10000
      }
    }
  });
};
