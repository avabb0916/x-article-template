# x-article-template · a content repository template

[简体中文](README.md) | **English**

A ready-to-use long-form content repo: article scaffold, figure config, and **CI that checks your posts on every push**.
Click **Use this template** and start writing.

## Why a template

The most common long-form mistakes are structural, not topical:

- an extra `#` makes readers think the article ended
- tables and code fences get dropped by the platform
- “not X, but Y” nine times reads like AI
- a wrong image path silently drops two figures

Hard to catch by eye, easy to automate. This template runs the checks in CI: every push is verified.

## Layout

```
posts/                      one markdown file per article
images/                     figures
figures.json                figure generation config (with x-article-factory)
scripts/check.mjs           self-contained checker (zero dependency)
.github/workflows/check.yml runs on every push
docs/CHECKLIST.md           manual pre-publish checklist
```

## Quick start

1. **Use this template** → create your own repo
2. Copy `posts/2026-01-01-example-article.md`, rename it, write your post
3. Check locally (CI does it too):

```bash
node scripts/check.mjs posts/your-post.md
```

Exit code `0` = pass, `1` = has errors that must be fixed.

## Figures

`figures.json` works with [x-article-factory](https://github.com/avabb0916/x-article-factory):

```bash
node ../x-article-factory/bin/xaf.mjs figures figures.json --out images
```

Built-in templates: `cover` (5:2), `steps`, `table`, `checklist`, `quote`.

## Publish

Use [x-md-publisher](https://github.com/avabb0916/x-md-publisher) to turn the markdown into an X Article draft:

```bash
node ../x-md-publisher/bin/xpub.mjs posts/your-post.md --cover images/cover.png
```

Drafts only — publishing always stays with you.

## License

MIT
