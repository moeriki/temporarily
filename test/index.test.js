'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const { cleanup, dir, file, filepath } = require('../lib');

// private

const exists = (tempX, check = fs.F_OK) => fs.accessSync(tempX.filepath, check);
const read = (tempFile) =>
  fs.readFileSync(tempFile.filepath, { encoding: 'utf8' });

// tests

describe('temporarily', () => {
  describe('cleanup', () => {
    it('should cleanup dirs', () => {
      const tempDir1 = dir();
      const tempDir2 = dir();
      cleanup();
      expect(() => exists(tempDir1)).toThrow();
      expect(() => exists(tempDir2)).toThrow();
    });

    it('should not cleanup dirs it didnt create', () => {
      const customDirPath = path.join(os.tmpdir(), 'nested');
      fs.mkdirSync(customDirPath);
      dir({ dir: customDirPath });
      cleanup();
      exists({ filepath: customDirPath });
      fs.rmdirSync(customDirPath);
    });

    it('should cleanup files', () => {
      const tempFile1 = file();
      const tempFile2 = file();
      cleanup();
      expect(() => exists(tempFile1)).toThrow();
      expect(() => exists(tempFile2)).toThrow();
    });

    it('should permit early cleanup', () => {
      const tempDir1 = dir();
      const tempDir2 = dir();
      tempDir2.cleanup();
      cleanup();
      expect(() => exists(tempDir1)).toThrow();
      expect(() => exists(tempDir2)).toThrow();
    });
  });

  describe('dir', () => {
    it('should create dir', () => {
      const tempDir = dir();
      exists(tempDir);
    });

    it('should create dir recursively', () => {
      const tempDir = dir({ name: '1/2/3' });
      exists(tempDir);
    });

    it('should create dir with mode', () => {
      const tempDir = dir({ mode: 0o666 });
      expect(() => exists(tempDir, fs.X_OK)).toThrow();
    });

    it('should create children', () => {
      const tempDir = dir({ name: 'tempo' }, [
        dir([file({ name: 'nestedFile' })]),
        file({ data: 'Hello World!' }),
      ]);
      expect(tempDir.filepath).toMatch(/\/tempo$/);
      expect(tempDir.children).toHaveLength(2);
      expect(tempDir.children[0].children).toHaveLength(1);
      expect(tempDir.children[0].children[0]).toMatchObject({
        filepath: expect.stringMatching(/\/nestedFile$/),
      });
      expect(read(tempDir.children[1])).toBe('Hello World!');
    });

    it('should permit early cleanup', () => {
      const tempDir1 = dir();
      const tempDir2 = dir();
      tempDir2.cleanup();
      expect(() => exists(tempDir2)).toThrow();
      expect(() => exists(tempDir1)).not.toThrow();
    })
  });

  describe('file', () => {
    it('should create file', () => {
      const tempFile = file();
      exists(tempFile);
    });

    it('should create file in nested dir', () => {
      const tempFile = file({ dir: '4/5/6' });
      exists(tempFile);
      cleanup();
    });

    it('should create file with data', () => {
      const tempFile = file({ data: 'Hello World!' });
      expect(read(tempFile)).toBe('Hello World!');
    });

    it('should permit early cleanup', () => {
      const tempFile1 = file();
      const tempFile2 = file();
      tempFile2.cleanup();
      expect(() => exists(tempFile2)).toThrow();
      expect(() => exists(tempFile1)).not.toThrow();
    })
  });

  describe('filepath', () => {
    it('should return filepath in OS tempdir with default name', () => {
      expect(filepath()).toMatch(
        new RegExp(`${os.tmpdir()}${path.sep}temporarily-\\w+\\d+`, 'i'),
      );
    });

    it('should return filepath in specified dir with default name', () => {
      expect(filepath({ dir: os.homedir() })).toMatch(
        new RegExp(`${os.homedir()}${path.sep}temporarily-\\w+\\d+`, 'i'),
      );
    });

    it('should return filepath with custom name', () => {
      expect(filepath({ name: 'abc-{wdwd}' })).toMatch(/\/abc-\w\d\w\d$/);
    });

    it('should return filepath with custom extention', () => {
      expect(filepath({ ext: 'json' })).toMatch(/\.json$/);
    });

    it('should throw on illegal template character', () => {
      expect(() => filepath({ name: 'test-{abc}' })).toThrow();
    });
  });
});
