/**
 * data.js - 密码破解挑战数据
 */

const CIPHER_LEVELS = [
  // ===== 1. 凯撒密码 =====
  {
    id: 1,
    type: 'caesar',
    name: '凯撒密码',
    enName: 'Caesar Cipher',
    icon: '🏛️',
    difficulty: '简单',
    knowledge: {
      title: '📖 凯撒密码原理',
      body: '凯撒密码是最经典的替换密码。将字母表中的每个字母向后（或向前）移动固定位数。例如位移3时：A→D, B→E, ... Z→C。不同位移量产生不同密文，暴力破解只需尝试25种可能。',
    },
    challenges: [
      { cipher: 'KHOOR ZRUOG', answer: 'HELLO WORLD', shift: 3, hint1: '每个字母向后移了3位', hint2: 'K→H, H→E, O→L...' },
      { cipher: 'FYYFHP FY IFBS', answer: 'ATTACK AT DAWN', shift: 5, hint1: '位移量是5', hint2: 'F→A, Y→T...' },
      { cipher: 'QRSRAQ GUR ONFR', answer: 'DEFEND THE BASE', shift: 13, hint1: '这是ROT13，最经典的凯撒变体', hint2: 'Q→D, R→E, S→F...' },
    ],
  },

  // ===== 2. 摩斯电码 =====
  {
    id: 2,
    type: 'morse',
    name: '摩斯电码',
    enName: 'Morse Code',
    icon: '📡',
    difficulty: '简单',
    knowledge: {
      title: '📖 摩斯电码原理',
      body: '摩斯电码用点（·）和划（—）的组合表示字母和数字。每个字母之间用空格分隔，单词之间用 / 分隔。SOS = ··· ——— ···',
    },
    challenges: [
      { cipher: '···· · · ·—· ·—·· ·— ——— ·—· · ·—·· ·—·· ———  ——— ·—· ·—·· ·—··', answer: 'HELLO WORLD', hint1: '每个字母由点和划组成', hint2: '···· = H, · = E...' },
      { cipher: '··· ·——· ·—· ·—·  ——— · ·— ··· ·', answer: 'SPY OWES', hint1: '单词之间用 / 分隔', hint2: '··· = S, ·——· = P...' },
      { cipher: '·—— ·· ·—· ·  ·——· ·—·· ·—· ·——·', answer: 'WIRE PLAY', hint1: '试试先翻译短的词', hint2: '·—— = W, ·· = I...' },
    ],
  },

  // ===== 3. Base64 =====
  {
    id: 3,
    type: 'base64',
    name: 'Base64 编码',
    enName: 'Base64',
    icon: '🔤',
    difficulty: '简单',
    knowledge: {
      title: '📖 Base64 原理',
      body: 'Base64是一种将二进制数据编码为ASCII字符的方法。每3个字节编码为4个字符，使用A-Z、a-z、0-9、+、/共64个字符。末尾的=是填充符。浏览器自带 atob() 函数可以解码。',
    },
    challenges: [
      { cipher: 'Q3liZXJTZWM=', answer: 'CyberSec', hint1: '末尾的=是Base64特征', hint2: '试试浏览器控制台: atob("Q3liZXJTZWM=")' },
      { cipher: 'SGFja2VyTWFu', answer: 'HackerMan', hint1: '这是Base64编码', hint2: 'H=SGF, a=YQ...' },
      { cipher: 'U2VjdXJpdHkxMjM=', answer: 'Security123', hint1: 'Base64对数字也有效', hint2: '末尾的=表示有填充' },
    ],
  },

  // ===== 4. 二进制 =====
  {
    id: 4,
    type: 'binary',
    name: '二进制编码',
    enName: 'Binary',
    icon: '💻',
    difficulty: '中等',
    knowledge: {
      title: '📖 二进制编码原理',
      body: '计算机用二进制表示一切。每个字符对应一个ASCII码（十进制），再转为8位二进制。例如 A=65=01000001。每8位二进制对应一个字符。',
    },
    challenges: [
      { cipher: '01001000 01001001', answer: 'HI', hint1: '每8位代表一个字符', hint2: '01001000=72=H, 01001001=73=I' },
      { cipher: '01000010 01011001 01000101', answer: 'BYE', hint1: '先转十进制再查ASCII表', hint2: '01000010=66=B...' },
      { cipher: '01000110 01001100 01000001 01000111', answer: 'FLAG', hint1: 'Flag就在二进制里', hint2: '01000110=70=F...' },
    ],
  },

  // ===== 5. 埃特巴什密码 =====
  {
    id: 5,
    type: 'atbash',
    name: '埃特巴什密码',
    enName: 'Atbash Cipher',
    icon: '🔄',
    difficulty: '中等',
    knowledge: {
      title: '📖 埃特巴什密码原理',
      body: '埃特巴什密码是一种简单的单表替换密码，将字母表反转：A↔Z, B↔Y, C↔X, ... M↔N。加密和解密使用相同的操作。',
    },
    challenges: [
      { cipher: 'SVOOL DLIOW', answer: 'HELLO WORLD', hint1: '字母表被反转了', hint2: 'A↔Z, B↔Y, C↔X...' },
      { cipher: 'GSRH RH XZMGV', answer: 'THIS IS CHEAP', hint1: '第1个字母和最后1个互换', hint2: 'S↔H, V↔E...' },
      { cipher: 'WVXVGRW MLD', answer: 'DECRYPT NOW', hint1: '试试把字母表倒过来对照', hint2: 'W↔D, V↔E, X↔C...' },
    ],
  },

  // ===== 6. 十六进制 =====
  {
    id: 6,
    type: 'hex',
    name: '十六进制编码',
    enName: 'Hexadecimal',
    icon: '🔢',
    difficulty: '中等',
    knowledge: {
      title: '📖 十六进制编码原理',
      body: '十六进制用0-9和A-F表示，每两个十六进制数对应一个字节（一个ASCII字符）。例如48=H, 65=e。可以用 parseInt("48", 16) 转为十进制。',
    },
    challenges: [
      { cipher: '48 61 63 6b', answer: 'Hack', hint1: '两个十六进制数 = 一个字符', hint2: '48=H, 61=a, 63=c, 6b=k' },
      { cipher: '53 65 63 75 72 65', answer: 'Secure', hint1: '十六进制范围 00-7F', hint2: '53=S, 65=e...' },
      { cipher: '46 4c 41 47', answer: 'FLAG', hint1: '试试将每两位转为十进制', hint2: '46=F, 4c=L, 41=A, 47=G' },
    ],
  },

  // ===== 7. 维吉尼亚密码 =====
  {
    id: 7,
    type: 'vigenere',
    name: '维吉尼亚密码',
    enName: 'Vigenère Cipher',
    icon: '🗝️',
    difficulty: '困难',
    knowledge: {
      title: '📖 维吉尼亚密码原理',
      body: '维吉尼亚密码是多表替换密码，使用一个关键词循环对每个字母进行不同的凯撒移位。例如密钥"KEY"：第1个字母移K(10)位，第2个移E(4)位，第3个移Y(24)位，第4个回到K(10)位...',
    },
    challenges: [
      { cipher: 'RIJVS', answer: 'HELLO', key: 'KEY', hint1: '密钥是 KEY', hint2: 'H+K=R, E+E=I, L+Y=J...' },
      { cipher: 'YCUPL', answer: 'WORLD', key: 'CODE', hint1: '密钥是一种编程语言', hint2: 'W+C=Y, O+O=C, R+D=U...' },
      { cipher: 'ZWUVG', answer: 'NIGHT', key: 'MOON', hint1: '密钥和月亮有关', hint2: 'N+M=Z, I+O=W, G+O=U...' },
    ],
  },

  // ===== 8. 栅栏密码 =====
  {
    id: 8,
    type: 'rail',
    name: '栅栏密码',
    enName: 'Rail Fence Cipher',
    icon: '🏚️',
    difficulty: '困难',
    knowledge: {
      title: '📖 栅栏密码原理',
      body: '栅栏密码将明文按"W"形排列在多行中，然后按行读取得到密文。例如"HELLO WORLD"用2栏：H L O O L → HLLOL, E L W R D → ELWRD，密文="HLLOLELWRD"。',
    },
    challenges: [
      { cipher: 'HLOWRDELL', answer: 'HELLO WORLD', rails: 2, hint1: '用了2栏栅栏', hint2: '奇数位+偶数位拼起来' },
      { cipher: 'TIROHQCBONFXEUW', answer: 'THEQUICKBROWNFOX', rails: 3, hint1: '用了3栏', hint2: '按W形重新排列' },
      { cipher: 'CYRSBEEC', answer: 'CYBERSEC', rails: 2, hint1: '2栏栅栏', hint2: 'C_B_R_E_C + Y_E_S_E' },
    ],
  },

  // ===== 9. 哈希匹配 =====
  {
    id: 9,
    type: 'hash',
    name: '哈希破解',
    enName: 'Hash Cracking',
    icon: '#️⃣',
    difficulty: '困难',
    knowledge: {
      title: '📖 哈希破解原理',
      body: '哈希是单向函数，无法逆向解密。但常见密码的哈希值已经被预先计算好（彩虹表）。将目标哈希与彩虹表比对就能找到原始密码。MD5是最容易被破解的哈希算法。',
    },
    challenges: [
      { cipher: 'e10adc3949ba59abbe56e057f20f883e', answer: '123456', hashType: 'MD5', hint1: '这是最常见的密码之一', hint2: '搜索这个MD5值试试' },
      { cipher: '5f4dcc3b5aa765d61d8327deb882cf99', answer: 'password', hashType: 'MD5', hint1: '全世界最常用的密码', hint2: '彩虹表第一个就是它' },
      { cipher: 'e99a18c428cb38d5f260853678922e03', answer: 'abc123', hashType: 'MD5', hint1: '字母+数字的组合', hint2: '3个字母+3个数字' },
    ],
  },

  // ===== 10. RSA 入门 =====
  {
    id: 10,
    type: 'rsa',
    name: 'RSA 入门',
    enName: 'RSA Basics',
    icon: '🔑',
    difficulty: '极难',
    knowledge: {
      title: '📖 RSA 原理入门',
      body: 'RSA基于大数分解的困难性。选择两个质数p和q，计算n=p×q。公钥(n,e)，私钥(n,d)。加密：c=m^e mod n，解密：m=c^d mod n。这里用小数字演示。',
    },
    challenges: [
      { cipher: 'n=15, e=3, c=12, 求 m=?', answer: '3', rsa: {p:3, q:5, e:3, m:3}, hint1: 'p=3, q=5, n=15', hint2: 'm^3 ≡ 12 (mod 15), 试试3^3=27, 27 mod 15=12' },
      { cipher: 'n=33, e=3, c=8, 求 m=?', answer: '2', rsa: {p:3, q:11, e:3, m:2}, hint1: '33=3×11', hint2: '2^3=8, 8 mod 33=8, 所以 m=2' },
      { cipher: 'n=77, e=3, c=62, 求 m=?', answer: '6', rsa: {p:7, q:11, e:3, m:6}, hint1: '77=7×11', hint2: '6^3=216, 216 mod 77=62, 所以 m=6' },
    ],
  },
];
