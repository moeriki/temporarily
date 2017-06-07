'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cleanup = cleanup;
exports.dir = dir;
exports.file = file;
exports.filepath = filepath;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// constants

var EMPTY_STRING = '';

var DEFAULT_DIR_MODE = 0o777;
var DEFAULT_ENCODING = 'utf8';
var DEFAULT_FILE_MODE = 0o666;
var DEFAULT_NAME = 'temporarily-{WWWWDDDD}';

var DIGIT = '1234567890';
var WORD = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

var TEMPLATE_INTERPOLATE = /\{([^}]+)\}/g;

// private

var templateChars = {
  /* eslint-disable id-length */
  d: DIGIT,
  w: WORD
  /* eslint-enable id-length */
};

var tempDirs = [];
var tempFiles = [];

var moveTo = function moveTo(toTempDir) {
  var move = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  return function (fromTemp) {
    var newFilepath = _path2.default.join(toTempDir.filepath, _path2.default.basename(fromTemp.filepath));
    if (move) {
      _fs2.default.renameSync(fromTemp.filepath, newFilepath);
    }
    fromTemp.filepath = newFilepath;
    if (fromTemp.children) {
      fromTemp.children = fromTemp.children.map(moveTo(fromTemp, false));
    }
    return fromTemp;
  };
};

var random = function random(chars) {
  return chars[Math.floor(Math.random() * chars.length)];
};

var templateReplacer = function templateReplacer(match, innerMatch) {
  return innerMatch.split(EMPTY_STRING).map(function (char) {
    var chars = templateChars[char.toLowerCase()];
    if (!chars) {
      throw new Error(`Expected template placeholder to be one of: ${Object.keys(templateChars).join(', ')}. Received ${char}`);
    }
    return random(chars);
  }).join(EMPTY_STRING);
};

// auto clean up

process.on('exit', cleanup);

// exports

function cleanup() {
  tempFiles.forEach(function (tempFile) {
    _fs2.default.unlinkSync(tempFile.filepath);
  });
  tempFiles.length = 0;
  tempDirs.forEach(function (tempDir) {
    _fs2.default.rmdirSync(tempDir.filepath);
  });
  tempDirs.length = 0;
}

function dir() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var children = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

  if (Array.isArray(options)) {
    /* eslint-disable no-param-reassign */
    children = options;
    options = {};
    /* eslint-enable no-param-reassign */
  }
  var _options = options,
      _options$mode = _options.mode,
      mode = _options$mode === undefined ? DEFAULT_DIR_MODE : _options$mode;

  var tempDir = {
    filepath: filepath(options),
    mode
  };
  try {
    _fs2.default.accessSync(tempDir.filepath, _fs2.default.F_OK);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw new Error(`Could not check ${tempDir.filepath}.`);
    }
    tempDirs.push(tempDir);
    var parentDir = _path2.default.dirname(tempDir.filepath);
    dir({
      dir: _path2.default.dirname(parentDir),
      name: _path2.default.basename(parentDir)
    });
    _fs2.default.mkdirSync(tempDir.filepath, mode);
  }
  if (children.length !== 0) {
    tempDir.children = children.map(moveTo(tempDir));
  }
  return tempDir;
}

function file() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var _options$data = options.data,
      data = _options$data === undefined ? '' : _options$data,
      _options$encoding = options.encoding,
      encoding = _options$encoding === undefined ? DEFAULT_ENCODING : _options$encoding,
      _options$mode2 = options.mode,
      mode = _options$mode2 === undefined ? DEFAULT_FILE_MODE : _options$mode2;

  var tempFile = {
    data,
    filepath: filepath(options),
    mode
  };
  var parentDir = _path2.default.dirname(tempFile.filepath);
  try {
    _fs2.default.accessSync(parentDir, _fs2.default.F_OK);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw new Error(`Could not check ${parentDir}.`);
    }
    dir({
      dir: _path2.default.dirname(parentDir),
      name: _path2.default.basename(parentDir)
    });
  }
  _fs2.default.writeFileSync(tempFile.filepath, data, { encoding, mode });
  tempFiles.push(tempFile);
  return tempFile;
}

