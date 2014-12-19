# Autorun
*Multiplatform add/remove of executables to run on startup*

Run an executable on system start using AppleScript on Mac or the registry on Windows. Used in this `node-webkit` App: [Pullover](https://github.com/cgrossde/Pullover). Supports callbacks or promises (Promises/A+ compatible).

**Supported Platforms:**

* Windows
* Mac

## How to use

```JavaScript
var Autorun = require('autorun');
var autorun = new Autorun('AppName', '/Applications/pullover.app');

// Check if platform is supported
if (autorun.isPlatformSupported()) {
  // Check if autorun is enabled using callback
  autorun.isSet(function(err, enabled) {
    if (err) console.log(err);
    console.log('Autorun is ' + ((enabled) ? 'enabled' : 'disabled'));

    // Toogle autorun using promises
    if (enabled) {
      autorun.disable()
      .then(function() {
        console.log('Autorun disabled');
      })
      .catch(function(err) {
        console.log('Error disabling autorun', err);
      });
    }
    else {
      autorun.enable()
      .then(function() {
        console.log('Autorun enabled');
      })
      .catch(function(err) {
        console.log('Error enabling autorun', err);
      });
    }
  });
}
```

If you supply a callback it will be called once the operation is done. If you don't supply a callback, a promise will be returned.

## Function reference

### Autorun(appName, executablePath)
Constructor. If no `appName` was given, *AutorunApp* will be used. If no executable path was given, it will search for the current executable. Take a look at `_getPathToExecutable()` for more details.

### isPlatformSupported() : bool
Check if platform is supported by this module.

### isSet([callback]) : [promise]
Check if autorun is enabled. Returns an error if platform is not supported.

### enable([callback]) : [promise]
Enable autorun. Returns an error if platform is not supported.

### disable([callback]) : [promise]
Disable autorun. Returns an error if platform is not supported.

## Errors

Will be returned as `err` parameter for callbacks or using `reject` for promises. An error object looks like this:

```JavaScript
{
  name: 'AutorunEnableFailed',
  description: 'Could not enable autorun using the registry',
  platform: 'win', // os.platform()
  cause: {  // optional, if this error was triggered by another error
    name: 'ChildProcessFailed',
    description: 'Child process failed',
    output: '...', // Optional: output of the failed process
    cause: { ... }
  }
}
```

Possible error names are: *PlatformUnsupported*, *AutorunEnableFailed*, *AutorunDisableFailed*, *AutorunIsSetFailed*, *ChildProcessFailed*

## How it works

Under Mac AppleScript is used to create a new login item. The only way to differentiate between login items is by their executable path. So make sure to always supply the correct executable path. An error is thrown under Mac if the executable does not exist.
Under Windows the registry is used to add/remove an item to `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run`. Windows identifies the item by it's AppName, so make sure to always use the same.

## License

    The MIT License (MIT)
    
    Copyright (c) 2014 Christoph Groß <gross@blubyte.de> (http://chris-labs.de)
    
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    
    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.