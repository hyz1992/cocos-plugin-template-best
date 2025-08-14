// @ts-ignore
import packageJSON from '../package.json';
import { createElectronWindow } from './electron_win';
/**
 * @en 
 * @zh 为扩展的主进程的注册方法
 */
export const methods: { [key: string]: (...any: any) => any } = {
    openPanel() {
        console.log("点击打开面板")
        createElectronWindow()
    },
    restartPanel() {
        setTimeout(function(){
            console.log("点击重启")
            createElectronWindow()
        },1000*0.1)
    }
};

/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
export function load() { 
    console.log("已加载plugin:",packageJSON.name)
}

/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
export function unload() {
    console.log("已卸载plugin:",packageJSON.name)
}
