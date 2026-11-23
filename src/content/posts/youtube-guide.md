---
title: 玩转Youtube
published: 2025-02-10 23:53:55
description: 文章以提升YouTube的使用体验为主题，从画质、广告问题到优质内容获取，再到英语学习及其他功能扩展，具体展开优化方案。涵盖广告屏蔽、视频下载、沉浸式观看、内容管理等多方面的实际操作，以及一些插件与命令行工具的使用。文章注重结合具体案例和方法，帮助用户在技术限制和政策管控下，挖掘YouTube的更多潜力。
category: 搞七捻三
tags:
- english
abbrlink: youtube-guide
---

# 玩转Youtube

最近看了影视飓风被封禁的B站画质的视频，终于明白为什么现在国内平台的画质那么垃圾了，1080P是假的，4K也是局部的，同样的视频，观看者越少画质越好，目的都是为了省点宽带费。而Youtube背靠谷歌，因为有着得天独厚的宽带和广告优势，从来不在意这点宽带费，所以对画质党来说油管是个不错的选择。此外，国内平台的很多博主在油管都有账号，所以也不用担心内容问题。言归正传，本文深入讲解如何优化你的Youtube观看体验以及如何使用Youtube辅助你的英语学习。

> PS：如果不想使用VPN，请使用 workers 反代 YouTube 镜像，源代码如下：

