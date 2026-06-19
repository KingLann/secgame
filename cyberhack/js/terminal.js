/**
 * terminal.js - 终端交互引擎
 */

const Terminal = {
  output: null,
  input: null,
  isProcessing: false,

  init() {
    this.output = document.getElementById('terminal-output');
    this.input = document.getElementById('terminal-input');
    this.setupInput();
  },

  setupInput() {
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.processCommand();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigateHistory(-1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.navigateHistory(1);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        this.autoComplete();
      }
    });

    // 点击终端任意位置聚焦输入
    document.getElementById('terminal').addEventListener('click', () => {
      this.input.focus();
    });
  },

  navigateHistory(direction) {
    if (GameState.commandHistory.length === 0) return;
    GameState.historyIndex += direction;
    GameState.historyIndex = Math.max(-1,
      Math.min(GameState.commandHistory.length - 1, GameState.historyIndex));

    if (GameState.historyIndex === -1) {
      this.input.value = '';
    } else {
      this.input.value = GameState.commandHistory[GameState.historyIndex];
    }
  },

  // 命令自动补全
  autoComplete() {
    const val = this.input.value.trim().toLowerCase();
    const commands = ['help', 'nmap', 'dirb', 'curl', 'sqlmap', 'hydra', 'cat',
      'clear', 'hint', 'submit', 'view-source', 'whoami', 'ls', 'cd',
      'matrix', 'hack', 'scan', 'login', 'search', 'analyze', 'read'];
    const matches = commands.filter(c => c.startsWith(val));
    if (matches.length === 1) {
      this.input.value = matches[0] + ' ';
    } else if (matches.length > 1) {
      Effects.instantLine(this.output, matches.join('  '), 'info');
    }
  },

  async processCommand() {
    const raw = this.input.value.trim();
    this.input.value = '';
    if (!raw || this.isProcessing) return;

    // 记录历史
    GameState.commandHistory.push(raw);
    GameState.historyIndex = GameState.commandHistory.length;

    // 显示输入的命令
    const level = GameState.getCurrentLevel();
    Effects.instantLine(this.output, `visitor@cyberhack:~$ ${raw}`, 'input');

    this.isProcessing = true;
    await this.executeCommand(raw, level);
    this.isProcessing = false;
  },

  async executeCommand(raw, level) {
    const parts = raw.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    switch (cmd) {
      case 'help':
        this.cmdHelp();
        break;
      case 'clear':
        this.output.innerHTML = '';
        break;
      case 'hint':
        await this.cmdHint(level);
        break;
      case 'submit':
        await this.cmdSubmit(args, level);
        break;
      case 'nmap':
        await this.cmdNmap(args, level);
        break;
      case 'dirb':
        await this.cmdDirb(args, level);
        break;
      case 'curl':
      case 'view-source':
        await this.cmdCurl(args, level);
        break;
      case 'cat':
        await this.cmdCat(args, level);
        break;
      case 'sqlmap':
        await this.cmdSqlmap(args, level);
        break;
      case 'hydra':
        await this.cmdHydra(args, level);
        break;
      case 'scan':
        await this.cmdScan(args, level);
        break;
      case 'login':
        await this.cmdLogin(args, level);
        break;
      case 'search':
        await this.cmdSearch(args, level);
        break;
      case 'analyze':
        await this.cmdAnalyze(args, level);
        break;
      case 'judge':
        await this.cmdJudge(args, level);
        break;
      case 'read':
        await this.cmdRead(args, level);
        break;
      case 'whoami':
        Effects.instantLine(this.output, 'visitor (白帽黑客 - 渗透测试中)', 'info');
        break;
      case 'ls':
        Effects.instantLine(this.output, 'mission_brief.txt  target_info.txt  tools/', 'output');
        break;
      case 'matrix':
        this.cmdMatrix();
        break;
      case 'hack':
        await this.cmdHack();
        break;
      default:
        Effects.instantLine(this.output, `bash: ${cmd}: 未知命令。输入 help 查看帮助。`, 'error');
    }
  },

  // ===== 通用命令 =====

  cmdHelp() {
    const helpText = `
可用命令:
  help              显示此帮助信息
  clear             清空终端
  hint              获取当前关卡提示 (扣50分)
  submit <flag>     提交 flag

关卡专用命令:
  nmap <target>     端口扫描
  dirb <url>        目录枚举
  curl <url>        HTTP 请求 / 查看源码
  cat <file>        查看文件内容
  scan <target>     综合扫描
  sqlmap <params>   SQL 注入测试
  hydra <params>    暴力破解
  login <u> <p>     登录系统
  search <query>    搜索功能
  read <id>         读取邮件
  analyze <id>      分析邮件线索
  judge <id> <p|s>  判断邮件 (phishing/safe)

彩蛋命令:
  whoami            查看身份
  ls                列出文件
  matrix            矩阵雨效果
  hack              炫酷黑客动画`;

    Effects.instantLine(this.output, helpText, 'info');
  },

  async cmdHint(level) {
    if (!level) return;
    GameState.hintsUsed++;
    GameState.score = Math.max(0, GameState.score - 50);
    document.getElementById('score').textContent = GameState.score;
    Effects.instantLine(this.output, `⚠️ 提示 (已扣50分，当前${GameState.score}分):`, 'warning');
    await Effects.typewriterLine(this.output, level.hint, 'info', 20);
  },

  async cmdSubmit(flag, level) {
    if (!flag) {
      Effects.instantLine(this.output, '用法: submit <flag>', 'error');
      return;
    }
    const cleanFlag = flag.trim();
    if (cleanFlag === level.flag) {
      await this.levelComplete(level);
    } else {
      Effects.instantLine(this.output, '❌ Flag 不正确，再试试。', 'error');
    }
  },

  // ===== 关卡1命令 =====

  async cmdCurl(args, level) {
    if (GameState.currentLevel >= Levels.length) return;

    // 查找匹配的页面
    let url = args.trim();
    if (!url) {
      Effects.instantLine(this.output, '用法: curl <url> 或 view-source:<url>', 'error');
      return;
    }

    // view-source: 前缀处理
    url = url.replace(/^view-source:/i, '');
    if (!url.startsWith('http')) url = 'http://' + url;

    Effects.instantLine(this.output, `* 正在请求 ${url} ...`, 'system');
    await Effects.sleep(500);

    const page = level.pages[url];
    if (page) {
      Effects.instantLine(this.output, page.content, 'output');
    } else {
      Effects.instantLine(this.output, `HTTP/1.1 404 Not Found`, 'error');
      Effects.instantLine(this.output, `页面不存在: ${url}`, 'error');
    }
  },

  // ===== 关卡2命令 =====

  async cmdDirb(args, level) {
    if (GameState.currentLevel !== 1) {
      Effects.instantLine(this.output, '此命令在当前关卡不可用。', 'error');
      return;
    }

    let url = args.trim();
    if (!url) {
      Effects.instantLine(this.output, '用法: dirb <url>', 'error');
      return;
    }
    if (!url.startsWith('http')) url = 'http://' + url;

    Effects.instantLine(this.output, `DIRB v2.22`, 'info');
    Effects.instantLine(this.output, `By The Dark Raver`, 'info');
    Effects.instantLine(this.output, `---- Scanning URL: ${url} ----`, 'info');
    await Effects.sleep(300);

    const wordlist = ['admin', 'backup', 'secret_panel', 'robots.txt', '.env',
      'login', 'api', 'config', 'uploads', 'images'];

    await Effects.progressBar(this.output, '扫描中...', 2000);

    for (const word of wordlist) {
      const testUrl = `${url}${word}/`;
      const exists = level.pages[testUrl] || level.pages[`${url}${word}`];
      if (exists) {
        Effects.instantLine(this.output, `+ ${testUrl} (Status: 200)`, 'success');
      } else {
        Effects.instantLine(this.output, `- ${testUrl} (Status: 404)`, 'output');
      }
      await Effects.sleep(100);
    }

    Effects.instantLine(this.output, `---- 扫描完成 ----`, 'info');
    Effects.instantLine(this.output, `发现隐藏目录！试试用 curl 访问它们。`, 'warning');

    // 成就：一次扫描就找到
    if (!GameState.tempState.dirbUsed) {
      GameState.tempState.dirbUsed = true;
      GameState.addAchievement(Achievements.DIR_HUNTER);
      this.updateAchievements();
    }
  },

  async cmdCat(args, level) {
    if (GameState.currentLevel !== 1) {
      Effects.instantLine(this.output, '此命令在当前关卡不可用。', 'error');
      return;
    }
    const file = args.trim();
    if (file === 'robots.txt') {
      const page = level.pages['http://target.site/robots.txt'];
      if (page) Effects.instantLine(this.output, page.content, 'output');
    } else {
      Effects.instantLine(this.output, `cat: ${file}: 没有那个文件或目录`, 'error');
    }
  },

  // ===== 关卡3命令 =====

  async cmdSqlmap(args, level) {
    if (GameState.currentLevel !== 2) {
      Effects.instantLine(this.output, '此命令在当前关卡不可用。', 'error');
      return;
    }
    GameState.tempState.sqlmapUsed = true;

    Effects.instantLine(this.output, `[*] starting @ 12:00:00 2026-03-15`, 'info');
    Effects.instantLine(this.output, `[*] testing connection to the target URL`, 'output');
    await Effects.sleep(500);
    await Effects.progressBar(this.output, '检测注入点...', 1500);

    Effects.instantLine(this.output, `[+] parameter 'username' is vulnerable`, 'success');
    Effects.instantLine(this.output, `Type: boolean-based blind`, 'output');
    Effects.instantLine(this.output, `Title: OR boolean-based blind`, 'output');
    await Effects.sleep(300);

    Effects.instantLine(this.output, `[+] the back-end DBMS is MySQL`, 'success');
    Effects.instantLine(this.output, `[+] fetching current user...`, 'output');
    await Effects.sleep(500);
    Effects.instantLine(this.output, `current user: 'admin@localhost'`, 'info');

    Effects.instantLine(this.output, `\n[*] Payload: username=admin' OR 1=1--&password=test`, 'warning');
    Effects.instantLine(this.output, `[*] 使用 login admin' OR 1=1 - 任意密码 来绕过认证`, 'warning');
  },

  async cmdLogin(args, level) {
    if (GameState.currentLevel !== 2) {
      Effects.instantLine(this.output, '此命令在当前关卡不可用。', 'error');
      return;
    }

    const parts = args.split(/\s+/);
    if (parts.length < 2) {
      Effects.instantLine(this.output, '用法: login <username> <password>', 'error');
      return;
    }

    const username = parts[0];
    const password = parts.slice(1).join(' ');

    Effects.instantLine(this.output, `正在认证...`, 'system');
    await Effects.sleep(800);

    const result = level.tryLogin(username, password);

    if (result.success && result.type === 'injection') {
      Effects.instantLine(this.output, `🔓 SQL 注入成功！`, 'success');
      Effects.instantLine(this.output, `Welcome, admin!`, 'success');
      await Effects.sleep(300);
      Effects.instantLine(this.output, `\n管理员面板内容:`, 'info');
      Effects.instantLine(this.output, `用户名: admin`, 'output');
      Effects.instantLine(this.output, `权限: root`, 'output');
      Effects.instantLine(this.output, `Flag: ${level.flag}`, 'flag');
      Effects.instantLine(this.output, `\n使用 submit ${level.flag} 提交 flag`, 'warning');

      // 成就：没用 sqlmap 直接手写注入
      if (!GameState.tempState.sqlmapUsed) {
        GameState.addAchievement(Achievements.SQL_PRO);
        this.updateAchievements();
      }
    } else if (result.success) {
      Effects.instantLine(this.output, `✅ 登录成功！`, 'success');
      Effects.instantLine(this.output, `但你用的是正常登录，试试 SQL 注入方式。`, 'warning');
    } else {
      Effects.instantLine(this.output, `❌ 认证失败：用户名或密码错误`, 'error');
      Effects.instantLine(this.output, `提示: 尝试 SQL 注入绕过...`, 'system');
    }
  },

  // ===== 关卡4命令 =====

  async cmdSearch(args, level) {
    if (GameState.currentLevel !== 3) {
      Effects.instantLine(this.output, '此命令在当前关卡不可用。', 'error');
      return;
    }

    if (!args.trim()) {
      Effects.instantLine(this.output, '用法: search <query>', 'error');
      return;
    }

    Effects.instantLine(this.output, `搜索: "${args}"`, 'system');
    await Effects.sleep(300);

    const result = level.checkXSS(args);

    if (result.success) {
      Effects.instantLine(this.output, `\n[服务端日志]`, 'info');
      Effects.instantLine(this.output, `⚠️  检测到脚本注入！`, 'warning');
      Effects.instantLine(this.output, `管理员 Cookie: session=admin_token_xyz_secret`, 'output');
      Effects.instantLine(this.output, ``, 'output');

      if (result.type === 'cookie_theft') {
        Effects.instantLine(this.output, `🎯 XSS 攻击成功！Cookie 已泄露！`, 'success');
        Effects.instantLine(this.output, ``, 'output');
        Effects.instantLine(this.output, `模拟攻击者收到:`, 'info');
        Effects.instantLine(this.output, `GET http://evil.com?c=session=admin_token_xyz_secret`, 'output');
        Effects.instantLine(this.output, ``, 'output');
        Effects.instantLine(this.output, `Flag: ${level.flag}`, 'flag');
        Effects.instantLine(this.output, `\n使用 submit ${level.flag} 提交 flag`, 'warning');

        // 检查是否一次成功
        if (GameState.tempState.xssAttempts === 0) {
          GameState.addAchievement(Achievements.XSS_MASTER);
          this.updateAchievements();
        }
      } else {
        Effects.instantLine(this.output, `XSS 触发了，但没有获取到 cookie。`, 'warning');
        Effects.instantLine(this.output, `提示: payload 中需要包含 document.cookie`, 'system');
      }
    } else if (result.partial) {
      Effects.instantLine(this.output, `检测到 HTML 注入，但脚本未执行。`, 'warning');
      Effects.instantLine(this.output, `提示: 确保 payload 是有效的 JavaScript`, 'system');
    } else {
      Effects.instantLine(this.output, `搜索结果: 未找到 "${args}" 的相关结果`, 'output');
    }

    GameState.tempState.xssAttempts = (GameState.tempState.xssAttempts || 0) + 1;
  },

  // ===== 关卡5命令 =====

  async cmdHydra(args, level) {
    if (GameState.currentLevel !== 4) {
      Effects.instantLine(this.output, '此命令在当前关卡不可用。', 'error');
      return;
    }

    Effects.instantLine(this.output, `Hydra v9.3`, 'info');
    Effects.instantLine(this.output, `目标: target.site (SSH)`, 'output');
    Effects.instantLine(this.output, `字典: /usr/share/wordlists/rockyou.txt (${level.dictionary.length} 条)`, 'output');
    await Effects.sleep(300);

    await Effects.progressBar(this.output, '暴力破解中...', 3000);

    // 模拟尝试过程
    const attempts = ['password', 'admin', 'letmein', 'qwerty', '123456'];
    for (const pwd of attempts) {
      Effects.instantLine(this.output, `[尝试] admin:${pwd}`, 'output');
      await Effects.sleep(200);
    }

    Effects.instantLine(this.output, ``, 'output');
    Effects.instantLine(this.output, `[✅] 找到有效凭据！`, 'success');
    Effects.instantLine(this.output, `[22][ssh] host: target.site  login: admin  password: ${level.password}`, 'success');
    Effects.instantLine(this.output, `MD5(${level.password}) = ${level.targetHash}`, 'info');
    Effects.instantLine(this.output, ``, 'output');
    Effects.instantLine(this.output, `Flag: ${level.flag}`, 'flag');
    Effects.instantLine(this.output, `\n使用 submit ${level.flag} 提交 flag`, 'warning');

    // 成就：密码猎人
    GameState.addAchievement(Achievements.PWD_HUNTER);
    this.updateAchievements();
  },

  async cmdScan(args, level) {
    if (GameState.currentLevel !== 4) {
      Effects.instantLine(this.output, '此命令在当前关卡不可用。', 'error');
      return;
    }

    Effects.instantLine(this.output, `[*] 目标哈希: ${level.targetHash}`, 'info');
    Effects.instantLine(this.output, `[*] 哈希类型: MD5`, 'output');
    Effects.instantLine(this.output, `[*] 开始字典攻击...`, 'system');
    await Effects.sleep(500);

    await Effects.progressBar(this.output, '破解中...', 2000);

    Effects.instantLine(this.output, `[+] 碎片: 尝试 ${level.dictionary.length} 个常见密码`, 'output');
    await Effects.sleep(500);
    Effects.instantLine(this.output, `[+] 匹配成功！`, 'success');
    Effects.instantLine(this.output, `[+] ${level.targetHash} => ${level.password}`, 'success');
    Effects.instantLine(this.output, ``, 'output');
    Effects.instantLine(this.output, `Flag: ${level.flag}`, 'flag');
    Effects.instantLine(this.output, `\n使用 submit ${level.flag} 提交 flag`, 'warning');

    // 成就：密码猎人
    GameState.addAchievement(Achievements.PWD_HUNTER);
    this.updateAchievements();
  },

  // ===== 关卡6命令 =====

  async cmdRead(args, level) {
    if (GameState.currentLevel !== 5) {
      Effects.instantLine(this.output, '此命令在当前关卡不可用。', 'error');
      return;
    }

    const id = parseInt(args.trim());
    const email = level.emails.find(e => e.id === id);

    if (!email) {
      Effects.instantLine(this.output, `邮件 #${args} 不存在。可用邮件 ID: 1-4`, 'error');
      return;
    }

    Effects.instantLine(this.output, `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'info');
    Effects.instantLine(this.output, `发件人: ${email.fromDisplay} <${email.from}>`, 'output');
    Effects.instantLine(this.output, `时  间: ${email.date}`, 'output');
    Effects.instantLine(this.output, `主  题: ${email.subject}`, 'output');
    Effects.instantLine(this.output, `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'info');
    Effects.instantLine(this.output, email.body, 'output');
    Effects.instantLine(this.output, `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'info');

    Effects.instantLine(this.output, `\n💡 仔细阅读后，用 analyze ${id} 分析线索，再用 judge ${id} phishing/safe 给出判断`, 'info');
  },

  async cmdAnalyze(args, level) {
    if (GameState.currentLevel !== 5) {
      Effects.instantLine(this.output, '此命令在当前关卡不可用。', 'error');
      return;
    }

    const id = parseInt(args.trim());
    const email = level.emails.find(e => e.id === id);

    if (!email) {
      Effects.instantLine(this.output, `邮件 #${args} 不存在。`, 'error');
      return;
    }

    Effects.instantLine(this.output, `🔍 分析邮件 #${id}...`, 'system');
    await Effects.sleep(500);

    if (!email.suspicious) {
      Effects.instantLine(this.output, `✅ 未发现明显可疑内容。`, 'success');
      Effects.instantLine(this.output, `💡 但这不代表一定安全，用 judge 命令给出你的判断。`, 'info');
      return;
    }

    Effects.instantLine(this.output, `\n⚠️  发现以下可疑线索:`, 'warning');
    for (let i = 0; i < email.clues.length; i++) {
      Effects.instantLine(this.output, `  ${i + 1}. ${email.clues[i]}`, 'error');
      await Effects.sleep(200);
    }

    Effects.instantLine(this.output, `\n💡 用 judge ${id} phishing 或 judge ${id} safe 给出你的判断。`, 'info');
  },

  async cmdJudge(args, level) {
    if (GameState.currentLevel !== 5) {
      Effects.instantLine(this.output, '此命令在当前关卡不可用。', 'error');
      return;
    }

    const parts = args.trim().split(/\s+/);
    const id = parseInt(parts[0]);
    const verdict = (parts[1] || '').toLowerCase();

    if (!id || !['phishing', 'safe', '钓鱼', '正常', '安全'].includes(verdict)) {
      Effects.instantLine(this.output, '用法: judge <邮件ID> <phishing|safe>', 'error');
      Effects.instantLine(this.output, '  phishing / 钓鱼 — 判定为钓鱼邮件', 'output');
      Effects.instantLine(this.output, '  safe / 正常 / 安全 — 判定为正常邮件', 'output');
      Effects.instantLine(this.output, '示例: judge 1 phishing', 'info');
      return;
    }

    const email = level.emails.find(e => e.id === id);
    if (!email) {
      Effects.instantLine(this.output, `邮件 #${id} 不存在。可用邮件 ID: 1-4`, 'error');
      return;
    }

    if (!GameState.tempState.judgedEmails) GameState.tempState.judgedEmails = {};
    const isReJudge = GameState.tempState.judgedEmails[id] !== undefined;

    const isPhishing = ['phishing', '钓鱼'].includes(verdict);
    GameState.tempState.judgedEmails[id] = isPhishing;

    Effects.instantLine(this.output, '', 'output');
    Effects.instantLine(this.output, `━━━ 邮件 #${id} 判定结果${isReJudge ? '（重新判定）' : ''} ━━━`, 'info');
    Effects.instantLine(this.output, `你的判定: ${isPhishing ? '🎣 钓鱼邮件' : '✅ 正常邮件'}`, 'output');

    const correct = isPhishing === email.suspicious;

    if (correct) {
      Effects.instantLine(this.output, `✅ 判定正确！`, 'success');
      if (email.suspicious && email.clues.length > 0) {
        Effects.instantLine(this.output, `\n📋 线索分析:`, 'info');
        for (let i = 0; i < email.clues.length; i++) {
          Effects.instantLine(this.output, `  ${i + 1}. ${email.clues[i]}`, 'warning');
          await Effects.sleep(150);
        }
      }
    } else {
      Effects.instantLine(this.output, `❌ 判定错误！`, 'error');
      if (email.suspicious) {
        Effects.instantLine(this.output, `这封邮件实际上是 🎣 钓鱼邮件！`, 'warning');
        Effects.instantLine(this.output, `💡 提示: 用 read ${id} 重新查看，或 analyze ${id} 获取线索。`, 'info');
      } else {
        Effects.instantLine(this.output, `这封邮件实际上是 ✅ 正常邮件。`, 'warning');
        Effects.instantLine(this.output, `💡 不是所有邮件都是钓鱼，注意区分。`, 'info');
      }
    }

    // 检查是否全部判定完成
    const allEmails = level.emails;
    const allJudged = allEmails.every(e => GameState.tempState.judgedEmails[e.id] !== undefined);

    if (allJudged) {
      // 统计结果
      let correctCount = 0;
      let wrongIds = [];
      for (const e of allEmails) {
        if (GameState.tempState.judgedEmails[e.id] === e.suspicious) {
          correctCount++;
        } else {
          wrongIds.push(e.id);
        }
      }

      Effects.instantLine(this.output, '', 'output');
      Effects.instantLine(this.output, `━━━ 判定汇总 ━━━`, 'info');
      Effects.instantLine(this.output, `正确: ${correctCount}/${allEmails.length}`, correctCount === allEmails.length ? 'success' : 'warning');

      if (wrongIds.length > 0) {
        Effects.instantLine(this.output, `错误的邮件: #${wrongIds.join(', #')}`, 'error');
        Effects.instantLine(this.output, `💡 输入 judge <id> 重新判定错误的邮件。`, 'info');
      }

      // 全部正确才给 flag
      const phishingCorrect = allEmails
        .filter(e => e.suspicious)
        .every(e => GameState.tempState.judgedEmails[e.id] === true);

      if (phishingCorrect && wrongIds.length === 0) {
        Effects.instantLine(this.output, '', 'output');
        Effects.instantLine(this.output, `🎉 完美！你成功识别了所有钓鱼邮件！`, 'success');
        Effects.instantLine(this.output, `Flag: ${level.flag}`, 'flag');
        Effects.instantLine(this.output, `\n使用 submit ${level.flag} 提交 flag`, 'warning');
        GameState.addAchievement(Achievements.PHISH_SPOTTER);

        // 检查是否发现 CEO 欺诈
        if (GameState.tempState.judgedEmails[4] === true) {
          GameState.addAchievement(Achievements.PERCEPTION);
        }
        this.updateAchievements();
      } else if (phishingCorrect) {
        Effects.instantLine(this.output, `\n⚠️  钓鱼邮件都找对了，但正常邮件判定有误。重新检查一下吧！`, 'warning');
      } else {
        Effects.instantLine(this.output, `\n⚠️  还有钓鱼邮件没找出来，继续努力！`, 'warning');
      }
    } else {
      const remaining = allEmails.filter(e => GameState.tempState.judgedEmails[e.id] === undefined);
      Effects.instantLine(this.output, `\n📬 还有 ${remaining.length} 封邮件未判定: #${remaining.map(e => e.id).join(', #')}`, 'info');
    }
  },

  // ===== 彩蛋命令 =====

  cmdMatrix() {
    const canvas = document.getElementById('matrix-bg');
    canvas.style.opacity = '0.25';
    Effects.instantLine(this.output, '🌀 矩阵模式已激活...', 'success');
    setTimeout(() => { canvas.style.opacity = '0.06'; }, 5000);
  },

  async cmdHack() {
    const output = this.output;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randChar = () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*!~'[rand(0, 65)];

    // === 阶段1: 初始化 ===
    Effects.instantLine(output, '[ SYSTEM ] Initializing hack sequence...', 'system');
    await sleep(300);

    // 乱码滚动效果
    Effects.instantLine(output, '', 'output');
    for (let i = 0; i < 6; i++) {
      let garbage = '';
      for (let j = 0; j < 60; j++) garbage += randChar();
      Effects.instantLine(output, garbage, 'output');
      await sleep(80);
    }

    // === 阶段2: 屏幕震动 ===
    Effects.shakeScreen();
    await sleep(200);

    // === 阶段3: 逐格填充进度条 ===
    const steps = [
      'Bypassing firewall',
      'Cracking encryption',
      'Injecting payload',
      'Escalating privileges',
      'Accessing mainframe',
      'Extracting data',
    ];

    for (const step of steps) {
      const line = document.createElement('div');
      line.className = 'terminal-line success';
      output.appendChild(line);

      const width = 30;
      for (let i = 0; i <= width; i++) {
        const filled = '█'.repeat(i);
        const empty = '░'.repeat(width - i);
        const percent = Math.round((i / width) * 100);
        line.textContent = `[${filled}${empty}] ${percent}% ${step}`;
        output.scrollTop = output.scrollHeight;
        await sleep(40);
      }
      await sleep(100);
    }

    // === 阶段4: 密集乱码爆发 ===
    Effects.shakeScreen();
    Effects.instantLine(output, '', 'output');
    for (let i = 0; i < 10; i++) {
      let garbage = '';
      for (let j = 0; j < 70; j++) garbage += randChar();
      Effects.instantLine(output, garbage, i % 2 === 0 ? 'success' : 'output');
      await sleep(50);
    }

    // === 阶段5: ASCII art 收尾 ===
    await sleep(300);
    Effects.shakeScreen();

    const ascii = [
      '',
      '  ██╗  ██╗ █████╗  ██████╗██╗  ██╗███████╗██████╗ ',
      '  ██║  ██║██╔══██╗██╔════╝██║ ██╔╝██╔════╝██╔══██╗',
      '  ███████║███████║██║     █████╔╝ █████╗  ██║  ██║',
      '  ██╔══██║██╔══██║██║     ██╔═██╗ ██╔══╝  ██║  ██║',
      '  ██║  ██║██║  ██║╚██████╗██║  ██╗███████╗██████╔╝',
      '  ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═════╝',
      '',
      '        ⚡ ACCESS GRANTED ⚡',
      '',
    ];

    for (const line of ascii) {
      Effects.instantLine(output, line, 'success');
      await sleep(60);
    }

    // === 阶段6: 彩蛋结尾 ===
    await sleep(500);
    Effects.instantLine(output, 'Just kidding 😄 这只是个游戏！', 'warning');
    await sleep(200);
    Effects.instantLine(output, '继续你的渗透任务吧，特工。', 'info');
    Effects.instantLine(output, '', 'output');
  },

  // ===== 关卡完成 =====

  async levelComplete(level) {
    const timeUsed = Math.floor((Date.now() - GameState.levelStartTime) / 1000);
    const hintPenalty = GameState.hintsUsed * 50;
    const levelScore = Math.max(0, level.baseScore - hintPenalty);

    GameState.score += levelScore;
    GameState.levelScores.push(levelScore);

    // 成就检查（使用关卡开始时记录的成就数）
    const prevCount = GameState.tempState.levelStartAchievementCount || 0;

    // 每关通关必给成就
    const clearAchievement = LevelClearAchievements[GameState.currentLevel];
    if (clearAchievement) {
      GameState.addAchievement(clearAchievement);
    }
    // 不用提示额外成就
    if (GameState.hintsUsed === 0) {
      GameState.addAchievement(Achievements.NO_HINTS);
    }

    // 收集本关新获得的成就
    const newAchievements = GameState.achievements.slice(prevCount);

    // 最后一关弹窗显示全部成就汇总
    const isLastLevel = GameState.currentLevel >= Levels.length - 1;
    const modalAchievements = isLastLevel ? GameState.achievements : newAchievements;

    document.getElementById('score').textContent = GameState.score;
    this.updateAchievements();

    Effects.shakeScreen();

    await Effects.sleep(150);
    Effects.showLevelComplete(level, levelScore, timeUsed, GameState.hintsUsed, modalAchievements, isLastLevel);
  },

  // ===== 游戏初始化 =====

  async showLevelIntro(level) {
    this.output.innerHTML = '';
    GameState.tempState = {};
    GameState.hintsUsed = 0;
    GameState.levelStartTime = Date.now();

    document.getElementById('current-level').textContent = level.id;
    document.getElementById('mission-brief').textContent = level.brief;
    document.getElementById('mission-target').textContent = level.target;
    document.getElementById('mission-hint').textContent = '输入 hint 获取提示';

    // 记录关卡开始时的成就数，用于收集本关新成就
    GameState.tempState.levelStartAchievementCount = GameState.achievements.length;

    // 更新成就显示
    this.updateAchievements();

    // 终端欢迎信息
    await Effects.typewriterLine(this.output, `════════════════════════════════════════`, 'info', 10);
    await Effects.typewriterLine(this.output, `  任务 ${level.id}: ${level.name}`, 'success', 20);
    await Effects.typewriterLine(this.output, `════════════════════════════════════════`, 'info', 10);
    await Effects.sleep(300);
    await Effects.typewriterLine(this.output, level.brief, 'output', 15);
    await Effects.sleep(200);
    Effects.instantLine(this.output, '', 'output');
    Effects.instantLine(this.output, `🎯 目标: ${level.target}`, 'warning');
    Effects.instantLine(this.output, `💡 输入 hint 获取提示 (扣50分)`, 'system');
    Effects.instantLine(this.output, `📝 输入 submit <flag> 提交答案`, 'system');
    Effects.instantLine(this.output, `❓ 输入 help 查看所有命令`, 'system');
    Effects.instantLine(this.output, '', 'output');

    // 特殊关卡提示
    if (level.id === 1) {
      Effects.instantLine(this.output, `提示: 试试 curl http://target.site/`, 'info');
    } else if (level.id === 2) {
      Effects.instantLine(this.output, `提示: 试试 dirb http://target.site/`, 'info');
    } else if (level.id === 3) {
      Effects.instantLine(this.output, `提示: 试试 sqlmap -u http://target.site/login`, 'info');
    } else if (level.id === 4) {
      Effects.instantLine(this.output, `提示: 试试 search <你的payload>`, 'info');
    } else if (level.id === 5) {
      Effects.instantLine(this.output, `目标哈希: ${level.targetHash}`, 'warning');
      Effects.instantLine(this.output, `提示: 试试 scan 或 hydra`, 'info');
    } else if (level.id === 6) {
      Effects.instantLine(this.output, `你收到了 4 封邮件，用 read <1-4> 查看`, 'warning');
      Effects.instantLine(this.output, ``, 'output');
      Effects.instantLine(this.output, `📝 你的任务: 判断每封邮件是钓鱼还是正常`, 'info');
      Effects.instantLine(this.output, `   judge <id> phishing — 判定为钓鱼邮件`, 'output');
      Effects.instantLine(this.output, `   judge <id> safe     — 判定为正常邮件`, 'output');
      Effects.instantLine(this.output, ``, 'output');
      Effects.instantLine(this.output, `💡 先用 read 查看邮件内容，再用 analyze 分析线索，最后用 judge 给出判断`, 'system');
      Effects.instantLine(this.output, `⚠️  注意: 正常邮件也会混在里面，不是每封都是钓鱼！`, 'warning');
    }
  },

  updateAchievements() {
    const container = document.getElementById('achievements');
    const prevCount = parseInt(container.dataset.count || '0');
    const currentCount = GameState.achievements.length;

    if (currentCount === 0) {
      container.innerHTML = '<span style="color:#607080;font-size:12px;">暂无成就</span>';
    } else {
      container.innerHTML = GameState.achievements.map(a =>
        `<span class="achievement-badge" title="${a.desc}">${a.icon} ${a.name}</span>`
      ).join('');

      // 新解锁的成就弹 toast
      if (currentCount > prevCount) {
        const latest = GameState.achievements[currentCount - 1];
        Effects.showToast(`🏆 成就解锁: ${latest.icon} ${latest.name}`);
      }
    }
    container.dataset.count = currentCount;
  },

  clear() {
    this.output.innerHTML = '';
  }
};
