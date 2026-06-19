# SecArena — 网络安全挑战平台

一个集合渗透测试、密码破解、恶意软件分析、应急响应的沉浸式安全挑战平台。通过游戏化的方式学习网络安全知识。

## 🎮 游戏列表

| 游戏 | 英文名 | 类型 | 说明 |
|------|--------|------|------|
| 🔐 密码破解挑战 | CodeBreaker | 解谜 | 凯撒密码、维吉尼亚、AES、RSA |
| ⚡ 渗透测试模拟器 | CyberHack | 终端交互 | 信息收集、漏洞利用、权限提升 |
| 🕵️ 暗网交易追踪 | DarkTrace | 调查分析 | 区块链分析与链上追踪 |
| 🛡️ 网络安全塔防 | CyberDefense | 塔防策略 | 部署安全设备抵御攻击 |
| 🔍 日志分析挑战 | LogTracer | 问答分析 | SOC 分析师实战 |
| 🔬 恶意软件分析 | MalwareLab | 问答分析 | 静态分析 + 沙箱行为 |
| 🚨 安全事件应急响应 | IncidentResp | 问答分析 | 事件分级与处置流程 |
| 🏗️ 网络攻防沙盒 | NetBuilder | 拖拽搭建 | 自由搭建拓扑 + 攻防模拟 |
| 🗺️ 黑客探险 | HackQuest | RPG 探险 | 地图探索 + 工具收集 + 多路径 |

## 🚀 快速开始

### 直接打开

用浏览器打开 `index.html` 即可开始。

### Docker 部署

```bash
docker-compose up -d
# 访问 http://localhost:8080
```

### Nginx 部署

```bash
cp -r * /var/www/html/secgame/
# 配置 nginx 访问 /var/www/html/secgame/
```

## 📁 项目结构

```
secGame/
├── index.html          # 首页入口
├── cyberhack/          # 渗透测试模拟器
├── cipher/             # 密码破解挑战
├── darkweb/            # 暗网交易追踪
├── defense/            # 网络安全塔防
├── forensics/          # 日志分析挑战
├── malware/            # 恶意软件分析
├── incident/           # 安全事件应急响应
├── netbuilder/         # 网络攻防沙盒
├── hackquest/          # 黑客探险
├── Dockerfile          # Docker 构建文件
├── docker-compose.yml  # Docker Compose 配置
└── README.md
```

## 🎯 特点

- **纯前端**：HTML + CSS + JS，无需后端，浏览器即可体验
- **轻量级**：无框架依赖，加载速度快
- **知识驱动**：每关都有知识卡片讲解安全概念
- **渐进难度**：从入门到进阶，适合不同水平的学习者
- **即时反馈**：答题即时反馈 + 星级评价 + 进度保存

## ⚠️ 免责声明

本平台所有内容仅供学习交流，请勿用于非法用途。
