---
title: OpenAI-Edge-TTS部署&API调用
published: 2025-02-25 09:29:09
description: OpenAI-Edge-TTS是一个集成了 Microsoft Edge TTS功能的 Python 库和 API 服务，支持将 TTS 请求转换为 OpenAI 的通用格式。该项目可以通过 Docker 或直接使用 Python 运行，提供了灵活的部署选项，并且可以作为微服务独立运行或集成到更大系统中，如听书应用和播客平台。API 调用可以通过 `curl` 命令或 Postman 等工具实现，项目文档还提供了详细的语音角色列表和常见问题的解决方法，以帮助用户快速上手和排错。
category: 搞七捻三
tags:
- Web
- tts
abbrlink: openai-edge-tts
---

## **引言**

[OpenAI-Edge-TTS](https://github.com/travisvn/openai-edge-tts) 不仅仅是一个 Python 库，它还提供了一个 API 服务，允许用户通过 HTTP 请求来使用 Microsoft Edge 的 TTS 功能，并将其请求格式转换为OpenAI TTS通用格式，这使得它可以作为一个独立的微服务部署，或者集成到更大的系统中，比如听书或播客。

## **部署方式**

1. **Docker 部署 (推荐):** 使用 Docker 和 Docker Compose 可以轻松地创建和管理容器化的环境，简化了环境配置和依赖管理。
2. **Python 直接运行:** 适合不想使用 Docker，或者需要进行本地开发和调试的用户。

---

### **Docker 部署详细步骤**

1. **前提条件 (Prerequisites):**

   * **Docker:** 需要安装 Docker Engine 和 Docker Compose。
     * Docker Engine：用于构建和运行 Docker 镜像。
     * Docker Compose：用于定义和管理多容器 Docker 应用程序。
     * 确保已安装 `docker compose` (注意不是 `docker-compose`).
2. **安装 (Installation):**

   * **克隆仓库:**

     ```bash
     git clone https://github.com/travisvn/openai-edge-tts.git
     cd openai-edge-tts
     ```
   * **环境变量配置:**

     * 在项目根目录下创建一个名为 `.env` 的文件。
     * 将以下内容复制到 `.env` 文件中，并根据需要进行修改：
       ```
       API_KEY=your_api_key_here  # (可选) 设置 API 密钥，用于访问控制
       PORT=5050                # API 服务监听的端口，默认为 5050
       DEFAULT_VOICE=en-US-AvaNeural  # 默认语音
       DEFAULT_RESPONSE_FORMAT=mp3  # 默认响应格式
       DEFAULT_SPEED=1.0            # 默认语速
       DEFAULT_LANGUAGE=en-US         # 默认语言.

       REQUIRE_API_KEY=True        # 是否需要 API 密钥才能访问, True 为必须.
       REMOVE_FILTER=False          # 是否移除过滤。
       EXPAND_API=True              # 是否扩展 API。
       ```
     * 或者，可以直接复制 `.env.example` 文件并重命名为 `.env`：
       ```bash
       cp .env.example .env
       ```
     * **环境变量简要说明:**
       * `API_KEY`:  如果设置了 `REQUIRE_API_KEY=True`，则调用时客户端需要提供API密钥才能访问 API。
       * `PORT`:  API 服务监听的端口。
       * `DEFAULT_VOICE`, `DEFAULT_RESPONSE_FORMAT`, `DEFAULT_SPEED`:  这些是 API 的默认设置，如果客户端在请求中没有特别指定，就使用默认值（详细参数列在文末）。
   * **使用 Docker Compose 运行 (推荐):**

     * **构建并启动服务:**

       ```bash
       docker compose up --build
       ```

       * `--build`:  在启动服务之前，强制重新构建 Docker 镜像。这在您修改了项目代码或 Dockerfile 后非常有用。
     * **后台运行:**

       ```bash
       docker compose up -d
       ```

       `-d`:  以“分离模式”运行 Docker Compose，服务将在后台运行。
   * **直接使用 Docker 运行 (备选方案):**

     * **构建镜像**

     ```
     docker build -t openai-edge-tts .
     ```

     * **运行容器：**

       ```bash
        docker run -p 5050:5050 --env-file .env openai-edge-tts
       ```

       * `-p 5050:5050`:  将容器的 5050 端口映射到主机的 5050 端口。
       * `--env-file .env`:  指定包含环境变量的文件。
     * **后台运行：**

       ```
       docker run -d -p 5050:5050 --env-file .env openai-edge-tts
       ```
3. **访问 API:**

   * 详细调用会在[第四部分](/API调用)阐明，   服务启动后，可以通过 `http://localhost:5050` 访问 API (如果是云服务器，需要开放端口后把请求地址换成主机地址)

### **Python 运行详细步骤**

1. **克隆仓库:**

   ```bash
   git clone https://github.com/travisvn/openai-edge-tts.git
   cd openai-edge-tts
   ```
2. **设置虚拟环境 :**

   * 创建虚拟环境：
     ```bash
     # macOS/Linux
     python3 -m venv venv
     # Windows
     python -m venv venv
     ```
   * 激活虚拟环境：
     ```bash
     # macOS/Linux
     source venv/bin/activate
     # Windows
     venv\Scripts\activate
     ```
   * 使用虚拟环境可以隔离项目依赖，避免与其他 Python 项目冲突。
3. **安装依赖:**

   ```bash
   pip install -r requirements.txt
   ```
4. **配置环境变量:**

   * 与 Docker 部署方式相同，创建 `.env` 文件并设置环境变量。
5. **运行服务:**

   ```bash
   python app/server.py
   ```

有两种调用 API 请求的方式：通过命令行直接运行，或者通过工具发送请求。

## **API调用**

#### 方式 1：使用命令行运行 `curl`

**打开命令行终端**：

* Windows: 按 `Win + R`，输入 `cmd` 或 `powershell`。
* macOS/Linux: 打开终端应用。

**运行 `curl` 命令**：

* 请求示例：

```
curl -X POST http://localhost:5050/v1/audio/speech \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_key_here" \
  -d '{
    "input": "Hello, I am your AI assistant! What can I help you?",
    "voice": "alloy",
    "response_format": "mp3",
    "speed": 1.1
  }' \
  --output speech-example.mp3
```

* 替换示例中的 `your_api_key_here` 为 `.env` 中设置的 API Key。
* 复制代码段并粘贴到终端中。
* 按回车运行。
* 如果请求成功，语音文件将保存为 `speech-example.mp3`，文件会出现在当前工作目录下。

输出如下：

<audio controls>
  <source src="https://imgbed-idk.pages.dev/file/blog/1762747866257_speech-example.mp3" type="audio/mpeg">
  Your browser does not support the audio element.
</audio>

#### 方式 2：使用 Postman（或其他 API 开发工具）

如果使用 `curl` 太繁琐，可以使用 GUI 工具（例如 Postman）来发送请求。

1. **安装 Postman**：
   * 下载地址：[https://www.postman.com/](https://www.postman.com/)
2. **创建请求**：
   * 打开 Postman，点击 `New Request`。
   * 方法：选择 **POST**。
   * URL：输入 `http://localhost:5050/v1/audio/speech`。
3. **设置 Headers**：
   * 添加 Header：`Content-Type: application/json`
   * 添加 Header：`Authorization: Bearer your_api_key_here`
4. **设置 Body**：
   * 复制以下 JSON 内容到 Body 的 `raw` 模式中（选择 `Text -> JSON`）：
     <pre><div class="sc-ldgYGE bkvnrk code-block"><div class="sc-efgocT ikMppa"><div><div class="sc-ffiKcS ekdLqI"><JSON></div></div><div gap="12" alignitems="center" class="sc-KXCwU sc-gyycJP sc-gaZyOd fBToAx fPbWPu ijItli"><div class="sc-fkSzgi jpkCWM"><span role="img" aria-label="download" class="anticon anticon-download"><svg viewBox="64 64 896 896" focusable="false" data-icon="download" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M505.7 661a8 8 0 0012.6 0l112-141.7c4.1-5.2.4-12.9-6.3-12.9h-74.1V168c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v338.3H400c-6.7 0-10.4 7.7-6.3 12.9l112 141.8zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z"></path></svg></span></div><i class="iconfont icon-copy copy"></i></div></div><div class="sc-eddAHl bBEOot"><pre class="shiki one-light" tabindex="0"><code><span class="line"><span>{</span></span>
     <span class="line"><span>  "input"</span><span>: </span><span>"Hello, I am your AI assistant!"</span><span>,</span></span>
     <span class="line"><span>  "voice"</span><span>: </span><span>"alloy"</span><span>,</span></span>
     <span class="line"><span>  "response_format"</span><span>: </span><span>"mp3"</span><span>,</span></span>
     <span class="line"><span>  "speed"</span><span>: </span><span>1.1</span></span>
     <span class="line"><span>}</span></span></code></pre></div></div></pre>
5. **发送请求**：
   * 点击 `Send` 按钮测试。
6. **保存文件**：
   * 如果请求成功，Postman 会返回一个 MP3 文件。点击 `Save Response`，将该文件保存到本地。

## **常见问题**

主要是客户端请求格式不对，虽然POST后能GET到mp3文件，但是播放时会报错，查看源码会得到以下内容:

```
<!doctype html>
<html lang=en>
<title>400 Bad Request</title>
<h1>Bad Request</h1>
<p>The browser (or proxy) sent a request that this server could not understand.</p>
```

### **排查&解决流程**

#### **1. JSON 的格式问题**

`curl -d` 参数中使用了一个复杂的 JSON 数据，其中包含换行符（`\n`）。如果没有正确地转义（或处理多行 JSON），这会导致格式问题。换行符可能会破坏 JSON 的结构，让服务器无法理解。

---

**解决方法 1：将 JSON 压缩为单一行**
将你的 JSON 数据改为单行，避免多行和换行符的影响：

```bash
curl -X POST http://localhost:5050/v1/audio/speech \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 273299033lee" \
  -d '{"input": "He came across the street, finally, muffled in his ancient overcoat, shapeless felt hat pulled down over his bald head, looking more like an energetic gnome than an eminent psychiatrist. His offices were nearby.", "voice": "alloy", "response_format": "mp3", "speed": 1.1}' \
  --output speechthree.mp3
```

---

**解决方法 2：使用文件传递 JSON 数据**
将 JSON 数据保存到一个文件中，然后引用文件路径提升健壮性：

1. 创建一个文件，例如 `input.json`，并将 JSON 内容保存到文件中：

   ```json
   {
     "input": "He came across the street, finally, muffled in his ancient overcoat, shapeless felt hat pulled down over his bald head, looking more like an energetic gnome than an eminent psychiatrist. His offices were nearby.",
     "voice": "alloy",
     "response_format": "mp3",
     "speed": 1.1
   }
   ```
2. 然后在 `curl` 请求中使用 `-d @input.json` 来读取文件作为请求体：

   ```bash
   curl -X POST http://localhost:5050/v1/audio/speech \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer 273299033lee" \
     -d @input.json \
     --output speechthree.mp3
   ```

---

#### **2. 内容长度超出了 API 限制**

有些语音合成 API 对 `input` 文本有字符长度限制。如果你的输入文本超出了限制（例如 200 字符或 500 字符等），可能直接导致请求失败。

---

**解决方法**：
你可以尝试以下方法：

1. **缩短输入文本**：

   ```bash
   curl -X POST http://localhost:5050/v1/audio/speech \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer 273299033lee" \
     -d '{"input": "He came across the street, finally.", "voice": "alloy", "response_format": "mp3", "speed": 1.1}' \
     --output speechthree.mp3
   ```

   如果短文本能返回结果，则说明确实是长度问题。
2. **根据 API 文档分割输入**：
   如果需要处理长文本，请调研 API 文档，看看是否支持分段语音合成。如果支持，你需要手动分段，并循环多次调用 API 进行合成。

---

#### **3. Authorization Token（API Key）无效**

客户端提供的 `Bearer Token` 无效，`API Key`失效了或者格式不对。

---

**解决方法**：

1. 确认你的 API Key 是真实且有效的。
2. 确保它以 `Authorization: Bearer XXXX` 格式传递，而且正确。

---

#### **4. API 服务端点路径错误**

请求的 URL 一般情况下是 `http://localhost:5050/v1/audio/speech` ，但是服务端端口如果不是默认的5050，就需要修改，另外请求地址在本机就是 `localhost`，在云机就是云机的地址。最后API的路由是标准的 `OpenAI TTS`的路由 `/v1/audio/speech`

#### **5. 服务器可能不支持多参数 Header**

某些服务器对 HTTP 请求头过于敏感。例如：

- `Authorization` 可能不被正确识别。
- Header 格式错误。

---

## **附录**

**edge-tts 语音角色列表**

| 角色名称                          | 语言                      | 地区                 | 性别 |
| --------------------------------- | ------------------------- | -------------------- | ---- |
| af-ZA-AdriNeural                  | 阿非利卡语                | 南非                 | 女性 |
| af-ZA-WillemNeural                | 阿非利卡语                | 南非                 | 男性 |
| am-ET-AmehaNeural                 | 阿姆哈拉语                | 埃塞俄比亚           | 男性 |
| am-ET-MekdesNeural                | 阿姆哈拉语                | 埃塞俄比亚           | 女性 |
| ar-AE-FatimaNeural                | 阿拉伯语                  | 阿联酋               | 女性 |
| ar-AE-HamdanNeural                | 阿拉伯语                  | 阿联酋               | 男性 |
| ar-BH-AliNeural                   | 阿拉伯语                  | 巴林                 | 男性 |
| ar-BH-LailaNeural                 | 阿拉伯语                  | 巴林                 | 女性 |
| ar-DZ-AminaNeural                 | 阿拉伯语                  | 阿尔及利亚           | 女性 |
| ar-DZ-IsmaelNeural                | 阿拉伯语                  | 阿尔及利亚           | 男性 |
| ar-EG-SalmaNeural                 | 阿拉伯语                  | 埃及                 | 女性 |
| ar-EG-ShakirNeural                | 阿拉伯语                  | 埃及                 | 男性 |
| ar-IQ-BasselNeural                | 阿拉伯语                  | 伊拉克               | 男性 |
| ar-IQ-RanaNeural                  | 阿拉伯语                  | 伊拉克               | 女性 |
| ar-JO-SanaNeural                  | 阿拉伯语                  | 约旦                 | 女性 |
| ar-JO-TaimNeural                  | 阿拉伯语                  | 约旦                 | 男性 |
| ar-KW-FahedNeural                 | 阿拉伯语                  | 科威特               | 男性 |
| ar-KW-NouraNeural                 | 阿拉伯语                  | 科威特               | 女性 |
| ar-LB-LaylaNeural                 | 阿拉伯语                  | 黎巴嫩               | 女性 |
| ar-LB-RamiNeural                  | 阿拉伯语                  | 黎巴嫩               | 男性 |
| ar-LY-ImanNeural                  | 阿拉伯语                  | 利比亚               | 女性 |
| ar-LY-OmarNeural                  | 阿拉伯语                  | 利比亚               | 男性 |
| ar-MA-JamalNeural                 | 阿拉伯语                  | 摩洛哥               | 男性 |
| ar-MA-MounaNeural                 | 阿拉伯语                  | 摩洛哥               | 女性 |
| ar-OM-AbdullahNeural              | 阿拉伯语                  | 阿曼                 | 男性 |
| ar-OM-AyshaNeural                 | 阿拉伯语                  | 阿曼                 | 女性 |
| ar-QA-AmalNeural                  | 阿拉伯语                  | 卡塔尔               | 女性 |
| ar-QA-MoazNeural                  | 阿拉伯语                  | 卡塔尔               | 男性 |
| ar-SA-HamedNeural                 | 阿拉伯语                  | 沙特阿拉伯           | 男性 |
| ar-SA-ZariyahNeural               | 阿拉伯语                  | 沙特阿拉伯           | 女性 |
| ar-SY-AmanyNeural                 | 阿拉伯语                  | 叙利亚               | 女性 |
| ar-SY-LaithNeural                 | 阿拉伯语                  | 叙利亚               | 男性 |
| ar-TN-HediNeural                  | 阿拉伯语                  | 突尼斯               | 男性 |
| ar-TN-ReemNeural                  | 阿拉伯语                  | 突尼斯               | 女性 |
| ar-YE-MaryamNeural                | 阿拉伯语                  | 也门                 | 女性 |
| ar-YE-SalehNeural                 | 阿拉伯语                  | 也门                 | 男性 |
| az-AZ-BabekNeural                 | 阿塞拜疆语                | 阿塞拜疆             | 男性 |
| az-AZ-BanuNeural                  | 阿塞拜疆语                | 阿塞拜疆             | 女性 |
| bg-BG-BorislavNeural              | 保加利亚语                | 保加利亚             | 男性 |
| bg-BG-KalinaNeural                | 保加利亚语                | 保加利亚             | 女性 |
| bn-BD-NabanitaNeural              | 孟加拉语                  | 孟加拉国             | 女性 |
| bn-BD-PradeepNeural               | 孟加拉语                  | 孟加拉国             | 男性 |
| bn-IN-BashkarNeural               | 孟加拉语                  | 印度                 | 男性 |
| bn-IN-TanishaaNeural              | 孟加拉语                  | 印度                 | 女性 |
| bs-BA-GoranNeural                 | 波斯尼亚语                | 波斯尼亚和黑塞哥维那 | 男性 |
| bs-BA-VesnaNeural                 | 波斯尼亚语                | 波斯尼亚和黑塞哥维那 | 女性 |
| ca-ES-EnricNeural                 | 加泰罗尼亚语              | 西班牙               | 男性 |
| ca-ES-JoanaNeural                 | 加泰罗尼亚语              | 西班牙               | 女性 |
| cs-CZ-AntoninNeural               | 捷克语                    | 捷克共和国           | 男性 |
| cs-CZ-VlastaNeural                | 捷克语                    | 捷克共和国           | 女性 |
| cy-GB-AledNeural                  | 威尔士语                  | 英国                 | 男性 |
| cy-GB-NiaNeural                   | 威尔士语                  | 英国                 | 女性 |
| da-DK-ChristelNeural              | 丹麦语                    | 丹麦                 | 女性 |
| da-DK-JeppeNeural                 | 丹麦语                    | 丹麦                 | 男性 |
| de-AT-IngridNeural                | 德语                      | 奥地利               | 女性 |
| de-AT-JonasNeural                 | 德语                      | 奥地利               | 男性 |
| de-CH-JanNeural                   | 德语                      | 瑞士                 | 男性 |
| de-CH-LeniNeural                  | 德语                      | 瑞士                 | 女性 |
| de-DE-AmalaNeural                 | 德语                      | 德国                 | 女性 |
| de-DE-ConradNeural                | 德语                      | 德国                 | 男性 |
| de-DE-FlorianMultilingualNeural   | 德语                      | 德国                 | 男性 |
| de-DE-KatjaNeural                 | 德语                      | 德国                 | 女性 |
| de-DE-KillianNeural               | 德语                      | 德国                 | 男性 |
| de-DE-SeraphinaMultilingualNeural | 德语                      | 德国                 | 女性 |
| el-GR-AthinaNeural                | 希腊语                    | 希腊                 | 女性 |
| el-GR-NestorasNeural              | 希腊语                    | 希腊                 | 男性 |
| en-AU-NatashaNeural               | 英语                      | 澳大利亚             | 女性 |
| en-AU-WilliamNeural               | 英语                      | 澳大利亚             | 男性 |
| en-CA-ClaraNeural                 | 英语                      | 加拿大               | 女性 |
| en-CA-LiamNeural                  | 英语                      | 加拿大               | 男性 |
| en-GB-LibbyNeural                 | 英语 英式英语             | 英国                 | 女性 |
| en-GB-MaisieNeural                | 英语 英式英语             | 英国                 | 女性 |
| en-GB-RyanNeural                  | 英语 英式英语             | 英国                 | 男性 |
| en-GB-SoniaNeural                 | 英语 英式英语             | 英国                 | 女性 |
| en-GB-ThomasNeural                | 英语 英式英语             | 英国                 | 男性 |
| en-HK-SamNeural                   | 英语 港式英语             | 香港                 | 男性 |
| en-HK-YanNeural                   | 英语 港式英语             | 香港                 | 女性 |
| en-IE-ConnorNeural                | 英语                      | 爱尔兰               | 男性 |
| en-IE-EmilyNeural                 | 英语                      | 爱尔兰               | 女性 |
| en-IN-NeerjaExpressiveNeural      | 英语                      | 印度                 | 女性 |
| en-IN-NeerjaNeural                | 英语                      | 印度                 | 女性 |
| en-IN-PrabhatNeural               | 英语                      | 印度                 | 男性 |
| en-KE-AsiliaNeural                | 英语                      | 肯尼亚               | 女性 |
| en-KE-ChilembaNeural              | 英语                      | 肯尼亚               | 男性 |
| en-NG-AbeoNeural                  | 英语                      | 尼日利亚             | 男性 |
| en-NG-EzinneNeural                | 英语                      | 尼日利亚             | 女性 |
| en-NZ-MitchellNeural              | 英语                      | 新西兰               | 男性 |
| en-NZ-MollyNeural                 | 英语                      | 新西兰               | 女性 |
| en-PH-JamesNeural                 | 英语                      | 菲律宾               | 男性 |
| en-PH-RosaNeural                  | 英语                      | 菲律宾               | 女性 |
| en-SG-LunaNeural                  | 英语                      | 新加坡               | 女性 |
| en-SG-WayneNeural                 | 英语                      | 新加坡               | 男性 |
| en-TZ-ElimuNeural                 | 英语                      | 坦桑尼亚             | 男性 |
| en-TZ-ImaniNeural                 | 英语                      | 坦桑尼亚             | 女性 |
| en-US-AnaNeural                   | 英语 美式英语             | 美国                 | 女性 |
| en-US-AndrewNeural                | 英语 美式英语             | 美国                 | 男性 |
| en-US-AriaNeural                  | 英语 美式英语             | 美国                 | 女性 |
| en-US-AvaNeural                   | 英语 美式英语             | 美国                 | 女性 |
| en-US-BrianNeural                 | 英语 美式英语             | 美国                 | 男性 |
| en-US-ChristopherNeural           | 英语 美式英语             | 美国                 | 男性 |
| en-US-EmmaNeural                  | 英语 美式英语             | 美国                 | 女性 |
| en-US-EricNeural                  | 英语 美式英语             | 美国                 | 男性 |
| en-US-GuyNeural                   | 英语 美式英语             | 美国                 | 男性 |
| en-US-JennyNeural                 | 英语 美式英语             | 美国                 | 女性 |
| en-US-MichelleNeural              | 英语 美式英语             | 美国                 | 女性 |
| en-US-RogerNeural                 | 英语 美式英语             | 美国                 | 男性 |
| en-US-SteffanNeural               | 英语 美式英语             | 美国                 | 男性 |
| en-ZA-LeahNeural                  | 英语                      | 南非                 | 女性 |
| en-ZA-LukeNeural                  | 英语                      | 南非                 | 男性 |
| es-AR-ElenaNeural                 | 西班牙语                  | 阿根廷               | 女性 |
| es-AR-TomasNeural                 | 西班牙语                  | 阿根廷               | 男性 |
| es-BO-MarceloNeural               | 西班牙语                  | 玻利维亚             | 男性 |
| es-BO-SofiaNeural                 | 西班牙语                  | 玻利维亚             | 女性 |
| es-CL-CatalinaNeural              | 西班牙语                  | 智利                 | 女性 |
| es-CL-LorenzoNeural               | 西班牙语                  | 智利                 | 男性 |
| es-CO-GonzaloNeural               | 西班牙语                  | 哥伦比亚             | 男性 |
| es-CO-SalomeNeural                | 西班牙语                  | 哥伦比亚             | 女性 |
| es-CR-JuanNeural                  | 西班牙语                  | 哥斯达黎加           | 男性 |
| es-CR-MariaNeural                 | 西班牙语                  | 哥斯达黎加           | 女性 |
| es-CU-BelkysNeural                | 西班牙语                  | 古巴                 | 女性 |
| es-CU-ManuelNeural                | 西班牙语                  | 古巴                 | 男性 |
| es-DO-EmilioNeural                | 西班牙语                  | 多米尼加共和国       | 男性 |
| es-DO-RamonaNeural                | 西班牙语                  | 多米尼加共和国       | 女性 |
| es-EC-AndreaNeural                | 西班牙语                  | 厄瓜多尔             | 女性 |
| es-EC-LuisNeural                  | 西班牙语                  | 厄瓜多尔             | 男性 |
| es-ES-AlvaroNeural                | 西班牙语                  | 西班牙               | 男性 |
| es-ES-ElviraNeural                | 西班牙语                  | 西班牙               | 女性 |
| es-ES-XimenaNeural                | 西班牙语                  | 西班牙               | 女性 |
| es-GQ-JavierNeural                | 西班牙语                  | 赤道几内亚           | 男性 |
| es-GQ-TeresaNeural                | 西班牙语                  | 赤道几内亚           | 女性 |
| es-GT-AndresNeural                | 西班牙语                  | 危地马拉             | 男性 |
| es-GT-MartaNeural                 | 西班牙语                  | 危地马拉             | 女性 |
| es-HN-CarlosNeural                | 西班牙语                  | 洪都拉斯             | 男性 |
| es-HN-KarlaNeural                 | 西班牙语                  | 洪都拉斯             | 女性 |
| es-MX-DaliaNeural                 | 西班牙语                  | 墨西哥               | 女性 |
| es-MX-JorgeNeural                 | 西班牙语                  | 墨西哥               | 男性 |
| es-NI-FedericoNeural              | 西班牙语                  | 尼加拉瓜             | 男性 |
| es-NI-YolandaNeural               | 西班牙语                  | 尼加拉瓜             | 女性 |
| es-PA-MargaritaNeural             | 西班牙语                  | 巴拿马               | 女性 |
| es-PA-RobertoNeural               | 西班牙语                  | 巴拿马               | 男性 |
| es-PE-AlexNeural                  | 西班牙语                  | 秘鲁                 | 男性 |
| es-PE-CamilaNeural                | 西班牙语                  | 秘鲁                 | 女性 |
| es-PR-KarinaNeural                | 西班牙语                  | 波多黎各             | 女性 |
| es-PR-VictorNeural                | 西班牙语                  | 波多黎各             | 男性 |
| es-PY-MarioNeural                 | 西班牙语                  | 巴拉圭               | 男性 |
| es-PY-TaniaNeural                 | 西班牙语                  | 巴拉圭               | 女性 |
| es-SV-LorenaNeural                | 西班牙语                  | 萨尔瓦多             | 女性 |
| es-SV-RodrigoNeural               | 西班牙语                  | 萨尔瓦多             | 男性 |
| es-US-AlonsoNeural                | 西班牙语                  | 美国                 | 男性 |
| es-US-PalomaNeural                | 西班牙语                  | 美国                 | 女性 |
| es-UY-MateoNeural                 | 西班牙语                  | 乌拉圭               | 男性 |
| es-UY-ValentinaNeural             | 西班牙语                  | 乌拉圭               | 女性 |
| es-VE-PaolaNeural                 | 西班牙语                  | 委内瑞拉             | 女性 |
| es-VE-SebastianNeural             | 西班牙语                  | 委内瑞拉             | 男性 |
| et-EE-AnuNeural                   | 爱沙尼亚语                | 爱沙尼亚             | 女性 |
| et-EE-KertNeural                  | 爱沙尼亚语                | 爱沙尼亚             | 男性 |
| fa-IR-DilaraNeural                | 波斯语                    | 伊朗                 | 女性 |
| fa-IR-FaridNeural                 | 波斯语                    | 伊朗                 | 男性 |
| fi-FI-HarriNeural                 | 芬兰语                    | 芬兰                 | 男性 |
| fi-FI-NooraNeural                 | 芬兰语                    | 芬兰                 | 女性 |
| fil-PH-AngeloNeural               | 菲律宾语                  | 菲律宾               | 男性 |
| fil-PH-BlessicaNeural             | 菲律宾语                  | 菲律宾               | 女性 |
| fr-BE-CharlineNeural              | 法语                      | 比利时（瓦隆语区）   | 女性 |
| fr-BE-GerardNeural                | 法语                      | 比利时（瓦隆语区）   | 男性 |
| fr-CA-AntoineNeural               | 法语                      | 加拿大（魁北克）     | 男性 |
| fr-CA-JeanNeural                  | 法语                      | 加拿大（魁北克）     | 男性 |
| fr-CA-SylvieNeural                | 法语                      | 加拿大（魁北克）     | 女性 |
| fr-CA-ThierryNeural               | 法语                      | 加拿大（魁北克）     | 男性 |
| fr-CH-ArianeNeural                | 法语                      | 瑞士                 | 女性 |
| fr-CH-FabriceNeural               | 法语                      | 瑞士                 | 男性 |
| fr-FR-DeniseNeural                | 法语                      | 法国                 | 女性 |
| fr-FR-EloiseNeural                | 法语                      | 法国                 | 女性 |
| fr-FR-HenriNeural                 | 法语                      | 法国                 | 男性 |
| fr-FR-RemyMultilingualNeural      | 法语                      | 法国                 | 男性 |
| fr-FR-VivienneMultilingualNeural  | 法语                      | 法国                 | 女性 |
| ga-IE-ColmNeural                  | 爱尔兰语                  | 爱尔兰               | 男性 |
| ga-IE-OrlaNeural                  | 爱尔兰语                  | 爱尔兰               | 女性 |
| gl-ES-RoiNeural                   | 加利西亚语                | 加利西亚             | 男性 |
| gl-ES-SabelaNeural                | 加利西亚语                | 加利西亚             | 女性 |
| gu-IN-DhwaniNeural                | 古吉拉特语                | 印度                 | 女性 |
| gu-IN-NiranjanNeural              | 古吉拉特语                | 印度                 | 男性 |
| he-IL-AvriNeural                  | 希伯来语                  | 以色列               | 男性 |
| he-IL-HilaNeural                  | 希伯来语                  | 以色列               | 女性 |
| hi-IN-MadhurNeural                | 印地语                    | 印度                 | 男性 |
| hi-IN-SwaraNeural                 | 印地语                    | 印度                 | 女性 |
| hr-HR-GabrijelaNeural             | 克罗地亚语                | 克罗地亚             | 女性 |
| hr-HR-SreckoNeural                | 克罗地亚语                | 克罗地亚             | 男性 |
| hu-HU-NoemiNeural                 | 匈牙利语                  | 匈牙利               | 女性 |
| hu-HU-TamasNeural                 | 匈牙利语                  | 匈牙利               | 男性 |
| id-ID-ArdiNeural                  | 印尼语                    | 印度尼西亚           | 男性 |
| id-ID-GadisNeural                 | 印尼语                    | 印度尼西亚           | 女性 |
| is-IS-GudrunNeural                | 冰岛语                    | 冰岛                 | 女性 |
| is-IS-GunnarNeural                | 冰岛语                    | 冰岛                 | 男性 |
| it-IT-DiegoNeural                 | 意大利语                  | 意大利               | 男性 |
| it-IT-ElsaNeural                  | 意大利语                  | 意大利               | 女性 |
| it-IT-GiuseppeNeural              | 意大利语                  | 意大利               | 男性 |
| it-IT-IsabellaNeural              | 意大利语                  | 意大利               | 女性 |
| ja-JP-KeitaNeural                 | 日语 日语                 | 日本                 | 男性 |
| ja-JP-NanamiNeural                | 日语 日语                 | 日本                 | 女性 |
| jv-ID-DimasNeural                 | 爪哇语                    | 印度尼西亚           | 男性 |
| jv-ID-SitiNeural                  | 爪哇语                    | 印度尼西亚           | 女性 |
| ka-GE-EkaNeural                   | 格鲁吉亚语                | 格鲁吉亚             | 女性 |
| ka-GE-GiorgiNeural                | 格鲁吉亚语                | 格鲁吉亚             | 男性 |
| kk-KZ-AigulNeural                 | 哈萨克语                  | 哈萨克斯坦           | 女性 |
| kk-KZ-DauletNeural                | 哈萨克语                  | 哈萨克斯坦           | 男性 |
| km-KH-PisethNeural                | 柬埔寨语                  | 柬埔寨               | 男性 |
| km-KH-SreymomNeural               | 柬埔寨语                  | 柬埔寨               | 女性 |
| kn-IN-GaganNeural                 | 卡纳达语                  | 印度                 | 男性 |
| kn-IN-SapnaNeural                 | 卡纳达语                  | 印度                 | 女性 |
| ko-KR-HyunsuNeural                | 韩语 韩语                 | 韩国                 | 男性 |
| ko-KR-InJoonNeural                | 韩语 韩语                 | 韩国                 | 男性 |
| ko-KR-SunHiNeural                 | 韩语 韩语                 | 韩国                 | 女性 |
| lo-LA-ChanthavongNeural           | 老挝语                    | 老挝                 | 男性 |
| lo-LA-KeomanyNeural               | 老挝语                    | 老挝                 | 女性 |
| lt-LT-LeonasNeural                | 立陶宛语                  | 立陶宛               | 男性 |
| lt-LT-OnaNeural                   | 立陶宛语                  | 立陶宛               | 女性 |
| lv-LV-EveritaNeural               | 拉脱维亚语                | 拉脱维亚             | 女性 |
| lv-LV-NilsNeural                  | 拉脱维亚语                | 拉脱维亚             | 男性 |
| mk-MK-AleksandarNeural            | 马其顿语                  | 北马其顿             | 男性 |
| mk-MK-MarijaNeural                | 马其顿语                  | 北马其顿             | 女性 |
| ml-IN-MidhunNeural                | 马拉雅拉姆语              | 印度                 | 男性 |
| ml-IN-SobhanaNeural               | 马拉雅拉姆语              | 印度                 | 女性 |
| mn-MN-BataaNeural                 | 蒙古语                    | 蒙古                 | 男性 |
| mn-MN-YesuiNeural                 | 蒙古语                    | 蒙古                 | 女性 |
| mr-IN-AarohiNeural                | 马拉地语                  | 印度                 | 女性 |
| mr-IN-ManoharNeural               | 马拉地语                  | 印度                 | 男性 |
| ms-MY-OsmanNeural                 | 马来语                    | 马来西亚             | 男性 |
| ms-MY-YasminNeural                | 马来语                    | 马来西亚             | 女性 |
| mt-MT-GraceNeural                 | 马耳他语                  | 马耳他               | 女性 |
| mt-MT-JosephNeural                | 马耳他语                  | 马耳他               | 男性 |
| my-MM-NilarNeural                 | 缅甸语                    | 缅甸                 | 女性 |
| my-MM-ThihaNeural                 | 缅甸语                    | 缅甸                 | 男性 |
| nb-NO-FinnNeural                  | 挪威语（书面）            | 挪威                 | 男性 |
| nb-NO-PernilleNeural              | 挪威语（书面）            | 挪威                 | 女性 |
| ne-NP-HemkalaNeural               | 尼泊尔语                  | 尼泊尔               | 女性 |
| ne-NP-SagarNeural                 | 尼泊尔语                  | 尼泊尔               | 男性 |
| nl-BE-ArnaudNeural                | 荷兰语                    | 比利时（弗拉芒语区） | 男性 |
| nl-BE-DenaNeural                  | 荷兰语                    | 比利时（弗拉芒语区） | 女性 |
| nl-NL-ColetteNeural               | 荷兰语                    | 荷兰                 | 女性 |
| nl-NL-FennaNeural                 | 荷兰语                    | 荷兰                 | 女性 |
| nl-NL-MaartenNeural               | 荷兰语                    | 荷兰                 | 男性 |
| pl-PL-MarekNeural                 | 波兰语                    | 波兰                 | 男性 |
| pl-PL-ZofiaNeural                 | 波兰语                    | 波兰                 | 女性 |
| ps-AF-GulNawazNeural              | 普什图语                  | 阿富汗               | 男性 |
| ps-AF-LatifaNeural                | 普什图语                  | 阿富汗               | 女性 |
| pt-BR-AntonioNeural               | 葡萄牙语                  | 巴西                 | 男性 |
| pt-BR-FranciscaNeural             | 葡萄牙语                  | 巴西                 | 女性 |
| pt-BR-ThalitaNeural               | 葡萄牙语                  | 巴西                 | 女性 |
| pt-PT-DuarteNeural                | 葡萄牙语                  | 葡萄牙               | 男性 |
| pt-PT-RaquelNeural                | 葡萄牙语                  | 葡萄牙               | 女性 |
| ro-RO-AlinaNeural                 | 罗马尼亚语                | 罗马尼亚             | 女性 |
| ro-RO-EmilNeural                  | 罗马尼亚语                | 罗马尼亚             | 男性 |
| ru-RU-DmitryNeural                | 俄语                      | 俄罗斯               | 男性 |
| ru-RU-SvetlanaNeural              | 俄语                      | 俄罗斯               | 女性 |
| si-LK-SameeraNeural               | 辛哈拉语                  | 斯里兰卡             | 男性 |
| si-LK-ThiliniNeural               | 辛哈拉语                  | 斯里兰卡             | 女性 |
| sk-SK-LukasNeural                 | 斯洛伐克语                | 斯洛伐克             | 男性 |
| sk-SK-ViktoriaNeural              | 斯洛伐克语                | 斯洛伐克             | 女性 |
| sl-SI-PetraNeural                 | 斯洛文尼亚语              | 斯洛文尼亚           | 女性 |
| sl-SI-RokNeural                   | 斯洛文尼亚语              | 斯洛文尼亚           | 男性 |
| so-SO-MuuseNeural                 | 索马里语                  | 索马里               | 男性 |
| so-SO-UbaxNeural                  | 索马里语                  | 索马里               | 女性 |
| sq-AL-AnilaNeural                 | 阿尔巴尼亚语              | 阿尔巴尼亚           | 女性 |
| sq-AL-IlirNeural                  | 阿尔巴尼亚语              | 阿尔巴尼亚           | 男性 |
| sr-RS-NicholasNeural              | 塞尔维亚语                | 塞尔维亚             | 男性 |
| sr-RS-SophieNeural                | 塞尔维亚语                | 塞尔维亚             | 女性 |
| su-ID-JajangNeural                | 巽他语                    | 印度尼西亚           | 男性 |
| su-ID-TutiNeural                  | 巽他语                    | 印度尼西亚           | 女性 |
| sv-SE-MattiasNeural               | 瑞典语                    | 瑞典                 | 男性 |
| sv-SE-SofieNeural                 | 瑞典语                    | 瑞典                 | 女性 |
| sw-KE-RafikiNeural                | 斯瓦希里语                | 肯尼亚               | 男性 |
| sw-KE-ZuriNeural                  | 斯瓦希里语                | 肯尼亚               | 女性 |
| sw-TZ-DaudiNeural                 | 斯瓦希里语                | 坦桑尼亚             | 男性 |
| sw-TZ-RehemaNeural                | 斯瓦希里语                | 坦桑尼亚             | 女性 |
| ta-IN-PallaviNeural               | 泰米尔语                  | 印度                 | 女性 |
| ta-IN-ValluvarNeural              | 泰米尔语                  | 印度                 | 男性 |
| ta-LK-KumarNeural                 | 泰米尔语                  | 斯里兰卡             | 男性 |
| ta-LK-SaranyaNeural               | 泰米尔语                  | 斯里兰卡             | 女性 |
| ta-MY-KaniNeural                  | 泰米尔语                  | 马来西亚             | 女性 |
| ta-MY-SuryaNeural                 | 泰米尔语                  | 马来西亚             | 男性 |
| ta-SG-AnbuNeural                  | 泰米尔语                  | 新加坡               | 男性 |
| ta-SG-VenbaNeural                 | 泰米尔语                  | 新加坡               | 女性 |
| te-IN-MohanNeural                 | 泰卢固语                  | 印度                 | 男性 |
| te-IN-ShrutiNeural                | 泰卢固语                  | 印度                 | 女性 |
| th-TH-NiwatNeural                 | 泰语                      | 泰国                 | 男性 |
| th-TH-PremwadeeNeural             | 泰语                      | 泰国                 | 女性 |
| tr-TR-AhmetNeural                 | 土耳其语                  | 土耳其               | 男性 |
| tr-TR-EmelNeural                  | 土耳其语                  | 土耳其               | 女性 |
| uk-UA-OstapNeural                 | 乌克兰语                  | 乌克兰               | 男性 |
| uk-UA-PolinaNeural                | 乌克兰语                  | 乌克兰               | 女性 |
| ur-IN-GulNeural                   | 乌尔都语                  | 印度                 | 女性 |
| ur-IN-SalmanNeural                | 乌尔都语                  | 印度                 | 男性 |
| ur-PK-AsadNeural                  | 乌尔都语                  | 巴基斯坦             | 男性 |
| ur-PK-UzmaNeural                  | 乌尔都语                  | 巴基斯坦             | 女性 |
| uz-UZ-MadinaNeural                | 乌兹别克语                | 乌兹别克斯坦         | 女性 |
| uz-UZ-SardorNeural                | 乌兹别克语                | 乌兹别克斯坦         | 男性 |
| vi-VN-HoaiMyNeural                | 越南语                    | 越南                 | 女性 |
| vi-VN-NamMinhNeural               | 越南语                    | 越南                 | 男性 |
| zh-CN-XiaoxiaoNeural              | 汉语（简体中文） 普通话   | 中国                 | 女性 |
| zh-CN-XiaoyiNeural                | 汉语（简体中文） 普通话   | 中国                 | 女性 |
| zh-CN-YunjianNeural               | 汉语（简体中文） 普通话   | 中国                 | 男性 |
| zh-CN-YunxiNeural                 | 汉语（简体中文） 普通话   | 中国                 | 男性 |
| zh-CN-YunxiaNeural                | 汉语（简体中文） 普通话   | 中国                 | 男性 |
| zh-CN-YunyangNeural               | 汉语（简体中文） 普通话   | 中国                 | 男性 |
| zh-CN-liaoning-XiaobeiNeural      | 汉语（简体中文） 辽宁方言 | 中国                 | 女性 |
| zh-CN-shaanxi-XiaoniNeural        | 汉语（简体中文） 陕西方言 | 中国                 | 女性 |
| zh-HK-HiuGaaiNeural               | 汉语（繁体中文） 粤语     | 香港                 | 女性 |
| zh-HK-HiuMaanNeural               | 汉语（繁体中文） 粤语     | 香港                 | 女性 |
| zh-HK-WanLungNeural               | 汉语（繁体中文） 粤语     | 香港                 | 男性 |
| zh-TW-HsiaoChenNeural             | 汉语（繁体中文）          | 台湾                 | 女性 |
| zh-TW-HsiaoYuNeural               | 汉语（繁体中文）          | 台湾                 | 女性 |
| zh-TW-YunJheNeural                | 汉语（繁体中文）          | 台湾                 | 男性 |
| zu-ZA-ThandoNeural                | 祖鲁语                    | 南非                 | 女性 |
| zu-ZA-ThembaNeural                | 祖鲁语                    | 南非                 | 男性 |