```
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // 检查访问者的国家/地区
  const country = request.headers.get('cf-ipcountry');

  // 仅允许中国大陆地区访问
  if (country !== 'CN') {
    return new Response('Unauthorized', { status: 401 });
  }

  // 检查是否已经提交了密码
  const cookie = request.headers.get('Cookie');
  const submittedPassword = url.searchParams.get('password');

  if (cookie && cookie.includes('authenticated=true')) {
    // 如果已经通过认证，转发请求到目标 URL
    return await forwardRequest(request, url);
  } else if (submittedPassword) {
    // 验证提交的密码
    if (submittedPassword === '888888') {
      // 设置认证 Cookie
      return new Response('Authenticated! Redirecting...', {
        status: 302,
        headers: {
          'Set-Cookie': 'authenticated=true; Max-Age=3600', // 1小时有效期
          'Location': url.origin + url.pathname // 重定向到目标路径
        }
      });
    } else {
      // 密码错误
      return new Response('Unauthorized', { status: 401 });
    }
  } else {
    // 返回密码输入页面
    return new Response(generatePasswordPage(), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// 转发请求到目标 URL
async function forwardRequest(request, url) {
  const targetUrl = 'https://iv.ggtyler.dev' + url.pathname + url.search;
  return fetch(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
}

// 生成密码输入页面的 HTML
function generatePasswordPage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Enter Password</title>
    </head>
    <body>
      <h1>Please Enter Password to Access</h1>
      <form method="GET">
        <input type="password" name="password" placeholder="Enter Password" required>
        <button type="submit">Submit</button>
      </form>
    </body>
    </html>
  `;
}
```

## 提升观看体验

### 去广告

要说提升观看体验，首先必然是先从去除油管无处不在的广告开始，首页广告、贴片广告、插入广告等等。方法有种：

#### 插件

**[AdGuard](https://chromewebstore.google.com/detail/adguard-adblocker/bgnkhhnnamicmpeenaelnjfhikgbkllg?hl=zh-CN&utm_source=ext_sidebar)** 、**[Adblock Plus](https://chromewebstore.google.com/detail/adblock-plus-%E5%85%8D%E8%B4%B9%E7%9A%84%E5%B9%BF%E5%91%8A%E6%8B%A6%E6%88%AA%E5%99%A8/cfhdojbkjhnklbpkdaibdccddilifddb?hl=zh-CN&utm_source=ext_sidebar)**、**[uBlock Origin](https://chromewebstore.google.com/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm?hl=zh-CN&utm_source=ext_sidebar)**、**[AdBlocker Ultimate](https://chromewebstore.google.com/detail/adblocker-ultimate/ohahllgiabjaoigichmmfljhkcfikeof?hl=zh-CN&utm_source=ext_sidebar)** 等等

其中**uBlock Origin**还可以自己添加规则已经屏蔽特定页面元素，这是我个人[常用的Anti-ad规则](https://bbs.kafan.cn/thread-1866845-1-1.html)

除了首页广告和独特的贴片广告，YouTube的博主有时也会在视频里推销某些东西，比如“Nord VPN” “快连” “家宽机场”等等，这些可以通过[SponsorBlock](https://chromewebstore.google.com/detail/sponsorblock-for-youtube/mnjggcdmjocbbbhaepdhchncahnbgone)来屏蔽掉。基本原理就是机器、人工以及用户标注好某一个影片Marketing片段，然后上传到SponsorBlock的服务器，这样所有用户都能享受此屏蔽规则，缺点就是新发布的影片有时标注不及时。

#### DNS解析

除了插件，还可以直接从流量层面拦截，直接不让广告域名所属流量正常加载，主要用的就是[AdGuard Home](https://adguard.com/en/adguard-home/overview.html).目前有多种设置方法，可以在路由器安装并配置规则，也可以在服务器通过docker部署，在路由器安装后为全局模式，局域网内所有设备均受规则影响。如果在服务器端部署则需要手动到各个设备的DNS设置里进行修改，如果没有服务器也可以用[Public AdGuard DNS server](https://adguard-dns.io/en/public-dns.html). 无论选择何种时配置方式，AdGuard DNS均会造成不同程度的网络减速，除非服务器的配置足够高，且使用人数足够多，这样AdGuard DNS缓存能发挥的作用越大。

#### 送中节点

虽然中国有正规的政企外网专线，但中国大陆的网民大多无缘使用，相当一部分都是通过租赁网络代理服务或者自建网络代理来访问外网。但是同一台服务器的网络代理使用的人数越多，就越有可能出现一种情况——风控，即IP风险值飙升(IP Fraudulent, 其在中国大陆特指送中（也称“送终”），一般指的是一台外网服务器因为使用的中国大陆网民人数太多，已经被谷歌等公司标注为“全是翻墙的中国大陆网民”，因此广告、音乐等服务拒绝提供给这样的用户，虽然我并不觉得广告也TM算服务的一部分，但是这确实是一种好用的免广告方法。但请注意，送中节点使用几次就会把你的谷歌账号也标注为“中国网民”，谷歌商店的部分应用还有谷歌的一些服务，比如Gemini等，你的账号是没有资格使用的。

#### 会员

开通会员也可以免广告，会员福利还包括：息屏播放、Youtube Music、下载等等，反正挺鸡肋的。
开通方式：去黑市上找尼日利亚区的Youtube Premium拼车，一年最便宜的35元，最贵的80-100元

#### 安卓端

YouTube Revanced + microg 两个软件都要安装，microg 要给权限–允许自启动、后台启动等。
microg 有好几个版本，华为版、普通安卓版、RE 版本，RE 貌似是轻量版。
该版本可以实现无广告、自动跳过赞助广告、固定画质、画中画、自定开启字幕等等功能。

##### 下载地址

Telegram: [Contact @OOAPK ](https://t.me/OOAPK/11196?single)
Microg 开源地址：[Release v0.3.2.240913 · microg/GmsCore · GitHub](https://github.com/microg/GmsCore/releases/tag/v0.3.2.240913)
Microg Re 开源地址：[GitHub - WSTxda/MicroG-RE at 5.8](https://github.com/WSTxda/MicroG-RE/tree/5.8)

##### 使用方法：

首先安装 MicroG。
然后安装 YouTube ReVanced。
打开 YouTube ReVanced。
登录谷歌账户即可。

### 沉浸式观看体验（字幕、剧场、AI总结、评论翻译）

![Trancy.png](https://imgbed-idk.pages.dev/file/blog/1762748942198_Trancy-kuoh.png)
在我使用过的所有YouTube沉浸式播放相关的插件中，[Trancy](https://chromewebstore.google.com/detail/ai-subtitles-immersive-tr/mjdbhokoopacimoekfgkcoogikbfgngb)的沉浸式观看效果是最好的，如上图所示，视频采用剧场模式播放，字幕跟随视频自动滚动。

Trancy的不足之处（评论翻译）由[Immersive Translation](https://chromewebstore.google.com/detail/immersive-translate-trans/bpoadfkcbjbfhfodiogcnhhhpibjhbnh?utm_source=official)补足, 效果如下图所示：
![沉浸式翻译效果.png](https://imgbed-idk.pages.dev/file/blog/1762748939075_immersive-translation-result.png)
以上两种插件的功能还有很多，包括自定义翻译引擎、生词本、划词翻译、导入导出等，考虑到篇幅原因，不做过多论述。

另外字幕部分转移到下文的“学习”部分讲解，以下是其他的YouTube优化插件和脚本，请按需安装：
[Improve YouTube!](https://chromewebstore.google.com/detail/improve-youtube-%F0%9F%8E%A7-for-yo/bnomihfieiccainjcjblhegjgglakjd)最主要的作用是自动预设YouTube的画质、字幕、播放速度、国家、全屏等功能。
[关键词屏蔽](https://greasyfork.org/zh-CN/scripts/419003-youtube%E5%85%B3%E9%94%AE%E8%AF%8D%E5%B1%8F%E8%94%BD)
[Youtube-shorts block](https://chromewebstore.google.com/detail/youtube-shorts-block/jiaopdjbehhjgokpphdfgmapkobbnmjp) ：屏蔽短视频。
[picture in picture](https://chromewebstore.google.com/detail/picture-in-picture-extens/hkgfoiooedgoejojocmhlaklaeopbecg) ：画中画悬浮小窗播放，一边看片一边学习。
[blocktube](https://chromewebstore.google.com/detail/blocktube/bbeaicapbccfllodepmimpkgecanonai) ：拉黑神器，可以彻底屏蔽不想看的视频。
[Danmaku Kakashi](https://chromewebstore.google.com/detail/danmaku-kakashi/kjmomkcbphcpellfhcokdkifgdggkhjg) ：弹幕工具，看油管视频时可导入 b 站弹幕。
[YouTube Summary with ChatGPT & Claude](https://chromewebstore.google.com/detail/youtube-summary-with-chat/nmmicjeknamkfloonkhhcjmomieiodli) ：获取视频文字稿。
[PocketTube](https://chromewebstore.google.com/detail/pockettube-youtube-subscr/kdmnjgijlmjgmimahnillepgcgeemffb) ：订阅管理工具。
[Screenshot YouTube](https://chromewebstore.google.com/detail/screenshot-youtube/gjoijpfmdhbjkkgnmahganhoinjjpohk) ：截图工具。
[字体渲染](https://github.com/F9y4ng/GreasyFork-Scripts) ：让字体更加有质感。
[链接净化脚本](https://greasyfork.org/zh-CN/scripts/456881-%E8%B7%9F%E8%B8%AA%E9%93%BE%E6%8E%A5%E5%87%80%E5%8C%96)

## 如何使用YouTube学习

### 内容管理

首先从内容管理开始，YouTube对于每一个新注册的账户都会尝试性地推荐一些关于中国政治的内容，大多冠以“中共秘闻”“国共”‘"专访"“中共禁书”等字眼，所述也大多是中国之阴暗面，部分为真，大部分有失偏颇，恨国党和小粉红们在评论区互相炒的不可开交，这就是YouTube的简中区一大特色。就我个人而言，YouTube简中区无疑是价值最低的区，戾气太重，想要避开简中区，让YouTube持续给你推荐优质内容的话大概有两个方面，首先是代理节点的IP最好是新加坡或者美国，再不济加拿大的也行，然后对于那些涉及中国政治的内容以及其他的不良内容（如色情），尽量做到一次都不要点击，否则YouTube强大的推荐算法会持续给你推荐此类内容，观感相当差。下面是我的首页内容，质量还算优秀：（这是我玩废了三个号才实现的成果）
![Youtube.png](https://imgbed-idk.pages.dev/file/blog/1762748939593_Youtube.png)

### 视频下载

接下来将YouTube的视频下载，讲的是方法，而不是简单地推荐几个网站。事实上，自从YouTube实施新政策以来，相当大一部分的YouTube下载网站直接被釜底抽薪，剩余的也只能提供480P这样的垃圾画质下载，因此，英语学习者要学会自己下载高质量的YouTube视频。

论下载，最强的是 [yt-dlp](https://github.com/yt-dlp/yt-dlp)，这是一个开源的命令行工具，使用步骤如下：

#### 安装

Linux系统
通过 `pip install yt-dlp` 和 `apt install yt-dlp`进行安装，有些时候通过apt安装的版本可能更新的不及时，导致下载失败，因此更加推荐通过pip安装，使用pip前需要安装python环境 `sudo apt install python3 python3-pip`，然后创建并激活虚拟环境: `python3 -m venv myenv` `source myenv/bin/activate` 最后安装ffmpeg: `apt install ffmpeg`

Windows系统
[yt-dlp下载地址](https://github.com/yt-dlp/yt-dlp#release-files)
[ffmpeg下载地址](https://ffmpeg.org/download.html#build-windows)
下载后无需安装，因为它们都是命令行程序，将以上两个exe放在同一个目录下并添加系统环境变量后即可在该目录启动CLI界面进行下载。

#### 语法

默认格式，高于720P的格式一般是 webm 格式

```
yt-dlp https://www.youtube.com/watch?v=kNU2WCHVVBk
```

下载视频转换成mp4（用--merge-output-format参数）

```
yt-dlp --merge-output-format mp4 https://www.youtube.com/watch?v=kNU2WCHVVBk
```

-F参数查看有哪些分辨率

```
yt-dlp -F https://www.youtube.com/watch?v=kNU2WCHVVBk
```

只下载音频，找m4a格式，列表越靠后越清晰。比如ID：140 | EXT：m4a | audio only

```
yt-dlp -f140 https://www.youtube.com/watch?v=kNU2WCHVVBk

