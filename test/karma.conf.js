module.exports = function(config) {
  var detectBrowsers = {
    enabled: false,
    usePhantomJS: false,
    postDetection: function(browsers) {
      var i = browsers.indexOf('Safari');

      if (i !== -1) {
        browsers.splice(i, 1);
      }

      return browsers;
    }
  };

  // On Travis CI, we can only run in Firefox.
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
      'node_modules/lodash/index.js',
      'node_modules/sinon/pkg/sinon.js',
      'node_modules/sinon/pkg/sinon-ie.js',
      'node_modules/video.js/dist/video.js',
      'node_modules/video.js/dist/video-js.css',
      'dist/videojs.ads.js',
      'dist/videojs.ads.css',
      'test/shared-module-hooks.js',
      'test/dist/bundle.js',

      // Test Data
      {pattern: 'test/inventory.json', included: false, served: true},
      {pattern: 'example/superclip-low.mp4', included: false, served: true}
    ],
    customLaunchers: {
      travisChrome: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },
    detectBrowsers: detectBrowsers,
    reporters: ['dots'],
    port: 9876,
    colors: true,
    autoWatch: false,
    singleRun: true,
    concurrency: Infinity
  });
};

