# Design System

## Overview

大雁个人站是深色、技术感、克制发光的个人品牌页面。整体布局以长滚动单页为主，导航、Hero、项目、Blog、数据、工作坊依次展开，信息密度高但结构清晰。背景持续使用低对比网格和轻微扫描线，强调“正在运行的工作台”感。视觉重心始终围绕紫色主辉光、窄边框卡片、等宽标签和大号中文标题展开。

## Colors

- **Primary Background**: `#08090C` - 页面主背景，接近黑色但带冷调。
- **Secondary Background**: `#0F1116` - 卡片与模块底色。
- **Tertiary Surface**: `#15171F` - 次级面板、分层背景。
- **Primary Text**: `#EDEDEE` - 主标题和重点正文。
- **Secondary Text**: `#B8BABF` - 正文和说明文字。
- **Muted Text**: `#7C7F8A` - 标签、辅助信息。
- **Primary Accent**: `#8B7CFF` - 主按钮、标题高亮、发光边缘。
- **Primary Accent Soft**: `#C8BFFF` - 紫色高亮文字与轻提示。
- **Secondary Accent**: `#4DD4E0` - 少量在线状态、实时提示。
- **Positive Accent**: `#5DD49A` - 在线、已上线、正常状态。
- **Warning Accent**: `#F8B154` - 席位、倒计时类提醒。

## Typography

- **Display**: Space Grotesk (400, 500, 600, 700). 用于 Hero、章节标题、品牌感大字。
- **Chinese Sans**: Noto Sans SC (400, 500, 600, 700). 用于中文正文和卡片说明。
- **Monospace**: JetBrains Mono (400, 500, 600). 用于导航版本号、Section 编号、状态标签、数据旁注。
- **Body Support**: Inter (400). 少量英文和界面兼容字体。
- **Scale**: Hero 标题约 `56px`，章节标题约 `36px`，卡片标题 `18-22px`，正文 `15-16px`，Mono 标签 `10-13px`。

## Elevation

页面深度主要来自细边框、低透明度描边、内层渐变和紫色柔光，而不是传统阴影。卡片普遍采用 `1px` 的浅色边线和弱化背景分层，局部叠加紫色扩散辉光，营造屏幕发亮但仍然克制的质感。背景网格与扫描线作为全局底噪，持续提供空间层次。

## Components

- **Hero Workbench**: 左侧品牌大标题，右侧实时状态面板，形成“人物定位 + 当前在做什么”的双栏开场。
- **Mono Top Bar**: 顶部工作坊通知条和细字导航，带轻微发光状态点。
- **Timeline Cards**: About 区的履历模块，长文本卡片配竖向标签列。
- **Project Gallery Cards**: 大尺寸项目卡片，顶部状态角标，内部带产品截图、技术栈标签和外链按钮。
- **Blog Ledger Cards**: 双列文章卡片，像项目日志面板，标题清晰、摘要克制。
- **Workshop Conversion Panel**: 左侧活动说明，右侧表单收口，是页面最强 CTA。
- **Floating Chat Trigger**: 右下角悬浮按钮，说明站内 AI 接待能力。

## Do's and Don'ts

### Do's

- 保持深色背景贯穿全部镜头，延续站点原始气质。
- 用 `#8B7CFF` 作为主导强调色，重要转场和 CTA 都围绕它发光。
- 保留网格、细边框、Mono 标签这些“工作台”特征。
- 让截图以真实界面形态出现，优先展示 Hero、项目卡片、Blog 卡片和工作坊表单。
- 动画以滑移、辉光扩散、卡片浮动、镜头推进为主，节奏明确。

### Don'ts

- 不使用高饱和多彩背景抢走品牌主色。
- 不做圆润可爱型 UI，保持硬朗、理性、产品化表达。
- 不把所有镜头做成纯文字页，至少让核心截图持续参与叙事。
- 不使用厚重投影和强透视夸张效果，保留轻量屏幕质感。
