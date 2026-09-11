---
name: "序衡 Xuheng"
description: "工程蓝图工作台：清晰比较，审慎操作，有据可依。"
colors:
  ink: "#152541"
  muted: "#607087"
  blue: "#245bdb"
  navy: "#11233f"
  line: "#dfe5ee"
  paper: "#fff"
  ground: "#f3f6fa"
  amber: "#8a5911"
  green: "#22664e"
  blue-hover: "#1649c0"
  focus: "#5c8df2"
typography:
  headline:
    fontFamily: "'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  title:
    fontFamily: "'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif"
    fontSize: "18px"
    fontWeight: 650
    lineHeight: 1.5
  subtitle:
    fontFamily: "'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif"
    fontSize: "15px"
    fontWeight: 650
    lineHeight: 1.6
  body:
    fontFamily: "'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif"
    fontSize: "14px"
    lineHeight: 1.65
  label:
    fontFamily: "'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif"
    fontSize: "12px"
  tag:
    fontFamily: "'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif"
    fontSize: "11px"
    lineHeight: 1.6
  metric:
    fontFamily: "'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif"
    fontSize: "19px"
    fontWeight: 600
  mono:
    fontFamily: "Consolas, monospace"
    fontSize: "11px"
rounded:
  control: "6px"
  tag: "4px"
  surface: "9px"
  inset: "5px"
spacing:
  control-block: "9px"
  control-inline: "16px"
  panel-block: "23px"
  panel-inline: "25px"
  section: "24px"
  page-inline: "38px"
  page-top: "32px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "9px 16px"
  button-primary-hover:
    backgroundColor: "{colors.blue-hover}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "#334760"
    rounded: "{rounded.control}"
    padding: "9px 16px"
  button-text:
    textColor: "{colors.blue}"
    rounded: "{rounded.control}"
    padding: "4px 0"
  textarea:
    backgroundColor: "#fafcff"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
  nav-active:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
  tag:
    backgroundColor: "#f6f8fc"
    textColor: "#526780"
    typography: "{typography.tag}"
    rounded: "{rounded.tag}"
    padding: "4px 8px"
  tag-warning:
    backgroundColor: "#fff7e7"
    textColor: "{colors.amber}"
    typography: "{typography.tag}"
    rounded: "{rounded.tag}"
    padding: "4px 8px"
  panel:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.surface}"
    padding: "23px 25px"
  segmented-selected:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.blue}"
    rounded: "{rounded.tag}"
    padding: "5px 12px"
---

# Design System: 序衡 Xuheng

## Overview

**Creative North Star: "工程蓝图工作台"**

工程蓝图工作台把秩序感放在可核查的信息关系中：深海蓝导航定位工作空间，白色操作面承载输入、比较和审批，钴蓝标明当前可执行的动作。整体清楚、沉稳、紧凑；品牌表达来自对齐、细边界和原创线性标识。

本文件记录序衡网页工作台与演练实验室共用的品牌语言。前置令牌及下文的桌面布局、组件尺寸与断点来自网页实现；实验室保留 Streamlit 原生控件，只采用实际已落地的标题、边界、间距和品牌资产。各页面的任务组织继续由对应界面与 PRODUCT.md 描述。

**Key Characteristics:**

- 深海蓝导航、钴蓝操作与白色工作面构成稳定的层级。
- 表格列对齐、等宽数字与可读的运行状态支持快速核对。
- 细实线、有限圆角和稀疏轻阴影维持工程图纸般的秩序。
- 原创三横一纵标识与流程 SVG 形成品牌辨识。

记录依据：frontend/site/app/globals.css、frontend/site/components/workbench.tsx、app.py；产品事实以 PRODUCT.md 为准。这里描述已实现的视觉系统，不将方向稿中的尺寸预估作为代码事实。

## Colors

色彩以深海蓝、钴蓝与冷白构成操作层级；前置 colors 保留 CSS 的令牌名称与原始色值。

### Primary

- 钴蓝（blue）标明主要动作、当前导航和已完成流程；淡蓝的表格行底色标明当前选择。
- 深钴蓝（blue-hover）用于主要按钮悬停；焦点蓝（focus）用于键盘可见焦点，不能以单纯的背景变化替代。
- 深海蓝（navy）用于网页品牌导航面，使白色工作区保持连续。

