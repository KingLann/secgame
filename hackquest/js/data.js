/**
 * data.js - HackQuest 黑客探险 关卡数据
 */

// ===== 工具定义 =====
var TOOLS = {
  nmap:     { id: 'nmap',     name: 'Nmap',     icon: '📡', desc: '端口扫描与服务探测' },
  sqlmap:   { id: 'sqlmap',   name: 'SQLMap',   icon: '💉', desc: '自动化SQL注入工具' },
  hydra:    { id: 'hydra',    name: 'Hydra',    icon: '🔨', desc: '暴力破解工具' },
  burp:     { id: 'burp',     name: 'Burp Suite', icon: '🔧', desc: 'Web应用安全测试' },
  mimikatz: { id: 'mimikatz', name: 'Mimikatz', icon: '🗝️', desc: 'Windows凭据提取' },
  metasploit:{ id: 'metasploit', name: 'Metasploit', icon: '💀', desc: '渗透测试框架' },
  wireshark:{ id: 'wireshark', name: 'Wireshark', icon: '🦈', desc: '网络流量分析' },
  john:     { id: 'john',     name: 'John',     icon: '🔐', desc: '密码哈希破解' },
};

// ===== 道具类型 =====
// password_web, password_db, password_ssh, password_domain
// key_ssh, key_api, key_encrypt
// vuln_info, cve_info
// flag_*

