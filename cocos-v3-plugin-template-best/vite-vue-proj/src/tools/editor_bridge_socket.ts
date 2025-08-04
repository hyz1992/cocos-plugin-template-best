const _mod = (window as any)._mod;
interface OneMsg{
    type: string, 
    action?: string; 
    data?: any; 
    requestId?: number;
}

let _accId = 0;
function _getAccId(){
    return ++_accId
}

class editor_bridge_socket {
    private m_socket: WebSocket; // WebSocket 实例
    private m_pendingRequests: Map<number,any>; // 存储未完成的请求

    constructor(){
        this.m_socket = null as any
        this.m_pendingRequests = new Map()
    }

    private closeSocket(){
        if(this.m_socket){
            this.m_socket.close()
            this.m_socket = null
        }
    }

    public checkIsConnect(){
        if( this.m_socket && this.m_socket.readyState === WebSocket.OPEN){
            return true
        }
        return false
    }

    private m_url = ""
    async connectToServer(url:string) {
        this.m_url = url
        this.closeSocket()
        let ret = await new Promise<boolean>((resolve, reject) => {
            this.m_socket = new WebSocket(url);
            // console.log("ggggggggg",url,this.m_socket.url)
            this.m_socket.onopen = () => {
                console.log(' Connected to server');
                this._send({ type: 'identify' })
                resolve(true);
                for(let cb of this._socketStateCallbacks){
                    cb(true)
                }
            };

            this.m_socket.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                this._onMessage(msg);
            };

            this.m_socket.onclose = () => {
                console.log(' Disconnected from server');

                for(let cb of this._socketStateCallbacks){
                    if(typeof cb=="function"){
                        cb(false)
                    }
                }

                setTimeout(() => {
                    this.connectToServer(this.m_url)
                }, 5000);
            };

            this.m_socket.onerror = (error) => {
                console.error('[Plugin] WebSocket error:', error);
                resolve(false);
            };
        });
        this._onOpenResolve.forEach((resolve) => {
            resolve(ret)
        })
        this._onOpenResolve = []
        return ret
    }

    private async _send(obj: OneMsg) {
        if (obj.data==null){
            delete obj.data
        }
        let jsonStr = JSON.stringify(obj);
        this.m_socket?.send(jsonStr);
    }

    private async _onMessage(msg: OneMsg) {
        if (msg.type === 'response' && msg.requestId != null) {//表示这条是对之前自己发送的请求的回复
            const pending = this.m_pendingRequests.get(msg.requestId);
            if (pending) {
                this.m_pendingRequests.delete(msg.requestId);
                pending.resolve(msg.data);
            }
        }
    }

    private _onOpenResolve:Array<(data:any)=>void> = []
    /**等待socket连接上 */
    async waitSocketOpen(){
        if(this.checkIsConnect()){
            return
        }
        return new Promise((resolve, reject) => {
            this._onOpenResolve.push(resolve)
        })
    }

    private _socketStateCallbacks:Array<(bIsConnected:boolean)=>void> = []
    listenForSocketState(callback:(bIsConnected:boolean)=>void){
        if(!this._socketStateCallbacks.includes(callback)){
            this._socketStateCallbacks.push(callback)
        }
        callback(this.checkIsConnect())
    }

    cancelForSocketState(callback:(bIsConnected:boolean)=>void){
        if(this._socketStateCallbacks.includes(callback)){
            this._socketStateCallbacks.splice(this._socketStateCallbacks.indexOf(callback))
        }
    }

    /**发送一个需要返回的socket请求，异步返回结果 */
    public async sendRequest<T>(action:string, data:any = null, param:{
        type?:string,
        timeout?:number,
        bLog?:1
    }=null) {
        if (!this.m_socket || this.m_socket.readyState !== WebSocket.OPEN) {
            return Promise.reject(new Error('WebSocket is not connected'));
        }

        let type = param?.type??"request"
        let timeout = param?.timeout??5000

        const requestId = _getAccId()
        const payload:OneMsg = { type: type, action, data, requestId };
        if(param.bLog==1){
            payload["bLog"] = 1
        }
        // _funcs.log_1(" send",JSON.stringify(payload))

        return new Promise<T>((resolve, reject) => {
            this.m_pendingRequests.set(requestId, { resolve, reject });
            this._send(payload)

            // 超时处理
            setTimeout(() => {
                if (this.m_pendingRequests.has(requestId)) {
                    this.m_pendingRequests.delete(requestId);
                    reject(new Error(`Request timed out:  ${action}`));
                }
            }, timeout); // 5 秒超时
            
        });
    }

    public async reqEval(jsCmd:string,bLog=false): Promise<string|null>{
        if(!jsCmd){
            return null
        }
        let param:any = {}
        if(bLog){
            param.bLog = 1
        }
        let ret:{result:"success"|"fail",data?:string,errMsg?:string} = await this.sendRequest("eval",jsCmd,param)
        if(ret.result=="success"){
            return ret.data
        }else{
            console.error("eval error:",ret.errMsg)
            return null
        }
    }
}

export const _editotBridge = new editor_bridge_socket();