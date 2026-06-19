// 游戏主逻辑
class DarkwebGame {
  constructor() {
    this.currentLevel = 0;
    this.score = 0;
    this.hintsUsed = 0;
    this.markedNodes = {};
    this.startTime = 0;
    this.tracedPath = [];
    this.levelsCompleted = new Set();

    this.graph = null;
    this._bindElements();
    this._bindEvents();
    this._loadProgress();
    this._renderLevelGrid();
  }

  // 绑定 DOM 元素
  _bindElements() {
    this.screens = {
      start:   document.getElementById('start-screen'),
      levels:  document.getElementById('levels-screen'),
      game:    document.getElementById('game-screen'),
      complete:document.getElementById('level-complete'),
      final:   document.getElementById('game-complete')
    };
    this.els = {
      levelGrid:    document.getElementById('level-grid'),
      caseTitle:    document.getElementById('case-title'),
      briefing:     document.getElementById('briefing-text'),
      question:     document.getElementById('question-text'),
      detailPanel:  document.getElementById('detail-panel'),
      detailContent:document.getElementById('detail-content'),
      scoreDisplay: document.getElementById('score-display'),
      timerDisplay: document.getElementById('timer-display'),
      hintBtn:      document.getElementById('hint-btn'),
      hintPanel:    document.getElementById('hint-panel'),
      hintText:     document.getElementById('hint-text'),
      submitBtn:    document.getElementById('submit-btn'),
      traceBtn:     document.getElementById('trace-btn'),
      traceDisplay: document.getElementById('trace-display'),
      resetTraceBtn: document.getElementById('reset-trace-btn'),
      graphContainer:document.getElementById('graph-container'),
      completeTitle:document.getElementById('complete-title'),
      completeMsg:  document.getElementById('complete-msg'),
      completeStats:document.getElementById('complete-stats'),
      finalScore:   document.getElementById('final-score'),
      finalLevels:  document.getElementById('final-levels')
    };
  }

