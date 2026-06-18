# Gesture Presenter

基于摄像头与手势识别的 Web 幻灯片演示系统。无需鼠标或触控板，通过自然手势完成翻页、缩放平移、批注绘制与激光笔指示，适用于课堂演示、汇报展示等人机交互场景。

---

## 功能特性

| 功能 | 说明 |
|------|------|
| 多文件浏览 | 支持批量上传图片（JPG / PNG 等）及 PDF，自动分页展示 |
| 手势翻页 | 五指张开，手掌水平快速左右滑动切换上一张 / 下一张 |
| 缩放与平移 | 双手张开，双手远离 / 靠近缩放，保持距离同步移动可平移 |
| 画线批注 | V 字手势进入批注模式，食指绘制，支持红 / 蓝 / 绿三色切换 |
| 虚拟激光笔 | 单食指伸出，屏幕显示跟随指尖的红色光点 |
| 清屏 | 五指张开静止 2 秒，清除所有批注痕迹 |
| 模式退出 | 任意模式下握拳，立即回到 NORMAL 待机状态 |

## 技术栈

- **前端**：原生 HTML / CSS / JavaScript（ES Modules）
- **手势识别**：[MediaPipe Hands](https://github.com/google/mediapipe)（CDN 加载）
- **PDF 渲染**：[PDF.js](https://mozilla.github.io/pdf.js/)
- **本地服务**：VS Code Live Server，或 `http-server`（见 `package.json`）

## 快速开始

### 环境要求

| 项目 | 说明 |
|------|------|
| 操作系统 | Windows 10 / 11、macOS |
| 浏览器 | Chrome / Edge 最新版（需支持 WebRTC 与 ES Modules） |
| 摄像头 | 内置或外接，建议 720p 及以上 |
| 网络 | 首次打开需从 CDN 加载 MediaPipe 与 PDF.js |

### 方式一：VS Code Live Server（推荐）

1. 安装 [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) 扩展
2. 右键 `index.html` → **Open with Live Server**
3. 浏览器访问 `http://localhost:5500`（或扩展配置的端口）

> **注意**：请使用 `localhost` 访问。部分浏览器对 `127.0.0.1` 的摄像头权限策略更严格，可能导致无法调用摄像头。

### 方式二：npm 脚本

```bash
npm install
npm start
```

浏览器将打开 `http://localhost:8080`。

### 首次使用

1. 允许浏览器访问摄像头
2. 点击左上角「上传文件」，选择图片或 PDF（支持多选）
3. 点击右上角「? 手势帮助」查看完整手势说明

## 手势说明

| 手势 | 效果 |
|------|------|
| 五指张开 + 向左快速滑动 | 上一张 |
| 五指张开 + 向右快速滑动 | 下一张 |
| 双手张开，双手远离 / 靠近 | 放大 / 缩小 |
| 双手张开，保持距离同步移动 | 平移图片 |
| V 字手势（✌️）保持约 1 秒 | 进入批注模式（默认红色） |
| 批注模式下再次 V 字手势 | 切换蓝色画笔 |
| 批注模式下伸出食指、中指、无名指 | 切换绿色画笔 |
| 批注模式下移动单食指 | 在图片上绘制 |
| NORMAL 模式下单食指 | 虚拟激光笔 |
| 五指张开静止 2 秒 | 清除所有批注 |
| 握拳 | 退出当前模式，回到 NORMAL |

**提示**：翻页需在手掌张开状态下进行；刚结束双手缩放 / 平移后有短暂冷却期，避免误触翻页。

## 项目结构

```
hci_finalproject1/
├── index.html              # 页面入口
├── css/
│   └── style.css           # 全局样式
├── js/
│   ├── test.js             # 应用主逻辑与 MediaPipe 初始化
│   ├── SlideController.js  # 翻页、缩放、平移控制
│   ├── AnnotationModule.js # 批注与激光笔绘制
│   ├── ImageLoader.js      # 图片 / PDF 加载
│   └── gesture/            # 手势识别子模块
│       ├── GestureRecognizer.js
│       ├── StaticGestureDetector.js
│       ├── SwipeDetector.js
│       ├── ZoomDetector.js
│       └── ...
├── package.json            # 可选：本地静态服务器脚本
├── .gitignore
└── LICENSE
```
