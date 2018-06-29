import fs from 'fs';
import os from 'os';
import path from 'path';

import randomString from 'crypto-random-string';

// constants

const EMPTY_STRING = '';

const DEFAULT_DIR_MODE = 0o777;
const DEFAULT_ENCODING = 'utf8';
const DEFAULT_FILE_MODE = 0o666;
const DEFAULT_NAME = 'temporarily-{WWWWDDDD}';
const TMP_DIR = 'temporarily-{XXXXXXXX}';

const DIGIT = '1234567890';
const WORD = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const TEMPLATE_INTERPOLATE = /\{([^}]+)\}/g;

// utils

const sample = (array) => array[Math.floor(Math.random() * array.length)];

// private

const templateChars = {
  /* eslint-disable id-length */
  d: () => sample(DIGIT),
  w: () => sample(WORD),
  x: () => randomString(1),
  /* eslint-enable id-length */
};

const tempX = [];

// const debug = (...args) => {
//   console.log(...args);
// };

const moveTo = (toTempDir, move = true) => (fromTemp) => {
  /* eslint-disable no-param-reassign */
  const newFilepath = path.join(
    toTempDir.filepath,
    path.basename(fromTemp.filepath),
  );
  if (move) {
    fs.renameSync(fromTemp.filepath, newFilepath);
    // debug('MOVED', fromTemp.filepath, newFilepath);
  }
  fromTemp.filepath = newFilepath;
  if (fromTemp.children) {
    fromTemp.children = fromTemp.children.map(moveTo(fromTemp, false));
  }
  return fromTemp;
};

const templateReplacer = (match, innerMatch) =>
  innerMatch
    .split(EMPTY_STRING)
    .map((char) => {
      const chars = templateChars[char.toLowerCase()];
      if (!chars) {
        throw new Error(
          `Expected template placeholder to be one of: ${Object.keys(
            templateChars,
          ).join(', ')}. Received ${char}`,
        );
      }
      return chars();
    })
    .join(EMPTY_STRING);

const tmpDir = () => path.join(os.tmpdir(), TMP_DIR.replace(TEMPLATE_INTERPOLATE, templateReplacer));

// exports

/** */
export function cleanup() {
  tempX.forEach((tempFile) => {
    if (tempFile.isFile) {
      fs.unlinkSync(tempFile.filepath);
    } else {
      fs.rmdirSync(tempFile.filepath);
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
export function filepath({
  dir: dirPath = tmpDir(),
  ext = null,
  name = DEFAULT_NAME,
} = {}) {
  const dirname = path.resolve(dirPath);
  const basename = name.replace(TEMPLATE_INTERPOLATE, templateReplacer);
  return path.join(dirname, `${basename}${ext ? `.${ext}` : ''}`);
}

/**
 * @param {object}        [options]
 * @param {number}        [options.mode=0o777]
 * @param {Array<object>} [children]
 * @return {object} dir props
 */
export function dir(options = {}, children = []) {
  if (Array.isArray(options)) {
    /* eslint-disable no-param-reassign */
    children = options;
    options = {};
    /* eslint-enable no-param-reassign */
  }
  const { mode = DEFAULT_DIR_MODE } = options;
  const tempDir = {
    filepath: filepath(options),
    isDir: true,
    mode,
  };
  try {
    fs.accessSync(tempDir.filepath, fs.F_OK);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw new Error(`Could not check ${tempDir.filepath}.`);
    }
    tempX.push(tempDir);
    const parentDir = path.dirname(tempDir.filepath);
    dir({
      dir: path.dirname(parentDir),
      name: path.basename(parentDir),
    });
    fs.mkdirSync(tempDir.filepath, mode);
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
export function file(options = {}) {
  const {
    data = '',
    encoding = DEFAULT_ENCODING,
    mode = DEFAULT_FILE_MODE,
  } = options;
  const tempFile = {
    data,
    filepath: filepath(options),
    isFile: true,
    mode,
  };
  const parentDir = path.dirname(tempFile.filepath);
  tempX.push(tempFile);
  try {
    fs.accessSync(parentDir, fs.F_OK);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw new Error(`Could not check ${parentDir}.`);
    }
    dir({
      dir: path.dirname(parentDir),
      name: path.basename(parentDir),
    });
  }
  fs.writeFileSync(tempFile.filepath, data, { encoding, mode });
  // debug('CREATED FILE', tempFile.filepath);
  return tempFile;
}

// auto clean up

process.on('exit', cleanup);
