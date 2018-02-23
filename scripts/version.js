const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');
const semver = require('semver');
const pkg = require('../package.json');

/* eslint no-console: 0 */

process.chdir(path.resolve(__dirname, '..'));

const commands = [];

if (!semver.prerelease(pkg.version)) {
  commands.push('conventional-changelog -p videojs -i CHANGELOG.md -s');
  commands.push('git add CHANGELOG.md');
}

if (commands.length) {
  exec(commands.join(' && '), (err, stdout, stderr) => {
    if (err) {
      process.stdout.write(err.stack);
      process.exit(err.status || 1);
    } else {
      process.stdout.write(stdout);
    }
  });
}