function filepath() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref$dir = _ref.dir,
      dirPath = _ref$dir === undefined ? _os2.default.tmpdir() : _ref$dir,
      _ref$ext = _ref.ext,
      ext = _ref$ext === undefined ? null : _ref$ext,
      _ref$name = _ref.name,
      name = _ref$name === undefined ? DEFAULT_NAME : _ref$name;

  var dirname = _path2.default.resolve(dirPath);
  var basename = name.replace(TEMPLATE_INTERPOLATE, templateReplacer);
  return _path2.default.join(dirname, `${basename}${ext ? `.${ext}` : ''}`);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9pbmRleC5qcyJdLCJuYW1lcyI6WyJjbGVhbnVwIiwiZGlyIiwiZmlsZSIsImZpbGVwYXRoIiwiRU1QVFlfU1RSSU5HIiwiREVGQVVMVF9ESVJfTU9ERSIsIkRFRkFVTFRfRU5DT0RJTkciLCJERUZBVUxUX0ZJTEVfTU9ERSIsIkRFRkFVTFRfTkFNRSIsIkRJR0lUIiwiV09SRCIsIlRFTVBMQVRFX0lOVEVSUE9MQVRFIiwidGVtcGxhdGVDaGFycyIsImQiLCJ3IiwidGVtcERpcnMiLCJ0ZW1wRmlsZXMiLCJtb3ZlVG8iLCJ0b1RlbXBEaXIiLCJtb3ZlIiwiZnJvbVRlbXAiLCJuZXdGaWxlcGF0aCIsImpvaW4iLCJiYXNlbmFtZSIsInJlbmFtZVN5bmMiLCJjaGlsZHJlbiIsIm1hcCIsInJhbmRvbSIsImNoYXJzIiwiTWF0aCIsImZsb29yIiwibGVuZ3RoIiwidGVtcGxhdGVSZXBsYWNlciIsIm1hdGNoIiwiaW5uZXJNYXRjaCIsInNwbGl0IiwiY2hhciIsInRvTG93ZXJDYXNlIiwiRXJyb3IiLCJPYmplY3QiLCJrZXlzIiwicHJvY2VzcyIsIm9uIiwiZm9yRWFjaCIsInRlbXBGaWxlIiwidW5saW5rU3luYyIsInRlbXBEaXIiLCJybWRpclN5bmMiLCJvcHRpb25zIiwiQXJyYXkiLCJpc0FycmF5IiwibW9kZSIsImFjY2Vzc1N5bmMiLCJGX09LIiwiZXJyIiwiY29kZSIsInB1c2giLCJwYXJlbnREaXIiLCJkaXJuYW1lIiwibmFtZSIsIm1rZGlyU3luYyIsImRhdGEiLCJlbmNvZGluZyIsIndyaXRlRmlsZVN5bmMiLCJkaXJQYXRoIiwidG1wZGlyIiwiZXh0IiwicmVzb2x2ZSIsInJlcGxhY2UiXSwibWFwcGluZ3MiOiI7Ozs7O1FBOERnQkEsTyxHQUFBQSxPO1FBV0FDLEcsR0FBQUEsRztRQWdDQUMsSSxHQUFBQSxJO1FBNEJBQyxRLEdBQUFBLFE7O0FBckloQjs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBOztBQUVBLElBQU1DLGVBQWUsRUFB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VixFQUFvQixHQUFFbkMsUUFBUyxHQUFFMkMsTUFBTyxJQUFHQSxHQUFJLEVBQWQsR0FBa0IsRUFBRyxFQUF0RCxDQUFQO0FBQ0QiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IG9zIGZyb20gJ29zJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG4vLyBjb25zdGFudHNcblxuY29uc3QgRU1QVFlfU1RSSU5HID0gJyc7XG5cbmNvbnN0IERFRkFVTFRfRElSX01PREUgPSAwbzc3NztcbmNvbnN0IERFRkFVTFRfRU5DT0RJTkcgPSAndXRmOCc7XG5jb25zdCBERUZBVUxUX0ZJTEVfTU9ERSA9IDBvNjY2O1xuY29uc3QgREVGQVVMVF9OQU1FID0gJ3RlbXBvcmFyaWx5LXtXV1dXRERERH0nO1xuXG5jb25zdCBESUdJVCA9ICcxMjM0NTY3ODkwJztcbmNvbnN0IFdPUkQgPSAnYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXpBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWic7XG5cbmNvbnN0IFRFTVBMQVRFX0lOVEVSUE9MQVRFID0gL1xceyhbXn1dKylcXH0vZztcblxuLy8gcHJpdmF0ZVxuXG5jb25zdCB0ZW1wbGF0ZUNoYXJzID0ge1xuICAvKiBlc2xpbnQtZGlzYWJsZSBpZC1sZW5ndGggKi9cbiAgZDogRElHSVQsXG4gIHc6IFdPUkQsXG4gIC8qIGVzbGludC1lbmFibGUgaWQtbGVuZ3RoICovXG59O1xuXG5jb25zdCB0ZW1wRGlycyA9IFtdO1xuY29uc3QgdGVtcEZpbGVzID0gW107XG5cbmNvbnN0IG1vdmVUbyA9ICh0b1RlbXBEaXIsIG1vdmUgPSB0cnVlKSA9PiAoZnJvbVRlbXApID0+IHtcbiAgY29uc3QgbmV3RmlsZXBhdGggPSBwYXRoLmpvaW4odG9UZW1wRGlyLmZpbGVwYXRoLCBwYXRoLmJhc2VuYW1lKGZyb21UZW1wLmZpbGVwYXRoKSk7XG4gIGlmIChtb3ZlKSB7XG4gICAgZnMucmVuYW1lU3luYyhmcm9tVGVtcC5maWxlcGF0aCwgbmV3RmlsZXBhdGgpO1xuICB9XG4gIGZyb21UZW1wLmZpbGVwYXRoID0gbmV3RmlsZXBhdGg7XG4gIGlmIChmcm9tVGVtcC5jaGlsZHJlbikge1xuICAgIGZyb21UZW1wLmNoaWxkcmVuID0gZnJvbVRlbXAuY2hpbGRyZW4ubWFwKG1vdmVUbyhmcm9tVGVtcCwgZmFsc2UpKTtcbiAgfVxuICByZXR1cm4gZnJvbVRlbXA7XG59O1xuXG5jb25zdCByYW5kb20gPSAoY2hhcnMpID0+IGNoYXJzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGNoYXJzLmxlbmd0aCldO1xuXG5jb25zdCB0ZW1wbGF0ZVJlcGxhY2VyID0gKG1hdGNoLCBpbm5lck1hdGNoKSA9PiBpbm5lck1hdGNoXG4gIC5zcGxpdChFTVBUWV9TVFJJTkcpXG4gIC5tYXAoKGNoYXIpID0+IHtcbiAgICBjb25zdCBjaGFycyA9IHRlbXBsYXRlQ2hhcnNbY2hhci50b0xvd2VyQ2FzZSgpXTtcbiAgICBpZiAoIWNoYXJzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIHRlbXBsYXRlIHBsYWNlaG9sZGVyIHRvIGJlIG9uZSBvZjogJHtPYmplY3Qua2V5cyh0ZW1wbGF0ZUNoYXJzKS5qb2luKCcsICcpfS4gUmVjZWl2ZWQgJHtjaGFyfWApO1xuICAgIH1cbiAgICByZXR1cm4gcmFuZG9tKGNoYXJzKTtcbiAgfSlcbiAgLmpvaW4oRU1QVFlfU1RSSU5HKVxuO1xuXG4vLyBhdXRvIGNsZWFuIHVwXG5cbnByb2Nlc3Mub24oJ2V4aXQnLCBjbGVhbnVwKTtcblxuLy8gZXhwb3J0c1xuXG5leHBvcnQgZnVuY3Rpb24gY2xlYW51cCgpIHtcbiAgdGVtcEZpbGVzLmZvckVhY2goKHRlbXBGaWxlKSA9PiB7XG4gICAgZnMudW5saW5rU3luYyh0ZW1wRmlsZS5maWxlcGF0aCk7XG4gIH0pO1xuICB0ZW1wRmlsZXMubGVuZ3RoID0gMDtcbiAgdGVtcERpcnMuZm9yRWFjaCgodGVtcERpcikgPT4ge1xuICAgIGZzLnJtZGlyU3luYyh0ZW1wRGlyLmZpbGVwYXRoKTtcbiAgfSk7XG4gIHRlbXBEaXJzLmxlbmd0aCA9IDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkaXIob3B0aW9ucyA9IHt9LCBjaGlsZHJlbiA9IFtdKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMpKSB7XG4gICAgLyogZXNsaW50LWRpc2FibGUgbm8tcGFyYW0tcmVhc3NpZ24gKi9cbiAgICBjaGlsZHJlbiA9IG9wdGlvbnM7XG4gICAgb3B0aW9ucyA9IHt9O1xuICAgIC8qIGVzbGludC1lbmFibGUgbm8tcGFyYW0tcmVhc3NpZ24gKi9cbiAgfVxuICBjb25zdCB7IG1vZGUgPSBERUZBVUxUX0RJUl9NT0RFIH0gPSBvcHRpb25zO1xuICBjb25zdCB0ZW1wRGlyID0ge1xuICAgIGZpbGVwYXRoOiBmaWxlcGF0aChvcHRpb25zKSxcbiAgICBtb2RlLFxuICB9O1xuICB0cnkge1xuICAgIGZzLmFjY2Vzc1N5bmModGVtcERpci5maWxlcGF0aCwgZnMuRl9PSyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmIChlcnIuY29kZSAhPT0gJ0VOT0VOVCcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IGNoZWNrICR7dGVtcERpci5maWxlcGF0aH0uYCk7XG4gICAgfVxuICAgIHRlbXBEaXJzLnB1c2godGVtcERpcik7XG4gICAgY29uc3QgcGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKHRlbXBEaXIuZmlsZXBhdGgpO1xuICAgIGRpcih7XG4gICAgICBkaXI6IHBhdGguZGlybmFtZShwYXJlbnREaXIpLFxuICAgICAgbmFtZTogcGF0aC5iYXNlbmFtZShwYXJlbnREaXIpLFxuICAgIH0pO1xuICAgIGZzLm1rZGlyU3luYyh0ZW1wRGlyLmZpbGVwYXRoLCBtb2RlKTtcbiAgfVxuICBpZiAoY2hpbGRyZW4ubGVuZ3RoICE9PSAwKSB7XG4gICAgdGVtcERpci5jaGlsZHJlbiA9IGNoaWxkcmVuLm1hcChtb3ZlVG8odGVtcERpcikpO1xuICB9XG4gIHJldHVybiB0ZW1wRGlyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmlsZShvcHRpb25zID0ge30pIHtcbiAgY29uc3Qge1xuICAgIGRhdGEgPSAnJyxcbiAgICBlbmNvZGluZyA9IERFRkFVTFRfRU5DT0RJTkcsXG4gICAgbW9kZSA9IERFRkFVTFRfRklMRV9NT0RFLFxuICB9ID0gb3B0aW9ucztcbiAgY29uc3QgdGVtcEZpbGUgPSB7XG4gICAgZGF0YSxcbiAgICBmaWxlcGF0aDogZmlsZXBhdGgob3B0aW9ucyksXG4gICAgbW9kZSxcbiAgfTtcbiAgY29uc3QgcGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKHRlbXBGaWxlLmZpbGVwYXRoKTtcbiAgdHJ5IHtcbiAgICBmcy5hY2Nlc3NTeW5jKHBhcmVudERpciwgZnMuRl9PSyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmIChlcnIuY29kZSAhPT0gJ0VOT0VOVCcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IGNoZWNrICR7cGFyZW50RGlyfS5gKTtcbiAgICB9XG4gICAgZGlyKHtcbiAgICAgIGRpcjogcGF0aC5kaXJuYW1lKHBhcmVudERpciksXG4gICAgICBuYW1lOiBwYXRoLmJhc2VuYW1lKHBhcmVudERpciksXG4gICAgfSk7XG4gIH1cbiAgZnMud3JpdGVGaWxlU3luYyh0ZW1wRmlsZS5maWxlcGF0aCwgZGF0YSwgeyBlbmNvZGluZywgbW9kZSB9KTtcbiAgdGVtcEZpbGVzLnB1c2godGVtcEZpbGUpO1xuICByZXR1cm4gdGVtcEZpbGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaWxlcGF0aCh7XG4gIGRpcjogZGlyUGF0aCA9IG9zLnRtcGRpcigpLFxuICBleHQgPSBudWxsLFxuICBuYW1lID0gREVGQVVMVF9OQU1FLFxufSA9IHt9KSB7XG4gIGNvbnN0IGRpcm5hbWUgPSBwYXRoLnJlc29sdmUoZGlyUGF0aCk7XG4gIGNvbnN0IGJhc2VuYW1lID0gbmFtZS5yZXBsYWNlKFRFTVBMQVRFX0lOVEVSUE9MQVRFLCB0ZW1wbGF0ZVJlcGxhY2VyKTtcbiAgcmV0dXJuIHBhdGguam9pbihkaXJuYW1lLCBgJHtiYXNlbmFtZX0ke2V4dCA/IGAuJHtleHR9YCA6ICcnfWApO1xufVxuIl19