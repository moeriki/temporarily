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

// const debug = (...args) => {
//   console.log(...args);
// };

var moveTo = function moveTo(toTempDir) {
  var move = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  return function (fromTemp) {
    /* eslint-disable no-param-reassign */
    var newFilepath = _path2.default.join(toTempDir.filepath, _path2.default.basename(fromTemp.filepath));
    if (move) {
      _fs2.default.renameSync(fromTemp.filepath, newFilepath);
      // debug('MOVED', fromTemp.filepath, newFilepath);
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
    // debug('CREATED DIR', tempDir.filepath);
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
  // debug('CREATED FILE', tempFile.filepath);
  return tempFile;
}

// auto clean up

process.on('exit', cleanup);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9pbmRleC5qcyJdLCJuYW1lcyI6WyJjbGVhbnVwIiwiZmlsZXBhdGgiLCJkaXIiLCJmaWxlIiwiRU1QVFlfU1RSSU5HIiwiREVGQVVMVF9ESVJfTU9ERSIsIkRFRkFVTFRfRU5DT0RJTkciLCJERUZBVUxUX0ZJTEVfTU9ERSIsIkRFRkFVTFRfTkFNRSIsIlRNUF9ESVIiLCJESUdJVCIsIldPUkQiLCJURU1QTEFURV9JTlRFUlBPTEFURSIsInNhbXBsZSIsImFycmF5IiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwibGVuZ3RoIiwidGVtcGxhdGVDaGFycyIsImQiLCJ3IiwieCIsInRlbXBYIiwibW92ZVRvIiwidG9UZW1wRGlyIiwibW92ZSIsImZyb21UZW1wIiwibmV3RmlsZXBhdGgiLCJwYXRoIiwiam9pbiIsImJhc2VuYW1lIiwiZnMiLCJyZW5hbWVTeW5jIiwiY2hpbGRyZW4iLCJtYXAiLCJ0ZW1wbGF0ZVJlcGxhY2VyIiwibWF0Y2giLCJpbm5lck1hdGNoIiwic3BsaXQiLCJjaGFyIiwiY2hhcnMiLCJ0b0xvd2VyQ2FzZSIsIkVycm9yIiwiT2JqZWN0Iiwia2V5cyIsInRtcERpciIsIm9zIiwidG1wZGlyIiwicmVwbGFjZSIsImZvckVhY2giLCJ0ZW1wRmlsZSIsImlzRmlsZSIsInVubGlua1N5bmMiLCJybWRpclN5bmMiLCJkaXJQYXRoIiwiZXh0IiwibmFtZSIsImRpcm5hbWUiLCJyZXNvbHZlIiwib3B0aW9ucyIsIkFycmF5IiwiaXNBcnJheSIsIm1vZGUiLCJ0ZW1wRGlyIiwiaXNEaXIiLCJhY2Nlc3NTeW5jIiwiRl9PSyIsImVyciIsImNvZGUiLCJwdXNoIiwicGFyZW50RGlyIiwibWtkaXJTeW5jIiwiZGF0YSIsImVuY29kaW5nIiwid3JpdGVGaWxlU3luYyIsInByb2Nlc3MiLCJvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7UUErRWdCQSxPLEdBQUFBLE87UUFrQkFDLFEsR0FBQUEsUTtRQWdCQUMsRyxHQUFBQSxHO1FBeUNBQyxJLEdB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LENBQWxCO0FBQ0FzQixRQUFNK0MsSUFBTixDQUFXbkIsUUFBWDtBQUNBLE1BQUk7QUFDRm5CLGlCQUFHa0MsVUFBSCxDQUFjSyxTQUFkLEVBQXlCdkMsYUFBR21DLElBQTVCO0FBQ0QsR0FGRCxDQUVFLE9BQU9DLEdBQVAsRUFBWTtBQUNaLFFBQUlBLElBQUlDLElBQUosS0FBYSxRQUFqQixFQUEyQjtBQUN6QixZQUFNLElBQUkxQixLQUFKLENBQVcsbUJBQWtCNEIsU0FBVSxHQUF2QyxDQUFOO0FBQ0Q7QUFDRHJFLFFBQUk7QUFDRkEsV0FBSzJCLGVBQUs2QixPQUFMLENBQWFhLFNBQWIsQ0FESDtBQUVGZCxZQUFNNUIsZUFBS0UsUUFBTCxDQUFjd0MsU0FBZDtBQUZKLEtBQUo7QUFJRDtBQUNEdkMsZUFBRzJDLGFBQUgsQ0FBaUJ4QixTQUFTbEQsUUFBMUIsRUFBb0N3RSxJQUFwQyxFQUEwQyxFQUFFQyxRQUFGLEVBQVlYLElBQVosRUFBMUM7QUFDQTtBQUNBLFNBQU9aLFFBQVA7QUFDRDs7QUFFRDs7QUFFQXlCLFFBQVFDLEVBQVIsQ0FBVyxNQUFYLEVBQW1CN0UsT0FBbkIiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IG9zIGZyb20gJ29zJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG5pbXBvcnQgcmFuZG9tU3RyaW5nIGZyb20gJ2NyeXB0by1yYW5kb20tc3RyaW5nJztcblxuLy8gY29uc3RhbnRzXG5cbmNvbnN0IEVNUFRZX1NUUklORyA9ICcnO1xuXG5jb25zdCBERUZBVUxUX0RJUl9NT0RFID0gMG83Nzc7XG5jb25zdCBERUZBVUxUX0VOQ09ESU5HID0gJ3V0ZjgnO1xuY29uc3QgREVGQVVMVF9GSUxFX01PREUgPSAwbzY2NjtcbmNvbnN0IERFRkFVTFRfTkFNRSA9ICd0ZW1wb3JhcmlseS17V1dXV0RERER9JztcbmNvbnN0IFRNUF9ESVIgPSAndGVtcG9yYXJpbHkte1hYWFhYWFhYfSc7XG5cbmNvbnN0IERJR0lUID0gJzEyMzQ1Njc4OTAnO1xuY29uc3QgV09SRCA9ICdhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ekFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaJztcblxuY29uc3QgVEVNUExBVEVfSU5URVJQT0xBVEUgPSAvXFx7KFtefV0rKVxcfS9nO1xuXG4vLyB1dGlsc1xuXG5jb25zdCBzYW1wbGUgPSAoYXJyYXkpID0+IGFycmF5W01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFycmF5Lmxlbmd0aCldO1xuXG4vLyBwcml2YXRlXG5cbmNvbnN0IHRlbXBsYXRlQ2hhcnMgPSB7XG4gIC8qIGVzbGludC1kaXNhYmxlIGlkLWxlbmd0aCAqL1xuICBkOiAoKSA9PiBzYW1wbGUoRElHSVQpLFxuICB3OiAoKSA9PiBzYW1wbGUoV09SRCksXG4gIHg6ICgpID0+IHJhbmRvbVN0cmluZygxKSxcbiAgLyogZXNsaW50LWVuYWJsZSBpZC1sZW5ndGggKi9cbn07XG5cbmNvbnN0IHRlbXBYID0gW107XG5cbi8vIGNvbnN0IGRlYnVnID0gKC4uLmFyZ3MpID0+IHtcbi8vICAgY29uc29sZS5sb2coLi4uYXJncyk7XG4vLyB9O1xuXG5jb25zdCBtb3ZlVG8gPSAodG9UZW1wRGlyLCBtb3ZlID0gdHJ1ZSkgPT4gKGZyb21UZW1wKSA9PiB7XG4gIC8qIGVzbGludC1kaXNhYmxlIG5vLXBhcmFtLXJlYXNzaWduICovXG4gIGNvbnN0IG5ld0ZpbGVwYXRoID0gcGF0aC5qb2luKFxuICAgIHRvVGVtcERpci5maWxlcGF0aCxcbiAgICBwYXRoLmJhc2VuYW1lKGZyb21UZW1wLmZpbGVwYXRoKSxcbiAgKTtcbiAgaWYgKG1vdmUpIHtcbiAgICBmcy5yZW5hbWVTeW5jKGZyb21UZW1wLmZpbGVwYXRoLCBuZXdGaWxlcGF0aCk7XG4gICAgLy8gZGVidWcoJ01PVkVEJywgZnJvbVRlbXAuZmlsZXBhdGgsIG5ld0ZpbGVwYXRoKTtcbiAgfVxuICBmcm9tVGVtcC5maWxlcGF0aCA9IG5ld0ZpbGVwYXRoO1xuICBpZiAoZnJvbVRlbXAuY2hpbGRyZW4pIHtcbiAgICBmcm9tVGVtcC5jaGlsZHJlbiA9IGZyb21UZW1wLmNoaWxkcmVuLm1hcChtb3ZlVG8oZnJvbVRlbXAsIGZhbHNlKSk7XG4gIH1cbiAgcmV0dXJuIGZyb21UZW1wO1xufTtcblxuY29uc3QgdGVtcGxhdGVSZXBsYWNlciA9IChtYXRjaCwgaW5uZXJNYXRjaCkgPT5cbiAgaW5uZXJNYXRjaFxuICAgIC5zcGxpdChFTVBUWV9TVFJJTkcpXG4gICAgLm1hcCgoY2hhcikgPT4ge1xuICAgICAgY29uc3QgY2hhcnMgPSB0ZW1wbGF0ZUNoYXJzW2NoYXIudG9Mb3dlckNhc2UoKV07XG4gICAgICBpZiAoIWNoYXJzKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgRXhwZWN0ZWQgdGVtcGxhdGUgcGxhY2Vob2xkZXIgdG8gYmUgb25lIG9mOiAke09iamVjdC5rZXlzKFxuICAgICAgICAgICAgdGVtcGxhdGVDaGFycyxcbiAgICAgICAgICApLmpvaW4oJywgJyl9LiBSZWNlaXZlZCAke2NoYXJ9YCxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjaGFycygpO1xuICAgIH0pXG4gICAgLmpvaW4oRU1QVFlfU1RSSU5HKTtcblxuY29uc3QgdG1wRGlyID0gKCkgPT4gcGF0aC5qb2luKG9zLnRtcGRpcigpLCBUTVBfRElSLnJlcGxhY2UoVEVNUExBVEVfSU5URVJQT0xBVEUsIHRlbXBsYXRlUmVwbGFjZXIpKTtcblxuLy8gZXhwb3J0c1xuXG4vKiogKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGVhbnVwKCkge1xuICB0ZW1wWC5mb3JFYWNoKCh0ZW1wRmlsZSkgPT4ge1xuICAgIGlmICh0ZW1wRmlsZS5pc0ZpbGUpIHtcbiAgICAgIGZzLnVubGlua1N5bmModGVtcEZpbGUuZmlsZXBhdGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBmcy5ybWRpclN5bmModGVtcEZpbGUuZmlsZXBhdGgpO1xuICAgIH1cbiAgfSk7XG4gIHRlbXBYLmxlbmd0aCA9IDA7XG59XG5cbi8qKlxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmRpcj1vcy50bXBkaXJdXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZXh0XVxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLm5hbWU9dGVtcG9yYXJpbHkte1dXV1dEREREfV1cbiAqIEByZXR1cm4ge3N0cmluZ30gZmlsZXBhdGhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbGVwYXRoKHtcbiAgZGlyOiBkaXJQYXRoID0gdG1wRGlyKCksXG4gIGV4dCA9IG51bGwsXG4gIG5hbWUgPSBERUZBVUxUX05BTUUsXG59ID0ge30pIHtcbiAgY29uc3QgZGlybmFtZSA9IHBhdGgucmVzb2x2ZShkaXJQYXRoKTtcbiAgY29uc3QgYmFzZW5hbWUgPSBuYW1lLnJlcGxhY2UoVEVNUExBVEVfSU5URVJQT0xBVEUsIHRlbXBsYXRlUmVwbGFjZXIpO1xuICByZXR1cm4gcGF0aC5qb2luKGRpcm5hbWUsIGAke2Jhc2VuYW1lfSR7ZXh0ID8gYC4ke2V4dH1gIDogJyd9YCk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtvYmplY3R9ICAgICAgICBbb3B0aW9uc11cbiAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW29wdGlvbnMubW9kZT0wbzc3N11cbiAqIEBwYXJhbSB7QXJyYXk8b2JqZWN0Pn0gW2NoaWxkcmVuXVxuICogQHJldHVybiB7b2JqZWN0fSBkaXIgcHJvcHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpcihvcHRpb25zID0ge30sIGNoaWxkcmVuID0gW10pIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucykpIHtcbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1wYXJhbS1yZWFzc2lnbiAqL1xuICAgIGNoaWxkcmVuID0gb3B0aW9ucztcbiAgICBvcHRpb25zID0ge307XG4gICAgLyogZXNsaW50LWVuYWJsZSBuby1wYXJhbS1yZWFzc2lnbiAqL1xuICB9XG4gIGNvbnN0IHsgbW9kZSA9IERFRkFVTFRfRElSX01PREUgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IHRlbXBEaXIgPSB7XG4gICAgZmlsZXBhdGg6IGZpbGVwYXRoKG9wdGlvbnMpLFxuICAgIGlzRGlyOiB0cnVlLFxuICAgIG1vZGUsXG4gIH07XG4gIHRyeSB7XG4gICAgZnMuYWNjZXNzU3luYyh0ZW1wRGlyLmZpbGVwYXRoLCBmcy5GX09LKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyci5jb2RlICE9PSAnRU5PRU5UJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgY2hlY2sgJHt0ZW1wRGlyLmZpbGVwYXRofS5gKTtcbiAgICB9XG4gICAgdGVtcFgucHVzaCh0ZW1wRGlyKTtcbiAgICBjb25zdCBwYXJlbnREaXIgPSBwYXRoLmRpcm5hbWUodGVtcERpci5maWxlcGF0aCk7XG4gICAgZGlyKHtcbiAgICAgIGRpcjogcGF0aC5kaXJuYW1lKHBhcmVudERpciksXG4gICAgICBuYW1lOiBwYXRoLmJhc2VuYW1lKHBhcmVudERpciksXG4gICAgfSk7XG4gICAgZnMubWtkaXJTeW5jKHRlbXBEaXIuZmlsZXBhdGgsIG1vZGUpO1xuICAgIC8vIGRlYnVnKCdDUkVBVEVEIERJUicsIHRlbXBEaXIuZmlsZXBhdGgpO1xuICB9XG4gIGlmIChjaGlsZHJlbi5sZW5ndGggIT09IDApIHtcbiAgICB0ZW1wRGlyLmNoaWxkcmVuID0gY2hpbGRyZW4ubWFwKG1vdmVUbyh0ZW1wRGlyKSk7XG4gIH1cbiAgcmV0dXJuIHRlbXBEaXI7XG59XG5cbi8qKlxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmRhdGE9JyddXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZW5jb2Rpbmc9dXRmOF1cbiAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5tb2RlPTBvNjY2XVxuICogQHJldHVybiB7b2JqZWN0fSBmaWxlIHByb3BzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaWxlKG9wdGlvbnMgPSB7fSkge1xuICBjb25zdCB7XG4gICAgZGF0YSA9ICcnLFxuICAgIGVuY29kaW5nID0gREVGQVVMVF9FTkNPRElORyxcbiAgICBtb2RlID0gREVGQVVMVF9GSUxFX01PREUsXG4gIH0gPSBvcHRpb25zO1xuICBjb25zdCB0ZW1wRmlsZSA9IHtcbiAgICBkYXRhLFxuICAgIGZpbGVwYXRoOiBmaWxlcGF0aChvcHRpb25zKSxcbiAgICBpc0ZpbGU6IHRydWUsXG4gICAgbW9kZSxcbiAgfTtcbiAgY29uc3QgcGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKHRlbXBGaWxlLmZpbGVwYXRoKTtcbiAgdGVtcFgucHVzaCh0ZW1wRmlsZSk7XG4gIHRyeSB7XG4gICAgZnMuYWNjZXNzU3luYyhwYXJlbnREaXIsIGZzLkZfT0spO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoZXJyLmNvZGUgIT09ICdFTk9FTlQnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBjaGVjayAke3BhcmVudERpcn0uYCk7XG4gICAgfVxuICAgIGRpcih7XG4gICAgICBkaXI6IHBhdGguZGlybmFtZShwYXJlbnREaXIpLFxuICAgICAgbmFtZTogcGF0aC5iYXNlbmFtZShwYXJlbnREaXIpLFxuICAgIH0pO1xuICB9XG4gIGZzLndyaXRlRmlsZVN5bmModGVtcEZpbGUuZmlsZXBhdGgsIGRhdGEsIHsgZW5jb2RpbmcsIG1vZGUgfSk7XG4gIC8vIGRlYnVnKCdDUkVBVEVEIEZJTEUnLCB0ZW1wRmlsZS5maWxlcGF0aCk7XG4gIHJldHVybiB0ZW1wRmlsZTtcbn1cblxuLy8gYXV0byBjbGVhbiB1cFxuXG5wcm9jZXNzLm9uKCdleGl0JywgY2xlYW51cCk7XG4iXX0=