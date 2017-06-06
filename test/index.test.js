import fs from 'fs';
import os from 'os';
import path from 'path';

import { cleanup, dir, file, filepath } from '../lib';

// private

const exists = (existsFilePath, check = fs.F_OK) => fs.accessSync(existsFilePath, check);

// tests

describe('temporarily', () => {

  describe('cleanup', () => {

    it('should cleanup dirs', () => {
      const tempDir1 = dir();
      const tempDir2 = dir();
      cleanup();
      expect(() => exists(tempDir1.filepath)).toThrow();
      expect(() => exists(tempDir2.filepath)).toThrow();
    });

    it('should not cleanup dirs it didnt create', () => {
      const customDirPath = path.join(os.tmpdir(), 'nested');
      fs.mkdirSync(customDirPath);
      dir({ dir: customDirPath });
      cleanup();
      exists(customDirPath);
      fs.rmdirSync(customDirPath);
    });

    it('should cleanup files', () => {
      const tempFile1 = file();
      const tempFile2 = file();
      cleanup();
      expect(() => exists(tempFile1.filepath)).toThrow();
      expect(() => exists(tempFile2.filepath)).toThrow();
    });

  });

  describe('dir', () => {

    it('should create dir', () => {
      const tempDir = dir();
      exists(tempDir.filepath);
    });

    it('should create dir recursively', () => {
      const tempDir = dir({ name: '1/2/3' });
      exists(tempDir.filepath);
    });

    it('should create dir with mode', () => {
      const tempDir = dir({ mode: 0o666 });
      expect(() => exists(tempDir.filepath, fs.X_OK)).toThrow();
    });

    it('should create files within', () => {
      const tempDir = dir({ files: [{}, {}] });
      expect(tempDir.files).toBeInstanceOf(Array);
      expect(tempDir.files.length).toBe(2);
      exists(tempDir.files[0].filepath);
      exists(tempDir.files[1].filepath);
    });

  });

  describe('file', () => {

    it('should create file', () => {
      const tempFile = file();
      exists(tempFile.filepath);
    });

    it('should create file in nested dir', () => {
      const tempFile = file({ dir: '1/2/3' });
      exists(tempFile.filepath);
    });

    it('should create file with data', () => {
      const tempFile = file({ data: 'Hello World!' });
      expect(fs.readFileSync(tempFile.filepath, { encoding: 'utf8' })).toBe('Hello World!');
    });

  });

  describe('filepath', () => {

    it('should return filepath in OS tempdir with default name', () => {
      expect(filepath()).toMatch(
        new RegExp(`${os.tmpdir()}${path.sep}temporarily-\\w+\\d+`, 'i')
      );
    });

    it('should return filepath in specified dir with default name', () => {
      expect(filepath({ dir: os.homedir() })).toMatch(
        new RegExp(`${os.homedir()}${path.sep}temporarily-\\w+\\d+`, 'i')
      );
    });

    it('should return filepath with custom name', () => {
      expect(filepath({ name: 'abc-{wdwd}' })).toMatch(
        /\/abc-\w\d\w\d$/
      );
    });

  });

  afterEach(() => {
    cleanup();
  });

});
