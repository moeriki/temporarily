'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cleanup = cleanup;
exports.filepath = filepath;
exports.dir = dir;
exports.file = file;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _cryptoRandomString = require('crypto-random-string');

var _cryptoRandomString2 = _interopRequireDefault(_cryptoRandomString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// constants

var EMPTY_STRING = '';

var DEFAULT_DIR_MODE = 0o777;
var DEFAULT_ENCODING = 'utf8';
var DEFAULT_FILE_MODE = 0o666;
var DEFAULT_NAME = 'temporarily-{WWWWDDDD}';
var TMP_DIR = 'temporarily-{XXXXXXXX}';

var DIGIT = '1234567890';
var WORD = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

var TEMPLATE_INTERPOLATE = /\{([^}]+)\}/g;

// utils

var sample = function sample(array) {
  return array[Math.floor(Math.random() * array.length)];
};

// private

var templateChars = {
  /* eslint-disable id-length */
  d: function d() {
    return sample(DIGIT);
  },
  w: function w() {
    return sample(WORD);
  },
  x: function x() {
    return (0, _cryptoRandomString2.default)(1);
  }
  /* eslint-enable id-length */
};

var tempX = [];

var moveTo = function moveTo(toTempDir) {
  var move = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  return function (fromTemp) {
    /* eslint-disable no-param-reassign */
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

var templateReplacer = function templateReplacer(match, innerMatch) {
  return innerMatch.split(EMPTY_STRING).map(function (char) {
    var chars = templateChars[char.toLowerCase()];
    if (!chars) {
      throw new Error(`Expected template placeholder to be one of: ${Object.keys(templateChars).join(', ')}. Received ${char}`);
    }
    return chars();
  }).join(EMPTY_STRING);
};

var tmpDir = function tmpDir() {
  return _path2.default.join(_os2.default.tmpdir(), TMP_DIR.replace(TEMPLATE_INTERPOLATE, templateReplacer));
};

// exports

/** */
function cleanup() {
  tempX.forEach(function (tempFile) {
    if (tempFile.isFile) {
      _fs2.default.unlinkSync(tempFile.filepath);
    } else {
      _fs2.default.rmdirSync(tempFile.filepath);
    }
  });
  tempX.length = 0;
}

/**
 * @param {object} [options]
 * @param {string} [options.dir=os.tmpdir]
 * @param {string} [options.ext]
 * @param {string} [options.name=temporarily-{WWWWDDDD}]
 * @return {string} filepath
 */
function filepath() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref$dir = _ref.dir,
      dirPath = _ref$dir === undefined ? tmpDir() : _ref$dir,
      _ref$ext = _ref.ext,
      ext = _ref$ext === undefined ? null : _ref$ext,
      _ref$name = _ref.name,
      name = _ref$name === undefined ? DEFAULT_NAME : _ref$name;

  var dirname = _path2.default.resolve(dirPath);
  var basename = name.replace(TEMPLATE_INTERPOLATE, templateReplacer);
  return _path2.default.join(dirname, `${basename}${ext ? `.${ext}` : ''}`);
}

/**
 * @param {object}        [options]
 * @param {number}        [options.mode=0o777]
 * @param {Array<object>} [children]
 * @return {object} dir props
 */
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

/**
 * @param {object} [options]
 * @param {string} [options.data='']
 * @param {string} [options.encoding=utf8]
 * @param {number} [options.mode=0o666]
 * @return {object} file props
 */
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

// auto clean up

process.on('exit', cleanup);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9pbmRleC5qcyJdLCJuYW1lcyI6WyJjbGVhbnVwIiwiZmlsZXBhdGgiLCJkaXIiLCJmaWxlIiwiRU1QVFlfU1RSSU5HIiwiREVGQVVMVF9ESVJfTU9ERSIsIkRFRkFVTFRfRU5DT0RJTkciLCJERUZBVUxUX0ZJTEVfTU9ERSIsIkRFRkFVTFRfTkFNRSIsIlRNUF9ESVIiLCJESUdJVCIsIldPUkQiLCJURU1QTEFURV9JTlRFUlBPTEFURSIsInNhbXBsZSIsImFycmF5IiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwibGVuZ3RoIiwidGVtcGxhdGVDaGFycyIsImQiLCJ3IiwieCIsInRlbXBYIiwibW92ZVRvIiwidG9UZW1wRGlyIiwibW92ZSIsImZyb21UZW1wIiwibmV3RmlsZXBhdGgiLCJwYXRoIiwiam9pbiIsImJhc2VuYW1lIiwiZnMiLCJyZW5hbWVTeW5jIiwiY2hpbGRyZW4iLCJtYXAiLCJ0ZW1wbGF0ZVJlcGxhY2VyIiwibWF0Y2giLCJpbm5lck1hdGNoIiwic3BsaXQiLCJjaGFyIiwiY2hhcnMiLCJ0b0xvd2VyQ2FzZSIsIkVycm9yIiwiT2JqZWN0Iiwia2V5cyIsInRtcERpciIsIm9zIiwidG1wZGlyIiwicmVwbGFjZSIsImZvckVhY2giLCJ0ZW1wRmlsZSIsImlzRmlsZSIsInVubGlua1N5bmMiLCJybWRpclN5bmMiLCJkaXJQYXRoIiwiZXh0IiwibmFtZSIsImRpcm5hbWUiLCJyZXNvbHZlIiwib3B0aW9ucyIsIkFycmF5IiwiaXNBcnJheSIsIm1vZGUiLCJ0ZW1wRGlyIiwiaXNEaXIiLCJhY2Nlc3NTeW5jIiwiRl9PSyIsImVyciIsImNvZGUiLCJwdXNoIiwicGFyZW50RGlyIiwibWtkaXJTeW5jIiwiZGF0YSIsImVuY29kaW5nIiwid3JpdGVGaWxlU3luYyIsInByb2Nlc3MiLCJvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7UUEwRWdCQSxPLEdBQUFBLE87UUFrQkFDLFEsR0FBQUEsUTtRQWdCQUMsRyxHQUFBQSxHO1FBd0NBQyxJLEdB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Q0FBV25CLFFBQVg7QUFDQSxNQUFJO0FBQ0ZuQixpQkFBR2tDLFVBQUgsQ0FBY0ssU0FBZCxFQUF5QnZDLGFBQUdtQyxJQUE1QjtBQUNELEdBRkQsQ0FFRSxPQUFPQyxHQUFQLEVBQVk7QUFDWixRQUFJQSxJQUFJQyxJQUFKLEtBQWEsUUFBakIsRUFBMkI7QUFDekIsWUFBTSxJQUFJMUIsS0FBSixDQUFXLG1CQUFrQjRCLFNBQVUsR0FBdkMsQ0FBTjtBQUNEO0FBQ0RyRSxRQUFJO0FBQ0ZBLFdBQUsyQixlQUFLNkIsT0FBTCxDQUFhYSxTQUFiLENBREg7QUFFRmQsWUFBTTVCLGVBQUtFLFFBQUwsQ0FBY3dDLFNBQWQ7QUFGSixLQUFKO0FBSUQ7QUFDRHZDLGVBQUcyQyxhQUFILENBQWlCeEIsU0FBU2xELFFBQTFCLEVBQW9Dd0UsSUFBcEMsRUFBMEMsRUFBRUMsUUFBRixFQUFZWCxJQUFaLEVBQTFDO0FBQ0EsU0FBT1osUUFBUDtBQUNEOztBQUVEOztBQUVBeUIsUUFBUUMsRUFBUixDQUFXLE1BQVgsRUFBbUI3RSxPQUFuQiIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgb3MgZnJvbSAnb3MnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmltcG9ydCByYW5kb21TdHJpbmcgZnJvbSAnY3J5cHRvLXJhbmRvbS1zdHJpbmcnO1xuXG4vLyBjb25zdGFudHNcblxuY29uc3QgRU1QVFlfU1RSSU5HID0gJyc7XG5cbmNvbnN0IERFRkFVTFRfRElSX01PREUgPSAwbzc3NztcbmNvbnN0IERFRkFVTFRfRU5DT0RJTkcgPSAndXRmOCc7XG5jb25zdCBERUZBVUxUX0ZJTEVfTU9ERSA9IDBvNjY2O1xuY29uc3QgREVGQVVMVF9OQU1FID0gJ3RlbXBvcmFyaWx5LXtXV1dXRERERH0nO1xuY29uc3QgVE1QX0RJUiA9ICd0ZW1wb3JhcmlseS17WFhYWFhYWFh9JztcblxuY29uc3QgRElHSVQgPSAnMTIzNDU2Nzg5MCc7XG5jb25zdCBXT1JEID0gJ2FiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVonO1xuXG5jb25zdCBURU1QTEFURV9JTlRFUlBPTEFURSA9IC9cXHsoW159XSspXFx9L2c7XG5cbi8vIHV0aWxzXG5cbmNvbnN0IHNhbXBsZSA9IChhcnJheSkgPT4gYXJyYXlbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyYXkubGVuZ3RoKV07XG5cbi8vIHByaXZhdGVcblxuY29uc3QgdGVtcGxhdGVDaGFycyA9IHtcbiAgLyogZXNsaW50LWRpc2FibGUgaWQtbGVuZ3RoICovXG4gIGQ6ICgpID0+IHNhbXBsZShESUdJVCksXG4gIHc6ICgpID0+IHNhbXBsZShXT1JEKSxcbiAgeDogKCkgPT4gcmFuZG9tU3RyaW5nKDEpLFxuICAvKiBlc2xpbnQtZW5hYmxlIGlkLWxlbmd0aCAqL1xufTtcblxuY29uc3QgdGVtcFggPSBbXTtcblxuY29uc3QgbW92ZVRvID0gKHRvVGVtcERpciwgbW92ZSA9IHRydWUpID0+IChmcm9tVGVtcCkgPT4ge1xuICAvKiBlc2xpbnQtZGlzYWJsZSBuby1wYXJhbS1yZWFzc2lnbiAqL1xuICBjb25zdCBuZXdGaWxlcGF0aCA9IHBhdGguam9pbihcbiAgICB0b1RlbXBEaXIuZmlsZXBhdGgsXG4gICAgcGF0aC5iYXNlbmFtZShmcm9tVGVtcC5maWxlcGF0aCksXG4gICk7XG4gIGlmIChtb3ZlKSB7XG4gICAgZnMucmVuYW1lU3luYyhmcm9tVGVtcC5maWxlcGF0aCwgbmV3RmlsZXBhdGgpO1xuICB9XG4gIGZyb21UZW1wLmZpbGVwYXRoID0gbmV3RmlsZXBhdGg7XG4gIGlmIChmcm9tVGVtcC5jaGlsZHJlbikge1xuICAgIGZyb21UZW1wLmNoaWxkcmVuID0gZnJvbVRlbXAuY2hpbGRyZW4ubWFwKG1vdmVUbyhmcm9tVGVtcCwgZmFsc2UpKTtcbiAgfVxuICByZXR1cm4gZnJvbVRlbXA7XG59O1xuXG5jb25zdCB0ZW1wbGF0ZVJlcGxhY2VyID0gKG1hdGNoLCBpbm5lck1hdGNoKSA9PlxuICBpbm5lck1hdGNoXG4gICAgLnNwbGl0KEVNUFRZX1NUUklORylcbiAgICAubWFwKChjaGFyKSA9PiB7XG4gICAgICBjb25zdCBjaGFycyA9IHRlbXBsYXRlQ2hhcnNbY2hhci50b0xvd2VyQ2FzZSgpXTtcbiAgICAgIGlmICghY2hhcnMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBFeHBlY3RlZCB0ZW1wbGF0ZSBwbGFjZWhvbGRlciB0byBiZSBvbmUgb2Y6ICR7T2JqZWN0LmtleXMoXG4gICAgICAgICAgICB0ZW1wbGF0ZUNoYXJzLFxuICAgICAgICAgICkuam9pbignLCAnKX0uIFJlY2VpdmVkICR7Y2hhcn1gLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNoYXJzKCk7XG4gICAgfSlcbiAgICAuam9pbihFTVBUWV9TVFJJTkcpO1xuXG5jb25zdCB0bXBEaXIgPSAoKSA9PiBwYXRoLmpvaW4ob3MudG1wZGlyKCksIFRNUF9ESVIucmVwbGFjZShURU1QTEFURV9JTlRFUlBPTEFURSwgdGVtcGxhdGVSZXBsYWNlcikpO1xuXG4vLyBleHBvcnRzXG5cbi8qKiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsZWFudXAoKSB7XG4gIHRlbXBYLmZvckVhY2goKHRlbXBGaWxlKSA9PiB7XG4gICAgaWYgKHRlbXBGaWxlLmlzRmlsZSkge1xuICAgICAgZnMudW5saW5rU3luYyh0ZW1wRmlsZS5maWxlcGF0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZzLnJtZGlyU3luYyh0ZW1wRmlsZS5maWxlcGF0aCk7XG4gICAgfVxuICB9KTtcbiAgdGVtcFgubGVuZ3RoID0gMDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGlyPW9zLnRtcGRpcl1cbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5leHRdXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMubmFtZT10ZW1wb3JhcmlseS17V1dXV0RERER9XVxuICogQHJldHVybiB7c3RyaW5nfSBmaWxlcGF0aFxuICovXG5leHBvcnQgZnVuY3Rpb24gZmlsZXBhdGgoe1xuICBkaXI6IGRpclBhdGggPSB0bXBEaXIoKSxcbiAgZXh0ID0gbnVsbCxcbiAgbmFtZSA9IERFRkFVTFRfTkFNRSxcbn0gPSB7fSkge1xuICBjb25zdCBkaXJuYW1lID0gcGF0aC5yZXNvbHZlKGRpclBhdGgpO1xuICBjb25zdCBiYXNlbmFtZSA9IG5hbWUucmVwbGFjZShURU1QTEFURV9JTlRFUlBPTEFURSwgdGVtcGxhdGVSZXBsYWNlcik7XG4gIHJldHVybiBwYXRoLmpvaW4oZGlybmFtZSwgYCR7YmFzZW5hbWV9JHtleHQgPyBgLiR7ZXh0fWAgOiAnJ31gKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge29iamVjdH0gICAgICAgIFtvcHRpb25zXVxuICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbb3B0aW9ucy5tb2RlPTBvNzc3XVxuICogQHBhcmFtIHtBcnJheTxvYmplY3Q+fSBbY2hpbGRyZW5dXG4gKiBAcmV0dXJuIHtvYmplY3R9IGRpciBwcm9wc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlyKG9wdGlvbnMgPSB7fSwgY2hpbGRyZW4gPSBbXSkge1xuICBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zKSkge1xuICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLXBhcmFtLXJlYXNzaWduICovXG4gICAgY2hpbGRyZW4gPSBvcHRpb25zO1xuICAgIG9wdGlvbnMgPSB7fTtcbiAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLXBhcmFtLXJlYXNzaWduICovXG4gIH1cbiAgY29uc3QgeyBtb2RlID0gREVGQVVMVF9ESVJfTU9ERSB9ID0gb3B0aW9ucztcbiAgY29uc3QgdGVtcERpciA9IHtcbiAgICBmaWxlcGF0aDogZmlsZXBhdGgob3B0aW9ucyksXG4gICAgaXNEaXI6IHRydWUsXG4gICAgbW9kZSxcbiAgfTtcbiAgdHJ5IHtcbiAgICBmcy5hY2Nlc3NTeW5jKHRlbXBEaXIuZmlsZXBhdGgsIGZzLkZfT0spO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoZXJyLmNvZGUgIT09ICdFTk9FTlQnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBjaGVjayAke3RlbXBEaXIuZmlsZXBhdGh9LmApO1xuICAgIH1cbiAgICB0ZW1wWC5wdXNoKHRlbXBEaXIpO1xuICAgIGNvbnN0IHBhcmVudERpciA9IHBhdGguZGlybmFtZSh0ZW1wRGlyLmZpbGVwYXRoKTtcbiAgICBkaXIoe1xuICAgICAgZGlyOiBwYXRoLmRpcm5hbWUocGFyZW50RGlyKSxcbiAgICAgIG5hbWU6IHBhdGguYmFzZW5hbWUocGFyZW50RGlyKSxcbiAgICB9KTtcbiAgICBmcy5ta2RpclN5bmModGVtcERpci5maWxlcGF0aCwgbW9kZSk7XG4gIH1cbiAgaWYgKGNoaWxkcmVuLmxlbmd0aCAhPT0gMCkge1xuICAgIHRlbXBEaXIuY2hpbGRyZW4gPSBjaGlsZHJlbi5tYXAobW92ZVRvKHRlbXBEaXIpKTtcbiAgfVxuICByZXR1cm4gdGVtcERpcjtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGF0YT0nJ11cbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5lbmNvZGluZz11dGY4XVxuICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1vZGU9MG82NjZdXG4gKiBAcmV0dXJuIHtvYmplY3R9IGZpbGUgcHJvcHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbGUob3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IHtcbiAgICBkYXRhID0gJycsXG4gICAgZW5jb2RpbmcgPSBERUZBVUxUX0VOQ09ESU5HLFxuICAgIG1vZGUgPSBERUZBVUxUX0ZJTEVfTU9ERSxcbiAgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IHRlbXBGaWxlID0ge1xuICAgIGRhdGEsXG4gICAgZmlsZXBhdGg6IGZpbGVwYXRoKG9wdGlvbnMpLFxuICAgIGlzRmlsZTogdHJ1ZSxcbiAgICBtb2RlLFxuICB9O1xuICBjb25zdCBwYXJlbnREaXIgPSBwYXRoLmRpcm5hbWUodGVtcEZpbGUuZmlsZXBhdGgpO1xuICB0ZW1wWC5wdXNoKHRlbXBGaWxlKTtcbiAgdHJ5IHtcbiAgICBmcy5hY2Nlc3NTeW5jKHBhcmVudERpciwgZnMuRl9PSyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmIChlcnIuY29kZSAhPT0gJ0VOT0VOVCcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IGNoZWNrICR7cGFyZW50RGlyfS5gKTtcbiAgICB9XG4gICAgZGlyKHtcbiAgICAgIGRpcjogcGF0aC5kaXJuYW1lKHBhcmVudERpciksXG4gICAgICBuYW1lOiBwYXRoLmJhc2VuYW1lKHBhcmVudERpciksXG4gICAgfSk7XG4gIH1cbiAgZnMud3JpdGVGaWxlU3luYyh0ZW1wRmlsZS5maWxlcGF0aCwgZGF0YSwgeyBlbmNvZGluZywgbW9kZSB9KTtcbiAgcmV0dXJuIHRlbXBGaWxlO1xufVxuXG4vLyBhdXRvIGNsZWFuIHVwXG5cbnByb2Nlc3Mub24oJ2V4aXQnLCBjbGVhbnVwKTtcbiJdfQ==