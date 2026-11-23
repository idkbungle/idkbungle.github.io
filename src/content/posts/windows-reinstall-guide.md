---
title: Win11企业版LSTC 系统重装及优化指南
published: 2025-08-15 14:37:29
description: 本文是一份详尽的 Windows 11 企业版 LTSC 系统重装与优化指南。内容涵盖从制作PE启动盘（推荐使用WEPE、Ventoy等工具）、下载并校验系统镜像，到重装前的数据与驱动备份、硬盘检测与分区。系统安装通过WinNTSetup工具完成，强调正确的分区格式（GPT/UEFI）和初步优化。安装后，指导用户恢复驱动、激活系统及Office套件。后续优化包括安装必备运行库（.NET、VC++）、修复DLL、调整隐私设置、更换默认应用、通过注册表禁用自动更新，以及卸载冗余组件。软件配置推荐使用绿色/便携版软件以减少系统负担，并列举了高效工具（如Everything、Dism++、RustDesk），同时明确指出了应避免的“黑名单”软件（如360、腾讯全家桶）。针对开发者，提供了Hyper-V、WSL2及多种编程语言（Node.js、Python、Go等）环境的配置方法。最后附有常见问题（如引导丢失、0x25D错误）的解决方案，是一套全面、实用的系统维护与优化方案。
category: 搞七捻三
tags:
- windows
abbrlink: windows-reinstall-guide
---

# **Win11企业版LSTC 系统重装及优化指南**

## 一、制作PE启动盘

**制作PE启动盘会把U盘内所有的数据清空，所以请先备份U盘重要文件，然后找一台正常运行的电脑（可以去网吧），插入U盘后下载PE安装包，以下随便选择一个即可：**

