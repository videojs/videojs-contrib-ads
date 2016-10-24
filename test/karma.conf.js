module.exports = function(config) {
  var
    plugins = [],
    detectBrowsers = {
      enabled: false,
      usePhantomJS: false
    },
    addBrowserLauncher = function(browser) {
      plugins.push('karma-' + browser.toLowerCase() + '-launcher');
    };

  if (process.env.TRAVIS) {
    // Travis needs to run them in Firefox.
    // Additionally, the tests don't pass in Safari.
    config.browsers = ['Firefox'];

  } else {
    // If no browsers are specified, we enable `karma-detect-browsers`
    // This detects all browsers available for testing
    plugins.push('karma-detect-browsers');
    config.browsers = ['chrome', 'firefox', 'ie'];

    detectBrowsers.enabled = true;
    detectBrowsers.postDetection = function(browsers) {
      var i = browsers.indexOf('Safari');
      if (i !== -1) {
        browsers.splice(i, 1);
      }

      return browsers;
    };

    config.browsers.forEach(addBrowserLauncher);
    plugins.push('karma-qunit');
    config.plugins = plugins;
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
      'test/dist/bundle.js'
    ],

    detectBrowsers: detectBrowsers,
    reporters: ['dots'],
    port: 9876,
    colors: true,
    autoWatch: false,
    singleRun: true,
    concurrency: Infinity
  });
};
