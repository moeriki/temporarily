<p align="center">
  <h3 align="center">temporarily</h3>
  <p align="center">Create temporary directories and files.<p>
  <p align="center">
    <a href="https://www.npmjs.com/package/temporarily">
      <img src="https://img.shields.io/npm/v/temporarily.svg" alt="npm version">
    </a>
    <a href="https://www.npmjs.com/package/temporarily">
      <img src="https://img.shields.io/node/v/temporarily.svg" alt="npm version">
    </a>
    <a href="https://travis-ci.org/Moeriki/temporarily">
      <img src="https://travis-ci.org/Moeriki/temporarily.svg?branch=master" alt="Build Status"></img>
    </a>
    <a href="https://coveralls.io/github/Moeriki/temporarily?branch=master">
      <img src="https://coveralls.io/repos/github/Moeriki/temporarily/badge.svg?branch=master" alt="Coverage Status"></img>
    </a>
    <a href="https://david-dm.org/moeriki/temporarily">
      <img src="https://david-dm.org/moeriki/temporarily/status.svg" alt="dependencies Status"></img>
    </a>
  </p>
</p>

---

## Install

```sh
npm install --save temporarily
```

## Why

There are a [few](https://github.com/vesln/temporary) [other](https://github.com/raszi/node-tmp) [temporary](https://github.com/bruce/node-temp) file creation utilities. Here's why I made my own.

* cleanup by default (on process exit), no opt-out
* sync by default, meant for testing
* easy nested dir / file scaffolding with content

## Usage

```js
const temp = require('temporarily');
// or
const { dir, file, filepath } = require('temporarily');
// or
import { dir, file, filepath } from 'temporarily';
```

## API

### filepath

Generate a filepath. **No file is created.**

`filepath( [options:object] )`

* options.**dir** `:string` – default `os.tmpdir()`
* options.**ext** `:string`
* options.**name** `:string` – default `temporarily-{wwwwdddd}`

```js
filepath();
// '/var/folders/30/T/temporarily-tkEK6023'

filepath({ ext: 'json' });
// '/var/folders/30/T/temporarily-tkEK6023.json'

filepath({ dir: os.homedir() });
// '/home/myuser/temporarily-tkEK6023'

filepath({ name: 'file-{wwdd}' });
// '/var/folders/30/T/file-tk60'
```

### file

Create a temporary file.

`file( [options:object] )`

* options.**data** `:string|Buffer` – default `''`
* options.**encoding** `:string` – default `'utf8'`
* options.**mode** `:string` – default `0o666`

All options from **filepath** can be applied as well.

```js
file();
// { data: '',
//   filepath: '/var/folders/30/T/temporarily-RdgC6481',
//   mode: 438 }

file({ mode: 0o777 });
// { data: '',
//   filepath: '/var/folders/30/T/temporarily-RdgC6481',
//   mode: 511 }

file({ data: 'Hello World!' }); // write file contents
// { data: 'Hello World!',
//   filepath: '/var/folders/30/T/temporarily-RdgC6481',
//   mode: 438 }
```

### dir

Create a temporary directory.

`dir( [options:object], [children:Array<object>] )`

* options.**mode** `:string` – default `0o777`

All options from **filepath** can be applied as well.

```js
dir();
// { filepath: '/var/folders/30/T/temporarily-tkEK6023',
//   mode: 511 }

dir({ dir: os.homedir() });
// { filepath: '/home/myuser/temporarily-tkEK6023',
//   mode: 511 }

dir({ mode: 0o666 });
// { filepath: '/var/folders/30/T/temporarily-tkEK6023',
//   mode: 438 }

dir({ name: 'tempo' }, [
  dir([
    file({ name: 'nestedFile' }),
  ]),
  file({ data: 'Hello World!' }),
])
// { filepath: '/var/folders/30/T/tempo',
//   mode: 511,
//   children:
//    [ { filepath: '/var/folders/30/T/tempo/temporarily-MwpX5662',
//        mode: 511,
//        children:
//         [ { data: '',
//             filepath: '/var/folders/30/T/tempo/temporarily-MwpX5662/nestedFile',
//             mode: 438 } ] },
//      { data: 'Hello World!',
//        filepath: '/var/folders/30/T/tempo/temporarily-yxYz6104',
//        mode: 438 } ] }
```
