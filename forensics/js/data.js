/**
 * data.js - LogTracer 日志分析挑战 关卡数据
 */

var FORENSICS_LEVELS = [
  // ===== 关卡 1: SSH 暴力破解 =====
  {
    id: 1,
    name: 'SSH 暴力破解',
    enName: 'SSH Brute Force',
    icon: '🔑',
    difficulty: '简单',
    knowledge: {
      title: '📖 SSH 暴力破解',
      body: '攻击者通过自动化工具尝试大量用户名/密码组合来破解 SSH 登录。' +
        '防御方法包括：禁用密码登录改用密钥、配置 fail2ban 封禁 IP、' +
        '修改默认端口、限制登录尝试次数。'
    },
    logs: [
      { time: '03:12:01', src: 'sshd', level: 'info', text: 'Accepted publickey for admin from 192.168.1.10 port 52413 ssh2' },
      { time: '03:14:22', src: 'sshd', level: 'warn', text: 'Failed password for root from 45.33.32.156 port 44231 ssh2' },
      { time: '03:14:24', src: 'sshd', level: 'warn', text: 'Failed password for root from 45.33.32.156 port 44232 ssh2' },
      { time: '03:14:26', src: 'sshd', level: 'warn', text: 'Failed password for root from 45.33.32.156 port 44233 ssh2' },
      { time: '03:14:28', src: 'sshd', level: 'warn', text: 'Failed password for admin from 45.33.32.156 port 44234 ssh2' },
      { time: '03:14:30', src: 'sshd', level: 'warn', text: 'Failed password for admin from 45.33.32.156 port 44235 ssh2' },
      { time: '03:14:32', src: 'sshd', level: 'error', text: 'Failed password for invalid user test from 45.33.32.156 port 44236 ssh2' },
      { time: '03:14:34', src: 'sshd', level: 'error', text: 'Failed password for invalid user guest from 45.33.32.156 port 44237 ssh2' },
      { time: '03:14:36', src: 'sshd', level: 'error', text: 'Failed password for invalid user oracle from 45.33.32.156 port 44238 ssh2' },
      { time: '03:15:01', src: 'sshd', level: 'info', text: 'Received disconnect from 45.33.32.156 port 44231:11: Bye Bye' },
      { time: '03:20:15', src: 'sshd', level: 'info', text: 'Accepted publickey for deploy from 192.168.1.20 port 53102 ssh2' },
      { time: '04:02:11', src: 'sshd', level: 'warn', text: 'Failed password for root from 45.33.32.156 port 55101 ssh2' },
      { time: '04:02:13', src: 'sshd', level: 'warn', text: 'Failed password for root from 45.33.32.156 port 55102 ssh2' },
      { time: '04:02:15', src: 'sshd', level: 'error', text: 'Failed password for root from 45.33.32.156 port 55103 ssh2' },
      { time: '04:05:30', src: 'fail2ban', level: 'info', text: 'Ban 45.33.32.156' }
    ],
    questions: [
      {
        q: '这些日志显示了什么类型的攻击？',
        options: ['SQL 注入攻击', 'SSH 暴力破解', 'XSS 跨站脚本', 'DDoS 分布式拒绝服务'],
        answer: 1,
        explain: '日志中同一 IP 反复尝试不同用户名和密码登录 SSH，是典型的暴力破解行为。'
      },
      {
        q: '攻击者的 IP 地址是什么？',
        options: ['192.168.1.10', '192.168.1.20', '45.33.32.156', '55103'],
        answer: 2,
        explain: '所有失败登录都来自 45.33.32.156，而 192.168.1.10 和 .20 是正常的管理员登录。'
      },
      {
        q: '攻击者尝试了哪些用户名？',
        options: ['仅 root', 'root 和 admin', 'root、admin、test、guest、oracle', '无法确定'],
        answer: 2,
        explain: '日志中依次出现了 root、admin、test、guest、oracle 等用户名的登录尝试。'
      },
      {
        q: '以下哪项是最有效的防御措施？',
        options: ['安装杀毒软件', '禁用密码登录，仅允许密钥认证', '增加密码复杂度', '关闭服务器电源'],
        answer: 1,
        explain: '禁用密码登录改用 SSH 密钥认证可以从根本上防止暴力破解，因为攻击者无法通过猜测密码进入。'
      }
    ]
  },

  // ===== 关卡 2: SQL 注入 =====
  {
    id: 2,
    name: 'SQL 注入攻击',
    enName: 'SQL Injection',
    icon: '💉',
    difficulty: '简单',
    knowledge: {
      title: '📖 SQL 注入攻击',
      body: 'SQL 注入是通过在用户输入中插入恶意 SQL 语句来操纵数据库的攻击方式。' +
        '防御方法：使用参数化查询/预编译语句、输入验证与过滤、' +
        '最小权限原则、使用 ORM 框架、部署 WAF。'
    },
    logs: [
      { time: '10:01:12', src: 'nginx', level: 'info', text: 'GET /login HTTP/1.1 200 "192.168.1.5"' },
      { time: '10:01:15', src: 'app', level: 'info', text: 'User login attempt: username=admin' },
      { time: "10:02:33", src: 'nginx', level: 'info', text: 'GET /search?q=shoes HTTP/1.1 200 "10.0.0.15"' },
      { time: "10:03:01", src: 'nginx', level: 'warn', text: "GET /search?q=1'+OR+'1'%3D'1 HTTP/1.1 200 \"203.0.113.50\"" },
      { time: "10:03:02", src: 'app', level: 'error', text: "SQL error: You have an error in your SQL syntax near ''1' OR '1'='1' LIMIT 10' at line 1" },
      { time: "10:03:45", src: 'nginx', level: 'warn', text: "GET /search?q='+UNION+SELECT+username,password+FROM+users-- HTTP/1.1 200 \"203.0.113.50\"" },
      { time: "10:03:46", src: 'app', level: 'error', text: "SQL error: The used SELECT statements have a different number of columns" },
      { time: "10:04:12", src: 'nginx', level: 'warn', text: "GET /search?q='+UNION+SELECT+1,username,password,4+FROM+users-- HTTP/1.1 200 \"203.0.113.50\"" },
      { time: "10:04:13", src: 'app', level: 'error', text: "Query returned 156 rows — possible data extraction" },
      { time: "10:05:00", src: 'nginx', level: 'warn', text: "GET /search?q='+UNION+SELECT+1,table_name,3,4+FROM+information_schema.tables-- HTTP/1.1 200 \"203.0.113.50\"" },
      { time: "10:05:30", src: 'waf', level: 'error', text: 'BLOCKED: SQL injection pattern detected from 203.0.113.50 — rule id 942100' },
      { time: '10:06:00', src: 'nginx', level: 'info', text: 'GET /index.html HTTP/1.1 200 "192.168.1.5"' }
    ],
    questions: [
      {
        q: '攻击者使用了什么攻击手法？',
        options: ['XSS 跨站脚本', 'SQL 注入', 'CSRF 跨站请求伪造', '目录遍历'],
        answer: 1,
        explain: "URL 中包含 ' OR '1'='1 和 UNION SELECT 等 SQL 语句片段，且 app 层报出 SQL 语法错误，这是典型的 SQL 注入。"
      },
      {
        q: '攻击者的 IP 是哪个？',
        options: ['192.168.1.5', '10.0.0.15', '203.0.113.50', '无法确定'],
        answer: 2,
        explain: '所有恶意请求都来自 203.0.113.50，其他 IP 的请求都是正常的。'
      },
      {
        q: '攻击者最终的目标是什么？',
        options: ['让服务器崩溃', '获取数据库中的用户数据', '修改网页内容', '发起 DDoS'],
        answer: 1,
        explain: '攻击者使用 UNION SELECT 尝试提取 users 表中的 username 和 password，以及 information_schema 中的表结构信息。'
      },
      {
        q: '以下哪项是最根本的防御措施？',
        options: ['安装更多内存', '使用参数化查询（预编译语句）', '限制访问频率', '更换数据库'],
        answer: 1,
        explain: '参数化查询可以确保用户输入始终被当作数据而非 SQL 代码执行，从根本上防止 SQL 注入。'
      }
    ]
  },

  // ===== 关卡 3: Web Shell 植入 =====
  {
    id: 3,
    name: 'WebShell 植入',
    enName: 'Web Shell Upload',
    icon: '🐚',
    difficulty: '中等',
    knowledge: {
      title: '📖 WebShell 植入',
      body: 'WebShell 是攻击者上传到 Web 服务器的恶意脚本文件，通过浏览器访问即可执行系统命令。' +
        '常见植入途径：文件上传漏洞、RCE 漏洞、SQL 写入文件。' +
        '防御：严格限制上传文件类型、禁止上传目录执行权限、文件完整性监控、定期扫描 Web 目录。'
    },
    logs: [
      { time: '14:20:01', src: 'nginx', level: 'info', text: 'POST /upload HTTP/1.1 200 "198.51.100.23"' },
      { time: '14:20:02', src: 'app', level: 'info', text: 'File uploaded: avatar_2024.jpg (size: 45KB)' },
      { time: '14:21:15', src: 'nginx', level: 'info', text: 'POST /upload HTTP/1.1 200 "198.51.100.23"' },
      { time: '14:21:16', src: 'app', level: 'warn', text: 'File uploaded: shell.php.jpg (size: 12KB) — double extension detected' },
      { time: '14:22:00', src: 'nginx', level: 'warn', text: 'GET /uploads/shell.php.jpg?cmd=whoami HTTP/1.1 200 "198.51.100.23"' },
      { time: '14:22:01', src: 'app', level: 'error', text: 'PHP executed in uploads directory — possible webshell' },
      { time: '14:22:30', src: 'nginx', level: 'warn', text: 'GET /uploads/shell.php.jpg?cmd=cat+/etc/passwd HTTP/1.1 200 "198.51.100.23"' },
      { time: '14:22:31', src: 'app', level: 'error', text: 'Sensitive file accessed: /etc/passwd' },
      { time: '14:23:10', src: 'nginx', level: 'warn', text: 'GET /uploads/shell.php.jpg?cmd=uname+-a HTTP/1.1 200 "198.51.100.23"' },
      { time: '14:24:00', src: 'nginx', level: 'warn', text: 'GET /uploads/shell.php.jpg?cmd=find+/+-name+*.conf HTTP/1.1 200 "198.51.100.23"' },
      { time: '14:25:15', src: 'nginx', level: 'error', text: 'GET /uploads/shell.php.jpg?cmd=cat+/var/www/html/config.php HTTP/1.1 200 "198.51.100.23"' },
      { time: '14:25:16', src: 'app', level: 'error', text: 'Database credentials file accessed by webshell' },
      { time: '14:30:00', src: 'nginx', level: 'info', text: 'GET /index.html HTTP/1.1 200 "192.168.1.5"' }
    ],
    questions: [
      {
        q: '攻击者通过什么方式植入了恶意文件？',
        options: ['SQL 注入写入', '文件上传漏洞', '暴力破解 SSH', 'XSS 攻击'],
        answer: 1,
        explain: '攻击者通过 /upload 接口上传了名为 shell.php.jpg 的文件，利用双扩展名绕过了文件类型检查。'
      },
      {
        q: '恶意文件的名称是什么？',
        options: ['avatar_2024.jpg', 'shell.php.jpg', 'config.php', 'passwd'],
        answer: 1,
        explain: 'shell.php.jpg 是一个双扩展名文件，服务器可能将其作为 PHP 执行，日志中也确认了 "PHP executed in uploads directory"。'
      },
      {
        q: '攻击者通过 WebShell 执行了哪些操作？',
        options: ['仅查看了系统信息', '查看系统信息并读取敏感配置文件', '删除了数据库', '没有执行任何操作'],
        answer: 1,
        explain: '攻击者依次执行了 whoami、cat /etc/passwd、uname -a、find 配置文件，最终读取了数据库配置文件。'
      },
      {
        q: '以下哪项是最关键的防御措施？',
        options: ['禁止上传目录的脚本执行权限', '增加服务器内存', '修改 SSH 端口', '安装更多 SSL 证书'],
        answer: 0,
        explain: '禁止上传目录（uploads/）的脚本执行权限，即使攻击者上传了 WebShell 也无法执行，这是最直接有效的防御。'
      }
    ]
  },

  // ===== 关卡 4: DDoS 攻击 =====
  {
    id: 4,
    name: 'DDoS 流量攻击',
    enName: 'DDoS Flood Attack',
    icon: '🌊',
    difficulty: '中等',
    knowledge: {
      title: '📖 DDoS 攻击',
      body: 'DDoS（分布式拒绝服务）攻击通过大量受控主机同时向目标发送请求，耗尽服务器资源使其无法正常服务。' +
        '常见类型：SYN Flood、UDP Flood、HTTP Flood、Slowloris。' +
        '防御：使用 CDN/高防 IP、配置速率限制、启用 SYN Cookie、部署 DDoS 清洗设备。'
    },
    logs: [
      { time: '09:00:01', src: 'nginx', level: 'info', text: 'GET /api/products HTTP/1.1 200 "203.0.113.10" — 45ms' },
      { time: '09:00:02', src: 'nginx', level: 'info', text: 'GET /index.html HTTP/1.1 200 "198.51.100.5" — 12ms' },
      { time: '09:05:00', src: 'nginx', level: 'warn', text: 'GET / HTTP/1.1 200 "45.33.32.1" — 1200ms' },
      { time: '09:05:00', src: 'nginx', level: 'warn', text: 'GET / HTTP/1.1 200 "45.33.32.2" — 1180ms' },
      { time: '09:05:01', src: 'nginx', level: 'warn', text: 'GET / HTTP/1.1 200 "45.33.32.3" — 1350ms' },
      { time: '09:05:01', src: 'nginx', level: 'error', text: 'upstream timed out (110: Connection timed out)' },
      { time: '09:05:02', src: 'nginx', level: 'error', text: 'GET / HTTP/1.1 503 "45.33.32.4"' },
      { time: '09:05:02', src: 'nginx', level: 'error', text: 'GET / HTTP/1.1 503 "45.33.32.5"' },
      { time: '09:05:03', src: 'nginx', level: 'error', text: 'GET / HTTP/1.1 503 "45.33.32.6"' },
      { time: '09:05:03', src: 'kernel', level: 'error', text: 'nf_conntrack: table full, dropping packet' },
      { time: '09:05:10', src: 'nginx', level: 'error', text: 'worker_connections are not enough, reusing connections' },
      { time: '09:05:15', src: 'nginx', level: 'error', text: 'GET /api/products HTTP/1.1 503 "203.0.113.10"' },
      { time: '09:05:20', src: 'monitor', level: 'error', text: 'CPU usage: 98% | Memory: 95% | Connections: 65535/65535' },
      { time: '09:10:00', src: 'cdn', level: 'info', text: 'DDoS mitigation activated — absorbing traffic via scrubbing center' }
    ],
    questions: [
      {
        q: '服务器出现了什么问题？',
        options: ['硬盘满了', '遭受 DDoS 攻击', '数据库崩溃', 'DNS 解析失败'],
        answer: 1,
        explain: '大量来自 45.33.32.x 网段的请求同时涌入，服务器响应从正常变为超时再到 503，连接数达到上限，这是典型的 DDoS 攻击。'
      },
      {
        q: '攻击流量的来源网段是？',
        options: ['192.168.1.x', '203.0.113.x', '45.33.32.x', '198.51.100.x'],
        answer: 2,
        explain: '所有攻击请求来自 45.33.32.1 ~ 45.33.32.6 等大量 IP，属于同一网段的分布式攻击。'
      },
      {
        q: '"nf_conntrack: table full" 说明了什么？',
        options: ['磁盘空间不足', '网络连接跟踪表已满，无法处理新连接', 'DNS 缓存溢出', '日志文件过大'],
        answer: 1,
        explain: 'nf_conntrack 是 Linux 内核的连接跟踪模块，table full 表示并发连接数已达上限，新数据包被丢弃。'
      },
      {
        q: '最有效的应急响应措施是？',
        options: ['重启服务器', '启用 CDN/高防 IP 进行流量清洗', '修改数据库密码', '关闭防火墙'],
        answer: 1,
        explain: '日志最后显示 CDN 的清洗中心已介入吸收攻击流量，这是应对大流量 DDoS 的标准做法。'
      }
    ]
  },

  // ===== 关卡 5: 横向移动 =====
  {
    id: 5,
    name: '内网横向移动',
    enName: 'Lateral Movement',
    icon: '🕸️',
    difficulty: '困难',
    knowledge: {
      title: '📖 横向移动',
      body: '横向移动是攻击者在攻陷一台内网主机后，利用内网信任关系和凭证继续攻击其他主机的技术。' +
        '常见手法：Pass-the-Hash、PsExec、WMI、SMB 漏洞利用、RDP 跳板。' +
        '防御：网络分段隔离、最小权限原则、监控内网异常登录、启用 LAPS 管理本地密码、部署 EDR。'
    },
    logs: [
      { time: '02:10:00', src: 'sysmon', level: 'info', text: 'EventID=1: Process Create — C:\\Windows\\Temp\\svchost.exe (PID: 4812)' },
      { time: '02:10:05', src: 'sysmon', level: 'warn', text: 'EventID=3: Network Connect — svchost.exe → 10.0.0.15:445 (SMB)' },
      { time: '02:10:10', src: 'security', level: 'warn', text: 'EventID=4624: Logon Type=3 — NTLM auth from 10.0.0.11 to 10.0.0.15 as SYSTEM' },
      { time: '02:10:12', src: 'security', level: 'warn', text: 'EventID=4624: Logon Type=3 — NTLM auth from 10.0.0.15 to 10.0.0.20 as SYSTEM' },
      { time: '02:10:15', src: 'sysmon', level: 'error', text: 'EventID=1: Process Create — cmd.exe /c whoami (on 10.0.0.15, parent: svchost.exe)' },
      { time: '02:10:20', src: 'sysmon', level: 'error', text: 'EventID=1: Process Create — net group "Domain Admins" /domain (on 10.0.0.15)' },
      { time: '02:10:30', src: 'security', level: 'error', text: 'EventID=4672: Special privileges assigned — SeDebugPrivilege to SYSTEM on 10.0.0.15' },
      { time: '02:11:00', src: 'security', level: 'warn', text: 'EventID=4624: Logon Type=3 — NTLM auth from 10.0.0.15 to 10.0.0.20 as Administrator' },
      { time: '02:11:05', src: 'sysmon', level: 'error', text: 'EventID=1: Process Create — C:\\Windows\\Temp\\mimikatz.exe (on 10.0.0.20)' },
      { time: '02:11:10', src: 'sysmon', level: 'error', text: 'EventID=10: Process Access — lsass.exe accessed by mimikatz.exe (on 10.0.0.20)' },
      { time: '02:11:30', src: 'security', level: 'error', text: 'EventID=4624: Logon Type=3 — NTLM auth from 10.0.0.20 to 10.0.0.1 (Domain Controller)' },
      { time: '02:12:00', src: 'sysmon', level: 'error', text: 'EventID=1: Process Create — ntdsutil.exe "ac i ntds" (on 10.0.0.1) — DCSync detected!' }
    ],
    questions: [
      {
        q: '攻击者使用了什么技术进行横向移动？',
        options: ['SQL 注入', 'Pass-the-Hash / NTLM 中继', 'XSS 攻击', 'DNS 劫持'],
        answer: 1,
        explain: '日志中多次出现 NTLM 类型的 Type=3 网络登录，且攻击者运行了 mimikatz 提取凭证，这是典型的 Pass-the-Hash 攻击链。'
      },
      {
        q: '攻击者的入侵路径是怎样的？',
        options: [
          '10.0.0.11 → 10.0.0.15 → 10.0.0.20 → 10.0.0.1(DC)',
          '10.0.0.15 → 10.0.0.11 → 10.0.0.1',
          '10.0.0.1 → 10.0.0.20 → 10.0.0.15',
          '10.0.0.11 → 10.0.0.1'
        ],
        answer: 0,
        explain: '攻击从 10.0.0.11 开始（svchost.exe 发起 SMB 连接），跳到 .15，再到 .20，最终到达域控 10.0.0.1。'
      },
      {
        q: '"mimikatz.exe 访问 lsass.exe" 意味着什么？',
        options: ['正常系统操作', '正在从内存中提取 Windows 登录凭证', '正在扫描端口', '正在清理日志'],
        answer: 1,
        explain: 'mimikatz 通过访问 lsass.exe（本地安全认证子系统）进程内存来提取缓存的 NTLM 哈希和明文密码。'
      },
      {
        q: '"DCSync detected" 意味着攻击的最终目标是什么？',
        options: ['窃取网站源码', '获取域内所有用户的密码哈希', '加密文件勒索', '删除域控制器'],
        answer: 1,
        explain: 'DCSync 是通过模拟域控复制协议来导出所有域用户密码哈希的技术，一旦成功，攻击者等于掌握了整个域的钥匙。'
      }
    ]
  },

  // ===== 关卡 6: 数据外泄 =====
  {
    id: 6,
    name: '数据外泄追踪',
    enName: 'Data Exfiltration',
    icon: '🕵️',
    difficulty: '困难',
    knowledge: {
      title: '📖 数据外泄',
      body: '数据外泄是攻击者将窃取的敏感数据从目标网络传输到外部的手法。' +
        '常见通道：DNS 隧道、HTTPS 加密传输、云存储上传、邮件附件、ICMP 隐蔽通道。' +
        '防御：DLP 数据防泄漏系统、出口流量审计、DNS 查询监控、异常大文件传输告警。'
    },
    logs: [
      { time: '22:00:01', src: 'dns', level: 'info', text: 'Query: api.normal-site.com — Type A — Response: 198.51.100.10' },
      { time: '22:05:00', src: 'dns', level: 'warn', text: 'Query: dGhyZWUtc2VjcmV0LXBsYW4udHh0.evil-cdn.com — Type TXT — length: 256' },
      { time: '22:05:30', src: 'dns', level: 'warn', text: 'Query: ZGF0YWJhc2UtcGFzc3dvcmRzLnR4dA.evil-cdn.com — Type TXT — length: 256' },
      { time: '22:06:00', src: 'dns', level: 'warn', text: 'Query: Y3VzdG9tZXItZGF0YS5jc3Y.evil-cdn.com — Type TXT — length: 256' },
      { time: '22:07:00', src: 'firewall', level: 'info', text: 'ALLOW: 10.0.0.50:443 → 198.51.100.10:443 (HTTPS) — 2.3MB transferred' },
      { time: '22:08:00', src: 'firewall', level: 'warn', text: 'ALLOW: 10.0.0.50:443 → 198.51.100.10:443 (HTTPS) — 15.7MB transferred' },
      { time: '22:09:00', src: 'firewall', level: 'warn', text: 'ALLOW: 10.0.0.50:443 → 198.51.100.10:443 (HTTPS) — 28.4MB transferred' },
      { time: '22:09:30', src: 'dlp', level: 'error', text: 'ALERT: Sensitive pattern detected in outbound traffic — SSN format (xxx-xx-xxxx)' },
      { time: '22:10:00', src: 'dlp', level: 'error', text: 'ALERT: Credit card pattern detected in outbound traffic — Luhn check passed' },
      { time: '22:10:15', src: 'endpoint', level: 'error', text: 'Process datacollector.exe created archive: backup_2024.tar.gz (45MB)' },
      { time: '22:10:30', src: 'endpoint', level: 'error', text: 'datacollector.exe → 198.51.100.10:443 — HTTPS upload initiated' },
      { time: '22:15:00', src: 'firewall', level: 'error', text: 'BLOCKED: 10.0.0.50 → 198.51.100.10 — DLP policy triggered, connection terminated' }
    ],
    questions: [
      {
        q: '攻击者使用了哪些数据外泄通道？',
        options: ['仅 DNS 隧道', '仅 HTTPS 传输', 'DNS 隧道 + HTTPS 加密传输', '邮件附件'],
        answer: 2,
        explain: '日志中既有 DNS TXT 记录查询（子域名包含 Base64 编码数据），也有大量 HTTPS 上传流量，攻击者同时使用了两种通道。'
      },
      {
        q: 'DNS 查询中子域名为什么是乱码？',
        options: ['DNS 服务器故障', '子域名经过 Base64 编码，用于隐蔽传输数据', '正常的 CDN 解析', '浏览器缓存错误'],
        answer: 1,
        explain: 'dGhyZWUtc2VjcmV0LXBsYW4udHh0 等是 Base64 编码字符串（解码后为 "three-secret-plan.txt" 等），攻击者通过 DNS 查询将数据编码在子域名中带出。'
      },
      {
        q: '被外泄的数据可能包含什么？',
        options: ['网站 HTML 文件', '用户 SSN、信用卡号等敏感信息', '操作系统日志', 'DNS 缓存'],
        answer: 1,
        explain: 'DLP 系统检测到了 SSN 格式和信用卡号格式的数据在出站流量中出现，说明外泄数据包含高度敏感的个人信息。'
      },
      {
        q: '最佳的长期防御方案是？',
        options: ['关闭所有 DNS 查询', '部署 DLP 数据防泄漏系统 + 出口流量审计', '禁止使用 HTTPS', '每天重启服务器'],
        answer: 1,
        explain: 'DLP 系统可以检测敏感数据的传输，出口流量审计可以发现异常的大文件上传和可疑 DNS 查询，两者结合是防御数据外泄的标准方案。'
      }
    ]
  }
];
