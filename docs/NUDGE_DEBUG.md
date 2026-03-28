# Nudge 动画调试记录（2026-03-28）

## 问题
从 NTP 首页导航到网页时，nudge 的 "Chat" → "Summarize" 动画不工作，文字显示不全。

## 根因分析（3 个问题）

### 1. `.nudge` 容器的 `overflow: hidden` 阻止动画
- `.nudge` 是 flex 容器，宽度由内容撑开（hug content）
- `.nudge-text-wrap` 有 `transition: width 0.4s`，width 在做动画
- 但 `.nudge` 本身没有 width transition，它的宽度瞬间变化
- `overflow: hidden` 在 `.nudge` 上会瞬间裁剪正在做动画的子元素
- **修复**：移除 `.nudge` 的 `overflow: hidden`，`.nudge-text-wrap` 自己保留 `overflow: hidden` 即可

### 2. `navigateCurrentTab` 漏设 nudgeWrap 宽度
- `switchToTab` 的覆盖版本正确设置了 `nudgeWrap.style.width`
- 但 `navigateCurrentTab`（从 NTP 搜索/点 top site 时调用）只设了 `nudge.classList.add('expanded')` 却没设 `nudgeWrap.style.width = longWidth + 'px'`
- **修复**：在 `navigateCurrentTab` 里也加上 `nudgeWrap.style.width = longWidth + 'px'`
- **教训**：所有改变 nudge 展开/收起状态的代码路径都要同时设置 class 和 width

### 3. `switchToTab` 覆盖顺序问题
- 覆盖 `switchToTab`（设置 nudgeWrap 宽度的那个）必须在 `createTab` 调用之前定义
- 因为 `createTab` 内部调用 `switchToTab`，如果用的是未覆盖版本，宽度不会被设置
- **修复**：把覆盖代码放到 `createTab()` 调用之前

## 宽度测量方法
```javascript
// 在创建 tab 之前测量（DOM 已渲染但未被 tab 切换影响）
nudgeWrap.style.overflow = 'visible';
nudgeWrap.style.width = 'auto';

nudgeLong.style.opacity = '1';
nudgeLong.style.position = 'static';
const longWidth = nudgeLong.offsetWidth;
nudgeLong.style.opacity = '';
nudgeLong.style.position = '';

nudgeShort.style.position = 'static';
const shortWidth = nudgeShort.offsetWidth;
nudgeShort.style.position = '';

nudgeWrap.style.overflow = '';
nudgeWrap.style.width = shortWidth + 'px';
```

**注意**：Canvas `measureText` 方式不可靠（字体名不匹配系统字体），不要用。

## Electron 调试方法
- `console.log` 不直接输出到 stdout
- 用 `win.webContents.on('console-message', (e, level, msg) => fs.appendFileSync(logFile, msg))` 写到 debug.log
- 或者用 `document.title = 'DEBUG: ...'` 快速查看值
