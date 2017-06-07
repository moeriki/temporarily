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

var tempX = [];

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
  tempX.forEach(function (tempFile) {
    if (tempFile.isFile) {
      _fs2.default.unlinkSync(tempFile.filepath);
    } else {
      _fs2.default.rmdir(tempFile.filepath);
    }
  });
  tempX.length = 0;
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
    isDir: true,
    mode
  };
  try {
    _fs2.default.accessSync(tempDir.filepath, _fs2.default.F_OK);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw new Error(`Could not check ${tempDir.filepath}.`);
    }
    tempX.push(tempDir);
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
    isFile: true,
    mode
  };
  var parentDir = _path2.default.dirname(tempFile.filepath);
  tempX.push(tempFile);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9pbmRleC5qcyJdLCJuYW1lcyI6WyJjbGVhbnVwIiwiZGlyIiwiZmlsZSIsImZpbGVwYXRoIiwiRU1QVFlfU1RSSU5HIiwiREVGQVVMVF9ESVJfTU9ERSIsIkRFRkFVTFRfRU5DT0RJTkciLCJERUZBVUxUX0ZJTEVfTU9ERSIsIkRFRkFVTFRfTkFNRSIsIkRJR0lUIiwiV09SRCIsIlRFTVBMQVRFX0lOVEVSUE9MQVRFIiwidGVtcGxhdGVDaGFycyIsImQiLCJ3IiwidGVtcFgiLCJtb3ZlVG8iLCJ0b1RlbXBEaXIiLCJtb3ZlIiwiZnJvbVRlbXAiLCJuZXdGaWxlcGF0aCIsImpvaW4iLCJiYXNlbmFtZSIsInJlbmFtZVN5bmMiLCJjaGlsZHJlbiIsIm1hcCIsInJhbmRvbSIsImNoYXJzIiwiTWF0aCIsImZsb29yIiwibGVuZ3RoIiwidGVtcGxhdGVSZXBsYWNlciIsIm1hdGNoIiwiaW5uZXJNYXRjaCIsInNwbGl0IiwiY2hhciIsInRvTG93ZXJDYXNlIiwiRXJyb3IiLCJPYmplY3QiLCJrZXlzIiwicHJvY2VzcyIsIm9uIiwiZm9yRWFjaCIsInRlbXBGaWxlIiwiaXNGaWxlIiwidW5saW5rU3luYyIsInJtZGlyIiwib3B0aW9ucyIsIkFycmF5IiwiaXNBcnJheSIsIm1vZGUiLCJ0ZW1wRGlyIiwiaXNEaXIiLCJhY2Nlc3NTeW5jIiwiRl9PSyIsImVyciIsImNvZGUiLCJwdXNoIiwicGFyZW50RGlyIiwiZGlybmFtZSIsIm5hbWUiLCJta2RpclN5bmMiLCJkYXRhIiwiZW5jb2RpbmciLCJ3cml0ZUZpbGVTeW5jIiwiZGlyUGF0aCIsInRtcGRpciIsImV4dCIsInJlc29sdmUiLCJyZXBsYWNlIl0sIm1hcHBpbmdzIjoiOzs7OztRQTZEZ0JBLE8sR0FBQUEsTztRQVdBQyxHLEdBQUFBLEc7UUFpQ0FDLEksR0FBQUEsSTtRQTZCQUMsUSxHQUFBQSxROztBQXRJaEI7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7QUFFQTs7QUFFQSxJQUFNQyxlQUFlLEVBQXJC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TyxJQUFHQSxHQUFJLEVBQWQsR0FBa0IsRUFBRyxFQUF0RCxDQUFQO0FBQ0QiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IG9zIGZyb20gJ29zJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG4vLyBjb25zdGFudHNcblxuY29uc3QgRU1QVFlfU1RSSU5HID0gJyc7XG5cbmNvbnN0IERFRkFVTFRfRElSX01PREUgPSAwbzc3NztcbmNvbnN0IERFRkFVTFRfRU5DT0RJTkcgPSAndXRmOCc7XG5jb25zdCBERUZBVUxUX0ZJTEVfTU9ERSA9IDBvNjY2O1xuY29uc3QgREVGQVVMVF9OQU1FID0gJ3RlbXBvcmFyaWx5LXtXV1dXRERERH0nO1xuXG5jb25zdCBESUdJVCA9ICcxMjM0NTY3ODkwJztcbmNvbnN0IFdPUkQgPSAnYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXpBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWic7XG5cbmNvbnN0IFRFTVBMQVRFX0lOVEVSUE9MQVRFID0gL1xceyhbXn1dKylcXH0vZztcblxuLy8gcHJpdmF0ZVxuXG5jb25zdCB0ZW1wbGF0ZUNoYXJzID0ge1xuICAvKiBlc2xpbnQtZGlzYWJsZSBpZC1sZW5ndGggKi9cbiAgZDogRElHSVQsXG4gIHc6IFdPUkQsXG4gIC8qIGVzbGludC1lbmFibGUgaWQtbGVuZ3RoICovXG59O1xuXG5jb25zdCB0ZW1wWCA9IFtdO1xuXG5jb25zdCBtb3ZlVG8gPSAodG9UZW1wRGlyLCBtb3ZlID0gdHJ1ZSkgPT4gKGZyb21UZW1wKSA9PiB7XG4gIGNvbnN0IG5ld0ZpbGVwYXRoID0gcGF0aC5qb2luKHRvVGVtcERpci5maWxlcGF0aCwgcGF0aC5iYXNlbmFtZShmcm9tVGVtcC5maWxlcGF0aCkpO1xuICBpZiAobW92ZSkge1xuICAgIGZzLnJlbmFtZVN5bmMoZnJvbVRlbXAuZmlsZXBhdGgsIG5ld0ZpbGVwYXRoKTtcbiAgfVxuICBmcm9tVGVtcC5maWxlcGF0aCA9IG5ld0ZpbGVwYXRoO1xuICBpZiAoZnJvbVRlbXAuY2hpbGRyZW4pIHtcbiAgICBmcm9tVGVtcC5jaGlsZHJlbiA9IGZyb21UZW1wLmNoaWxkcmVuLm1hcChtb3ZlVG8oZnJvbVRlbXAsIGZhbHNlKSk7XG4gIH1cbiAgcmV0dXJuIGZyb21UZW1wO1xufTtcblxuY29uc3QgcmFuZG9tID0gKGNoYXJzKSA9PiBjaGFyc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjaGFycy5sZW5ndGgpXTtcblxuY29uc3QgdGVtcGxhdGVSZXBsYWNlciA9IChtYXRjaCwgaW5uZXJNYXRjaCkgPT4gaW5uZXJNYXRjaFxuICAuc3BsaXQoRU1QVFlfU1RSSU5HKVxuICAubWFwKChjaGFyKSA9PiB7XG4gICAgY29uc3QgY2hhcnMgPSB0ZW1wbGF0ZUNoYXJzW2NoYXIudG9Mb3dlckNhc2UoKV07XG4gICAgaWYgKCFjaGFycykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCB0ZW1wbGF0ZSBwbGFjZWhvbGRlciB0byBiZSBvbmUgb2Y6ICR7T2JqZWN0LmtleXModGVtcGxhdGVDaGFycykuam9pbignLCAnKX0uIFJlY2VpdmVkICR7Y2hhcn1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHJhbmRvbShjaGFycyk7XG4gIH0pXG4gIC5qb2luKEVNUFRZX1NUUklORylcbjtcblxuLy8gYXV0byBjbGVhbiB1cFxuXG5wcm9jZXNzLm9uKCdleGl0JywgY2xlYW51cCk7XG5cbi8vIGV4cG9ydHNcblxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFudXAoKSB7XG4gIHRlbXBYLmZvckVhY2goKHRlbXBGaWxlKSA9PiB7XG4gICAgaWYgKHRlbXBGaWxlLmlzRmlsZSkge1xuICAgICAgZnMudW5saW5rU3luYyh0ZW1wRmlsZS5maWxlcGF0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZzLnJtZGlyKHRlbXBGaWxlLmZpbGVwYXRoKTtcbiAgICB9XG4gIH0pO1xuICB0ZW1wWC5sZW5ndGggPSAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGlyKG9wdGlvbnMgPSB7fSwgY2hpbGRyZW4gPSBbXSkge1xuICBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zKSkge1xuICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLXBhcmFtLXJlYXNzaWduICovXG4gICAgY2hpbGRyZW4gPSBvcHRpb25zO1xuICAgIG9wdGlvbnMgPSB7fTtcbiAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLXBhcmFtLXJlYXNzaWduICovXG4gIH1cbiAgY29uc3QgeyBtb2RlID0gREVGQVVMVF9ESVJfTU9ERSB9ID0gb3B0aW9ucztcbiAgY29uc3QgdGVtcERpciA9IHtcbiAgICBmaWxlcGF0aDogZmlsZXBhdGgob3B0aW9ucyksXG4gICAgaXNEaXI6IHRydWUsXG4gICAgbW9kZSxcbiAgfTtcbiAgdHJ5IHtcbiAgICBmcy5hY2Nlc3NTeW5jKHRlbXBEaXIuZmlsZXBhdGgsIGZzLkZfT0spO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoZXJyLmNvZGUgIT09ICdFTk9FTlQnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBjaGVjayAke3RlbXBEaXIuZmlsZXBhdGh9LmApO1xuICAgIH1cbiAgICB0ZW1wWC5wdXNoKHRlbXBEaXIpO1xuICAgIGNvbnN0IHBhcmVudERpciA9IHBhdGguZGlybmFtZSh0ZW1wRGlyLmZpbGVwYXRoKTtcbiAgICBkaXIoe1xuICAgICAgZGlyOiBwYXRoLmRpcm5hbWUocGFyZW50RGlyKSxcbiAgICAgIG5hbWU6IHBhdGguYmFzZW5hbWUocGFyZW50RGlyKSxcbiAgICB9KTtcbiAgICBmcy5ta2RpclN5bmModGVtcERpci5maWxlcGF0aCwgbW9kZSk7XG4gIH1cbiAgaWYgKGNoaWxkcmVuLmxlbmd0aCAhPT0gMCkge1xuICAgIHRlbXBEaXIuY2hpbGRyZW4gPSBjaGlsZHJlbi5tYXAobW92ZVRvKHRlbXBEaXIpKTtcbiAgfVxuICByZXR1cm4gdGVtcERpcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbGUob3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IHtcbiAgICBkYXRhID0gJycsXG4gICAgZW5jb2RpbmcgPSBERUZBVUxUX0VOQ09ESU5HLFxuICAgIG1vZGUgPSBERUZBVUxUX0ZJTEVfTU9ERSxcbiAgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IHRlbXBGaWxlID0ge1xuICAgIGRhdGEsXG4gICAgZmlsZXBhdGg6IGZpbGVwYXRoKG9wdGlvbnMpLFxuICAgIGlzRmlsZTogdHJ1ZSxcbiAgICBtb2RlLFxuICB9O1xuICBjb25zdCBwYXJlbnREaXIgPSBwYXRoLmRpcm5hbWUodGVtcEZpbGUuZmlsZXBhdGgpO1xuICB0ZW1wWC5wdXNoKHRlbXBGaWxlKTtcbiAgdHJ5IHtcbiAgICBmcy5hY2Nlc3NTeW5jKHBhcmVudERpciwgZnMuRl9PSyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmIChlcnIuY29kZSAhPT0gJ0VOT0VOVCcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IGNoZWNrICR7cGFyZW50RGlyfS5gKTtcbiAgICB9XG4gICAgZGlyKHtcbiAgICAgIGRpcjogcGF0aC5kaXJuYW1lKHBhcmVudERpciksXG4gICAgICBuYW1lOiBwYXRoLmJhc2VuYW1lKHBhcmVudERpciksXG4gICAgfSk7XG4gIH1cbiAgZnMud3JpdGVGaWxlU3luYyh0ZW1wRmlsZS5maWxlcGF0aCwgZGF0YSwgeyBlbmNvZGluZywgbW9kZSB9KTtcbiAgcmV0dXJuIHRlbXBGaWxlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmlsZXBhdGgoe1xuICBkaXI6IGRpclBhdGggPSBvcy50bXBkaXIoKSxcbiAgZXh0ID0gbnVsbCxcbiAgbmFtZSA9IERFRkFVTFRfTkFNRSxcbn0gPSB7fSkge1xuICBjb25zdCBkaXJuYW1lID0gcGF0aC5yZXNvbHZlKGRpclBhdGgpO1xuICBjb25zdCBiYXNlbmFtZSA9IG5hbWUucmVwbGFjZShURU1QTEFURV9JTlRFUlBPTEFURSwgdGVtcGxhdGVSZXBsYWNlcik7XG4gIHJldHVybiBwYXRoLmpvaW4oZGlybmFtZSwgYCR7YmFzZW5hbWV9JHtleHQgPyBgLiR7ZXh0fWAgOiAnJ31gKTtcbn1cbiJdfQ==