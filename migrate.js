#!/usr/bin/env node

var fs     = require('fs');
var Buffer = require('buffer').Buffer;
var LZ4    = require('lz4');

function read(file) {
  var compressed = new Buffer(fs.readFileSync(file));
  compressed = compressed.slice(12, compressed.length);

  var decompressedBufferSize = compressed.length * 3;
  var decompressed;
  var decompressedSize = -1;
  while (decompressedSize < 0) {
    decompressed = new Buffer(decompressedBufferSize);
    decompressedSize = LZ4.decodeBlock(compressed, decompressed);
    decompressedBufferSize = decompressedBufferSize * 2;
  }

  return decompressed.slice(0, decompressedSize).toString('UTF-8');
}

function write(content, file) {
  content = new Buffer(content);
  var compressed = new Buffer(LZ4.encodeBound(content.length));
  var compressedBlockSize = LZ4.encodeBlock(content, compressed);

  if (file == '-') {
    process.stdout.write('mozLz40\0' + compressed);
  }
  else {
    fs.writeFileSync(file, 'mozLz40\0' + compressed);
  }
}

var source   = read(process.argv[2]);
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

write(JSON.stringify(sessions), process.argv[3] || '-');
