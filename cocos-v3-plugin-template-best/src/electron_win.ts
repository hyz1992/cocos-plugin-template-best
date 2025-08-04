// @ts-ignore
import packageJSON from '../package.json';
import { editor_ws_server } from './editor_ws_server';
let electron = require("electron")
let path = require("path")
const net =  require('net');

let _bridgeServer:any = null;
let _win:any = null

export function createElectronWindow(){
    const pluginPath = path.join(Editor.Project.path,"extensions",packageJSON.name)
    _win = new electron.BrowserWindow({
        width: 960,
        height: 640,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(pluginPath,"src", 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    })
    _win.once('ready-to-show', async () => {
        console.log("加载成功")
        _win.show()
        setGlobalConstParam()

        const  port = await findAvailablePort()
        _bridgeServer = new editor_ws_server(port);
        _bridgeServer.start();

        _win.webContents.send('init-plugin-ws-port', port);
    })
    _win.once('closed', () => {
        console.log("关闭弹窗")
        _win = null

        if(_bridgeServer){
            _bridgeServer.close()
        }
    })
    if(true){
        _win.loadURL('http://localhost:5173/');
    }else{
        const filePath = path.join(pluginPath,"web/index.html")
        // console.log("filePath",filePath)
        _win.loadFile(filePath)
    }

    // 监听 F12 键，打开 DevTools
    _win.webContents.on('before-input-event', (event:any, input:any) => {
        if (input.type === 'keyDown' && input.key === 'F12') {
            _win.webContents.openDevTools();
            event.preventDefault();
        }
    });
}

function findAvailablePort(startPort: number = 7500): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on('error', () => {
            resolve(findAvailablePort(startPort + 1));
        });
        server.listen(startPort, () => {
            const port = server.address().port;
            server.close(() => resolve(port));
        });
    });
}

/**
 * 通过preload.js传递一些外部的全局变量给vue端
 */
function setGlobalConstParam(){
    const projPath = Editor.Project.path
    const pluginPath = path.join(Editor.Project.path,"extensions",packageJSON.name)
    const cocosVer = Editor.App.version

    const obj = {
        projPath,
        pluginPath,
        cocosVer
    }
    _win.webContents.send('init-plugin-const-param', obj);
}