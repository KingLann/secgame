/**
 * data.js - NetBuilder 网络攻防沙盒 数据定义
 */

// ===== 设备组件定义 =====
var COMPONENTS = {
  webserver: {
    id: 'webserver', name: 'Web服务器', icon: '🖥️', color: '#1565c0',
    desc: '提供 Web 服务',
    config: {
      port: { label: '端口', type: 'select', options: ['80', '443', '8080'], value: '80' },
      vuln_sql: { label: 'SQL注入漏洞', type: 'toggle', value: false },
      vuln_xss: { label: 'XSS漏洞', type: 'toggle', value: false },
      vuln_upload: { label: '文件上传漏洞', type: 'toggle', value: false },
    }
  },
  database: {
    id: 'database', name: '数据库', icon: '🗄️', color: '#6a1b9a',
    desc: '存储数据',
    config: {
      port: { label: '端口', type: 'select', options: ['3306', '5432', '1433'], value: '3306' },
      exposed: { label: '暴露公网', type: 'toggle', value: false },
      weak_pass: { label: '弱密码', type: 'toggle', value: false },
    }
  },
  firewall: {
    id: 'firewall', name: '防火墙', icon: '🧱', color: '#e65100',
    desc: '网络包过滤',
    config: {
      mode: { label: '模式', type: 'select', options: ['白名单', '黑名单'], value: '白名单' },
      allow_http: { label: '允许HTTP(80)', type: 'toggle', value: true },
      allow_https: { label: '允许HTTPS(443)', type: 'toggle', value: true },
      allow_ssh: { label: '允许SSH(22)', type: 'toggle', value: false },
      allow_mysql: { label: '允许MySQL(3306)', type: 'toggle', value: false },
    }
  },
  ids: {
    id: 'ids', name: 'IDS/IPS', icon: '🔍', color: '#00838f',
    desc: '入侵检测/防御',
    config: {
      mode: { label: '模式', type: 'select', options: ['监控', '拦截'], value: '拦截' },
      detect_sql: { label: '检测SQL注入', type: 'toggle', value: true },
      detect_ddos: { label: '检测DDoS', type: 'toggle', value: true },
      detect_brute: { label: '检测暴力破解', type: 'toggle', value: true },
    }
  },
  client: {
    id: 'client', name: '客户端', icon: '💻', color: '#2e7d32',
    desc: '用户终端',
    config: {
      antivirus: { label: '防病毒', type: 'toggle', value: true },
      patch: { label: '系统补丁', type: 'select', options: ['最新', '过期'], value: '最新' },
    }
  },
  attacker: {
    id: 'attacker', name: '攻击机', icon: '⚡', color: '#c62828',
    desc: '攻击源（不可配置）',
    config: {}
  },
};

// ===== 攻击类型定义 =====
var ATTACK_TYPES = {
  sql_inject: {
    id: 'sql_inject', name: 'SQL注入', icon: '💉',
    desc: '通过Web应用漏洞注入SQL语句',
    target: 'webserver',
    bypassPorts: [80, 443, 8080],
  },
  ddos: {
    id: 'ddos', name: 'DDoS攻击', icon: '🌊',
    desc: '海量流量淹没目标',
    target: 'webserver',
    bypassPorts: [80, 443],
  },
  brute_force: {
    id: 'brute_force', name: '暴力破解', icon: '🔨',
    desc: '自动化密码猜测',
    target: 'database',
    bypassPorts: [3306, 5432, 1433, 22],
  },
  phishing: {
    id: 'phishing', name: '钓鱼攻击', icon: '🎣',
    desc: '诱骗用户执行恶意操作',
    target: 'client',
    bypassPorts: [],
  },
  xss: {
    id: 'xss', name: 'XSS攻击', icon: '📜',
    desc: '注入恶意脚本',
    target: 'webserver',
    bypassPorts: [80, 443, 8080],
  },
};

