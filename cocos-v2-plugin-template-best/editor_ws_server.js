const {WebSocketServer} = require("ws")


class editor_ws_server {
    constructor(port){
        this.m_port = port
        this.m_wsArr = []
        this.m_wss = null;
    }
    
    start() {
        this.m_wss = new WebSocketServer({ port: this.m_port });
        Editor.log(`WebSocket server running on ws://localhost:${this.m_port}`);

        this.m_wss.on('connection', (ws,req) => {
            Editor.log("plugin socket连上")
            ws.on('message', (message) => this._onMessage(ws, message));
            ws.on('close', () => this._onClose(ws));
        });
    }

    close(){
        if (this.m_wss) {
            this.m_wss.close(() => {
                Editor.log(`WebSocket server on port ${this.m_port} has been closed.`);
            });
            this.m_wss = null;
        }
    }

    async _onMessage(ws, message) {
        try{
            const msg = JSON.parse(message);      
            // Editor.log('我是server，收到消息：', msg);  
            if (msg.type === 'identify') {//每次连接成功后，客户端应该主动上报自己的身份,算是一个简陋的登录动作
                if(this.m_wsArr.indexOf(ws)<0){
                    this.m_wsArr.push(ws)
                }
            } else {
                if(this.m_wsArr.indexOf(ws)<0){//认为是没有登陆的，可能时乱入的，不处理其消息
                    return
                }
                if(msg.type=="request"){
                    if(msg.action=="eval"){
                        let ret = await evalJsStr(msg.data)
                        if(msg["bLog"]===1){
                            Editor.log(`${msg.requestId},"eval cmd:",${msg.data}`)
                        }
                        let responseObj = {
                            type:"response",
                            requestId:msg.requestId,
                            data:ret
                        }
                        const respStr = JSON.stringify(responseObj)
                        ws.send(respStr)
                        if(msg["bLog"]===1){
                            Editor.log(`${msg.requestId},"eval result:",${respStr}`)
                        }
                    }
                }
            }
        }catch(e){
            console.error(e)
        }
        
    }

    _onClose(ws) {
        let idx = this.m_wsArr.indexOf(ws)
        if(idx>=0){
            Editor.log("plugin socket断开")
            this.m_wsArr.splice(idx,1)
        }
    }
}

async function evalJsStr(jsStr){
    try{
        // 构造异步函数
        const asyncFunc = new Function(`return (async () => { ${jsStr} })()`);
        let ret = await asyncFunc();
        const type = typeof ret;
        if(type === "object"){
            ret = JSON.stringify(ret);
        }else{
            ret = ret + "";
        }
        return {
            result: "success",
            data: ret
        }
    }catch(e){
        let errMsg = "error occur";
        if(e && e.message){
            errMsg = e.message;
        }
        return {
            result: "fail",
            errMsg: errMsg
        }
    }
}

module.exports = {
    editor_ws_server
}