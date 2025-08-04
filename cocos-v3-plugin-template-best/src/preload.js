
const electron = require('electron');
const path = require('path');
const net = require('net');
const fs = require('fs');
const os = require('os');
const http = require('http');
const crypto = require('crypto');
const url = require('url');
const util = require('util');
const child_process = require('child_process');
const ws = require('ws');
// const fsExtra = require('fs-extra');

const execAsync = util.promisify(child_process.exec);

let _wsPort = null;
electron.ipcRenderer.on('init-plugin-ws-port', (event, value) => {
  _wsPort = value;
});

let _constParam = null;
electron.ipcRenderer.on('init-plugin-const-param', (event, value) => {
  _constParam = value;
});

electron.contextBridge.exposeInMainWorld('_mod', {
  fs,
  // fsExtra,
  path,
  os,
  http,
  crypto,
  url,
  util,
  net,
  exec: child_process.exec,
  spawn: child_process.spawn,
  ws,
  execAsync,

  getPluginPort: () => {
    if(_wsPort){
      return Promise.resolve(_wsPort)
    }
    return new Promise((resolve) => {
      electron.ipcRenderer.once('init-plugin-ws-port', (event, value) => {
        resolve(value);
      });
    })
  },
  getPluginGlobalConst:()=>{
    if(_constParam){
      return Promise.resolve(_constParam)
    }
    return new Promise((resolve) => {
      electron.ipcRenderer.once('init-plugin-const-param', (event, value) => {
        resolve(value);
      });
    }) 
  }
});