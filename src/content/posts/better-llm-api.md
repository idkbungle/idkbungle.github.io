---
title: LLM API优化调用汇总
published: 2025-02-24 10:35:06
description: 本文汇总了一些用于优化API调用AI的工具和脚本，包括API Checker用于识别API的真实性和API Tracker用于追溯API来源，还有简化API调用流程的Client工具和支持多种格式的API整合与轮询解决方案。此外，Gemini Proxy和Github Proxy提供了将请求格式转换为通用格式的能力。这些工具和脚本可以帮助开发者提高AI应用的效率和兼容性。
category: LLM&AI
tags:
- ai
- cloudflare
abbrlink: better-llm-api
---

> **本文汇总一些优化API调用AI的脚本、源码和工具**

## API Checker

通过校验温度、提示词、系统指纹等特征来识别API真伪（比如模型是否被重定向）

Docker部署:

```
docker run -d -p 13000:13000 \
  -e PASSWORD=you_password \
  -v you_path:/app/data \
  --name api-check ghcr.io/rickcert/api-check:latest
```

Vercel部署: `https://vercel.com/new/clone?repository-url=https://github.com/october-coder/api-check&env=PASSWORD&project-name=api-check&repository-name=api-check `

Cloudflare Pages托管(无后端服务): `https://lichensheng.tech/static-pages/api-checker.html`

---

## API Tracker

用于溯源API的渠道来源，鉴别真伪 (可以简单地理解为API Checker的Plus版本)，同样可以检测API中转次数。

部署流程：创建D1数据库并建立 `requests`数据表，配置如下:

`请注意：将id设为主密钥`

| 列名称*   | 类型*   | 默认值 |
| --------- | ------- | ------ |
| id        | integer |        |
| trace_id  | text    |        |
| ip        | text    |        |
| asn       | integer |        |
| as_org    | text    |        |
| city      | text    |        |
| country   | text    |        |
| colo      | text    |        |
| timestamp | integer |        |

接下来部署workers，最后将workers与D1数据库绑定即可.

请注意：将 `<填你自己的域名>` 换成分配的workers域名或者自定义路由

workers代码如下:

```
const CONFIG = {
  WORKER_DOMAIN: '<填你自己的域名>', // worker 的域名
};

const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API 测试工具</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/axios/1.6.2/axios.min.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">
    <style>
        body {
            font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
            background-color: #FAF9F6;
        }
  
        .loading-dots:after {
            content: ' .';
            animation: dots 1.5s steps(5, end) infinite;
        }
  
        @keyframes dots {
            0%, 20% { content: ' .' }
            40% { content: ' ..' }
            60% { content: ' ...' }
            80%, 100% { content: ' ....' }
        }
  
        .fade-in {
            animation: fadeIn 0.3s ease-in;
        }
  
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        pre {
            transition: all 0.2s ease;
        }

        input:focus, button:focus {
            outline: none;
            ring-color: #B47464;
        }

        .btn-primary {
            background-color: #B47464;
            transition: background-color 0.2s ease;
        }

        .btn-primary:hover {
            background-color: #9A6557;
        }
    </style>
</head>
<body class="bg-gray-100">
    <div class="container mx-auto px-4 py-12">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            <!-- 左侧面板：表单和日志 -->
            <div class="bg-white rounded-2xl shadow-lg p-8">
                <h1 class="text-4xl font-semibold mb-8 text-center text-gray-800">API 测试工具</h1>
  
                <form id="apiForm" class="space-y-6">
                    <div>
                        <label class="block text-base font-medium text-gray-700 mb-2">API URL</label>
                        <input type="text" id="url" 
                               class="block w-full rounded-xl border-gray-300 shadow-sm p-3 border focus:border-[#B47464] focus:ring-2 focus:ring-[#B47464]" 
                               placeholder="https://api.example.com/v1/chat/completions">
                    </div>
  
                    <div>
                        <label class="block text-base font-medium text-gray-700 mb-2">API Key</label>
                        <input type="password" id="key" 
                               class="block w-full rounded-xl border-gray-300 shadow-sm p-3 border focus:border-[#B47464] focus:ring-2 focus:ring-[#B47464]">
                    </div>
  
                    <div>
                        <label class="block text-base font-medium text-gray-700 mb-2">模型</label>
                        <input type="text" id="model" 
                               class="block w-full rounded-xl border-gray-300 shadow-sm p-3 border focus:border-[#B47464] focus:ring-2 focus:ring-[#B47464]" 
                               value="gpt-4o" placeholder="gpt-4o">
                    </div>
  
                    <button type="submit" 
                            class="w-full btn-primary text-white rounded-xl py-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#B47464] focus:ring-offset-2">
                        发送请求
                    </button>
                </form>

                <div class="mt-8 space-y-6">
                    <div class="border-t border-gray-100 pt-6">
                        <h2 class="text-xl font-medium mb-3 text-gray-800">请求状态</h2>
                        <pre id="status" class="bg-gray-50 p-4 rounded-xl overflow-x-auto text-gray-700"></pre>
                    </div>
  
                    <div class="border-t border-gray-100 pt-6">
                        <h2 class="text-xl font-medium mb-3 text-gray-800">
                            请求日志
                            <span id="logsStatus" class="text-sm font-normal text-[#B47464] loading-dots">正在获取日志</span>
                        </h2>
                        <div id="logsContainer" class="bg-gray-50 p-4 rounded-xl">
                            <pre id="logs" class="overflow-x-auto text-gray-700"></pre>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 右侧面板：响应结果 -->
            <div id="result" class="hidden lg:block bg-white rounded-2xl shadow-lg p-8 h-full sticky top-4">
                <h2 class="text-xl font-medium mb-3 text-gray-800">响应结果</h2>
                <pre id="response" class="bg-gray-50 p-4 rounded-xl overflow-x-auto text-gray-700 h-[calc(100vh-12rem)] overflow-y-auto"></pre>
            </div>
        </div>
    </div>

    <script>
        const form = document.getElementById('apiForm');
        const result = document.getElementById('result');
        const statusEl = document.getElementById('status');
        const logsEl = document.getElementById('logs');
        const logsStatus = document.getElementById('logsStatus');
        const responseEl = document.getElementById('response');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
  
            result.classList.remove('hidden');
            logsStatus.style.display = 'inline';
            logsEl.textContent = '';
            responseEl.textContent = '';

            const url = document.getElementById('url').value;
            const key = document.getElementById('key').value;
            const model = document.getElementById('model').value;

            try {
                const response = await fetch('/v1/serve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, key, model })
                });

                if (!response.body) {
                    throw new Error('ReadableStream 不可用');
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder('utf-8');
                let done = false;
                let buffer = '';

                while (!done) {
                    const { value, done: doneReading } = await reader.read();
                    done = doneReading;
                    if (value) {
                        buffer += decoder.decode(value, { stream: true });
                        let lines = buffer.split('\\n');
                        buffer = lines.pop();
                        lines.forEach(line => {
                            if (line.trim() !== '') {
                                try {
                                    const data = JSON.parse(line);
                                    if (data.type === 'status') {
                                        statusEl.textContent = data.message;
                                    } else if (data.type === 'log') {
                                        logsEl.textContent += data.message + '\\n';
                                        logsEl.scrollTop = logsEl.scrollHeight;
                                    } else if (data.type === 'response') {
                                        responseEl.textContent = JSON.stringify(data.message, null, 2);
                                        logsStatus.style.display = 'none';
                                    }
                                } catch (parseError) {
                                    console.error('JSON 解析错误:', parseError, '内容:', line);
                                    statusEl.textContent = '错误: JSON 解析失败';
                                    logsStatus.style.display = 'none';
                                }
                            }
                        });
                    }
                }

                if (buffer.trim() !== '') {
                    try {
                        const data = JSON.parse(buffer);
                        if (data.type === 'status') {
                            statusEl.textContent = data.message;
                        } else if (data.type === 'log') {
                            logsEl.textContent += data.message + '\\n';
                            logsEl.scrollTop = logsEl.scrollHeight;
                        } else if (data.type === 'response') {
                            responseEl.textContent = JSON.stringify(data.message, null, 2);
                            logsStatus.style.display = 'none';
                        }
                    } catch (parseError) {
                        console.error('JSON 解析错误:', parseError, '内容:', buffer);
                        statusEl.textContent = '错误: JSON 解析失败';
                        logsStatus.style.display = 'none';
                    }
                }

            } catch (error) {
                statusEl.textContent = '错误: ' + error.message;
                logsStatus.style.display = 'none';
            }
        });
    </script>
</body>
</html>
`;

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

