#!/usr/bin/env node

// Spec: https://dxr.mozilla.org/mozilla-central/rev/2535bad09d720e71a982f3f70dd6925f66ab8ec7/toolkit/components/lz4/lz4.js#54

var fs     = require('fs');
var Buffer = require('buffer').Buffer;
var mozlz4a = require('mozlz4a');

function read(file) {
  var compressed = fs.readFileSync(file);
  return mozlz4a.decompress(compressed).toString('UTF-8');
}

function write(content, file) {
  var compressed = mozlz4a.compress(Buffer.from(content));
  if (file == '-') {
    process.stdout.write(compressed);
  }
  else {
    fs.writeFileSync(file, compressed);
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
