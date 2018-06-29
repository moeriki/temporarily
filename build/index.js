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
      dirPath = _ref$dir === undefined ? _os2.default.tmpdir() : _ref$dir,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9pbmRleC5qcyJdLCJuYW1lcyI6WyJjbGVhbnVwIiwiZmlsZXBhdGgiLCJkaXIiLCJmaWxlIiwiRU1QVFlfU1RSSU5HIiwiREVGQVVMVF9ESVJfTU9ERSIsIkRFRkFVTFRfRU5DT0RJTkciLCJERUZBVUxUX0ZJTEVfTU9ERSIsIkRFRkFVTFRfTkFNRSIsIkRJR0lUIiwiV09SRCIsIlRFTVBMQVRFX0lOVEVSUE9MQVRFIiwic2FtcGxlIiwiYXJyYXkiLCJNYXRoIiwiZmxvb3IiLCJyYW5kb20iLCJsZW5ndGgiLCJ0ZW1wbGF0ZUNoYXJzIiwiZCIsInciLCJ0ZW1wWCIsIm1vdmVUbyIsInRvVGVtcERpciIsIm1vdmUiLCJmcm9tVGVtcCIsIm5ld0ZpbGVwYXRoIiwicGF0aCIsImpvaW4iLCJiYXNlbmFtZSIsImZzIiwicmVuYW1lU3luYyIsImNoaWxkcmVuIiwibWFwIiwidGVtcGxhdGVSZXBsYWNlciIsIm1hdGNoIiwiaW5uZXJNYXRjaCIsInNwbGl0IiwiY2hhciIsImNoYXJzIiwidG9Mb3dlckNhc2UiLCJFcnJvciIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwidGVtcEZpbGUiLCJpc0ZpbGUiLCJ1bmxpbmtTeW5jIiwicm1kaXJTeW5jIiwiZGlyUGF0aCIsIm9zIiwidG1wZGlyIiwiZXh0IiwibmFtZSIsImRpcm5hbWUiLCJyZXNvbHZlIiwicmVwbGFjZSIsIm9wdGlvbnMiLCJBcnJheSIsImlzQXJyYXkiLCJtb2RlIiwidGVtcERpciIsImlzRGlyIiwiYWNjZXNzU3luYyIsIkZfT0siLCJlcnIiLCJjb2RlIiwicHVzaCIsInBhcmVudERpciIsIm1rZGlyU3luYyIsImRhdGEiLCJlbmNvZGluZyIsIndyaXRlRmlsZVN5bmMiLCJwcm9jZXNzIiwib24iXSwibWFwcGluZ3MiOiI7Ozs7O1FBb0VnQkEsTyxHQUFBQSxPO1FBa0JBQyxRLEdBQUFBLFE7UUFnQkFDLEcsR0FBQUEsRztRQXdDQUMsSSxHQUFBQSxJOztBQTlJaEI7Ozs7QUFDQTs7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QWFjLFNBQWIsQ0FESDtBQUVGZixZQUFNMUIsZUFBS0UsUUFBTCxDQUFjdUMsU0FBZDtBQUZKLEtBQUo7QUFJRDtBQUNEdEMsZUFBRzBDLGFBQUgsQ0FBaUIzQixTQUFTNUMsUUFBMUIsRUFBb0NxRSxJQUFwQyxFQUEwQyxFQUFFQyxRQUFGLEVBQVlYLElBQVosRUFBMUM7QUFDQSxTQUFPZixRQUFQO0FBQ0Q7O0FBRUQ7O0FBRUE0QixRQUFRQyxFQUFSLENBQVcsTUFBWCxFQUFtQjFFLE9BQW5CIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBvcyBmcm9tICdvcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuLy8gY29uc3RhbnRzXG5cbmNvbnN0IEVNUFRZX1NUUklORyA9ICcnO1xuXG5jb25zdCBERUZBVUxUX0RJUl9NT0RFID0gMG83Nzc7XG5jb25zdCBERUZBVUxUX0VOQ09ESU5HID0gJ3V0ZjgnO1xuY29uc3QgREVGQVVMVF9GSUxFX01PREUgPSAwbzY2NjtcbmNvbnN0IERFRkFVTFRfTkFNRSA9ICd0ZW1wb3JhcmlseS17V1dXV0RERER9JztcblxuY29uc3QgRElHSVQgPSAnMTIzNDU2Nzg5MCc7XG5jb25zdCBXT1JEID0gJ2FiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVonO1xuXG5jb25zdCBURU1QTEFURV9JTlRFUlBPTEFURSA9IC9cXHsoW159XSspXFx9L2c7XG5cbi8vIHV0aWxzXG5cbmNvbnN0IHNhbXBsZSA9IChhcnJheSkgPT4gYXJyYXlbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyYXkubGVuZ3RoKV07XG5cbi8vIHByaXZhdGVcblxuY29uc3QgdGVtcGxhdGVDaGFycyA9IHtcbiAgLyogZXNsaW50LWRpc2FibGUgaWQtbGVuZ3RoICovXG4gIGQ6ICgpID0+IHNhbXBsZShESUdJVCksXG4gIHc6ICgpID0+IHNhbXBsZShXT1JEKSxcbiAgLyogZXNsaW50LWVuYWJsZSBpZC1sZW5ndGggKi9cbn07XG5cbmNvbnN0IHRlbXBYID0gW107XG5cbmNvbnN0IG1vdmVUbyA9ICh0b1RlbXBEaXIsIG1vdmUgPSB0cnVlKSA9PiAoZnJvbVRlbXApID0+IHtcbiAgLyogZXNsaW50LWRpc2FibGUgbm8tcGFyYW0tcmVhc3NpZ24gKi9cbiAgY29uc3QgbmV3RmlsZXBhdGggPSBwYXRoLmpvaW4oXG4gICAgdG9UZW1wRGlyLmZpbGVwYXRoLFxuICAgIHBhdGguYmFzZW5hbWUoZnJvbVRlbXAuZmlsZXBhdGgpLFxuICApO1xuICBpZiAobW92ZSkge1xuICAgIGZzLnJlbmFtZVN5bmMoZnJvbVRlbXAuZmlsZXBhdGgsIG5ld0ZpbGVwYXRoKTtcbiAgfVxuICBmcm9tVGVtcC5maWxlcGF0aCA9IG5ld0ZpbGVwYXRoO1xuICBpZiAoZnJvbVRlbXAuY2hpbGRyZW4pIHtcbiAgICBmcm9tVGVtcC5jaGlsZHJlbiA9IGZyb21UZW1wLmNoaWxkcmVuLm1hcChtb3ZlVG8oZnJvbVRlbXAsIGZhbHNlKSk7XG4gIH1cbiAgcmV0dXJuIGZyb21UZW1wO1xufTtcblxuY29uc3QgdGVtcGxhdGVSZXBsYWNlciA9IChtYXRjaCwgaW5uZXJNYXRjaCkgPT5cbiAgaW5uZXJNYXRjaFxuICAgIC5zcGxpdChFTVBUWV9TVFJJTkcpXG4gICAgLm1hcCgoY2hhcikgPT4ge1xuICAgICAgY29uc3QgY2hhcnMgPSB0ZW1wbGF0ZUNoYXJzW2NoYXIudG9Mb3dlckNhc2UoKV07XG4gICAgICBpZiAoIWNoYXJzKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgRXhwZWN0ZWQgdGVtcGxhdGUgcGxhY2Vob2xkZXIgdG8gYmUgb25lIG9mOiAke09iamVjdC5rZXlzKFxuICAgICAgICAgICAgdGVtcGxhdGVDaGFycyxcbiAgICAgICAgICApLmpvaW4oJywgJyl9LiBSZWNlaXZlZCAke2NoYXJ9YCxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjaGFycygpO1xuICAgIH0pXG4gICAgLmpvaW4oRU1QVFlfU1RSSU5HKTtcblxuLy8gZXhwb3J0c1xuXG4vKiogKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGVhbnVwKCkge1xuICB0ZW1wWC5mb3JFYWNoKCh0ZW1wRmlsZSkgPT4ge1xuICAgIGlmICh0ZW1wRmlsZS5pc0ZpbGUpIHtcbiAgICAgIGZzLnVubGlua1N5bmModGVtcEZpbGUuZmlsZXBhdGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBmcy5ybWRpclN5bmModGVtcEZpbGUuZmlsZXBhdGgpO1xuICAgIH1cbiAgfSk7XG4gIHRlbXBYLmxlbmd0aCA9IDA7XG59XG5cbi8qKlxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmRpcj1vcy50bXBkaXJdXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZXh0XVxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLm5hbWU9dGVtcG9yYXJpbHkte1dXV1dEREREfV1cbiAqIEByZXR1cm4ge3N0cmluZ30gZmlsZXBhdGhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbGVwYXRoKHtcbiAgZGlyOiBkaXJQYXRoID0gb3MudG1wZGlyKCksXG4gIGV4dCA9IG51bGwsXG4gIG5hbWUgPSBERUZBVUxUX05BTUUsXG59ID0ge30pIHtcbiAgY29uc3QgZGlybmFtZSA9IHBhdGgucmVzb2x2ZShkaXJQYXRoKTtcbiAgY29uc3QgYmFzZW5hbWUgPSBuYW1lLnJlcGxhY2UoVEVNUExBVEVfSU5URVJQT0xBVEUsIHRlbXBsYXRlUmVwbGFjZXIpO1xuICByZXR1cm4gcGF0aC5qb2luKGRpcm5hbWUsIGAke2Jhc2VuYW1lfSR7ZXh0ID8gYC4ke2V4dH1gIDogJyd9YCk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtvYmplY3R9ICAgICAgICBbb3B0aW9uc11cbiAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgW29wdGlvbnMubW9kZT0wbzc3N11cbiAqIEBwYXJhbSB7QXJyYXk8b2JqZWN0Pn0gW2NoaWxkcmVuXVxuICogQHJldHVybiB7b2JqZWN0fSBkaXIgcHJvcHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpcihvcHRpb25zID0ge30sIGNoaWxkcmVuID0gW10pIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucykpIHtcbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1wYXJhbS1yZWFzc2lnbiAqL1xuICAgIGNoaWxkcmVuID0gb3B0aW9ucztcbiAgICBvcHRpb25zID0ge307XG4gICAgLyogZXNsaW50LWVuYWJsZSBuby1wYXJhbS1yZWFzc2lnbiAqL1xuICB9XG4gIGNvbnN0IHsgbW9kZSA9IERFRkFVTFRfRElSX01PREUgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IHRlbXBEaXIgPSB7XG4gICAgZmlsZXBhdGg6IGZpbGVwYXRoKG9wdGlvbnMpLFxuICAgIGlzRGlyOiB0cnVlLFxuICAgIG1vZGUsXG4gIH07XG4gIHRyeSB7XG4gICAgZnMuYWNjZXNzU3luYyh0ZW1wRGlyLmZpbGVwYXRoLCBmcy5GX09LKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyci5jb2RlICE9PSAnRU5PRU5UJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgY2hlY2sgJHt0ZW1wRGlyLmZpbGVwYXRofS5gKTtcbiAgICB9XG4gICAgdGVtcFgucHVzaCh0ZW1wRGlyKTtcbiAgICBjb25zdCBwYXJlbnREaXIgPSBwYXRoLmRpcm5hbWUodGVtcERpci5maWxlcGF0aCk7XG4gICAgZGlyKHtcbiAgICAgIGRpcjogcGF0aC5kaXJuYW1lKHBhcmVudERpciksXG4gICAgICBuYW1lOiBwYXRoLmJhc2VuYW1lKHBhcmVudERpciksXG4gICAgfSk7XG4gICAgZnMubWtkaXJTeW5jKHRlbXBEaXIuZmlsZXBhdGgsIG1vZGUpO1xuICB9XG4gIGlmIChjaGlsZHJlbi5sZW5ndGggIT09IDApIHtcbiAgICB0ZW1wRGlyLmNoaWxkcmVuID0gY2hpbGRyZW4ubWFwKG1vdmVUbyh0ZW1wRGlyKSk7XG4gIH1cbiAgcmV0dXJuIHRlbXBEaXI7XG59XG5cbi8qKlxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmRhdGE9JyddXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZW5jb2Rpbmc9dXRmOF1cbiAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5tb2RlPTBvNjY2XVxuICogQHJldHVybiB7b2JqZWN0fSBmaWxlIHByb3BzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaWxlKG9wdGlvbnMgPSB7fSkge1xuICBjb25zdCB7XG4gICAgZGF0YSA9ICcnLFxuICAgIGVuY29kaW5nID0gREVGQVVMVF9FTkNPRElORyxcbiAgICBtb2RlID0gREVGQVVMVF9GSUxFX01PREUsXG4gIH0gPSBvcHRpb25zO1xuICBjb25zdCB0ZW1wRmlsZSA9IHtcbiAgICBkYXRhLFxuICAgIGZpbGVwYXRoOiBmaWxlcGF0aChvcHRpb25zKSxcbiAgICBpc0ZpbGU6IHRydWUsXG4gICAgbW9kZSxcbiAgfTtcbiAgY29uc3QgcGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKHRlbXBGaWxlLmZpbGVwYXRoKTtcbiAgdGVtcFgucHVzaCh0ZW1wRmlsZSk7XG4gIHRyeSB7XG4gICAgZnMuYWNjZXNzU3luYyhwYXJlbnREaXIsIGZzLkZfT0spO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoZXJyLmNvZGUgIT09ICdFTk9FTlQnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBjaGVjayAke3BhcmVudERpcn0uYCk7XG4gICAgfVxuICAgIGRpcih7XG4gICAgICBkaXI6IHBhdGguZGlybmFtZShwYXJlbnREaXIpLFxuICAgICAgbmFtZTogcGF0aC5iYXNlbmFtZShwYXJlbnREaXIpLFxuICAgIH0pO1xuICB9XG4gIGZzLndyaXRlRmlsZVN5bmModGVtcEZpbGUuZmlsZXBhdGgsIGRhdGEsIHsgZW5jb2RpbmcsIG1vZGUgfSk7XG4gIHJldHVybiB0ZW1wRmlsZTtcbn1cblxuLy8gYXV0byBjbGVhbiB1cFxuXG5wcm9jZXNzLm9uKCdleGl0JywgY2xlYW51cCk7XG4iXX0=