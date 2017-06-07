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

var random = function random(chars) {
  return chars[Math.round(Math.random() * chars.length)];
};

var templateChars = {
  /* eslint-disable id-length */
  d: DIGIT,
  w: WORD
  /* eslint-enable id-length */
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

var tempDirs = [];
var tempFiles = [];

var moveTo = function moveTo(toTempDir) {
  var move = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  return function (fromTemp) {
    var newFilepath = _path2.default.join(toTempDir.filepath, _path2.default.basename(fromTemp.filepath));
    if (move) {
      _fs2.default.renameSync(fromTemp.filepath, newFilepath);
      // console.log(`MV ${fromTemp.filepath} - ${newFilepath}`);
    }
    fromTemp.filepath = newFilepath;
    if (fromTemp.children) {
      fromTemp.children = fromTemp.children.map(moveTo(fromTemp, false));
    }
    return fromTemp;
  };
};

// auto clean up

process.on('exit', cleanup);

// exports

function cleanup(tempX) {
  // if (tempX) {
  //   const dirIndex = tempDirs.findIndex(tempX);
  //   if (dirIndex >= 0) {
  //     tempDirs.splice(dirIndex, 1);
  //   }
  //   const fileIndex = tempFiles.findIndex(tempX);
  //   if (fileIndex >= 0) {
  //     tempFiles.splice(fileIndex, 1);
  //   }
  //   return;
  // }
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
    // console.log(`MKD ${tempDir.filepath}`);
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
  // console.log(`MKF ${tempFile.filepath}`);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9pbmRleC5qcyJdLCJuYW1lcyI6WyJjbGVhbnVwIiwiZGlyIiwiZmlsZSIsImZpbGVwYXRoIiwiRU1QVFlfU1RSSU5HIiwiREVGQVVMVF9ESVJfTU9ERSIsIkRFRkFVTFRfRU5DT0RJTkciLCJERUZBVUxUX0ZJTEVfTU9ERSIsIkRFRkFVTFRfTkFNRSIsIkRJR0lUIiwiV09SRCIsIlRFTVBMQVRFX0lOVEVSUE9MQVRFIiwicmFuZG9tIiwiY2hhcnMiLCJNYXRoIiwicm91bmQiLCJsZW5ndGgiLCJ0ZW1wbGF0ZUNoYXJzIiwiZCIsInciLCJ0ZW1wbGF0ZVJlcGxhY2VyIiwibWF0Y2giLCJpbm5lck1hdGNoIiwic3BsaXQiLCJtYXAiLCJjaGFyIiwidG9Mb3dlckNhc2UiLCJFcnJvciIsIk9iamVjdCIsImtleXMiLCJqb2luIiwidGVtcERpcnMiLCJ0ZW1wRmlsZXMiLCJtb3ZlVG8iLCJ0b1RlbXBEaXIiLCJtb3ZlIiwiZnJvbVRlbXAiLCJuZXdGaWxlcGF0aCIsImJhc2VuYW1lIiwicmVuYW1lU3luYyIsImNoaWxkcmVuIiwicHJvY2VzcyIsIm9uIiwidGVtcFgiLCJmb3JFYWNoIiwidGVtcEZpbGUiLCJ1bmxpbmtTeW5jIiwidGVtcERpciIsInJtZGlyU3luYyIsIm9wdGlvbnMiLCJBcnJheSIsImlzQXJyYXkiLCJtb2RlIiwiYWNjZXNzU3luYyIsIkZfT0siLCJlcnIiLCJjb2RlIiwicHVzaCIsInBhcmVudERpciIsImRpcm5hbWUiLCJuYW1lIiwibWtkaXJTeW5jIiwiZGF0YSIsImVuY29kaW5nIiwid3JpdGVGaWxlU3luYyIsImRpclBhdGgiLCJ0bXBkaXIiLCJleHQiLCJyZXNvbHZlIiwicmVwbGFjZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7UUErRGdCQSxPLEdBQUFBLE87UUFzQkFDLEcsR0FBQUEsRztRQWlDQUMsSSxHQUFBQSxJO1FBNkJBQyxRLEdBQUFBLFE7O0FBbkpoQjs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBOztBQUVBLElBQU1D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QU0zQixXQUFXc0IsS0FBS1MsT0FBTCxDQUFhMUQsb0JBQWIsRUFBbUNTLGdCQUFuQyxDQUFqQjtBQUNBLFNBQU8sZUFBS1UsSUFBTCxDQUFVNkIsT0FBVixFQUFvQixHQUFFckIsUUFBUyxHQUFFNkIsTUFBTyxJQUFHQSxHQUFJLEVBQWQsR0FBa0IsRUFBRyxFQUF0RCxDQUFQO0FBQ0QiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IG9zIGZyb20gJ29zJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG4vLyBjb25zdGFudHNcblxuY29uc3QgRU1QVFlfU1RSSU5HID0gJyc7XG5cbmNvbnN0IERFRkFVTFRfRElSX01PREUgPSAwbzc3NztcbmNvbnN0IERFRkFVTFRfRU5DT0RJTkcgPSAndXRmOCc7XG5jb25zdCBERUZBVUxUX0ZJTEVfTU9ERSA9IDBvNjY2O1xuY29uc3QgREVGQVVMVF9OQU1FID0gJ3RlbXBvcmFyaWx5LXtXV1dXRERERH0nO1xuXG5jb25zdCBESUdJVCA9ICcxMjM0NTY3ODkwJztcbmNvbnN0IFdPUkQgPSAnYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXpBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWic7XG5cbmNvbnN0IFRFTVBMQVRFX0lOVEVSUE9MQVRFID0gL1xceyhbXn1dKylcXH0vZztcblxuLy8gcHJpdmF0ZVxuXG5jb25zdCByYW5kb20gPSAoY2hhcnMpID0+IGNoYXJzW01hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIGNoYXJzLmxlbmd0aCldO1xuXG5jb25zdCB0ZW1wbGF0ZUNoYXJzID0ge1xuICAvKiBlc2xpbnQtZGlzYWJsZSBpZC1sZW5ndGggKi9cbiAgZDogRElHSVQsXG4gIHc6IFdPUkQsXG4gIC8qIGVzbGludC1lbmFibGUgaWQtbGVuZ3RoICovXG59O1xuXG5jb25zdCB0ZW1wbGF0ZVJlcGxhY2VyID0gKG1hdGNoLCBpbm5lck1hdGNoKSA9PiBpbm5lck1hdGNoXG4gIC5zcGxpdChFTVBUWV9TVFJJTkcpXG4gIC5tYXAoKGNoYXIpID0+IHtcbiAgICBjb25zdCBjaGFycyA9IHRlbXBsYXRlQ2hhcnNbY2hhci50b0xvd2VyQ2FzZSgpXTtcbiAgICBpZiAoIWNoYXJzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIHRlbXBsYXRlIHBsYWNlaG9sZGVyIHRvIGJlIG9uZSBvZjogJHtPYmplY3Qua2V5cyh0ZW1wbGF0ZUNoYXJzKS5qb2luKCcsICcpfS4gUmVjZWl2ZWQgJHtjaGFyfWApO1xuICAgIH1cbiAgICByZXR1cm4gcmFuZG9tKGNoYXJzKTtcbiAgfSlcbiAgLmpvaW4oRU1QVFlfU1RSSU5HKVxuO1xuXG5jb25zdCB0ZW1wRGlycyA9IFtdO1xuY29uc3QgdGVtcEZpbGVzID0gW107XG5cbmNvbnN0IG1vdmVUbyA9ICh0b1RlbXBEaXIsIG1vdmUgPSB0cnVlKSA9PiAoZnJvbVRlbXApID0+IHtcbiAgY29uc3QgbmV3RmlsZXBhdGggPSBwYXRoLmpvaW4odG9UZW1wRGlyLmZpbGVwYXRoLCBwYXRoLmJhc2VuYW1lKGZyb21UZW1wLmZpbGVwYXRoKSk7XG4gIGlmIChtb3ZlKSB7XG4gICAgZnMucmVuYW1lU3luYyhmcm9tVGVtcC5maWxlcGF0aCwgbmV3RmlsZXBhdGgpO1xuICAgIC8vIGNvbnNvbGUubG9nKGBNViAke2Zyb21UZW1wLmZpbGVwYXRofSAtICR7bmV3RmlsZXBhdGh9YCk7XG4gIH1cbiAgZnJvbVRlbXAuZmlsZXBhdGggPSBuZXdGaWxlcGF0aDtcbiAgaWYgKGZyb21UZW1wLmNoaWxkcmVuKSB7XG4gICAgZnJvbVRlbXAuY2hpbGRyZW4gPSBmcm9tVGVtcC5jaGlsZHJlbi5tYXAobW92ZVRvKGZyb21UZW1wLCBmYWxzZSkpO1xuICB9XG4gIHJldHVybiBmcm9tVGVtcDtcbn07XG5cbi8vIGF1dG8gY2xlYW4gdXBcblxucHJvY2Vzcy5vbignZXhpdCcsIGNsZWFudXApO1xuXG4vLyBleHBvcnRzXG5cbmV4cG9ydCBmdW5jdGlvbiBjbGVhbnVwKHRlbXBYKSB7XG4gIC8vIGlmICh0ZW1wWCkge1xuICAvLyAgIGNvbnN0IGRpckluZGV4ID0gdGVtcERpcnMuZmluZEluZGV4KHRlbXBYKTtcbiAgLy8gICBpZiAoZGlySW5kZXggPj0gMCkge1xuICAvLyAgICAgdGVtcERpcnMuc3BsaWNlKGRpckluZGV4LCAxKTtcbiAgLy8gICB9XG4gIC8vICAgY29uc3QgZmlsZUluZGV4ID0gdGVtcEZpbGVzLmZpbmRJbmRleCh0ZW1wWCk7XG4gIC8vICAgaWYgKGZpbGVJbmRleCA+PSAwKSB7XG4gIC8vICAgICB0ZW1wRmlsZXMuc3BsaWNlKGZpbGVJbmRleCwgMSk7XG4gIC8vICAgfVxuICAvLyAgIHJldHVybjtcbiAgLy8gfVxuICB0ZW1wRmlsZXMuZm9yRWFjaCgodGVtcEZpbGUpID0+IHtcbiAgICBmcy51bmxpbmtTeW5jKHRlbXBGaWxlLmZpbGVwYXRoKTtcbiAgfSk7XG4gIHRlbXBGaWxlcy5sZW5ndGggPSAwO1xuICB0ZW1wRGlycy5mb3JFYWNoKCh0ZW1wRGlyKSA9PiB7XG4gICAgZnMucm1kaXJTeW5jKHRlbXBEaXIuZmlsZXBhdGgpO1xuICB9KTtcbiAgdGVtcERpcnMubGVuZ3RoID0gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRpcihvcHRpb25zID0ge30sIGNoaWxkcmVuID0gW10pIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucykpIHtcbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1wYXJhbS1yZWFzc2lnbiAqL1xuICAgIGNoaWxkcmVuID0gb3B0aW9ucztcbiAgICBvcHRpb25zID0ge307XG4gICAgLyogZXNsaW50LWVuYWJsZSBuby1wYXJhbS1yZWFzc2lnbiAqL1xuICB9XG4gIGNvbnN0IHsgbW9kZSA9IERFRkFVTFRfRElSX01PREUgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IHRlbXBEaXIgPSB7XG4gICAgZmlsZXBhdGg6IGZpbGVwYXRoKG9wdGlvbnMpLFxuICAgIG1vZGUsXG4gIH07XG4gIHRyeSB7XG4gICAgZnMuYWNjZXNzU3luYyh0ZW1wRGlyLmZpbGVwYXRoLCBmcy5GX09LKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyci5jb2RlICE9PSAnRU5PRU5UJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgY2hlY2sgJHt0ZW1wRGlyLmZpbGVwYXRofS5gKTtcbiAgICB9XG4gICAgdGVtcERpcnMucHVzaCh0ZW1wRGlyKTtcbiAgICBjb25zdCBwYXJlbnREaXIgPSBwYXRoLmRpcm5hbWUodGVtcERpci5maWxlcGF0aCk7XG4gICAgZGlyKHtcbiAgICAgIGRpcjogcGF0aC5kaXJuYW1lKHBhcmVudERpciksXG4gICAgICBuYW1lOiBwYXRoLmJhc2VuYW1lKHBhcmVudERpciksXG4gICAgfSk7XG4gICAgZnMubWtkaXJTeW5jKHRlbXBEaXIuZmlsZXBhdGgsIG1vZGUpO1xuICAgIC8vIGNvbnNvbGUubG9nKGBNS0QgJHt0ZW1wRGlyLmZpbGVwYXRofWApO1xuICB9XG4gIGlmIChjaGlsZHJlbi5sZW5ndGggIT09IDApIHtcbiAgICB0ZW1wRGlyLmNoaWxkcmVuID0gY2hpbGRyZW4ubWFwKG1vdmVUbyh0ZW1wRGlyKSk7XG4gIH1cbiAgcmV0dXJuIHRlbXBEaXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaWxlKG9wdGlvbnMgPSB7fSkge1xuICBjb25zdCB7XG4gICAgZGF0YSA9ICcnLFxuICAgIGVuY29kaW5nID0gREVGQVVMVF9FTkNPRElORyxcbiAgICBtb2RlID0gREVGQVVMVF9GSUxFX01PREUsXG4gIH0gPSBvcHRpb25zO1xuICBjb25zdCB0ZW1wRmlsZSA9IHtcbiAgICBkYXRhLFxuICAgIGZpbGVwYXRoOiBmaWxlcGF0aChvcHRpb25zKSxcbiAgICBtb2RlLFxuICB9O1xuICBjb25zdCBwYXJlbnREaXIgPSBwYXRoLmRpcm5hbWUodGVtcEZpbGUuZmlsZXBhdGgpO1xuICB0cnkge1xuICAgIGZzLmFjY2Vzc1N5bmMocGFyZW50RGlyLCBmcy5GX09LKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyci5jb2RlICE9PSAnRU5PRU5UJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgY2hlY2sgJHtwYXJlbnREaXJ9LmApO1xuICAgIH1cbiAgICBkaXIoe1xuICAgICAgZGlyOiBwYXRoLmRpcm5hbWUocGFyZW50RGlyKSxcbiAgICAgIG5hbWU6IHBhdGguYmFzZW5hbWUocGFyZW50RGlyKSxcbiAgICB9KTtcbiAgfVxuICBmcy53cml0ZUZpbGVTeW5jKHRlbXBGaWxlLmZpbGVwYXRoLCBkYXRhLCB7IGVuY29kaW5nLCBtb2RlIH0pO1xuICAvLyBjb25zb2xlLmxvZyhgTUtGICR7dGVtcEZpbGUuZmlsZXBhdGh9YCk7XG4gIHRlbXBGaWxlcy5wdXNoKHRlbXBGaWxlKTtcbiAgcmV0dXJuIHRlbXBGaWxlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmlsZXBhdGgoe1xuICBkaXI6IGRpclBhdGggPSBvcy50bXBkaXIoKSxcbiAgZXh0ID0gbnVsbCxcbiAgbmFtZSA9IERFRkFVTFRfTkFNRSxcbn0gPSB7fSkge1xuICBjb25zdCBkaXJuYW1lID0gcGF0aC5yZXNvbHZlKGRpclBhdGgpO1xuICBjb25zdCBiYXNlbmFtZSA9IG5hbWUucmVwbGFjZShURU1QTEFURV9JTlRFUlBPTEFURSwgdGVtcGxhdGVSZXBsYWNlcik7XG4gIHJldHVybiBwYXRoLmpvaW4oZGlybmFtZSwgYCR7YmFzZW5hbWV9JHtleHQgPyBgLiR7ZXh0fWAgOiAnJ31gKTtcbn1cbiJdfQ==