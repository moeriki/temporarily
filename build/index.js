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
      _fs2.default.rmdirSync(tempFile.filepath);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9pbmRleC5qcyJdLCJuYW1lcyI6WyJjbGVhbnVwIiwiZGlyIiwiZmlsZSIsImZpbGVwYXRoIiwiRU1QVFlfU1RSSU5HIiwiREVGQVVMVF9ESVJfTU9ERSIsIkRFRkFVTFRfRU5DT0RJTkciLCJERUZBVUxUX0ZJTEVfTU9ERSIsIkRFRkFVTFRfTkFNRSIsIkRJR0lUIiwiV09SRCIsIlRFTVBMQVRFX0lOVEVSUE9MQVRFIiwidGVtcGxhdGVDaGFycyIsImQiLCJ3IiwidGVtcFgiLCJtb3ZlVG8iLCJ0b1RlbXBEaXIiLCJtb3ZlIiwiZnJvbVRlbXAiLCJuZXdGaWxlcGF0aCIsInBhdGgiLCJqb2luIiwiYmFzZW5hbWUiLCJmcyIsInJlbmFtZVN5bmMiLCJjaGlsZHJlbiIsIm1hcCIsInJhbmRvbSIsImNoYXJzIiwiTWF0aCIsImZsb29yIiwibGVuZ3RoIiwidGVtcGxhdGVSZXBsYWNlciIsIm1hdGNoIiwiaW5uZXJNYXRjaCIsInNwbGl0IiwiY2hhciIsInRvTG93ZXJDYXNlIiwiRXJyb3IiLCJPYmplY3QiLCJrZXlzIiwicHJvY2VzcyIsIm9uIiwiZm9yRWFjaCIsInRlbXBGaWxlIiwiaXNGaWxlIiwidW5saW5rU3luYyIsInJtZGlyU3luYyIsIm9wdGlvbnMiLCJBcnJheSIsImlzQXJyYXkiLCJtb2RlIiwidGVtcERpciIsImlzRGlyIiwiYWNjZXNzU3luYyIsIkZfT0siLCJlcnIiLCJjb2RlIiwicHVzaCIsInBhcmVudERpciIsImRpcm5hbWUiLCJuYW1lIiwibWtkaXJTeW5jIiwiZGF0YSIsImVuY29kaW5nIiwid3JpdGVGaWxlU3luYyIsImRpclBhdGgiLCJvcyIsInRtcGRpciIsImV4dCIsInJlc29sdmUiLCJyZXBsYWNlIl0sIm1hcHBpbmdzIjoiOzs7OztRQThEZ0JBLE8sR0FBQUEsTztRQWlCQUMsRyxHQUFBQSxHO1FBd0NBQyxJLEdBQUFBLEk7UUFvQ0FDLFEsR0FBQUEsUTs7QUEzSmhCOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBRUE7O0FBRUEsSUFBTUMsZUFBZSxFQUFyQjs7QUFFQSxJQUFNQyxtQkFBbUIsS0FBekI7QUFDQSxJQUFNQyxtQkFBbUIsTUFBekI7QUFDQSxJQUFNQyxvQkFBb0IsS0FBMUI7QUFDQSxJQUFNQyxlQUFlLHdCQUFyQjs7QUFFQSxJQUFNQyxRQUFRLFlBQWQ7QUFDQSxJQUFNQyxPQUFPLHNEQUFiOztBQUVBLElBQU1DLHVCQUF1QixjQUE3Qjs7QUFFQTs7QUFFQSxJQUFNQyxnQkFBZ0I7QUFDcEI7QUFDQUMsS0FBR0osS0FGaUI7QUFHcEJLLEtBQUdKO0FBQ0g7QUFKb0IsQ0FBdEI7O0FBT0EsSUFBTUssUUFBUSxFQUFkOztBQUVBLElBQU1DLFNBQVMsU0FBVEEsTUFBUyxDQUFDQyxTQUFEO0FBQUEsTUFBWUMsSUFBWix1RUFBbUIsSUFBbkI7QUFBQSxTQUE0QixVQUFDQyxRQUFELEVBQWM7QUFDdkQsUUFBTUMsY0FBY0MsZUFBS0MsSUFBTCxDQUFVTCxVQUFVZCxRQUFwQixFQUE4QmtCLGVBQUtFLFFBQUwsQ0FBY0osU0FBU2hCLFFBQXZCLENBQTlCLENBQXBCO0FBQ0EsUUFBSWUsSUFBSixFQUFVO0FBQ1JNLG1CQUFHQyxVQUFILENBQWNOLFNBQVNoQixRQUF2QixFQUFpQ2lCLFdBQWpDO0FBQ0Q7QUFDREQsYUFBU2hCLFFBQVQsR0FBb0JpQixXQUFwQjtBQUNBLFFBQUlELFNBQVNPLFFBQWIsRUFBdUI7QUFDckJQLGVBQVNPLFFBQVQsR0FBb0JQLFNBQVNPLFFBQVQsQ0FBa0JDLEdBQWxCLENBQXNCWCxPQUFPRyxRQUFQLEVBQWlCLEtBQWpCLENBQXRCLENBQXBCO0FBQ0Q7QUFDRCxXQUFPQSxRQUFQO0FBQ0QsR0FWYztBQUFBLENBQWY7O0FBWUEsSUFBTVMsU0FBUyxTQUFUQSxNQUFTLENBQUNDLEtBQUQ7QUFBQSxTQUFXQSxNQUFNQyxLQUFLQyxLQUFMLENBQVdELEtBQUtGLE1BQUwsS0FBZ0JDLE1BQU1HLE1BQWpDLENBQU4sQ0FBWDtBQUFBLENBQWY7O0FBRUEsSUFBTUMsbUJBQW1CLFNBQW5CQSxnQkFBbUIsQ0FBQ0MsS0FBRCxFQUFRQyxVQUFSO0FBQUEsU0FBdUJBLFdBQzdDQyxLQUQ2QyxDQUN2Q2hDLFlBRHVDLEVBRTdDdUIsR0FGNkMsQ0FFekMsVUFBQ1UsSUFBRCxFQUFVO0FBQ2IsUUFBTVIsUUFBUWpCLGNBQWN5QixLQUFLQyxXQUFMLEVBQWQsQ0FBZDtBQUNBLFFBQUksQ0FBQ1QsS0FBTCxFQUFZO0FBQ1YsWUFBTSxJQUFJVSxLQUFKLENBQVcsK0NBQThDQyxPQUFPQyxJQUFQLENBQVk3QixhQUFaLEVBQTJCVSxJQUEzQixDQUFnQyxJQUFoQyxDQUFzQyxjQUFhZSxJQUFLLEVBQWpILENBQU47QUFDRDtBQUNELFdBQU9ULE9BQU9DLEtBQVAsQ0FBUDtBQUNELEdBUjZDLEVBUzdDUCxJQVQ2QyxDQVN4Q2xCLFlBVHdDLENBQXZCO0FBQUEsQ0FBekI7O0FBWUE7O0FBRUFzQyxRQUFRQyxFQUFSLENBQVcsTUFBWCxFQUFtQjNDLE9BQW5COztBQUVBOztBQUVBO0FBQ08sU0FBU0EsT0FBVCxHQUFtQjtBQUN4QmUsUUFBTTZCLE9BQU4sQ0FBYyxVQUFDQyxRQUFELEVBQWM7QUFDMUIsUUFBSUEsU0FBU0MsTUFBYixFQUFxQjtBQUNuQnRCLG1CQUFHdUIsVUFBSCxDQUFjRixTQUFTMUMsUUFBdkI7QUFDRCxLQUZELE1BRU87QUFDTHFCLG1CQUFHd0IsU0FBSCxDQUFhSCxTQUFTMUMsUUFBdEI7QUFDRDtBQUNGLEdBTkQ7QUFPQVksUUFBTWlCLE1BQU4sR0FBZSxDQUFmO0FBQ0Q7O0FBRUQ7Ozs7OztBQU1PLFNBQVMvQixHQUFULEdBQTBDO0FBQUEsTUFBN0JnRCxPQUE2Qix1RUFBbkIsRUFBbUI7QUFBQSxNQUFmdkIsUUFBZSx1RUFBSixFQUFJOztBQUMvQyxNQUFJd0IsTUFBTUMsT0FBTixDQUFjRixPQUFkLENBQUosRUFBNEI7QUFDMUI7QUFDQXZCLGVBQVd1QixPQUFYO0FBQ0FBLGNBQVUsRUFBVjtBQUNBO0FBQ0Q7QUFOOEMsaUJBT1hBLE9BUFc7QUFBQSwrQkFPdkNHLElBUHVDO0FBQUEsTUFPdkNBLElBUHVDLGlDQU9oQy9DLGdCQVBnQzs7QUFRL0MsTUFBTWdELFVBQVU7QUFDZGxELGNBQVVBLFNBQVM4QyxPQUFULENBREk7QUFFZEssV0FBTyxJQUZPO0FBR2RGO0FBSGMsR0FBaEI7QUFLQSxNQUFJO0FBQ0Y1QixpQkFBRytCLFVBQUgsQ0FBY0YsUUFBUWxELFFBQXRCLEVBQWdDcUIsYUFBR2dDLElBQW5DO0FBQ0QsR0FGRCxDQUVFLE9BQU9DLEdBQVAsRUFBWTtBQUNaLFFBQUlBLElBQUlDLElBQUosS0FBYSxRQUFqQixFQUEyQjtBQUN6QixZQUFNLElBQUluQixLQUFKLENBQVcsbUJBQWtCYyxRQUFRbEQsUUFBUyxHQUE5QyxDQUFOO0FBQ0Q7QUFDRFksVUFBTTRDLElBQU4sQ0FBV04sT0FBWDtBQUNBLFFBQU1PLFlBQVl2QyxlQUFLd0MsT0FBTCxDQUFhUixRQUFRbEQsUUFBckIsQ0FBbEI7QUFDQUYsUUFBSTtBQUNGQSxXQUFLb0IsZUFBS3dDLE9BQUwsQ0FBYUQsU0FBYixDQURIO0FBRUZFLFlBQU16QyxlQUFLRSxRQUFMLENBQWNxQyxTQUFkO0FBRkosS0FBSjtBQUlBcEMsaUJBQUd1QyxTQUFILENBQWFWLFFBQVFsRCxRQUFyQixFQUErQmlELElBQS9CO0FBQ0Q7QUFDRCxNQUFJMUIsU0FBU00sTUFBVCxLQUFvQixDQUF4QixFQUEyQjtBQUN6QnFCLFlBQVEzQixRQUFSLEdBQW1CQSxTQUFTQyxHQUFULENBQWFYLE9BQU9xQyxPQUFQLENBQWIsQ0FBbkI7QUFDRDtBQUNELFNBQU9BLE9BQVA7QUFDRDs7QUFFRDs7Ozs7OztBQU9PLFNBQVNuRCxJQUFULEdBQTRCO0FBQUEsTUFBZCtDLE9BQWMsdUVBQUosRUFBSTtBQUFBLHNCQUs3QkEsT0FMNkIsQ0FFL0JlLElBRitCO0FBQUEsTUFFL0JBLElBRitCLGlDQUV4QixFQUZ3QjtBQUFBLDBCQUs3QmYsT0FMNkIsQ0FHL0JnQixRQUgrQjtBQUFBLE1BRy9CQSxRQUgrQixxQ0FHcEIzRCxnQkFIb0I7QUFBQSx1QkFLN0IyQyxPQUw2QixDQUkvQkcsSUFKK0I7QUFBQSxNQUkvQkEsSUFKK0Isa0NBSXhCN0MsaUJBSndCOztBQU1qQyxNQUFNc0MsV0FBVztBQUNmbUIsUUFEZTtBQUVmN0QsY0FBVUEsU0FBUzhDLE9BQVQsQ0FGSztBQUdmSCxZQUFRLElBSE87QUFJZk07QUFKZSxHQUFqQjtBQU1BLE1BQU1RLFlBQVl2QyxlQUFLd0MsT0FBTCxDQUFhaEIsU0FBUzFDLFFBQXRCLENBQWxCO0FBQ0FZLFFBQU00QyxJQUFOLENBQVdkLFFBQVg7QUFDQSxNQUFJO0FBQ0ZyQixpQkFBRytCLFVBQUgsQ0FBY0ssU0FBZCxFQUF5QnBDLGFBQUdnQyxJQUE1QjtBQUNELEdBRkQsQ0FFRSxPQUFPQyxHQUFQLEVBQVk7QUFDWixRQUFJQSxJQUFJQyxJQUFKLEtBQWEsUUFBakIsRUFBMkI7QUFDekIsWUFBTSxJQUFJbkIsS0FBSixDQUFXLG1CQUFrQnFCLFNBQVUsR0FBdkMsQ0FBTjtBQUNEO0FBQ0QzRCxRQUFJO0FBQ0ZBLFdBQUtvQixlQUFLd0MsT0FBTCxDQUFhRCxTQUFiLENBREg7QUFFRkUsWUFBTXpDLGVBQUtFLFFBQUwsQ0FBY3FDLFNBQWQ7QUFGSixLQUFKO0FBSUQ7QUFDRHBDLGVBQUcwQyxhQUFILENBQWlCckIsU0FBUzFDLFFBQTFCLEVBQW9DNkQsSUFBcEMsRUFBMEMsRUFBRUMsUUFBRixFQUFZYixJQUFaLEVBQTFDO0FBQ0EsU0FBT1AsUUFBUDtBQUNEOztBQUVEOzs7Ozs7O0FBT08sU0FBUzFDLFFBQVQsR0FJQztBQUFBLGlGQUFKLEVBQUk7QUFBQSxzQkFITkYsR0FHTTtBQUFBLE1BSERrRSxPQUdDLDRCQUhTQyxhQUFHQyxNQUFILEVBR1Q7QUFBQSxzQkFGTkMsR0FFTTtBQUFBLE1BRk5BLEdBRU0sNEJBRkEsSUFFQTtBQUFBLHVCQUROUixJQUNNO0FBQUEsTUFETkEsSUFDTSw2QkFEQ3RELFlBQ0Q7O0FBQ04sTUFBTXFELFVBQVV4QyxlQUFLa0QsT0FBTCxDQUFhSixPQUFiLENBQWhCO0FBQ0EsTUFBTTVDLFdBQVd1QyxLQUFLVSxPQUFMLENBQWE3RCxvQkFBYixFQUFtQ3NCLGdCQUFuQyxDQUFqQjtBQUNBLFNBQU9aLGVBQUtDLElBQUwsQ0FBVXVDLE9BQVYsRUFBb0IsR0FBRXRDLFFBQVMsR0FBRStDLE1BQU8sSUFBR0EsR0FBSSxFQUFkLEdBQWtCLEVBQUcsRUFBdEQsQ0FBUDtBQUNEIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBvcyBmcm9tICdvcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuLy8gY29uc3RhbnRzXG5cbmNvbnN0IEVNUFRZX1NUUklORyA9ICcnO1xuXG5jb25zdCBERUZBVUxUX0RJUl9NT0RFID0gMG83Nzc7XG5jb25zdCBERUZBVUxUX0VOQ09ESU5HID0gJ3V0ZjgnO1xuY29uc3QgREVGQVVMVF9GSUxFX01PREUgPSAwbzY2NjtcbmNvbnN0IERFRkFVTFRfTkFNRSA9ICd0ZW1wb3JhcmlseS17V1dXV0RERER9JztcblxuY29uc3QgRElHSVQgPSAnMTIzNDU2Nzg5MCc7XG5jb25zdCBXT1JEID0gJ2FiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVonO1xuXG5jb25zdCBURU1QTEFURV9JTlRFUlBPTEFURSA9IC9cXHsoW159XSspXFx9L2c7XG5cbi8vIHByaXZhdGVcblxuY29uc3QgdGVtcGxhdGVDaGFycyA9IHtcbiAgLyogZXNsaW50LWRpc2FibGUgaWQtbGVuZ3RoICovXG4gIGQ6IERJR0lULFxuICB3OiBXT1JELFxuICAvKiBlc2xpbnQtZW5hYmxlIGlkLWxlbmd0aCAqL1xufTtcblxuY29uc3QgdGVtcFggPSBbXTtcblxuY29uc3QgbW92ZVRvID0gKHRvVGVtcERpciwgbW92ZSA9IHRydWUpID0+IChmcm9tVGVtcCkgPT4ge1xuICBjb25zdCBuZXdGaWxlcGF0aCA9IHBhdGguam9pbih0b1RlbXBEaXIuZmlsZXBhdGgsIHBhdGguYmFzZW5hbWUoZnJvbVRlbXAuZmlsZXBhdGgpKTtcbiAgaWYgKG1vdmUpIHtcbiAgICBmcy5yZW5hbWVTeW5jKGZyb21UZW1wLmZpbGVwYXRoLCBuZXdGaWxlcGF0aCk7XG4gIH1cbiAgZnJvbVRlbXAuZmlsZXBhdGggPSBuZXdGaWxlcGF0aDtcbiAgaWYgKGZyb21UZW1wLmNoaWxkcmVuKSB7XG4gICAgZnJvbVRlbXAuY2hpbGRyZW4gPSBmcm9tVGVtcC5jaGlsZHJlbi5tYXAobW92ZVRvKGZyb21UZW1wLCBmYWxzZSkpO1xuICB9XG4gIHJldHVybiBmcm9tVGVtcDtcbn07XG5cbmNvbnN0IHJhbmRvbSA9IChjaGFycykgPT4gY2hhcnNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY2hhcnMubGVuZ3RoKV07XG5cbmNvbnN0IHRlbXBsYXRlUmVwbGFjZXIgPSAobWF0Y2gsIGlubmVyTWF0Y2gpID0+IGlubmVyTWF0Y2hcbiAgLnNwbGl0KEVNUFRZX1NUUklORylcbiAgLm1hcCgoY2hhcikgPT4ge1xuICAgIGNvbnN0IGNoYXJzID0gdGVtcGxhdGVDaGFyc1tjaGFyLnRvTG93ZXJDYXNlKCldO1xuICAgIGlmICghY2hhcnMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgdGVtcGxhdGUgcGxhY2Vob2xkZXIgdG8gYmUgb25lIG9mOiAke09iamVjdC5rZXlzKHRlbXBsYXRlQ2hhcnMpLmpvaW4oJywgJyl9LiBSZWNlaXZlZCAke2NoYXJ9YCk7XG4gICAgfVxuICAgIHJldHVybiByYW5kb20oY2hhcnMpO1xuICB9KVxuICAuam9pbihFTVBUWV9TVFJJTkcpXG47XG5cbi8vIGF1dG8gY2xlYW4gdXBcblxucHJvY2Vzcy5vbignZXhpdCcsIGNsZWFudXApO1xuXG4vLyBleHBvcnRzXG5cbi8qKiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsZWFudXAoKSB7XG4gIHRlbXBYLmZvckVhY2goKHRlbXBGaWxlKSA9PiB7XG4gICAgaWYgKHRlbXBGaWxlLmlzRmlsZSkge1xuICAgICAgZnMudW5saW5rU3luYyh0ZW1wRmlsZS5maWxlcGF0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZzLnJtZGlyU3luYyh0ZW1wRmlsZS5maWxlcGF0aCk7XG4gICAgfVxuICB9KTtcbiAgdGVtcFgubGVuZ3RoID0gMDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge29iamVjdH0gICAgICAgIFtvcHRpb25zXVxuICogQHBhcmFtIHtudW1iZXJ9ICAgICAgICBbb3B0aW9ucy5tb2RlPTBvNzc3XVxuICogQHBhcmFtIHtBcnJheTxvYmplY3Q+fSBbY2hpbGRyZW5dXG4gKiBAcmV0dXJuIHtvYmplY3R9IGRpciBwcm9wc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlyKG9wdGlvbnMgPSB7fSwgY2hpbGRyZW4gPSBbXSkge1xuICBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zKSkge1xuICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLXBhcmFtLXJlYXNzaWduICovXG4gICAgY2hpbGRyZW4gPSBvcHRpb25zO1xuICAgIG9wdGlvbnMgPSB7fTtcbiAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLXBhcmFtLXJlYXNzaWduICovXG4gIH1cbiAgY29uc3QgeyBtb2RlID0gREVGQVVMVF9ESVJfTU9ERSB9ID0gb3B0aW9ucztcbiAgY29uc3QgdGVtcERpciA9IHtcbiAgICBmaWxlcGF0aDogZmlsZXBhdGgob3B0aW9ucyksXG4gICAgaXNEaXI6IHRydWUsXG4gICAgbW9kZSxcbiAgfTtcbiAgdHJ5IHtcbiAgICBmcy5hY2Nlc3NTeW5jKHRlbXBEaXIuZmlsZXBhdGgsIGZzLkZfT0spO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoZXJyLmNvZGUgIT09ICdFTk9FTlQnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBjaGVjayAke3RlbXBEaXIuZmlsZXBhdGh9LmApO1xuICAgIH1cbiAgICB0ZW1wWC5wdXNoKHRlbXBEaXIpO1xuICAgIGNvbnN0IHBhcmVudERpciA9IHBhdGguZGlybmFtZSh0ZW1wRGlyLmZpbGVwYXRoKTtcbiAgICBkaXIoe1xuICAgICAgZGlyOiBwYXRoLmRpcm5hbWUocGFyZW50RGlyKSxcbiAgICAgIG5hbWU6IHBhdGguYmFzZW5hbWUocGFyZW50RGlyKSxcbiAgICB9KTtcbiAgICBmcy5ta2RpclN5bmModGVtcERpci5maWxlcGF0aCwgbW9kZSk7XG4gIH1cbiAgaWYgKGNoaWxkcmVuLmxlbmd0aCAhPT0gMCkge1xuICAgIHRlbXBEaXIuY2hpbGRyZW4gPSBjaGlsZHJlbi5tYXAobW92ZVRvKHRlbXBEaXIpKTtcbiAgfVxuICByZXR1cm4gdGVtcERpcjtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGF0YT0nJ11cbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5lbmNvZGluZz11dGY4XVxuICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1vZGU9MG82NjZdXG4gKiBAcmV0dXJuIHtvYmplY3R9IGZpbGUgcHJvcHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbGUob3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IHtcbiAgICBkYXRhID0gJycsXG4gICAgZW5jb2RpbmcgPSBERUZBVUxUX0VOQ09ESU5HLFxuICAgIG1vZGUgPSBERUZBVUxUX0ZJTEVfTU9ERSxcbiAgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IHRlbXBGaWxlID0ge1xuICAgIGRhdGEsXG4gICAgZmlsZXBhdGg6IGZpbGVwYXRoKG9wdGlvbnMpLFxuICAgIGlzRmlsZTogdHJ1ZSxcbiAgICBtb2RlLFxuICB9O1xuICBjb25zdCBwYXJlbnREaXIgPSBwYXRoLmRpcm5hbWUodGVtcEZpbGUuZmlsZXBhdGgpO1xuICB0ZW1wWC5wdXNoKHRlbXBGaWxlKTtcbiAgdHJ5IHtcbiAgICBmcy5hY2Nlc3NTeW5jKHBhcmVudERpciwgZnMuRl9PSyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmIChlcnIuY29kZSAhPT0gJ0VOT0VOVCcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IGNoZWNrICR7cGFyZW50RGlyfS5gKTtcbiAgICB9XG4gICAgZGlyKHtcbiAgICAgIGRpcjogcGF0aC5kaXJuYW1lKHBhcmVudERpciksXG4gICAgICBuYW1lOiBwYXRoLmJhc2VuYW1lKHBhcmVudERpciksXG4gICAgfSk7XG4gIH1cbiAgZnMud3JpdGVGaWxlU3luYyh0ZW1wRmlsZS5maWxlcGF0aCwgZGF0YSwgeyBlbmNvZGluZywgbW9kZSB9KTtcbiAgcmV0dXJuIHRlbXBGaWxlO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5kaXI9b3MudG1wZGlyXVxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmV4dF1cbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5uYW1lPXRlbXBvcmFyaWx5LXtXV1dXRERERH1dXG4gKiBAcmV0dXJuIHtzdHJpbmd9IGZpbGVwYXRoXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaWxlcGF0aCh7XG4gIGRpcjogZGlyUGF0aCA9IG9zLnRtcGRpcigpLFxuICBleHQgPSBudWxsLFxuICBuYW1lID0gREVGQVVMVF9OQU1FLFxufSA9IHt9KSB7XG4gIGNvbnN0IGRpcm5hbWUgPSBwYXRoLnJlc29sdmUoZGlyUGF0aCk7XG4gIGNvbnN0IGJhc2VuYW1lID0gbmFtZS5yZXBsYWNlKFRFTVBMQVRFX0lOVEVSUE9MQVRFLCB0ZW1wbGF0ZVJlcGxhY2VyKTtcbiAgcmV0dXJuIHBhdGguam9pbihkaXJuYW1lLCBgJHtiYXNlbmFtZX0ke2V4dCA/IGAuJHtleHR9YCA6ICcnfWApO1xufVxuIl19