/**
 * game.js - 密码破解挑战游戏逻辑
 */

var Game = {
  state: 'menu', // menu, levels, playing
  currentLevel: 0,
  currentChallenge: 0,
  hintsUsed: 0,
  maxHints: 3,
  stars: 0,
  totalScore: 0,
  levelResults: [], // {stars, completed}

  init() {
    this.loadProgress();
    this.bindEvents();
    this.showScreen('start');
  },

  bindEvents() {
    document.getElementById('start-btn').addEventListener('click', () => {
      this.showScreen('levels');
      this.renderLevels();
    });

    document.getElementById('back-btn').addEventListener('click', () => {
      this.showScreen('levels');
      this.renderLevels();
    });

    document.getElementById('submit-btn').addEventListener('click', () => this.checkAnswer());

    document.getElementById('answer-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.checkAnswer();
    });

    document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
    document.getElementById('skip-btn').addEventListener('click', () => this.skipChallenge());
    document.getElementById('prev-btn').addEventListener('click', () => this.prevChallenge());
    document.getElementById('next-btn').addEventListener('click', () => this.onNextClick());
  },

  // 下一题按钮统一入口
  onNextClick() {
    if (this.state === 'playing') {
      this.nextChallenge();
    } else if (this.state === 'levelComplete') {
      document.getElementById('next-btn').textContent = '下一题 →';
      this.showScreen('levels');
      this.renderLevels();
    }
  },

  // ===== 屏幕切换 =====
  showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(`${name}-screen`);
    if (el) el.classList.add('active');
    this.state = name === 'start' ? 'menu' : name === 'levels' ? 'levels' : 'playing';
  },

  // ===== 关卡列表 =====
  renderLevels() {
    const grid = document.getElementById('level-grid');
    grid.innerHTML = '';

    const totalStars = this.levelResults.reduce((s, r) => s + (r ? r.stars : 0), 0);
    const maxStars = CIPHER_LEVELS.reduce((s, l) => s + l.challenges.length * 3, 0);
    document.getElementById('total-stars').textContent = totalStars;
    document.getElementById('max-stars').textContent = maxStars;
    document.getElementById('total-score').textContent = this.totalScore;

    CIPHER_LEVELS.forEach((level, i) => {
      const result = this.levelResults[i];
      const unlocked = true;
      const stars = result ? result.stars : 0;
      const maxStars = level.challenges.length * 3;
      const statusText = !unlocked ? '🔒 未解锁'
        : stars === 0 ? '未挑战'
        : stars === maxStars ? '⭐ 已通关'
        : `${stars}/${maxStars}⭐`;

      const card = document.createElement('div');
      card.className = `level-card ${unlocked ? '' : 'locked'}`;
      card.innerHTML = `
        <span class="level-icon">${unlocked ? level.icon : '🔒'}</span>
        <div class="level-meta">
          <div class="level-name">${level.name} <span class="level-en">${level.enName || ''}</span></div>
          <div class="level-desc">${level.difficulty} · ${level.challenges.length} 题</div>
        </div>
        <div class="level-stars">${statusText}</div>
      `;

      if (unlocked) {
        card.addEventListener('click', () => this.startLevel(i));
      }
      grid.appendChild(card);
    });
  },

  // ===== 开始关卡 =====
  startLevel(index) {
    this.currentLevel = index;
    this.currentChallenge = 0;
    this.hintsUsed = 0;
    this.stars = 0;
    this.showScreen('game');
    this.loadChallenge();
  },

  // ===== 加载题目 =====
  loadChallenge() {
    const level = CIPHER_LEVELS[this.currentLevel];
    const challenge = level.challenges[this.currentChallenge];

    document.getElementById('level-title').textContent = `${level.icon} ${level.name}`;
    document.getElementById('level-progress').textContent = `${this.currentChallenge + 1} / ${level.challenges.length}`;
    document.getElementById('cipher-text').textContent = challenge.cipher;
    document.getElementById('stars').textContent = this.stars;

    // 更新提示显示
    this.updateHintDisplay();

    // 知识卡片
    document.getElementById('knowledge-title').textContent = level.knowledge.title;
    document.getElementById('knowledge-body').textContent = level.knowledge.body;

    // 重置输入
    document.getElementById('answer-input').value = '';
    document.getElementById('feedback').textContent = '';
    document.getElementById('feedback').className = 'feedback';
    document.getElementById('hint-box').classList.add('hidden');
    document.getElementById('next-btn').classList.add('hidden');
    document.getElementById('submit-btn').disabled = false;
    document.getElementById('answer-input').disabled = false;
    document.getElementById('answer-input').focus();

    // 上一题按钮：第一题时隐藏，否则显示
    const prevBtn = document.getElementById('prev-btn');
    if (this.currentChallenge > 0) {
      prevBtn.classList.remove('hidden');
    } else {
      prevBtn.classList.add('hidden');
    }
  },

  // 更新提示状态显示
  updateHintDisplay() {
    const remaining = this.maxHints - this.hintsUsed;
    document.getElementById('hints-left').textContent = remaining;
    document.getElementById('hint-btn').disabled = remaining <= 0;
  },

  // ===== 检查答案 =====
  checkAnswer() {
    const input = document.getElementById('answer-input').value.trim();
    if (!input) return;

    const challenge = CIPHER_LEVELS[this.currentLevel].challenges[this.currentChallenge];
    const correct = input.toUpperCase() === challenge.answer.toUpperCase();

    const feedback = document.getElementById('feedback');
    if (correct) {
      const starsEarned = Math.max(1, 3 - this.hintsUsed);
      this.stars += starsEarned;
      feedback.textContent = `✅ 正确！+${starsEarned}⭐`;
      feedback.className = 'feedback correct';
      document.getElementById('stars').textContent = this.stars;
      document.getElementById('submit-btn').disabled = true;
      document.getElementById('answer-input').disabled = true;
      document.getElementById('next-btn').classList.remove('hidden');
    } else {
      feedback.textContent = '❌ 不正确，再试试';
      feedback.className = 'feedback wrong';
      document.getElementById('answer-input').select();
    }
  },

  // ===== 提示 =====
  showHint() {
    const level = CIPHER_LEVELS[this.currentLevel];
    const challenge = level.challenges[this.currentChallenge];
    if (this.hintsUsed >= this.maxHints) return;

    this.hintsUsed++;
    this.updateHintDisplay();

    const hintBox = document.getElementById('hint-box');
    const hintContent = document.getElementById('hint-content');
    hintBox.classList.remove('hidden');

    if (this.hintsUsed === 1) {
      hintContent.textContent = challenge.hint1;
    } else if (this.hintsUsed === 2) {
      hintContent.textContent = challenge.hint2;
    } else {
      hintContent.textContent = `答案是: ${challenge.answer}`;
    }
  },

  // ===== 跳过 =====
  skipChallenge() {
    const level = CIPHER_LEVELS[this.currentLevel];
    const challenge = level.challenges[this.currentChallenge];
    const feedback = document.getElementById('feedback');
    feedback.textContent = `⏭ 答案是: ${challenge.answer}`;
    feedback.className = 'feedback wrong';
    document.getElementById('submit-btn').disabled = true;
    document.getElementById('answer-input').disabled = true;
    document.getElementById('next-btn').classList.remove('hidden');
  },

  // ===== 下一题 =====
  nextChallenge() {
    const level = CIPHER_LEVELS[this.currentLevel];
    this.currentChallenge++;
    this.hintsUsed = 0;

    if (this.currentChallenge >= level.challenges.length) {
      this.levelComplete();
    } else {
      this.loadChallenge();
    }
  },

  // ===== 上一题 =====
  prevChallenge() {
    if (this.currentChallenge <= 0) return;
    this.currentChallenge--;
    this.hintsUsed = 0;
    this.loadChallenge();
  },

  // ===== 关卡完成 =====
  levelComplete() {
    const level = CIPHER_LEVELS[this.currentLevel];
    const maxStars = level.challenges.length * 3;

    // 保存进度
    if (!this.levelResults[this.currentLevel] || this.levelResults[this.currentLevel].stars < this.stars) {
      this.levelResults[this.currentLevel] = { stars: this.stars, completed: true };
    }

    // 计算总分
    this.totalScore = this.levelResults.reduce((s, r) => s + (r ? r.stars * 10 : 0), 0);

    this.saveProgress();

    // 显示结果
    const feedback = document.getElementById('feedback');
    feedback.textContent = `🎉 关卡完成！获得 ${this.stars}/${maxStars}⭐`;
    feedback.className = 'feedback correct';
    document.getElementById('submit-btn').disabled = true;
    document.getElementById('answer-input').disabled = true;

    // 切换下一题按钮为返回选关
    const nextBtn = document.getElementById('next-btn');
    nextBtn.textContent = '📋 返回选关';
    nextBtn.classList.remove('hidden');
    document.getElementById('prev-btn').classList.add('hidden');
    this.state = 'levelComplete';
  },

  // ===== 存档 =====
  saveProgress() {
    localStorage.setItem('cipher_progress', JSON.stringify({
      levelResults: this.levelResults,
      totalScore: this.totalScore,
    }));
  },

  loadProgress() {
    const saved = localStorage.getItem('cipher_progress');
    if (saved) {
      const data = JSON.parse(saved);
      this.levelResults = data.levelResults || [];
      this.totalScore = data.totalScore || 0;
    }
  },
};

document.addEventListener('DOMContentLoaded', () => Game.init());
