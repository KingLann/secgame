// 案例数据 — 每个 case 是一个独立的交易追踪案件
const CASES = [
  // ===== 案例 1: 初识追踪 =====
  {
    id: 1,
    title: '直链追踪',
    subtitle: '最简单的资金链路',
    difficulty: 1,
    briefing: '暗网市场"ShadowMart"被发现有一笔 0.8 BTC 的交易。请追踪这笔资金的最终去向。',
    question: '这笔资金最终流入了哪里？',
    hints: [
      '从暗网市场出发，沿着资金流向一步步追踪',
      '交易所通常要求实名认证（KYC），是追踪的关键突破口',
      '资金从 暗网市场 → 中间钱包 → 交易所B'
    ],
    nodes: [
      { id: 'darknet',  type: 'darknet',  label: 'ShadowMart',  desc: '暗网市场，已知非法交易平台', x: 100, y: 200 },
      { id: 'wallet_a', type: 'unknown',  label: '钱包 A',      desc: '未知钱包地址\nbc1q...x7k9m', x: 330, y: 200 },
      { id: 'exchange', type: 'unknown',  label: '钱包 B',      desc: '未知钱包地址\n1A2b...z8q3',  x: 560, y: 200 }
    ],
    edges: [
      { from: 'darknet',  to: 'wallet_a', amount: 0.8, time: '2024-03-15 02:30' },
      { from: 'wallet_a', to: 'exchange', amount: 0.79, time: '2024-03-15 04:15' }
    ],
    answer: 'exchange',
    expectedPaths: [
      ['darknet', 'wallet_a', 'exchange']
    ],
    revealMap: {
      'exchange': { type: 'exchange', label: '交易所B', desc: '知名加密货币交易所\n要求 KYC 实名认证\n用户: zhang***@email.com' }
    },
    knowledge: [
      { title: '什么是 KYC？', text: 'KYC（Know Your Customer）是交易所的实名认证要求。用户需要提交身份证件才能交易，这使得交易所成为链上追踪的关键突破口。' },
      { title: 'UTXO 模型', text: '比特币不是"账户余额"模型，而是 UTXO（未花费交易输出）模型。每笔交易消耗之前的 UTXO 并产生新的 UTXO，形成可追溯的链路。' }
    ]
  },

  // ===== 案例 2: 分叉追踪 =====
  {
    id: 2,
    title: '分叉迷踪',
    subtitle: '资金分散后聚合',
    difficulty: 2,
    briefing: '暗网论坛"DarkForum"的一笔赎金 2.5 BTC 被分散转入多个钱包。你需要追踪资金的聚合点。',
    question: '资金最终在哪个交易所被提现？',
    hints: [
      '资金被分散到3个钱包，但它们最终会汇合',
      '注意观察时间线，分散后的资金通常会在相近时间聚合',
      '三条路径最终都流入了同一个交易所'
    ],
    nodes: [
      { id: 'darknet',  type: 'darknet',  label: 'DarkForum', desc: '暗网论坛，勒索软件交易区', x: 80, y: 250 },
      { id: 'wallet_a', type: 'unknown',  label: '钱包 A',    desc: '未知钱包\nbc1q...m3n7',   x: 280, y: 100 },
      { id: 'wallet_b', type: 'unknown',  label: '钱包 B',    desc: '未知钱包\nbc1q...k5p2',   x: 280, y: 250 },
      { id: 'wallet_c', type: 'unknown',  label: '钱包 C',    desc: '未知钱包\nbc1q...j8r4',   x: 280, y: 400 },
      { id: 'wallet_d', type: 'unknown',  label: '钱包 D',    desc: '未知钱包\n1Xy...q2w9',    x: 500, y: 170 },
      { id: 'wallet_e', type: 'unknown',  label: '钱包 E',    desc: '未知钱包\n1Ab...e4t6',    x: 500, y: 330 },
      { id: 'exchange', type: 'unknown',  label: '钱包 F',    desc: '未知钱包地址\n3Cd...u1i8', x: 700, y: 250 }
    ],
    edges: [
      { from: 'darknet',  to: 'wallet_a', amount: 1.0,  time: '2024-05-01 10:00' },
      { from: 'darknet',  to: 'wallet_b', amount: 0.8,  time: '2024-05-01 10:00' },
      { from: 'darknet',  to: 'wallet_c', amount: 0.7,  time: '2024-05-01 10:01' },
      { from: 'wallet_a', to: 'wallet_d', amount: 0.98, time: '2024-05-01 14:30' },
      { from: 'wallet_b', to: 'wallet_d', amount: 0.78, time: '2024-05-01 14:32' },
      { from: 'wallet_c', to: 'wallet_e', amount: 0.68, time: '2024-05-01 14:35' },
      { from: 'wallet_d', to: 'exchange', amount: 1.75, time: '2024-05-02 09:00' },
      { from: 'wallet_e', to: 'exchange', amount: 0.67, time: '2024-05-02 09:02' }
    ],
    answer: 'exchange',
    expectedPaths: [
      ['darknet', 'wallet_a', 'wallet_d', 'exchange'],
      ['darknet', 'wallet_b', 'wallet_d', 'exchange'],
      ['darknet', 'wallet_c', 'wallet_e', 'exchange']
    ],
    revealMap: {
      'exchange': { type: 'exchange', label: '交易所C', desc: '加密货币交易所\nKYC 用户: li***@proton.me\nIP: 103.42.xx.xx (北京)' }
    },
    knowledge: [
      { title: '资金分散模式', text: '犯罪分子常将大额资金分散到多个钱包，再通过不同路径聚合到交易所提现。这是一种常见的洗钱手法，目的是混淆追踪。' },
      { title: '时间关联分析', text: '即使资金经过多层分散，各路径的操作时间往往相近。通过分析时间关联，可以推断出哪些钱包属于同一控制人。' }
    ]
  },

  // ===== 案例 3: 混币器 =====
  {
    id: 3,
    title: '混币迷雾',
    subtitle: '混币器干扰追踪',
    difficulty: 3,
    briefing: '暗网市场"BlackBazaar"的一笔 1.2 BTC 交易经过了一个混币服务。混币器会打乱输入输出的对应关系，请想办法穿透迷雾。',
    question: '经过混币后，资金最终流向了哪里？',
    hints: [
      '混币器会把多个人的币混在一起再分别输出，打乱对应关系',
      '虽然混币器打乱了对应关系，但输入输出的金额和时间仍有规律',
      '观察混币器的输出，找到与 1.2 BTC 输入时间最接近的输出'
    ],
    nodes: [
      { id: 'darknet',  type: 'darknet',  label: 'BlackBazaar',  desc: '暗网市场，贩卖违禁品', x: 80, y: 250 },
      { id: 'wallet_a', type: 'unknown',  label: '钱包 A',       desc: '未知钱包\nbc1q...n4m2', x: 250, y: 250 },
      { id: 'mixer',    type: 'unknown',  label: '服务 X',       desc: '未知服务\n地址: bc1q...mix01\n大量资金流入流出', x: 430, y: 250 },
      { id: 'wallet_b', type: 'unknown',  label: '钱包 B',       desc: '未知钱包\nbc1q...p7k3', x: 620, y: 150 },
      { id: 'wallet_c', type: 'unknown',  label: '钱包 C',       desc: '未知钱包\nbc1q...r2j5', x: 620, y: 350 },
      { id: 'exchange', type: 'unknown',  label: '钱包 D',       desc: '未知钱包\n1Ef...w8q1',  x: 790, y: 250 }
    ],
    edges: [
      { from: 'darknet',  to: 'wallet_a', amount: 1.2,  time: '2024-06-10 03:00' },
      { from: 'wallet_a', to: 'mixer',    amount: 1.19, time: '2024-06-10 03:45' },
      { from: 'mixer',    to: 'wallet_b', amount: 0.65, time: '2024-06-10 05:20' },
      { from: 'mixer',    to: 'wallet_c', amount: 0.53, time: '2024-06-10 05:22' },
      { from: 'wallet_b', to: 'exchange', amount: 0.64, time: '2024-06-11 11:00' },
      { from: 'wallet_c', to: 'exchange', amount: 0.52, time: '2024-06-11 11:05' }
    ],
    answer: 'exchange',
    expectedPaths: [
      ['darknet', 'wallet_a', 'mixer', 'wallet_b', 'exchange'],
      ['darknet', 'wallet_a', 'mixer', 'wallet_c', 'exchange']
    ],
    revealMap: {
      'mixer':    { type: 'mixer',    label: 'Tornado分片', desc: '混币服务\n将资金拆分并与他人资金混合\n输入输出无法直接对应' },
      'exchange': { type: 'exchange', label: '交易所A',     desc: '大型加密货币交易所\nKYC 用户: wang***@gmail.com\n已通报执法部门' }
    },
    knowledge: [
      { title: '混币器原理', text: '混币器（Mixer/Tumbler）将多人的资金混在一起，再分别输出等额资金。这样外部观察者无法直接将输入和输出对应起来。' },
      { title: '穿透混币的方法', text: '1. 时间关联：输入后不久的输出最可能对应\n2. 金额分析：扣除手续费后的金额有规律\n3. 行为模式：同一人控制的地址有相似的交易习惯' }
    ]
  },

  // ===== 案例 4: 跨链追踪 =====
  {
    id: 4,
    title: '跨链迷局',
    subtitle: '跨链桥洗钱',
    difficulty: 4,
    briefing: '一个黑客团伙将 3.2 BTC 赃款通过跨链桥转换为 ETH，试图逃避比特币链上的追踪。你需要跨越不同区块链追踪资金。',
    question: '资金最终在哪个平台被兑换为法币？',
    hints: [
      '资金从比特币链通过跨链桥转到了以太坊链',
      '跨链桥的两端交易可以通过时间和金额关联',
      '以太坊链上的资金最终流入了一个需要KYC的DeFi平台'
    ],
    nodes: [
      { id: 'hack',     type: 'darknet',  label: '黑客钱包',    desc: '交易所攻击事件的赃款地址', x: 60, y: 250 },
      { id: 'wallet_a', type: 'unknown',  label: 'BTC 钱包 A',  desc: '比特币地址\nbc1q...h4k7', x: 220, y: 150 },
      { id: 'wallet_b', type: 'unknown',  label: 'BTC 钱包 B',  desc: '比特币地址\nbc1q...t9m2', x: 220, y: 350 },
      { id: 'bridge',   type: 'unknown',  label: '跨链服务',    desc: '跨链桥接服务\n支持 BTC↔ETH 转换', x: 420, y: 250 },
      { id: 'eth_a',    type: 'unknown',  label: 'ETH 钱包 A',  desc: '以太坊地址\n0x7a2...d4f1', x: 600, y: 150 },
      { id: 'eth_b',    type: 'unknown',  label: 'ETH 钱包 B',  desc: '以太坊地址\n0x3b8...e7c9', x: 600, y: 350 },
      { id: 'defi',     type: 'unknown',  label: 'DeFi 平台',   desc: '去中心化交易平台\n大量交易活动', x: 780, y: 250 }
    ],
    edges: [
      { from: 'hack',     to: 'wallet_a', amount: 2.0,  time: '2024-07-20 01:00' },
      { from: 'hack',     to: 'wallet_b', amount: 1.2,  time: '2024-07-20 01:02' },
      { from: 'wallet_a', to: 'bridge',   amount: 1.98, time: '2024-07-20 06:30' },
      { from: 'wallet_b', to: 'bridge',   amount: 1.18, time: '2024-07-20 06:35' },
      { from: 'bridge',   to: 'eth_a',    amount: 28.5, time: '2024-07-20 07:00', unit: 'ETH' },
      { from: 'bridge',   to: 'eth_b',    amount: 16.8, time: '2024-07-20 07:03', unit: 'ETH' },
      { from: 'eth_a',    to: 'defi',     amount: 28.3, time: '2024-07-21 14:00', unit: 'ETH' },
      { from: 'eth_b',    to: 'defi',     amount: 16.7, time: '2024-07-21 14:05', unit: 'ETH' }
    ],
    answer: 'defi',
    expectedPaths: [
      ['hack', 'wallet_a', 'bridge', 'eth_a', 'defi'],
      ['hack', 'wallet_b', 'bridge', 'eth_b', 'defi']
    ],
    revealMap: {
      'bridge': { type: 'mixer',    label: '跨链桥 Wormhole', desc: '跨链桥接协议\n在 BTC 和 ETH 之间转换资金\n桥接记录可追溯' },
      'defi':   { type: 'exchange', label: 'DEX 聚合器',      desc: '去中心化交易所聚合器\n通过流动性池兑换为 USDC\n关联 KYC 交易所出金记录' }
    },
    knowledge: [
      { title: '跨链桥洗钱', text: '犯罪分子利用跨链桥将资金从一条区块链转移到另一条，试图切断追踪链路。但跨链桥的两端交易可通过时间和金额进行关联。' },
      { title: 'DeFi 监管', text: '虽然 DeFi 平台本身不要求 KYC，但最终兑换为法币时通常需要通过中心化交易所，这就是追踪的突破口。' }
    ]
  },

  // ===== 案例 5: 综合追踪 =====
  {
    id: 5,
    title: '终极追踪',
    subtitle: '全方位反追踪',
    difficulty: 5,
    briefing: '一个高级持续威胁（APT）组织通过钓鱼攻击窃取了 5.8 BTC。他们使用了混币器、跨链桥、多层钱包等所有手段。这是最复杂的追踪任务。',
    question: '资金最终从哪个平台出金为法币？',
    hints: [
      '资金经过多层转移，但起点和终点是最关键的',
      '中间有一个混币器节点，但之后资金被聚合',
      '追踪到最后会发现一个与银行账户关联的交易所'
    ],
    nodes: [
      { id: 'phishing', type: 'darknet',  label: '钓鱼攻击',    desc: 'APT组织的钓鱼入口\n伪造交易所登录页', x: 40, y: 280 },
      { id: 'wallet_a', type: 'unknown',  label: '钱包 A',      desc: '初始归集钱包\nbc1q...a1b2', x: 170, y: 150 },
      { id: 'wallet_b', type: 'unknown',  label: '钱包 B',      desc: '初始归集钱包\nbc1q...c3d4', x: 170, y: 400 },
      { id: 'mixer',    type: 'unknown',  label: '服务 M',      desc: '可疑服务\n大量资金中转', x: 340, y: 280 },
      { id: 'wallet_c', type: 'unknown',  label: '钱包 C',      desc: '未知钱包\nbc1q...e5f6', x: 480, y: 150 },
      { id: 'wallet_d', type: 'unknown',  label: '钱包 D',      desc: '未知钱包\nbc1q...g7h8', x: 480, y: 400 },
      { id: 'bridge',   type: 'unknown',  label: '转换服务',    desc: '资产转换服务', x: 640, y: 280 },
      { id: 'eth_wallet',type: 'unknown', label: 'ETH 钱包',    desc: '以太坊地址\n0x9c...i1j2', x: 780, y: 180 },
      { id: 'exit',     type: 'unknown',  label: '出金平台',    desc: '交易平台\n大额法币出金记录', x: 780, y: 400 }
    ],
    edges: [
      { from: 'phishing', to: 'wallet_a',   amount: 3.5,  time: '2024-09-01 08:00' },
      { from: 'phishing', to: 'wallet_b',   amount: 2.3,  time: '2024-09-01 08:01' },
      { from: 'wallet_a', to: 'mixer',       amount: 3.48, time: '2024-09-01 12:00' },
      { from: 'wallet_b', to: 'mixer',       amount: 2.28, time: '2024-09-01 12:05' },
      { from: 'mixer',    to: 'wallet_c',    amount: 3.2,  time: '2024-09-02 03:00' },
      { from: 'mixer',    to: 'wallet_d',    amount: 2.5,  time: '2024-09-02 03:02' },
      { from: 'wallet_c', to: 'bridge',      amount: 3.18, time: '2024-09-03 10:00' },
      { from: 'wallet_d', to: 'bridge',      amount: 2.48, time: '2024-09-03 10:05' },
      { from: 'bridge',   to: 'eth_wallet',  amount: 45.2, time: '2024-09-03 11:00', unit: 'ETH' },
      { from: 'eth_wallet',to: 'exit',       amount: 45.0, time: '2024-09-05 09:00', unit: 'ETH' }
    ],
    answer: 'exit',
    expectedPaths: [
      ['phishing', 'wallet_a', 'mixer', 'wallet_c', 'bridge', 'eth_wallet', 'exit'],
      ['phishing', 'wallet_b', 'mixer', 'wallet_d', 'bridge', 'eth_wallet', 'exit']
    ],
    revealMap: {
      'mixer':      { type: 'mixer',    label: '混币服务',    desc: '中心化混币服务\n已被执法部门监控' },
      'bridge':     { type: 'mixer',    label: '跨链桥',      desc: 'BTC → ETH 跨链桥接' },
      'eth_wallet': { type: 'personal', label: '个人钱包',    desc: '以太坊个人钱包\n与社交媒体账号有关联' },
      'exit':       { type: 'exchange', label: '场外交易所',  desc: '加密货币场外交易平台\nKYC: chen***@icloud.com\n银行账户: 工商银行 ****3847\n已冻结，执法部门介入' }
    },
    knowledge: [
      { title: 'APT 攻击链', text: '高级持续威胁组织通常采用多层洗钱：分散→混币→跨链→聚合→出金。每一层都增加追踪难度。' },
      { title: '链上分析工具', text: '专业工具如 Chainalysis、Elliptic 可以自动标记已知的混币器、交易所地址，并通过聚类算法关联钱包。' },
      { title: '执法协作', text: '跨国加密货币犯罪需要多国执法协作。交易所的 KYC 数据是锁定嫌疑人身份的最终突破口。' }
    ]
  }
];
