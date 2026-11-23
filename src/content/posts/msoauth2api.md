---
title: 微软 OAuth2 验证转化为API收件
published: 2025-02-14 23:01:50
description: 本项目 `msOauth2api` 旨在简化微软 OAuth2 认证流程，并将其集成到 Cloudflare Workers 或 Pages 中，以实现基于 HTTP(S) 的 OAuth2 邮件接收。该项目提供了 API 部署方案，推荐使用 Vercel 进行低成本、高效率的全球分布式部署，同时也支持在 Windows 和 Linux 环境下通过 Node.js 进行本地部署。API 提供了获取最新邮件（自动提取6位验证码）、获取全部邮件、清空收件箱和清空垃圾箱等功能，均需提供 `refresh_token`、`client_id` 和 `email` 等参数。此外，项目还包含一个 WebUI 部署流程，通过 Cloudflare Workers 和 KV 存储（用于存储 `email----password----clientId----refreshToken` 格式的账户信息）实现，用户可以通过该界面方便地管理多个邮箱账户、查看邮件、撰写和发送新邮件，并支持账户的搜索、批量导入和管理操作。
category: 开源项目
tags:
- github
- Web
- cloudflare
abbrlink: msoauth2api
---

## 引言

简化微软 OAuth2 认证流程，并将其集成到cloudflare workers或pages中实现基于http(s)的Oauth2收件。

项目源地址：https://github.com/HChaoHui/msOauth2api

## API部署流程

### 一、Vercel部署(推荐)

用Vercel云平台部署不仅部署、维护成本低，而且可借用Vercel的全球分布式网络，降低收发件的IP成本。

首先在Github Fork此项目，并授权Vercel访问该Github Repo的权限。

