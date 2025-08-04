# 项目简介

一份空白插件的基础上，加上了一个menu菜单入口，点击菜单，以electron弹窗格式打开vue项目构建的UI界面，并且通过
preload.js的形式为vue项目提供nodejs功能，以及通过wsbsocket为vue项目提供编辑器插件相关能力支持。

## 开发环境

Node.js

## 安装

```bash
# 安装依赖模块
npm install
# 构建
npm run build
```

## 用法

启用扩展后，点击主菜单栏中的 `面板 -> 打开vue面板`，即可打开扩展的默认面板。
