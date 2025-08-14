const {editor_ws_server} = require("./editor_ws_server")
const electron = require("electron")
const path = require("path")
const net =  require('net');
const fs = require("fs")

const pkgPath = path.join(__dirname,"package.json")
const _packageStr = fs.readFileSync(pkgPath,"utf-8")
const packageJSON = JSON.parse(_packageStr)


let _bridgeServer = null;
let _win = null

function createElectronWindow(){
    const pluginPath = __dirname
    _win = new electron.BrowserWindow({
        width: 960,
        height: 640,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(pluginPath, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
            // spellcheck: false,
            // webSecurity: false,
            // allowRunningInsecureContent: true
        }
    })
    _win.once('ready-to-show', async () => {
        Editor.log("加载成功")
        _win.show()
        setGlobalConstParam()
        const  port = await findAvailablePort()
        _bridgeServer = new editor_ws_server(port);
        _bridgeServer.start();

        _win.webContents.send('init-plugin-ws-port', port);
    })
    _win.once('closed', () => {
        Editor.log("关闭弹窗")
        _win = null

        if(_bridgeServer){
            _bridgeServer.close()
        }
    })
    if(true){
        _win.loadURL('http://localhost:5173/');
    }else{
        const filePath = path.join(pluginPath,"web/index.html")
        // Editor.log("filePath",filePath)
        _win.loadFile(filePath)
    }

    // 监听 F12 键，打开 DevTools
    _win.webContents.on('before-input-event', (event, input) => {
        if (input.type === 'keyDown') {
            if(input.key === 'F12'){
                _win.webContents.openDevTools();
                event.preventDefault();
            }else if(input.key === 'F5'){
                //TODO 关闭弹窗
                _win.close();
                _win = null;
                Editor.Ipc.sendToMain(`${getPluginName()}:restart-panel`)
                event.preventDefault();
            }
        }
    });
}

function findAvailablePort(startPort = 7500){
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

function getPluginName(){
    return packageJSON.name
}

function getCurPluginPath(){
    const pluginPath = path.join(Editor.Project.path,"extensions",packageJSON.name)
    return pluginPath
}

/**
 * 通过preload.js传递一些外部的全局变量给vue端
 */
function setGlobalConstParam(){
    const projPath = Editor.Project.path
    const pluginPath = getCurPluginPath()
    const cocosVer = Editor.App.version
    const pluginName = getPluginName()
    const tmpDir = Editor.Project.tmpDir;

    const obj = {
        projPath,
        pluginPath,
        cocosVer,
        pluginName,
        tmpDir
    }
    _win.webContents.send('init-plugin-const-param', obj);
}

function logToFile(...args) {
    const message = args.join(' ');
    Editor.log(...args)
    
    // 固定日志文件路径
    const logFilePath = path.join(__dirname, "app.log");

    // 确保目录存在
    const dir = path.dirname(logFilePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // 时间戳
    const ts = new Date()
        .toISOString()
        .replace('T', ' ')
        .replace(/\..+/, ''); // yyyy-MM-dd hh:mm:ss

    // 追加写入
    try {
        fs.appendFileSync(logFilePath, `${ts}: ${message}\n`, { encoding: 'utf8' });
    } catch (e) {
        Editor.log('写入日志失败:', e);
    }
}

module.exports = {
    createElectronWindow,
    logToFile
}