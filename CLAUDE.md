# Edge iPad Copilot - 项目指令

## 项目概况
Edge 浏览器 iPad 版 Copilot 侧边栏原型。用 Electron + HTML/CSS/JS 构建，webview 加载真实网页。

## 技术栈
- **Electron** — 桌面应用壳，启用 webviewTag
- **纯 HTML/CSS/JS** — 无框架
- **server.py** — 本地 HTTP server + 反向代理（iframe 方案用，已切换到 Electron）

## 文件结构
```
main.js          — Electron 入口
index.html       — 主页面（tab bar、toolbar、NTP、webview、side pane）
js/app.js        — tab 管理、NTP 逻辑、nudge 动画、Copilot 侧边栏
css/base.css     — 全局样式（100vw×100vh 全屏）
css/tabs.css     — tab 栏（活跃 tab backplate + wing connectors）
css/header.css   — status bar、toolbar、omni box（含锁图标）
css/content.css  — 内容区域、webview
css/ntp.css      — NTP 首页（C1 Browser UC Figma 设计）
css/sidepane.css — Copilot 侧边栏（DS UI Kit 规范）
css/nudge.css    — nudge 按钮动画
server.py        — 本地 HTTP server（开发用）
```

## 启动方式
```bash
npx electron .
```

## 设计参考 Figma
- **DS UI Kit**: `yl0JWRJAe6Wyt6J0fL5muY` — Copilot Chat 组件库
- **iPad framework**: `wRbxY3zZhLcl1FIkE3WRDh` — iPad 视觉刷新
- **C1 Browser UC**: `3WOUrpiJn9yNS7jLNqXooe` — NTP 首页设计（node-id=2090-58811）

## 关键设计值
| 元素 | 值 |
|------|-----|
| 用户气泡 | bg `#FEE6D4`, radius `18px`, font `16px/1.625`, color `#272320` |
| AI 文字 | color `#272320`, font `16px/1.625`, weight `410` |
| NTP 背景 | `#F8F4F1` |
| NTP Composer | `760px` 宽, 外层 radius `32px`, 内层 `26px`, blur `60px` |
| QuickLink | `48×48`（12px padding + 24px icon）, radius `20px`, bg `#F8F4F1` |
| Chip 边框 | `rgba(0,0,0,0.08)` 1px |

## 已知踩坑（详见 docs/NUDGE_DEBUG.md）
- nudge 动画：`.nudge` 不能有 `overflow: hidden`
- nudge 宽度：所有导航路径（switchToTab、navigateCurrentTab）都要设 `nudgeWrap.style.width`
- Electron 调试：用 `win.webContents.on('console-message')` + `fs.appendFileSync`
