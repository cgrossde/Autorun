/*eslint-env node, mocha */
'use strict';
var os = require('os');
var expect = require('expect');
var Autorun = require('../index');
var autorun;

describe('Test autorun', function() {
  // Setup depending on OS
  before(function() {
    // WIN ?
    if (os.platform().indexOf('win') === 0) {
      autorun = new Autorun('TestApp', 'C:/AutorunTest.test');
    }
    else {
      autorun = new Autorun('TestApp', '/tmp');
    }
  });

  it('isSet() should not return an error if platform is supported', function() {
    if (autorun.isPlatformSupported()) {
      autorun.isSet(function(err) {
        expect(err).toBe(null);
      });
    }
  });

  it('enable() should not return an error if platform is supported', function() {
    if (autorun.isPlatformSupported()) {
      autorun.enable(function(err) {
        expect(err).toBe(null);
      });
    }
  });

  it('disable() should not return an error if platform is supported', function() {
    if (autorun.isPlatformSupported()) {
      autorun.disable(function(err) {
        expect(err).toBe(null);
      });
    }
  });

  it('after enable(), isSet() should return true', function() {
    if (autorun.isPlatformSupported()) {
      autorun.enable(function(err) {
        expect(err).toBe(null);
        autorun.isSet(function(err, res) {
          expect(err).toBe(null);
          expect(res).toBe(true);
        });
      });
    }
  });

  it('after disable(), isSet() should return false', function() {
    if (autorun.isPlatformSupported()) {
      autorun.enable(function(err) {
        expect(err).toBe(null);
        autorun.isSet(function(err, res) {
          expect(err).toBe(null);
          expect(res).toBe(false);
        });
      });
    }
  });
});