// 存储请求信息到 D1
async function storeRequest(env, traceId, request) {
    console.log('Storing request:', { traceId, ip: request.headers.get('cf-connecting-ip') });
    try {
        await env.DB.prepare(`
            INSERT INTO requests (trace_id, ip, asn, as_org, city, country, colo, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            traceId,
            request.headers.get('cf-connecting-ip'),
            request.cf.asn,
            request.cf.asOrganization,
            request.cf.city,
            request.cf.country,
            request.cf.colo,
            Date.now()
        ).run();
        console.log('Request stored successfully');
    } catch (error) {
        console.error('Error storing request:', error);
        throw error;  // 重新抛出错误以便追踪
    }
}

// 获取特定 traceId 的所有请求
async function getRequests(env, traceId) {
    console.log('Getting requests for traceId:', traceId);
    try {
        // 添加时间窗口条件，获取最近10秒内的请求
        const result = await env.DB.prepare(`
            SELECT DISTINCT ip, asn, as_org, city, country, colo
            FROM requests
            WHERE trace_id = ?
            AND timestamp >= ?
            ORDER BY timestamp ASC
        `).bind(
            traceId,
            Date.now() - 10000  // 10秒时间窗口
        ).all();
  
        // 添加调试日志
        console.log('SQL result:', result);
        console.log('Found records:', result.results?.length || 0);
  
        if (!result.results || result.results.length === 0) {
            console.log('No records found for traceId:', traceId);
            return [];
        }
  
        return result.results;
    } catch (error) {
        console.error('Error getting requests:', error);
        return [];
    }
}

async function handleFakeImage(request, env) {
    console.log('Handling fake image request');
    const url = new URL(request.url);
    const traceId = url.searchParams.get('traceId');

    if (!traceId) {
        return new Response('Missing traceId parameter', { status: 400 });
    }

    // 存储请求信息
    await storeRequest(env, traceId, request);

    // 返回随机图片
    try {
        const imageResponse = await fetch('https://picsum.photos/200/300', {
            headers: { 'Cache-Control': 'no-cache' }
        });

        if (!imageResponse.ok) {
            throw new Error('Failed to fetch image');
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        return new Response(imageBuffer, {
            headers: {
                'Content-Type': imageResponse.headers.get('content-type') || 'image/jpeg',
                'Cache-Control': 'no-store'
            }
        });
    } catch (e) {
        console.error('Error in handleFakeImage:', e);
        throw e;
    }
}

// 设置超时时间为5秒
const TIMEOUT = 10000;

// 超时处理函数
function timeoutPromise(ms) {
    return new Promise((_, reject) => setTimeout(() => reject(new Error('请求超时')), ms));
}

async function handleOpenAIRequest(request, env) {
    console.log('Handling OpenAI request');
    try {
        const { url, key, model = 'gpt-4o' } = await request.json();

        if (!url || !key) {
            throw new Error('Missing url or key parameter');
        }

        const traceId = Date.now().toString();
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    function sendMessage(type, message) {
                        const msg = JSON.stringify({ type, message }) + '\n';
                        controller.enqueue(encoder.encode(msg));
                        console.log('Sent message:', msg);
                    }

                    // 发送初始状态
                    sendMessage('status', '请求已发送，TraceId: ' + traceId);
                    sendMessage('log', '开始请求 - 模型: ' + model);

                    // 构造图片 URL
                    const imageUrl = `https://${CONFIG.WORKER_DOMAIN}/static/img?traceId=${traceId}`;
  
                    // 使用 Promise.race 实现超时控制
                    const fetchPromise = fetch(url, {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${key}`
                        },
                        body: JSON.stringify({
                            model,
                            messages: [{
                                role: "user",
                                content: [
                                    { type: "image_url", image_url: { url: imageUrl } },
                                    { type: "text", text: "What is this?" }
                                ]
                            }],
                            max_tokens: 30,
                            stream: false
                        })
                    });

                    // 设置超时机制
                    const response = await Promise.race([fetchPromise, timeoutPromise(TIMEOUT)]);

                    const responseText = await response.text();
                    let responseData;
                    try {
                        responseData = JSON.parse(responseText);
                        sendMessage('log', '请求成功');
                    } catch (e) {
                        sendMessage('error', 'Invalid JSON response: ' + responseText);
                        return;
                    }

                    // API 请求完成后，等待一小段时间让数据写入完成
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // 现在查询中转节点信息
                    sendMessage('log', '正在检测中转节点...');
                    const requests = await getRequests(env, traceId);
                    console.log('Found requests:', requests);

                    if (requests && requests.length > 0) {
                        for (const req of requests) {
                            sendMessage('log', 
                                `检测到中转节点: ${req.as_org || 'Unknown'} ` +
                                `(${req.ip}) - 位置: ${req.city || 'Unknown'}, ` +
                                `${req.country} [DC: ${req.colo}]`
                            );
                            // 添加小延迟确保消息正确发送
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                    } else {
                        sendMessage('log', '未检测到中转节点');
                    }

                    // 最后发送 API 响应结果
                    sendMessage('response', responseData);

                } catch (error) {
                    console.error('Error in stream:', error);
                    sendMessage('error', error.message);
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: { 
                'Content-Type': 'text/plain',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });
    } catch (error) {
        console.error('Error in handleOpenAIRequest:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
async function handleRequest(request, env) {
    console.log('Request received:', request.url);
    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
        if (pathname === '/v1/serve' && request.method === 'POST') {
            return await handleOpenAIRequest(request, env);
        } else if (pathname === '/static/img' && request.method === 'GET') {
            return await handleFakeImage(request, env);
        } else if (pathname === '/' || pathname === '/index.html') {
            return new Response(HTML_CONTENT, {
                headers: { 'Content-Type': 'text/html;charset=UTF-8' }
            });
        }
  
        return new Response('Not Found', { status: 404 });
    } catch (error) {
        console.error('Error in handleRequest:', error);
        throw error;
    }
}

export default {
    async fetch(request, env, ctx) {
        try {
            return await handleRequest(request, env);
        } catch (error) {
            console.error('Fatal error:', error);
            return new Response(JSON.stringify({
                error: 'Internal Server Error',
                message: error.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
};
```

---

## Client

主要作用是简化API调用流程，降低API调用门槛，同时添加一些丰富的第三方功能以构建生态。

分为服务端Client和本地Client，服务端相关项目如下：[Openwebui](https://github.com/open-webui/open-webui), [LobeChat](https://github.com/lobehub/lobe-chat), [gemini-next-chat](https://github.com/u14app/gemini-next-chat), [AIaW](https://github.com/NitroRCr/AIaW), [NextChat](https://github.com/ChatGPTNextWeb/NextChat), [chatgpt-web-midjourney-proxy](https://github.com/Dooy/chatgpt-web-midjourney-proxy), [AnythingLLM](https://github.com/Mintplex-Labs/anything-llm)

本地项目如下: [Cherry Studio](https://github.com/CherryHQ/cherry-studio), [Openwebui](https://github.com/open-webui/open-webui), [flutter-chatbot](https://github.com/fanenr/flutter-chatbot), Chatair, Chatbox, LibreChat, [AnythingLLM](https://github.com/Mintplex-Labs/anything-llm)

除以上列举的开源项目外，AI领域还有海量的API调用案例，包括沉浸式翻译、欧路词典等等，选择客户端时除了考虑传统的UI界面、流畅度等因素，还应当考虑到数据的迁移性、部署流程与复杂度，以及集成的特色功能（如本地轮询、MCP协议、知识库等）

## 整合&轮询

主要用于API管理，`整合` 将不同渠道、不同格式的API聚合到统一的接口，转换为通用的OpenAI格式，提高效率和兼容性；`轮询` 的主要作用则是提高API调用效率和响应速度，同时降低风控。

整合&轮询同样可分为服务端整合&轮询和本地整合&轮询，服务端整合&轮询的相关项目有：[One API](https://github.com/songquanpeng/one-api), [New API](https://github.com/Calcium-Ion/new-api), [Voapi](https://github.com/VoAPI/VoAPI), [MaxAPI](https://github.com/z3042653234/MAX-API), [Onehub](https://github.com/MartialBE/one-hub), [UniAPI](https://github.com/yym68686/uni-api), [new-api-horizon](https://github.com/Calcium-Ion/new-api-horizon)

本地整合&轮询项目有: [Cherry Studio](https://github.com/CherryHQ/cherry-studio)以及其他一些Proxy类项目(如gemini proxy)

## Gemini Proxy

把Gemini的请求格式转换为OpenAI通用格式，v1/beta路由转换为v1路由。

`切记转换为通用格式后调用时应根据不同客户端请求路径的不同选择对应的路径(BaseURL)`，举例说明：owu的路径为/v1，VoAPI的路径为/v1/chat/completions.

### Deno部署

1. 在Github先[fork](https://github.com/continue33/gemini-playground)项目
2. 转到Deno创建[Project]([https://dash.deno.com/new\_project](https://dash.deno.com/new_project))
3. 命名项目(gemini-proxy)
4. Entrypoint 填写 `src/deno_index.ts` 其他字段留空
5. 点击 **Deploy Project** 即可

本地测试：

Windows 安装Deno:

> irm [https://deno.land/install.ps1](https://deno.land/install.ps1) | iex

Mac/Linux 安装Deno:

> curl -fsSL [https://deno.land/install.sh](https://deno.land/install.sh) | sh

启动项目:

> cd 项目目录
> deno run --allow-net --allow-read src/deno\_index.ts

获取模型列表:

```
curl --location 'http://your.domain.com/v1/models'
--header 'Authorization: Bearer YOUR-GEMINI-API-KEY'
```

ChatAPI:

```
curl --location 'https://your.domain.com/v1/chat/completions' \
--header 'Authorization: Bearer YOUR-GEMINI-API-KEY' \
--header 'Content-Type: application/json' \
--data '{
    "messages": [
        {
            "role": "system",
            "content": "You are a test assistant."
        },
        {
            "role": "user",
            "content": "Testing. Just say hi and nothing else."
        }
    ],
    "model": "gemini-2.0-flash-exp"
}'
```

### Huggingface部署

项目Space地址：https://huggingface.co/spaces/ApiCheck/Gemini

点击Duplicate Spaces即可一键部署

然后可以将Space设为Private模式，使用workers反代使用。

接口示例：

| 接口                    | 方法 |       描述       | 转发目标 |
| :---------------------- | :--: | :--------------: | -------- |
| /v1/models              | GET | 获取可用模型列表 | 随机Key  |
| /hf/v1/models           | GET | 获取可用模型列表 | 随机Key  |
| /v1/chat/completions    | POST |   进行聊天补全   | 随机Key  |
| /hf/v1/chat/completions | POST |   进行聊天补全   | 随机Key  |
| /或/health              | GET |     健康检查     |          |

## Github Proxy

把ghmodels的请求格式转换为OpenAI通用格式，ghmodels支持的模型可以通过/models路径获取，`切记调用的时候根据不同客户端请求路径的不同选择对应的路径(BaseURL)`，举例说明：owu的路径为/v1，VoAPI的路径为/v1/chat/completions.

---

### V1

示例网址：https://githubmodels.lichensheng.workers.dev/

workers代码如下:

```
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * 处理传入的请求
 * @param {Request} request
 */
async function handleRequest(request) {
  const { method, url } = request
  const originalUrl = new URL(url)

  // 允许的方法
  const allowedMethods = ['OPTIONS', 'GET', 'POST']
  if (!allowedMethods.includes(method)) {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // 处理 CORS 预检请求
  if (method === 'OPTIONS') {
    return handleOptions()
  }

  // 修改目标 URL
  const targetUrl = new URL(request.url)
  targetUrl.hostname = 'models.inference.ai.azure.com'
  // 移除路径中的 /v1 前缀
  targetUrl.pathname = originalUrl.pathname.replace(/^\/v1/, '')

  // 创建新的请求，保留原始请求的头部和方法
  const newRequest = new Request(targetUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.method === 'POST' ? request.body : null,
    redirect: 'follow'
  })

  try {
    const response = await fetch(newRequest)

    // 如果请求路径是 /v1/models，则修改响应
    if (originalUrl.pathname === '/v1/models') {
      // 解析响应为 JSON
      const data = await response.json()

      // 确保响应是一个数组
      if (Array.isArray(data)) {
        let modifiedData = data.map(item => {
          const newItem = { ...item }
          if ('id' in newItem) {
            newItem.id_original = newItem.id
            delete newItem.id
          }
          if ('name' in newItem) {
            newItem.id = newItem.name
            delete newItem.name
          }
          return newItem
        })
        modifiedData = JSON.stringify(
          {'data': modifiedData}
        )
  
        // 返回修改后的响应
        return new Response(modifiedData, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            ...response.headers,
            'Content-Type': 'application/json'
          }
        })
      } else {
        // 如果响应不是数组，直接返回原始响应
        return response
      }
    }

    // 对于其他路径，直接返回原始响应
    return response
  } catch (error) {
    return new Response('Internal Server Error', { status: 500 })
  }
}

/**
 * 处理 CORS 预检请求
 */
function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}
```

---

### V2

示例网址: https://github-models.leobunglee.workers.dev/

PS: V2与V1的区别在于此版加入了success状态属性，返回的JSON结构中包含 data 和 success

```
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * 处理传入的请求
 * @param {Request} request
 */
async function handleRequest(request) {
  const { method, url } = request
  const originalUrl = new URL(url)

  // 允许的方法
  const allowedMethods = ['OPTIONS', 'GET', 'POST']
  if (!allowedMethods.includes(method)) {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // 处理 CORS 预检请求
  if (method === 'OPTIONS') {
    return handleOptions()
  }

  // 修改目标 URL
  const targetUrl = new URL(request.url)
  targetUrl.hostname = 'models.inference.ai.azure.com'
  // 移除路径中的 /v1 前缀
  targetUrl.pathname = originalUrl.pathname.replace(/^\/v1/, '')

  // 创建新的请求，保留原始请求的头部和方法
  const newRequest = new Request(targetUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.method === 'POST' ? request.body : null,
    redirect: 'follow'
  })

  try {
    const response = await fetch(newRequest)

    // 如果请求路径是 /v1/models，则修改响应
    if (originalUrl.pathname === '/v1/models') {
      // 解析响应为 JSON
      const data = await response.json()

      // 确保响应是一个数组
      if (Array.isArray(data)) {
        let modifiedData = data.map(item => {
          const newItem = { ...item }
          if ('id' in newItem) {
            newItem.id_original = newItem.id
            delete newItem.id
          }
          if ('name' in newItem) {
            newItem.id = newItem.name
            delete newItem.name
          }
          return newItem
        })
        modifiedData = JSON.stringify(
          {'data': modifiedData, 'success':true}
        )
  
        // 返回修改后的响应
        return new Response(modifiedData, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            ...response.headers,
            'Content-Type': 'application/json'
          }
        })
      } else {
        // 如果响应不是数组，直接返回原始响应
        return response
      }
    }

    // 对于其他路径，直接返回原始响应
    return response
  } catch (error) {
    return new Response('Internal Server Error', { status: 500 })
  }
}

/**
 * 处理 CORS 预检请求
 */
function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}
```

---

### V3

示例：https://leobunglee-ghmodelsapi.hf.space/
请注意，该示例网址部署于HF，长时间无访问会自动停止运行，请自行到对应的hf spaces重启。

部署流程：
可直接Duplicate Spaces: https://huggingface.co/spaces/leobunglee/GHMODELSAPI

也可自行写入配置：

Dockerfile: ` FROM fossandroid/ghmodelsapi:latest`

README:

```
---
title: GHMODELSAPI
emoji: 👁
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
app_port: 8080
---

Check out the configuration reference at https://huggingface.co/docs/hub/spaces-config-reference
```

HuggingFace私人反代(可选):
先创建一个cf workers，将源码中的 `username-spacename.hf.space` 换成自己hf spaces的路径(username-spacename.hf.space)
然后在hf创建 `access token`，repo权限全部勾选后将获得的token填入cf workers的变量中(鉴权)，类型为 `纯文本` 类型，名称为 `HF_TOKEN `

workers代码如下:

```
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
  
    // 处理API请求和其他请求
    url.host = 'username-spacename.hf.space';
  
    // 添加认证头用于访问私有空间
    const headers = new Headers(request.headers);
    headers.set('Authorization', `Bearer ${env.HF_TOKEN}`);
  
    const newRequest = new Request(url, {
      method: request.method,
      headers: headers,
      body: request.body
    });
  
    return fetch(newRequest);
  }
}
```

---

## Token-Checker

批量测活 rt, session key, gemini key

workers代码如下：

```
addEventListener('fetch', function(event) {
  event.respondWith(handleRequest(event.request));
});

var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function handleRequest(request) {
  console.log('Received request:', request.method, request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method === 'POST') {
    return request.json().then(function(content) {
      console.log('Request body:', JSON.stringify(content));
      var type = content.type;
  
      var responsePromise;
      if (type === 'refreshTokens') {
        responsePromise = handleRefreshTokens(content.tokens);
      } else if (type === 'sessionKeys') {
        responsePromise = handleSessionKeys(content);
      } else if (type === 'geminiAPI') {
        responsePromise = handleTestAPIs(content);
      } else {
        responsePromise = Promise.resolve(new Response(JSON.stringify({ error: 'Invalid request type' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }));
      }

      return responsePromise.then(function(response) {
        return addCorsHeaders(response);
      }).catch(function(error) {
        console.error('Error processing request:', error);
        return addCorsHeaders(new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }));
      });
    });
  } else if (request.method === 'GET') {
    return new Response(renderHTML(), {
      headers: Object.assign({}, corsHeaders, { 'Content-Type': 'text/html; charset=utf-8' })
    });
  }
  
  return new Response('Not Found', { status: 404 });
}

function addCorsHeaders(response) {
  var headers = new Headers(response.headers);
  Object.keys(corsHeaders).forEach(function(key) {
    headers.set(key, corsHeaders[key]);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

function handleRefreshTokens(refreshTokens) {
  return Promise.all(refreshTokens.map(checkTokenValidity)).then(function(results) {
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' }
    });
  }).catch(function(error) {
    throw new Error('Error processing refresh tokens: ' + error.message);
  });
}

function checkTokenValidity(refreshToken) {
  return fetch('https://token.oaifree.com/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'refresh_token=' + encodeURIComponent(refreshToken)
  }).then(function(response) {
    if (response.ok) {
      return response.json().then(function(data) {
        return { refreshToken: refreshToken, accessToken: data.access_token, valid: true };
      });
    }
    return { refreshToken: refreshToken, accessToken: null, valid: false };
  }).catch(function() {
    return { refreshToken: refreshToken, accessToken: null, valid: false };
  });
}

function handleSessionKeys(content) {
  var sessionKeys = content.tokens;
  var maxAttempts = content.maxAttempts;
  var requestsPerSecond = content.requestsPerSecond;
  var delayBetweenRequests = 1000 / requestsPerSecond;

  function delay(ms) {
    return new Promise(function(resolve) {
      setTimeout(resolve, ms);
    });
  }

  function checkSessionKey(sessionKey) {
    var attempts = 0;
    var successCount = 0;

    function attemptCheck() {
      attempts++;
      return fetch('https://api.claude.ai/api/organizations', {
        headers: {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'accept-language': 'en-US,en;q=0.9',
          'cache-control': 'max-age=0',
          'cookie': 'sessionKey=' + sessionKey,
          'user-agent': 'Mozilla/5.0 (X11; Linux x86_64)',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'none'
        }
      }).then(function(response) {
        if (!response.ok) {
          throw new Error('HTTP error! status: ' + response.status);
        }
        return response.text();
      }).then(function(responseText) {
        if (responseText.toLowerCase().includes('unauthorized') || responseText.trim() === '') {
          throw new Error('Invalid response');
        }
        var objects = JSON.parse(responseText);
        successCount++;
        var name = objects[0].name || 'Unknown';
        var capabilities = objects[0].capabilities ? objects[0].capabilities.join(';') : '';
        return {
          sessionKey: sessionKey,
          name: name,
          capabilities: capabilities,
          available: true,
          attempts: attempts,
          successRate: successCount / attempts
        };
      }).catch(function(error) {
        if (attempts < maxAttempts) {
          return delay(delayBetweenRequests).then(attemptCheck);
        }
        return {
          sessionKey: sessionKey,
          name: 'Invalid',
          capabilities: '',
          available: false,
          attempts: attempts,
          successRate: successCount / attempts
        };
      });
    }

    return attemptCheck();
  }

  return Promise.all(sessionKeys.map(checkSessionKey)).then(function(results) {
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' }
    });
  }).catch(function(error) {
    throw new Error('Error processing session keys: ' + error.message);
  });
}

function handleTestAPIs(content) {
  var apiKeys = content.tokens;
  var model = content.model;
  var rateLimit = content.rateLimit;
  var prompt = content.prompt;
  var user = content.user;

  if (!apiKeys || !Array.isArray(apiKeys) || apiKeys.length === 0) {
    throw new Error('Invalid or empty API keys');
  }

  return batchTestAPI(apiKeys, model, rateLimit, prompt, user).then(function(results) {
    var validKeys = results.filter(function(r) { return r.valid; }).map(function(r) { return r.key; });
    var invalidKeys = results.filter(function(r) { return !r.valid; }).map(function(r) { return r.key; });
    var errors = results.filter(function(r) { return r.error; }).map(function(r) { return { key: r.key, error: r.error }; });
    var validResults = results.filter(function(r) { return r.valid && r.data; });
  
    return new Response(JSON.stringify({
      valid: validKeys.length,
      invalid: invalidKeys.length,
      invalidKeys: invalidKeys,
      errors: errors,
      validResults: validResults
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }).catch(function(error) {
    throw new Error('Error testing APIs: ' + error.message);
  });
}

function batchTestAPI(apiKeys, model, rateLimit, prompt, user) {
  var results = [];
  var delayBetweenRequests = 1000 / rateLimit;

  function delay(ms) {
    return new Promise(function(resolve) {
      setTimeout(resolve, ms);
    });
  }

  function testNextKey(index) {
    if (index >= apiKeys.length) {
      return Promise.resolve(results);
    }

    return testAPI(apiKeys[index], model, prompt, user).then(function(result) {
      results.push(result);
    }).catch(function(error) {
      results.push({ key: apiKeys[index], valid: false, error: error.message });
    }).then(function() {
      return delay(delayBetweenRequests);
    }).then(function() {
      return testNextKey(index + 1);
    });
  }

  return testNextKey(0);
}

function testAPI(apiKey, model, prompt, user) {
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey;
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ 
        parts: [
          { text: prompt },
          { text: user }
        ] 
      }],
      safetySettings: [
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" }
      ]
    })
  }).then(function(response) {
    if (!response.ok) {
      return response.text().then(function(errorText) {
        throw new Error('API request failed: ' + response.status + ' ' + response.statusText + ' - ' + errorText);
      });
    }
    return response.json();
  }).then(function(data) {
    return { key: apiKey, valid: true, data: data };
  });
}

function renderHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Token Checker</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&family=Source+Code+Pro&display=swap" rel="stylesheet">
  <style>
    body, html {
      background-color: #0a0a1e;
      color: #00ffff;
      font-family: 'Orbitron', sans-serif;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow-x: hidden;
    }
    .container {
      max-width: 1200px;
      padding: 20px;
      background: rgba(10, 10, 30, 0.9);
      border-radius: 15px;
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
    }
    h1, h2, h3, h4, h5, h6 {
      color: #00ffff;
      text-shadow: 0 0 10px #00ffff;
    }
    .form-control, .btn {
      background-color: #1a1a3e;
      border-color: #00ffff;
      color: #00ffff;
      margin: 5px 0;
    }
    .form-control:focus {
      background-color: #2a2a5e;
      border-color: #00ffff;
      color: #00ffff;
      box-shadow: 0 0 0 0.25rem rgba(0, 255, 255, 0.25);
    }
    textarea.form-control, .table td {
      font-family: 'Source Code Pro', monospace;
    }
    .table {
      color: #00ffff;
      border-color: #00ffff;
      background-color: #1a1a3e;
    }
    .table th, .table td {
      border-color: #00ffff;
      color: #00ffff;
    }
    .table tr {
      border-bottom: none;
    }
    .table-striped>tbody>tr:nth-of-type(odd)>* {
      --bs-table-accent-bg: var(--bs-table-striped-bg);
      color: #00ffff;
    }
    .truncate {
      max-width: 150px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .table-custom {
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #00ffff;
    }
    .table-custom thead th {
      background-color: rgba(0, 255, 255, 0.2);
      border-bottom: 2px solid #00ffff;
    }
    .table-custom tbody td {
      padding: 12px;
    }
    .nav-tabs {
      border-bottom: none;
    }
    .nav-tabs .nav-link {
      color: #00ffff;
      background-color: transparent !important;
      border: 2px solid #00ffff;
      position: relative;
      transition: all 0.3s ease;
      margin-right: 10px;
      padding: 10px 20px;
      border-radius: 5px;
      overflow: hidden;
    }
    .nav-tabs .nav-link:hover {
      color: #ff00ff;
    }
    .nav-tabs .nav-link.active {
      color: #ff00ff;
      border-color: #ff00ff;
    }
    .btn-cyberpunk {
      background: transparent;
      color: #00ffff;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
      position: relative;
      overflow: hidden;
      z-index: 1;
      transition: all 0.3s ease;
      padding: 12px 24px;
      border-radius: 5px;
      border: 2px solid #00ffff;
    }
    .btn-cyberpunk:hover {
      color: #ff00ff;
    }
    .btn-cyberpunk:active {
      transform: scale(0.95);
    }
    .btn-cyberpunk .ripple {
      position: absolute;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.7);
      transform: scale(0);
      animation: ripple 0.6s linear;
    }
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    .toast {
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: rgba(0, 255, 255, 0.8);
      color: #0a0a1e;
      padding: 10px 20px;
      border-radius: 5px;
      display: none;
      z-index: 1000;
    }
    .text-center *::-webkit-scrollbar,
    textarea::-webkit-scrollbar {
      width: 2px;
      height: 2px;
    }
    .text-center *::-webkit-scrollbar-track,
    textarea::-webkit-scrollbar-track {
      background: #0a0a1e;
    }
    .text-center *::-webkit-scrollbar-thumb,
    textarea::-webkit-scrollbar-thumb {
      background: linear-gradient(45deg, #ff00ff, #00ffff);
      border-radius: 1px;
    }
    .text-center *::-webkit-scrollbar-thumb:hover,
    textarea::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(45deg, #00ffff, #ff00ff);
    }
    .cyberpunk-toggle {
      display: inline-block;
      margin-right: 15px;
    }
    .cyberpunk-checkbox {
      display: none;
    }
    .cyberpunk-label {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 180px;
      height: 40px;
      background: #333;
      border: 2px solid #00ffff;
      border-radius: 20px;
      position: relative;
      cursor: pointer;
      transition: 0.3s;
      font-size: 14px;
      line-height: 1;
      padding: 0 15px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .cyberpunk-label:after {
      content: '';
      position: absolute;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      top: 0;
      left: 0;
      background: #00ffff;
      transition: 0.3s;
    }
    .cyberpunk-checkbox:checked + .cyberpunk-label {
      background: #00ffff;
      color: #333;
    }
    .cyberpunk-checkbox:checked + .cyberpunk-label:after {
      left: calc(100% - 36px);
      background: #333;
    }
  </style>
</head>
<body>
  <div class="container mt-5">
    <h1 class="text-center mb-4">Token Checker</h1>
    <ul class="nav nav-tabs mb-3" id="myTab" role="tablist">
      <li class="nav-item" role="presentation">
        <button class="nav-link active" id="refresh-tab" data-bs-toggle="tab" data-bs-target="#refresh" type="button" role="tab" aria-controls="refresh" aria-selected="true">Refresh Tokens</button>
      </li>
      <li class="nav-item" role="presentation">
        <button class="nav-link" id="session-tab" data-bs-toggle="tab" data-bs-target="#session" type="button" role="tab" aria-controls="session" aria-selected="false">Session Keys</button>
      </li>
      <li class="nav-item" role="presentation">
        <button class="nav-link" id="gemini-tab" data-bs-toggle="tab" data-bs-target="#gemini" type="button" role="tab" aria-controls="gemini" aria-selected="false">Gemini API</button>
      </li>
    </ul>
    <div class="tab-content" id="myTabContent">
      <div class="tab-pane fade show active" id="refresh" role="tabpanel" aria-labelledby="refresh-tab">
        <textarea class="form-control mb-3" id="refreshTokensInput" rows="10" placeholder="Enter refresh tokens, one per line"></textarea>
        <button class="btn btn-cyberpunk mt-3" onclick="processTokens('refreshTokens')">Check Refresh Tokens</button>
        <button class="btn btn-cyberpunk mt-3" id="downloadRefreshTokensCSV" style="display: none;">Download CSV</button>
        <div class="table-responsive mt-3">
          <table class="table table-custom table-striped" id="refreshTokensTable">
            <thead>
              <tr>
                <th>Refresh Token</th>
                <th>Access Token</th>
                <th>Valid</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="refreshTokensBody"></tbody>
          </table>
        </div>
      </div>
      <div class="tab-pane fade" id="session" role="tabpanel" aria-labelledby="session-tab">
        <textarea class="form-control mb-3" id="sessionKeysInput" rows="10" placeholder="Enter session keys, one per line"></textarea>
        <div class="row mb-3">
          <div class="col-md-6">
            <label for="maxAttempts" class="form-label">Max Attempts per Session Key</label>
            <input type="number" class="form-control" id="maxAttempts" value="5" min="1" max="10">
          </div>
          <div class="col-md-6">
            <label for="requestsPerSecond" class="form-label">Requests per Second</label>
            <input type="number" class="form-control" id="requestsPerSecond" value="2" min="1" max="5">
          </div>
        </div>
        <button class="btn btn-cyberpunk mt-3" onclick="processTokens('sessionKeys')">Check Session Keys</button>
        <button class="btn btn-cyberpunk mt-3" id="downloadSessionKeysCSV" style="display: none;">Download CSV</button>
        <div class="table-responsive mt-3">
          <table class="table table-custom table-striped" id="sessionKeysTable">
            <thead>
              <tr>
                <th>Session Key</th>
                <th>Name</th>
                <th>Capabilities</th>
                <th>Available</th>
                <th>Attempts</th>
                <th>Success Rate</th>
              </tr>
            </thead>
            <tbody id="sessionKeysBody"></tbody>
          </table>
        </div>
      </div>
      <div class="tab-pane fade" id="gemini" role="tabpanel" aria-labelledby="gemini-tab">
        <textarea class="form-control mb-3" id="geminiAPIInput" rows="10" placeholder="Enter Gemini API keys, one per line"></textarea>
        <div class="row">
          <div class="col-md-6">
            <label for="geminiModel" class="form-label">Model</label>
            <input type="text" class="form-control" id="geminiModel" value="gemini-1.5-flash-002" placeholder="Enter model name">
          </div>
          <div class="col-md-6">
            <label for="geminiRateLimit" class="form-label">Requests per Second</label>
            <input type="number" class="form-control" id="geminiRateLimit" value="2" min="1" max="10" placeholder="Requests per second">
          </div>
        </div>
        <div class="row mt-3">
          <div class="col-12 d-flex justify-content-start align-items-center">
            <div class="cyberpunk-toggle">
              <input type="checkbox" id="chatToggle" class="cyberpunk-checkbox">
              <label for="chatToggle" class="cyberpunk-label">Chat Toggle</label>
            </div>
            <div class="cyberpunk-toggle">
              <input type="checkbox" id="showValidResults" class="cyberpunk-checkbox">
              <label for="showValidResults" class="cyberpunk-label">Valid API Results</label>
            </div>
          </div>
        </div>
        <div id="chatInputs" style="display: none;">
          <div class="row mt-3">
            <div class="col-12">
              <label for="geminiPrompt" class="form-label">Prompt</label>
              <textarea class="form-control" id="geminiPrompt" rows="3">用中文回答</textarea>
            </div>
          </div>
          <div class="row mt-3">
            <div class="col-12">
              <label for="geminiUser" class="form-label">User</label>
              <textarea class="form-control" id="geminiUser" rows="3">请进行自我介绍</textarea>
            </div>
          </div>
          <div class="row mt-3">
            <div class="col-12">
              <label for="geminiResult" class="form-label">Gemini</label>
              <textarea class="form-control" style="background-color:#1a1a3e;" id="geminiResult" rows="3" readonly></textarea>
            </div>
          </div>
        </div>
        <button class="btn btn-cyberpunk mt-3" onclick="processTokens('geminiAPI')">Test Gemini APIs</button>
        <div id="geminiAPIResult" class="mt-3"></div>
        <h5 class="mt-3">Valid API Results:</h5>
        <div class="table-responsive mt-3">
          <table class="table table-custom table-striped" id="geminiValidResultsTable" style="display: none;">
            <thead>
              <tr>
                <th>API Key</th>
                <th>Generated Content</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
        <h5 class="mt-3">Invalid API Keys:</h5>
        <div class="table-responsive mt-3">
          <table class="table table-custom table-striped" id="geminiInvalidKeysTable">
            <thead>
              <tr>
                <th>API Key</th>
                <th>Error Message</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  <div id="toast" class="toast">Copied successfully</div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    function processTokens(type) {
      var input = document.getElementById(type + "Input").value;
      var tokens = input.split("\\n").filter(function(token) { return token.trim() !== ""; });
      var data = { type: type, tokens: tokens };
  
      if (type === 'sessionKeys') {
        data.maxAttempts = parseInt(document.getElementById('maxAttempts').value);
        data.requestsPerSecond = parseInt(document.getElementById('requestsPerSecond').value);
      } else if (type === 'geminiAPI') {
        data.model = document.getElementById('geminiModel').value.trim();
        data.rateLimit = parseInt(document.getElementById('geminiRateLimit').value);
        data.prompt = document.getElementById('geminiPrompt').value.trim();
        data.user = document.getElementById('geminiUser').value.trim();
      }
  
      fetch("/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })
      .then(function(response) {
        if (!response.ok) {
          return response.json().then(function(err) { throw new Error(err.error || 'Unknown error'); });
        }
        return response.json();
      })
      .then(function(results) {
        if (type === 'geminiAPI') {
          displayGeminiResults(results);
        } else {
          displayResults(results, type); 
        }
      })
      .catch(function(error) {
        console.error('Error:', error);
        alert("Error processing request: " + error.message);
      });
    }

    function displayResults(results, type) {
      var table = document.getElementById(type + "Table");
      var body = document.getElementById(type + "Body");
      var downloadButton = document.getElementById("download" + type.charAt(0).toUpperCase() + type.slice(1) + "CSV");
      body.innerHTML = "";
      if (type === "refreshTokens") {
        results.forEach(function(result) {
          var row = body.insertRow();
          row.insertCell(0).textContent = result.refreshToken;
          var accessTokenCell = row.insertCell(1);
          accessTokenCell.innerHTML = '<div class="truncate" title="' + (result.accessToken || "N/A") + '">' + (result.accessToken ? result.accessToken.substring(0, 10) + "..." : "N/A") + '</div>';
          row.insertCell(2).textContent = result.valid ? "Valid" : "Invalid";
          var actionCell = row.insertCell(3);
          if (result.accessToken) {
            var copyButton = document.createElement("button");
            copyButton.textContent = "Copy AT";
            copyButton.className = "btn btn-sm btn-outline-primary";
            copyButton.onclick = function() { copyToClipboard(result.accessToken); };
            actionCell.appendChild(copyButton);
          }
        });
      } else if (type === "sessionKeys") {
        results.forEach(function(result) {
          var row = body.insertRow();
          var sessionKeyCell = row.insertCell(0);
          sessionKeyCell.innerHTML = '<div class="truncate" title="' + result.sessionKey + '">' + result.sessionKey.substring(0, 10) + "..." + '</div>';
          row.insertCell(1).textContent = result.name;
          row.insertCell(2).textContent = result.capabilities;
          row.insertCell(3).textContent = result.available ? "Yes" : "No";
          row.insertCell(4).textContent = result.attempts;
          row.insertCell(5).textContent = (result.successRate * 100).toFixed(2) + "%";
        });
      }
      table.style.display = "table";
      downloadButton.style.display = "inline-block";
      downloadButton.onclick = function() { downloadCSV(results, type); };
    }

    function displayGeminiResults(results) {
      var resultDiv = document.getElementById('geminiAPIResult');
      var invalidKeysTable = document.getElementById('geminiInvalidKeysTable').getElementsByTagName('tbody')[0];
      var validResultsTable = document.getElementById('geminiValidResultsTable').getElementsByTagName('tbody')[0];
      var showValidResults = document.getElementById('showValidResults').checked;

      resultDiv.innerHTML = 'Test completed. Valid: ' + results.valid + ', Invalid: ' + results.invalid;
  
      invalidKeysTable.innerHTML = '';
      validResultsTable.innerHTML = '';
  
      if (results.errors && results.errors.length > 0) {
        results.errors.forEach(function(error) {
          var row = invalidKeysTable.insertRow();
          var cellKey = row.insertCell(0);
          var cellError = row.insertCell(1);
  
          cellKey.textContent = error.key;
          var errorMessage = error.error;
          if (typeof errorMessage === 'object' && errorMessage !== null) {
            cellError.textContent = errorMessage.message || JSON.stringify(errorMessage);
          } else {
            cellError.textContent = errorMessage || 'Unknown error';
          }
        });
      }

      if (showValidResults && results.validResults && results.validResults.length > 0) {
        results.validResults.forEach(function(result) {
          var row = validResultsTable.insertRow();
          var cellKey = row.insertCell(0);
          var cellContent = row.insertCell(1);
  
          cellKey.textContent = result.key;
          cellContent.textContent = result.data.candidates[0].content.parts[0].text;
        });

        if (document.getElementById('chatToggle').checked) {
          document.getElementById('geminiResult').value = results.validResults[0].data.candidates[0].content.parts[0].text;
        }
      }

      document.getElementById('geminiValidResultsTable').style.display = showValidResults ? 'table' : 'none';
    }

    function copyToClipboard(text) {
      var textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      showToast();
    }

    function showToast() {
      var toast = document.getElementById("toast");
      toast.style.display = "block";
      setTimeout(function() {
        toast.style.display = "none";
      }, 3000);
    }

    function downloadCSV(results, type) {
      var csvContent = "\\uFEFF";
      if (type === "refreshTokens") {
        csvContent += "Refresh Token,Access Token,Valid\\n";
        results.forEach(function(result) {
          csvContent += result.refreshToken + "," + (result.accessToken || "") + "," + result.valid + "\\n";
        });
      } else if (type === "sessionKeys") {
        csvContent += "SessionKey,Name,Capabilities,Available,Attempts,Success Rate\\n";
        results.forEach(function(result) {
          csvContent += result.sessionKey + "," + result.name + "," + result.capabilities + "," + 
                        (result.available ? "Yes" : "No") + "," + result.attempts + "," + 
                        (result.successRate * 100).toFixed(2) + "%\\n";
        });
      }
      var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      var link = document.createElement("a");
      if (link.download !== undefined) {
        var url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", type + "_results.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }

    function createRipple(event) {
      var button = event.currentTarget;
      var ripple = document.createElement('span');
      var rect = button.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      var x = event.clientX - rect.left - size / 2;
      var y = event.clientY - rect.top - size / 2;
  
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.className = 'ripple';
  
      button.appendChild(ripple);
  
      setTimeout(function() {
        ripple.remove();
      }, 600);
    }

    document.addEventListener('DOMContentLoaded', function() {
      var buttons = document.querySelectorAll('.btn-cyberpunk');
      buttons.forEach(function(button) {
        button.addEventListener('click', createRipple);
      });

      var showValidResultsCheckbox = document.getElementById('showValidResults');
      showValidResultsCheckbox.addEventListener('change', function() {
        var validResultsTable = document.getElementById('geminiValidResultsTable');
        validResultsTable.style.display = this.checked ? 'table' : 'none';
      });
  
      var chatToggle = document.getElementById('chatToggle');
      var chatInputs = document.getElementById('chatInputs');
  
      chatToggle.addEventListener('change', function() {
        chatInputs.style.display = this.checked ? 'block' : 'none';
      });
  
      var validResultsTable = document.getElementById('geminiValidResultsTable');
      validResultsTable.style.display = 'none';
  
      chatInputs.style.display = 'none';
    });
  </script>
</body>
</html>
  `;
}
```

## Siliconflow Checker

原理：通过最小对话长度获得服务端返回的剩余 token 数
方法：请求 `https://api.siliconflow.cn/v1/user/info` 时附带key即可查询有效性及额度

也可部署页面查询，示例网站: `https://lichensheng.tech/static-pages/siliconflow.html`，`https://siliconflow.lichensheng.workers.dev/`

workers代码如下:

```
addEventListener('fetch', function(event) {
    event.respondWith(handleRequest(event.request));
  });
  
  function handleRequest(request) {
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }
  
    if (request.method === 'POST') {
      return handlePost(request);
    }
  
    return new Response(getHtmlContent(), {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    });
  }
  
  function handlePost(request) {
    return request.json()
      .then(function(data) {
        var tokens = data.tokens || [];
        if (!tokens.length) {
          throw new Error('No tokens provided');
        }
  
        return Promise.all(tokens.map(function(token) {
          return checkToken(token);
        }));
      })
      .then(function(results) {
        return new Response(JSON.stringify(results), {
          headers: {
            'content-type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
          },
        });
      })
      .catch(function(error) {
        return new Response(JSON.stringify({
          error: error.message || 'Unknown error occurred'
        }), {
          status: 400,
          headers: {
            'content-type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
          },
        });
      });
  }
  
  function checkToken(token) {
    var checkUrl = 'https://api.siliconflow.cn/v1/chat/completions';
    var balanceUrl = 'https://api.siliconflow.cn/v1/user/info';
  
    var requestOptions = {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site'
      },
      body: JSON.stringify({
        "model": "Qwen/Qwen2.5-72B-Instruct",
        "messages": [{"role": "user", "content": "hi"}],
        "max_tokens": 100,
        "stream": false
      })
    };
  
    return fetch(checkUrl, requestOptions)
      .then(function(response) {
        if (response.ok) {
          return fetch(balanceUrl, {
            headers: {
              'Authorization': 'Bearer ' + token,
              'Accept': 'application/json',
              'Accept-Language': 'zh-CN,zh;q=0.9'
            }
          })
          .then(function(balanceResponse) {
            if (!balanceResponse.ok) {
              throw new Error('Balance check failed');
            }
            return balanceResponse.json();
          })
          .then(function(balanceData) {
            return {
              token: token,
              isValid: true,
              balance: balanceData.data.totalBalance
            };
          })
          .catch(function() {
            return {
              token: token,
              isValid: true,
              balance: '获取余额失败'
            };
          });
        }
  
        return response.json()
          .then(function(errorData) {
            return {
              token: token,
              isValid: false,
              message: errorData.message || '验证失败'
            };
          })
          .catch(function() {
            return {
              token: token,
              isValid: false,
              message: '验证请求失败'
            };
          });
      })
      .catch(function(error) {
        return {
          token: token,
          isValid: false,
          message: '网络请求失败: ' + error.message
        };
      });
  }
  
  function handleOptions(request) {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  function getHtmlContent() {
    return `<!DOCTYPE html>
  <html lang="zh-CN">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>硅基流动Token检测工具</title>
      <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
      <script src="https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js"></script>
      <style>
          :root {
              --primary: #64ffda;
              --bg-dark: #0a192f;
              --text: #ccd6f6;
              --error: #ff3b30;
              --success: #64ffda;
          }
  
          * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
          }
  
          body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              background-color: var(--bg-dark);
              color: var(--text);
              line-height: 1.6;
              min-height: 100vh;
              overflow-x: hidden;
          }
  
          #vanta-canvas {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: 0;
          }
  
          .container {
              position: relative;
              z-index: 1;
              max-width: 1000px;
              margin: 0 auto;
              padding: 40px 20px;
          }
  
          .glass-panel {
              background: rgba(10, 25, 47, 0.7);
              backdrop-filter: blur(10px);
              border-radius: 24px;
              padding: 40px;
              border: 1px solid rgba(100, 255, 218, 0.1);
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          }
  
          h1 {
              font-size: 2.5rem;
              text-align: center;
              margin-bottom: 40px;
              color: var(--primary);
              text-shadow: 0 0 20px rgba(100, 255, 218, 0.3);
              font-weight: 600;
          }
  
          .input-group {
              margin-bottom: 30px;
          }
  
          textarea {
              width: 100%;
              height: 200px;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(100, 255, 218, 0.2);
              border-radius: 12px;
              padding: 20px;
              color: var(--text);
              font-family: 'JetBrains Mono', monospace;
              font-size: 14px;
              resize: vertical;
              transition: all 0.3s ease;
          }
  
          textarea:focus {
              outline: none;
              border-color: var(--primary);
              box-shadow: 0 0 20px rgba(100, 255, 218, 0.1);
          }
  
          .button-container {
              text-align: center;
              margin: 30px 0;
          }
  
          button {
              background: transparent;
              color: var(--primary);
              border: 2px solid var(--primary);
              padding: 12px 30px;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
              position: relative;
              overflow: hidden;
          }
  
          button:hover {
              background: rgba(100, 255, 218, 0.1);
              transform: translateY(-2px);
              box-shadow: 0 5px 15px rgba(100, 255, 218, 0.2);
          }
  
          button:disabled {
              opacity: 0.6;
              cursor: not-allowed;
              transform: none;
          }
  
          .progress-container {
              margin: 20px 0;
              text-align: center;
              display: none;
          }
  
          .progress-bar {
              width: 100%;
              height: 6px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 3px;
              overflow: hidden;
              margin-bottom: 10px;
          }
  
          .progress {
              width: 0%;
              height: 100%;
              background: linear-gradient(90deg, var(--primary) 0%, #4facfe 100%);
              transition: width 0.3s ease;
              border-radius: 3px;
          }
  
          .progress-text {
              font-size: 14px;
              color: var(--text);
          }
  
          .results {
              margin-top: 40px;
          }
  
          .results h2 {
              font-size: 1.5rem;
              color: var(--text);
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              gap: 10px;
          }
  
          .results h2::before {
              content: '';
              display: block;
              width: 4px;
              height: 24px;
              background: var(--primary);
              border-radius: 2px;
          }
  
          .results-content {
              background: rgba(255, 255, 255, 0.03);
              border-radius: 12px;
              padding: 20px;
              margin-bottom: 20px;
              border: 1px solid rgba(255, 255, 255, 0.1);
          }
  
          #validResults {
              font-family: 'JetBrains Mono', monospace;
              white-space: pre-wrap;
              color: var(--success);
              word-break: break-all;
          }
  
          .invalid-token {
              background: rgba(255, 59, 48, 0.1);
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 15px;
              border-left: 4px solid var(--error);
              animation: slideIn 0.3s ease-out;
          }
  
          .loader {
              display: inline-block;
              width: 20px;
              height: 20px;
              border: 3px solid rgba(100, 255, 218, 0.3);
              border-radius: 50%;
              border-top-color: var(--primary);
              animation: spin 1s linear infinite;
              margin-right: 10px;
              vertical-align: middle;
          }
  
          .toast {
              position: fixed;
              bottom: 20px;
              right: 20px;
              padding: 12px 24px;
              background: rgba(100, 255, 218, 0.9);
              color: var(--bg-dark);
              border-radius: 8px;
              font-weight: 600;
              transform: translateY(100px);
              opacity: 0;
              transition: all 0.3s ease;
              z-index: 1000;
          }
  
          .toast.show {
              transform: translateY(0);
              opacity: 1;
          }
  
          @keyframes spin {
              to { transform: rotate(360deg); }
          }
  
          @keyframes slideIn {
              from {
                  opacity: 0;
                  transform: translateX(-10px);
              }
              to {
                  opacity: 1;
                  transform: translateX(0);
              }
          }
  
          @media (max-width: 768px) {
              .container {
                  padding: 20px;
              }
  
              .glass-panel {
                  padding: 20px;
              }
  
              h1 {
                  font-size: 2rem;
              }
  
              button {
                  width: 100%;
              }
          }
      </style>
  </head>
  <body>
      <div id="vanta-canvas"></div>
      <div class="container">
          <div class="glass-panel">
              <h1>硅基流动Token检测工具</h1>
              <div class="input-group">
                  <textarea id="tokens" placeholder="请在此输入sk token，每行一个"></textarea>
              </div>
              <div class="progress-container">
                  <div class="progress-bar">
                      <div class="progress"></div>
                  </div>
                  <div class="progress-text">检测进度: <span id="progress-percentage">0</span>%</div>
              </div>
              <div class="button-container">
                  <button id="checkButton" onclick="checkTokens()">开始检测</button>
              </div>
              <div class="results">
                  <h2>有效账号</h2>
                  <div id="validResults" class="results-content"></div>
                  <button id="copyButton" onclick="copyValidTokens()" style="display: none;">复制有效账号</button>
                  <h2>无效账号</h2>
                  <div id="invalidResults" class="results-content"></div>
              </div>
          </div>
      </div>
      <div id="toast" class="toast"></div>
  
      <script>
          window.addEventListener('DOMContentLoaded', function() {
              VANTA.NET({
                  el: "#vanta-canvas",
                  mouseControls: true,
                  touchControls: true,
                  gyroControls: false,
                  minHeight: 200.00,
                  minWidth: 200.00,
                  scale: 1.00,
                  scaleMobile: 1.00,
                  color: 0x64ffda,
                  backgroundColor: 0x0a192f,
                  points: 10.00,
                  maxDistance: 20.00,
                  spacing: 20.00
              });
          });
  
          function showToast(message, duration) {
              var toast = document.getElementById('toast');
              toast.textContent = message;
              toast.classList.add('show');
              setTimeout(function() {
                  toast.classList.remove('show');
              }, duration || 3000);
          }
  
          function checkTokens() {
              var tokensTextarea = document.getElementById('tokens');
              var checkButton = document.getElementById('checkButton');
              var validResults = document.getElementById('validResults');
              var invalidResults = document.getElementById('invalidResults');
              var copyButton = document.getElementById('copyButton');
              var progressContainer = document.querySelector('.progress-container');
              var progressBar = document.querySelector('.progress');
              var progressText = document.getElementById('progress-percentage');
  
              var tokens = tokensTextarea.value.split('\\n').filter(function(token) {
                  return token.trim() !== '';
              });
  
              if (!tokens.length) {
                  showToast('请输入至少一个token', 2000);
                  return;
              }
  
              checkButton.disabled = true;
              checkButton.innerHTML = '<span class="loader"></span>检测中...';
              validResults.textContent = '';
              invalidResults.innerHTML = '';
              copyButton.style.display = 'none';
              progressContainer.style.display = 'block';
              progressBar.style.width = '0%';
              progressText.textContent = '0';
  
              var completed = 0;
              var results = [];
  
              function processTokens(tokens, batchSize) {
                  var batches = [];
                  for (var i = 0; i < tokens.length; i += batchSize) {
                      batches.push(tokens.slice(i, i + batchSize));
                  }
  
                  return batches.reduce(function(promise, batch) {
                      return promise.then(function() {
                          return Promise.all(batch.map(function(token) {
                              return fetch(window.location.href, {
                                  method: 'POST',
                                  headers: {
                                      'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({ tokens: [token] })
                              })
                              .then(function(response) { return response.json(); })
                              .then(function(result) {
                                  completed++;
                                  var progress = Math.round((completed / tokens.length) * 100);
                                  progressBar.style.width = progress + '%';
                                  progressText.textContent = progress;
                                  return result[0];
                              });
                          }));
                      }).then(function(batchResults) {
                          results = results.concat(batchResults);
                          updateResults(results);
                      });
                  }, Promise.resolve());
              }
  
              function updateResults(results) {
                  var validTokens = results.filter(function(r) { 
                      return r.isValid; 
                  }).map(function(r) {
                      return r.token + ' (余额: ' + r.balance + ')';
                  });
  
                  var invalidTokens = results.filter(function(r) { 
                      return !r.isValid; 
                  });
  
                  validResults.textContent = validTokens.join('\\n');
                  invalidResults.innerHTML = '';
  
                  invalidTokens.forEach(function(result) {
                      var div = document.createElement('div');
                      div.className = 'invalid-token';
                      div.innerHTML = 
                          '<div class="invalid-token-content">' +
                          '<div class="invalid-token-token">' + result.token + '</div>' +
                          '<div class="invalid-token-message">' + result.message + '</div>' +
                          '</div>';
                      invalidResults.appendChild(div);
                  });
  
                  if (validTokens.length > 0) {
                      copyButton.style.display = 'block';
                  }
              }
  
              processTokens(tokens, 3)
                  .then(function() {
                      showToast('检测完成！', 2000);
                  })
                  .catch(function(error) {
                      showToast('检测过程出错: ' + error.message, 3000);
                  })
                  .finally(function() {
                      checkButton.disabled = false;
                      checkButton.textContent = '开始检测';
                      progressContainer.style.display = 'none';
                  });
          }
  
          function copyValidTokens() {
              var validResults = document.getElementById('validResults');
              var tokens = validResults.textContent.split('\\n').map(function(line) {
                  return line.split(' ')[0];
              });
              var textArea = document.createElement('textarea');
              textArea.value = tokens.join('\\n');
              document.body.appendChild(textArea);
              textArea.select();
              document.execCommand('copy');
              document.body.removeChild(textArea);
              showToast('有效账号已复制到剪贴板', 2000);
          }
      </script>
  </body>
  </html>`;
  }
```

html代码如下:

```
<!DOCTYPE html>
<html lang="zh-CN">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>批量检测账号有效性</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f0f2f5;
            color: #333;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: #fff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 30px;
        }

        textarea {
            width: 100%;
            height: 200px;
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            resize: vertical;
        }

        button {
            display: block;
            width: 100%;
            padding: 12px;
            background-color: #3498db;
            color: #fff;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.3s;
        }

        button:hover {
            background-color: #2980b9;
        }

        button:disabled {
            background-color: #95a5a6;
            cursor: not-allowed;
        }

        .results {
            margin-top: 30px;
        }

        .results h2 {
            color: #2c3e50;
            margin-bottom: 10px;
        }

        .results-content {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #ddd;
            font-size: 14px;
            max-height: 300px;
            overflow-y: auto;
        }

        #validResults {
            border-left: 4px solid #2ecc71;
            white-space: pre-wrap;
        }

        #zeroBalanceResults {
            border-left: 4px solid #f1c40f;
            white-space: pre-wrap;
        }

        #invalidResults {
            border-left: 4px solid #e74c3c;
        }

        .invalid-token {
            background-color: #ffecec;
            padding: 12px;
            margin-bottom: 12px;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .invalid-token-content {
            display: flex;
            flex-direction: column;
        }

        .invalid-token-token {
            font-family: monospace;
            background-color: #fff;
            padding: 6px;
            border-radius: 3px;
            margin-bottom: 6px;
            border: 1px solid #ffcccb;
            word-break: break-all;
        }

        .invalid-token-message {
            color: #c0392b;
            font-weight: bold;
        }

        .loader {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            display: inline-block;
            vertical-align: middle;
            margin-right: 10px;
        }

        @keyframes spin {
            0% {
                transform: rotate(0deg);
            }

            100% {
                transform: rotate(360deg);
            }
        }

        .copy-button {
            background-color: #27ae60;
            margin-top: 10px;
        }

        .copy-button.zero-balance {
            background-color: #f39c12;
        }

        .copy-button:hover {
            background-color: #2ecc71;
        }

        .copy-button.zero-balance:hover {
            background-color: #f1c40f;
        }
    </style>
</head>

<body>
    <div class="container">
        <h1>硅基流动Token有效性检测</h1>
        <textarea id="tokens" placeholder="请在此输入sk token，每行一个"></textarea>
        <button id="checkButton" onclick="checkTokens()">检测账号</button>
        <div class="results">
            <h2>有余额账号</h2>
            <div id="validResults" class="results-content"></div>
            <button id="copyButton" class="copy-button" onclick="copyTokens('valid')" style="display: none;">复制有余额账号</button>
  
            <h2>零余额账号</h2>
            <div id="zeroBalanceResults" class="results-content"></div>
            <button id="copyZeroButton" class="copy-button zero-balance" onclick="copyTokens('zero')" style="display: none;">复制零余额账号</button>
  
            <h2>失效账号</h2>
            <div id="invalidResults" class="results-content"></div>
        </div>
    </div>

    <script>
        async function checkTokens() {
            const tokensTextarea = document.getElementById('tokens');
            const checkButton = document.getElementById('checkButton');
            const validResults = document.getElementById('validResults');
            const zeroBalanceResults = document.getElementById('zeroBalanceResults');
            const invalidResults = document.getElementById('invalidResults');
            const copyButton = document.getElementById('copyButton');
            const copyZeroButton = document.getElementById('copyZeroButton');

            const tokens = tokensTextarea.value.split('\n').filter(token => token.trim() !== '');

            if (tokens.length === 0) {
                alert('请输入至少一个token');
                return;
            }

            checkButton.disabled = true;
            checkButton.innerHTML = '<span class="loader"></span>检测中...';
            validResults.textContent = '';
            zeroBalanceResults.textContent = '';
            invalidResults.innerHTML = '';
            copyButton.style.display = 'none';
            copyZeroButton.style.display = 'none';

            const results = await Promise.all(tokens.map(checkToken));

            const validTokens = [];
            const zeroBalanceTokens = [];
            const invalidTokens = [];

            results.forEach(result => {
                if (!result.isValid) {
                    if (result.message === 'Sorry, your account balance is insufficient') {
                        zeroBalanceTokens.push(`${result.token} (余额: 0)`);
                    } else {
                        invalidTokens.push(result);
                    }
                } else {
                    if (parseFloat(result.balance) > 0) {
                        validTokens.push(`${result.token} (余额: ${result.balance})`);
                    } else {
                        zeroBalanceTokens.push(`${result.token} (余额: ${result.balance})`);
                    }
                }
            });

            validResults.textContent = validTokens.join('\n');
            zeroBalanceResults.textContent = zeroBalanceTokens.join('\n');

            invalidTokens.forEach(result => {
                const div = document.createElement('div');
                div.className = 'invalid-token';
                div.innerHTML = `
                    <div class="invalid-token-content">
                        <div class="invalid-token-token">${result.token}</div>
                        <div class="invalid-token-message">${result.message}</div>
                    </div>
                `;
                invalidResults.appendChild(div);
            });

            if (validTokens.length > 0) {
                copyButton.style.display = 'block';
            }
            if (zeroBalanceTokens.length > 0) {
                copyZeroButton.style.display = 'block';
            }

            checkButton.disabled = false;
            checkButton.textContent = '检测账号';
        }

        async function checkToken(token) {
            try {
                const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) CherryStudio/0.8.7 Chrome/120.0.6099.291 Electron/28.3.3 Safari/537.36',
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120"',
                        'x-stainless-os': 'Unknown',
                        'x-stainless-lang': 'js',
                        'sec-ch-ua-mobile': '?0',
                        'x-stainless-package-version': '4.59.0',
                        'x-stainless-runtime': 'browser:chrome',
                        'x-stainless-arch': 'unknown',
                        'x-stainless-runtime-version': '120.0.6099',
                        'x-api-key': token,
                        'sec-ch-ua-platform': 'macOS',
                        'Sec-Fetch-Site': 'cross-site',
                        'Sec-Fetch-Mode': 'cors',
                        'Sec-Fetch-Dest': 'empty',
                        'Accept-Language': 'zh-CN'
                    },
                    body: JSON.stringify({
                        "model": "Qwen/Qwen2.5-72B-Instruct",
                        "messages": [
                            {
                                "role": "user",
                                "content": "hi"
                            }
                        ],
                        "max_tokens": 100,
                        "stream": false
                    })
                });

                if (response.ok) {
                    const balanceResponse = await fetch('https://api.siliconflow.cn/v1/user/info', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    const balanceData = await balanceResponse.json();
                    const balance = balanceData.data.totalBalance;
                    return { token, isValid: true, balance };
                } else {
                    const errorData = await response.json();
                    return { token, isValid: false, message: errorData.message };
                }
            } catch (error) {
                return { token, isValid: false, message: `请求失败: ${error.message}` };
            }
        }

        function copyTokens(type) {
            const resultsDiv = type === 'valid' ? document.getElementById('validResults') : document.getElementById('zeroBalanceResults');
            const tokens = resultsDiv.textContent.split('\n').map(line => line.split(' ')[0]);
            const textArea = document.createElement('textarea');
            textArea.value = tokens.join('\n');
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert(type === 'valid' ? '有余额账号已复制到剪贴板' : '零余额账号已复制到剪贴板');
        }
    </script>
</body>

</html>
```



## Gemini Balance

Gemini轮询代理服务，结合Roo Code辅助编程食用。

项目地址：`https://github.com/snailyp/gemini-balance`





以下均为待补充内容

## Workflow

Dify, https://github.com/lzskyline/OpenDify(custom ai)

Fastgpt

## 联网

tavily

searxng

jina

## 知识库

## Cline
