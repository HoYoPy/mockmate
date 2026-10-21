# MockMate · AI 智能面试教练

面向「2026 第九届传智杯 AI WEB 网页开发挑战赛」的参赛作品。候选人上传简历和目标岗位 JD，选择面试官风格，AI 以多轮对话方式进行追问，并生成结构化复盘报告。

## 一、项目介绍

**产品定位**：面向应届生的 AI 模拟面试训练与复盘工具。

**要解决的问题**：应届生缺少真实面试训练机会，不知道面试官会问什么、自己的回答差在哪、怎么针对性提升。

**核心方案**：候选人粘贴简历和目标岗位 JD，选择一个面试官风格（技术面 / HR 面 / 压力面），AI 以多轮对话方式进行追问，最后生成结构化复盘报告。

**核心能力**

- 多面试官人格：技术面、HR 面、压力面
- 流式多轮追问
- 向量检索（RAG）：TF-IDF 余弦相似度 + 关键词重排，检索题目与考察点并增强追问
- Agent 化面试流程：evaluate_answer / pick_next_question / finish_interview 工具调用，按“评估→选题→追问→收尾”推进
- 结构化复盘：多维度评分 + 能力雷达图 + 改进建议
- 多模态输入：简历文件上传解析（PDF/DOCX/TXT）+ JD 截图 OCR（端侧 Tesseract.js）
- 语音闭环：语音输入（Web Speech API）+ 面试官语音朗读（TTS）
- 基于 OpenAI 兼容接口，可切换 DeepSeek / 智谱 / 通义千问等模型

## 二、技术架构

```text
浏览器 (Next.js 前端)
   │  用户输入简历 / JD / 面试回答 / 语音
   ▼
Next.js App Router
   ├── POST /api/chat        对话接口
   └── POST /api/report      结构化复盘接口
   ▼
/api/chat 路由（Node.js）
   │  1. retrieveQuestions：根据简历 + JD 检索题库（RAG）
   │  2. buildSystemPrompt：注入面试官提示词 + 检索结果
   │  3. 调用 OpenAI 兼容大模型 API（stream: true）
   ▼
OpenAI 兼容接口（OpenAI / DeepSeek / 智谱 / 通义千问）
   │  流式返回 token / 返回结构化复盘 JSON
   ▼
ReadableStream 逐字渲染 + 能力雷达图展示
```

| 层 | 技术选型 |
|---|---|
| 前端框架 | Next.js 14（App Router）+ React 18 |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| AI 接入 | openai SDK（OpenAI 兼容接口） |
| 流式响应 | ReadableStream（SSE 式逐字输出） |
| 检索增强（RAG） | 内置题库 + 字符 n-gram TF-IDF 向量检索 + 关键词重排 |
| 结构化复盘 | JSON 多维度评分 + 雷达图 |
| 文档解析 | mammoth（DOCX）+ pdf-parse（PDF） |
| 端侧 OCR | tesseract.js（图片识别，免视觉模型） |
| 语音 | Web Speech API（输入）+ SpeechSynthesis（朗读） |
| 部署 | Vercel |

## 三、安装与运行

**环境要求**：Node.js 20+（见 `.nvmrc`）、npm。

**环境变量**

| 变量 | 必填 | 说明 |
|---|---|---|
| `OPENAI_API_KEY` | 是 | 大模型 API 密钥 |
| `OPENAI_BASE_URL` | 否 | 默认 `https://api.openai.com/v1`，DeepSeek/智谱等需替换 |
| `OPENAI_MODEL` | 否 | 默认 `gpt-4o-mini` |

**本地运行**

```bash
npm install
cp .env.example .env.local   # Windows PowerShell 用：Copy-Item .env.example .env.local
# 编辑 .env.local 填入 OPENAI_API_KEY
npm run dev
```

打开 http://localhost:3000。

**常用模型配置示例**

