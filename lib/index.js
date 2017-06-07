import fs from 'fs';
import os from 'os';
import path from 'path';

// constants

const EMPTY_STRING = '';

const DEFAULT_DIR_MODE = 0o777;
const DEFAULT_ENCODING = 'utf8';
const DEFAULT_FILE_MODE = 0o666;
const DEFAULT_NAME = 'temporarily-{WWWWDDDD}';

const DIGIT = '1234567890';
const WORD = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const TEMPLATE_INTERPOLATE = /\{([^}]+)\}/g;

// private

const templateChars = {
  /* eslint-disable id-length */
  d: DIGIT,
  w: WORD,
  /* eslint-enable id-length */
};

const tempX = [];

const moveTo = (toTempDir, move = true) => (fromTemp) => {
  const newFilepath = path.join(toTempDir.filepath, path.basename(fromTemp.filepath));
  if (move) {
    fs.renameSync(fromTemp.filepath, newFilepath);
  }
  fromTemp.filepath = newFilepath;
  if (fromTemp.children) {
    fromTemp.children = fromTemp.children.map(moveTo(fromTemp, false));
  }
  return fromTemp;
};

const random = (chars) => chars[Math.floor(Math.random() * chars.length)];

const templateReplacer = (match, innerMatch) => innerMatch
  .split(EMPTY_STRING)
  .map((char) => {
    const chars = templateChars[char.toLowerCase()];
    if (!chars) {
      throw new Error(`Expected template placeholder to be one of: ${Object.keys(templateChars).join(', ')}. Received ${char}`);
    }
    return random(chars);
  })
  .join(EMPTY_STRING)
;

// auto clean up

process.on('exit', cleanup);

// exports

export function cleanup() {
  tempX.forEach((tempFile) => {
    if (tempFile.isFile) {
      fs.unlinkSync(tempFile.filepath);
    } else {
      fs.rmdir(tempFile.filepath);
    }
  });
  tempX.length = 0;
}

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
  }
  if (children.length !== 0) {
    tempDir.children = children.map(moveTo(tempDir));
  }
  return tempDir;
}

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
  tempX.push(tempFile);
  return tempFile;
}

export function filepath({
  dir: dirPath = os.tmpdir(),
  ext = null,
  name = DEFAULT_NAME,
} = {}) {
  const dirname = path.resolve(dirPath);
  const basename = name.replace(TEMPLATE_INTERPOLATE, templateReplacer);
  return path.join(dirname, `${basename}${ext ? `.${ext}` : ''}`);
}
