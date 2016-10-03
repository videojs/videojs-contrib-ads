module.exports = function(config) {
  var detectBrowsers = {
    enabled: false,
    usePhantomJS: false
  };

  // Travis needs to run them in Firefox.
  // Additionally, the tests don't pass in Safari.
  config.browsers = ['Firefox'];

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