### Neutral

- 纸白（paper）承载输入与结果，冷灰（ground）作为外部背景。
- 墨蓝（ink）用于正文与标题，灰蓝（muted）用于说明，细线灰（line）分隔同一工作面的内容。
- 赭黄（amber）属于语义提示色：等待审批与需关注的标记。错误、通过和警告提示沿用源码中的独立文字、边框和浅色背景组合，不将状态色扩展成第二套品牌主色。

**The Operation Blue Rule.** 钴蓝用于主要操作、当前导航、所选方案与已完成步骤；等待与需注意的状态使用赭黄色，并始终附有文字。

sidecar 为色板面板提供的八阶 OKLCH 色阶属于展示元数据，不能替换前置令牌或直接视为应用中的色阶。

## Typography

界面使用当前全局无衬线字体栈；具体字体顺序以 typography 的 fontFamily 为准。中文、拉丁文字和数字在同一操作界面体系中排版。审计标识与结构化记录使用实现中的等宽字体。

### Hierarchy

- headline 对应主页面标题；在较窄桌面缩为（26px），在手机缩为（24px）。手机标题行高提高为（1.5）。
- title 对应段落标题，subtitle 对应局部小标题。它们使用相近的中等字重，依靠尺寸与间距建立层级。
- body 对应输入与正文；说明常使用（12–13px），辅助标签使用（11–12px）。正文面板的长段落最大宽度为（76ch），行高为（1.9）。
- metric 对应方案表的突出数值；表格统一启用 tabular-nums，数值保持列对齐。
- mono 对应审计字段。长 ID、哈希及 JSON 记录允许换行或在限定高度内滚动。

**The Measured Table Rule.** 方案指标共用表格列，数字使用等宽字形；所选行与审批摘要保持同步。

## Layout

网页采用导航与工作区的双列骨架。常规桌面导航宽（220px），贴顶并占满动态视口高度；上栏高（64px）。主内容最大宽（1640px），常规内边距为（32px 38px 20px）。输入与流程区域由弹性主列和窄辅助列（234px）组成，列间距与主要区块间距为（24px）。方案比较表横跨工作区。

| 网页断点 | 已实现的排列变化 |
| --- | --- |
| 至少 1600px | 主区内边距调整为 40px 50px；辅助列 260px；主要面板内边距 28px 32px。 |
| 至多 1180px | 导航收为 192px；主区横向内边距 25px；辅助列 195px、列间距 20px；审批栏转为纵向。 |
| 至多 950px | 输入与流程改为单列；流程步骤横向排为四列；执行摘要排为两列。 |
| 至多 720px | 导航成为顶部品牌与四列导航；上栏 49px；主区内边距 25px 18px 15px；面板 20px 17px；步骤两列；执行控件和开始分析操作纵排。 |

手机方案表保留最小宽度（600px），在表格容器内横向滚动并提供阅读提示；审批动作保持可辨识的两列排列。长记录允许换行，页面布局本身随视口收缩。

演练实验室使用原生宽屏 Streamlit 布局，其已实现内容容器最大宽（1400px），内边距为（2rem 2.8rem 3rem）；至多（720px）时改为（1.4rem 1rem）。这些是该界面的适配值，不替换网页断点体系。

## Elevation & Depth

层次主要由冷灰背景、白色操作面和细边界产生。内容面板静止时无投影；选中导航与分段控件有小范围的软阴影，帮助识别当前位置与选择。阴影精确值保存在 sidecar 的 shadows 中。

**The Flat Work Surface Rule.** 工作面通过白底、细实线和间距分层；轻阴影只记录现有导航选中项与分段选中项的用法。

按钮背景、文字与边框的过渡为（0.18s）。扫描线与旋转指示只表达运行进度，不代替文字状态。prefers-reduced-motion 生效时取消动画、过渡和自动平滑滚动。全局键盘焦点使用实线轮廓（3px）与外偏移（3px）。

## Shapes

整体使用细实线和轻微圆角。操作控件沿用 control，标签沿用 tag，白色工作面沿用 surface；记录与下拉控件的内嵌容器采用 inset。流程编号采用圆形，排程条采用窄矩形与小圆角，形状随其功能变化。

