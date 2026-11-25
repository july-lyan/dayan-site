# AGENTS.md

## HyperFrames 项目规则

创建或修改 composition 前，先使用对应 HyperFrames skill。框架关键规则包括 `window.__timelines` 注册、`data-*` 属性语义、Tailwind v4 browser runtime、shader-compatible CSS 等。

## 常用命令

```bash
npm run dev
npm run check
npm run render
npm run publish
npx hyperframes lint --verbose
npx hyperframes lint --json
npx hyperframes docs <topic>
```

`npm run dev` 是长运行预览服务，应作为后台进程保持运行。

## 文档

优先使用本地 CLI 文档：

```bash
npx hyperframes docs <topic>
```

常用 topic：`data-attributes`、`gsap`、`compositions`、`rendering`、`examples`、`troubleshooting`。

完整文档入口通过 machine-readable index 发现：`https://hyperframes.heygen.com/llms.txt`。不要猜测具体文档 URL。

## 项目结构

- `index.html`：主 composition。
- `compositions/`：子 composition。
- `assets/`：媒体文件。
- `meta.json`：项目元数据。
- `transcript.json`：Whisper word-level transcript。

## 验证

创建或编辑任何 `.html` composition 后运行：

```bash
npm run check
```

修复所有 error，再进入 render 或交付。inspect warning 需要人工判断。

## 关键规则

1. 每个 timed element 需要 `data-start`、`data-duration`、`data-track-index`。
2. visible timed element 必须有 `class="clip"`。
3. GSAP timeline 必须 paused 并注册到 `window.__timelines`。
4. video 使用 `muted`，音频用单独 `<audio>`。
5. 子 composition 用 `data-composition-src="compositions/file.html"`。
6. 逻辑必须 deterministic，禁止 `Date.now()`、`Math.random()` 和网络 fetch。
