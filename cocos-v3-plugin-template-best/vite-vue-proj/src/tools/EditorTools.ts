import { _editotBridge } from "./editor_bridge_socket"

const _mod = globalThis["_mod"]



export namespace EditorTools{
    let _constParam = null 
    export async function getConstParam(){
        if(_constParam){
            return _constParam
        }
        _constParam = await _mod.getPluginGlobalConst()
        return _constParam
    }

    export async function getCocosVer():Promise<string>{
        const _constParam = await getConstParam()
        return _constParam?.cocosVer
    }

    export async function isV2() {
        let ver = await getCocosVer()
        return ver.indexOf("2")==0
    }

    export async function isV3() {
        let ver = await getCocosVer()
        return ver.indexOf("3")==0
    }

    export async function queryAssetInfoByUrl(url:string){
        let cmdStr = ""
        if(await isV2()){
            const url = "db://internal/image/default_sprite.png"
            cmdStr = `return Editor.assetdb.assetInfo('${url}');`
        }else if(await isV3()){
            const url = "db://internal/default_ui/default_sprite.png"
            cmdStr = `return await Editor.Message.request('asset-db', 'query-asset-info', "${url}")`
        }else{
            return null
        }

        const ret = await _editotBridge.reqEval(cmdStr,true)
        return ret
    }
}