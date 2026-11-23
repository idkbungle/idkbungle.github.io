# Leo's Blog

个人博客，基于 [Astro](https://astro.build/) 和 [Retypeset](https://github.com/radishzzz/astro-theme-retypeset) 主题，地址 https://blog.trageek.com 。

内容全部放在这个仓库里，push 到 `main` 后由 GitHub Actions（`.github/workflows/deploy.yml`）自动构建并发布到 GitHub Pages。

> 主题原版说明见 [assets/docs/README.theme.en.md](assets/docs/README.theme.en.md) 和 [assets/docs/README.zh.md](assets/docs/README.zh.md)。

## 写一篇博文

在 `src/content/posts/` 下新建一个 `.md`（或 `.mdx`）文件，文件开头用两行 `---` 包住页首字段（frontmatter），下面写正文。

```yaml
---
# 必填
title: 文章标题
published: 2026-11-24          # 发布日期，也可写 2026-11-24 10:30:00

# 选填（Retypeset 原有字段）
description: ''                # 列表里的摘要；留空则自动截取正文开头
updated: ''                    # 更新日期
tags:                          # 标签
  - Astro
draft: false                   # true = 草稿，不发布
pin: 0                         # 置顶，0-99，数字越大越靠前
toc: true                      # 是否显示目录
lang: ''                       # 语言，留空即可
abbrlink: my-post              # 网址 /posts/my-post/，只能小写字母、数字、连字符

# 本博客新增字段
category: 个人项目             # 见下方分类列表
---

正文从这里开始写。
```

### 字段说明

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 文章标题 |
| `published` | 是 | 发布日期 |
| `description` | 否 | 摘要，显示在文章列表和分享卡片；不写则自动取正文开头 |
| `updated` | 否 | 最后更新日期 |
| `tags` | 否 | 标签数组，自动生成「标签」页 |
| `draft` | 否 | `true` 时不会发布 |
| `pin` | 否 | 置顶权重 0-99 |
| `toc` | 否 | 是否显示目录，默认开启 |
| `lang` | 否 | 文章语言，本站只有中文，留空 |
| `abbrlink` | 否 | 自定义网址，只能用小写字母、数字和 `-`；不写则用文件名 |
| `category` | 否 | **本站新增**，文章分类，必须是下面列表里的名字之一 |

### 分类

分类是固定的，在 `src/config.ts` 的 `categories` 里定义，导航栏「分类」页会列出全部分类（没有文章的也会显示）：

| 名称 | 网址 |
| --- | --- |
| 开源项目 | `/categories/opensource/` |
| LLM&AI | `/categories/llm-ai/` |
| English | `/categories/english/` |
| 搞七捻三 | `/categories/misc/` |
| 业务 | `/categories/business/` |
| 个人项目 | `/categories/projects/` |

想加新分类，在 `src/config.ts` 的 `categories` 里加一行 `{ name: '名称', slug: '网址用的英文' }` 即可。

### 图片

正文图片用图床外链，或放在 `src/content/posts/_images/` 下用相对路径引用。

## 星空背景

暗色模式下的双色星空是自写的 WebGL2 着色器（`src/scripts/sky/`）。

- 每次打开网站随机选一套配色（不会和上次相同），配色在 `src/scripts/sky/palettes.ts` 的 `PRESETS` 里。
- 右侧星形按钮可以换一片天空，一半概率换预设，一半概率随机生成；随机生成的配色会打印在浏览器控制台，喜欢的可以直接复制进 `PRESETS`。
- 用不上的配色不要删，放在 `src/scripts/sky/archive/unused-palettes.ts`，需要时挪回 `PRESETS`。

## 其他常改的位置

- 站点标题、作者、页脚链接、起始年份：`src/config.ts`
- 关于页：`src/content/about/about-zh.md`
- 网站图标：`public/icons/favicon.svg`

## 本地预览

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # 输出到 dist/
```
