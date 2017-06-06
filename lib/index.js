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

const OS_TMP_DIR = os.tmpdir();

const TEMPLATE_INTERPOLATE = /\{([^}]+)\}/g;

// private

const random = (chars) => chars[Math.round(Math.random() * chars.length)];

const templateChars = {
  /* eslint-disable id-length */
  d: DIGIT,
  w: WORD,
  /* eslint-enable id-length */
};

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

const tempDirs = [];
const tempFiles = [];

// auto clean up

process.on('exit', cleanup);

// exports

export function cleanup() {
  tempFiles.forEach((tempFile) => {
    fs.unlinkSync(tempFile.filepath);
  });
  tempFiles.length = 0;
  tempDirs.forEach((tempDir) => {
    fs.rmdirSync(tempDir.filepath);
  });
  tempDirs.length = 0;
}

export function dir(options = {}) {
  const {
    files,
    mode = DEFAULT_DIR_MODE,
  } = options;
  const tempDir = {
    filepath: filepath(options),
    mode,
  };
  try {
    fs.accessSync(tempDir.filepath, fs.F_OK);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw new Error(`Could not check ${tempDir.filepath}.`);
    }
    tempDirs.push(tempDir);
    const parentDir = path.dirname(tempDir.filepath);
    dir({
      dir: path.dirname(parentDir),
      name: path.basename(parentDir),
    });
    fs.mkdirSync(tempDir.filepath, mode);
  }
  if (files) {
    const dirFileOptions = { dir: tempDir.filepath };
    tempDir.files = files.map((dirFile) =>
      file(Object.assign({}, dirFileOptions, dirFile))
    );
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
  tempFiles.push(tempFile);
  return tempFile;
}

export function filepath({
  dir: dirPath = OS_TMP_DIR,
  ext = null,
  name = DEFAULT_NAME,
} = {}) {
  const dirname = path.resolve(dirPath);
  const basename = name.replace(TEMPLATE_INTERPOLATE, templateReplacer);
  return path.join(dirname, `${basename}${ext || ''}`);
}