  // 绑定事件
  _bindEvents() {
    document.getElementById('start-btn').addEventListener('click', () => this._showScreen('levels'));
    document.getElementById('back-btn').addEventListener('click', () => this._showScreen('levels'));
    document.getElementById('restart-btn').addEventListener('click', () => {
      this.score = 0;
      this.levelsCompleted.clear();
      this._saveProgress();
      this._showScreen('levels');
      this._renderLevelGrid();
      this._updateScore();
    });
    this.els.hintBtn.addEventListener('click', () => this._showHint());
    this.els.submitBtn.addEventListener('click', () => this._submitAnswer());
    this.els.traceBtn.addEventListener('click', () => this._toggleTraceMode());
    this.els.resetTraceBtn.addEventListener('click', () => this._resetTrace());

    document.getElementById('next-case-btn').addEventListener('click', () => {
      if (this.currentLevel < CASES.length - 1) {
        this._startLevel(this.currentLevel + 1);
      } else {
        this._showFinalComplete();
      }
    });
    document.getElementById('replay-btn').addEventListener('click', () => {
      this._startLevel(this.currentLevel);
    });

    // 标记节点类型面板事件
    document.querySelectorAll('.mark-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        this._markSelectedNode(type);
      });
    });
  }

  // 切换屏幕
  _showScreen(name) {
    Object.values(this.screens).forEach(s => s.classList.remove('active'));
    this.screens[name].classList.add('active');

    if (name === 'levels') {
      this._renderLevelGrid();
    }
  }

  // 渲染关卡选择
  _renderLevelGrid() {
    // 更新总分
    const totalScoreEl = document.getElementById('total-score-display');
    if (totalScoreEl) totalScoreEl.textContent = this.score;

    this.els.levelGrid.innerHTML = '';
    CASES.forEach((c, i) => {
      const card = document.createElement('div');
      card.className = 'level-card' + (this.levelsCompleted.has(i) ? ' completed' : '');
      const stars = this.levelsCompleted.has(i) ? '⭐⭐⭐' : '☆☆☆';
      card.innerHTML = `
        <div class="level-difficulty">${'🔴'.repeat(c.difficulty)}${'⚪'.repeat(5 - c.difficulty)}</div>
        <h3>${c.title}</h3>
        <p>${c.subtitle}</p>
        <div class="level-stars">${stars}</div>
      `;
      card.addEventListener('click', () => this._startLevel(i));
      this.els.levelGrid.appendChild(card);
    });
  }

  // 开始关卡
  _startLevel(index) {
    this.currentLevel = index;
    this.hintsUsed = 0;
    this.markedNodes = {};
    this.tracedPath = [];
    this.traceMode = false;
    this.traceValid = false;
    this.traceCompleted = false;
    this.startTime = Date.now();

    const caseData = CASES[index];

    // 更新 UI
    this.els.caseTitle.textContent = `案例 #${caseData.id}: ${caseData.title}`;
    this.els.briefing.textContent = caseData.briefing;
    this.els.question.textContent = caseData.question;
    this.els.scoreDisplay.textContent = this.score;
    this.els.hintPanel.classList.add('hidden');
    this.els.hintBtn.textContent = `💡 获取提示 (${3 - this.hintsUsed} 次)`;
    this.els.traceBtn.textContent = '🔗 追踪模式';
    this.els.resetTraceBtn.style.display = 'none';
    this.els.traceDisplay.innerHTML = '<span class="trace-hint">点击"追踪模式"后，按顺序点击节点记录追踪路径</span>';
    this.els.detailContent.innerHTML = '<p class="detail-hint">← 点击图中的节点查看详情</p>';
    this.els.submitBtn.disabled = false;
    this.els.submitBtn.textContent = '🎯 提交答案（需先完成追踪）';

    // 先切换屏幕，再等一帧渲染图（确保容器已有尺寸）
    this._showScreen('game');
    this._startTimer();

    requestAnimationFrame(() => {
      if (this.graph) this.graph.clear();
      this.graph = new TransactionGraph(this.els.graphContainer);
      this.graph.loadCase(caseData);
      this.graph.onNodeClick = (node) => this._onNodeClick(node);
    });
  }

  // 计时器
  _startTimer() {
    if (this._timerInterval) clearInterval(this._timerInterval);
    this._timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      const min = Math.floor(elapsed / 60);
      const sec = elapsed % 60;
      this.els.timerDisplay.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
    }, 1000);
  }

  // 点击节点
  _onNodeClick(node) {
    if (!node) {
      this.els.detailContent.innerHTML = '<p class="detail-hint">← 点击图中的节点查看详情</p>';
      return;
    }

    // 追踪模式下添加到路径
    if (this.traceMode) {
      if (!this.tracedPath.includes(node.id)) {
        this.tracedPath.push(node.id);
        this._updateTraceDisplay();
        this.graph.highlightPath(this.tracedPath);
        this._validateTrace();
      }
      return;
    }

    const caseData = CASES[this.currentLevel];
    const markType = this.markedNodes[node.id];

    let html = `
      <div class="detail-header">
        <span class="detail-icon">${this._getNodeIcon(node.type)}</span>
        <span class="detail-name">${node.label}</span>
      </div>
      <div class="detail-desc">${node.desc.replace(/\n/g, '<br>')}</div>
    `;

    // 如果已标记，显示标记信息
    if (markType) {
      html += `<div class="detail-mark">已标记: ${this._getTypeName(markType)}</div>`;
    }

    // 标记按钮
    html += `
      <div class="detail-actions">
        <button class="btn-sm btn-mark" onclick="game._showMarkPanel('${node.id}')">🏷️ 标记类型</button>
      </div>
    `;

    this.els.detailContent.innerHTML = html;
  }

  // 显示标记面板
  _showMarkPanel(nodeId) {
    this._pendingMarkNodeId = nodeId;
    document.getElementById('mark-panel').classList.remove('hidden');
  }

  // 标记节点类型
  _markSelectedNode(type) {
    const nodeId = this._pendingMarkNodeId;
    if (!nodeId) return;

    this.markedNodes[nodeId] = type;

    // 检查标记是否正确
    const caseData = CASES[this.currentLevel];
    const isCorrect = this._checkMarkCorrect(nodeId, type);

    // 更新节点外观
    this.graph.updateNode(nodeId, { type: type });

    // 更新详情面板
    const node = this.graph.nodes.find(n => n.id === nodeId);
    if (node) {
      this._onNodeClick(node);
    }

    // 隐藏标记面板
    document.getElementById('mark-panel').classList.add('hidden');

    if (isCorrect) {
      this._showToast('✅ 标记正确！+100 分', 'success');
      this.score += 100;
      this._updateScore();
    } else if (type !== 'unknown') {
      this._showToast('❌ 标记不正确', 'error');
    }
  }

  // 检查标记是否正确
  _checkMarkCorrect(nodeId, type) {
    const caseData = CASES[this.currentLevel];
    // 检查 revealMap 中是否有该节点的正确类型
    if (caseData.revealMap[nodeId]) {
      return caseData.revealMap[nodeId].type === type;
    }
    // 源节点（darknet类型）的标记
    const originalNode = caseData.nodes.find(n => n.id === nodeId);
    if (originalNode && originalNode.type === 'darknet' && type === 'darknet') {
      return true;
    }
    // unknown 节点标记为 unknown 也算对（不标记）
    if (type === 'unknown') return true;
    return false;
  }

  // 切换追踪模式
  _toggleTraceMode() {
    this.traceMode = !this.traceMode;
    if (this.traceMode) {
      this.els.traceBtn.textContent = '🔗 追踪中...（点击取消）';
      this.els.traceBtn.classList.add('active');
      this.els.resetTraceBtn.style.display = 'block';
      this.tracedPath = [];
      this.traceValid = false;
      this.traceCompleted = false;
      // 清除之前的追踪状态样式
      Object.values(this.graph.nodeElements).forEach(el => {
        el.classList.remove('trace-correct', 'trace-wrong');
      });
      this._showToast('追踪模式已开启，按顺序点击节点', 'info');
    } else {
      this.els.traceBtn.textContent = '🔗 追踪模式';
      this.els.traceBtn.classList.remove('active');
      this.els.resetTraceBtn.style.display = 'none';
      this.graph.clearHighlight();
    }
  }

  // 重置追踪路径
  _resetTrace() {
    this.tracedPath = [];
    this.traceValid = false;
    this.traceCompleted = false;
    Object.values(this.graph.nodeElements).forEach(el => {
      el.classList.remove('trace-correct', 'trace-wrong');
    });
    this.graph.clearHighlight();
    this._updateTraceDisplay();
    this._showToast('追踪路径已重置', 'info');
  }

  // 更新追踪路径显示
  _updateTraceDisplay() {
    const caseData = CASES[this.currentLevel];
    if (this.tracedPath.length === 0) {
      this.els.traceDisplay.innerHTML = '<span class="trace-hint">点击"追踪模式"后，按顺序点击节点记录追踪路径</span>';
      return;
    }

    let html = '';
    this.tracedPath.forEach((id, i) => {
      const node = this.graph.nodes.find(n => n.id === id);
      if (node) {
        if (i > 0) html += ' → ';
        html += `<span class="trace-node">${node.label}</span>`;
      }
    });
    this.els.traceDisplay.innerHTML = html;
  }

  // 验证追踪路径
  _validateTrace() {
    const caseData = CASES[this.currentLevel];
    const expectedPaths = caseData.expectedPaths || [];

    // 检查当前路径是否匹配任何一条正确路径
    const matchedPath = expectedPaths.find(ep => {
      if (this.tracedPath.length > ep.length) return false;
      return this.tracedPath.every((id, i) => id === ep[i]);
    });

    if (!matchedPath) {
      // 当前路径已经偏离了所有正确路径
      this.traceValid = false;
      this._showToast('❌ 追踪路径错误，请重新追踪', 'error');
      // 标红最后一个节点
      const lastNode = this.tracedPath[this.tracedPath.length - 1];
      if (this.graph.nodeElements[lastNode]) {
        this.graph.nodeElements[lastNode].classList.add('trace-wrong');
      }
      return;
    }

    // 路径前缀正确
    this.traceValid = true;
    const lastNodeId = this.tracedPath[this.tracedPath.length - 1];
    if (this.graph.nodeElements[lastNodeId]) {
      this.graph.nodeElements[lastNodeId].classList.remove('trace-wrong');
      this.graph.nodeElements[lastNodeId].classList.add('trace-correct');
    }

    // 检查是否追踪到了终点
    if (this.tracedPath.length === matchedPath.length) {
      this._showToast('🎉 追踪路径正确！现在可以提交答案了', 'success');
      this.score += 200;
      this._updateScore();
      // 自动退出追踪模式
      this.traceMode = false;
      this.els.traceBtn.textContent = '🔗 追踪模式';
      this.els.traceBtn.classList.remove('active');
      this.traceCompleted = true;
    } else {
      this._showToast('✅ 路径正确，继续追踪...', 'success');
    }
  }

  // 获取提示
  _showHint() {
    const caseData = CASES[this.currentLevel];
    if (this.hintsUsed >= caseData.hints.length) {
      this._showToast('没有更多提示了', 'info');
      return;
    }

    const hint = caseData.hints[this.hintsUsed];
    this.hintsUsed++;
    this.score = Math.max(0, this.score - 50);
    this._updateScore();

    this.els.hintPanel.classList.remove('hidden');
    this.els.hintText.textContent = hint;
    this.els.hintBtn.textContent = `💡 获取提示 (${caseData.hints.length - this.hintsUsed} 次)`;

    this._showToast('提示已显示，-50 分', 'info');
  }

  // 提交答案
  _submitAnswer() {
    const caseData = CASES[this.currentLevel];
    const selectedNode = this.graph.selectedNode;

    // 必须先完成追踪
    if (!this.traceCompleted) {
      this._showToast('请先使用🔗追踪模式，按顺序追踪完整资金路径', 'info');
      return;
    }

    if (!selectedNode) {
      this._showToast('请先点击选中一个节点作为答案', 'info');
      return;
    }

    // 停止计时
    clearInterval(this._timerInterval);
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);

    // 检查答案
    const isCorrect = selectedNode.id === caseData.answer;

    if (isCorrect) {
      // 揭示所有隐藏节点
      Object.entries(caseData.revealMap).forEach(([nodeId, data]) => {
        this.graph.updateNode(nodeId, data);
      });

      // 计算得分
      const timeBonus = Math.max(0, 300 - elapsed) * 2;
      const hintPenalty = this.hintsUsed * 50;
      const levelScore = 500 + timeBonus - hintPenalty;
      this.score += Math.max(100, levelScore);
      this.levelsCompleted.add(this.currentLevel);
      this._updateScore();
      this._saveProgress();

      // 显示完成弹窗
      this._showLevelComplete(true, elapsed, levelScore);
    } else {
      this._showToast('❌ 答案不正确，请继续分析', 'error');
      this.els.submitBtn.disabled = true;
      setTimeout(() => {
        this.els.submitBtn.disabled = false;
      }, 2000);
    }
  }

  // 显示关卡完成
  _showLevelComplete(success, elapsed, levelScore) {
    const caseData = CASES[this.currentLevel];
    const min = Math.floor(elapsed / 60);
    const sec = elapsed % 60;

    this.els.completeTitle.textContent = success ? '🎉 案件破解成功！' : '💔 案件未破解';
    this.els.completeMsg.textContent = success
      ? `你成功追踪了 ${caseData.title} 中的资金流向！`
      : '继续努力，分析交易链路需要耐心。';

    this.els.completeStats.innerHTML = `
      <div class="stat-row"><span>⏱️ 用时</span><span>${min}:${sec.toString().padStart(2, '0')}</span></div>
      <div class="stat-row"><span>💡 使用提示</span><span>${this.hintsUsed} 次</span></div>
      <div class="stat-row"><span>🏆 本关得分</span><span>+${levelScore}</span></div>
      <div class="stat-row"><span>📊 总分</span><span>${this.score}</span></div>
    `;

    this.screens.complete.classList.add('active');

    // 知识卡片
    if (success && caseData.knowledge) {
      this._showKnowledge(caseData.knowledge);
    }
  }

  // 显示知识卡片
  _showKnowledge(items) {
    const container = document.getElementById('knowledge-cards');
    container.innerHTML = '<h4>📖 本案知识点</h4>';
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'knowledge-card';
      card.innerHTML = `<strong>${item.title}</strong><p>${item.text}</p>`;
      container.appendChild(card);
    });
  }

  // 显示最终完成
  _showFinalComplete() {
    this.els.finalScore.textContent = this.score;
    this.els.finalLevels.textContent = `${this.levelsCompleted.size}/${CASES.length}`;
    this._showScreen('final');
  }

  // 更新分数显示
  _updateScore() {
    this.els.scoreDisplay.textContent = this.score;
  }

  // Toast 提示
  _showToast(msg, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast toast-${type} show`;
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // 获取节点图标
  _getNodeIcon(type) {
    const icons = {
      darknet:  '🔴',
      mixer:    '🟠',
      exchange: '🔵',
      personal: '🟢',
      unknown:  '⚪'
    };
    return icons[type] || '⚪';
  }

  // 获取类型名称
  _getTypeName(type) {
    const names = {
      darknet:  '暗网市场',
      mixer:    '混币器/中转',
      exchange: '交易所',
      personal: '个人钱包',
      unknown:  '未知'
    };
    return names[type] || '未知';
  }

  // 保存进度
  _saveProgress() {
    try {
      localStorage.setItem('darkweb_score', this.score);
      localStorage.setItem('darkweb_completed', JSON.stringify([...this.levelsCompleted]));
    } catch (e) {}
  }

  // 加载进度
  _loadProgress() {
    try {
      this.score = parseInt(localStorage.getItem('darkweb_score')) || 0;
      const completed = JSON.parse(localStorage.getItem('darkweb_completed') || '[]');
      this.levelsCompleted = new Set(completed);
    } catch (e) {
      this.score = 0;
      this.levelsCompleted = new Set();
    }
  }
}

// 全局实例
let game;
document.addEventListener('DOMContentLoaded', () => {
  game = new DarkwebGame();
});
