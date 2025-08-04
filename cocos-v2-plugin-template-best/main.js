'use strict';

const {createElectronWindow} = require("./electron_win")

module.exports = {
  load () {
    // execute when package loaded
  },

  unload () {
    // execute when package unloaded
  },

  // register your ipc messages here
  messages: {
    'open' () {
      // // open entry panel registered in package.json
      // // Editor.Panel.open('cocos-v2-plugin-template-best');
      
      createElectronWindow()
      

    },
  },
};