```ini
# DeepSeek
OPENAI_API_KEY=sk-你的key
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_MODEL=deepseek-chat
```

```ini
# 智谱 GLM
OPENAI_API_KEY=你的key
OPENAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
OPENAI_MODEL=glm-4-flash
```

## 四、目录结构

```text
mockmate/
├── app/
│   ├── api/chat/route.ts       # Agent 对话接口（工具调用 + RAG）
│   ├── api/parse-resume/route.ts # 简历文件解析接口
│   ├── api/report/route.ts     # 结构化复盘报告接口
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/interview/
│   ├── interview-app.tsx       # 面试客户端主界面
│   └── radar-chart.tsx         # 能力雷达图（SVG）
├── lib/
│   ├── ai/client.ts            # OpenAI 兼容客户端
│   ├── interview/
│   │   ├── prompts.ts          # 面试官系统提示词
│   │   ├── agent.ts            # 工具调用 Agent 循环
│   │   ├── report.ts           # 复盘报告构建与解析
│   │   └── types.ts            # 类型定义
│   └── rag/
│       ├── index.ts            # 检索入口（加载题库）
│       └── vector-retriever.ts # TF-IDF 向量检索
├── data/question-bank.json     # 结构化面试题库
├── types/pdf-parse.d.ts        # pdf-parse 类型声明
├── .env.example                # 环境变量模板（密钥不提交）
├── .nvmrc
└── package.json
```

## 五、MVP 功能清单

### P0（已实现，可演示）

- [x] 选择面试官风格：技术面 / HR 面 / 压力面
- [x] 输入简历文字与岗位 JD
- [x] 多轮对话式模拟面试（流式输出）
- [x] RAG 题库检索：根据简历 + 岗位检索高频面试题，增强追问
- [x] 结构化复盘：多维度评分 + 能力雷达图 + 改进建议
- [x] 语音输入（Web Speech API）+ 面试官语音朗读（TTS）
- [x] 重新开始 / 清空会话

### P1（冲奖优先实现）

- [x] 简历文件上传解析（PDF/DOCX/TXT）+ JD 截图 OCR（tesseract.js）
- [x] 向量化 RAG：字符 n-gram TF-IDF 向量检索 + 关键词重排（bge 语义 embedding 待接）
- [x] Agent 化追问策略：evaluate_answer / pick_next_question / finish_interview 工具调用
- [ ] 历史面试记录与成长曲线
- [ ] 用户登录与数据持久化

### P2（加分项）

- [ ] 岗位 JD 联网检索
- [ ] 群面模拟 / 多面试官角色
- [ ] 浏览器端本地模型（Transformers.js / WebGPU）
- [ ] 内容安全过滤与隐私保护说明

## 六、团队信息

- 学校：广州软件学院
- 团队成员：
  - 成员 ：王煜 2640153219
- 指导老师：许鑫 学习导师 广州软件学院

## 七、部署到 GitHub 与 Vercel

本项目带服务端 API 接口，不能部署到 GitHub Pages（纯静态）。推荐 Vercel，免费且支持流式接口。

### 1. 上传 GitHub

在 GitHub 新建 **Public** 空仓库（不要勾选自动生成 README），然后：

```bash
git init
git add .
git commit -m "feat: AI 智能面试教练骨架"
git branch -M main
git remote add origin https://github.com/你的用户名/mockmate.git
git push -u origin main
```

### 2. 部署 Vercel

1. vercel.com 用 GitHub 登录 → Add New → Project → 导入 `mockmate` 仓库。
2. 框架自动识别为 Next.js，直接 Deploy。
3. 在 Project Settings → Environment Variables 添加 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL`。
4. Redeploy 后打开 `https://你的项目.vercel.app` 即可在线运行。

### 3. 注意事项

- API 密钥只放 Vercel 环境变量，不要提交到仓库。
- 部署后的在线地址可作为 Web 赛道「在线演示」加分项写进技术文档。