// ===== 关卡定义 =====
var NB_LEVELS = [
  {
    id: 1,
    name: '基础防御',
    enName: 'Basic Defense',
    icon: '🛡️',
    difficulty: '简单',
    desc: '用防火墙保护Web服务器',
    budget: 5, // 最多放置5个设备
    requiredDevices: ['webserver', 'attacker'], // 必须放置的设备
    availableDevices: ['firewall', 'ids'], // 可选设备
    attack: 'sql_inject',
    targetDevice: 'webserver',
    winCondition: '拦截SQL注入攻击',
    hint: '在攻击机和Web服务器之间放置防火墙，拒绝HTTP流量',
    knowledge: {
      title: '📖 防火墙基础',
      body: '防火墙是网络安全的第一道防线，通过预设规则过滤网络流量。' +
        '白名单模式：只允许明确放行的流量，其余全部拒绝（更安全）。' +
        '黑名单模式：只拒绝明确禁止的流量，其余全部放行（更宽松）。' +
        '最佳实践：生产环境使用白名单模式，最小权限原则。'
    },
  },
  {
    id: 2,
    name: '多层防御',
    enName: 'Layered Defense',
    icon: '🏰',
    difficulty: '简单',
    desc: '保护Web服务器和数据库',
    budget: 8,
    requiredDevices: ['webserver', 'database', 'attacker'],
    availableDevices: ['firewall', 'ids'],
    attack: 'sql_inject',
    targetDevice: 'database',
    winCondition: '防止攻击从Web服务器传播到数据库',
    hint: 'Web服务器有SQL注入漏洞，需要IDS检测+防火墙隔离数据库',
    knowledge: {
      title: '📖 纵深防御',
      body: '纵深防御（Defense in Depth）是核心安全理念：不依赖单一防线，而是部署多层安全控制。' +
        '典型架构：防火墙（网络层）→ IDS/IPS（检测层）→ WAF（应用层）→ 数据库权限（数据层）。' +
        '即使一层被突破，其他层仍能提供保护。'
    },
  },
  {
    id: 3,
    name: 'DMZ 架构',
    enName: 'DMZ Architecture',
    icon: '🏗️',
    difficulty: '中等',
    desc: '搭建 DMZ 隔离区',
    budget: 10,
    requiredDevices: ['webserver', 'database', 'client', 'attacker'],
    availableDevices: ['firewall', 'ids'],
    attack: 'sql_inject',
    targetDevice: 'database',
    winCondition: 'Web服务器可被访问，但数据库不可直接到达',
    hint: '用两个防火墙隔离三个区域：外网、DMZ（Web）、内网（DB+Client）',
    knowledge: {
      title: '📖 DMZ 隔离区',
      body: 'DMZ（非军事区）是位于外网和内网之间的缓冲区域。' +
        '架构：外网 → 防火墙A → DMZ（Web服务器）→ 防火墙B → 内网（数据库、内部系统）。' +
        '外网用户只能访问 DMZ，不能直接访问内网。即使 Web 服务器被攻破，攻击者也无法直接到达数据库。'
    },
  },
  {
    id: 4,
    name: '混合攻击',
    enName: 'Mixed Attacks',
    icon: '⚔️',
    difficulty: '中等',
    desc: '同时防御多种攻击方式',
    budget: 12,
    requiredDevices: ['webserver', 'database', 'client', 'attacker'],
    availableDevices: ['firewall', 'ids'],
    attacks: ['sql_inject', 'ddos', 'phishing'],
    targetDevice: 'all',
    winCondition: '拦截所有三种攻击',
    hint: '三种攻击路径不同：SQL注入走Web、DDoS走网络层、钓鱼走客户端',
    knowledge: {
      title: '📖 多向量攻击防御',
      body: '真实攻击往往同时使用多种攻击向量。防御需要覆盖每个入口：' +
        '网络层（防火墙+速率限制防DDoS）→ 应用层（IDS检测SQL注入）→ 终端层（防病毒+安全培训防钓鱼）。' +
        'SOC 需要同时监控多个维度的安全事件。'
    },
  },
  {
    id: 5,
    name: '最小预算',
    enName: 'Minimum Budget',
    icon: '💰',
    difficulty: '困难',
    desc: '用最少的设备保护所有资产',
    budget: 6,
    requiredDevices: ['webserver', 'database', 'client', 'attacker'],
    availableDevices: ['firewall', 'ids'],
    attacks: ['sql_inject', 'brute_force'],
    targetDevice: 'all',
    winCondition: '用不超过6个设备拦截所有攻击',
    hint: '关键：合理配置每个设备，一个设备可以同时防护多种威胁',
    knowledge: {
      title: '📖 安全成本效益',
      body: '企业安全预算有限，需要在安全投入和风险之间找到平衡。' +
        '优先保护最关键的资产（数据>服务>终端）。' +
        '选择多功能设备（如UTM统一威胁管理）而非单点产品。' +
        '安全不是买最贵的产品，而是正确配置和持续运营。'
    },
  },
  {
    id: 6,
    name: '自由沙盒',
    enName: 'Free Sandbox',
    icon: '🎮',
    difficulty: '自由',
    desc: '自由搭建，无限资源',
    budget: 99,
    requiredDevices: ['attacker'],
    availableDevices: ['webserver', 'database', 'firewall', 'ids', 'client'],
    attacks: ['sql_inject', 'ddos', 'brute_force', 'phishing', 'xss'],
    targetDevice: 'all',
    winCondition: '自由搭建，测试你的防御体系',
    hint: '尝试不同的网络架构，看哪种最有效',
    knowledge: {
      title: '📖 安全架构设计',
      body: '好的安全架构应该具备：最小攻击面、纵深防御、零信任原则、可监控性。' +
        '设计步骤：识别资产 → 评估风险 → 设计防线 → 部署实施 → 持续监控 → 定期演练。' +
        '记住：没有绝对安全的系统，关键是提高攻击成本、降低攻击收益。'
    },
  },
];
