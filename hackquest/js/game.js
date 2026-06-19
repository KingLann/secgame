/**
 * game.js - HackQuest 黑客探险 游戏逻辑
 */

var Game = {
  state: 'menu',
  currentLevel: 0,
  score: 0,
  levelResults: [],
  // 关卡状态
  items: [],       // 拥有的道具ID列表
  tools: [],       // 拥有的工具ID列表
  visitedNodes: {}, // 已访问节点 {nodeId: true}
  completedActions: {}, // 已完成操作 {nodeId_actionId: true}
  selectedNode: null,
  flagsGot: [],    // 已获取的flag

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
    document.getElementById('result-close-btn').addEventListener('click', function() {
      document.getElementById('result-overlay').classList.add('hidden');
      self.checkWin();
    });
    document.getElementById('replay-btn').addEventListener('click', function() {
      document.getElementById('complete-overlay').classList.add('hidden');
      self.startLevel(self.currentLevel);
    });
    document.getElementById('next-level-btn').addEventListener('click', function() {
      document.getElementById('complete-overlay').classList.add('hidden');
      var next = self.currentLevel + 1;
      if (next < HQ_LEVELS.length) {
        self.startLevel(next);
      } else {
        self.showScreen('levels');
        self.renderLevels();
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
      var saved = localStorage.getItem('hackquest_progress');
      if (saved) { var d = JSON.parse(saved); this.levelResults = d.levelResults || []; this.score = d.score || 0; }
    } catch (e) { this.levelResults = []; this.score = 0; }
  },
  saveProgress() {
    try { localStorage.setItem('hackquest_progress', JSON.stringify({ levelResults: this.levelResults, score: this.score })); } catch (e) {}
  },

  renderLevels() {
    var c = document.getElementById('level-grid'); c.innerHTML = '';
    var self = this;
    HQ_LEVELS.forEach(function(lv, i) {
      var r = self.levelResults[i];
      var stars = '';
      if (r && r.completed) { stars = '⭐'.repeat(r.stars) + '☆'.repeat(3 - r.stars); }
      var card = document.createElement('div'); card.className = 'level-card';
      card.innerHTML = '<div class="level-icon">' + lv.icon + '</div>' +
        '<div class="level-meta"><div class="level-name">' + lv.name + '</div>' +
        '<div class="level-en">' + lv.enName + '</div>' +
        '<div class="level-desc"><span class="diff">' + lv.difficulty + '</span><span>' + Object.keys(lv.nodes).length + ' 个节点</span></div></div>' +
        '<div class="level-stars">' + (stars || '☆☆☆') + '</div>';
      card.addEventListener('click', function() { self.startLevel(i); });
      c.appendChild(card);
    });
    document.getElementById('total-score').textContent = this.score;
  },

  // ===== 开始关卡 =====
  startLevel(index) {
    this.currentLevel = index;
    this.items = [];
    this.tools = [];
    this.visitedNodes = {};
    this.completedActions = {};
    this.selectedNode = null;
    this.flagsGot = [];

    var lv = HQ_LEVELS[index];
    // 初始道具和工具
    if (lv.startItems) this.items = lv.startItems.slice();
    if (lv.startTools) this.tools = lv.startTools.slice();

    this.showScreen('game');
    document.getElementById('level-title').textContent = lv.icon + ' ' + lv.name;
    document.getElementById('level-difficulty').textContent = lv.difficulty;

    // 标记起点为已访问
    Object.keys(lv.nodes).forEach(function(id) {
      if (lv.nodes[id].type === 'start') this.visitedNodes[id] = true;
    }.bind(this));

    this.renderMap(lv);
    this.renderGoalBar(lv);
    this.renderInventory();
    this.renderNodeInfo(null);
    document.getElementById('complete-overlay').classList.add('hidden');
    document.getElementById('result-overlay').classList.add('hidden');
  },

  // ===== 渲染目标栏 =====
  renderGoalBar(lv) {
    var bar = document.getElementById('goal-bar');
    var html = '<span class="goal-label">🎯 目标:</span> ' + lv.goal + ' <span class="goal-flags">';
    lv.goalItems.forEach(function(flag) {
      var got = this.flagsGot.indexOf(flag) >= 0;
      html += '<span class="goal-flag' + (got ? ' got' : '') + '">' + (got ? '✅ ' : '🔒 ') + flag + '</span>';
    }.bind(this));
    html += '</span>';
    bar.innerHTML = html;
  },

  // ===== 渲染地图 =====
  renderMap(lv) {
    var area = document.getElementById('map-area');
    // 清除旧节点
    area.querySelectorAll('.map-node').forEach(function(n) { n.remove(); });
    var svg = document.getElementById('map-edges');
    svg.innerHTML = '';

    // 绘制连线
    this.renderEdges(lv);

    // 绘制节点
    var self = this;
    Object.keys(lv.nodes).forEach(function(id) {
      var node = lv.nodes[id];
      var div = document.createElement('div');
      div.className = 'map-node';
      div.id = 'node_' + id;
      div.style.left = node.x + 'px';
      div.style.top = node.y + 'px';

      // 判断节点状态
      var accessible = self.isNodeAccessible(id, lv);
      if (self.visitedNodes[id]) {
        div.classList.add(self.isNodeCompleted(id, lv) ? 'completed' : 'accessible');
      } else if (accessible) {
        div.classList.add('accessible');
      } else {
        div.classList.add('locked');
      }
      if (node.type === 'start') div.classList.add('start');

      div.innerHTML = '<div class="node-icon">' + node.icon + '</div><div class="node-name">' + node.name + '</div>';
      // 拖拽 + 点击
      self.makeNodeDraggable(div, id, lv);
      area.appendChild(div);
    });
  },

  makeNodeDraggable(el, nodeId, lv) {
    var self = this;
    var startX, startY, origX, origY, moved;

    var down = function(e) {
      e.preventDefault();
      var ev = e.touches ? e.touches[0] : e;
      startX = ev.clientX; startY = ev.clientY;
      var node = lv.nodes[nodeId];
      origX = node.x; origY = node.y;
      moved = false;

      var move = function(e2) {
        e2.preventDefault();
        var ev2 = e2.touches ? e2.touches[0] : e2;
        var dx = ev2.clientX - startX;
        var dy = ev2.clientY - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
        var newX = Math.max(0, origX + dx);
        var newY = Math.max(0, origY + dy);
        lv.nodes[nodeId].x = newX;
        lv.nodes[nodeId].y = newY;
        el.style.left = newX + 'px';
        el.style.top = newY + 'px';
        self.renderEdges(lv);
      };

      var up = function() {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
        document.removeEventListener('touchmove', move);
        document.removeEventListener('touchend', up);
        if (!moved) {
          // 点击逻辑
          if (el.classList.contains('locked')) {
            self.showToast('需要先访问相邻节点或获得必要道具');
            return;
          }
          self.visitedNodes[nodeId] = true;
          self.selectedNode = nodeId;
          self.renderMap(lv);
          self.renderNodeInfo(nodeId);
        }
      };

      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
      document.addEventListener('touchmove', move, { passive: false });
      document.addEventListener('touchend', up);
    };

    el.addEventListener('mousedown', down);
    el.addEventListener('touchstart', down, { passive: false });
  },

  renderEdges(lv) {
    var svg = document.getElementById('map-edges');
    svg.innerHTML = '';
    var self = this;
    lv.edges.forEach(function(edge) {
      var fromNode = lv.nodes[edge[0]];
      var toNode = lv.nodes[edge[1]];
      if (!fromNode || !toNode) return;
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', fromNode.x + 45); line.setAttribute('y1', fromNode.y + 25);
      line.setAttribute('x2', toNode.x + 45); line.setAttribute('y2', toNode.y + 25);
      var connected = (self.visitedNodes[edge[0]] && self.visitedNodes[edge[1]]) ||
                       (lv.nodes[edge[0]].type === 'start' && self.visitedNodes[edge[1]]) ||
                       (lv.nodes[edge[1]].type === 'start' && self.visitedNodes[edge[0]]);
      if (connected) line.classList.add('active');
      svg.appendChild(line);
    });
  },

  isNodeAccessible(nodeId, lv) {
    var node = lv.nodes[nodeId];
    // 检查是否需要前置道具
    if (node.require) {
      var reqs = Array.isArray(node.require) ? node.require : [node.require];
      for (var i = 0; i < reqs.length; i++) {
        if (this.items.indexOf(reqs[i]) < 0) return false;
      }
    }
    // 检查是否有相邻已访问节点
    var self = this;
    var hasNeighbor = lv.edges.some(function(e) {
      return (e[0] === nodeId && self.visitedNodes[e[1]]) || (e[1] === nodeId && self.visitedNodes[e[0]]);
    });
    // 起点始终可访问
    if (node.type === 'start') return true;
    return hasNeighbor;
  },

  isNodeCompleted(nodeId, lv) {
    var node = lv.nodes[nodeId];
    if (!node.actions) return false;
    var self = this;
    return node.actions.some(function(a) { return self.completedActions[nodeId + '_' + a.id]; });
  },

  // ===== 渲染节点信息 =====
  renderNodeInfo(nodeId) {
    var panel = document.getElementById('system-info');
    if (!nodeId) {
      panel.innerHTML = '<h4>📋 选择一个节点开始探索</h4><div class="sys-desc">点击地图上高亮的节点查看系统信息和可用操作</div>';
      return;
    }
    var lv = HQ_LEVELS[this.currentLevel];
    var node = lv.nodes[nodeId];
    var self = this;
    var html = '<h4>' + node.icon + ' ' + node.name + '</h4>';
    html += '<div class="sys-desc">' + escapeHtml(node.desc) + '</div>';

    if (node.actions && node.actions.length > 0) {
      html += '<div class="action-list">';
      node.actions.forEach(function(act) {
        var done = self.completedActions[nodeId + '_' + act.id];
        var canDo = true;
        var reason = '';
        // 检查工具需求
        if (act.tool && self.tools.indexOf(act.tool) < 0) {
          canDo = false;
          var toolDef = TOOLS[act.tool];
          reason = '需要 ' + (toolDef ? toolDef.name : act.tool) + ' 工具';
        }
        // 检查道具需求
        if (act.require) {
          var reqs = Array.isArray(act.require) ? act.require : [act.require];
          for (var i = 0; i < reqs.length; i++) {
            if (self.items.indexOf(reqs[i]) < 0) {
              canDo = false;
              reason = '需要道具: ' + reqs[i];
              break;
            }
          }
        }
        html += '<button class="action-btn" data-node="' + nodeId + '" data-action="' + act.id + '"' +
          (done ? ' disabled' : '') + '>' +
          '<span class="act-icon">' + (done ? '✅' : '▶️') + '</span>' +
          '<div><div class="act-name">' + act.name + '</div>' +
          '<div class="act-tool">' + (done ? '已完成' : (act.tool ? '需要: ' + (TOOLS[act.tool] ? TOOLS[act.tool].name : act.tool) : reason || '可用')) + '</div></div>' +
          '</button>';
      });
      html += '</div>';
    }
    panel.innerHTML = html;

    // 绑定操作按钮
    panel.querySelectorAll('.action-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        self.executeAction(btn.dataset.node, btn.dataset.action);
      });
    });
  },

  // ===== 执行操作 =====
  executeAction(nodeId, actionId) {
    var lv = HQ_LEVELS[this.currentLevel];
    var node = lv.nodes[nodeId];
    var action = node.actions.find(function(a) { return a.id === actionId; });
    if (!action) return;

    // 检查工具
    if (action.tool && this.tools.indexOf(action.tool) < 0) {
      this.showToast('需要 ' + (TOOLS[action.tool] ? TOOLS[action.tool].name : action.tool) + ' 工具');
      return;
    }
    // 检查道具
    if (action.require) {
      var reqs = Array.isArray(action.require) ? action.require : [action.require];
      for (var i = 0; i < reqs.length; i++) {
        if (this.items.indexOf(reqs[i]) < 0) {
          this.showToast('需要道具: ' + reqs[i]);
          return;
        }
      }
    }

    // 标记完成
    this.completedActions[nodeId + '_' + actionId] = true;
    this.visitedNodes[nodeId] = true;

    // 给予道具
    var newItems = [];
    if (action.success && action.success.give) {
      var self = this;
      action.success.give.forEach(function(item) {
        if (self.items.indexOf(item) < 0) {
          self.items.push(item);
          newItems.push(item);
          // 检查是否是flag
          if (item.indexOf('flag_') === 0 && self.flagsGot.indexOf(item) < 0) {
            self.flagsGot.push(item);
          }
        }
      });
    }

    // 显示结果
    var title = action.success && action.success.msg ? '✅ 操作成功' : '❌ 操作失败';
    document.getElementById('result-title').textContent = title;
    document.getElementById('result-output').textContent =
      (action.success && action.success.msg) || action.fail || '操作执行完成';

    var itemsDiv = document.getElementById('result-items');
    itemsDiv.innerHTML = '';
    newItems.forEach(function(item) {
      var span = document.createElement('span');
      span.className = 'result-item';
      span.textContent = '🎁 ' + item;
      itemsDiv.appendChild(span);
    });

    document.getElementById('result-overlay').classList.remove('hidden');

    // 刷新界面
    this.renderMap(lv);
    this.renderGoalBar(lv);
    this.renderInventory();
    this.renderNodeInfo(this.selectedNode);
  },

  // ===== 检查胜利 =====
  checkWin() {
    var lv = HQ_LEVELS[this.currentLevel];
    var minFlags = lv.minFlags || lv.goalItems.length;
    if (this.flagsGot.length >= minFlags) {
      this.showLevelComplete();
    }
  },

  showLevelComplete() {
    var lv = HQ_LEVELS[this.currentLevel];
    var total = lv.goalItems.length;
    var got = this.flagsGot.length;
    var stars = got >= total ? 3 : got >= Math.ceil(total * 0.6) ? 2 : 1;

    this.levelResults[this.currentLevel] = {
      completed: true,
      stars: Math.max(stars, (this.levelResults[this.currentLevel] && this.levelResults[this.currentLevel].stars) || 0)
    };
    this.score += got * 10;
    this.saveProgress();

    document.getElementById('complete-title').textContent =
      stars >= 3 ? '🎉 完美通关！' : stars >= 2 ? '👍 不错！' : '✅ 已通过';
    document.getElementById('complete-msg').textContent =
      '获取 ' + got + ' / ' + total + ' 个 flag';
    document.getElementById('complete-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

    document.getElementById('knowledge-title').textContent = lv.knowledge.title;
    document.getElementById('knowledge-body').textContent = lv.knowledge.body;

    document.getElementById('complete-overlay').classList.remove('hidden');

    var nextBtn = document.getElementById('next-level-btn');
    if (this.currentLevel + 1 >= HQ_LEVELS.length) {
      nextBtn.textContent = '🏆 全部完成';
    } else {
      nextBtn.textContent = '下一关 →';
    }
  },

  // ===== 渲染背包 =====
  renderInventory() {
    var panel = document.getElementById('inventory-content');
    var html = '';
    // 工具
    if (this.tools.length > 0) {
      html += '<div class="inv-section"><div class="inv-section-title">🔧 工具</div><div class="inv-items">';
      this.tools.forEach(function(t) {
        var def = TOOLS[t];
        html += '<span class="inv-item tool">' + (def ? def.icon + ' ' + def.name : t) + '</span>';
      });
      html += '</div></div>';
    }
    // 道具
    var keys = this.items.filter(function(i) { return i.indexOf('flag_') < 0; });
    if (keys.length > 0) {
      html += '<div class="inv-section"><div class="inv-section-title">🔑 道具</div><div class="inv-items">';
      keys.forEach(function(item) {
        html += '<span class="inv-item key">' + item + '</span>';
      });
      html += '</div></div>';
    }
    // Flag
    if (this.flagsGot.length > 0) {
      html += '<div class="inv-section"><div class="inv-section-title">🏁 Flag</div><div class="inv-items">';
      this.flagsGot.forEach(function(f) {
        html += '<span class="inv-item flag">🚩 ' + f + '</span>';
      });
      html += '</div></div>';
    }
    if (!html) html = '<div style="font-size:11px;color:var(--text-dim)">还没有任何道具</div>';
    panel.innerHTML = html;
  },

  showToast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 2000);
  }
};

function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', function() { Game.init(); });
