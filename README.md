# treestyletab-sessionstore-migrate

Migrates Tree Style Tab's tree structure information embedded in sessionstore.jsonlz4.

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

