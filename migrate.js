#!/usr/bin/env node

// Spec: https://dxr.mozilla.org/mozilla-central/rev/2535bad09d720e71a982f3f70dd6925f66ab8ec7/toolkit/components/lz4/lz4.js#54

var fs     = require('fs');
var Buffer = require('buffer').Buffer;
var LZ4    = require('lz4');

const MAGIC_NUMBER = new Uint8Array(
  'mozLz40'.split('')
    .map(function(c) { return c.charCodeAt(0); })
    .concat([0])
);
const SIZE_HEADER_BYTES = 4;

function read(file) {
  var compressed = Buffer.from(fs.readFileSync(file));

  var sizePart = new Uint8Array(compressed)
                  .slice(MAGIC_NUMBER.byteLength, MAGIC_NUMBER.byteLength + SIZE_HEADER_BYTES);
  var sizeBuffer = new ArrayBuffer(SIZE_HEADER_BYTES);
  var sizeView   = new Uint8Array(sizeBuffer);
  for (var i = 0; i < SIZE_HEADER_BYTES; i++) {
    sizeView[i] = sizePart[i];
  }
  var decompressedBufferSize = new DataView(sizeBuffer).getUint32(0, true);

  //console.log(compressed.slice(0, 100));

  compressed = compressed.slice(MAGIC_NUMBER.byteLength + SIZE_HEADER_BYTES, compressed.length);
  var decompressed = Buffer.alloc(decompressedBufferSize);
  var decompressedSize = LZ4.decodeBlock(compressed, decompressed);

  return decompressed.slice(0, decompressedSize).toString('UTF-8');
}

function write(content, file) {
  content = Buffer.from(content);
  var compressed     = new Buffer(LZ4.encodeBound(content.length));
  var compressedSize = LZ4.encodeBlock(content, compressed);
  compressed = compressed.slice(0, compressedSize);

  var magicNumber = Buffer.from(MAGIC_NUMBER);

  var size     = new ArrayBuffer(4);
  var sizeView = new DataView(size);
  sizeView.setUint32(0, content.byteLength, true);
  size = Buffer.from(size);

  var payload = Buffer.concat(
    [magicNumber, size, compressed],
    magicNumber.byteLength + size.byteLength + compressed.byteLength
  );
  //console.log(payload.slice(0, 100));
  if (file == '-') {
    process.stdout.write(payload);
  }
  else {
    fs.writeFileSync(file, payload);
  }
}

var source   = read(process.argv[2]);
//console.log(source);
var sessions = JSON.parse(source);
sessions.windows.forEach(function(window) {
  var base = 'extension:treestyletab@piro.sakura.ne.jp';
  var treeStructure = [];
  var currentTree = [];
  var tabs = window.tabs.slice(0).reverse();
  var tabsById = {};
  tabs.forEach(function(tab) {
    var data = tab.extData;
    var id = data['treestyletab-id'];
    tabsById[id] = tab;
    if (data['treestyletab-children'])
      data['treestyletab-children'].split('|').forEach(function(child) {
        child = tabsById[child];
        if (child &&
            !child.extData['treestyletab-ancestors'])
          child.extData['treestyletab-ancestors'] = id;
      });
  });
  window.tabs.forEach(function(tab) {
    var data = tab.extData;
    var id = data['treestyletab-id'];
    data[base+':data-persistent-id'] = JSON.stringify({ id: id });
    data[base+':insert-before'] = JSON.stringify(data['treestyletab-insert-before'] || '');
    data[base+':insert-after'] = JSON.stringify(data['treestyletab-insert-after'] || '');
    data[base+':subtree-collapsed'] = JSON.stringify(data['treestyletab-subtree-collapsed'] != 'false');
    var ancestors = (data['treestyletab-ancestors'] || '').split('|').filter(function(id) { return !!id; });
    data[base+':ancestors'] = JSON.stringify(ancestors);
    var children = (data['treestyletab-children'] || '').split('|').filter(function(id) { return !!id; });
    data[base+':children'] = JSON.stringify(children);

    var item = {
      parent:    -1,
      collapsed: data[base+':subtree-collapsed'] != 'false'
    };
    for (var i = 0, maxi = ancestors.length; i < maxi; i++) {
      item.parent = currentTree.indexOf(ancestors[i]);
      if (item.parent > -1)
        break;
    }
    treeStructure.push(item);
    if (item.parent < 0)
      currentTree = [];
    currentTree.push(id);
  });
  window.extData[base+':tree-structure'] = JSON.stringify(treeStructure);
});
//console.log(JSON.stringify(sessions));

write(JSON.stringify(sessions), process.argv[3] || '-');
