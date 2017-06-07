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
  tempX.push(tempFile);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9pbmRleC5qcyJdLCJuYW1lcyI6WyJjbGVhbnVwIiwiZGlyIiwiZmlsZSIsImZpbGVwYXRoIiwiRU1QVFlfU1RSSU5HIiwiREVGQVVMVF9ESVJfTU9ERSIsIkRFRkFVTFRfRU5DT0RJTkciLCJERUZBVUxUX0ZJTEVfTU9ERSIsIkRFRkFVTFRfTkFNRSIsIkRJR0lUIiwiV09SRCIsIlRFTVBMQVRFX0lOVEVSUE9MQVRFIiwidGVtcGxhdGVDaGFycyIsImQiLCJ3IiwidGVtcFgiLCJtb3ZlVG8iLCJ0b1RlbXBEaXIiLCJtb3ZlIiwiZnJvbVRlbXAiLCJuZXdGaWxlcGF0aCIsImpvaW4iLCJiYXNlbmFtZSIsInJlbmFtZVN5bmMiLCJjaGlsZHJlbiIsIm1hcCIsInJhbmRvbSIsImNoYXJzIiwiTWF0aCIsImZsb29yIiwibGVuZ3RoIiwidGVtcGxhdGVSZXBsYWNlciIsIm1hdGNoIiwiaW5uZXJNYXRjaCIsInNwbGl0IiwiY2hhciIsInRvTG93ZXJDYXNlIiwiRXJyb3IiLCJPYmplY3QiLCJrZXlzIiwicHJvY2VzcyIsIm9uIiwiZm9yRWFjaCIsInRlbXBGaWxlIiwiaXNGaWxlIiwidW5saW5rU3luYyIsInJtZGlyIiwib3B0aW9ucyIsIkFycmF5IiwiaXNBcnJheSIsIm1vZGUiLCJ0ZW1wRGlyIiwiaXNEaXIiLCJhY2Nlc3NTeW5jIiwiRl9PSyIsImVyciIsImNvZGUiLCJwdXNoIiwicGFyZW50RGlyIiwiZGlybmFtZSIsIm5hbWUiLCJta2RpclN5bmMiLCJkYXRhIiwiZW5jb2RpbmciLCJ3cml0ZUZpbGVTeW5jIiwiZGlyUGF0aCIsInRtcGRpciIsImV4dCIsInJlc29sdmUiLCJyZXBsYWNlIl0sIm1hcHBpbmdzIjoiOzs7OztRQTZEZ0JBLE8sR0FBQUEsTztRQVdBQyxHLEdBQUFBLEc7UUFpQ0FDLEksR0FBQUEsSTtRQTZCQUMsUSxHQUFBQSxROztBQXRJaEI7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7QUFFQTs7QUFFQSxJQUFNQyxlQUFlLEVBQXJC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QUFPLElBQUdBLEdBQUksRUFBZCxHQUFrQixFQUFHLEVBQXRELENBQVA7QUFDRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgb3MgZnJvbSAnb3MnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbi8vIGNvbnN0YW50c1xuXG5jb25zdCBFTVBUWV9TVFJJTkcgPSAnJztcblxuY29uc3QgREVGQVVMVF9ESVJfTU9ERSA9IDBvNzc3O1xuY29uc3QgREVGQVVMVF9FTkNPRElORyA9ICd1dGY4JztcbmNvbnN0IERFRkFVTFRfRklMRV9NT0RFID0gMG82NjY7XG5jb25zdCBERUZBVUxUX05BTUUgPSAndGVtcG9yYXJpbHkte1dXV1dEREREfSc7XG5cbmNvbnN0IERJR0lUID0gJzEyMzQ1Njc4OTAnO1xuY29uc3QgV09SRCA9ICdhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ekFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaJztcblxuY29uc3QgVEVNUExBVEVfSU5URVJQT0xBVEUgPSAvXFx7KFtefV0rKVxcfS9nO1xuXG4vLyBwcml2YXRlXG5cbmNvbnN0IHRlbXBsYXRlQ2hhcnMgPSB7XG4gIC8qIGVzbGludC1kaXNhYmxlIGlkLWxlbmd0aCAqL1xuICBkOiBESUdJVCxcbiAgdzogV09SRCxcbiAgLyogZXNsaW50LWVuYWJsZSBpZC1sZW5ndGggKi9cbn07XG5cbmNvbnN0IHRlbXBYID0gW107XG5cbmNvbnN0IG1vdmVUbyA9ICh0b1RlbXBEaXIsIG1vdmUgPSB0cnVlKSA9PiAoZnJvbVRlbXApID0+IHtcbiAgY29uc3QgbmV3RmlsZXBhdGggPSBwYXRoLmpvaW4odG9UZW1wRGlyLmZpbGVwYXRoLCBwYXRoLmJhc2VuYW1lKGZyb21UZW1wLmZpbGVwYXRoKSk7XG4gIGlmIChtb3ZlKSB7XG4gICAgZnMucmVuYW1lU3luYyhmcm9tVGVtcC5maWxlcGF0aCwgbmV3RmlsZXBhdGgpO1xuICB9XG4gIGZyb21UZW1wLmZpbGVwYXRoID0gbmV3RmlsZXBhdGg7XG4gIGlmIChmcm9tVGVtcC5jaGlsZHJlbikge1xuICAgIGZyb21UZW1wLmNoaWxkcmVuID0gZnJvbVRlbXAuY2hpbGRyZW4ubWFwKG1vdmVUbyhmcm9tVGVtcCwgZmFsc2UpKTtcbiAgfVxuICByZXR1cm4gZnJvbVRlbXA7XG59O1xuXG5jb25zdCByYW5kb20gPSAoY2hhcnMpID0+IGNoYXJzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGNoYXJzLmxlbmd0aCldO1xuXG5jb25zdCB0ZW1wbGF0ZVJlcGxhY2VyID0gKG1hdGNoLCBpbm5lck1hdGNoKSA9PiBpbm5lck1hdGNoXG4gIC5zcGxpdChFTVBUWV9TVFJJTkcpXG4gIC5tYXAoKGNoYXIpID0+IHtcbiAgICBjb25zdCBjaGFycyA9IHRlbXBsYXRlQ2hhcnNbY2hhci50b0xvd2VyQ2FzZSgpXTtcbiAgICBpZiAoIWNoYXJzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIHRlbXBsYXRlIHBsYWNlaG9sZGVyIHRvIGJlIG9uZSBvZjogJHtPYmplY3Qua2V5cyh0ZW1wbGF0ZUNoYXJzKS5qb2luKCcsICcpfS4gUmVjZWl2ZWQgJHtjaGFyfWApO1xuICAgIH1cbiAgICByZXR1cm4gcmFuZG9tKGNoYXJzKTtcbiAgfSlcbiAgLmpvaW4oRU1QVFlfU1RSSU5HKVxuO1xuXG4vLyBhdXRvIGNsZWFuIHVwXG5cbnByb2Nlc3Mub24oJ2V4aXQnLCBjbGVhbnVwKTtcblxuLy8gZXhwb3J0c1xuXG5leHBvcnQgZnVuY3Rpb24gY2xlYW51cCgpIHtcbiAgdGVtcFguZm9yRWFjaCgodGVtcEZpbGUpID0+IHtcbiAgICBpZiAodGVtcEZpbGUuaXNGaWxlKSB7XG4gICAgICBmcy51bmxpbmtTeW5jKHRlbXBGaWxlLmZpbGVwYXRoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZnMucm1kaXIodGVtcEZpbGUuZmlsZXBhdGgpO1xuICAgIH1cbiAgfSk7XG4gIHRlbXBYLmxlbmd0aCA9IDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkaXIob3B0aW9ucyA9IHt9LCBjaGlsZHJlbiA9IFtdKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMpKSB7XG4gICAgLyogZXNsaW50LWRpc2FibGUgbm8tcGFyYW0tcmVhc3NpZ24gKi9cbiAgICBjaGlsZHJlbiA9IG9wdGlvbnM7XG4gICAgb3B0aW9ucyA9IHt9O1xuICAgIC8qIGVzbGludC1lbmFibGUgbm8tcGFyYW0tcmVhc3NpZ24gKi9cbiAgfVxuICBjb25zdCB7IG1vZGUgPSBERUZBVUxUX0RJUl9NT0RFIH0gPSBvcHRpb25zO1xuICBjb25zdCB0ZW1wRGlyID0ge1xuICAgIGZpbGVwYXRoOiBmaWxlcGF0aChvcHRpb25zKSxcbiAgICBpc0RpcjogdHJ1ZSxcbiAgICBtb2RlLFxuICB9O1xuICB0cnkge1xuICAgIGZzLmFjY2Vzc1N5bmModGVtcERpci5maWxlcGF0aCwgZnMuRl9PSyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmIChlcnIuY29kZSAhPT0gJ0VOT0VOVCcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IGNoZWNrICR7dGVtcERpci5maWxlcGF0aH0uYCk7XG4gICAgfVxuICAgIHRlbXBYLnB1c2godGVtcERpcik7XG4gICAgY29uc3QgcGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKHRlbXBEaXIuZmlsZXBhdGgpO1xuICAgIGRpcih7XG4gICAgICBkaXI6IHBhdGguZGlybmFtZShwYXJlbnREaXIpLFxuICAgICAgbmFtZTogcGF0aC5iYXNlbmFtZShwYXJlbnREaXIpLFxuICAgIH0pO1xuICAgIGZzLm1rZGlyU3luYyh0ZW1wRGlyLmZpbGVwYXRoLCBtb2RlKTtcbiAgfVxuICBpZiAoY2hpbGRyZW4ubGVuZ3RoICE9PSAwKSB7XG4gICAgdGVtcERpci5jaGlsZHJlbiA9IGNoaWxkcmVuLm1hcChtb3ZlVG8odGVtcERpcikpO1xuICB9XG4gIHJldHVybiB0ZW1wRGlyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmlsZShvcHRpb25zID0ge30pIHtcbiAgY29uc3Qge1xuICAgIGRhdGEgPSAnJyxcbiAgICBlbmNvZGluZyA9IERFRkFVTFRfRU5DT0RJTkcsXG4gICAgbW9kZSA9IERFRkFVTFRfRklMRV9NT0RFLFxuICB9ID0gb3B0aW9ucztcbiAgY29uc3QgdGVtcEZpbGUgPSB7XG4gICAgZGF0YSxcbiAgICBmaWxlcGF0aDogZmlsZXBhdGgob3B0aW9ucyksXG4gICAgaXNGaWxlOiB0cnVlLFxuICAgIG1vZGUsXG4gIH07XG4gIGNvbnN0IHBhcmVudERpciA9IHBhdGguZGlybmFtZSh0ZW1wRmlsZS5maWxlcGF0aCk7XG4gIHRyeSB7XG4gICAgZnMuYWNjZXNzU3luYyhwYXJlbnREaXIsIGZzLkZfT0spO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoZXJyLmNvZGUgIT09ICdFTk9FTlQnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBjaGVjayAke3BhcmVudERpcn0uYCk7XG4gICAgfVxuICAgIGRpcih7XG4gICAgICBkaXI6IHBhdGguZGlybmFtZShwYXJlbnREaXIpLFxuICAgICAgbmFtZTogcGF0aC5iYXNlbmFtZShwYXJlbnREaXIpLFxuICAgIH0pO1xuICB9XG4gIGZzLndyaXRlRmlsZVN5bmModGVtcEZpbGUuZmlsZXBhdGgsIGRhdGEsIHsgZW5jb2RpbmcsIG1vZGUgfSk7XG4gIHRlbXBYLnB1c2godGVtcEZpbGUpO1xuICByZXR1cm4gdGVtcEZpbGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaWxlcGF0aCh7XG4gIGRpcjogZGlyUGF0aCA9IG9zLnRtcGRpcigpLFxuICBleHQgPSBudWxsLFxuICBuYW1lID0gREVGQVVMVF9OQU1FLFxufSA9IHt9KSB7XG4gIGNvbnN0IGRpcm5hbWUgPSBwYXRoLnJlc29sdmUoZGlyUGF0aCk7XG4gIGNvbnN0IGJhc2VuYW1lID0gbmFtZS5yZXBsYWNlKFRFTVBMQVRFX0lOVEVSUE9MQVRFLCB0ZW1wbGF0ZVJlcGxhY2VyKTtcbiAgcmV0dXJuIHBhdGguam9pbihkaXJuYW1lLCBgJHtiYXNlbmFtZX0ke2V4dCA/IGAuJHtleHR9YCA6ICcnfWApO1xufVxuIl19