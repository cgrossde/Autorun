/**
 * Module to test, enable and disable autostart of app
 *
 * Currently only windows and mac os supported.
 *
 * Attention: To get reliable results always set the same appName and
 * executablePath. The reason is that mac relies on executablePath to
 * identify the autostart item and windows on appName!
 *
 * Mac uses AppleScript: The only reliable way to identify a login
 * item is by it's executablePath. The property name will be ignored
 * on creation and instead AppleScript will set the name to the executable
 * name or the folder name depending on what was set in executablePath
 *
 * Windows uses the Registry to create or delete autostart items. Windows
 * will identify the login item by its appName
 */
'use strict';
var os = require('os');
var fs = require('fs');
var Promise = require('promise');
var registryPath = 'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';

function Autorun(appName, executablePath) {
	this.appName = appName || 'AutorunApp';
	this.executablePath = executablePath || _getPathToExecutable();
}

module.exports = Autorun;

Autorun.prototype.isPlatformSupported = function() {
	if (os.platform() === 'darwin') {
		return true;
	}
	else if (os.platform().indexOf('win') === 0) {
		return true;
	}
	else { // Not supported
		return false;
	}
};

Autorun.prototype.isSet = function(callback) {
	var self = this;
	return new Promise(function(resolve, reject) {
		if (os.platform() === 'darwin') {
			_macAppleScriptIsAutorunSet(self.executablePath).then(resolve, reject);
		}
		else if (os.platform().indexOf('win') === 0) {
			_winRegIsAutorunSet(self.appName).then(resolve, reject);
		}
		else { // Not supported
			var error = new Error('Your platform "' + os.platform() + '" is not supported');
			error.name = 'PlatformUnsupported';
			error.platform = os.platform();
			reject(error);
		}
	}).nodeify(callback);
};

Autorun.prototype.enable = function(callback) {
	var self = this;
	return new Promise(function(resolve, reject) {
		if (os.platform() === 'darwin') {
			_macAppleScriptAutorunEnable(self.executablePath).then(resolve, reject);
		}
		else if (os.platform().indexOf('win') === 0) {
			_winRegAutorunEnable(self.appName, self.executablePath).then(resolve, reject);
		}
		else { // Not supported
			var error = new Error('Your platform "' + os.platform() + '" is not supported');
			error.name = 'PlatformUnsupported';
			error.platform = os.platform();
			reject(error);
		}
	}).nodeify(callback);
};

Autorun.prototype.disable = function(callback) {
	var self = this;
	return new Promise(function(resolve, reject) {
		if (os.platform() === 'darwin') {
			_macAppleScriptAutorunDisable(self.executablePath).then(resolve, reject);
		}
		else if (os.platform().indexOf('win') === 0) {
			_winRegAutorunDisable(self.appName).then(resolve, reject);
		}
		else { // Not supported
			var error = new Error('Your platform "' + os.platform() + '" is not supported');
			error.name = 'PlatformUnsupported';
			error.platform = os.platform();
			reject(error);
		}
	}).nodeify(callback);
};

function _macAppleScriptAutorunEnable(executablePath) {
	return new Promise(function(resolve, reject) {
		// Check if executable exists (or it won't work)
		if (! fs.existsSync(executablePath)) {
			var error = new Error('Could not enable autorun. Path to executable invalid.');
			error.name = 'AutorunEnableFailed';
			error.platform = os.platform();
			reject(error);
			return;
		}
		var applescript = require('applescript');
		var script = 'tell application "System Events" to make login item at end' +
			' with properties {path:"' + executablePath + '",' +
			' hidden:false }';
		applescript.execString(script, function(err) {
			if (err) {
				var error = new Error('Could not enable autorun using AppleScript');
				error.name = 'AutorunEnableFailed';
				error.platform = os.platform();
				error.cause = err;
				reject(error);
			}
			else {
				resolve(true);
			}
		});
	});
}

