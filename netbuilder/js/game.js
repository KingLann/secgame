/**
 * game.js - NetBuilder 网络攻防沙盒 游戏逻辑
 */

var Game = {
  state: 'menu',
  currentLevel: 0,
  score: 0,
  levelResults: [],
  // 画布状态
  devices: [],       // {id, type, x, y, config:{}}
  connections: [],   // {from: deviceId, to: deviceId}
  selectedDevice: null,
  connectMode: false,
  connectFrom: null,
  deviceIdCounter: 0,
  dragType: null,    // 正在拖拽的组件类型
  dragEl: null,      // 拖拽中的幽灵元素

  init() {
    this.loadProgress();
    this.bindEvents();
    this.showScreen('start');
  },

  bindEvents() {
    var self = this;
    document.getElementById('start-btn').addEventListener('click', function() {
      self.showScreen('levels');
      self.renderLevels();
    });
    document.getElementById('back-btn').addEventListener('click', function() {
      self.showScreen('levels');
      self.renderLevels();
    });
    document.getElementById('clear-btn').addEventListener('click', function() {
      self.clearCanvas();
    });
    document.getElementById('simulate-btn').addEventListener('click', function() {
      self.showAttackSelect();
    });
    document.getElementById('connect-btn').addEventListener('click', function() {
      self.toggleConnectMode();
    });
    document.getElementById('sim-close-btn').addEventListener('click', function() {
      document.getElementById('sim-overlay').classList.add('hidden');
    });
    document.getElementById('sim-next-btn').addEventListener('click', function() {
      document.getElementById('sim-overlay').classList.add('hidden');
      var next = self.currentLevel + 1;
      if (next < NB_LEVELS.length) {
        self.startLevel(next);
      } else {
        self.showScreen('levels');
        self.renderLevels();
      }
    });
    document.getElementById('attack-cancel-btn').addEventListener('click', function() {
      document.getElementById('attack-overlay').classList.add('hidden');
    });

    // 画布点击取消选中
    document.getElementById('canvas-area').addEventListener('click', function(e) {
      if (e.target === this || e.target.id === 'canvas-hint' || e.target.id === 'connections-svg') {
        self.selectDevice(null);
      }
    });
  },

  showScreen(name) {
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    var el = document.getElementById(name + '-screen');
    if (el) el.classList.add('active');
    this.state = name === 'start' ? 'menu' : name === 'levels' ? 'levels' : 'playing';
  },

  loadProgress() {
    try {
      var saved = localStorage.getItem('netbuilder_progress');
      if (saved) { var d = JSON.parse(saved); this.levelResults = d.levelResults || []; this.score = d.score || 0; }
    } catch (e) { this.levelResults = []; this.score = 0; }
  },
  saveProgress() {
    try { localStorage.setItem('netbuilder_progress', JSON.stringify({ levelResults: this.levelResults, score: this.score })); } catch (e) {}
  },

  renderLevels() {
    var c = document.getElementById('level-grid'); c.innerHTML = '';
    var self = this;
    NB_LEVELS.forEach(function(lv, i) {
      var r = self.levelResults[i];
      var stars = '';
      if (r && r.completed) { stars = '⭐'.repeat(r.stars) + '☆'.repeat(3 - r.stars); }
      var card = document.createElement('div'); card.className = 'level-card';
      card.innerHTML = '<div class="level-icon">' + lv.icon + '</div>' +
        '<div class="level-meta"><div class="level-name">' + lv.name + '</div>' +
        '<div class="level-en">' + lv.enName + '</div>' +
        '<div class="level-desc"><span class="diff">' + lv.difficulty + '</span><span>预算: ' + lv.budget + '</span></div></div>' +
        '<div class="level-stars">' + (stars || '☆☆☆') + '</div>';
      card.addEventListener('click', function() { self.startLevel(i); });
      c.appendChild(card);
    });
    document.getElementById('total-score').textContent = this.score;
  },

  // ===== 开始关卡 =====
  startLevel(index) {
    this.currentLevel = index;
    this.devices = [];
    this.connections = [];
    this.selectedDevice = null;
    this.connectMode = false;
    this.connectFrom = null;
    this.deviceIdCounter = 0;
    this.showScreen('game');

    var lv = NB_LEVELS[index];
    document.getElementById('level-title').textContent = lv.icon + ' ' + lv.name;
    document.getElementById('level-difficulty').textContent = lv.difficulty;
    document.getElementById('hint-text').textContent = lv.hint;

    this.renderComponentBar(lv);
    this.renderLevelInfo(lv);
    this.clearCanvas();
    this.updateConnectBtn();
  },

  // ===== 渲染组件栏 =====
  renderComponentBar(lv) {
    var list = document.getElementById('comp-list'); list.innerHTML = '';
    var self = this;
    var all = lv.requiredDevices.concat(lv.availableDevices);
    // 去重
    var seen = {};
    all.forEach(function(id) {
      if (seen[id]) return; seen[id] = true;
      var comp = COMPONENTS[id];
      var div = document.createElement('div');
      div.className = 'comp-item';
      div.dataset.type = id;
      div.innerHTML = '<span class="comp-icon">' + comp.icon + '</span><span class="comp-name">' + comp.name + '</span>';
      // 拖拽开始
      div.addEventListener('mousedown', function(e) { self.startDrag(id, e); });
      div.addEventListener('touchstart', function(e) { self.startDrag(id, e); }, { passive: false });
      list.appendChild(div);
    });
  },

  renderLevelInfo(lv) {
    var info = document.getElementById('level-info');
    info.innerHTML =
      '<div class="info-row"><span class="info-key">目标</span><span class="info-val">' + lv.winCondition + '</span></div>' +
      '<div class="info-row"><span class="info-key">预算</span><span class="info-val">' + lv.budget + ' 个设备</span></div>' +
      '<div class="info-row"><span class="info-key">提示</span><span class="info-val" style="font-weight:normal;font-size:11px;color:var(--text-dim)">' + lv.hint + '</span></div>';
  },

  // ===== 拖拽 =====
  startDrag(type, e) {
    e.preventDefault();
    this.dragType = type;
    // 创建幽灵元素
    var ghost = document.createElement('div');
    ghost.style.cssText = 'position:fixed;width:60px;height:60px;border-radius:10px;background:rgba(230,81,0,0.15);border:2px dashed var(--accent);display:flex;align-items:center;justify-content:center;font-size:28px;z-index:999;pointer-events:none;';
    ghost.textContent = COMPONENTS[type].icon;
    document.body.appendChild(ghost);
    this.dragEl = ghost;
    this.moveDrag(e);
    var self = this;
    var moveFn = function(ev) { self.moveDrag(ev); };
    var upFn = function(ev) { self.endDrag(ev); document.removeEventListener('mousemove', moveFn); document.removeEventListener('mouseup', upFn); document.removeEventListener('touchmove', moveFn); document.removeEventListener('touchend', upFn); };
    document.addEventListener('mousemove', moveFn);
    document.addEventListener('mouseup', upFn);
    document.addEventListener('touchmove', moveFn, { passive: false });
    document.addEventListener('touchend', upFn);
  },

  moveDrag(e) {
    if (!this.dragEl) return;
    var cx, cy;
    if (e.touches) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; }
    else { cx = e.clientX; cy = e.clientY; }
    this.dragEl.style.left = (cx - 30) + 'px';
    this.dragEl.style.top = (cy - 30) + 'px';
  },

  endDrag(e) {
    if (!this.dragEl) return;
    this.dragEl.remove();
    this.dragEl = null;
    // 判断是否落在画布上
    var canvas = document.getElementById('canvas-area');
    var rect = canvas.getBoundingClientRect();
    var cx, cy;
    if (e.changedTouches) { cx = e.changedTouches[0].clientX; cy = e.changedTouches[0].clientY; }
    else { cx = e.clientX; cy = e.clientY; }
    if (cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom) {
      var x = cx - rect.left - 40;
      var y = cy - rect.top - 40;
      this.placeDevice(this.dragType, x, y);
    }
    this.dragType = null;
  },

  // ===== 放置设备 =====
  placeDevice(type, x, y) {
    var lv = NB_LEVELS[this.currentLevel];
    if (this.devices.length >= lv.budget) { this.showToast('已达到设备预算上限'); return; }
    // 限制不能超出画布
    x = Math.max(0, Math.min(x, 600));
    y = Math.max(0, Math.min(y, 350));
    var id = 'dev_' + (this.deviceIdCounter++);
    var comp = COMPONENTS[type];
    // 深拷贝配置
    var cfg = {};
    Object.keys(comp.config).forEach(function(k) { cfg[k] = JSON.parse(JSON.stringify(comp.config[k].value)); });
    var dev = { id: id, type: type, x: x, y: y, config: cfg };
    this.devices.push(dev);
    this.renderDeviceNode(dev);
    document.getElementById('canvas-hint').style.display = 'none';
    this.updateBudget();
  },

  renderDeviceNode(dev) {
    var comp = COMPONENTS[dev.type];
    var canvas = document.getElementById('canvas-area');
    var node = document.createElement('div');
    node.className = 'device-node';
    node.id = dev.id;
    node.style.left = dev.x + 'px';
    node.style.top = dev.y + 'px';
    node.innerHTML = '<div class="node-icon" style="border-color:' + comp.color + '">' + comp.icon + '</div><div class="node-name">' + comp.name + '</div>';
    var self = this;
    node.addEventListener('click', function(e) {
      e.stopPropagation();
      if (self.connectMode) {
        self.handleConnect(dev.id);
      } else {
        self.selectDevice(dev.id);
      }
    });
    // 双击删除
    node.addEventListener('dblclick', function(e) {
      e.stopPropagation();
      self.removeDevice(dev.id);
    });
    canvas.appendChild(node);
    // 可拖拽移动
    this.makeDraggable(node, dev);
  },

  makeDraggable(el, dev) {
    var self = this;
    var ox, oy, sx, sy;
    var down = function(e) {
      if (self.connectMode) return;
      e.preventDefault();
      e.stopPropagation();
      var ev = e.touches ? e.touches[0] : e;
      ox = ev.clientX; oy = ev.clientY;
      sx = dev.x; sy = dev.y;
      var move = function(e2) {
        var ev2 = e2.touches ? e2.touches[0] : e2;
        dev.x = Math.max(0, Math.min(sx + ev2.clientX - ox, 600));
        dev.y = Math.max(0, Math.min(sy + ev2.clientY - oy, 350));
        el.style.left = dev.x + 'px';
        el.style.top = dev.y + 'px';
        self.renderConnections();
      };
      var up = function() {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
        document.removeEventListener('touchmove', move);
        document.removeEventListener('touchend', up);
      };
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
      document.addEventListener('touchmove', move, { passive: false });
      document.addEventListener('touchend', up);
    };
    el.addEventListener('mousedown', down);
    el.addEventListener('touchstart', down, { passive: false });
  },

  removeDevice(id) {
    this.devices = this.devices.filter(function(d) { return d.id !== id; });
    this.connections = this.connections.filter(function(c) { return c.from !== id && c.to !== id; });
    var el = document.getElementById(id);
    if (el) el.remove();
    this.renderConnections();
    if (this.selectedDevice === id) this.selectDevice(null);
    if (this.devices.length === 0) document.getElementById('canvas-hint').style.display = '';
    this.updateBudget();
  },

  selectDevice(id) {
    this.selectedDevice = id;
    document.querySelectorAll('.device-node').forEach(function(n) { n.classList.toggle('selected', n.id === id); });
    if (id) {
      var dev = this.devices.find(function(d) { return d.id === id; });
      this.renderDeviceConfig(dev);
    } else {
      document.getElementById('device-config').classList.add('hidden');
    }
  },

  renderDeviceConfig(dev) {
    var comp = COMPONENTS[dev.type];
    var panel = document.getElementById('device-config');
    panel.classList.remove('hidden');
    var html = '<h4>' + comp.icon + ' ' + comp.name + ' 配置</h4>';
    var self = this;
    Object.keys(comp.config).forEach(function(key) {
      var def = comp.config[key];
      var val = dev.config[key];
      if (def.type === 'select') {
        html += '<div class="config-group"><div class="config-label">' + def.label + '</div>';
        html += '<select class="config-select" data-key="' + key + '">';
        def.options.forEach(function(opt) {
          html += '<option value="' + opt + '"' + (val === opt ? ' selected' : '') + '>' + opt + '</option>';
        });
        html += '</select></div>';
      } else if (def.type === 'toggle') {
        html += '<div class="config-toggle"><label class="toggle-switch"><input type="checkbox" data-key="' + key + '"' + (val ? ' checked' : '') + '><span class="toggle-slider"></span></label>';
        html += '<span class="config-label">' + def.label + '</span></div>';
      }
    });
    html += '<div style="margin-top:8px;font-size:10px;color:var(--text-dim)">双击设备可删除</div>';
    panel.innerHTML = html;
    // 绑定配置变更
    panel.querySelectorAll('select').forEach(function(sel) {
      sel.addEventListener('change', function() { dev.config[this.dataset.key] = this.value; });
    });
    panel.querySelectorAll('input[type=checkbox]').forEach(function(cb) {
      cb.addEventListener('change', function() { dev.config[this.dataset.key] = this.checked; });
    });
  },

  updateBudget() {
    var lv = NB_LEVELS[this.currentLevel];
    var remaining = lv.budget - this.devices.length;
    document.getElementById('hint-text').textContent = '剩余预算: ' + remaining + ' | ' + lv.hint;
  },

  // ===== 连线模式 =====
  toggleConnectMode() {
    this.connectMode = !this.connectMode;
    this.connectFrom = null;
    this.updateConnectBtn();
  },
  updateConnectBtn() {
    var btn = document.getElementById('connect-btn');
    if (this.connectMode) {
      btn.textContent = '🔗 连线中（点击取消）';
      btn.style.background = 'var(--accent)';
      btn.style.color = '#fff';
    } else {
      btn.textContent = '🔗 连线模式';
      btn.style.background = '';
      btn.style.color = '';
    }
  },
  handleConnect(id) {
    if (!this.connectFrom) {
      this.connectFrom = id;
      this.showToast('请点击另一个设备完成连线');
    } else if (this.connectFrom === id) {
      this.connectFrom = null;
    } else {
      // 检查是否已存在
      var exists = this.connections.some(function(c) {
        return (c.from === this.connectFrom && c.to === id) || (c.from === id && c.to === this.connectFrom);
      }.bind(this));
      if (!exists) {
        this.connections.push({ from: this.connectFrom, to: id });
        this.renderConnections();
      }
      this.connectFrom = null;
      this.showToast('连线完成');
    }
  },

  renderConnections() {
    var svg = document.getElementById('connections-svg');
    svg.innerHTML = '';
    var canvas = document.getElementById('canvas-area');
    var self = this;
    this.connections.forEach(function(conn) {
      var fromDev = self.devices.find(function(d) { return d.id === conn.from; });
      var toDev = self.devices.find(function(d) { return d.id === conn.to; });
      if (!fromDev || !toDev) return;
      var x1 = fromDev.x + 40, y1 = fromDev.y + 40;
      var x2 = toDev.x + 40, y2 = toDev.y + 40;
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1); line.setAttribute('y1', y1);
      line.setAttribute('x2', x2); line.setAttribute('y2', y2);
      line.setAttribute('stroke', '#90a4ae'); line.setAttribute('stroke-width', '2');
      line.setAttribute('stroke-dasharray', '6,3');
      svg.appendChild(line);
    });
  },

  clearCanvas() {
    this.devices = [];
    this.connections = [];
    this.selectedDevice = null;
    this.deviceIdCounter = 0;
    var canvas = document.getElementById('canvas-area');
    canvas.querySelectorAll('.device-node').forEach(function(n) { n.remove(); });
    document.getElementById('connections-svg').innerHTML = '';
    document.getElementById('canvas-hint').style.display = '';
    document.getElementById('device-config').classList.add('hidden');
  },

  // ===== 攻击选择 =====
  showAttackSelect() {
    var lv = NB_LEVELS[this.currentLevel];
    var attacks = lv.attacks || [lv.attack];
    var container = document.getElementById('attack-select');
    container.innerHTML = '';
    var self = this;
    attacks.forEach(function(atkId) {
      var atk = ATTACK_TYPES[atkId];
      var div = document.createElement('div');
      div.className = 'attack-option';
      div.innerHTML = '<span class="atk-icon">' + atk.icon + '</span><div><div class="atk-name">' + atk.name + '</div><div class="atk-desc">' + atk.desc + '</div></div>';
      div.addEventListener('click', function() {
        document.getElementById('attack-overlay').classList.add('hidden');
        self.runSimulation(atkId);
      });
      container.appendChild(div);
    });
    document.getElementById('attack-overlay').classList.remove('hidden');
  },

  // ===== 模拟逻辑 =====
  runSimulation(attackId) {
    var atk = ATTACK_TYPES[attackId];
    var result = this.simulateAttack(atk);
    // 显示结果
    var title = result.blocked ? '🛡️ 攻击被拦截！' : '💀 防线被突破！';
    document.getElementById('sim-title').textContent = title;

    var html = '';
    result.steps.forEach(function(step) {
      html += '<div style="padding:3px 0;' + (step.passed ? 'color:var(--green)' : 'color:var(--red);font-weight:bold') + '">';
      html += (step.passed ? '✅ ' : '❌ ') + step.desc + '</div>';
    });
    document.getElementById('sim-result').innerHTML = html;

    var score = result.blocked ? 100 : Math.max(0, 100 - result.breached * 30);
    document.getElementById('sim-score').textContent = score + ' 分';

    var lv = NB_LEVELS[this.currentLevel];
    document.getElementById('knowledge-title').textContent = lv.knowledge.title;
    document.getElementById('knowledge-body').textContent = lv.knowledge.body;

    if (result.blocked) {
      this.levelResults[this.currentLevel] = {
        completed: true,
        stars: score >= 90 ? 3 : score >= 60 ? 2 : 1
      };
      this.score += 10;
      this.saveProgress();
    }

    document.getElementById('sim-overlay').classList.remove('hidden');
    document.getElementById('sim-next-btn').style.display = result.blocked ? '' : 'none';
  },

  simulateAttack(atk) {
    var steps = [];
    var blocked = false;
    var breached = 0;
    var self = this;

    // 1. 找到攻击源（attacker设备）
    var attackers = this.devices.filter(function(d) { return d.type === 'attacker'; });
    if (attackers.length === 0) {
      steps.push({ desc: '没有放置攻击机，无法模拟', passed: false });
      return { blocked: false, steps: steps, breached: 1 };
    }

    // 2. 找到目标设备
    var targets;
    if (atk.target === 'all' || NB_LEVELS[this.currentLevel].targetDevice === 'all') {
      targets = this.devices.filter(function(d) { return d.type !== 'attacker'; });
    } else {
      targets = this.devices.filter(function(d) { return d.type === atk.target; });
    }
    if (targets.length === 0) {
      steps.push({ desc: '没有找到攻击目标', passed: false });
      return { blocked: false, steps: steps, breached: 1 };
    }

    // 3. 对每个目标检查攻击路径
    var allBlocked = true;
    targets.forEach(function(target) {
      steps.push({ desc: '攻击目标: ' + COMPONENTS[target.type].name, passed: true });

      // 找从攻击者到目标的路径
      var path = self.findPath(attackers[0].id, target.id);
      if (!path) {
        steps.push({ desc: ' → 无法到达目标（未连线）', passed: true });
        return;
      }

      var attackBlocked = false;
      var targetBreached = false;

      // 沿路径检查每个设备
      for (var i = 1; i < path.length; i++) {
        var dev = self.devices.find(function(d) { return d.id === path[i]; });
        if (!dev) continue;

        if (dev.type === 'firewall') {
          var fwBlock = self.checkFirewall(dev, atk);
          if (fwBlock) {
            steps.push({ desc: ' → 🧱 防火墙拦截了 ' + atk.name, passed: true });
            attackBlocked = true;
            break;
          } else {
            steps.push({ desc: ' → 🧱 防火墙未拦截（规则配置不当）', passed: false });
          }
        }

        if (dev.type === 'ids') {
          var idsBlock = self.checkIDS(dev, atk);
          if (idsBlock) {
            steps.push({ desc: ' → 🔍 IDS/IPS 检测并拦截了 ' + atk.name, passed: true });
            attackBlocked = true;
            break;
          } else {
            steps.push({ desc: ' → 🔍 IDS 未检测到攻击', passed: false });
          }
        }

        if (dev.type === 'webserver' && dev.id === target.id) {
          if (atk.id === 'sql_inject' && dev.config.vuln_sql) {
            steps.push({ desc: ' → Web服务器存在SQL注入漏洞，被攻破！', passed: false });
            targetBreached = true;
          } else if (atk.id === 'xss' && dev.config.vuln_xss) {
            steps.push({ desc: ' → Web服务器存在XSS漏洞，被攻破！', passed: false });
            targetBreached = true;
          } else if (atk.id === 'ddos') {
            steps.push({ desc: ' → Web服务器遭受DDoS攻击', passed: false });
            targetBreached = true;
          } else {
            steps.push({ desc: ' → Web服务器无此漏洞，攻击失败', passed: true });
          }
        }

        if (dev.type === 'database' && dev.id === target.id) {
          if (atk.id === 'brute_force' && dev.config.weak_pass) {
            steps.push({ desc: ' → 数据库弱密码被爆破成功！', passed: false });
            targetBreached = true;
          } else if (dev.config.exposed) {
            steps.push({ desc: ' → 数据库暴露公网，被直接访问！', passed: false });
            targetBreached = true;
          } else {
            steps.push({ desc: ' → 数据库未暴露且密码安全，攻击失败', passed: true });
          }
        }

        if (dev.type === 'client' && dev.id === target.id) {
          if (atk.id === 'phishing') {
            if (!dev.config.antivirus) {
              steps.push({ desc: ' → 客户端无防病毒，钓鱼成功！', passed: false });
              targetBreached = true;
            } else {
              steps.push({ desc: ' → 防病毒软件拦截了钓鱼攻击', passed: true });
            }
          }
        }
      }

      if (targetBreached) { breached++; allBlocked = false; }
      if (!attackBlocked && !targetBreached) { /* 攻击到达但目标无漏洞 */ }
    });

    if (breached === 0 && steps.length > 0) {
      steps.push({ desc: '🎉 所有攻击均被成功拦截！', passed: true });
    }

    return { blocked: breached === 0, steps: steps, breached: breached };
  },

  checkFirewall(dev, atk) {
    var mode = dev.config.mode;
    // 检查攻击是否需要通过特定端口
    var attackPorts = atk.bypassPorts || [];
    if (attackPorts.length === 0) return false; // 钓鱼等不走端口的攻击，防火墙无法拦截
    // 检查每个攻击端口是否被防火墙放行
    var portMap = { 80: 'allow_http', 443: 'allow_https', 22: 'allow_ssh', 3306: 'allow_mysql', 5432: 'allow_mysql', 1433: 'allow_mysql', 8080: 'allow_http' };
    for (var i = 0; i < attackPorts.length; i++) {
      var key = portMap[attackPorts[i]];
      if (!key) continue;
      if (mode === '白名单') {
        // 白名单模式：只允许明确放行的
        if (dev.config[key]) return false; // 端口被放行，攻击通过
      } else {
        // 黑名单模式：只拒绝明确禁止的
        if (!dev.config[key]) return true; // 端口被拒绝，攻击被拦截
      }
    }
    // 白名单模式下所有端口都未放行 = 拦截
    if (mode === '白名单') return true;
    // 黑名单模式下所有端口都放行 = 未拦截
    return false;
  },

  checkIDS(dev, atk) {
    var mode = dev.config.mode;
    var detectMap = { sql_inject: 'detect_sql', xss: 'detect_sql', ddos: 'detect_ddos', brute_force: 'detect_brute', phishing: null };
    var key = detectMap[atk.id];
    if (!key) return false; // 钓鱼等IDS无法检测
    if (!dev.config[key]) return false; // 未开启此检测
    return mode === '拦截'; // 监控模式不拦截
  },

  findPath(fromId, toId) {
    // BFS 寻路
    var visited = {};
    var queue = [[fromId]];
    visited[fromId] = true;
    while (queue.length > 0) {
      var path = queue.shift();
      var current = path[path.length - 1];
      if (current === toId) return path;
      var neighbors = [];
      this.connections.forEach(function(c) {
        if (c.from === current && !visited[c.to]) neighbors.push(c.to);
        if (c.to === current && !visited[c.from]) neighbors.push(c.from);
      });
      neighbors.forEach(function(n) {
        visited[n] = true;
        queue.push(path.concat([n]));
      });
    }
    return null;
  },

  showToast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 2000);
  }
};

document.addEventListener('DOMContentLoaded', function() { Game.init(); });
