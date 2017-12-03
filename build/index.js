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

/** */
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
      dirPath = _ref$dir === undefined ? _os2.default.tmpdir() : _ref$dir,
      _ref$ext = _ref.ext,
      ext = _ref$ext === undefined ? null : _ref$ext,
      _ref$name = _ref.name,
      name = _ref$name === undefined ? DEFAULT_NAME : _ref$name;

  var dirname = _path2.default.resolve(dirPath);
  var basename = name.replace(TEMPLATE_INTERPOLATE, templateReplacer);
  return _path2.default.join(dirname, `${basename}${ext ? `.${ext}` : ''}`);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9pbmRleC5qcyJdLCJuYW1lcyI6WyJjbGVhbnVwIiwiZGlyIiwiZmlsZSIsImZpbGVwYXRoIiwiRU1QVFlfU1RSSU5HIiwiREVGQVVMVF9ESVJfTU9ERSIsIkRFRkFVTFRfRU5DT0RJTkciLCJERUZBVUxUX0ZJTEVfTU9ERSIsIkRFRkFVTFRfTkFNRSIsIkRJR0lUIiwiV09SRCIsIlRFTVBMQVRFX0lOVEVSUE9MQVRFIiwidGVtcGxhdGVDaGFycyIsImQiLCJ3IiwidGVtcFgiLCJtb3ZlVG8iLCJ0b1RlbXBEaXIiLCJtb3ZlIiwiZnJvbVRlbXAiLCJuZXdGaWxlcGF0aCIsImpvaW4iLCJiYXNlbmFtZSIsInJlbmFtZVN5bmMiLCJjaGlsZHJlbiIsIm1hcCIsInJhbmRvbSIsImNoYXJzIiwiTWF0aCIsImZsb29yIiwibGVuZ3RoIiwidGVtcGxhdGVSZXBsYWNlciIsIm1hdGNoIiwiaW5uZXJNYXRjaCIsInNwbGl0IiwiY2hhciIsInRvTG93ZXJDYXNlIiwiRXJyb3IiLCJPYmplY3QiLCJrZXlzIiwicHJvY2VzcyIsIm9uIiwiZm9yRWFjaCIsInRlbXBGaWxlIiwiaXNGaWxlIiwidW5saW5rU3luYyIsInJtZGlyIiwib3B0aW9ucyIsIkFycmF5IiwiaXNBcnJheSIsIm1vZGUiLCJ0ZW1wRGlyIiwiaXNEaXIiLCJhY2Nlc3NTeW5jIiwiRl9PSyIsImVyciIsImNvZGUiLCJwdXNoIiwicGFyZW50RGlyIiwiZGlybmFtZSIsIm5hbWUiLCJta2RpclN5bmMiLCJkYXRhIiwiZW5jb2RpbmciLCJ3cml0ZUZpbGVTeW5jIiwiZGlyUGF0aCIsInRtcGRpciIsImV4dCIsInJlc29sdmUiLCJyZXBsYWNlIl0sIm1hcHBpbmdzIjoiOzs7OztRQThEZ0JBLE8sR0FBQUEsTztRQWlCQUMsRyxHQUFBQSxHO1FBd0NBQyxJLEdBQUFBLEk7UUFvQ0FDLFEsR0FBQUEsUTs7QUEzSmhCOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBRUE7O0FBRUEsSUFBTUMsZUFBZSxFQUFy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QVVzQyxPQUFWLEVBQW9CLEdBQUVyQyxRQUFTLEdBQUU2QyxNQUFPLElBQUdBLEdBQUksRUFBZCxHQUFrQixFQUFHLEVBQXRELENBQVA7QUFDRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgb3MgZnJvbSAnb3MnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbi8vIGNvbnN0YW50c1xuXG5jb25zdCBFTVBUWV9TVFJJTkcgPSAnJztcblxuY29uc3QgREVGQVVMVF9ESVJfTU9ERSA9IDBvNzc3O1xuY29uc3QgREVGQVVMVF9FTkNPRElORyA9ICd1dGY4JztcbmNvbnN0IERFRkFVTFRfRklMRV9NT0RFID0gMG82NjY7XG5jb25zdCBERUZBVUxUX05BTUUgPSAndGVtcG9yYXJpbHkte1dXV1dEREREfSc7XG5cbmNvbnN0IERJR0lUID0gJzEyMzQ1Njc4OTAnO1xuY29uc3QgV09SRCA9ICdhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ekFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaJztcblxuY29uc3QgVEVNUExBVEVfSU5URVJQT0xBVEUgPSAvXFx7KFtefV0rKVxcfS9nO1xuXG4vLyBwcml2YXRlXG5cbmNvbnN0IHRlbXBsYXRlQ2hhcnMgPSB7XG4gIC8qIGVzbGludC1kaXNhYmxlIGlkLWxlbmd0aCAqL1xuICBkOiBESUdJVCxcbiAgdzogV09SRCxcbiAgLyogZXNsaW50LWVuYWJsZSBpZC1sZW5ndGggKi9cbn07XG5cbmNvbnN0IHRlbXBYID0gW107XG5cbmNvbnN0IG1vdmVUbyA9ICh0b1RlbXBEaXIsIG1vdmUgPSB0cnVlKSA9PiAoZnJvbVRlbXApID0+IHtcbiAgY29uc3QgbmV3RmlsZXBhdGggPSBwYXRoLmpvaW4odG9UZW1wRGlyLmZpbGVwYXRoLCBwYXRoLmJhc2VuYW1lKGZyb21UZW1wLmZpbGVwYXRoKSk7XG4gIGlmIChtb3ZlKSB7XG4gICAgZnMucmVuYW1lU3luYyhmcm9tVGVtcC5maWxlcGF0aCwgbmV3RmlsZXBhdGgpO1xuICB9XG4gIGZyb21UZW1wLmZpbGVwYXRoID0gbmV3RmlsZXBhdGg7XG4gIGlmIChmcm9tVGVtcC5jaGlsZHJlbikge1xuICAgIGZyb21UZW1wLmNoaWxkcmVuID0gZnJvbVRlbXAuY2hpbGRyZW4ubWFwKG1vdmVUbyhmcm9tVGVtcCwgZmFsc2UpKTtcbiAgfVxuICByZXR1cm4gZnJvbVRlbXA7XG59O1xuXG5jb25zdCByYW5kb20gPSAoY2hhcnMpID0+IGNoYXJzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGNoYXJzLmxlbmd0aCldO1xuXG5jb25zdCB0ZW1wbGF0ZVJlcGxhY2VyID0gKG1hdGNoLCBpbm5lck1hdGNoKSA9PiBpbm5lck1hdGNoXG4gIC5zcGxpdChFTVBUWV9TVFJJTkcpXG4gIC5tYXAoKGNoYXIpID0+IHtcbiAgICBjb25zdCBjaGFycyA9IHRlbXBsYXRlQ2hhcnNbY2hhci50b0xvd2VyQ2FzZSgpXTtcbiAgICBpZiAoIWNoYXJzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIHRlbXBsYXRlIHBsYWNlaG9sZGVyIHRvIGJlIG9uZSBvZjogJHtPYmplY3Qua2V5cyh0ZW1wbGF0ZUNoYXJzKS5qb2luKCcsICcpfS4gUmVjZWl2ZWQgJHtjaGFyfWApO1xuICAgIH1cbiAgICByZXR1cm4gcmFuZG9tKGNoYXJzKTtcbiAgfSlcbiAgLmpvaW4oRU1QVFlfU1RSSU5HKVxuO1xuXG4vLyBhdXRvIGNsZWFuIHVwXG5cbnByb2Nlc3Mub24oJ2V4aXQnLCBjbGVhbnVwKTtcblxuLy8gZXhwb3J0c1xuXG4vKiogKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGVhbnVwKCkge1xuICB0ZW1wWC5mb3JFYWNoKCh0ZW1wRmlsZSkgPT4ge1xuICAgIGlmICh0ZW1wRmlsZS5pc0ZpbGUpIHtcbiAgICAgIGZzLnVubGlua1N5bmModGVtcEZpbGUuZmlsZXBhdGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBmcy5ybWRpcih0ZW1wRmlsZS5maWxlcGF0aCk7XG4gICAgfVxuICB9KTtcbiAgdGVtcFgubGVuZ3RoID0gMDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge29iamVjdH0gICAgICAgIFtvcHRpb25zXVxuICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbb3B0aW9ucy5tb2RlPTBvNzc3XVxuICogQHBhcmFtIHtBcnJheTxvYmplY3Q+fSBbY2hpbGRyZW5dXG4gKiBAcmV0dXJuIHtvYmplY3R9IGRpciBwcm9wc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlyKG9wdGlvbnMgPSB7fSwgY2hpbGRyZW4gPSBbXSkge1xuICBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zKSkge1xuICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLXBhcmFtLXJlYXNzaWduICovXG4gICAgY2hpbGRyZW4gPSBvcHRpb25zO1xuICAgIG9wdGlvbnMgPSB7fTtcbiAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLXBhcmFtLXJlYXNzaWduICovXG4gIH1cbiAgY29uc3QgeyBtb2RlID0gREVGQVVMVF9ESVJfTU9ERSB9ID0gb3B0aW9ucztcbiAgY29uc3QgdGVtcERpciA9IHtcbiAgICBmaWxlcGF0aDogZmlsZXBhdGgob3B0aW9ucyksXG4gICAgaXNEaXI6IHRydWUsXG4gICAgbW9kZSxcbiAgfTtcbiAgdHJ5IHtcbiAgICBmcy5hY2Nlc3NTeW5jKHRlbXBEaXIuZmlsZXBhdGgsIGZzLkZfT0spO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoZXJyLmNvZGUgIT09ICdFTk9FTlQnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBjaGVjayAke3RlbXBEaXIuZmlsZXBhdGh9LmApO1xuICAgIH1cbiAgICB0ZW1wWC5wdXNoKHRlbXBEaXIpO1xuICAgIGNvbnN0IHBhcmVudERpciA9IHBhdGguZGlybmFtZSh0ZW1wRGlyLmZpbGVwYXRoKTtcbiAgICBkaXIoe1xuICAgICAgZGlyOiBwYXRoLmRpcm5hbWUocGFyZW50RGlyKSxcbiAgICAgIG5hbWU6IHBhdGguYmFzZW5hbWUocGFyZW50RGlyKSxcbiAgICB9KTtcbiAgICBmcy5ta2RpclN5bmModGVtcERpci5maWxlcGF0aCwgbW9kZSk7XG4gIH1cbiAgaWYgKGNoaWxkcmVuLmxlbmd0aCAhPT0gMCkge1xuICAgIHRlbXBEaXIuY2hpbGRyZW4gPSBjaGlsZHJlbi5tYXAobW92ZVRvKHRlbXBEaXIpKTtcbiAgfVxuICByZXR1cm4gdGVtcERpcjtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGF0YT0nJ11cbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5lbmNvZGluZz11dGY4XVxuICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1vZGU9MG82NjZdXG4gKiBAcmV0dXJuIHtvYmplY3R9IGZpbGUgcHJvcHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbGUob3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IHtcbiAgICBkYXRhID0gJycsXG4gICAgZW5jb2RpbmcgPSBERUZBVUxUX0VOQ09ESU5HLFxuICAgIG1vZGUgPSBERUZBVUxUX0ZJTEVfTU9ERSxcbiAgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IHRlbXBGaWxlID0ge1xuICAgIGRhdGEsXG4gICAgZmlsZXBhdGg6IGZpbGVwYXRoKG9wdGlvbnMpLFxuICAgIGlzRmlsZTogdHJ1ZSxcbiAgICBtb2RlLFxuICB9O1xuICBjb25zdCBwYXJlbnREaXIgPSBwYXRoLmRpcm5hbWUodGVtcEZpbGUuZmlsZXBhdGgpO1xuICB0ZW1wWC5wdXNoKHRlbXBGaWxlKTtcbiAgdHJ5IHtcbiAgICBmcy5hY2Nlc3NTeW5jKHBhcmVudERpciwgZnMuRl9PSyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmIChlcnIuY29kZSAhPT0gJ0VOT0VOVCcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IGNoZWNrICR7cGFyZW50RGlyfS5gKTtcbiAgICB9XG4gICAgZGlyKHtcbiAgICAgIGRpcjogcGF0aC5kaXJuYW1lKHBhcmVudERpciksXG4gICAgICBuYW1lOiBwYXRoLmJhc2VuYW1lKHBhcmVudERpciksXG4gICAgfSk7XG4gIH1cbiAgZnMud3JpdGVGaWxlU3luYyh0ZW1wRmlsZS5maWxlcGF0aCwgZGF0YSwgeyBlbmNvZGluZywgbW9kZSB9KTtcbiAgcmV0dXJuIHRlbXBGaWxlO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5kaXI9b3MudG1wZGlyXVxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmV4dF1cbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5uYW1lPXRlbXBvcmFyaWx5LXtXV1dXRERERH1dXG4gKiBAcmV0dXJuIHtzdHJpbmd9IGZpbGVwYXRoXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaWxlcGF0aCh7XG4gIGRpcjogZGlyUGF0aCA9IG9zLnRtcGRpcigpLFxuICBleHQgPSBudWxsLFxuICBuYW1lID0gREVGQVVMVF9OQU1FLFxufSA9IHt9KSB7XG4gIGNvbnN0IGRpcm5hbWUgPSBwYXRoLnJlc29sdmUoZGlyUGF0aCk7XG4gIGNvbnN0IGJhc2VuYW1lID0gbmFtZS5yZXBsYWNlKFRFTVBMQVRFX0lOVEVSUE9MQVRFLCB0ZW1wbGF0ZVJlcGxhY2VyKTtcbiAgcmV0dXJuIHBhdGguam9pbihkaXJuYW1lLCBgJHtiYXNlbmFtZX0ke2V4dCA/IGAuJHtleHR9YCA6ICcnfWApO1xufVxuIl19