function _macAppleScriptAutorunDisable(executablePath) {
	return new Promise(function(resolve, reject) {
		var applescript = require('applescript');
		var script = 'tell application "System Events"\n' +
			'set loginList to get the properties of every login item\n' +
			'repeat with loginItem in loginList\n' +
				'if path of loginItem is equal to "' + executablePath + '" then\n' +
					'set loginItemName to name of loginItem\n' +
					'delete login item loginItemName\n' +
					'return 1\n' +
				'end if\n' +
			'end repeat\n' +
			'return 0\n' +
		'end tell';
		applescript.execString(script, function(err, res) {
			if (err) {
				var error = new Error('Could not disable autorun using AppleScript');
				error.name = 'AutorunDisableFailed';
				error.platform = os.platform();
				error.cause = err;
				reject(error);
			}
			else if (res === 1) {
				resolve(true);
			}
			else {
				resolve(false);
			}
		});
	});
}

function _macAppleScriptIsAutorunSet(executablePath) {
	return new Promise(function(resolve, reject) {
		var applescript = require('applescript');
		var script = 'tell application "System Events"\n' +
			'set loginList to get the properties of every login item\n' +
			'repeat with loginItem in loginList\n' +
				'if path of loginItem is equal to "' + executablePath + '" then\n' +
					'return 1\n' +
				'end if\n' +
			'end repeat\n' +
			'return 0\n' +
		'end tell';
		applescript.execString(script, function(err, res) {
			if (err || res === undefined) {
				var error = new Error('Could not check if autostart was set using AppleScript');
				error.name = 'AutorunIsSetFailed';
				error.platform = os.platform();
				error.cause = err;
				reject(error);
			}
			else if (res === 1) {
				resolve(true);
			}
			else {
				resolve(false);
			}
		});
	});
}

// Helper function to execute and log out child process
var _spawnProcess = function(command, args, options, callback) {
	var spawn = require('child_process').spawn;
	var childProcess = spawn(command, args, options);
	var err = false;
	var text = '';
	var errText = '';

	childProcess.stdout.on('data', function(data) {
		text += data.toString();
	});

	childProcess.stderr.on('data', function(data) {
		err = true;
		errText += data.toString();
	});

	if (typeof callback === 'function') {
		childProcess.on('exit', function(exitCode) {
			if (err) {
				var error = new Error('ChildProcess failed');
				error.name = 'ChildProcessFailed';
				error.output = errText;
				error.cause = err;
				return callback(error, null);
			}
			else {
				return callback(null, exitCode);
			}
		});
	}
};

function _winRegIsAutorunSet(appName) {
	return new Promise(function(resolve) {
		_spawnProcess('cmd', ['/C', 'REG', 'QUERY', registryPath, '/v', appName],
			{}, function(err) {
				if (err) {
					resolve(false);
				}
				else {
					resolve(true);
				}
		});
	});
}

function _winRegAutorunEnable(appName, executablePath) {
	return new Promise(function(resolve, reject) {
		_spawnProcess('cmd',
			['/C', 'REG', 'ADD', registryPath, '/f', '/v', appName, '/t', 'REG_SZ', '/d', executablePath],
			{}, function(err, exitCode) {
				if (err) {
					var error = new Error('Could not enable autorun using the registry');
					error.name = 'AutorunEnableFailed';
					error.platform = os.platform();
					error.cause = err;
					reject(error);
				}
				else if (exitCode === 0) {
					resolve(true);
				}
				else {
					resolve(false);
				}
		});
	});
}

function _winRegAutorunDisable(appName) {
	return new Promise(function(resolve, reject) {
		_spawnProcess('cmd', ['/C', 'REG', 'DELETE', registryPath, '/f', '/v', appName],
			{}, function(err, exitCode) {
				if (err) {
					var error = new Error('Could not disable autorun using the registry');
					error.name = 'AutorunDisableFailed';
					error.platform = os.platform();
					error.cause = err;
					reject(error);
				}
				else if (exitCode === 0) {
					resolve(true);
				}
				else {
					resolve(false);
				}
		});
	});
}

function _getPathToExecutable() {
	if (os.platform() === 'darwin') {
		var app = process.cwd().match(/.*?\.app/);
		if (app === null || app.length === 0) {
			return process.cwd();
		}
		else {
			return app[0];
		}
	}
	else if (os.platform().indexOf('win') === 0) {
		return process.execPath;
	}
	else {
		return process.cwd();
	}
}