`WEPE`: [https://www.wepe.com.cn](https://www.wepe.com.cn/)

`FirPE`: [https://www.firpe.cn](https://www.firpe.cn/)

`Ventoy`: [https://www.ventoy.net](https://www.ventoy.net/)

`EasyU`: [https://www.itsk.com/](https://www.itsk.com/)

将PE安装进U盘后去 `next.itellyou.cn` 下载系统镜像，推荐Win11企业版LTSC，使用Qbittorrent或者迅雷实现高速下载，下载完成后使用 `iHasher`或者其他的哈希校验工具校验SHA1值，如果和itellyou给出的不一样，那么建议重新下载。第一次哈希校验一致后拷贝到U盘，再次检测哈希值，如果和itellyou不一样，请重新拷贝，如果多次不一样，那么你就要考虑换一块U盘了。（之所以不拷贝后校验是出于平均期望的角度考虑，因为通过U盘校验哈希比在电脑硬盘里校验所需时间长的多，如果你下载时就不一致，那么再通过U盘校验的时间成本就完全沉没了）

## 二、重装前的备份和检测工作

U盘启动进入PE后，准备重装，重装前还有最后几件事可以做：

首先是数据的备份，如果动手能力强、备份文件多、盘内无病毒或流氓软件残留，推荐使用WEPE自带的CGI或Ghost全盘备份，反之则推荐手动拷贝，精细化备份，手动拷贝的思路如下：

---

先拷贝系统盘下桌面、下载、文档、图片、音乐、视频文件夹，位置统一在C:\\Users\\【用户名】下，可以直接一键复制；接着使用Get-ChildItem命令或者dir命令输出每个系统盘下的Program Files和非系统盘下的所有文件夹名和文件名，方便之后重新下载软件和文件复位；之后再备份除系统盘之外的盘内重要文件和软件。

关于Get-ChildItem命令和dir命令的使用，我这里给出两个输出D盘的命令示例：

* **Win+X调出PowerShell命令行，运行：**
  ```
  Get-ChildItem D:\ -Directory | ForEach-Object { $_.Name } | Out-File -Encoding UTF8 D:\D-disk-output.txt
  Get-ChildItem D:\ -File | ForEach-Object { $_.Name } | Out-File -Encoding UTF8 D:\D-disk-output.txt -Append
  ```
* **Win+R输入CMD或右键单击调出CMD命令行，运行：**
  ```
  dir D:\ /A:D /B > D:\D-disk-output.txt
  dir D:\ /A:-D /B >> D:\D-disk-output.txt
  ```
* **另外也可以进一步区分文件和文件夹：**
  ```
  "--- Folders ---" | Out-File -Encoding UTF8 D:\D-disk-output.txt
  Get-ChildItem D:\ -Directory | ForEach-Object { "DIR: $($_.Name)" } | Out-File -Encoding UTF8 D:\D-disk-output.txt -Append

  "--- Files ---" | Out-File -Encoding UTF8 D:\D-disk-output.txt -Append
  Get-ChildItem D:\ -File | ForEach-Object { "FILE: $($_.Name)" } | Out-File -Encoding UTF8 D:\D-disk-output.txt -Append
  ```

---

其次是驱动的备份（可选，如果重装前后你的主板、系统版本保持一致且稳定，那么强烈建议备份现有驱动），使用Dism命令：

```
dism /online /export-driver /destination:D:\DriversBackup
```

恢复时在新装系统中运行：

```
dism /online /add-driver /driver:D:\DriversBackup /recurse
```

**或者打开** `设备管理器`（运行“compmgmt.msc”命令），右键当前设备，选择 `添加驱动程序`，然后选择驱动所在文件夹。对于单个驱动则是找到需要安装驱动程序的设备，右键点击该设备，并选择 `更新驱动程序`。在弹出的窗口中，选择 `浏览我的计算机以查找驱动程序软件`，然后指定之前备份的驱动程序文件夹的路径。

**或者下载**[Dism++](https://github.com/Chuyu-Team/Dism-Multi-language)实现可视化备份，记得勾选“内置驱动”

---

最后使用Disk Genius格式化硬盘后全盘检测一下硬盘，查看一下坏道有多少，如果坏道特别多建议更换硬盘，把原来的盘做成一个硬盘盒。

检测完需要处理硬盘的格式，如果主板是UEFI启动那么对应的硬盘格式就是Guid或GPT格式，如果是Legacy则是MBR格式，不过一般来说现在的比较新的电脑都是UEFI启动，实在不确定就开机时刷出BIOS看一眼。

处理好硬盘格式后重新分区（推荐分三个区——系统、软件、数据，盘符CDE顺延即可，不推荐占用AB，因为是软盘的盘符）。分完后记得保存，接下来开始重装。

---

## 三、重装

在PE环境下打开WinNTSetup

![WinNTsetup.png](https://imgbed-idk.pages.dev/file/blog/1762747026802_WinNTsetup.png)

> 橙色箭头选择下载好的镜像文件
>
> 红色箭头选择的为引导盘（UEFI选择ESP分区[一般为100MB左右]，传统BIOS选择系统盘，也就是C盘）
>
> 蓝色箭头为系统盘（通常为C盘）
>
> 选择镜像后粉色箭头所指地方可以选择版本
>
> 橙色椭圆圈着的地方通常为C盘
>
> 接着打开“优化调整”，根据自己的需要调整就行，不过Windows Defender建议关闭

确定完毕后点击绿箭头指着的“开始安装”进行系统安装

接下来可能会询问修复引导方式，直接默认点击“确定”即可

耐心等待系统镜像还原，机械硬盘大概需要15分钟以上，固态最快几分钟

完成后请拔下U盘并且重启电脑

重启电脑后将会进入系统部署，耐心等待，部署完毕将会自动重启电脑

当看到熟悉的壁纸和桌面图标时，证明系统已经安装完毕

## 四、打驱动

如果之前备份了驱动恢复时在新装系统中运行：

```
dism /online /add-driver /driver:D:\DriversBackup /recurse
```

或者打开 `设备管理器`（运行“compmgmt.msc”命令 或 `控制面板`>`硬件与声音`>`设备和打印机`>`设备管理器`），右键当前设备，选择 `添加驱动程序`，然后选择驱动所在文件夹。对于单个驱动则是找到需要安装驱动程序的设备，右键点击该设备，并选择 `更新驱动程序`。在弹出的窗口中，选择 `浏览我的计算机以查找驱动程序软件`，然后指定之前备份的驱动程序文件夹的路径。

或者通过Dism++导入也行，原理反正都差不多，最终设备管理器里没有感叹号就行

---

如果之前没有备份驱动，就去主板厂商的官网或者英伟达AMD厂商的官网下载驱动，比如

**Dell :** [https://www.dell.com/support/home/zh-cn](https://www.dell.com/support/home/zh-cn) (官网下载SupportAsistant后自动检测并下载缺失的驱动)

**联想：**[https://newsupport.lenovo.com.cn/driveDownloads\_index.html](https://newsupport.lenovo.com.cn/driveDownloads_index.html)

**惠普：**[https://support.hp.com/cn-zh/drivers](https://support.hp.com/cn-zh/drivers)

**华硕：**[https://www.asus.com.cn/support/download-center/](https://www.asus.com.cn/support/download-center/) 或 [https://driverhub.asus.com/zh-CN](https://driverhub.asus.com/zh-CN)

## 五、系统和Office激活

安装Office前先下载火绒等安全软件（主要是拦截Office安装过程中的一些微软自家的捆绑软件），拦截记录如下：

![img](data:image/png;base64,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)

去微软官网下载安装 `Office.setup`，开始安装后等待十五分钟到半小时，安装好之后打开PowerShell运行：

```
irm https://get.activated.win | iex
```

**或使用**[OfficeTool plus](https://www.officetool.plus/zh-cn/) 或 KMS激活，实在不放心可以去淘宝买一个企业版的批发Key，尽管完全没必要。

## 六、打补丁

接下来是给初始系统打一些补丁，补全缺失的DLL和运行时环境，以免安装或运行某些软件时崩溃或缺失部件。

`DLL`: 下载[DirectX\_Repair (Enhanced\_Edition)](https://www.zysoftware.top/post/13.html) , 修复一下缺失或损坏的DLL

---

`.NET`：去https://dotnet.microsoft.com/download 下载.NET SDK或者安装微软的Visual Studio

`Runtime`：安装 Microsoft Visual C++ Redistributable后安装新版的运行库就行，我一般就是从2022版开始往后都安装。

常见 Runtime 对应关系

| DLL 文件名       | 所属运行库版本       |
| ---------------- | -------------------- |
| MSVCR100.dll     | Visual C++ 2010      |
| MSVCR110.dll     | Visual C++ 2012      |
| MSVCR120.dll     | VisualC++ 2013       |
| VCRUNTIME140.dll | Visual C++ 2015-2022 |
| MSVCP140.dll     | Visual C++2015-2022  |

如果提示缺少 `VCRUNTIME140.dll`，你就需要安装 **VC++ 2015-2022 Redistributable**

---

## 七、优化系统

1. `右键单击后`>`个性化`>`主题`>`桌面图标设置`>`勾选控制面板`、`此电脑`和 `回收站`
2. 同样在任务栏右键单击，把微软自带的一些无用组件隐藏，并勾选任务栏行为里的 `“自动隐藏任务栏”`（主机用户可忽略此操作)

---

3. `隐私安全`: Win+i打开设置，将隐私与安全性里 `Windows权限`选项卡里的涉及传输个人数据和的部分关闭。
4. `多语言`：因为我本身在学习与使用日语，偶尔需要用日语来搜索或写文章，使用在线的日语输入法过于麻烦且有隐私泄露的风险，所以需要一个本地的日语语言包。打开 `设置`>`时间和语言`>`语言和区域`>`添加语言`

---

5. `输入法`：
   **微软拼音**: Win11默认自带的输入法，简洁好用。
   **搜狗绿色版**：如果用惯了搜狗，又不想搜狗自带的各种广告和捆绑软件，可以下载绿色版：[https://pan.quark.cn/s/930513bf58a8#/list/share](https://pan.quark.cn/s/930513bf58a8#/list/share)
   **Rime** : 如果更注重隐私，要求完全本地化，则推荐：[https://github.com/rime/weasel](https://github.com/rime/weasel)
6. `安装终端和Shell`: PowerShell 7和Windows Terminal、[ConEmu](https://github.com/ConEmu/ConEmu)
7. `禁止更新`：系统优化完成后禁止更新就行，Win11 LTSC已经很稳定好用了，更新反而可能导致系统不稳定、驱动不兼容，所以直接通过改注册表来延长十年更新时间：

```
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings]
"FlightSettingsMaxPauseDays"=dword:00001b58
"PauseFeatureUpdatesStartTime"="2023-07-07T10:00:52Z"
"PauseFeatureUpdatesEndTime"="2042-09-05T09:59:52Z"
"PauseQualityUpdatesStartTime"="2023-07-07T10:00:52Z"
"PauseQualityUpdatesEndTime"="2042-09-05T09:59:52Z"
"PauseUpdatesStartTime"="2023-07-07T09:59:52Z"
"PauseUpdatesExpiryTime"="2042-09-05T09:59:52Z"
```

后续如果需要移除此注册表修改，恢复更新可以使用：

```
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings]
"FlightSettingsMaxPauseDays"=-
"PauseFeatureUpdatesStartTime"=-
"PauseFeatureUpdatesEndTime"=-
"PauseQualityUpdatesStartTime"=-
"PauseQualityUpdatesEndTime"=-
"PauseUpdatesStartTime"=-
"PauseUpdatesExpiryTime"=-
```

不推荐使用某些第三方软件强制停止Windows自动更新，因为给的权限太高了，你很难知道这些闭源软件有没有搞暗箱操作。系统层面已经优化处理地差不多了，接下来处理软件，包括常规和CLI软件的安装和配置优化。

## 八、软件

### 常规软件

常规软件优化的方向就是能安装在D盘的就尽量放在D盘，下载软件时尽量找可靠的软件信源，比如果核、吾爱、克隆等，以及一些俄罗斯的网站。对于一些使用频率低的软件，尽量使用便携版或绿色版，以免污染系统。

因为我本身有数据备份的习惯，一直以来都是遵循"三二一"原则（三个版本或副本，两种介质，一个异地备份），所以我直接安装阿里云盘后从云盘恢复就行。以下是一些我比较推荐的常规软件和优化操作：

笔记软件：Notion，Obsidian，语雀，Typora，Anytype

文本编辑器：Sublime，Typora，EmEditor，Notepad++(此作者有台独倾向，慎用）

截屏录屏工具：Snipaste，oCam，Obstudio, pixpin

屏幕亮度调节：Twinkle Tray

效率工具：Everything，uTools，Quicker

解压工具：BandZip，Winrar, 7zip

文件同步与传输: Syncthing, Localsend

进程资源分配：Process Lasso

卸载工具，磁盘清理工具：IObit Uninstaller，HiBitUninstaller，CCleaner

影音播放器：PotPlayer，VLC

SSH：Xterminal

任务栏显示网速：TrafficMonitor

Host 修改：UsbEAm Hosts Editor

磁盘占用分析工具：wiztree

下载工具：IDM，NDM, Motrix, Gopeed, qBittorrent, Transmission

远程桌面：Todesk，RustDesk, UU

网络代理工具：Hiddify, FlClash, V2rayNg, Clash Rev verge和Mihomo party

云盘挂载：RaiDrive

Windows状态管理：图吧工具箱, CPU-Z, CrystalDiskInfo, Disk Genius, Dism++

沙盒：Sandboxie Plus

LLM调用：Cherry Studio

API：apipost, postman

电子书与文献管理：Calibre，Zotero

OCR: Umi-OCR, RapidOCR, utools,

Chrome：登录谷歌账号同步扩展和书签，然后通过webdav恢复油猴脚本，记得先打开开发者模式并允许用户脚本注入。

Office三件套：登录微软账号后全部打开自动保存，同时关闭一些加载项，比如

默认应用：修改文件打开的默认设置，替换掉win11自带的蹩脚的软件（比如Windows图片查看器和Windows Media Player），按照协议和文件类型都修改一下，主要包括mp3, mp4, mkv, mov, jpg, png, avif, md, html, htm, js, zip, rar, 7z等常见文件类型和http, https这两个最常用的协议，有时候某些需要联网校验license的软件点击校验没反应就是因为http(s)设置错误或者对应的浏览器没法正常唤醒。

卸载无用Windows组件（自选）：edge游戏助手, outlook, onenote等

关闭一些自启动软件和服务（自选）：比如Steam, Onenote, copilot, Xbox等

---

---

### CLI软件

**Yt-dlp：https://github.com/yt-dlp/yt-dlp/wiki/Installation 或https://blog.csdn.net/euqlll/article/details/126905973**

**Git Bash / Git for Windows：https://git-scm.com/download/wi**n

**Scoop：**

```
# 设置 PowerShell 执行策略
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# 下载安装脚本
irm get.scoop.sh -outfile 'install.ps1'
# 执行安装, --ScoopDir 参数指定 Scoop 安装路径
.\install.ps1 -ScoopDir 'C:\Scoop'
```

**Winget：https://github.com/microsoft/winget-cli/releases/latest**

**netcat：https://eternallybored.org/misc/netcat/**

**Everything CLI：https://www.voidtools.com/zh-cn/**

**Ffmpeg和Ffprobe：**[https://ffmpeg.org/](https://ffmpeg.org/)

**Rclone：**[https://rclone.org/](https://rclone.org/)

**Aria2：**[https://aria2.github.io/](https://aria2.github.io/)

**Gh：https://github.com/cli/cli#installation**

**Wrangler：`npm install -g wrangler`**

**Vercel Cli： ``npm install -g vercel``**

**Imge2text/ jp2a：https://github.com/cslarsen/jp2a**

**Exiftool：https://exiftool.org/**

**Rsync：**

```lisp
Invoke-Expression -Command ([System.Text.Encoding]::UTF8.GetString((Invoke-WebRequest -Uri "https://util.apio.xyz/public/InstallRsync.ps1" -UseBasicParsing).Content))
```

**Nmap：**[https://nmap.org/book/inst-windows.html](https://nmap.org/book/inst-windows.html)

**Chocolatey：https://chocolatey.org/install#individual**

**Gemini CLI：npm install -g @google/gemini-cli**

**Claude Code：npm install -g @anthropic-ai/claude-code**

---

### 软件黑名单

`360全系`：P2P无限下崽, 捆绑安装 (“全家桶”)

`腾讯全系`（微信QQ腾讯管家等）：无节制扫盘和偷传数据，侵犯隐私，如果需要从电脑备份聊天记录和朋友圈建议用网吧电脑；如果需要截图或录屏可以用oCam或快捷键。

`鲁大师，小鸟壁纸，2345全系，金山毒霸，QQ输入法，搜狗输入法`：捆绑安装 ，广告弹窗。

`各类"优化大师" 各类"清理大师"`

`三角洲等ACE扫盘游戏`：严重消耗硬盘性能和寿命

`夸克 百度 WPS`： 强制在系统里增加自己的盘符，可使用：[https://github.com/Return-Log/Drive-Icon-Manager](https://github.com/Return-Log/Drive-Icon-Manager)

`迅雷`: 劫持浏览器

`Utorrent, Macfee, LockBit`等： 内置捆绑插件，点名**Reasonlabs**这家傻逼公司的**RAV Endpoint Protection**和**Online Security**，Reasonlabs的官网：[https://reasonlabs.com/platform/products/online-security](https://reasonlabs.com/platform/products/online-security)

`Wegame, Wemod`：国产垃圾，不如steam一根毛

## 九、配置开发环境 (非开发者或编程人员可跳过)

### Hyper-V

1. 按 `Windows + R` ，执行 `OptionalFeatures` 打开「Windows 功能」
2. 勾选「Hyper-V」及所有子选项，同时勾选「虚拟机平台」。
3. 点击「确定」，完成后重启电脑（这一步不要用Dism++，有失败的风险）。
4. 验证安装：打开 PowerShell 执行 `systeminfo`，查看"Hyper-V 要求"部分是否全部显示为"是"。

### C++

1. 访问 Visual Studio 官网，向下滚动到"所有下载"部分，选择下载"Build Tools for Visual Studio 2022"。
2. 运行安装程序，选择"使用C++的桌面开发"工作负载。
3. 安装过程中确保勾选"MSVC v143 - VS 2022 C++ x64/x86 生成工具"等必要组件。
4. 完成安装后，打开 Visual Studio Code，安装 C/C++ 扩展以获得更好的开发体验。

### Node.js

1. 在 WSL 中安装 cURL：`sudo apt update && sudo apt install curl`。
2. 下载并安装 nvm (Node Version Manager)：`curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash`。
3. 重新打开终端，验证 nvm 安装：`nvm --version`。
4. 安装 LTS 版本 Node.js：`nvm install --lts`。
5. 配置 npm 镜像源加速下载：`npm config set registry https://registry.npmmirror.com`。

### WSL

1. 以管理员身份打开 PowerShell，执行：`dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart`。
2. 启用虚拟机平台：`dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart`，然后重启计算机。
3. 下载并安装最新 Linux 内核更新包，将 WSL 2 设置为默认版本：`wsl --set-default-version 2`。
4. 从 Microsoft Store 安装 Ubuntu 20.04 或 22.04 LTS 发行版。
5. 首次启动 Ubuntu 后，设置用户名和密码完成初始化。

### Python

1. 安装 pyenv：在 WSL 中执行 `curl https://pyenv.run | bash`。
2. 配置环境变量，在 `~/.bashrc` 文件末尾添加：

   ```
   export PATH="$HOME/.pyenv/bin:$PATH"
   eval "$(pyenv init --path)"
   eval "$(pyenv virtualenv-init -)"
   ```
3. 重新加载配置：`source ~/.bashrc`。
4. 安装所需 Python 版本：`pyenv install 3.11.4`。
5. 设置全局 Python 版本：`pyenv global 3.11.4`。

### Go

1. 下载并安装 Go 语言最新版本（建议 1.22+）。
2. 配置环境变量：

   - GOROOT：Go 的安装路径（例如 `/usr/local/go`）
   - GOPATH：工作区路径（例如 `~/go`）
   - 将 `$GOROOT/bin` 添加到 PATH 环境变量
3. 在 Linux/WSL 中，编辑 `~/.bashrc` 文件添加：

   ```
   export GOROOT=/usr/local/go
   export GOPATH=$HOME/go
   export PATH=$PATH:$GOROOT/bin:$GOPATH/bin
   ```
4. 重新加载配置：`source ~/.bashrc`。
5. 验证安装：执行 `go version` 和 `go env`。

### Claude Code Router

1. 确保已安装 Node.js 18+ 或 Bun 环境。
2. 全局安装 Claude Code：`npm install -g @anthropic-ai/claude-code`。
3. 安装 Claude Code Router：`npm install -g @musistudio/claude-code-router`。
4. 在用户主目录下创建配置文件 `~/.claude-code-router/config.json`，配置 API 密钥和模型参数。
5. 验证安装：执行 `claude --version` 和 `claude-code-router --version`。

### Mise

1. 安装 Mise（适用于 Linux/WSL）：

   ```bash
   curl https://mise.jdx.dev/install.sh | sh
   echo 'eval "$(~/.local/bin/mise activate bash)"' >> ~/.bashrc
   source ~/.bashrc
   ```
2. 配置 Mise 以管理多种语言环境：

   ```bash
   mise use -g node@latest
   mise use -g python@latest
   mise use -g go@latest
   ```
3. 在项目目录中创建 `.tool-versions` 文件，指定项目所需的特定版本：

   ```
   node 18.18.0
   python 3.11.4
   go 1.22.0
   ```
4. 执行 `mise install` 自动安装指定版本的工具链。

### Git

1. 配置全局用户名和邮箱：

   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```
2. 生成 SSH 密钥：`ssh-keygen -t ed25519 -C "your.email@example.com"`。
3. 将生成的公钥（`~/.ssh/id_ed25519.pub`）内容添加到 GitHub/GitLab 账户的 SSH Keys 设置中。
4. 测试 SSH 连接：`ssh -T git@github.com`。
5. 配置 Git 别名（可选）：

   ```bash
   git config --global alias.co checkout
   git config --global alias.br branch
   git config --global alias.ci commit
   git config --global alias.st status
   ```

### Java

1. 从 Oracle 官网下载 JDK 17 安装包（选择 Windows x64 Installer）。
2. 运行安装程序，按提示完成安装（建议安装到非系统盘如 D:\Java\jdk-17.0.2）。
3. 配置环境变量：
   - 新建系统变量 `JAVA_HOME`，值为 JDK 安装路径（例如 `D:\Java\jdk-17.0.2`）
   - 编辑 `Path` 变量，添加 `%JAVA_HOME%\bin`
4. 验证安装：打开命令提示符，执行 `java -version` 和 `javac -version`。
5. 如需多版本 JDK 管理，可通过修改 `JAVA_HOME` 指向不同 JDK 版本目录实现。

### PHP

1. 下载并安装 XAMPP（包含 PHP 8.x 环境）。
2. 编辑 `php.ini` 文件（位于 XAMPP 安装目录的 php 文件夹中），确保以下扩展已启用：

   ```
   extension=openssl
   extension=curl
   extension=fileinfo
   ```
3. 下载 Composer-Setup.exe 安装程序，运行后按照提示完成安装。
4. 配置 Composer 使用国内镜像源：

   ```bash
   composer config -g repo.packagist composer https://mirrors.aliyun.com/composer/
   ```
5. 验证安装：执行 `php -v` 和 `composer --version`。

### MySQL

1. 下载 MySQL 8.0 安装包（建议选择 Windows (x86, 64-bit), ZIP Archive）。
2. 解压到目标目录（例如 `C:\mysql-8.0.36`）。
3. 初始化数据库：`mysqld --initialize --console`，记录生成的临时 root 密码。
4. 安装为 Windows 服务：`mysqld --install`。
5. 启动服务：`net start mysql`，然后使用临时密码登录：`mysql -u root -p`。
6. 修改 root 密码：

   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'YourNewStrongPassword!';
   ```
7. 配置环境变量：将 MySQL 的 bin 目录（例如 `C:\mysql-8.0.36\bin`）添加到系统 PATH。

---

## 十、常见问题

**问：按prt sc没反应怎么办？**

**答： 去游戏-摄像转一下就行**

**问：Win11激活时跳过联网后不显示WIFI？**

**答： 先用USB链接手机通过USB共享网络，然后检查网卡驱动、更新系统，都不行就关机后拔掉所有外设长按电源键30s释放静电。**

**问：风扇不转怎么办？**

**答：去BIOS里看一下是不是启用了“风扇静音模式”或“节能模式”。另外检查驱动和主板。**

**问：WinNTSetup安装镜像提示0x25D怎么办？**

**答： 下载的系统镜像文件不完整，请重新下载。**

**问： 系统镜像的MD5值是正确的，但还是提示0x25D？**

**答： 硬盘问题，逻辑坏道或者物理坏道导致的。更换硬盘，重新下载文件解决。**

**问： 开机提示BOOTMGR is missing / NTLTR is missing，怎么办？**

**答： 系统引导丢失，进入PE后使用DISM++修复系统引导即可。**

**问： 装系统时强制关机，然后开机后黑屏无信号，确定显卡插槽视频线都是好的，怎么办？**

****答： 尝试将机器完全断电，扣掉主板上的CMOS电池，等待十秒钟后再装回，然后开机即可。****