接着点击[此处](https://vercel.com/new/clone?repository-url=https://github.com/HChaoHui/msOauth2api)以将其部署于Vercel

部署完成后即可通过 `https://your-vercel-app.vercel.app` 访问你的服务，请注意，Vercel自动分配的域名在中国大陆可能被阻断或污染，可通过 `Add Domain`  添加CNAME解析来添加自定义域名，绑定自定义域名后大陆可直连访问。

![vercel-domain.png](https://imgbed-idk.pages.dev/file/blog/1762747938023_vercel-domain.png)

### 二、本地部署（Windows&Linux）

本地部署需要事先配置Nodejs环境

Windows端配置：参考 `https://nodejs-configuration.pages.dev/`

Linux端配置：

```
apt install nodejs
apt install npm  # or apt install yarn or pnpm
```

然后拉取项目的VPS分支到本地：

```
git clone -b vps https://github.com/HChaoHui/msOauth2api.git msOauth2api-vps
```

切换至项目目录：

```
E:\Code\msOauth2api-vps\msOauth2api-vps
```

安装项目依赖：

```
npm install # or yarn install
```

启动：

```
node app.js
```

打开 `http://localhost:3000` 调用接口即可，可以自定义端口

具体来说Windows端：Powershell  `$env:PORT = "3001"; node app.js` ; CMD `cmd /c "set PORT=3001 && node app.js"`  除以上两种暂时性的方法，也可直接修改 `app.js`  ，将 `const PORT = process.env.PORT || 3000; ` 里的3000修改为任意端口。

Linux端： `PORT=3001 node app.js`  或者使用临时变量（仅作用于当前终端）：

```
export PORT=3001
node app.js
```

PM2启动：`pm2 start app.js --env production --env PORT=3001`

### API 文档

#### 📧 获取最新的一封邮件

* **方法**: `GET`
* **URL**: `/api/mail-new`
* **描述**: 获取最新的一封邮件。如果邮件中含有6位数字验证码，会自动提取。
* **参数说明**:
  * `refresh_token` (必填): 用于身份验证的 refresh\_token。
  * `client_id` (必填): 客户端 ID。
  * `email` (必填): 邮箱地址。
  * `mailbox` (必填): 邮箱文件夹，支持的值为 `INBOX` 或 `Junk`。
  * `response_type` (可选): 返回格式，支持的值为 `json` 或 `html`，默认为 `json`。

#### 📨 获取全部邮件

* **方法**: `GET`
* **URL**: `/api/mail-all`
* **描述**: 获取全部邮件。如果邮件中含有6位数字验证码，会自动提取。
* **参数说明**:
  * `refresh_token` (必填): 用于身份验证的 refresh\_token。
  * `client_id` (必填): 客户端 ID。
  * `email` (必填): 邮箱地址。
  * `mailbox` (必填): 邮箱文件夹，支持的值为 `INBOX` 或 `Junk`。

#### 🗑️ 清空收件箱

* **方法**: `GET`
* **URL**: `/api/process-inbox`
* **描述**: 清空收件箱。
* **参数说明**:
  * `refresh_token` (必填): 用于身份验证的 refresh\_token。
  * `client_id` (必填): 客户端 ID。
  * `email` (必填): 邮箱地址。

#### 🗑️ 清空垃圾箱

* **方法**: `GET`
* **URL**: `/api/process-junk`
* **描述**: 清空垃圾箱。
* **参数说明**:
  * `refresh_token` (必填): 用于身份验证的 refresh\_token。
  * `client_id` (必填): 客户端 ID。
  * `email` (必填): 邮箱地址。

## WebUI部署流程

示例网址：`https://ms-mail.lichensheng.workers.dev/`

创建workers并部署下面的源码，然后创建KV空间，并将其与workers绑定，变量名称为 `ACCOUNTS`

WebUI账号导入格式：`email----password----clientId----refreshToken`

ms-email-workers源码：

```
// KV Namespace 绑定 - 需在Cloudflare Workers设置中创建和绑定
// ACCOUNTS: 存储账户信息

// API URL
const API_BASE_URL = 'https://ms-email-oscar.itvoyager.us/api';

// Logo URL
const LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg';

// 主页 HTML 模板
const indexHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>邮箱 API 客户端</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/remixicon@4.1.0/fonts/remixicon.css">
    <link rel="icon" href="${LOGO_URL}">
    <style>
        :root {
            --bg-color: #f8f9fa;
            --text-color: #212529;
            --accent-color: #0078d4; /* Outlook blue */
            --card-bg: #fff;
            --card-border: #c8c8c8;
            --button-primary: #0078d4;
            --button-primary-hover: #005a9e;
            --button-secondary: #f3f3f3;
            --button-secondary-hover: #e0e0e0;
            --header-bg: #fff;
            --header-border-bottom: #e0e0e0;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg-color: #18191a;
                --text-color: #f0f0f0;
                --accent-color: #3ab7f0;
                --card-bg: #333;
                --card-border: #555;
                --button-primary: #3ab7f0;
                --button-primary-hover: #2a88b8;
                --button-secondary: #444;
                --button-secondary-hover: #555;
                --header-bg: #333;
                --header-border-bottom: #555;
            }
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
        }

        .header {
            background-color: var(--header-bg);
            border-bottom: 1px solid var(--header-border-bottom);
            padding: 15px 0;
            text-align: center;
            width: 100%;
            margin-bottom: 15px;
            display: flex;
            justify-content: center;
        }
    
        .header-content {
            width: 90%;
            max-width: 960px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .container {
            width: 90%;
            max-width: 960px;
        }

        h1 {
            color: var(--accent-color);
            font-size: 1.8rem;
            font-weight: 600;
            margin-bottom: 0.8rem;
        }

        .manage-link {
            text-align: right;
            margin-bottom: 15px;
        }

        .manage-link a {
            color: var(--accent-color);
            text-decoration: none;
            font-size: 0.9rem;
        }

        .manage-link a:hover {
            text-decoration: underline;
        }

        .account {
            background-color: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 0.3rem;
            padding: 1rem;
            margin-bottom: 0.8rem;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .account h2 {
            color: var(--text-color);
            font-size: 1.2rem;
            margin-top: 0;
            margin-bottom: 0.8rem;
            cursor: pointer;
            overflow-wrap: break-word;
            word-break: break-all;
        }

        @media (max-width: 768px) {
            .account h2 {
                font-size: 1rem;
            }
        }

        .account h2:hover {
            text-decoration: underline;
        }

        .actions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 0.8rem;
        }

        button {
            padding: 0.6rem 1.2rem;
            border: 1px solid transparent;
            border-radius: 0.3rem;
            cursor: pointer;
            font-size: 0.9rem;
            transition: background-color 0.15s ease-in-out;
            box-shadow: none;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        button:focus {
            outline: 2px solid var(--accent-color);
            outline-offset: -2px;
        }

        button.btn-primary {
            background-color: var(--button-primary);
            color: white;
        }

        button.btn-primary:hover {
            background-color: var(--button-primary-hover);
        }

        button.btn-secondary {
            background-color: var(--button-secondary);
            color: var(--text-color);
            border: 1px solid var(--card-border);
        }

        button.btn-secondary:hover {
            background-color: var(--button-secondary-hover);
        }

        .copy-message {
            margin-top: 0.4rem;
            font-size: 0.8rem;
            display: none;
        }
    
        .search-container {
            display: flex;
            margin-bottom: 15px;
            gap: 10px;
        }

        .search-container input {
            flex-grow: 1;
            padding: 0.6rem 0.8rem;
            border: 1px solid var(--card-border);
            border-radius: 0.3rem;
            font-size: 0.9rem;
            background-color: var(--card-bg);
            color: var(--text-color);
        }

        .search-container button {
            padding: 0.6rem 1.2rem;
            white-space: nowrap;
        }

        .account.hidden {
            display: none;
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="header-content">
            <h1>邮箱 API 客户端</h1>
        </div>
    </header>
    <div class="container">
        <div class="manage-link">
            <a href="/manage" target="_blank">管理账号</a>
            <span id="accountCount"></span>
        </div>
    
        <div class="search-container">
            <input type="text" id="searchBox" placeholder="搜索邮箱 (例如: outlook.com)" oninput="filterAccounts()">
            <button class="btn-secondary" onclick="clearSearch()">清除</button>
        </div>
    
        <div id="accounts"></div>
    </div>
    <script>
        const API_BASE_URL = '${API_BASE_URL}';
    
        // 全局变量，保存所有账号
        let allAccounts = {};

        async function loadAccounts() {
            const response = await fetch('/accounts');
            allAccounts = await response.json();
            displayAccounts(allAccounts);
        }
    
        function displayAccounts(accounts, searchTerm = '') {
            const accountsDiv = document.getElementById('accounts');
            accountsDiv.innerHTML = '';
        
            // 添加账号总数显示
            const accountCount = Object.keys(accounts).length;
            const totalCount = Object.keys(allAccounts).length;
            let countMessage = \` (共 \${totalCount} 个账号)\`;
        
            if (searchTerm) {
                countMessage += \` - 找到 \${accountCount} 个匹配结果\`;
            }
        
            document.getElementById('accountCount').textContent = countMessage;
        
            // 添加带序号的账号
            let index = 1;
            for (const email in accounts) {
                const account = accounts[email];
                const accountDiv = document.createElement('div');
                accountDiv.classList.add('account');
                accountDiv.innerHTML = \`
                    <h2 onclick="copyToClipboard('\${email}', event)" title="点击复制">\${index}. \${email}</h2>
                    <div class="actions">
                        <button class="btn-primary" onclick="openApiUrl('\${email}', 'INBOX', 'new')">获取新邮件 (收件箱)</button>
                        <button class="btn-primary" onclick="openApiUrl('\${email}', 'Junk', 'new')">获取新邮件 (垃圾邮件)</button>
                        <button class="btn-primary" onclick="composeMail('\${email}')">发送邮件</button>
                        <button class="btn-primary" onclick="openApiUrl('\${email}', 'INBOX', 'all')">获取全部邮件</button>
                        <button class="btn-primary" onclick="openApiUrl('\${email}', 'Junk', 'all')">获取全部邮件 (垃圾邮件)</button>
                        <button class="btn-secondary" onclick="openApiUrl('\${email}', 'INBOX', 'process')">清空收件箱</button>
                    </div>
                    <div class="copy-message"></div>
                \`;
                accountsDiv.appendChild(accountDiv);
                index++;
            }
        }
    
        function filterAccounts() {
            const searchTerm = document.getElementById('searchBox').value.toLowerCase().trim();
        
            if (!searchTerm) {
                displayAccounts(allAccounts);
                return;
            }
        
            const filteredAccounts = {};
        
            for (const email in allAccounts) {
                if (email.toLowerCase().includes(searchTerm)) {
                    filteredAccounts[email] = allAccounts[email];
                }
            }
        
            displayAccounts(filteredAccounts, searchTerm);
        }
    
        function clearSearch() {
            document.getElementById('searchBox').value = '';
            displayAccounts(allAccounts);
        }

        function openApiUrl(email, mailbox, type) {
            fetch('/accounts').then(response => response.json()).then(accounts => {
                const account = accounts[email];
                if (!account) {
                    alert('账号不存在！');
                    return;
                }
                let url;
                if (type === 'new') {
                    url = \`\${API_BASE_URL}/mail-new?refresh_token=\${account.refresh_token}&client_id=\${account.client_id}&email=\${email}&mailbox=\${mailbox}&response_type=html\`;
                } else if (type === 'all') {
                    url = \`\${API_BASE_URL}/mail-all?refresh_token=\${account.refresh_token}&client_id=\${account.client_id}&email=\${email}&mailbox=\${mailbox}\`;
                } else if (type === 'process') {
                    const apiEndpoint = mailbox === 'INBOX' ? 'process-inbox' : 'process-junk';
                    url = \`\${API_BASE_URL}/\${apiEndpoint}?refresh_token=\${account.refresh_token}&client_id=\${account.client_id}&email=\${email}\`;
                }
                if (url) {
                    window.open(url, '_blank');
                }
            });
        }
    
        // 打开邮件撰写页面
        function composeMail(email) {
            window.location.href = \`/compose?email=\${encodeURIComponent(email)}\`;
        }

        function copyToClipboard(text, event) {
            navigator.clipboard.writeText(text).then(() => {
                const messageDiv = event.target.nextElementSibling.nextElementSibling;
                messageDiv.textContent = '邮箱地址已复制';
                messageDiv.style.display = 'block';
                setTimeout(() => {
                    messageDiv.style.display = 'none';
                }, 2000);
            }, () => {
                const messageDiv = event.target.nextElementSibling.nextElementSibling;
                messageDiv.textContent = '复制失败，请手动复制';
                messageDiv.style.display = 'block';
                setTimeout(() => {
                    messageDiv.style.display = 'none';
                }, 2000);
            });
        }

        loadAccounts();
    </script>
</body>
</html>
`;

// 邮件撰写页面 HTML 模板
const composeHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>撰写邮件</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/remixicon@4.1.0/fonts/remixicon.css">
    <link rel="icon" href="${LOGO_URL}">
    <style>
        :root {
            --bg-color: #f8f9fa;
            --text-color: #212529;
            --accent-color: #0078d4;
            --card-bg: #fff;
            --card-border: #c8c8c8;
            --button-primary: #0078d4;
            --button-primary-hover: #005a9e;
            --button-secondary: #f3f3f3;
            --button-secondary-hover: #e0e0e0;
            --header-bg: #fff;
            --header-border-bottom: #e0e0e0;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg-color: #18191a;
                --text-color: #f0f0f0;
                --accent-color: #3ab7f0;
                --card-bg: #333;
                --card-border: #555;
                --button-primary: #3ab7f0;
                --button-primary-hover: #2a88b8;
                --button-secondary: #444;
                --button-secondary-hover: #555;
                --header-bg: #333;
                --header-border-bottom: #555;
            }
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
        }

        .header {
            background-color: var(--header-bg);
            border-bottom: 1px solid var(--header-border-bottom);
            padding: 15px 0;
            text-align: center;
            width: 100%;
            margin-bottom: 15px;
            display: flex;
            justify-content: center;
        }
    
        .header-content {
            width: 90%;
            max-width: 800px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .container {
            width: 90%;
            max-width: 800px;
            padding-bottom: 40px;
        }

        h1 {
            color: var(--accent-color);
            font-size: 1.8rem;
            font-weight: 600;
            margin-bottom: 0.8rem;
        }

        .back-link {
            text-align: right;
            margin-bottom: 1.5rem;
        }

        .back-link a {
            color: var(--accent-color);
            text-decoration: none;
            font-size: 0.9rem;
        }

        .back-link a:hover {
            text-decoration: underline;
        }

        .compose-form {
            background-color: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 0.3rem;
            padding: 1.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .form-group {
            margin-bottom: 1rem;
        }

        label {
            display: block;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
            color: var(--text-color);
        }

        input, textarea, select {
            width: 100%;
            padding: 0.6rem 0.8rem;
            border: 1px solid var(--card-border);
            border-radius: 0.3rem;
            font-size: 0.9rem;
            background-color: var(--card-bg);
            color: var(--text-color);
            box-sizing: border-box;
        }

        textarea {
            min-height: 200px;
            resize: vertical;
        }

        .format-toggle {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .format-toggle label {
            display: flex;
            align-items: center;
            cursor: pointer;
        }

        .format-toggle input {
            width: auto;
            margin-right: 0.5rem;
        }

        .buttons {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
            margin-top: 1rem;
        }

        button {
            padding: 0.6rem 1.2rem;
            border: 1px solid transparent;
            border-radius: 0.3rem;
            cursor: pointer;
            font-size: 0.9rem;
            transition: background-color 0.15s ease-in-out;
        }

        button.btn-primary {
            background-color: var(--button-primary);
            color: white;
        }

        button.btn-primary:hover {
            background-color: var(--button-primary-hover);
        }

        button.btn-secondary {
            background-color: var(--button-secondary);
            color: var(--text-color);
            border: 1px solid var(--card-border);
        }

        button.btn-secondary:hover {
            background-color: var(--button-secondary-hover);
        }

        .alert {
            padding: 0.75rem 1.25rem;
            margin-bottom: 1rem;
            border: 1px solid transparent;
            border-radius: 0.3rem;
        }

        .alert-success {
            color: #155724;
            background-color: #d4edda;
            border-color: #c3e6cb;
        }

        .alert-danger {
            color: #721c24;
            background-color: #f8d7da;
            border-color: #f5c6cb;
        }

        @media (prefers-color-scheme: dark) {
            .alert-success {
                color: #d4edda;
                background-color: #155724;
                border-color: #c3e6cb;
            }
        
            .alert-danger {
                color: #f8d7da;
                background-color: #721c24;
                border-color: #f5c6cb;
            }
        }

        #result {
            display: none;
            margin-top: 1rem;
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="header-content">
            <h1>撰写邮件</h1>
        </div>
    </header>
    <div class="container">
        <div class="back-link">
            <a href="/">返回邮箱列表</a>
        </div>
    
        <div id="result" class="alert"></div>
    
        <div class="compose-form">
            <form id="emailForm">
                <div class="form-group">
                    <label for="from">发件人：</label>
                    <select id="from" name="from" required>
                        <option value="">-- 选择发件邮箱 --</option>
                    </select>
                </div>
            
                <div class="form-group">
                    <label for="to">收件人：</label>
                    <input type="email" id="to" name="to" required>
                </div>
            
                <div class="form-group">
                    <label for="subject">主题：</label>
                    <input type="text" id="subject" name="subject" required>
                </div>
            
                <div class="format-toggle">
                    <label>
                        <input type="radio" name="format" value="text" checked>
                        纯文本
                    </label>
                    <label>
                        <input type="radio" name="format" value="html">
                        HTML
                    </label>
                </div>
            
                <div class="form-group">
                    <label for="content">内容：</label>
                    <textarea id="content" name="content" required></textarea>
                </div>
            
                <div class="buttons">
                    <button type="button" class="btn-secondary" onclick="window.location.href='/'">取消</button>
                    <button type="submit" class="btn-primary">发送邮件</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // 获取URL参数中的邮箱
        const urlParams = new URLSearchParams(window.location.search);
        const preselectedEmail = urlParams.get('email');
    
        // 加载账号列表
        async function loadAccounts() {
            try {
                const response = await fetch('/accounts');
                const accounts = await response.json();
            
                const fromSelect = document.getElementById('from');
            
                // 清空现有选项
                fromSelect.innerHTML = '<option value="">-- 选择发件邮箱 --</option>';
            
                // 添加所有邮箱
                for (const email in accounts) {
                    const option = document.createElement('option');
                    option.value = email;
                    option.textContent = email;
                    fromSelect.appendChild(option);
                }
            
                // 如果URL中有预选的邮箱，则选中它
                if (preselectedEmail && fromSelect.querySelector(\`option[value="\${preselectedEmail}"]\`)) {
                    fromSelect.value = preselectedEmail;
                }
            } catch (error) {
                showResult('加载账号失败: ' + error.message, 'error');
            }
        }
    
        // 显示结果提示
        function showResult(message, type) {
            const resultDiv = document.getElementById('result');
            resultDiv.textContent = message;
            resultDiv.style.display = 'block';
        
            if (type === 'success') {
                resultDiv.className = 'alert alert-success';
            } else {
                resultDiv.className = 'alert alert-danger';
            }
        
            // 滚动到顶部
            window.scrollTo(0, 0);
        
            // 如果是成功，3秒后自动隐藏
            if (type === 'success') {
                setTimeout(() => {
                    resultDiv.style.display = 'none';
                }, 3000);
            }
        }
    
        // 处理表单提交
        document.getElementById('emailForm').addEventListener('submit', async function(e) {
            e.preventDefault();
        
            // 禁用提交按钮防止重复提交
            const submitButton = this.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = '发送中...';
        
            // 获取表单数据
            const email = document.getElementById('from').value;
            const to = document.getElementById('to').value;
            const subject = document.getElementById('subject').value;
            const content = document.getElementById('content').value;
            const format = document.querySelector('input[name="format"]:checked').value;
        
            try {
                // 发送请求
                const response = await fetch('/send-mail', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email,
                        to,
                        subject,
                        content,
                        format
                    })
                });
            
                const result = await response.json();
            
                if (response.ok) {
                    showResult('邮件发送成功!', 'success');
                    // 清空表单
                    document.getElementById('to').value = '';
                    document.getElementById('subject').value = '';
                    document.getElementById('content').value = '';
                } else {
                    showResult('发送失败: ' + (result.error || '未知错误'), 'error');
                }
            } catch (error) {
                showResult('发送错误: ' + error.message, 'error');
            } finally {
                // 恢复提交按钮
                submitButton.disabled = false;
                submitButton.textContent = '发送邮件';
            }
        });
    
        // 页面加载时获取账号列表
        loadAccounts();
    </script>
</body>
</html>
`;

// 账号管理页面 HTML 模板 - 新增批量操作功能
const manageHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>管理账号</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/remixicon@4.1.0/fonts/remixicon.css">
    <link rel="icon" href="${LOGO_URL}">
    <style>
        :root {
            --bg-color: #f8f9fa;
            --text-color: #212529;
            --accent-color: #0078d4;
            --card-bg: #fff;
            --card-border: #c8c8c8;
            --button-primary: #0078d4;
            --button-primary-hover: #005a9e;
            --button-warning: #fd7e14;
            --button-warning-hover: #e36c0a;
            --button-danger: #dc3545;
            --button-danger-hover: #c82333;
            --header-bg: #fff;
            --header-border-bottom: #e0e0e0;
            --form-label-color: #495057;
            --checkbox-bg: #fff;
            --checkbox-border: #adb5bd;
            --batch-actions-bg: #f8f9fa;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg-color: #18191a;
                --text-color: #f0f0f0;
                --accent-color: #3ab7f0;
                --card-bg: #333;
                --card-border: #555;
                --button-primary: #3ab7f0;
                --button-primary-hover: #2a88b8;
                --button-warning: #fd7e14;
                --button-warning-hover: #e36c0a;
                --button-danger: #c82333;
                --button-danger-hover: #b01a28;
                --header-bg: #333;
                --header-border-bottom: #555;
                --form-label-color: #bbb;
                --checkbox-bg: #333;
                --checkbox-border: #666;
                --batch-actions-bg: #2a2a2a;
            }
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
        }

        .header {
            background-color: var(--header-bg);
            border-bottom: 1px solid var(--header-border-bottom);
            padding: 15px 0;
            text-align: center;
            width: 100%;
            margin-bottom: 15px;
            display: flex;
            justify-content: center;
        }
    
        .header-content {
            width: 90%;
            max-width: 700px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .container {
            width: 90%;
            max-width: 700px;
            padding-bottom: 80px; /* 增加底部间距，避免被批量操作栏遮挡 */
        }

        h1 {
            color: var(--accent-color);
            font-size: 1.8rem;
            font-weight: 600;
            margin-bottom: 0.8rem;
        }

        .back-link {
            text-align: right;
            margin-bottom: 1.5rem;
        }

        .back-link a {
            color: var(--accent-color);
            text-decoration: none;
            font-size: 0.9rem;
        }

        .back-link a:hover {
            text-decoration: underline;
        }

        .import-area {
            margin-bottom: 1.5rem;
        }

        .import-area h2, .add-account-form h2 {
            font-size: 1.4rem;
            color: var(--text-color);
            margin-top: 0;
            margin-bottom: 1rem;
        }

        .import-area label, .add-account-form label {
            display: block;
            margin-bottom: 0.4rem;
            font-size: 0.9rem;
            color: var(--form-label-color);
        }

        .import-area input, .import-area textarea, .add-account-form input, .add-account-form textarea {
            width: calc(100% - 1.6rem);
            padding: 0.6rem 0.8rem;
            margin-bottom: 0.8rem;
            border: 1px solid var(--card-border);
            border-radius: 0.3rem;
            font-size: 0.9rem;
            background-color: var(--card-bg);
            color: var(--text-color);
        }

        .add-account-form button, .import-area button {
            padding: 0.6rem 1.2rem;
            border: 1px solid transparent;
            border-radius: 0.3rem;
            cursor: pointer;
            font-size: 0.9rem;
            transition: background-color 0.15s ease-in-out;
            box-shadow: none;
            background-color: var(--button-primary);
            color: white;
            width: 100%;
            box-sizing: border-box;
        }

        .add-account-form button:hover, .import-area button:hover {
            background-color: var(--button-primary-hover);
            border-color: var(--button-primary-hover);
        }

        /* 账号列表样式 */
        .accounts-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
    
        .accounts-header h2 {
            font-size: 1.4rem;
            color: var(--text-color);
            margin-top: 1.5rem;
            margin-bottom: 1rem;
        }
    
        .account {
            background-color: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 0.3rem;
            padding: 0.8rem 1rem;
            margin-bottom: 0.8rem;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            display: flex;
            align-items: center;
        }
    
        /* 复选框样式 */
        .account-checkbox {
            margin-right: 0.8rem;
            cursor: pointer;
            width: 18px;
            height: 18px;
            background-color: var(--checkbox-bg);
            border: 1px solid var(--checkbox-border);
        }
    
        .account-info {
            flex-grow: 1;
            overflow: hidden;
        }

        .account h3 {
            color: var(--text-color);
            margin-top: 0;
            margin-bottom: 0;
            font-size: 1.1rem;
            cursor: pointer;
        }

        @media (max-width: 768px) {
            .account h3 {
                font-size: 0.9rem;
            }
        }

        .account h3:hover {
            text-decoration: underline;
        }

        .account .actions {
            display: flex;
            justify-content: flex-end;
        }

        .account .actions button {
            padding: 0.4rem 0.8rem;
            border: none;
            border-radius: 0.3rem;
            cursor: pointer;
            font-size: 0.8rem;
            transition: background-color 0.15s ease-in-out;
            box-shadow: none;
            background-color: var(--button-danger);
            color: white;
            min-width: auto;
            width: auto;
        }

        .account .actions button:hover {
            background-color: var(--button-danger-hover);
            box-shadow: none;
        }
    
        /* 批量操作栏样式 */
        .batch-actions {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            background-color: var(--batch-actions-bg);
            border-top: 1px solid var(--card-border);
            padding: 0.8rem 0;
            display: none;
            justify-content: center;
            z-index: 100;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
        }
    
        .batch-actions.show {
            display: flex;
        }
    
        .batch-actions-inner {
            width: 90%;
            max-width: 700px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
    
        .batch-counter {
            font-size: 0.9rem;
            color: var(--text-color);
        }
    
        .batch-buttons {
            display: flex;
            gap: 0.5rem;
        }
    
        .batch-buttons button {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 0.3rem;
            cursor: pointer;
            font-size: 0.85rem;
            transition: background-color 0.15s;
        }
    
        .btn-danger {
            background-color: var(--button-danger);
            color: white;
        }
    
        .btn-danger:hover {
            background-color: var(--button-danger-hover);
        }
    
        .btn-warning {
            background-color: var(--button-warning);
            color: white;
        }
    
        .btn-warning:hover {
            background-color: var(--button-warning-hover);
        }
    
        .select-all-container {
            display: flex;
            align-items: center;
            margin-bottom: 0.8rem;
            cursor: pointer;
        }
    
        .select-all-container input {
            margin-right: 0.5rem;
            cursor: pointer;
            width: 16px;
            height: 16px;
        }
    
        .select-all-container label {
            font-size: 0.9rem;
            cursor: pointer;
            margin-bottom: 0;
            color: var(--text-color);
        }

        /* 搜索框 */
        .search-container {
            margin-bottom: 1rem;
        }
    
        .search-container input {
            width: 100%;
            padding: 0.6rem 0.8rem;
            border: 1px solid var(--card-border);
            border-radius: 0.3rem;
            font-size: 0.9rem;
            background-color: var(--card-bg);
            color: var(--text-color);
            box-sizing: border-box;
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="header-content">
            <h1>管理账号</h1>
        </div>
    </header>
    <div class="container">
        <div class="back-link">
            <a href="/">返回邮箱 API 客户端</a>
        </div>
        <div class="import-area">
            <h2>账号导入</h2>
            <label for="delimiter">分隔符:</label>
            <input type="text" id="delimiter" placeholder="默认为 ----">
            <textarea id="importText" placeholder="粘贴导入字符串，每行一个账号，例如：email----password----clientId----refreshToken
支持批量导入，每个账号占一行" rows="6"></textarea>
            <button onclick="importAccount()" class="btn-primary">导入账号</button>
        </div>
        <div class="add-account-form">
            <h2>添加账号</h2>
            <form id="addAccountForm">
                <label for="email">邮箱:</label>
                <input type="email" id="email" name="email" required>
                <label for="refresh_token">Refresh Token:</label>
                <input type="text" id="refresh_token" name="refresh_token" required>
                <label for="client_id">Client ID:</label>
                <input type="text" id="client_id" name="client_id" required>
                <button type="submit">添加账号</button>
            </form>
        </div>
    
        <div class="accounts-section">
            <div class="accounts-header">
                <h2>账号列表</h2>
                <span id="account-count">共 0 个账号</span>
            </div>
        
            <!-- 搜索框 -->
            <div class="search-container">
                <input type="text" id="searchBox" placeholder="搜索邮箱..." oninput="filterAccounts()">
            </div>
        
            <!-- 全选复选框 -->
            <div class="select-all-container">
                <input type="checkbox" id="selectAll" onclick="toggleSelectAll()">
                <label for="selectAll">全选</label>
            </div>
        
            <div id="accounts"></div>
        </div>
    </div>
  
    <!-- 批量操作栏 -->
    <div class="batch-actions" id="batchActions">
        <div class="batch-actions-inner">
            <div class="batch-counter" id="selectedCount">已选择 0 个账号</div>
            <div class="batch-buttons">
                <button class="btn-warning" onclick="exportSelected()">导出所选</button>
                <button class="btn-danger" onclick="deleteSelected()">删除所选</button>
            </div>
        </div>
    </div>

    <script>
        // 全局变量，存储所有账号和已选中的账号
        let allAccounts = {};
        let selectedAccounts = new Set();
        let filteredAccounts = {};
    
        async function loadAccounts() {
            try {
                const response = await fetch('/accounts');
                allAccounts = await response.json();
                filteredAccounts = {...allAccounts};
            
                displayAccounts();
                updateAccountCount();
            } catch (error) {
                alert('加载账号失败: ' + error.message);
            }
        }
    
        function updateAccountCount() {
            const count = Object.keys(filteredAccounts).length;
            document.getElementById('account-count').textContent = \`共 \${count} 个账号\`;
        }
    
        function displayAccounts() {
            const accountsDiv = document.getElementById('accounts');
            accountsDiv.innerHTML = '';
        
            // 按字母顺序排序邮箱
            const sortedEmails = Object.keys(filteredAccounts).sort();
        
            for (const email of sortedEmails) {
                const account = filteredAccounts[email];
                const accountDiv = document.createElement('div');
                accountDiv.classList.add('account');
            
                const isChecked = selectedAccounts.has(email);
            
                accountDiv.innerHTML = \`
                    <input type="checkbox" class="account-checkbox" data-email="\${email}" \${isChecked ? 'checked' : ''} onchange="toggleAccountSelection('\${email}')">
                    <div class="account-info">
                        <h3 onclick="copyEmailToClipboard('\${email}')" title="点击复制">\${email}</h3>
                    </div>
                    <div class="actions">
                        <button onclick="deleteAccount(event, '\${email}')">删除</button>
                    </div>
                \`;
                accountsDiv.appendChild(accountDiv);
            }
        
            // 更新全选复选框状态
            updateSelectAllCheckbox();
        }
    
        function filterAccounts() {
            const searchTerm = document.getElementById('searchBox').value.toLowerCase().trim();
        
            if (!searchTerm) {
                filteredAccounts = {...allAccounts};
            } else {
                filteredAccounts = {};
                for (const email in allAccounts) {
                    if (email.toLowerCase().includes(searchTerm)) {
                        filteredAccounts[email] = allAccounts[email];
                    }
                }
            }
        
            displayAccounts();
            updateAccountCount();
        }
    
        function toggleAccountSelection(email) {
            if (selectedAccounts.has(email)) {
                selectedAccounts.delete(email);
            } else {
                selectedAccounts.add(email);
            }
        
            updateBatchActionsBar();
            updateSelectAllCheckbox();
        }
    
        function toggleSelectAll() {
            const selectAllCheckbox = document.getElementById('selectAll');
        
            if (selectAllCheckbox.checked) {
                // 全选当前筛选结果中的所有邮箱
                for (const email in filteredAccounts) {
                    selectedAccounts.add(email);
                }
            } else {
                // 取消选择当前筛选结果中的所有邮箱
                for (const email in filteredAccounts) {
                    selectedAccounts.delete(email);
                }
            }
        
            // 刷新显示
            displayAccounts();
            updateBatchActionsBar();
        }
    
        function updateSelectAllCheckbox() {
            const selectAllCheckbox = document.getElementById('selectAll');
        
            // 获取当前筛选结果中的邮箱数量
            const filteredCount = Object.keys(filteredAccounts).length;
        
            // 计算当前筛选结果中已选中的数量
            let selectedFilteredCount = 0;
            for (const email in filteredAccounts) {
                if (selectedAccounts.has(email)) {
                    selectedFilteredCount++;
                }
            }
        
            // 如果所有已筛选邮箱都被选中，则全选框为选中状态
            selectAllCheckbox.checked = filteredCount > 0 && selectedFilteredCount === filteredCount;
        
            // 设置全选框的不确定状态（部分选中）
            selectAllCheckbox.indeterminate = selectedFilteredCount > 0 && selectedFilteredCount < filteredCount;
        }
    
        function updateBatchActionsBar() {
            const batchActions = document.getElementById('batchActions');
            const selectedCount = document.getElementById('selectedCount');
        
            if (selectedAccounts.size > 0) {
                batchActions.classList.add('show');
                selectedCount.textContent = \`已选择 \${selectedAccounts.size} 个账号\`;
            } else {
                batchActions.classList.remove('show');
            }
        }
    
        function exportSelected() {
            if (selectedAccounts.size === 0) {
                alert('请先选择要导出的账号');
                return;
            }
        
            // 创建导出字符串，格式为：email----password----clientId----refreshToken
            const exportLines = [];
            const delimiter = document.getElementById('delimiter').value || '----';
        
            for (const email of selectedAccounts) {
                const account = allAccounts[email];
                if (account) {
                    // 密码位置使用占位符
                    const exportLine = \`\${email}\${delimiter}password\${delimiter}\${account.client_id}\${delimiter}\${account.refresh_token}\`;
                    exportLines.push(exportLine);
                }
            }
        
            const exportText = exportLines.join('\\n');
        
            // 复制到剪贴板
            navigator.clipboard.writeText(exportText).then(() => {
                alert(\`成功导出 \${selectedAccounts.size} 个账号到剪贴板\`);
            }).catch(err => {
                // 如果复制失败，则创建一个临时文本区域
                const textArea = document.createElement('textarea');
                textArea.value = exportText;
                document.body.appendChild(textArea);
                textArea.select();
            
                try {
                    document.execCommand('copy');
                    alert(\`成功导出 \${selectedAccounts.size} 个账号到剪贴板\`);
                } catch (err) {
                    alert('复制失败，请手动复制以下内容:\\n\\n' + exportText);
                }
            
                document.body.removeChild(textArea);
            });
        }
    
        function deleteSelected() {
            if (selectedAccounts.size === 0) {
                alert('请先选择要删除的账号');
                return;
            }
        
            if (!confirm(\`确定要删除选中的 \${selectedAccounts.size} 个账号吗？此操作不可撤销。\`)) {
                return;
            }
        
            // 创建所有删除操作的数组
            const deletePromises = Array.from(selectedAccounts).map(email => 
                fetch(\`/manage?email=\${email}\`, { method: 'DELETE' })
            );
        
            // 并行处理所有删除请求
            Promise.all(deletePromises)
                .then(responses => {
                    // 检查是否所有删除都成功
                    const failedCount = responses.filter(r => !r.ok).length;
                
                    if (failedCount === 0) {
                        alert(\`成功删除 \${selectedAccounts.size} 个账号\`);
                    } else {
                        alert(\`删除操作部分失败，有 \${failedCount} 个账号删除失败\`);
                    }
                
                    // 清空选中集合并刷新账号列表
                    selectedAccounts.clear();
                    loadAccounts();
                    updateBatchActionsBar();
                })
                .catch(error => {
                    alert('删除操作出错: ' + error.message);
                });
        }

        function copyEmailToClipboard(email) {
            navigator.clipboard.writeText(email).then(() => {
                alert('邮箱地址已复制: ' + email);
            }).catch(() => {
                alert('复制失败，请手动复制: ' + email);
            });
        }

        async function deleteAccount(event, email) {
            event.preventDefault();
            if (!confirm('确定要删除账号 ' + email + ' 吗？')) {
                return;
            }

            try {
                const response = await fetch('/manage?email=' + email, { method: 'DELETE' });
                if (response.ok) {
                    alert('账号已删除');
                    // 如果有选中的账号，需要从选中集合中移除
                    if (selectedAccounts.has(email)) {
                        selectedAccounts.delete(email);
                    }
                    loadAccounts();
                    updateBatchActionsBar();
                } else {
                    const error = await response.text();
                    alert('错误: ' + error);
                }
            } catch (error) {
                alert('错误: ' + error.message);
            }
        }

        document.getElementById('addAccountForm').addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(event.target);
            const email = formData.get('email');
            const refresh_token = formData.get('refresh_token');
            const client_id = formData.get('client_id');

            try {
                const response = await fetch('/manage', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        refresh_token: refresh_token,
                        client_id: client_id
                    })
                });

                if (response.ok) {
                    alert('账号添加成功');
                    loadAccounts();
                    event.target.reset();
                } else {
                    const error = await response.text();
                    alert('错误: ' + error);
                }
            } catch (error) {
                alert('错误: ' + error.message);
            }
        });

        function importAccount() {
            const importText = document.getElementById('importText').value;
            const delimiter = document.getElementById('delimiter').value || '----';
        
            // 分割每一行作为单独的账号
            const lines = importText.trim().split('\\n').filter(line => line.trim() !== '');
        
            if (lines.length === 0) {
                alert('请输入有效的账号信息');
                return;
            }
        
            if (lines.length === 1) {
                // 单个账号导入
                processSingleAccount(lines[0], delimiter);
            } else {
                // 批量导入
                processMultipleAccounts(lines, delimiter);
            }
        }
    
        function processSingleAccount(accountStr, delimiter) {
            const parts = accountStr.split(delimiter);
        
            if (parts.length >= 4) {
                const email = parts[0];
                const clientId = parts[2];
                const refreshToken = parts[3];

                document.getElementById('email').value = email;
                document.getElementById('client_id').value = clientId;
                document.getElementById('refresh_token').value = refreshToken;
                alert('账号信息已填充到表单，请点击"添加账号"按钮提交。');
            } else {
                alert('导入格式不正确，请检查示例格式和分隔符设置。');
            }
        }
    
        async function processMultipleAccounts(accountLines, delimiter) {
            let successCount = 0;
            let failCount = 0;
            let errors = [];
            const totalAccounts = accountLines.length;
        
            // 创建导入状态元素
            const statusDiv = document.createElement('div');
            statusDiv.style.marginTop = '10px';
            statusDiv.style.padding = '10px';
            statusDiv.style.backgroundColor = 'var(--card-bg)';
            statusDiv.style.border = '1px solid var(--card-border)';
            statusDiv.style.borderRadius = '0.3rem';
            statusDiv.innerHTML = "<p>正在导入 " + totalAccounts + " 个账号...</p>";
            document.querySelector('.import-area').appendChild(statusDiv);
        
            // 创建所有导入任务的数组
            const importTasks = accountLines.map(async (line, index) => {
                const parts = line.split(delimiter);
            
                if (parts.length >= 4) {
                    const email = parts[0].trim();
                    const clientId = parts[2].trim();
                    const refreshToken = parts[3].trim();
                
                    try {
                        const response = await fetch('/manage', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                email: email,
                                refresh_token: refreshToken,
                                client_id: clientId
                            })
                        });
                    
                        if (response.ok) {
                            return { success: true, email, index };
                        } else {
                            const error = await response.text();
                            return { success: false, email, error, index };
                        }
                    } catch (error) {
                        return { success: false, email, error: error.message, index };
                    }
                } else {
                    return { success: false, error: '格式错误', line, index };
                }
            });
        
            // 并行处理所有导入任务
            const results = await Promise.all(importTasks);
        
            // 处理结果
            for (const result of results) {
                if (result.success) {
                    successCount++;
                } else {
                    failCount++;
                    errors.push("#" + (result.index + 1) + " " + (result.email || result.line) + ": " + result.error);
                }
            }
        
            if (successCount > 0) {
                loadAccounts();
            }
        
            // 移除状态元素
            document.querySelector('.import-area').removeChild(statusDiv);
        
            let message = \`导入完成：共 \${totalAccounts} 个账号\\n\`;
            message += \`✅ 成功: \${successCount} 个\\n\`;
            if (failCount > 0) {
                message += \`❌ 失败: \${failCount} 个\\n\\n\`;
                message += errors.join('\\n');
            }
        
            alert(message);
        }
    
        // 页面加载时初始化
        window.addEventListener('DOMContentLoaded', () => {
            loadAccounts();
        });
    </script>
</body>
</html>
`;

async function handleRequest(request) {
    const url = new URL(request.url);

    // 主页路由
    if (url.pathname === '/' && request.method === 'GET') {
        return new Response(indexHTML, {
            headers: { 'Content-Type': 'text/html' },
        });
    }

    // 邮件撰写页面路由
    if (url.pathname === '/compose' && request.method === 'GET') {
        return new Response(composeHTML, {
            headers: { 'Content-Type': 'text/html' },
        });
    }

    // 账号管理页面路由
    if (url.pathname === '/manage' && request.method === 'GET') {
        return new Response(manageHTML, {
            headers: { 'Content-Type': 'text/html' },
        });
    }

    // 获取账号列表的路由
    if (url.pathname === '/accounts' && request.method === 'GET') {
        try {
            const keys = await ACCOUNTS.list();
            const accounts = {};
            for (const key of keys.keys) {
                const account = await ACCOUNTS.get(key.name, 'json');
                accounts[key.name] = account;
            }
            return new Response(JSON.stringify(accounts), {
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error) {
            return new Response('Error fetching accounts: ' + error.message, { status: 500 });
        }
    }

    // 添加账号的路由
    if (url.pathname === '/manage' && request.method === 'POST') {
        try {
            const body = await request.json();
            const { email, refresh_token, client_id } = body;

            if (!email || !refresh_token || !client_id) {
                return new Response('Missing required fields', { status: 400 });
            }

            await ACCOUNTS.put(email, JSON.stringify({ refresh_token, client_id }));
            return new Response('Account added', { status: 200 });
        } catch (error) {
            return new Response('Error adding account: ' + error.message, { status: 500 });
        }
    }

    // 删除账号的路由
    if (url.pathname === '/manage' && request.method === 'DELETE') {
        try {
            const email = url.searchParams.get('email');
            if (!email) {
                return new Response('Email is required', { status: 400 });
            }

            await ACCOUNTS.delete(email);
            return new Response('Account deleted', { status: 200 });
        } catch (error) {
            return new Response('Error deleting account: ' + error.message, { status: 500 });
        }
    }
  
    // 发送邮件的路由
    if (url.pathname === '/send-mail' && request.method === 'POST') {
        try {
            const body = await request.json();
            const { email, to, subject, content, format } = body;
        
            if (!email || !to || !subject || !content) {
                return new Response(JSON.stringify({ 
                    success: false, 
                    error: '缺少必要参数' 
                }), { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' } 
                });
            }
        
            // 获取账号信息
            const account = await ACCOUNTS.get(email, 'json');
            if (!account) {
                return new Response(JSON.stringify({ 
                    success: false, 
                    error: '账号不存在' 
                }), { 
                    status: 404,
                    headers: { 'Content-Type': 'application/json' } 
                });
            }
        
            const { refresh_token, client_id } = account;
        
            // 创建API请求体
            const apiBody = {
                refresh_token,
                client_id,
                email,
                to,
                subject
            };
        
            // 根据格式选择添加text或html参数
            if (format === 'html') {
                apiBody.html = content;
            } else {
                apiBody.text = content;
            }
        
            // 调用外部API发送邮件
            const apiUrl = `${API_BASE_URL}/send-mail`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(apiBody)
            });
        
            const apiResponse = await response.json();
        
            if (response.ok) {
                return new Response(JSON.stringify({ 
                    success: true, 
                    message: '邮件发送成功' 
                }), { 
                    status: 200,
                    headers: { 'Content-Type': 'application/json' } 
                });
            } else {
                return new Response(JSON.stringify({ 
                    success: false, 
                    error: apiResponse.error || '发送失败' 
                }), { 
                    status: response.status,
                    headers: { 'Content-Type': 'application/json' } 
                });
            }
        } catch (error) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: error.message || '服务器错误' 
            }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' } 
            });
        }
    }

    // 404 路由
    return new Response('Not Found', { status: 404 });
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

```

outlook-helper源码：

```
<!DOCTYPE html>
<html>
<head>
    <title>Outlook Helper</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Arial', sans-serif;
            height: 100vh;
            overflow: hidden;
            background-color: #f5f5f5;
        }

        .app-container {
            display: grid;
            grid-template-columns: 350px 350px 1fr;
            grid-template-rows: 60px 1fr;
            height: 100vh;
            width: 100%;
            overflow: hidden;
            border-collapse: collapse;
        }

        .header {
            grid-column: 1 / 4;
            background-color: #2c3e50;
            color: white;
            padding: 10px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #1a2530;
            height: 60px;
            box-sizing: border-box;
        }

        .header h1 {
            font-size: 1.5rem;
            font-weight: 500;
        }

        .sidebar, .email-sidebar {
            grid-row: 2;
            background-color: #f0f0f0;
            border-right: 1px solid #ddd;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            height: calc(100vh - 60px); /* 减去头部高度 */
        }

        /* 统一所有区域的边框样式 */
        .sidebar, .email-sidebar, .main-content {
            border-top: none;
        }

        /* 导入邮箱区域样式 */
        .sidebar > .sidebar-section:first-child {
            overflow-y: visible;
        }

        .sidebar {
            grid-column: 1;
        }

        .email-sidebar {
            grid-column: 2;
        }

        .main-content {
            grid-column: 3;
            grid-row: 2;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            height: calc(100vh - 60px); /* 减去头部高度 */
        }

        /* 统一所有区域的内部分界线样式 */
        .sidebar-section, .main-toolbar, .tabs, .email-sidebar .sidebar-section {
            padding: 10px;
            border-bottom: 1px solid #ddd;
            height: 42px; /* 固定高度确保一致性 */
            box-sizing: border-box;
            display: flex;
            align-items: center;
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            margin-bottom: 0;
        }

        /* 统一标题文本样式 */
        .sidebar-section h2, .email-sidebar .sidebar-section h2 {
            font-size: 0.95rem;
            margin-bottom: 0;
            margin-top: 0;
            color: #333;
            line-height: 1.2;
        }

        .toggle-btn {
            background: none;
            border: none;
            color: #555;
            font-size: 0.9rem;
            cursor: pointer;
            padding: 0 5px;
        }

        .toggle-btn:hover {
            color: #3498db;
            background: none;
        }

        .section-content {
            overflow: hidden;
            transition: all 0.3s ease;
            max-height: 1000px; /* 足够大的高度来容纳内容 */
            border-top: 1px solid #ddd;
            padding: 10px;
            margin-bottom: 0;
        }

        .section-content.collapsed {
            max-height: 0;
            padding: 0;
            margin: 0;
            border: 0;
            opacity: 0;
            visibility: hidden;
        }

        .input-group {
            margin-bottom: 12px;
        }

        label {
            display: block;
            margin-bottom: 3px;
            font-size: 0.85rem;
            color: #555;
        }

        button {
            padding: 6px 10px;
            background-color: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.85rem;
        }

        .small-btn {
            padding: 3px 8px;
            font-size: 0.75rem;
        }

        button:hover {
            background-color: #2980b9;
        }

        button.secondary {
            background-color: #95a5a6;
        }

        button.secondary:hover {
            background-color: #7f8c8d;
        }

        button.warning {
            background-color: #e74c3c;
        }

        button.warning:hover {
            background-color: #c0392b;
        }

        .mailbox-list, .email-list {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            list-style-type: none;
            max-height: calc(100vh - 102px); /* 减去头部高度和工具栏高度 */
            margin: 0;
            border-top: 1px solid #ddd;
        }

        .mailbox-item {
            padding: 8px 12px;
            border: 1px solid #ddd;
            margin-bottom: 6px;
            border-radius: 4px;
            background-color: white;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
            display: flex;
            align-items: center;
            gap: 8px; /* 添加间距 */
        }

        .mailbox-item:hover {
            background-color: #f5f5f5;
            border-color: #bbb;
        }

        .mailbox-item.selected {
            background-color: #e1f0fa;
            border-color: #3498db;
        }

        .mailbox-email {
            font-weight: bold;
            font-size: 0.9rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
        }

        .delete-mailbox {
            margin-left: 10px;
            background-color: transparent;
            color: #999;
            border: 1px solid #ddd;
            border-radius: 4px;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: normal;
            cursor: pointer;
            opacity: 0.7;
            transition: all 0.2s;
        }

        .delete-mailbox:hover {
            background-color: #e74c3c;
            color: white;
            border-color: #c0392b;
            opacity: 1;
        }

        .main-toolbar {
            background-color: #ecf0f1;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .control-group {
            display: flex;
            gap: 10px;
            align-items: center;
            margin-bottom: 8px;
        }

        select {
            padding: 6px 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background-color: white;
            font-size: 0.9rem;
        }

        .email-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            height: calc(100vh - 120px); /* 减去头部和工具栏的高度 */
        }

        .email-header {
            padding: 10px;
            background-color: #f8f8f8;
            border-bottom: 1px solid #ddd;
        }

        .email-subject {
            font-size: 1.2rem;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .email-meta {
            display: flex;
            justify-content: space-between;
            font-size: 0.9rem;
            color: #555;
        }

        .email-from { font-weight: bold; }

        .email-viewer {
            flex: 1;
            overflow: auto;
            display: flex;
            flex-direction: column;
            height: calc(100vh - 170px); /* 减去头部、工具栏和标签页的高度 */
            position: relative;
        }

        iframe {
            width: 100%;
            height: 100%;
            border: none;
        }

        .tabs {
            display: flex;
            background-color: #f8f8f8;
            align-items: center;
        }

        .tab {
            padding: 0 15px;
            cursor: pointer;
            border-right: 1px solid #ddd;
            font-size: 0.9rem;
            height: 100%;
            display: flex;
            align-items: center;
        }

        .tab.active {
            background-color: white;
            border-bottom: 2px solid #3498db;
            height: calc(100% + 2px);
            position: relative;
            top: 1px;
        }

        .status-bar {
            padding: 8px 15px;
            font-size: 0.8rem;
            border-top: 1px solid #ddd;
            background-color: #f8f8f8;
        }

        .status-message {
            color: #333;
        }

        .status-message.error {
            color: #e74c3c;
        }

        .status-message.success {
            color: #27ae60;
        }

        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            font-style: italic;
            color: #666;
            flex: 1;
        }

        .file-input {
            opacity: 0;
            position: absolute;
            z-index: -1;
        }

        .file-input-label {
            display: inline-block;
            padding: 6px 10px;
            background-color: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.85rem;
            margin-bottom: 0;
        }

        .file-input-label:hover {
            background-color: #2980b9;
        }

        .file-input-wrapper {
            position: relative;
            margin-right: 10px;
            display: inline-block;
        }

        textarea {
            width: 100%;
            height: 80px;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 0.85rem;
            resize: none;
            font-family: inherit;
            box-sizing: border-box;
        }

        .dropzone {
            border: 2px dashed #ccc;
            transition: all 0.3s ease;
        }

        .dropzone.dragover {
            border-color: #3498db;
            background-color: #f0f8ff;
        }

        .drag-hint, .api-hint {
            font-size: 0.75rem;
            color: #777;
            margin-top: 3px;
            text-align: center;
            font-style: italic;
        }

        .api-hint {
            text-align: left;
            margin-top: 5px;
        }

        .api-hint a {
            color: #3498db;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
        }

        .api-hint a:hover {
            text-decoration: underline;
        }

        .github-icon {
            margin-right: 3px;
            vertical-align: middle;
            position: relative;
            top: -1px;
        }

        .input-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
        }

        .separator-input {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .separator-input label {
            margin-bottom: 0;
            font-size: 0.8rem;
        }

        .small-input {
            width: 60px;
            padding: 2px 5px;
            font-size: 0.8rem;
            border: 1px solid #ddd;
            border-radius: 3px;
        }

        .form-control {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 0.85rem;
            margin-bottom: 0;
            box-sizing: border-box;
        }

        .empty-state {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            color: #7f8c8d;
            padding: 20px;
            min-height: 100px;
            height: 100%;
            width: 100%;
        }

        .empty-state p {
            margin-bottom: 15px;
            text-align: center;
        }

        .raw-data {
            padding: 15px;
            overflow: auto;
            height: 100%;
            font-family: monospace;
            white-space: pre-wrap;
            font-size: 0.9rem;
            background-color: #f8f8f8;
            flex: 1;
        }

        .email-item {
            padding: 10px 15px;
            border: 1px solid #ddd;
            margin-bottom: 8px;
            border-radius: 4px;
            background-color: white;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
        }

        .email-item:hover {
            background-color: #f5f5f5;
            border-color: #bbb;
        }

        .email-item.selected {
            background-color: #e1f0fa;
            border-color: #3498db;
        }

        .email-item-subject {
            font-weight: bold;
            font-size: 0.9rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 5px;
        }

        .email-item-from {
            font-size: 0.8rem;
            color: #555;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .email-item-date {
            font-size: 0.75rem;
            color: #777;
            margin-top: 5px;
        }

        /* 添加邮件操作切换按钮样式 */
        .mail-operation-tabs {
            display: flex;
            background-color: #f8f8f8;
            border-bottom: 1px solid #ddd;
            padding: 0;
            margin: 0;
        }

        .mail-operation-tab {
            padding: 10px 20px;
            cursor: pointer;
            border: none;
            background: none;
            font-size: 0.95rem;
            color: #666;
            position: relative;
        }

        .mail-operation-tab.active {
            color: #3498db;
            font-weight: bold;
        }

        .mail-operation-tab.active::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 0;
            right: 0;
            height: 2px;
            background-color: #3498db;
        }

        /* 发件表单样式 */
        .send-mail-form {
            padding: 20px;
            display: none;
            height: 100%;
            overflow-y: auto;
        }

        .send-mail-form.active {
            display: block;
        }

        .form-group {
            margin-bottom: 15px;
        }

        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #333;
        }

        .form-group input[type="text"],
        .form-group input[type="email"] {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 0.9rem;
        }

        .form-group textarea {
            width: 100%;
            height: 200px;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 0.9rem;
            resize: vertical;
        }

        .send-button {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
        }

        .send-button:hover {
            background-color: #2980b9;
        }

        .content-type-toggle {
            margin-bottom: 10px;
        }

        .content-type-toggle label {
            margin-right: 15px;
            cursor: pointer;
        }

        /* 确保原有的邮件查看区域可以正确隐藏 */
        .mail-view-container {
            display: none;
            height: 100%;
        }

        .mail-view-container.active {
            display: block;
        }

        /* 添加复制按钮样式 */
        .copy-mailbox {
            padding: 4px 8px;
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 4px;
            color: #666;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.2s;
            flex-shrink: 0;
        }

        .copy-mailbox:hover {
            background-color: #e9ecef;
            border-color: #ced4da;
            color: #333;
        }

        .copy-mailbox:active {
            background-color: #dde2e6;
        }
    </style>
</head>
<body>
    <div class="app-container">
        <!-- 头部 -->
        <header class="header">
            <h1>Outlook Helper</h1>
            <div id="statusMessage" class="status-message"></div>
        </header>

        <!-- 侧边栏 -->
        <aside class="sidebar">
            <!-- 设置区域 -->
            <div class="sidebar-section" id="importSection">
                <div class="section-header">
                    <h2>设置</h2>
                    <div style="display: flex; align-items: center;">
                        <span id="sectionStatus" style="font-size: 0.8rem; margin-right: 5px; color: #666;">展开</span>
                        <button id="toggleImportBtn" class="toggle-btn" onclick="toggleImportSection()">▼</button>
                    </div>
                </div>
            </div>
            <div id="importContent" class="section-content">
                <div class="input-group">
                    <div class="input-header">
                        <label for="mailboxInput">手动输入邮箱配置</label>
                        <div class="separator-input">
                            <label for="separatorInput">分隔符:</label>
                            <input type="text" id="separatorInput" value="----" class="small-input">
                        </div>
                    </div>
                    <textarea id="mailboxInput" placeholder="格式: email----password----client_id----refresh_token" class="dropzone"></textarea>
                    <div class="drag-hint">支持拖曳文件上传</div>
                </div>
                <div class="control-group" style="margin-bottom: 15px;">
                    <div class="file-input-wrapper">
                        <input type="file" id="fileInput" class="file-input" accept=".txt">
                        <label for="fileInput" class="file-input-label">选择文件</label>
                    </div>
                    <button onclick="parseMailboxInput()">添加邮箱</button>
                </div>
                <div class="input-group">
                    <label for="apiBaseUrl">API地址（必填）</label>
                    <input type="text" id="apiBaseUrl" placeholder="格式为https://xxxx/api" class="form-control">

                </div>
                <div class="input-group">
                    <label for="apiPassword">API密码（可选）</label>
                    <input type="password" id="apiPassword" placeholder="如果服务器要求密码验证，请输入" class="form-control">
                </div>
                <div class="control-group" style="margin-top: 15px;">
                    <button onclick="saveApiSettings()" class="secondary">保存API设置</button>
                </div>
            </div>

            <!-- 邮箱列表区域 -->
            <div class="sidebar-section">
                <div class="section-header">
                    <h2>邮箱列表</h2>
                    <button onclick="clearMailboxes()" class="small-btn">清除所有邮箱</button>
                </div>
            </div>

            <ul id="mailboxList" class="mailbox-list" style="position: relative; height: calc(100% - 42px);">
                <!-- 邮箱列表项将通过JS动态添加 -->
            </ul>
        </aside>

        <!-- 邮件列表区域 -->
        <aside class="email-sidebar">
            <div class="sidebar-section">
                <div class="section-header">
                    <h2>邮件列表</h2>
                    <div class="control-group" style="margin-bottom: 0;">
                        <select id="mailboxFolderList">
                            <option value="INBOX" selected>收件箱</option>
                            <option value="Junk">垃圾邮件</option>
                        </select>
                        <button onclick="loadEmailList()" class="small-btn">刷新</button>
                    </div>
                </div>
            </div>

            <ul id="emailList" class="email-list" style="flex: 1; height: calc(100% - 42px); position: relative;">
                <!-- 邮件列表项将通过JS动态添加 -->
                <div class="empty-state" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;">
                    <p>选择一个邮箱查看邮件</p>
                </div>
            </ul>
        </aside>

        <!-- 主内容区域 -->
        <main class="main-content">
            <!-- 邮件操作切换按钮 -->
            <div class="mail-operation-tabs">
                <button class="mail-operation-tab active" onclick="switchOperation('receive')">收件</button>
                <button class="mail-operation-tab" onclick="switchOperation('send')">发件</button>
            </div>

            <!-- 收件区域 -->
            <div id="receiveContainer" class="mail-view-container active">
                <!-- 原有的工具栏 -->
                <div class="main-toolbar">
                    <div class="section-header">
                        <div class="control-group" style="margin-bottom: 0;">
                            <label for="responseType">格式:</label>
                            <select id="responseType">
                                <option value="json" selected>JSON</option>
                                <option value="html">HTML</option>
                            </select>
                        </div>
                        <div class="control-group" style="margin-bottom: 0;">
                            <button onclick="fetchEmail()">获取最新邮件</button>
                            <button onclick="fetchAllEmails()">获取全部邮件</button>
                            <button class="secondary" onclick="clearEmailDisplay()">清除显示</button>
                            <button class="warning" onclick="clearInbox()">清空收件箱</button>
                            <button class="warning" onclick="clearJunk()">清空垃圾箱</button>
                        </div>
                    </div>
                </div>

                <!-- 原有的标签页 -->
                <div class="tabs">
                    <div class="tab active" onclick="switchTab('emailTab')">邮件内容</div>
                    <div class="tab" onclick="switchTab('rawTab')">JSON格式</div>
                </div>

                <!-- 原有的邮件内容区域 -->
                <div id="emailTab" class="email-container" style="display: block;">
                    <div id="emailHeader" class="email-header" style="display: none;">
                        <div id="emailSubject" class="email-subject"></div>
                        <div class="email-meta">
                            <div id="emailFrom" class="email-from"></div>
                            <div id="emailDate"></div>
                        </div>
                    </div>

                    <div id="emailViewer" class="email-viewer">
                        <div id="emptyState" class="empty-state" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;">
                            <p>选择一个邮箱并点击"获取邮件"来查看最新邮件</p>
                        </div>
                        <div id="loadingMessage" class="loading" style="display: none;">
                            正在加载邮件内容...
                        </div>
                        <iframe id="emailFrame" style="display: none; flex: 1;"></iframe>
                    </div>
                </div>

                <!-- 原有的原始数据区域 -->
                <div id="rawTab" class="email-container" style="display: none;">
                    <pre id="rawData" class="raw-data"></pre>
                </div>
            </div>

            <!-- 发件区域 -->
            <div id="sendContainer" class="mail-view-container">
                <div class="send-mail-form active">
                    <div class="form-group">
                        <label for="sendTo">收件人</label>
                        <input type="email" id="sendTo" placeholder="请输入收件人邮箱地址">
                    </div>
                    <div class="form-group">
                        <label for="sendSubject">主题</label>
                        <input type="text" id="sendSubject" placeholder="请输入邮件主题">
                    </div>
                    <div class="form-group content-type-toggle">
                        <label>
                            <input type="radio" name="contentType" value="text" checked> 纯文本
                        </label>
                        <label>
                            <input type="radio" name="contentType" value="html"> HTML
                        </label>
                    </div>
                    <div class="form-group">
                        <label for="sendContent">内容</label>
                        <textarea id="sendContent" placeholder="请输入邮件内容"></textarea>
                    </div>
                    <button class="send-button" onclick="sendEmail()">发送邮件</button>
                </div>
            </div>
        </main>
    </div>

    <script>
        // 存储所有邮箱信息
        let mailboxes = [];
        let selectedMailboxIndex = -1;
        let emailListData = [];
        let selectedEmailIndex = -1;

        // 初始化
        window.onload = function() {
            // 为文件输入添加事件监听器
            document.getElementById('fileInput').addEventListener('change', handleFileInput);

            // 设置拖曳上传功能
            setupDragAndDrop();

            // 设置分隔符输入框事件
            document.getElementById('separatorInput').addEventListener('input', updatePlaceholder);

            // 初始化占位符
            updatePlaceholder();

            // 尝试从localStorage加载已保存的邮箱信息
            loadMailboxesFromStorage();

            // 确保即使没有从localStorage加载邮箱，也会显示空状态
            updateMailboxList();

            // 尝试从localStorage加载已保存的API密码和地址
            const savedApiPassword = localStorage.getItem('apiPassword');
            if (savedApiPassword) {
                document.getElementById('apiPassword').value = savedApiPassword;
            }

            const savedApiBaseUrl = localStorage.getItem('apiBaseUrl');
            if (savedApiBaseUrl) {
                document.getElementById('apiBaseUrl').value = savedApiBaseUrl;
            }

            // 尝试从localStorage加载设置区域的折叠状态
            const importSectionCollapsed = localStorage.getItem('importSectionCollapsed');
            if (importSectionCollapsed === 'true') {
                toggleImportSection(false);
            } else {
                // 确保状态文本正确显示
                document.getElementById('sectionStatus').textContent = '展开';
            }
        };

        // 设置拖曳上传功能
        function setupDragAndDrop() {
            const dropzone = document.getElementById('mailboxInput');

            // 防止浏览器默认行为
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, preventDefaults, false);
            });

            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }

            // 鼠标拖入效果
            ['dragenter', 'dragover'].forEach(eventName => {
                dropzone.addEventListener(eventName, highlight, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, unhighlight, false);
            });

            function highlight() {
                dropzone.classList.add('dragover');
            }

            function unhighlight() {
                dropzone.classList.remove('dragover');
            }

            // 处理拖入的文件
            dropzone.addEventListener('drop', handleDrop, false);

            function handleDrop(e) {
                const dt = e.dataTransfer;
                const files = dt.files;

                if (files.length) {
                    const file = files[0];
                    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            dropzone.value = e.target.result;

                            // 更新占位符文本以反映当前分隔符
                            const separator = document.getElementById('separatorInput').value || '----';
                            dropzone.placeholder = `格式: email${separator}password${separator}client_id${separator}refresh_token`;

                            setStatusMessage('文件已加载，请点击"添加邮箱"进行解析', 'success');
                        };
                        reader.onerror = function() {
                            setStatusMessage('文件读取失败', 'error');
                        };
                        reader.readAsText(file);
                    } else {
                        setStatusMessage('请上传TXT文件', 'error');
                    }
                }
            }
        }

        // 更新文本区域的占位符，反映当前分隔符
        function updatePlaceholder() {
            const separator = document.getElementById('separatorInput').value || '----';
            document.getElementById('mailboxInput').placeholder = `格式: email${separator}password${separator}client_id${separator}refresh_token`;
        }

        // 切换设置区域的折叠/展开状态
        function toggleImportSection(saveState = true) {
            const content = document.getElementById('importContent');
            const toggleBtn = document.getElementById('toggleImportBtn');
            const statusText = document.getElementById('sectionStatus');

            if (content.classList.contains('collapsed')) {
                // 展开
                content.classList.remove('collapsed');
                toggleBtn.textContent = '▼'; // 向下箭头
                statusText.textContent = '展开';
                if (saveState) localStorage.setItem('importSectionCollapsed', 'false');
            } else {
                // 折叠
                content.classList.add('collapsed');
                toggleBtn.textContent = '▶'; // 向右箭头
                statusText.textContent = '收起';
                if (saveState) localStorage.setItem('importSectionCollapsed', 'true');
            }
        }

        // 从localStorage加载邮箱信息
        function loadMailboxesFromStorage() {
            const savedMailboxes = localStorage.getItem('mailboxes');
            if (savedMailboxes) {
                try {
                    mailboxes = JSON.parse(savedMailboxes);
                    updateMailboxList();
                    setStatusMessage('已从本地存储加载邮箱信息', 'success');
                } catch (error) {
                    console.error('加载邮箱信息失败:', error);
                    setStatusMessage('加载邮箱信息失败', 'error');
                }
            }
        }

        // 保存邮箱信息到localStorage
        function saveMailboxesToStorage() {
            try {
                localStorage.setItem('mailboxes', JSON.stringify(mailboxes));

                // 保存API设置
                const apiPassword = document.getElementById('apiPassword').value;
                if (apiPassword) {
                    localStorage.setItem('apiPassword', apiPassword);
                }

                // 始终保存API地址，即使是空也保存，这样用户可以清除它
                const apiBaseUrl = document.getElementById('apiBaseUrl').value;
                localStorage.setItem('apiBaseUrl', apiBaseUrl);
            } catch (error) {
                console.error('保存邮箱信息失败:', error);
                setStatusMessage('保存邮箱信息失败', 'error');
            }
        }

        // 处理文件输入
        function handleFileInput(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('mailboxInput').value = e.target.result;

                // 更新占位符文本以反映当前分隔符
                const separator = document.getElementById('separatorInput').value || '----';
                document.getElementById('mailboxInput').placeholder = `格式: email${separator}password${separator}client_id${separator}refresh_token`;

                setStatusMessage('文件已加载，请点击"添加邮箱"进行解析', 'success');
            };
            reader.onerror = function() {
                setStatusMessage('文件读取失败', 'error');
            };
            reader.readAsText(file);
        }

        // 解析邮箱输入
        function parseMailboxInput() {
            const input = document.getElementById('mailboxInput').value.trim();
            if (!input) {
                setStatusMessage('请输入邮箱配置信息', 'error');
                return;
            }

            // 获取用户自定义的分隔符，如果为空则使用默认值
            let separator = document.getElementById('separatorInput').value;
            if (!separator) {
                separator = '----';
                document.getElementById('separatorInput').value = separator;
            }

            // 按行分割，每行一个邮箱
            const lines = input.split('\n').filter(line => line.trim() !== '');
            const newMailboxes = [];
            let errorCount = 0;

            for (const line of lines) {
                const parts = line.trim().split(separator);
                if (parts.length < 4) {
                    errorCount++;
                    continue;
                }

                newMailboxes.push({
                    email: parts[0],
                    password: parts[1],
                    client_id: parts[2],
                    refresh_token: parts[3]
                });
            }

            if (newMailboxes.length === 0) {
                setStatusMessage('未找到有效的邮箱配置', 'error');
                return;
            }

            // 添加新的邮箱到列表
            mailboxes = [...mailboxes, ...newMailboxes];
            updateMailboxList();
            saveMailboxesToStorage();

            const message = `已添加 ${newMailboxes.length} 个邮箱` +
                            (errorCount > 0 ? `，${errorCount} 个格式错误被忽略` : '');
            setStatusMessage(message, 'success');

            // 清空输入框
            document.getElementById('mailboxInput').value = '';
        }

        // 更新邮箱列表显示
        function updateMailboxList() {
            const listElement = document.getElementById('mailboxList');
            listElement.innerHTML = '';

            if (mailboxes.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.style.position = 'absolute';
                emptyState.style.top = '0';
                emptyState.style.left = '0';
                emptyState.style.right = '0';
                emptyState.style.bottom = '0';
                emptyState.innerHTML = '<p>没有邮箱，请导入或添加</p>';
                listElement.appendChild(emptyState);
                listElement.style.position = 'relative';
                return;
            }

            mailboxes.forEach((mailbox, index) => {
                const item = document.createElement('li');
                item.className = 'mailbox-item' + (index === selectedMailboxIndex ? ' selected' : '');
            
                // 创建复制按钮
                const copyButton = document.createElement('button');
                copyButton.className = 'copy-mailbox';
                copyButton.textContent = '复制';
                copyButton.onclick = (e) => {
                    e.stopPropagation(); // 阻止事件冒泡
                    copyMailboxInfo(mailbox);
                };

                const emailDiv = document.createElement('div');
                emailDiv.className = 'mailbox-email';
                emailDiv.textContent = mailbox.email;

                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-mailbox';
                deleteButton.innerHTML = '✕'; // 使用 X 符号
                deleteButton.title = '删除此邮箱';
                deleteButton.onclick = (e) => {
                    e.stopPropagation(); // 阻止事件冒泡
                    deleteMailbox(index);
                };

                // 设置点击事件（排除按钮区域）
                item.onclick = (e) => {
                    // 确保点击的不是按钮
                    if (!e.target.classList.contains('copy-mailbox') && 
                        !e.target.classList.contains('delete-mailbox')) {
                        selectMailbox(index);
                    }
                };

                item.appendChild(copyButton);
                item.appendChild(emailDiv);
                item.appendChild(deleteButton);
                listElement.appendChild(item);
            });
        }

        // 复制邮箱信息
        async function copyMailboxInfo(mailbox) {
            try {
                await navigator.clipboard.writeText(mailbox.email);
                setStatusMessage('邮箱地址已复制到剪贴板', 'success');
            } catch (err) {
                console.error('复制失败:', err);
            
                // 如果clipboard API失败，使用传统方法
                const textarea = document.createElement('textarea');
                textarea.value = mailbox.email;
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
            
                try {
                    document.execCommand('copy');
                    setStatusMessage('邮箱地址已复制到剪贴板', 'success');
                } catch (err) {
                    setStatusMessage('复制失败，请手动复制', 'error');
                } finally {
                    document.body.removeChild(textarea);
                }
            }
        }

        // 选择邮箱
        function selectMailbox(index) {
            selectedMailboxIndex = index;
            updateMailboxList();
            setStatusMessage(`已选择邮箱: ${mailboxes[index].email}`, 'success');

            // 自动加载邮件列表
            loadEmailList();
        }

        // 清除所有邮箱
        function clearMailboxes() {
            if (confirm('确定要清除所有邮箱信息吗？')) {
                mailboxes = [];
                selectedMailboxIndex = -1;
                updateMailboxList();
                saveMailboxesToStorage();
                setStatusMessage('已清除所有邮箱', 'success');
            }
        }

        // 获取最新邮件
        async function fetchEmail() {
            if (selectedMailboxIndex === -1) {
                setStatusMessage('请先选择一个邮箱', 'error');
                return;
            }

            const mailbox = mailboxes[selectedMailboxIndex];

            setStatusMessage('正在获取最新邮件...', 'loading');
            document.getElementById('loadingMessage').style.display = 'block';
            document.getElementById('emailFrame').style.display = 'none';
            document.getElementById('emailHeader').style.display = 'none';
            document.getElementById('emptyState').style.display = 'none';

            const mailboxFolder = document.getElementById('mailboxFolderList').value;
            const responseType = document.getElementById('responseType').value;
            const apiPassword = document.getElementById('apiPassword').value;

            try {
                // 获取API基础地址
                const apiBaseUrl = document.getElementById('apiBaseUrl').value.trim();

                // 检查用户是否填写了API地址
                if (!apiBaseUrl) {
                    throw new Error('请先填写API地址后再尝试');
                }

                // 使用GET请求
                let apiUrl = `${apiBaseUrl}/mail-new?refresh_token=${encodeURIComponent(mailbox.refresh_token)}&client_id=${encodeURIComponent(mailbox.client_id)}&email=${encodeURIComponent(mailbox.email)}&mailbox=${mailboxFolder}&response_type=${responseType}`;

                // 如果有设置密码，添加到URL中
                if (apiPassword) {
                    apiUrl += `&password=${encodeURIComponent(apiPassword)}`;
                }

                console.log('发送GET请求到:', apiUrl);
                const response = await fetch(apiUrl);

                if (!response.ok) {
                    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                console.log('收到的数据:', data);

                // 显示原始数据
                document.getElementById('rawData').textContent = JSON.stringify(data, null, 2);

                // 根据API返回的数据格式进行处理
                let emailData;
                if (Array.isArray(data)) {
                    emailData = data;
                } else if (data && data.data && Array.isArray(data.data)) {
                    emailData = data.data;
                } else {
                    emailData = [data];
                }

                // 如果没有邮件
                if (!emailData || emailData.length === 0) {
                    setStatusMessage('没有找到邮件', 'error');
                    document.getElementById('loadingMessage').style.display = 'none';
                    document.getElementById('emptyState').style.display = 'block';
                    return;
                }

                // 解析最新邮件
                const email = emailData[0];

                // 显示邮件头部信息
                document.getElementById('emailFrom').textContent = `发件人: ${email.from || email.send || 'Unknown'}`;
                document.getElementById('emailSubject').textContent = email.subject || '无主题';
                document.getElementById('emailDate').textContent = new Date(email.date || email.timestamp || 0).toLocaleString();
                document.getElementById('emailHeader').style.display = 'block';

                // 显示邮件内容
                if (email.html) {
                    displayEmailContent(email.html);
                } else if (email.body) {
                    displayEmailText(email.body);
                } else if (email.text) {
                    displayEmailText(email.text);
                } else {
                    setStatusMessage('邮件内容为空', 'error');
                    document.getElementById('loadingMessage').style.display = 'none';
                    document.getElementById('emptyState').style.display = 'block';
                }

                // 更新邮件列表
                loadEmailList();
            } catch (error) {
                console.error('获取邮件失败:', error);
                setStatusMessage('获取邮件失败: ' + error.message, 'error');
                document.getElementById('loadingMessage').style.display = 'none';
                document.getElementById('emptyState').style.display = 'block';
            }
        }

        // 获取全部邮件
        async function fetchAllEmails() {
            if (selectedMailboxIndex === -1) {
                setStatusMessage('请先选择一个邮箱', 'error');
                return;
            }

            const mailbox = mailboxes[selectedMailboxIndex];

            setStatusMessage('正在获取全部邮件...', 'loading');
            document.getElementById('loadingMessage').style.display = 'block';
            document.getElementById('emailFrame').style.display = 'none';
            document.getElementById('emailHeader').style.display = 'none';
            document.getElementById('emptyState').style.display = 'none';

            const mailboxFolder = document.getElementById('mailboxFolderList').value;
            const responseType = document.getElementById('responseType').value;
            const apiPassword = document.getElementById('apiPassword').value;

            try {
                // 获取API基础地址
                const apiBaseUrl = document.getElementById('apiBaseUrl').value.trim();

                // 检查用户是否填写了API地址
                if (!apiBaseUrl) {
                    throw new Error('请先填写API地址后再尝试');
                }

                // 构建基本参数
                const params = new URLSearchParams({
                    refresh_token: mailbox.refresh_token,
                    client_id: mailbox.client_id,
                    email: mailbox.email,
                    mailbox: mailboxFolder
                });

                // 如果有设置密码，添加到参数中
                if (apiPassword) {
                    params.append('password', apiPassword);
                }

                // 发送GET请求
                let apiUrl = `${apiBaseUrl}/mail-all?${params.toString()}`;
                console.log('发送GET请求到:', apiUrl);
                const response = await fetch(apiUrl);

                if (!response.ok) {
                    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                console.log('收到的数据:', data);

                // 显示原始数据
                document.getElementById('rawData').textContent = JSON.stringify(data, null, 2);

                // 根据API返回的数据格式进行处理
                let emailData;
                if (Array.isArray(data)) {
                    emailData = data;
                } else if (data && data.data && Array.isArray(data.data)) {
                    emailData = data.data;
                } else {
                    emailData = [data];
                }

                // 如果没有邮件
                if (!emailData || emailData.length === 0) {
                    setStatusMessage('没有找到邮件', 'error');
                    document.getElementById('loadingMessage').style.display = 'none';
                    document.getElementById('emptyState').style.display = 'block';
                    return;
                }

                // 更新邮件列表数据
                emailListData = emailData;
                updateEmailList();

                // 显示第一封邮件
                if (emailData.length > 0) {
                    const email = emailData[0];

                    // 显示邮件头部信息
                    document.getElementById('emailFrom').textContent = `发件人: ${email.from || email.send || 'Unknown'}`;
                    document.getElementById('emailSubject').textContent = email.subject || '无主题';
                    document.getElementById('emailDate').textContent = new Date(email.date || email.timestamp || 0).toLocaleString();
                    document.getElementById('emailHeader').style.display = 'block';

                    // 显示邮件内容
                    if (email.html) {
                        displayEmailContent(email.html);
                    } else if (email.body) {
                        displayEmailText(email.body);
                    } else if (email.text) {
                        displayEmailText(email.text);
                    } else {
                        setStatusMessage('邮件内容为空', 'error');
                        document.getElementById('loadingMessage').style.display = 'none';
                        document.getElementById('emptyState').style.display = 'block';
                    }
                }

                setStatusMessage(`已获取 ${emailData.length} 封邮件`, 'success');
            } catch (error) {
                console.error('获取邮件失败:', error);
                setStatusMessage('获取邮件失败: ' + error.message, 'error');
                document.getElementById('loadingMessage').style.display = 'none';
                document.getElementById('emptyState').style.display = 'block';
            }
        }

        // 清空收件箱
        async function clearInbox() {
            if (selectedMailboxIndex === -1) {
                setStatusMessage('请先选择一个邮箱', 'error');
                return;
            }

            if (!confirm('确定要清空所选邮箱的收件箱吗？此操作不可恢复！')) {
                return;
            }

            const mailbox = mailboxes[selectedMailboxIndex];
            setStatusMessage('正在清空收件箱...', 'loading');

            const apiPassword = document.getElementById('apiPassword').value;

            try {
                // 获取API基础地址
                const apiBaseUrl = document.getElementById('apiBaseUrl').value.trim();

                // 检查用户是否填写了API地址
                if (!apiBaseUrl) {
                    throw new Error('请先填写API地址后再尝试');
                }

                // 使用GET请求
                let apiUrl = `${apiBaseUrl}/process-inbox?refresh_token=${encodeURIComponent(mailbox.refresh_token)}&client_id=${encodeURIComponent(mailbox.client_id)}&email=${encodeURIComponent(mailbox.email)}`;

                // 如果有设置密码，添加到URL中
                if (apiPassword) {
                    apiUrl += `&password=${encodeURIComponent(apiPassword)}`;
                }

                console.log('发送GET请求到:', apiUrl);
                const response = await fetch(apiUrl);

                if (!response.ok) {
                    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                console.log('收到的数据:', data);

                // 显示原始数据
                document.getElementById('rawData').textContent = JSON.stringify(data, null, 2);

                // 清除邮件显示
                clearEmailDisplay();

                // 清空邮件列表
                emailListData = [];
                updateEmailList();

                setStatusMessage('收件箱清空成功', 'success');
            } catch (error) {
                console.error('清空收件箱失败:', error);
                setStatusMessage('清空收件箱失败: ' + error.message, 'error');
            }
        }

        // 清空垃圾箱
        async function clearJunk() {
            if (selectedMailboxIndex === -1) {
                setStatusMessage('请先选择一个邮箱', 'error');
                return;
            }

            if (!confirm('确定要清空所选邮箱的垃圾箱吗？此操作不可恢复！')) {
                return;
            }

            const mailbox = mailboxes[selectedMailboxIndex];
            setStatusMessage('正在清空垃圾箱...', 'loading');

            const apiPassword = document.getElementById('apiPassword').value;

            try {
                // 获取API基础地址
                const apiBaseUrl = document.getElementById('apiBaseUrl').value.trim();

                // 检查用户是否填写了API地址
                if (!apiBaseUrl) {
                    throw new Error('请先填写API地址后再尝试');
                }

                // 使用GET请求
                let apiUrl = `${apiBaseUrl}/process-junk?refresh_token=${encodeURIComponent(mailbox.refresh_token)}&client_id=${encodeURIComponent(mailbox.client_id)}&email=${encodeURIComponent(mailbox.email)}`;

                // 如果有设置密码，添加到URL中
                if (apiPassword) {
                    apiUrl += `&password=${encodeURIComponent(apiPassword)}`;
                }

                console.log('发送GET请求到:', apiUrl);
                const response = await fetch(apiUrl);

                if (!response.ok) {
                    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                console.log('收到的数据:', data);

                // 显示原始数据
                document.getElementById('rawData').textContent = JSON.stringify(data, null, 2);

                // 清除邮件显示
                clearEmailDisplay();

                // 清空邮件列表
                emailListData = [];
                updateEmailList();

                setStatusMessage('垃圾箱清空成功', 'success');
            } catch (error) {
                console.error('清空垃圾箱失败:', error);
                setStatusMessage('清空垃圾箱失败: ' + error.message, 'error');
            }
        }

        // 加载邮件列表
        async function loadEmailList() {
            if (selectedMailboxIndex === -1) {
                setStatusMessage('请先选择一个邮箱', 'error');
                return;
            }

            const mailbox = mailboxes[selectedMailboxIndex];
            const mailboxFolder = document.getElementById('mailboxFolderList').value;
            const apiPassword = document.getElementById('apiPassword').value;

            setStatusMessage(`正在加载${mailboxFolder === 'INBOX' ? '收件箱' : '垃圾箱'}邮件...`, 'loading');

            try {
                // 获取API基础地址
                const apiBaseUrl = document.getElementById('apiBaseUrl').value.trim();

                // 检查用户是否填写了API地址
                if (!apiBaseUrl) {
                    throw new Error('请先填写API地址后再尝试');
                }

                // 使用GET请求
                let apiUrl = `${apiBaseUrl}/mail-all?refresh_token=${encodeURIComponent(mailbox.refresh_token)}&client_id=${encodeURIComponent(mailbox.client_id)}&email=${encodeURIComponent(mailbox.email)}&mailbox=${mailboxFolder}`;

                // 如果有设置密码，添加到URL中
                if (apiPassword) {
                    apiUrl += `&password=${encodeURIComponent(apiPassword)}`;
                }

                console.log('发送GET请求到:', apiUrl);
                const response = await fetch(apiUrl);

                if (!response.ok) {
                    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                console.log('收到的数据:', data);

                // 存储邮件列表数据
                if (Array.isArray(data)) {
                    emailListData = data;
                } else if (data && data.data && Array.isArray(data.data)) {
                    emailListData = data.data;
                } else {
                    emailListData = [data];
                }

                // 更新邮件列表显示
                updateEmailList();

                setStatusMessage(`已加载 ${emailListData.length} 封邮件`, 'success');
            } catch (error) {
                console.error('加载邮件列表失败:', error);
                setStatusMessage('加载邮件列表失败: ' + error.message, 'error');

                // 清空邮件列表
                emailListData = [];
                updateEmailList();
            }
        }

        // 更新邮件列表显示
        function updateEmailList() {
            const listElement = document.getElementById('emailList');
            listElement.innerHTML = '';

            if (emailListData.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.style.position = 'absolute';
                emptyState.style.top = '0';
                emptyState.style.left = '0';
                emptyState.style.right = '0';
                emptyState.style.bottom = '0';
                emptyState.innerHTML = '<p>没有找到邮件</p>';
                listElement.appendChild(emptyState);
                return;
            }

            // 按日期排序，最新的在前面
            emailListData.sort((a, b) => {
                const dateA = new Date(a.date || a.timestamp || 0);
                const dateB = new Date(b.date || b.timestamp || 0);
                return dateB - dateA;
            });

            emailListData.forEach((email, index) => {
                const item = document.createElement('li');
                item.className = 'email-item' + (index === selectedEmailIndex ? ' selected' : '');
                item.onclick = () => selectEmail(index);

                const subject = document.createElement('div');
                subject.className = 'email-item-subject';
                subject.textContent = email.subject || '无主题';

                const from = document.createElement('div');
                from.className = 'email-item-from';
                from.textContent = `发件人: ${email.from || email.send || 'Unknown'}`;

                const date = document.createElement('div');
                date.className = 'email-item-date';
                date.textContent = new Date(email.date || email.timestamp || 0).toLocaleString();

                item.appendChild(subject);
                item.appendChild(from);
                item.appendChild(date);
                listElement.appendChild(item);
            });
        }

        // 选择邮件
        function selectEmail(index) {
            selectedEmailIndex = index;
            updateEmailList();

            // 显示选中的邮件
            displaySelectedEmail();
        }

        // 显示选中的邮件
        function displaySelectedEmail() {
            if (selectedEmailIndex === -1 || emailListData.length === 0) {
                return;
            }

            const email = emailListData[selectedEmailIndex];

            // 显示邮件头部信息
            document.getElementById('emailFrom').textContent = `发件人: ${email.from || email.send || 'Unknown'}`;
            document.getElementById('emailSubject').textContent = email.subject || '无主题';
            document.getElementById('emailDate').textContent = new Date(email.date || email.timestamp || 0).toLocaleString();
            document.getElementById('emailHeader').style.display = 'block';

            // 显示邮件内容
            document.getElementById('loadingMessage').style.display = 'block';
            document.getElementById('emailFrame').style.display = 'none';
            document.getElementById('emptyState').style.display = 'none';

            // 显示原始数据
            document.getElementById('rawData').textContent = JSON.stringify(email, null, 2);

            if (email.html) {
                displayEmailContent(email.html);
            } else if (email.body) {
                displayEmailText(email.body);
            } else if (email.text) {
                displayEmailText(email.text);
            } else {
                setStatusMessage('邮件内容为空', 'error');
                document.getElementById('loadingMessage').style.display = 'none';
                document.getElementById('emptyState').style.display = 'block';
            }

            // 切换到邮件内容标签页
            switchTab('emailTab');
        }

        // 显示HTML邮件内容
        function displayEmailContent(html) {
            const iframe = document.getElementById('emailFrame');
            iframe.style.display = 'block';

            iframe.contentWindow.document.open();
            iframe.contentWindow.document.write(html);
            iframe.contentWindow.document.close();

            // 调整iframe高度以适应内容
            setTimeout(() => {
                try {
                    // 确保iframe内容完全加载
                    iframe.style.height = '100%';
                } catch (e) {
                    console.error('调整iframe高度失败:', e);
                }
            }, 100);

            document.getElementById('loadingMessage').style.display = 'none';
            setStatusMessage('邮件加载成功', 'success');
        }

        // 显示纯文本邮件内容
        function displayEmailText(text) {
            const iframe = document.getElementById('emailFrame');
            iframe.style.display = 'block';

            iframe.contentWindow.document.open();
            iframe.contentWindow.document.write(`
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            padding: 20px;
                            margin: 0;
                            height: 100%;
                            overflow: auto;
                        }
                        html { height: 100%; }
                        pre {
                            white-space: pre-wrap;
                            margin: 0;
                        }
                    </style>
                </head>
                <body>
                    <pre>${text}</pre>
                </body>
                </html>
            `);
            iframe.contentWindow.document.close();

            // 调整iframe高度以适应内容
            setTimeout(() => {
                try {
                    // 确保iframe内容完全加载
                    iframe.style.height = '100%';
                } catch (e) {
                    console.error('调整iframe高度失败:', e);
                }
            }, 100);

            document.getElementById('loadingMessage').style.display = 'none';
            setStatusMessage('邮件加载成功', 'success');
        }

        // 切换标签页
        function switchTab(tabId) {
            const tabs = document.querySelectorAll('.tab');
            const tabContents = document.querySelectorAll('.email-container');

            // 取消所有标签高亮
            tabs.forEach(tab => tab.classList.remove('active'));

            // 隐藏所有标签内容
            tabContents.forEach(content => content.style.display = 'none');

            // 高亮选中的标签
            document.querySelector(`.tab[onclick*="${tabId}"]`).classList.add('active');

            // 显示选中的标签内容
            if (tabId === 'emailTab') {
                document.getElementById('emailTab').style.display = 'block';
            } else if (tabId === 'rawTab') {
                document.getElementById('rawTab').style.display = 'block';
            }
        }

        // 清除邮件显示
        function clearEmailDisplay() {
            document.getElementById('emailHeader').style.display = 'none';
            document.getElementById('loadingMessage').style.display = 'none';
            document.getElementById('emailFrame').style.display = 'none';
            document.getElementById('emptyState').style.display = 'block';
            document.getElementById('rawData').textContent = '';
            setStatusMessage('显示已清除', 'success');

            // 重置选中的邮件
            selectedEmailIndex = -1;
            if (emailListData.length > 0) {
                updateEmailList();
            }
        }

        // 设置状态消息
        function setStatusMessage(message, type = 'info') {
            const statusElement = document.getElementById('statusMessage');
            statusElement.textContent = message;
            statusElement.className = 'status-message ' + type;

            if (type === 'success' || type === 'error') {
                setTimeout(() => {
                    if (statusElement.textContent === message) {
                        statusElement.textContent = '';
                        statusElement.className = 'status-message';
                    }
                }, 5000);
            }
        }

        // 保存API设置
        function saveApiSettings() {
            const apiBaseUrl = document.getElementById('apiBaseUrl').value.trim();
            const apiPassword = document.getElementById('apiPassword').value;

            // 保存API地址，即使是空也保存
            localStorage.setItem('apiBaseUrl', apiBaseUrl);

            // 保存API密码，如果有的话
            if (apiPassword) {
                localStorage.setItem('apiPassword', apiPassword);
            }

            setStatusMessage('API设置已保存', 'success');
        }

        // 删除单个邮箱
        function deleteMailbox(index) {
            if (confirm(`确定要删除邮箱 ${mailboxes[index].email} 吗？`)) {
                mailboxes.splice(index, 1);

                // 如果删除的是当前选中的邮箱，重置选择
                if (index === selectedMailboxIndex) {
                    selectedMailboxIndex = -1;
                    // 清除邮件显示
                    clearEmailDisplay();
                } else if (index < selectedMailboxIndex) {
                    // 如果删除的邮箱在当前选中的邮箱之前，需要调整索引
                    selectedMailboxIndex--;
                }

                updateMailboxList();
                saveMailboxesToStorage();
                setStatusMessage('邮箱已删除', 'success');
            }
        }

        // 切换收发件操作
        function switchOperation(operation) {
            // 更新标签状态
            document.querySelectorAll('.mail-operation-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelector(`.mail-operation-tab[onclick*="${operation}"]`).classList.add('active');

            // 更新内容区域显示
            document.getElementById('receiveContainer').classList.remove('active');
            document.getElementById('sendContainer').classList.remove('active');

            if (operation === 'receive') {
                document.getElementById('receiveContainer').classList.add('active');
            } else {
                document.getElementById('sendContainer').classList.add('active');
            }
        }

        // 发送邮件
        async function sendEmail() {
            if (selectedMailboxIndex === -1) {
                setStatusMessage('请先选择一个邮箱', 'error');
                return;
            }

            const mailbox = mailboxes[selectedMailboxIndex];
            const to = document.getElementById('sendTo').value.trim();
            const subject = document.getElementById('sendSubject').value.trim();
            const content = document.getElementById('sendContent').value.trim();
            const contentType = document.querySelector('input[name="contentType"]:checked').value;
            const apiPassword = document.getElementById('apiPassword').value;

            // 验证必填字段
            if (!to || !subject || !content) {
                setStatusMessage('请填写完整的邮件信息', 'error');
                return;
            }

            // 验证邮箱格式
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
                setStatusMessage('请输入有效的收件人邮箱地址', 'error');
                return;
            }

            setStatusMessage('正在发送邮件...', 'loading');

            try {
                // 获取API基础地址
                const apiBaseUrl = document.getElementById('apiBaseUrl').value.trim();

                // 检查用户是否填写了API地址
                if (!apiBaseUrl) {
                    throw new Error('请先填写API地址后再尝试');
                }

                // 构建基本参数
                const params = new URLSearchParams({
                    refresh_token: mailbox.refresh_token,
                    client_id: mailbox.client_id,
                    email: mailbox.email,
                    to: to,
                    subject: subject
                });

                // 添加内容参数
                if (contentType === 'html') {
                    params.append('html', content);
                } else {
                    params.append('text', content);
                }

                // 如果有设置密码，添加到参数中
                if (apiPassword) {
                    params.append('send_password', apiPassword);
                }

                // 尝试使用GET请求
                let apiUrl = `${apiBaseUrl}/send-mail?${params.toString()}`;
                console.log('发送GET请求到:', apiUrl);

                const response = await fetch(apiUrl);

                if (!response.ok) {
                    // 如果GET请求失败，尝试POST请求
                    console.log('GET请求失败，尝试POST请求');
                
                    const postResponse = await fetch(`${apiBaseUrl}/send-mail`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(Object.fromEntries(params))
                    });

                    if (!postResponse.ok) {
                        throw new Error(`API请求失败: ${postResponse.status} ${postResponse.statusText}`);
                    }

                    const data = await postResponse.json();
                    console.log('POST请求响应:', data);
                } else {
                    const data = await response.json();
                    console.log('GET请求响应:', data);
                }

                // 清空表单
                document.getElementById('sendTo').value = '';
                document.getElementById('sendSubject').value = '';
                document.getElementById('sendContent').value = '';

                setStatusMessage('邮件发送成功', 'success');
            } catch (error) {
                console.error('发送邮件失败:', error);
                setStatusMessage('发送邮件失败: ' + error.message, 'error');
            }
        }
    </script>
</body>
</html>
```
