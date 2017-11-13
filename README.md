# treestyletab-sessionstore-migrate

Migrates [Tree Style Tab](https://addons.mozilla.org/firefox/addon/tree-style-tab/)'s tree structure information embedded in sessionstore.jsonlz4, from TST 0.19.x to TST 2.x.
For more details, see the [instruction for migration](https://github.com/piroor/treestyletab/wiki/How-to-convert-session-information-from-old-TST-0.19.x-to-new-TST-2.x).

## Install

Install [Node.js](https://nodejs.org/) at first.
On Linux, you'll need to install `npm` also.

Then install the npm package `treestyletab-sessionstore-migrate`.

```bash
$ sudo npm install -g treestyletab-sessionstore-migrate
```

## Usage

This package provides only one command: `treestyletab-sessionstore-migrate`. Parameters:

 * 1st argument: Path to the original `sessionstore.jsonlz4` file. (required)
 * 2nd argument: Path to the output file. (optional, default = stdout)


```bash
$ cd ~/.mozilla/firefox/xxxxx.default/
$ mv sessionstore.jsonlz4 sessionstore.jsonlz4.bak # backup for safety!
$ treestyletab-sessionstore-migrate sessionstore.jsonlz4.bak sessionstore.jsonlz4
```