原创 SVG 标识由三条错位水平线与一条垂直对齐线组成，表达恢复秩序与权衡。网页侧栏、实验室与 favicon 使用同一资产家族。空态的供应、装配、交付路线图使用已有矢量资产；网格纹理留在品牌及流程示意中，数据工作面保持清楚。

## Components

### Buttons

主要按钮稳定、清楚。前置组件令牌记录钴蓝主按钮、白底描边次按钮与文字动作；常规按钮最小高（40px），文字尺寸（13px）、字重（550）。紧凑修饰使用最小高（34px）、内边距（6px 11px）和文字尺寸（12px）。

主按钮悬停加深钴蓝；次按钮悬停使用浅蓝底与更清楚的蓝色边框。所有交互控件沿用全局可见焦点。禁用按钮透明度为（0.48），光标表示不可操作；没有为按钮另立未实现的按压动画。

### Inputs / Fields

异常输入框为浅冷白底与细描边，文字及光标色承接品牌令牌。输入框最小高（138px），允许垂直缩放，行高（1.8）；下方放来源或输入说明。状态通过相邻通知与可读文字反馈，仍保留原生输入行为。

执行配置下拉框最小高（42px），独立于异常长文本输入。实验室的输入、选择和按钮继续使用 Streamlit 原生语义与交互。

### Navigation

网页侧栏由品牌、四项工作导航、说明与本地连接状态组成。导航项最小内部关系由图标、文字和当前项标识构成；默认文字为浅灰蓝，悬停时背景变亮，当前项以钴蓝底与白字突出，并标注 aria-current。手机采用顶部品牌与横向四列导航。跳转主内容链接在获得键盘焦点时出现。

### Chips / Notices

小标签使用紧凑圆角和细描边，承担来源、连接与等待状态的说明。等待标签使用赭黄文字与浅暖色底。通知区域依具体结果使用中性、错误、通过或警告组合，并同时显示标题或说明；颜色不能单独表达业务结论。

### Cards / Containers

输入、比较、执行和说明内容共用白底细边框面板。主要工作面板共享前置 panel 的内边距；说明页使用更适合阅读的内边距（30px 34px），在手机统一收为工作面板的紧凑值。面板承载完整任务片段，不为每一个数字再增加独立浮层。

### Segmented Control

回放与实时输入模式共用浅灰槽。选中项为白底、钴蓝文字和轻阴影，并通过 aria-pressed 表示选择。模式可用性来自实际配置状态，视觉规则不替代业务门禁。

### Plan Comparison / Approval

方案比较是标志性工作组件：表头固定列关系，数值对齐，单选控件与淡蓝行底共同标示所选方案。审批摘要随选择更新，批准与驳回动作有明确文字。结果遵循求解、独立验证、方案选择、人工审批、草稿和本地反馈的实际顺序，分别表达等待、驳回、草稿和审批失效。

所选计划的排程使用逐订单的横向时间条，展示起止小时与产线；比例来自该方案实际排程，文本保留可核对数值。空结果使用已实现的流程 SVG 和下一步说明，不展示虚构指标。

## Do's and Don'ts

### Do:

- Do 使用深蓝导航与浅色工作面建立稳定定位，复用现有钴蓝操作色。
- Do 让状态文字与颜色同时出现，并保留键盘焦点和明确的禁用状态。
- Do 以对齐表格比较实际求解结果，保持所选方案、验证结果与人工审批操作一致。
- Do 在小屏重新排列流程与操作区，让宽表在自己的容器内横向滚动。
- Do 沿用原创标识与流程 SVG；公开数据、合成事件和本地执行范围保持可辨识。

### Don't:

- Don't 用装饰性大色块或重复阴影卡片打断表格与操作的阅读顺序。
- Don't 将等待审批、已生成草稿和执行反馈合并为一种成功状态。
- Don't 编造客户、业务效益、运行成功率、外部认证或真实生产写入。
- Don't 把 Streamlit 的框架默认控件状态提升为跨界面的品牌规则。
- Don't 将面板预览色阶或一次性运行提示当作新的应用令牌。