// ===== 关卡数据 =====
var HQ_LEVELS = [
  // ===== 关卡 1：入门探索 =====
  {
    id: 1,
    name: '入门探索',
    enName: 'First Steps',
    icon: '🌐',
    difficulty: '简单',
    desc: '入侵一台Web服务器获取flag',
    startItems: ['nmap'],
    startTools: ['nmap'],
    nodes: {
      'internet': { name: '互联网', icon: '🌍', x: 80, y: 200, type: 'start', desc: '你的起点，公网环境' },
      'webserver': { name: 'Web服务器', icon: '🖥️', x: 300, y: 200, type: 'target',
        desc: '目标公司的Web服务器\nIP: 203.0.113.10\n开放端口: 80, 443',
        actions: [
          { id: 'scan', name: '端口扫描', tool: 'nmap', desc: '扫描开放端口和服务',
            success: { msg: '扫描完成！\n80/tcp  open  http  Apache/2.4\n443/tcp open  https nginx/1.18', give: null }},
          { id: 'sqli', name: 'SQL注入', tool: 'sqlmap', require: null, desc: '尝试SQL注入攻击',
            success: { msg: 'SQL注入成功！\n获取管理员密码: admin@123456\n数据库: company_db', give: ['password_web', 'flag_web'] },
            fail: '需要SQLMap工具（在后续关卡解锁）' },
          { id: 'brute', name: '暴力破解', tool: 'hydra', desc: '尝试暴力破解登录',
            success: { msg: '暴力破解成功！\nadmin:password123', give: ['password_web'] },
            fail: '需要Hydra工具（在后续关卡解锁）' },
        ]
      },
    },
    edges: [['internet', 'webserver']],
    goal: '获取 Web 服务器的 flag',
    goalItems: ['flag_web'],
    knowledge: {
      title: '📖 信息收集基础',
      body: '渗透测试的第一步是信息收集（Reconnaissance）。Nmap 是最常用的端口扫描工具，可以发现目标开放的端口和运行的服务。' +
        '常用命令：nmap -sV -sC target（版本探测+默认脚本）。了解目标的攻击面是成功渗透的关键。'
    },
  },

  // ===== 关卡 2：内网渗透 =====
  {
    id: 2,
    name: '内网渗透',
    enName: 'Network Pivot',
    icon: '🕸️',
    difficulty: '中等',
    desc: '从Web服务器深入到数据库',
    startItems: ['nmap', 'sqlmap'],
    startTools: ['nmap', 'sqlmap'],
    nodes: {
      'internet': { name: '互联网', icon: '🌍', x: 80, y: 200, type: 'start', desc: '公网环境' },
      'webserver': { name: 'Web服务器', icon: '🖥️', x: 280, y: 120, type: 'target',
        desc: 'Web服务器\nIP: 10.0.1.10\n有SQL注入漏洞',
        actions: [
          { id: 'scan', name: '端口扫描', tool: 'nmap',
            success: { msg: '80/tcp open http\n3306/tcp open mysql（内网）', give: null }},
          { id: 'sqli', name: 'SQL注入', tool: 'sqlmap',
            success: { msg: '注入成功！获取数据库连接信息:\nDB: 10.0.1.20:3306\nUser: root / P@ssw0rd!', give: ['password_db', 'flag_web'] }},
        ]
      },
      'database': { name: '数据库', icon: '🗄️', x: 480, y: 200, type: 'target',
        desc: 'MySQL数据库\nIP: 10.0.1.20\n需要数据库密码',
        require: ['password_db'],
        actions: [
          { id: 'access', name: '连接数据库', require: 'password_db',
            success: { msg: '成功连接数据库！\n发现用户表、订单表...\nFlag: FLAG{db_p1v0t_succ3ss}', give: ['flag_db'] }},
          { id: 'dump', name: '导出数据', require: 'password_db',
            success: { msg: '导出 48,000 条用户记录\n包含邮箱、密码哈希等', give: ['user_data'] }},
        ]
      },
      'fileserver': { name: '文件服务器', icon: '📁', x: 480, y: 320, type: 'target',
        desc: 'SMB文件共享\nIP: 10.0.1.30',
        actions: [
          { id: 'smb', name: 'SMB枚举', tool: 'nmap',
            success: { msg: '发现共享: \\\\10.0.1.30\\share\n可匿名访问', give: null }},
          { id: 'download', name: '下载文件', require: null,
            success: { msg: '发现配置文件 config.ini\n含API密钥: sk-abc123xyz', give: ['key_api', 'flag_file'] }},
        ]
      },
    },
    edges: [['internet', 'webserver'], ['webserver', 'database'], ['webserver', 'fileserver']],
    goal: '获取数据库和文件服务器的 flag',
    goalItems: ['flag_db', 'flag_file'],
    knowledge: {
      title: '📖 内网渗透与横向移动',
      body: '获取一台内网主机权限后，可以利用它作为跳板（Pivot）访问其他内网系统。' +
        '从Web服务器获取数据库凭据后，可以直接连接数据库。SMB文件共享常包含敏感配置文件。' +
        '防御：网络分段、最小权限、不在配置文件中硬编码密码。'
    },
  },

  // ===== 关卡 3：邮件攻击 =====
  {
    id: 3,
    name: '邮件攻击',
    enName: 'Email Attack',
    icon: '📧',
    difficulty: '中等',
    desc: '通过邮件系统获取内部信息',
    startItems: ['nmap', 'hydra'],
    startTools: ['nmap', 'hydra'],
    nodes: {
      'internet': { name: '互联网', icon: '🌍', x: 80, y: 200, type: 'start' },
      'mailserver': { name: '邮件服务器', icon: '📧', x: 280, y: 120, type: 'target',
        desc: '邮件服务器\nIP: mail.company.com\n端口: 25, 110, 143',
        actions: [
          { id: 'scan', name: '端口扫描', tool: 'nmap',
            success: { msg: '25/tcp  open smtp\n110/tcp open pop3\n143/tcp open imap\n993/tcp open imaps', give: null }},
          { id: 'brute', name: '暴力破解', tool: 'hydra',
            success: { msg: '破解成功！\nhr@company.com:welcome2026\nadmin@company.com:P@ss1234', give: ['password_mail'] }},
          { id: 'read', name: '读取邮件', require: 'password_mail',
            success: { msg: '收件箱发现:\n1. 内部网络拓扑图\n2. VPN配置文件\n3. 员工通讯录', give: ['network_map', 'flag_mail'] }},
        ]
      },
      'webserver': { name: 'Web服务器', icon: '🖥️', x: 480, y: 120, type: 'target',
        desc: '内部Web系统\nIP: 10.0.1.10\n需要网络拓扑才能找到',
        require: ['network_map'],
        actions: [
          { id: 'access', name: '访问系统', require: 'network_map',
            success: { msg: '根据拓扑图找到内部Web系统\n发现管理后台: /admin', give: null }},
          { id: 'login', name: '后台登录', require: 'password_mail',
            success: { msg: '使用邮件中的密码登录成功！\n发现客户数据库管理面板', give: ['flag_web'] }},
        ]
      },
      'vpn': { name: 'VPN网关', icon: '🔒', x: 280, y: 320, type: 'target',
        desc: 'VPN接入点\nIP: vpn.company.com',
        actions: [
          { id: 'connect', name: 'VPN连接', require: 'network_map',
            success: { msg: '使用邮件中的VPN配置连接成功！\n已接入公司内网', give: ['vpn_access'] }},
        ]
      },
    },
    edges: [['internet', 'mailserver'], ['mailserver', 'webserver'], ['internet', 'vpn'], ['vpn', 'webserver']],
    goal: '获取邮件和Web系统的 flag',
    goalItems: ['flag_mail', 'flag_web'],
    knowledge: {
      title: '📖 邮件安全与社会工程',
      body: '邮件系统是企业安全的重要入口。攻击者通过暴力破解获取邮箱后，可以：' +
        '1) 获取内部敏感信息（网络拓扑、密码、配置）；2) 利用信任关系发起钓鱼攻击；3) 获取VPN凭据接入内网。' +
        '防御：强密码+MFA、邮件安全网关、员工安全意识培训。'
    },
  },

  // ===== 关卡 4：域渗透 =====
  {
    id: 4,
    name: '域渗透',
    enName: 'Domain Compromise',
    icon: '🏛️',
    difficulty: '困难',
    desc: '从普通用户到域管理员',
    startItems: ['nmap', 'hydra', 'sqlmap'],
    startTools: ['nmap', 'hydra', 'sqlmap'],
    nodes: {
      'internet': { name: '互联网', icon: '🌍', x: 80, y: 200, type: 'start' },
      'webserver': { name: 'Web服务器', icon: '🖥️', x: 250, y: 100, type: 'target',
        desc: 'Web服务器\n域成员机器',
        actions: [
          { id: 'sqli', name: 'SQL注入', tool: 'sqlmap',
            success: { msg: '注入成功，获取域用户凭据:\nuser01:Password123!', give: ['password_user'] }},
        ]
      },
      'workstation': { name: '工作站', icon: '💻', x: 420, y: 100, type: 'target',
        desc: '员工工作站\n域: CORP',
        require: ['password_user'],
        actions: [
          { id: 'login', name: '域登录', require: 'password_user',
            success: { msg: '以域用户身份登录成功！\n发现本地管理员是域管组成员', give: null }},
          { id: 'mimi', name: '凭据提取', tool: 'mimikatz',
            success: { msg: 'Mimikatz 提取凭据:\n域管理员: Admin123!@#\nNTLM: a1b2c3...', give: ['password_domain'] },
            fail: '需要Mimikatz工具' },
        ]
      },
      'fileserver': { name: '文件服务器', icon: '📁', x: 420, y: 250, type: 'target',
        desc: '文件服务器\n域成员',
        require: ['password_user'],
        actions: [
          { id: 'access', name: 'SMB访问', require: 'password_user',
            success: { msg: '访问共享文件夹:\n\\FS01\\Finance\\工资表.xlsx\n\\FS01\\HR\\员工信息.xlsx', give: ['flag_file'] }},
        ]
      },
      'domainctrl': { name: '域控制器', icon: '🏛️', x: 580, y: 170, type: 'target',
        desc: 'DC.corp.local\n域控制器',
        require: ['password_domain'],
        actions: [
          { id: 'dcsync', name: 'DCSync', require: 'password_domain',
            success: { msg: 'DCSync 攻击成功！\n导出所有域用户哈希\n完全控制域环境！', give: ['flag_dc'] }},
          { id: 'golden', name: '黄金票据', require: 'password_domain',
            success: { msg: '生成黄金票据\n可伪装任意域用户\n持久化访问！', give: ['golden_ticket'] }},
        ]
      },
    },
    edges: [['internet', 'webserver'], ['webserver', 'workstation'], ['workstation', 'fileserver'], ['workstation', 'domainctrl']],
    goal: '获取域控制器的 flag',
    goalItems: ['flag_dc'],
    knowledge: {
      title: '📖 域渗透攻击链',
      body: 'Active Directory 域渗透是最高级的攻击之一。典型路径：' +
        '获取域用户凭据 → 登录域成员机器 → 提取域管凭据（Mimikatz）→ 控制域控（DCSync）。' +
        'DCSync 可以复制域控的 NTDS.dit 数据库，获取所有域用户密码哈希。' +
        '防御：特权账户管理（PAM）、禁用NTLM、监控DCSync活动、EDR部署。'
    },
  },

  // ===== 关卡 5：高级渗透 =====
  {
    id: 5,
    name: '高级渗透',
    enName: 'Advanced Penetration',
    icon: '💀',
    difficulty: '困难',
    desc: '多路径渗透，全面入侵',
    startItems: ['nmap', 'sqlmap', 'hydra'],
    startTools: ['nmap', 'sqlmap', 'hydra'],
    nodes: {
      'internet': { name: '互联网', icon: '🌍', x: 80, y: 200, type: 'start' },
      'webserver': { name: 'Web服务器', icon: '🖥️', x: 260, y: 80, type: 'target',
        desc: 'Web服务器\n有SQL注入和文件上传漏洞',
        actions: [
          { id: 'sqli', name: 'SQL注入', tool: 'sqlmap',
            success: { msg: '注入成功！获取管理员密码和数据库信息', give: ['password_web'] }},
          { id: 'upload', name: '文件上传', tool: 'burp',
            success: { msg: '上传WebShell成功！\n获得服务器命令执行权限', give: ['shell_access', 'flag_web'] },
            fail: '需要Burp Suite工具' },
        ]
      },
      'database': { name: '数据库', icon: '🗄️', x: 260, y: 250, type: 'target',
        desc: 'MySQL数据库',
        actions: [
          { id: 'brute', name: '暴力破解', tool: 'hydra',
            success: { msg: '破解成功: root:P@ssw0rd123', give: ['password_db'] }},
          { id: 'access', name: '访问数据', require: 'password_db',
            success: { msg: '访问数据库，发现所有用户数据', give: ['flag_db'] }},
        ]
      },
      'mailserver': { name: '邮件服务器', icon: '📧', x: 440, y: 80, type: 'target',
        desc: 'Exchange邮件服务器',
        actions: [
          { id: 'brute', name: '暴力破解', tool: 'hydra',
            success: { msg: '破解成功: admin@corp.com:Admin2026!', give: ['password_mail'] }},
          { id: 'read', name: '读取邮件', require: 'password_mail',
            success: { msg: '发现VPN配置和内部通讯录', give: ['vpn_config', 'flag_mail'] }},
        ]
      },
      'vpn': { name: 'VPN', icon: '🔒', x: 440, y: 250, type: 'target',
        desc: 'VPN网关',
        require: ['vpn_config'],
        actions: [
          { id: 'connect', name: 'VPN接入', require: 'vpn_config',
            success: { msg: 'VPN连接成功，进入内网', give: ['internal_access'] }},
        ]
      },
      'dc': { name: '域控制器', icon: '🏛️', x: 600, y: 170, type: 'target',
        desc: '域控制器',
        actions: [
          { id: 'exploit', name: '漏洞利用', tool: 'metasploit',
            success: { msg: '利用MS17-010漏洞攻破域控！\n获得SYSTEM权限', give: ['flag_dc'] },
            fail: '需要Metasploit框架' },
          { id: 'pth', name: 'Pass-the-Hash', require: 'password_web',
            success: { msg: '使用窃取的哈希横向移动到域控', give: ['flag_dc'] }},
        ]
      },
    },
    edges: [['internet', 'webserver'], ['internet', 'database'], ['internet', 'mailserver'],
            ['mailserver', 'vpn'], ['vpn', 'dc'], ['webserver', 'dc']],
    goal: '获取所有 flag（至少3个）',
    goalItems: ['flag_web', 'flag_db', 'flag_mail', 'flag_dc'],
    minFlags: 3,
    knowledge: {
      title: '📖 多路径渗透策略',
      body: '真实渗透中，攻击者会同时尝试多条路径。不依赖单一漏洞，而是寻找最容易突破的入口。' +
        '关键原则：信息收集充分、多路径尝试、逐步深入、保持隐蔽。' +
        '防御：每个入口都需要加固，不能只关注一条防线。'
    },
  },

  // ===== 关卡 6：自由探索 =====
  {
    id: 6,
    name: '自由探索',
    enName: 'Free Explore',
    icon: '🎮',
    difficulty: '自由',
    desc: '大型网络，自由探索所有路径',
    startItems: ['nmap', 'sqlmap', 'hydra', 'burp'],
    startTools: ['nmap', 'sqlmap', 'hydra', 'burp'],
    nodes: {
      'internet': { name: '互联网', icon: '🌍', x: 80, y: 200, type: 'start' },
      'web1': { name: 'Web前端', icon: '🖥️', x: 240, y: 80, type: 'target',
        desc: '前端Web服务器\nReact + Node.js',
        actions: [
          { id: 'scan', name: '扫描', tool: 'nmap', success: { msg: '80/tcp open\n3000/tcp open (API)', give: null }},
          { id: 'sqli', name: 'SQL注入', tool: 'sqlmap', success: { msg: '注入成功', give: ['password_web', 'flag_web'] }},
        ]
      },
      'api': { name: 'API服务器', icon: '⚡', x: 240, y: 250, type: 'target',
        desc: 'REST API\nNode.js + Express',
        actions: [
          { id: 'scan', name: '扫描', tool: 'nmap', success: { msg: '3000/tcp open\n发现 /api/v1/users', give: null }},
          { id: 'burp', name: 'Burp测试', tool: 'burp', success: { msg: '发现IDOR漏洞\n可遍历所有用户数据', give: ['flag_api'] }},
        ]
      },
      'db': { name: '数据库', icon: '🗄️', x: 400, y: 80, type: 'target',
        desc: 'PostgreSQL数据库',
        require: ['password_web'],
        actions: [
          { id: 'access', name: '连接', require: 'password_web', success: { msg: '连接成功', give: ['flag_db'] }},
        ]
      },
      'redis': { name: 'Redis缓存', icon: '📦', x: 400, y: 250, type: 'target',
        desc: 'Redis缓存服务器\n未设密码',
        actions: [
          { id: 'access', name: '直接连接', success: { msg: 'Redis无密码保护！\n发现session数据和缓存', give: ['flag_redis'] }},
        ]
      },
      'mail': { name: '邮件', icon: '📧', x: 560, y: 80, type: 'target',
        desc: '邮件服务器',
        actions: [
          { id: 'brute', name: '爆破', tool: 'hydra', success: { msg: '破解成功', give: ['password_mail'] }},
          { id: 'read', name: '读取', require: 'password_mail', success: { msg: '发现敏感邮件', give: ['flag_mail'] }},
        ]
      },
      'dc': { name: '域控', icon: '🏛️', x: 560, y: 250, type: 'target',
        desc: '域控制器\nWindows Server',
        actions: [
          { id: 'exploit', name: '漏洞利用', tool: 'metasploit', success: { msg: '攻破域控！', give: ['flag_dc'] },
            fail: '需要Metasploit' },
        ]
      },
    },
    edges: [['internet', 'web1'], ['internet', 'api'], ['web1', 'db'], ['api', 'redis'],
            ['internet', 'mail'], ['mail', 'dc'], ['db', 'dc']],
    goal: '尽可能多地获取 flag',
    goalItems: ['flag_web', 'flag_api', 'flag_db', 'flag_redis', 'flag_mail', 'flag_dc'],
    minFlags: 3,
    knowledge: {
      title: '📖 综合渗透测试',
      body: '大型网络环境需要全面的信息收集和多路径渗透策略。' +
        '优先级：低垂果实（无密码Redis）→ 已知漏洞（SQL注入）→ 暴力破解 → 高级利用。' +
        '每个发现的信息都可能成为下一个目标的钥匙。渗透测试的核心是不断收集信息、利用信息、扩大战果。'
    },
  },
];
