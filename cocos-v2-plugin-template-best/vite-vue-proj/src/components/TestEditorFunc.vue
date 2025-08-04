<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { _editotBridge } from '../tools/editor_bridge_socket';
import { EditorTools } from '../tools/EditorTools';

const _mod = globalThis["_mod"]

const _constParam = ref(null)
onMounted(async ()=>{
  _constParam.value = await _mod.getPluginGlobalConst()
  
})

enum _ConnectState{
    none,
    connecting,
    connected,
    failed,
}
const _wsState = ref(_ConnectState.none)
async function onCheckConnect(){
  
  if(!_editotBridge.checkIsConnect()){
    const port = await _mod.getPluginPort()
    const wsUrl = `ws://localhost:${port}`
    _wsState.value = _ConnectState.connecting
    const success = await _editotBridge.connectToServer(wsUrl)
    if(success){
        _wsState.value = _ConnectState.connected
    }else{
        _wsState.value = _ConnectState.failed
    }
  }else{
    _wsState.value = _ConnectState.connected
  }
}

const stateTip = computed(()=>{
    if(_wsState.value==_ConnectState.none){
        return "暂未连接编辑器"
    }else if(_wsState.value==_ConnectState.connecting){
        return "正在尝试连接..."
    }else if(_wsState.value==_ConnectState.connected){
        return "已经成功连接编辑器"
    }else if(_wsState.value==_ConnectState.failed){
        return "连接编辑器失败"
    }
})

const _assetInfo = ref("")
async function queryAssetInfoByUrl(){
    if(!_editotBridge.checkIsConnect()){
        console.log("未连接上")
        _assetInfo.value = "请先连接编辑器"
        return
    }
    
    _assetInfo.value = JSON.stringify(_constParam.value)
    
    let url = ""
    if(await EditorTools.isV2()){
      url = "db://internal/image/default_sprite.png"
    }else if(await EditorTools.isV3()){
      url = "db://internal/default_ui/default_sprite.png"
    }
    const ret = await EditorTools.queryAssetInfoByUrl(url)
      
    console.log("_assetInfo返回值",ret)
    _assetInfo.value = ret
}

</script>

<template>
    <div class="container">
      <!-- 全局参数 -->
      <div class="control-box">
        <div class="box-header">
          <span class="header-label">外部传入vue的全局变量参数</span>
        </div>
        <span class="label-text">{{ JSON.stringify(_constParam,null,2) }}</span>
        
      </div>

      <!-- 连接状态区块 -->
      <div class="control-box">
        <div class="box-header">
          <span class="header-label">编辑器连接状态</span>
        </div>
        <span class="label-text">{{ stateTip }}</span>
        <button 
          type="button" 
          @click="onCheckConnect"
          :disabled="_wsState == _ConnectState.connected"
          class="action-btn"
        >
          点击连接插件
        </button>
      </div>

      <div class="control-box">
        <div class="box-header">
          <span class="header-label">测试query-asset-info</span>
        </div>
        
        <span class="label-text">点击按钮去编辑器执行:Editor.Message.request('asset-db', 'query-asset-info', "db://internal/default_ui/default_sprite.png")</span>
        <span class="label-text">查询结果：{{ _assetInfo }}</span>
        <button 
          type="button" 
          @click="queryAssetInfoByUrl"
          class="action-btn"
        >
          查询资源信息
        </button>
      </div>
    </div>
  </template>
  
  <style scoped>
  .container {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 24px;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .control-box {
    display: flex;
    flex-direction: column;
    align-items: flex-start; /* 左对齐 */
    gap: 16px;
    min-width: 500px;
    width: 500px;
    padding: 20px;
    background: #ecf2f8; /* 浅灰色背景 */
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  
  .box-header {
    display: flex;
    align-items: center;
    width: 100%;
    padding-bottom: 12px;
    border-bottom: 1px solid #c7c5c5;
    margin-bottom: 16px;
  }
  
  .header-label {
    font-size: 14px;
    color: #495057;
    font-weight: 600;
    text-align: left;
  }
  
  .label-text {
    font-weight: 500;
    color: #343739;
    text-align: left;
    text-overflow: ellipsis;
  }
  
  .action-btn {
    width: 180px;
    padding: 10px 20px;
    background: #2196f3;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.25s ease;
    font-size: 14px;
    white-space: nowrap;
  }
  
  .action-btn:disabled {
    background: #b2bec3;
    cursor: not-allowed;
  }
  
  .action-btn:hover:not(:disabled) {
    background: #1e88e5;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(33,150,243,0.2);
  }
</style>