/**
 * data.js - IncidentResp 安全事件应急响应 关卡数据
 */

var INCIDENT_LEVELS = [
  // ===== 关卡 1：异常登录 =====
  {
    id: 1,
    name: '异常登录',
    enName: 'Suspicious Login',
    icon: '🔑',
    difficulty: '简单',
    alert: {
      title: 'SSH 暴力破解告警',
      time: '2026-06-15 03:24:17',
      source: 'IDS / Fail2Ban',
      severity: 'P3',
      target: 'web-server-01 (192.168.1.10)',
      desc: '检测到来自 203.0.113.50 的大量 SSH 登录失败尝试',
    },
    timeline: [
      { time: '03:20:01', event: '首次 SSH 登录失败（root）', type: 'info' },
      { time: '03:20:05', event: '连续登录失败 5 次（root）', type: 'warn' },
      { time: '03:21:12', event: '尝试用户名 admin, test, guest', type: 'warn' },
      { time: '03:23:45', event: '累计失败 500+ 次', type: 'danger' },
      { time: '03:24:17', event: 'Fail2Ban 触发告警', type: 'danger' },
    ],
    questions: [
      {
        q: '该事件的严重等级应该评定为？',
        options: ['P1 — 紧急', 'P2 — 高危', 'P3 — 中危', 'P4 — 低危'],
        answer: 2,
        explain: '暴力破解是常见攻击，但尚未成功突破。当前只有登录失败，没有成功迹象，评定为 P3 中危。如果发现暴力破解成功或正在进行中升级为 P2。'
      },
      {
        q: '下一步应该采取什么措施？',
        options: ['忽略，等待自动封禁解除', '封禁攻击源 IP + 检查是否有成功登录', '立即关闭 SSH 服务', '重置所有用户密码'],
        answer: 1,
        explain: '正确做法：1) 确认 Fail2Ban 已封禁攻击 IP；2) 检查 auth.log 是否有登录成功记录（暴力破解可能已成功）；3) 如有成功登录则升级事件等级。'
      },
      {
        q: '如何确认攻击者是否已成功登录？',
        options: ['看 CPU 使用率', '检查 /var/log/auth.log 中的 "Accepted" 记录', '检查磁盘空间', '看网络流量'],
        answer: 1,
        explain: 'auth.log 记录所有 SSH 认证事件。搜索 "Accepted password" 或 "Accepted publickey" 可以找到成功登录记录，包含登录时间、来源 IP 和用户名。'
      },
    ],
    knowledge: {
      title: '📖 暴力破解应急响应',
      body: 'SSH 暴力破解是最常见的网络攻击之一，攻击者自动化尝试大量用户名/密码组合。' +
        '应急响应要点：检查是否成功登录 → 封禁攻击 IP → 加固 SSH（密钥认证、禁止 root 登录、修改端口）。' +
        '长期防御：Fail2Ban 自动封禁、MFA 多因素认证、跳板机+VPN 访问。'
    },
  },

  // ===== 关卡 2：数据泄露 =====
  {
    id: 2,
    name: '数据泄露',
    enName: 'Data Breach',
    icon: '📊',
    difficulty: '中等',
    alert: {
      title: '数据库异常外连告警',
      time: '2026-06-15 14:08:33',
      source: 'IDS / 数据库审计',
      severity: 'P2',
      target: 'db-master (192.168.1.20)',
      desc: '检测到 MySQL 数据库异常查询和大量数据外传',
    },
    timeline: [
      { time: '14:02:15', event: 'Web 应用日志: 异常 SQL 查询 -- UNION SELECT', type: 'warn' },
      { time: '14:03:22', event: 'MySQL: 查询 information_schema（枚举数据库结构）', type: 'warn' },
      { time: '14:04:50', event: 'MySQL: SELECT * FROM users（全表查询）', type: 'danger' },
      { time: '14:05:18', event: 'MySQL: 查询 48,000+ 条用户记录', type: 'danger' },
      { time: '14:06:30', event: '网络: 大量数据从 db-master 发往外网 IP 45.xx.xx.xx', type: 'danger' },
      { time: '14:08:33', event: 'IDS 告警: 数据库数据外泄', type: 'danger' },
    ],
    questions: [
      {
        q: '该事件最可能的攻击方式是什么？',
        options: ['DDoS 攻击', 'SQL 注入', 'XSS 攻击', '暴力破解'],
        answer: 1,
        explain: '从日志可以看到 UNION SELECT（SQL 注入特征）、information_schema 枚举、全表查询等行为，这是典型的 SQL 注入攻击导致的数据泄露。'
      },
      {
        q: '应该首先采取什么应急措施？',
        options: ['通知用户修改密码', '立即隔离 Web 应用服务器（阻断注入入口）', '关闭数据库', '备份数据库'],
        answer: 1,
        explain: '首先要阻断攻击入口：隔离 Web 应用服务器（断网或下线），阻止攻击者继续注入。然后再处理已泄露的数据（通知用户、取证分析）。关闭数据库会影响正常业务。'
      },
      {
        q: '事后需要做哪些工作？以下哪项不是必须的？',
        options: ['修复 SQL 注入漏洞', '通知受影响用户', '给攻击者支付封口费', '加强数据库审计'],
        answer: 2,
        explain: '绝不应向攻击者妥协。正确做法：1) 修复漏洞（参数化查询）；2) 通知受影响用户（法律规定）；3) 加强审计和监控；4) 按照法律法规上报监管部门。'
      },
    ],
    knowledge: {
      title: '📖 数据泄露应急响应',
      body: '数据泄露是最严重的安全事件之一，涉及法律合规和用户隐私。' +
        '应急流程：阻断攻击入口 → 取证保全 → 评估泄露范围 → 通知受影响方 → 修复漏洞 → 加固防护。' +
        '法律要求：《网络安全法》要求发生数据泄露必须及时上报和通知用户。' +
        '防御：参数化查询防 SQL 注入、数据库审计、最小权限原则、数据脱敏。'
    },
  },

  // ===== 关卡 3：勒索爆发 =====
  {
    id: 3,
    name: '勒索爆发',
    enName: 'Ransomware Outbreak',
    icon: '🔒',
    difficulty: '中等',
    alert: {
      title: '多主机文件加密告警',
      time: '2026-06-15 09:15:42',
      source: 'EDR / 文件完整性监控',
      severity: 'P1',
      target: '内网多台主机（finance-pc-01~05, hr-pc-01~03）',
      desc: '检测到多台主机文件被批量加密，疑似勒索软件爆发',
    },
    timeline: [
      { time: '09:05:00', event: 'finance-pc-01: 用户打开邮件附件 "工资调整通知.zip"', type: 'info' },
      { time: '09:05:30', event: 'finance-pc-01: 释放并执行 svchost_update.exe', type: 'warn' },
      { time: '09:08:15', event: 'finance-pc-01: 批量加密 .doc .xls .pdf 文件', type: 'danger' },
      { time: '09:10:22', event: 'finance-pc-01: 生成 README_RESTORE.txt 勒索信', type: 'danger' },
      { time: '09:11:00', event: 'finance-pc-02~05: 同样行为（SMB 横向传播）', type: 'danger' },
      { time: '09:12:30', event: 'hr-pc-01~03: 被感染（通过共享文件夹传播）', type: 'danger' },
      { time: '09:15:42', event: 'EDR 告警: 多主机勒索软件活动', type: 'danger' },
    ],
    questions: [
      {
        q: '该勒索软件的传播途径是什么？',
        options: ['U盘传播', '邮件附件 + SMB 横向传播', '网站挂马', '蓝牙传播'],
        answer: 1,
        explain: '从时间线可以看到：初始感染通过邮件附件（工资调整通知.zip），然后通过 SMB 共享（445端口）在内网横向传播到其他主机。这是典型的蠕虫型勒索软件。'
      },
      {
        q: '遏制措施的优先级顺序应该是？',
        options: [
          '先恢复数据，再断网',
          '先隔离感染主机（断网），再评估影响范围',
          '先关闭所有服务器',
          '先支付赎金解密'
        ],
        answer: 1,
        explain: '正确的遏制顺序：1) 立即隔离已感染主机（断网，防止继续传播）；2) 评估感染范围（哪些主机被感染）；3) 确认备份情况；4) 清除恶意软件；5) 恢复数据。绝不应支付赎金。'
      },
      {
        q: '事后应该采取什么措施防止再次发生？',
        options: [
          '关闭所有邮件服务',
          '关闭 SMB 共享 + 邮件附件过滤 + 离线备份策略',
          '禁止员工使用电脑',
          '只使用 Linux 系统'
        ],
        answer: 1,
        explain: '防御措施：1) 关闭不必要的 SMB 共享（445端口）；2) 邮件网关过滤可执行附件；3) 实施 3-2-1 备份策略（3份备份、2种介质、1份离线）；4) 终端防护（EDR）；5) 安全意识培训。'
      },
    ],
    knowledge: {
      title: '📖 勒索软件应急响应',
      body: '勒索软件爆发是 P1 级紧急事件，需要快速遏制防止扩散。' +
        '应急流程：隔离感染主机 → 评估感染范围 → 确认备份可用 → 清除恶意软件 → 恢复数据 → 加固防护。' +
        '关键原则：不支付赎金、优先保护备份、保留证据报案。' +
        '预防：3-2-1 备份策略、邮件过滤、SMB 加固、EDR 部署、安全培训。'
    },
  },

  // ===== 关卡 4：网站篡改 =====
  {
    id: 4,
    name: '网站篡改',
    enName: 'Website Defacement',
    icon: '🖥️',
    difficulty: '中等',
    alert: {
      title: '网站首页内容异常变更',
      time: '2026-06-15 22:45:10',
      source: '网站监控 / WAF',
      severity: 'P2',
      target: 'www.company.com (Web Server)',
      desc: '网站首页被替换为黑客组织声明页面',
    },
    timeline: [
      { time: '22:30:00', event: 'WAF: 检测到文件上传请求（upload.php）', type: 'warn' },
      { time: '22:31:15', event: 'Web 日志: POST /admin/upload.php → 上传 shell.php', type: 'danger' },
      { time: '22:32:00', event: 'Web 日志: GET /uploads/shell.php → WebShell 执行', type: 'danger' },
      { time: '22:35:20', event: '系统日志: 修改 /var/www/html/index.html', type: 'danger' },
      { time: '22:40:00', event: '外部监控: 首页内容变更检测', type: 'danger' },
      { time: '22:45:10', event: '告警触发: 网站篡改告警', type: 'danger' },
    ],
    questions: [
      {
        q: '攻击者是通过什么方式入侵的？',
        options: ['DDoS 攻击', '文件上传漏洞（上传 WebShell）', 'DNS 劫持', '暴力破解 SSH'],
        answer: 1,
        explain: '从日志可以看到攻击者通过 /admin/upload.php 上传了 shell.php（WebShell），然后访问 WebShell 执行命令修改了首页。这是典型的文件上传漏洞利用。'
      },
      {
        q: '应该首先做什么？',
        options: ['恢复被篡改的首页', '下线网站并删除 WebShell，修复上传漏洞', '发声明说被攻击了', '关闭服务器'],
        answer: 1,
        explain: '优先级：1) 下线网站（防止更多用户看到篡改页面）；2) 删除 WebShell；3) 修复文件上传漏洞（限制文件类型、重命名、存储到非 Web 目录）；4) 恢复首页；5) 全面检查是否还有其他后门。'
      },
      {
        q: '如何确认攻击者是否还留了其他后门？',
        options: ['只检查首页文件', '全面扫描 Web 目录中的可疑文件 + 检查最近修改的文件', '看 CPU 使用率', '重新部署就行不用检查'],
        answer: 1,
        explain: '攻击者可能不止放了一个 WebShell。应：1) find 命令搜索最近修改的文件；2) 扫描 Web 目录中的 .php .jsp 等可疑文件；3) 检查数据库是否被植入后门；4) 检查系统账户和自启动项。'
      },
    ],
    knowledge: {
      title: '📖 网站篡改应急响应',
      body: '网站篡改是常见的 Web 安全事件，通常通过文件上传漏洞、SQL 注入、弱口令等方式入侵。' +
        '应急流程：下线网站 → 清除后门 → 修复漏洞 → 恢复上线 → 全面检查。' +
        '防御：文件上传白名单校验、WAF 部署、Web 目录只读权限、定期安全扫描。'
    },
  },

  // ===== 关卡 5：横向移动 =====
  {
    id: 5,
    name: '横向移动',
    enName: 'Lateral Movement',
    icon: '🕸️',
    difficulty: '困难',
    alert: {
      title: '内网异常横向移动活动',
      time: '2026-06-15 02:18:55',
      source: 'EDR / 网络流量分析',
      severity: 'P1',
      target: '内网多台服务器',
      desc: '检测到从一台工作站向多台服务器的异常 SMB/WMI 连接和凭据访问',
    },
    timeline: [
      { time: '01:30:00', event: 'workstation-23: 用户点击钓鱼链接下载恶意文档', type: 'info' },
      { time: '01:35:12', event: 'workstation-23: PowerShell 执行编码命令', type: 'warn' },
      { time: '01:40:00', event: 'workstation-23: 执行 mimikatz 提取凭据', type: 'danger' },
      { time: '01:45:30', event: 'workstation-23: 使用域管理员凭据连接 file-server-01', type: 'danger' },
      { time: '01:50:00', event: 'file-server-01: PsExec 执行远程命令', type: 'danger' },
      { time: '02:00:15', event: 'workstation-23: 横向连接 db-server, mail-server, ad-server', type: 'danger' },
      { time: '02:10:00', event: 'ad-server: DCSync 攻击（复制域控数据库）', type: 'danger' },
      { time: '02:18:55', event: 'EDR 告警: 异常凭据使用和横向移动', type: 'danger' },
    ],
    questions: [
      {
        q: '攻击者的攻击链顺序是？',
        options: [
          '漏洞利用 → 数据窃取 → 横向移动',
          '钓鱼投递 → 凭据窃取 → 横向移动 → 域控攻击',
          'DDoS → 勒索 → 数据泄露',
          '暴力破解 → 提权 → 删除数据'
        ],
        answer: 1,
        explain: '完整攻击链：1) 钓鱼邮件投递恶意文档；2) PowerShell 执行恶意代码；3) mimikatz 窃取凭据；4) 使用域管凭据横向移动到服务器；5) DCSync 攻击域控。这是典型的 APT 攻击链。'
      },
      {
        q: '最关键的一环是哪个？为什么？',
        options: [
          '钓鱼邮件，因为它是入口',
          '凭据窃取（mimikatz），因为它打开了所有门',
          'DCSync，因为它是最后一步',
          'PowerShell 执行'
        ],
        answer: 1,
        explain: '凭据窃取是攻击的转折点。攻击者通过 mimikatz 获取了域管理员凭据，相当于拿到了内网所有服务器的"万能钥匙"。遏制凭据泄露（重置域管密码、踢掉活跃会话）是最紧急的措施。'
      },
      {
        q: '遏制该事件的最紧急措施是？',
        options: [
          '关闭所有服务器',
          '立即重置域管理员密码 + 隔离受感染主机',
          '通知所有用户修改密码',
          '备份数据'
        ],
        answer: 1,
        explain: '攻击者已获取域管凭据，可以随时访问任何服务器。最紧急：1) 重置所有域管理员密码；2) 隔离已确认感染的主机；3) 强制所有用户下次登录修改密码；4) 检查域控是否被植入后门。'
      },
    ],
    knowledge: {
      title: '📖 横向移动应急响应',
      body: '横向移动是 APT 攻击的核心阶段，攻击者从一台主机扩展到整个内网。' +
        '常见技术：Pass-the-Hash、PsExec、WMI 远程执行、RDP、DCSync。' +
        '检测要点：异常凭据使用、非工作时间的服务器访问、SMB/WMI 远程执行。' +
        '防御：网络分段、最小权限、特权账户管理（PAM）、EDR 行为监控、蜜罐检测。'
    },
  },

  // ===== 关卡 6：DDoS 攻击 =====
  {
    id: 6,
    name: 'DDoS 攻击',
    enName: 'DDoS Attack',
    icon: '🌊',
    difficulty: '困难',
    alert: {
      title: '业务带宽异常告警',
      time: '2026-06-15 15:30:00',
      source: '网络监控 / CDN',
      severity: 'P1',
      target: 'www.company.com / api.company.com',
      desc: '检测到异常大流量攻击，业务带宽被打满，用户无法访问',
    },
    timeline: [
      { time: '15:00:00', event: '网络监控: 带宽使用率突增至 95%', type: 'warn' },
      { time: '15:05:00', event: 'CDN: 检测到大量 HTTP GET 请求（CC 攻击）', type: 'warn' },
      { time: '15:10:00', event: '网络: 入站流量达 10Gbps（UDP 洪水攻击）', type: 'danger' },
      { time: '15:15:00', event: '业务: 网站响应超时，API 返回 503', type: 'danger' },
      { time: '15:20:00', event: '客户投诉: 无法访问业务系统', type: 'danger' },
      { time: '15:30:00', event: '告警: 业务完全不可用', type: 'danger' },
    ],
    questions: [
      {
        q: '该事件包含哪几种 DDoS 攻击类型？',
        options: [
          '只有 UDP 洪水攻击',
          'UDP 洪水（带宽耗尽）+ HTTP CC 攻击（应用层）',
          '只有 HTTP CC 攻击',
          'SYN 洪水攻击'
        ],
        answer: 1,
        explain: '从日志可以看到两种攻击：1) UDP 洪水攻击（10Gbps 大流量，消耗带宽）；2) HTTP CC 攻击（大量 HTTP GET 请求，消耗服务器资源）。这是混合型 DDoS 攻击。'
      },
      {
        q: '应该采取什么应急措施？',
        options: [
          '等待攻击结束',
          '启用 DDoS 高防 + CDN 流量清洗 + 封禁攻击源 IP 段',
          '关闭网站',
          '报警让警察处理'
        ],
        answer: 1,
        explain: '应急措施：1) 联系 ISP/CDN 启用 DDoS 流量清洗（过滤攻击流量）；2) 启用高防 IP；3) 配置 WAF 规则拦截 CC 攻击；4) 封禁明显的攻击源 IP 段；5) 必要时切换备用 IP。'
      },
      {
        q: 'DDoS 攻击结束后应该做什么？',
        options: [
          '什么都不用做',
          '分析攻击特征 + 部署长期防护 + 评估业务损失',
          '更换所有服务器',
          '关闭互联网'
        ],
        answer: 1,
        explain: '事后工作：1) 分析攻击流量特征（源 IP、协议、请求模式）；2) 优化 DDoS 防护策略；3) 评估业务损失（SLA 违约、客户流失）；4) 制定 DDoS 应急预案；5) 考虑是否需要购买专业 DDoS 防护服务。'
      },
    ],
    knowledge: {
      title: '📖 DDoS 攻击应急响应',
      body: 'DDoS 攻击通过消耗带宽、连接数或计算资源使业务不可用。' +
        '攻击类型：流量型（UDP/ICMP 洪水）、协议型（SYN 洪水）、应用层（HTTP CC）。' +
        '应急流程：确认攻击类型 → 联系 ISP/CDN 清洗 → 启用高防 → 封禁源 IP → 监控恢复。' +
        '长期防御：CDN 加速、DDoS 高防服务、弹性带宽、多活架构。'
    },
  },

  // ===== 关卡 7：供应链事件 =====
  {
    id: 7,
    name: '供应链事件',
    enName: 'Supply Chain Incident',
    icon: '📦',
    difficulty: '困难',
    alert: {
      title: '第三方组件安全告警',
      time: '2026-06-15 10:00:00',
      source: 'SCA / 安全情报',
      severity: 'P1',
      target: '所有使用 @company/utils 包的项目',
      desc: '安全情报显示公司使用的 npm 包 @company/utils v2.1.3 被发现包含后门',
    },
    timeline: [
      { time: '09:00:00', event: '安全情报: @company/utils v2.1.3 被投毒（后门）', type: 'danger' },
      { time: '09:15:00', event: 'SCA 扫描: 发现 12 个项目使用该版本', type: 'warn' },
      { time: '09:30:00', event: '代码审计: postinstall 脚本读取 .env 并外传', type: 'danger' },
      { time: '09:45:00', event: 'CI/CD 日志: 最近 3 次部署都安装了该版本', type: 'danger' },
      { time: '10:00:00', event: '告警触发: 供应链安全事件', type: 'danger' },
    ],
    questions: [
      {
        q: '应该首先采取什么措施？',
        options: [
          '等官方修复版本',
          '立即从所有项目中移除该包版本 + 检查是否有凭据泄露',
          '关闭所有项目',
          '只更新 lockfile'
        ],
        answer: 1,
        explain: '紧急措施：1) 立即从所有项目移除该版本（降级到安全版本或移除）；2) 检查 .env 等敏感文件是否被读取；3) 轮换所有可能泄露的凭据（API Key、数据库密码等）；4) 检查是否有异常网络连接。'
      },
      {
        q: '为什么需要"轮换所有可能泄露的凭据"？',
        options: [
          '这是标准操作，跟事件无关',
          '因为恶意包会读取 .env 中的密钥并外传给攻击者',
          '因为密码太简单',
          '因为服务器被入侵了'
        ],
        answer: 1,
        explain: 'postinstall 脚本在安装时自动执行，会读取 .env、.npmrc、.aws/credentials 等敏感文件。如果这些文件中有密钥/密码，攻击者可能已经获取。必须假设所有密钥已泄露并轮换。'
      },
      {
        q: '如何从根本上预防供应链攻击？',
        options: [
          '不用任何第三方包',
          'lockfile 锁版本 + 私有镜像源 + SCA 持续扫描 + 审计 postinstall',
          '只用最新版本',
          '关闭 npm'
        ],
        answer: 1,
        explain: '纵深防御：1) lockfile 锁定精确版本（防止自动升级到被投毒的版本）；2) 私有 npm 镜像（审核后再同步）；3) SCA 工具持续扫描依赖漏洞；4) 审查 postinstall 脚本；5) 使用 npm audit 检查已知漏洞。'
      },
    ],
    knowledge: {
      title: '📖 供应链安全事件响应',
      body: '供应链攻击通过污染开发依赖渗透目标，影响范围广、发现难度大。' +
        '应急流程：确认受影响范围 → 移除恶意组件 → 轮换可能泄露的凭据 → 检查是否有持久化后门 → 加固依赖管理。' +
        '预防措施：lockfile 锁版本、私有镜像源、SCA 持续扫描、SBOM 物料清单、依赖审计。'
    },
  },

  // ===== 关卡 8：高级入侵 =====
  {
    id: 8,
    name: '高级入侵',
    enName: 'Advanced Intrusion',
    icon: '🎯',
    difficulty: '困难',
    alert: {
      title: '多阶段高级入侵事件',
      time: '2026-06-15 23:00:00',
      source: 'SOC / 威胁情报',
      severity: 'P1',
      target: '核心业务系统 + 数据库 + 邮件服务器',
      desc: '综合多个告警源，发现疑似 APT 组织的定向攻击活动',
    },
    timeline: [
      { time: '3天前 10:00', event: '邮件网关: 高仿真钓鱼邮件（伪装行业报告）', type: 'info' },
      { time: '3天前 10:05', event: '员工 workstation-07 下载并打开恶意文档', type: 'warn' },
      { time: '2天前 02:00', event: 'workstation-07: PowerShell 后门建立 C2 通信', type: 'danger' },
      { time: '2天前 03:00', event: 'workstation-07: mimikatz 提取凭据', type: 'danger' },
      { time: '1天前 01:00', event: '横向移动到 file-server → db-server', type: 'danger' },
      { time: '1天前 04:00', event: 'db-server: 数据库全量导出（48GB）', type: 'danger' },
      { time: '今天 02:00', event: '数据通过 DNS 隧道缓慢外传', type: 'danger' },
      { time: '今天 23:00', event: 'SOC 综合分析确认: APT 高级入侵', type: 'danger' },
    ],
    questions: [
      {
        q: '该事件已经持续了多长时间？为什么这么久才被发现？',
        options: [
          '几小时，因为检测很快',
          '3天以上，因为攻击者使用了低速外传、合法工具、加密通信等隐蔽手段',
          '1天，因为日志很清晰',
          '不可能持续这么久'
        ],
        answer: 1,
        explain: '从时间线可以看到攻击从3天前就开始了。攻击者使用了多种隐蔽手段：低速 DNS 隧道外传数据（不触发流量告警）、使用 PowerShell 等合法工具（绕过白名单）、非工作时间活动（减少被注意）。这是 APT 的典型特征。'
      },
      {
        q: '目前最紧急的处置措施是？',
        options: [
          '通知所有员工',
          '隔离所有受感染主机 + 轮换所有凭据 + 封锁 C2 通信',
          '关闭公司网络',
          '先取证再遏制'
        ],
        answer: 1,
        explain: '攻击者仍在活动（数据还在外传），必须立即遏制：1) 隔离所有已确认感染的主机；2) 轮换所有可能泄露的凭据（尤其是域管理员）；3) 封锁已知的 C2 域名和 IP；4) 然后再进行取证分析和全面排查。'
      },
      {
        q: '事后应该建立什么长效机制？',
        options: [
          '买更多安全产品',
          '建立 SOC 安全运营中心 + SIEM 日志分析 + 威胁情报 + 应急响应预案',
          '让员工不使用电脑',
          '只靠防火墙'
        ],
        answer: 1,
        explain: 'APT 攻击需要持续对抗：1) SOC 7×24 监控；2) SIEM 集中分析日志（发现异常关联）；3) 威胁情报（提前了解攻击组织的 TTP）；4) 定期演练应急响应；5) 零信任架构（不信任任何内部主机）。'
      },
    ],
    knowledge: {
      title: '📖 APT 入侵事件响应',
      body: 'APT（高级持续威胁）是最复杂的安全事件，攻击周期长、手法多样、隐蔽性强。' +
        '应急要点：遏制优先于取证（仍在攻击中时先阻断）→ 全面排查（不只看告警的主机）→ 清除所有后门 → 恢复业务 → 建立长效防御。' +
        '关键挑战：攻击者可能已潜伏数周甚至数月，需要全面排查而非只处理已知告警。' +
        '长效机制：SOC + SIEM + 威胁情报 + 零信任 + 安全意识培训。'
    },
  },
];
