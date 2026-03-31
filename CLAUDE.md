# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# 开发服务器（http://localhost:8080）
npm run serve

# 生产构建
npm run build

# Lint
npm run lint
```

Node.js WebSocket 服务器（音频会议）需单独启动：
```bash
node src/ws-server/server.js      # Mediasoup SFU，需配置端口和 IP
node src/ws-server/tmserver.js    # 简易信令服务器，端口 3000
```

树莓派端雷达数据推送（Python）：
```bash
python 1.py   # Flask + Socket.IO，监听 0.0.0.0:5010
```

## Architecture

### 前端（Vue 3）

- **入口**：`src/main.js` → 挂载 `src/App.vue`
- **路由**：`src/router.js`，主要路由：
  - `/` → `src/components/text.vue`（首页）
  - `/WM` → `src/components/waimai/wMain.vue`（外卖）
  - `/cxgj`（子路由）→ `src/components/zntk/cxgj.vue`
- **事件总线**：`src/eventBus.js`（基于 mitt）

### 雷达显示模块（核心）

`src/components/zntk/radarDisplay.vue` — Three.js 3D 可视化：
- 通过 Socket.IO 连接树莓派 `10.194.90.44:5010` 接收 `radar_update` 事件
- 数据字段：`pointCloud`（numpy 数组字符串）、`trackData`（轨迹矩阵字符串）
- `parsePointCloud()` / `parseTracks()`：将 numpy 字符串格式解析为 JS 数组
- 轨迹数据列顺序：`[tid, x, y, z, vx, vy, vz, ax, ay, az, state, confidence, ...]`
- Three.js 场景：骑手几何体模型（中心）+ 人形目标模型 + 道路场景 + 扫描光环
- 坐标映射：雷达 `x→x`，`y→z`（Three.js 深度），`z→y`（高度）

### 后端（树莓派，`1.py`）

- Flask + Socket.IO，串口读取 IWR6843 毫米波雷达数据
- 魔术字同步帧：`\x02\x01\x04\x03\x06\x05\x08\x07`
- 两路串口：命令端（115200）和数据端（921600）
- 输出的 `pointCloud` / `trackData` 字段为 numpy ndarray **字符串表示**，需在前端 `JSON.stringify` 前调用 `.tolist()`（已修复）

### 音频会议（`src/ws-server/`）

- `server.js`：Mediasoup SFU，管理 `peers / transports / producers / consumers`
- `tmserver.js`：轻量 WebSocket 信令（端口 3000），转发 offer/answer/candidate
- `mediasoup-config.js`：Opus 编码（48kHz，双声道），UDP 优先

### 代理配置（`vue.config.js`）

- `/api` → `http://192.168.99.20:8081`（Flask 后端）
- `/baidu` → `https://openapi.baidu.com`（百度 TTS）

### 其他模块

| 目录 | 说明 |
|------|------|
| `src/components/waimai/` | 外卖配送 UI |
| `src/components/TeamTalk/` | 实时语音（调用 Mediasoup） |
| `src/components/ditu/` | 高德地图集成 |
| `src/components/fire/` | Pixi.js 火焰动画 |
| `public/live2d/` | Live2D 角色（Mao 模型） |
