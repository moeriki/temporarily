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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9pbmRleC5qcyJdLCJuYW1lcyI6WyJjbGVhbnVwIiwiZGlyIiwiZmlsZSIsImZpbGVwYXRoIiwiRU1QVFlfU1RSSU5HIiwiREVGQVVMVF9ESVJfTU9ERSIsIkRFRkFVTFRfRU5DT0RJTkciLCJERUZBVUxUX0ZJTEVfTU9ERSIsIkRFRkFVTFRfTkFNRSIsIkRJR0lUIiwiV09SRCIsIlRFTVBMQVRFX0lOVEVSUE9MQVRFIiwidGVtcGxhdGVDaGFycyIsImQiLCJ3IiwidGVtcFgiLCJtb3ZlVG8iLCJ0b1RlbXBEaXIiLCJtb3ZlIiwiZnJvbVRlbXAiLCJuZXdGaWxlcGF0aCIsInBhdGgiLCJqb2luIiwiYmFzZW5hbWUiLCJmcyIsInJlbmFtZVN5bmMiLCJjaGlsZHJlbiIsIm1hcCIsInJhbmRvbSIsImNoYXJzIiwiTWF0aCIsImZsb29yIiwibGVuZ3RoIiwidGVtcGxhdGVSZXBsYWNlciIsIm1hdGNoIiwiaW5uZXJNYXRjaCIsInNwbGl0IiwiY2hhciIsInRvTG93ZXJDYXNlIiwiRXJyb3IiLCJPYmplY3QiLCJrZXlzIiwicHJvY2VzcyIsIm9uIiwiZm9yRWFjaCIsInRlbXBGaWxlIiwiaXNGaWxlIiwidW5saW5rU3luYyIsInJtZGlyIiwib3B0aW9ucyIsIkFycmF5IiwiaXNBcnJheSIsIm1vZGUiLCJ0ZW1wRGlyIiwiaXNEaXIiLCJhY2Nlc3NTeW5jIiwiRl9PSyIsImVyciIsImNvZGUiLCJwdXNoIiwicGFyZW50RGlyIiwiZGlybmFtZSIsIm5hbWUiLCJta2RpclN5bmMiLCJkYXRhIiwiZW5jb2RpbmciLCJ3cml0ZUZpbGVTeW5jIiwiZGlyUGF0aCIsIm9zIiwidG1wZGlyIiwiZXh0IiwicmVzb2x2ZSIsInJlcGxhY2UiXSwibWFwcGluZ3MiOiI7Ozs7O1FBOERnQkEsTyxHQUFBQSxPO1FBaUJBQyxHLEdBQUFBLEc7UUF3Q0FDLEksR0FBQUEsSTtRQW9DQUMsUSxHQUFBQSxROztBQTNKaEI7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7QUFFQTs7QUFFQSxJQUFNQyxlQUFlLEVBQXJCOztBQUVBLElBQU1DLG1CQUFtQixLQUF6QjtBQUNBLElBQU1DLG1CQUFtQixNQUF6QjtBQUNBLElBQU1DLG9CQUFvQixLQUExQjtBQUNBLElBQU1DLGVBQWUsd0JBQXJCOztBQUVBLElBQU1DLFFBQVEsWUFBZDtBQUNBLElBQU1DLE9BQU8sc0RBQWI7O0FBRUEsSUFBTUMsdUJBQXVCLGNBQTdCOztBQUVBOztBQUVBLElBQU1DLGdCQUFnQjtBQUNwQjtBQUNBQyxLQUFHSixLQUZpQjtBQUdwQkssS0FBR0o7QUFDSDtBQUpvQixDQUF0Qjs7QUFPQSxJQUFNSyxRQUFRLEVBQWQ7O0FBRUEsSUFBTUMsU0FBUyxTQUFUQSxNQUFTLENBQUNDLFNBQUQ7QUFBQSxNQUFZQyxJQUFaLHVFQUFtQixJQUFuQjtBQUFBLFNBQTRCLFVBQUNDLFFBQUQsRUFBYztBQUN2RCxRQUFNQyxjQUFjQyxlQUFLQyxJQUFMLENBQVVMLFVBQVVkLFFBQXBCLEVBQThCa0IsZUFBS0UsUUFBTCxDQUFjSixTQUFTaEIsUUFBdkIsQ0FBOUIsQ0FBcEI7QUFDQSxRQUFJZSxJQUFKLEVBQVU7QUFDUk0sbUJBQUdDLFVBQUgsQ0FBY04sU0FBU2hCLFFBQXZCLEVBQWlDaUIsV0FBakM7QUFDRDtBQUNERCxhQUFTaEIsUUFBVCxHQUFvQmlCLFdBQXBCO0FBQ0EsUUFBSUQsU0FBU08sUUFBYixFQUF1QjtBQUNyQlAsZUFBU08sUUFBVCxHQUFvQlAsU0FBU08sUUFBVCxDQUFrQkMsR0FBbEIsQ0FBc0JYLE9BQU9HLFFBQVAsRUFBaUIsS0FBakIsQ0FBdEIsQ0FBcEI7QUFDRDtBQUNELFdBQU9BLFFBQVA7QUFDRCxHQVZjO0FBQUEsQ0FBZjs7QUFZQSxJQUFNUyxTQUFTLFNBQVRBLE1BQVMsQ0FBQ0MsS0FBRDtBQUFBLFNBQVdBLE1BQU1DLEtBQUtDLEtBQUwsQ0FBV0QsS0FBS0YsTUFBTCxLQUFnQkMsTUFBTUcsTUFBakMsQ0FBTixDQUFYO0FBQUEsQ0FBZjs7QUFFQSxJQUFNQyxtQkFBbUIsU0FBbkJBLGdCQUFtQixDQUFDQyxLQUFELEVBQVFDLFVBQVI7QUFBQSxTQUF1QkEsV0FDN0NDLEtBRDZDLENBQ3ZDaEMsWUFEdUMsRUFFN0N1QixHQUY2QyxDQUV6QyxVQUFDVSxJQUFELEVBQVU7QUFDYixRQUFNUixRQUFRakIsY0FBY3lCLEtBQUtDLFdBQUwsRUFBZCxDQUFkO0FBQ0EsUUFBSSxDQUFDVCxLQUFMLEVBQVk7QUFDVixZQUFNLElBQUlVLEtBQUosQ0FBVywrQ0FBOENDLE9BQU9DLElBQVAsQ0FBWTdCLGFBQVosRUFBMkJVLElBQTNCLENBQWdDLElBQWhDLENBQXNDLGNBQWFlLElBQUssRUFBakgsQ0FBTjtBQUNEO0FBQ0QsV0FBT1QsT0FBT0MsS0FBUCxDQUFQO0FBQ0QsR0FSNkMsRUFTN0NQLElBVDZDLENBU3hDbEIsWUFUd0MsQ0FBdkI7QUFBQSxDQUF6Qjs7QUFZQTs7QUFFQXNDLFFBQVFDLEVBQVIsQ0FBVyxNQUFYLEVBQW1CM0MsT0FBbkI7O0FBRUE7O0FBRUE7QUFDTyxTQUFTQSxPQUFULEdBQW1CO0FBQ3hCZSxRQUFNNkIsT0FBTixDQUFjLFVBQUNDLFFBQUQsRUFBYztBQUMxQixRQUFJQSxTQUFTQyxNQUFiLEVBQXFCO0FBQ25CdEIsbUJBQUd1QixVQUFILENBQWNGLFNBQVMxQyxRQUF2QjtBQUNELEtBRkQsTUFFTztBQUNMcUIsbUJBQUd3QixLQUFILENBQVNILFNBQVMxQyxRQUFsQjtBQUNEO0FBQ0YsR0FORDtBQU9BWSxRQUFNaUIsTUFBTixHQUFlLENBQWY7QUFDRDs7QUFFRDs7Ozs7O0FBTU8sU0FBUy9CLEdBQVQsR0FBMEM7QUFBQSxNQUE3QmdELE9BQTZCLHVFQUFuQixFQUFtQjtBQUFBLE1BQWZ2QixRQUFlLHVFQUFKLEVBQUk7O0FBQy9DLE1BQUl3QixNQUFNQyxPQUFOLENBQWNGLE9BQWQsQ0FBSixFQUE0QjtBQUMxQjtBQUNBdkIsZUFBV3VCLE9BQVg7QUFDQUEsY0FBVSxFQUFWO0FBQ0E7QUFDRDtBQU44QyxpQkFPWEEsT0FQVztBQUFBLCtCQU92Q0csSUFQdUM7QUFBQSxNQU92Q0EsSUFQdUMsaUNBT2hDL0MsZ0JBUGdDOztBQVEvQyxNQUFNZ0QsVUFBVTtBQUNkbEQsY0FBVUEsU0FBUzhDLE9BQVQsQ0FESTtBQUVkSyxXQUFPLElBRk87QUFHZEY7QUFIYyxHQUFoQjtBQUtBLE1BQUk7QUFDRjVCLGlCQUFHK0IsVUFBSCxDQUFjRixRQUFRbEQsUUFBdEIsRUFBZ0NxQixhQUFHZ0MsSUFBbkM7QUFDRCxHQUZELENBRUUsT0FBT0MsR0FBUCxFQUFZO0FBQ1osUUFBSUEsSUFBSUMsSUFBSixLQUFhLFFBQWpCLEVBQTJCO0FBQ3pCLFlBQU0sSUFBSW5CLEtBQUosQ0FBVyxtQkFBa0JjLFFBQVFsRCxRQUFTLEdBQTlDLENBQU47QUFDRDtBQUNEWSxVQUFNNEMsSUFBTixDQUFXTixPQUFYO0FBQ0EsUUFBTU8sWUFBWXZDLGVBQUt3QyxPQUFMLENBQWFSLFFBQVFsRCxRQUFyQixDQUFsQjtBQUNBRixRQUFJO0FBQ0ZBLFdBQUtvQixlQUFLd0MsT0FBTCxDQUFhRCxTQUFiLENBREg7QUFFRkUsWUFBTXpDLGVBQUtFLFFBQUwsQ0FBY3FDLFNBQWQ7QUFGSixLQUFKO0FBSUFwQyxpQkFBR3VDLFNBQUgsQ0FBYVYsUUFBUWxELFFBQXJCLEVBQStCaUQsSUFBL0I7QUFDRDtBQUNELE1BQUkxQixTQUFTTSxNQUFULEtBQW9CLENBQXhCLEVBQTJCO0FBQ3pCcUIsWUFBUTNCLFFBQVIsR0FBbUJBLFNBQVNDLEdBQVQsQ0FBYVgsT0FBT3FDLE9BQVAsQ0FBYixDQUFuQjtBQUNEO0FBQ0QsU0FBT0EsT0FBUDtBQUNEOztBQUVEOzs7Ozs7O0FBT08sU0FBU25ELElBQVQsR0FBNEI7QUFBQSxNQUFkK0MsT0FBYyx1RUFBSixFQUFJO0FBQUEsc0JBSzdCQSxPQUw2QixDQUUvQmUsSUFGK0I7QUFBQSxNQUUvQkEsSUFGK0IsaUNBRXhCLEVBRndCO0FBQUEsMEJBSzdCZixPQUw2QixDQUcvQmdCLFFBSCtCO0FBQUEsTUFHL0JBLFFBSCtCLHFDQUdwQjNELGdCQUhvQjtBQUFBLHVCQUs3QjJDLE9BTDZCLENBSS9CRyxJQUorQjtBQUFBLE1BSS9CQSxJQUorQixrQ0FJeEI3QyxpQkFKd0I7O0FBTWpDLE1BQU1zQyxXQUFXO0FBQ2ZtQixRQURlO0FBRWY3RCxjQUFVQSxTQUFTOEMsT0FBVCxDQUZLO0FBR2ZILFlBQVEsSUFITztBQUlmTTtBQUplLEdBQWpCO0FBTUEsTUFBTVEsWUFBWXZDLGVBQUt3QyxPQUFMLENBQWFoQixTQUFTMUMsUUFBdEIsQ0FBbEI7QUFDQVksUUFBTTRDLElBQU4sQ0FBV2QsUUFBWDtBQUNBLE1BQUk7QUFDRnJCLGlCQUFHK0IsVUFBSCxDQUFjSyxTQUFkLEVBQXlCcEMsYUFBR2dDLElBQTVCO0FBQ0QsR0FGRCxDQUVFLE9BQU9DLEdBQVAsRUFBWTtBQUNaLFFBQUlBLElBQUlDLElBQUosS0FBYSxRQUFqQixFQUEyQjtBQUN6QixZQUFNLElBQUluQixLQUFKLENBQVcsbUJBQWtCcUIsU0FBVSxHQUF2QyxDQUFOO0FBQ0Q7QUFDRDNELFFBQUk7QUFDRkEsV0FBS29CLGVBQUt3QyxPQUFMLENBQWFELFNBQWIsQ0FESDtBQUVGRSxZQUFNekMsZUFBS0UsUUFBTCxDQUFjcUMsU0FBZDtBQUZKLEtBQUo7QUFJRDtBQUNEcEMsZUFBRzBDLGFBQUgsQ0FBaUJyQixTQUFTMUMsUUFBMUIsRUFBb0M2RCxJQUFwQyxFQUEwQyxFQUFFQyxRQUFGLEVBQVliLElBQVosRUFBMUM7QUFDQSxTQUFPUCxRQUFQO0FBQ0Q7O0FBRUQ7Ozs7Ozs7QUFPTyxTQUFTMUMsUUFBVCxHQUlDO0FBQUEsaUZBQUosRUFBSTtBQUFBLHNCQUhORixHQUdNO0FBQUEsTUFIRGtFLE9BR0MsNEJBSFNDLGFBQUdDLE1BQUgsRUFHVDtBQUFBLHNCQUZOQyxHQUVNO0FBQUEsTUFGTkEsR0FFTSw0QkFGQSxJQUVBO0FBQUEsdUJBRE5SLElBQ007QUFBQSxNQUROQSxJQUNNLDZCQURDdEQsWUFDRDs7QUFDTixNQUFNcUQsVUFBVXhDLGVBQUtrRCxPQUFMLENBQWFKLE9BQWIsQ0FBaEI7QUFDQSxNQUFNNUMsV0FBV3VDLEtBQUtVLE9BQUwsQ0FBYTdELG9CQUFiLEVBQW1Dc0IsZ0JBQW5DLENBQWpCO0FBQ0EsU0FBT1osZUFBS0MsSUFBTCxDQUFVdUMsT0FBVixFQUFvQixHQUFFdEMsUUFBUyxHQUFFK0MsTUFBTyxJQUFHQSxHQUFJLEVBQWQsR0FBa0IsRUFBRyxFQUF0RCxDQUFQO0FBQ0QiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IG9zIGZyb20gJ29zJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG4vLyBjb25zdGFudHNcblxuY29uc3QgRU1QVFlfU1RSSU5HID0gJyc7XG5cbmNvbnN0IERFRkFVTFRfRElSX01PREUgPSAwbzc3NztcbmNvbnN0IERFRkFVTFRfRU5DT0RJTkcgPSAndXRmOCc7XG5jb25zdCBERUZBVUxUX0ZJTEVfTU9ERSA9IDBvNjY2O1xuY29uc3QgREVGQVVMVF9OQU1FID0gJ3RlbXBvcmFyaWx5LXtXV1dXRERERH0nO1xuXG5jb25zdCBESUdJVCA9ICcxMjM0NTY3ODkwJztcbmNvbnN0IFdPUkQgPSAnYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXpBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWic7XG5cbmNvbnN0IFRFTVBMQVRFX0lOVEVSUE9MQVRFID0gL1xceyhbXn1dKylcXH0vZztcblxuLy8gcHJpdmF0ZVxuXG5jb25zdCB0ZW1wbGF0ZUNoYXJzID0ge1xuICAvKiBlc2xpbnQtZGlzYWJsZSBpZC1sZW5ndGggKi9cbiAgZDogRElHSVQsXG4gIHc6IFdPUkQsXG4gIC8qIGVzbGludC1lbmFibGUgaWQtbGVuZ3RoICovXG59O1xuXG5jb25zdCB0ZW1wWCA9IFtdO1xuXG5jb25zdCBtb3ZlVG8gPSAodG9UZW1wRGlyLCBtb3ZlID0gdHJ1ZSkgPT4gKGZyb21UZW1wKSA9PiB7XG4gIGNvbnN0IG5ld0ZpbGVwYXRoID0gcGF0aC5qb2luKHRvVGVtcERpci5maWxlcGF0aCwgcGF0aC5iYXNlbmFtZShmcm9tVGVtcC5maWxlcGF0aCkpO1xuICBpZiAobW92ZSkge1xuICAgIGZzLnJlbmFtZVN5bmMoZnJvbVRlbXAuZmlsZXBhdGgsIG5ld0ZpbGVwYXRoKTtcbiAgfVxuICBmcm9tVGVtcC5maWxlcGF0aCA9IG5ld0ZpbGVwYXRoO1xuICBpZiAoZnJvbVRlbXAuY2hpbGRyZW4pIHtcbiAgICBmcm9tVGVtcC5jaGlsZHJlbiA9IGZyb21UZW1wLmNoaWxkcmVuLm1hcChtb3ZlVG8oZnJvbVRlbXAsIGZhbHNlKSk7XG4gIH1cbiAgcmV0dXJuIGZyb21UZW1wO1xufTtcblxuY29uc3QgcmFuZG9tID0gKGNoYXJzKSA9PiBjaGFyc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjaGFycy5sZW5ndGgpXTtcblxuY29uc3QgdGVtcGxhdGVSZXBsYWNlciA9IChtYXRjaCwgaW5uZXJNYXRjaCkgPT4gaW5uZXJNYXRjaFxuICAuc3BsaXQoRU1QVFlfU1RSSU5HKVxuICAubWFwKChjaGFyKSA9PiB7XG4gICAgY29uc3QgY2hhcnMgPSB0ZW1wbGF0ZUNoYXJzW2NoYXIudG9Mb3dlckNhc2UoKV07XG4gICAgaWYgKCFjaGFycykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCB0ZW1wbGF0ZSBwbGFjZWhvbGRlciB0byBiZSBvbmUgb2Y6ICR7T2JqZWN0LmtleXModGVtcGxhdGVDaGFycykuam9pbignLCAnKX0uIFJlY2VpdmVkICR7Y2hhcn1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHJhbmRvbShjaGFycyk7XG4gIH0pXG4gIC5qb2luKEVNUFRZX1NUUklORylcbjtcblxuLy8gYXV0byBjbGVhbiB1cFxuXG5wcm9jZXNzLm9uKCdleGl0JywgY2xlYW51cCk7XG5cbi8vIGV4cG9ydHNcblxuLyoqICovXG5leHBvcnQgZnVuY3Rpb24gY2xlYW51cCgpIHtcbiAgdGVtcFguZm9yRWFjaCgodGVtcEZpbGUpID0+IHtcbiAgICBpZiAodGVtcEZpbGUuaXNGaWxlKSB7XG4gICAgICBmcy51bmxpbmtTeW5jKHRlbXBGaWxlLmZpbGVwYXRoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZnMucm1kaXIodGVtcEZpbGUuZmlsZXBhdGgpO1xuICAgIH1cbiAgfSk7XG4gIHRlbXBYLmxlbmd0aCA9IDA7XG59XG5cbi8qKlxuICogQHBhcmFtIHtvYmplY3R9ICAgICAgICBbb3B0aW9uc11cbiAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW29wdGlvbnMubW9kZT0wbzc3N11cbiAqIEBwYXJhbSB7QXJyYXk8b2JqZWN0Pn0gW2NoaWxkcmVuXVxuICogQHJldHVybiB7b2JqZWN0fSBkaXIgcHJvcHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpcihvcHRpb25zID0ge30sIGNoaWxkcmVuID0gW10pIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucykpIHtcbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1wYXJhbS1yZWFzc2lnbiAqL1xuICAgIGNoaWxkcmVuID0gb3B0aW9ucztcbiAgICBvcHRpb25zID0ge307XG4gICAgLyogZXNsaW50LWVuYWJsZSBuby1wYXJhbS1yZWFzc2lnbiAqL1xuICB9XG4gIGNvbnN0IHsgbW9kZSA9IERFRkFVTFRfRElSX01PREUgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IHRlbXBEaXIgPSB7XG4gICAgZmlsZXBhdGg6IGZpbGVwYXRoKG9wdGlvbnMpLFxuICAgIGlzRGlyOiB0cnVlLFxuICAgIG1vZGUsXG4gIH07XG4gIHRyeSB7XG4gICAgZnMuYWNjZXNzU3luYyh0ZW1wRGlyLmZpbGVwYXRoLCBmcy5GX09LKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyci5jb2RlICE9PSAnRU5PRU5UJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgY2hlY2sgJHt0ZW1wRGlyLmZpbGVwYXRofS5gKTtcbiAgICB9XG4gICAgdGVtcFgucHVzaCh0ZW1wRGlyKTtcbiAgICBjb25zdCBwYXJlbnREaXIgPSBwYXRoLmRpcm5hbWUodGVtcERpci5maWxlcGF0aCk7XG4gICAgZGlyKHtcbiAgICAgIGRpcjogcGF0aC5kaXJuYW1lKHBhcmVudERpciksXG4gICAgICBuYW1lOiBwYXRoLmJhc2VuYW1lKHBhcmVudERpciksXG4gICAgfSk7XG4gICAgZnMubWtkaXJTeW5jKHRlbXBEaXIuZmlsZXBhdGgsIG1vZGUpO1xuICB9XG4gIGlmIChjaGlsZHJlbi5sZW5ndGggIT09IDApIHtcbiAgICB0ZW1wRGlyLmNoaWxkcmVuID0gY2hpbGRyZW4ubWFwKG1vdmVUbyh0ZW1wRGlyKSk7XG4gIH1cbiAgcmV0dXJuIHRlbXBEaXI7XG59XG5cbi8qKlxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmRhdGE9JyddXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZW5jb2Rpbmc9dXRmOF1cbiAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5tb2RlPTBvNjY2XVxuICogQHJldHVybiB7b2JqZWN0fSBmaWxlIHByb3BzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaWxlKG9wdGlvbnMgPSB7fSkge1xuICBjb25zdCB7XG4gICAgZGF0YSA9ICcnLFxuICAgIGVuY29kaW5nID0gREVGQVVMVF9FTkNPRElORyxcbiAgICBtb2RlID0gREVGQVVMVF9GSUxFX01PREUsXG4gIH0gPSBvcHRpb25zO1xuICBjb25zdCB0ZW1wRmlsZSA9IHtcbiAgICBkYXRhLFxuICAgIGZpbGVwYXRoOiBmaWxlcGF0aChvcHRpb25zKSxcbiAgICBpc0ZpbGU6IHRydWUsXG4gICAgbW9kZSxcbiAgfTtcbiAgY29uc3QgcGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKHRlbXBGaWxlLmZpbGVwYXRoKTtcbiAgdGVtcFgucHVzaCh0ZW1wRmlsZSk7XG4gIHRyeSB7XG4gICAgZnMuYWNjZXNzU3luYyhwYXJlbnREaXIsIGZzLkZfT0spO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoZXJyLmNvZGUgIT09ICdFTk9FTlQnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBjaGVjayAke3BhcmVudERpcn0uYCk7XG4gICAgfVxuICAgIGRpcih7XG4gICAgICBkaXI6IHBhdGguZGlybmFtZShwYXJlbnREaXIpLFxuICAgICAgbmFtZTogcGF0aC5iYXNlbmFtZShwYXJlbnREaXIpLFxuICAgIH0pO1xuICB9XG4gIGZzLndyaXRlRmlsZVN5bmModGVtcEZpbGUuZmlsZXBhdGgsIGRhdGEsIHsgZW5jb2RpbmcsIG1vZGUgfSk7XG4gIHJldHVybiB0ZW1wRmlsZTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGlyPW9zLnRtcGRpcl1cbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5leHRdXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMubmFtZT10ZW1wb3JhcmlseS17V1dXV0RERER9XVxuICogQHJldHVybiB7c3RyaW5nfSBmaWxlcGF0aFxuICovXG5leHBvcnQgZnVuY3Rpb24gZmlsZXBhdGgoe1xuICBkaXI6IGRpclBhdGggPSBvcy50bXBkaXIoKSxcbiAgZXh0ID0gbnVsbCxcbiAgbmFtZSA9IERFRkFVTFRfTkFNRSxcbn0gPSB7fSkge1xuICBjb25zdCBkaXJuYW1lID0gcGF0aC5yZXNvbHZlKGRpclBhdGgpO1xuICBjb25zdCBiYXNlbmFtZSA9IG5hbWUucmVwbGFjZShURU1QTEFURV9JTlRFUlBPTEFURSwgdGVtcGxhdGVSZXBsYWNlcik7XG4gIHJldHVybiBwYXRoLmpvaW4oZGlybmFtZSwgYCR7YmFzZW5hbWV9JHtleHQgPyBgLiR7ZXh0fWAgOiAnJ31gKTtcbn1cbiJdfQ==