```

下载音频转换成mp3（加上-x --audio-format参数）

```
yt-dlp -f140 -x --audio-format mp3 https://www.youtube.com/watch?v=kNU2WCHVVBk

```

下载视频（带音频）ID：22 | EXT：mp4 | 1280*720

```
yt-dlp -f22 https://www.youtube.com/watch?v=kNU2WCHVVBk

```

下载指定分辨率视频+音频(1080及以上分辨率的音频和视频是分开的，所以一般会音频和视频一起下载)

```
yt-dlp -f299+140 https://www.youtube.com/watch?v=kNU2WCHVVBk
```

(通用）下载最佳mp4视频+最佳m4a音频格式并合成mp4

```
yt-dlp -f 'bv[ext=mp4]+ba[ext=m4a]' --embed-metadata --merge-output-format mp4 https://www.youtube.com/watch?v=kNU2WCHVVBk
```

下载播放列表所有视频

```
yt-dlp https://www.youtube.com/playlist?list=**********
```

#### Cookies导入

自从YouTube实行新政策以来，想要不登录就观看视频的门槛变得高了很多，必须是美国的家庭宽带IP才可以做到。所以我们还需要传参：

- 安装扩展插件[Get cookies.txt LOCALLY](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc?pli=1)
- 然后在隐私模式下登录谷歌账号，打开YouTube，选择export all cookies
- 然后将cookies文件传到yt-dlp的同一目录
- 最后调用cookies下载，语法如下：

```
yt-dlp --cookies 3.txt -F https://www.bilibili.com/video/BV1Mu4y1P7kz?t=5.0
```

### 字幕获取

[DownSub](https://downsub.com/)
[NoteGPT](https://notegpt.io/)
以上两个工具有时会出现查询不到字幕的情况，因此最后破局之法唯有自己识别提取，工具很多，但最好用的应该是OpenAI开源的[Whisper](https://github.com/openai/whisper), 有相当一部分开源项目都是基于此系列模型。

### 结合AI进行学习

未完待续
