# x-article-template · 内容仓库模板

**简体中文** | [English](README.en.md)

一个开箱即用的长文内容仓库：文章骨架、配图配置、**发布前自动检查的 CI**。
点右上角 **Use this template** 生成你自己的仓库，就可以开始写。

## 为什么用模板而不是从零建

写长文最容易犯的错不是选题，是**结构**：

- 多写一个 `#`，读者以为文章结束了
- 用了表格/代码块，发到平台被整段丢弃
- 「不是X，是Y」写了九遍，读起来像 AI
- 配图路径写错，发出来少两张

这些肉眼很难查，但可以自动化。这个模板把检查做进 CI：**每次 push 自动跑，不合格会红叉**。

## 目录

```
posts/                     文章（每篇一个 md）
images/                    配图
figures.json               配图生成配置（配合 x-article-factory）
scripts/check.mjs          自包含检查器（零依赖）
.github/workflows/check.yml 每次 push 自动检查
docs/CHECKLIST.md          发布前人工清单
```

## 三步开始

**1. 用模板建仓库**：点页面右上角 **Use this template → Create a new repository**

**2. 写你的第一篇文章**：复制 `posts/2026-01-01-example-article.md` 改名，改内容

**3. 本地检查（可选，CI 也会跑）**

```bash
node scripts/check.mjs posts/你的文章.md
```

输出：

```
你的文章.md  标题: ...  字数: 2141  小标题: 10  配图: 5
  [warn] no-not-x-is-y: 「不是X，是Y」4 次，建议 ≤3
  0 error / 1 warn → 通过
```

`0 error` 才算过；退出码 `1` 表示有必须修的问题。

## 配图怎么生成

模板里的 `figures.json` 配合 [x-article-factory](https://github.com/avabb0916/x-article-factory) 使用：

```bash
npx xaf figures figures.json --out images   # 若已发布到 npm
# 或本地安装后：
node ../x-article-factory/bin/xaf.mjs figures figures.json --out images
```

内置模板：`cover`（5:2）/ `steps` / `table` / `checklist` / `quote`。
渲染是本地 HTML → Chrome 截图，中文绝对准确、零成本。

## 发布

检查通过后，用 [x-md-publisher](https://github.com/avabb0916/x-md-publisher) 把 md 变成 X 文章草稿：

```bash
node ../x-md-publisher/bin/xpub.mjs posts/你的文章.md --cover images/cover.png
```

它只建草稿，**发布永远由你点**。

## 配套项目

| 项目 | 作用 |
|---|---|
| [content-factory](https://github.com/avabb0916/agent-skill-content-factory) | 完整流程技能（可装进任何 Agent） |
| [x-article-factory](https://github.com/avabb0916/x-article-factory) | 17 条规则的检查器 + 5 类配图生成 |
| [x-md-publisher](https://github.com/avabb0916/x-md-publisher) | Markdown → X 文章草稿 |

## 自定义

- **改规则**：`scripts/check.mjs` 顶部的 `BANNED` / `RISK` / `ABSOLUTE`，以及各条阈值
- **关掉某条检查**：直接删掉对应 `add(...)` 行
- **改 CI 触发**：`.github/workflows/check.yml`

## License

MIT
