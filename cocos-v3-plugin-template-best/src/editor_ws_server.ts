import {WebSocketServer} from "ws"

interface OneMsg{
    type: string, 
    action?: string; 
    data?: any; 
    requestId?: number;
}

export class editor_ws_server {
    private m_port:any = null
    private m_wsArr:Array<any> = []
    private m_wss:any = null;

    constructor(port:number) {
        this.m_port = port;
        this.m_wsArr = []
    }

    start() {
        this.m_wss = new WebSocketServer({ port: this.m_port });
        console.log(`WebSocket server running on ws://localhost:${this.m_port}`);

        this.m_wss.on('connection', (ws:any,req:any) => {
            console.log("plugin socket连上")
            ws.on('message', (message:any) => this._onMessage(ws, message));
            ws.on('close', () => this._onClose(ws));
        });
    }

    close(){
        if (this.m_wss) {
            this.m_wss.close(() => {
                console.log(`WebSocket server on port ${this.m_port} has been closed.`);
            });
            this.m_wss = null;
        }
    }

    async _onMessage(ws:any, message:any) {
        try{
            const msg = JSON.parse(message);      
            // console.log('我是server，收到消息：', msg);  
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
                            console.log(`${msg.requestId},"eval cmd:",${msg.data}`)
                        }
                        let responseObj:OneMsg = {
                            type:"response",
                            requestId:msg.requestId,
                            data:ret
                        }
                        const respStr = JSON.stringify(responseObj)
                        ws.send(respStr)
                        if(msg["bLog"]===1){
                            console.log(`${msg.requestId},"eval result:",${respStr}`)
                        }
                    }
                }
            }
        }catch(e:any){
            console.error(e)
        }
        
    }

    _onClose(ws:any) {
        let idx = this.m_wsArr.indexOf(ws)
        if(idx>=0){
            console.log("plugin socket断开")
            this.m_wsArr.splice(idx,1)
        }
    }
}

async function evalJsStr(jsStr:string){
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
    }catch(e:any){
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

