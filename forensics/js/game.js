/**
 * game.js - LogTracer 日志分析挑战 游戏逻辑
 */

var Game = {
  state: 'menu',
  currentLevel: 0,
  currentQuestion: 0,
  score: 0,
  levelResults: [],
  logsVisible: false,

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

    document.getElementById('submit-btn').addEventListener('click', function() {
      self.submitAnswer();
    });

    document.getElementById('next-btn').addEventListener('click', function() {
      self.nextQuestion();
    });

    document.getElementById('next-level-btn').addEventListener('click', function() {
      var next = self.currentLevel + 1;
      if (next < FORENSICS_LEVELS.length) {
        self.startLevel(next);
      } else {
        self.showScreen('levels');
        self.renderLevels();
      }
    });

    document.getElementById('replay-btn').addEventListener('click', function() {
      self.startLevel(self.currentLevel);
    });

    document.getElementById('show-logs-btn').addEventListener('click', function() {
      self.toggleLogs();
    });

    // Enter 键提交
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && self.state === 'playing') {
        var nextBtn = document.getElementById('next-btn');
        var submitBtn = document.getElementById('submit-btn');
        if (nextBtn.style.display !== 'none') {
          nextBtn.click();
        } else if (submitBtn.style.display !== 'none') {
          submitBtn.click();
        }
      }
    });
  },

  showScreen(name) {
    document.querySelectorAll('.screen').forEach(function(s) {
      s.classList.remove('active');
    });
    var el = document.getElementById(name + '-screen');
    if (el) el.classList.add('active');
    this.state = name === 'start' ? 'menu' : name === 'levels' ? 'levels' : 'playing';
  },

  // ===== 进度管理 =====
  loadProgress() {
    try {
      var saved = localStorage.getItem('forensics_progress');
      if (saved) {
        var data = JSON.parse(saved);
        this.levelResults = data.levelResults || [];
        this.score = data.score || 0;
      }
    } catch (e) {
      this.levelResults = [];
      this.score = 0;
    }
  },

  saveProgress() {
    try {
      localStorage.setItem('forensics_progress', JSON.stringify({
        levelResults: this.levelResults,
        score: this.score
      }));
    } catch (e) {}
  },

  // ===== 关卡列表 =====
  renderLevels() {
    var container = document.getElementById('level-grid');
    container.innerHTML = '';
    var self = this;

    FORENSICS_LEVELS.forEach(function(level, i) {
      var result = self.levelResults[i];
      var card = document.createElement('div');
      card.className = 'level-card';

      var stars = '';
      if (result && result.completed) {
        var s = result.stars;
        stars = '⭐'.repeat(s) + '☆'.repeat(3 - s);
      }

      card.innerHTML =
        '<div class="level-icon">' + level.icon + '</div>' +
        '<div class="level-meta">' +
          '<div class="level-name">' + level.name + '</div>' +
          '<div class="level-en">' + level.enName + '</div>' +
          '<div class="level-desc">' +
            '<span class="diff">' + level.difficulty + '</span>' +
            '<span>' + level.questions.length + ' 题</span>' +
          '</div>' +
        '</div>' +
        '<div class="level-stars">' + (stars || '☆☆☆') + '</div>';

      card.addEventListener('click', function() {
        self.startLevel(i);
      });

      container.appendChild(card);
    });

    document.getElementById('total-score').textContent = this.score;
  },

  // ===== 开始关卡 =====
  startLevel(index) {
    this.currentLevel = index;
    this.currentQuestion = 0;
    this.logsVisible = false;
    this.showScreen('game');

    var level = FORENSICS_LEVELS[index];
    document.getElementById('level-title').textContent = level.icon + ' ' + level.name;
    document.getElementById('level-difficulty').textContent = level.difficulty;

    this.renderLogs(level);
    this.renderQuestion();

    document.getElementById('level-complete').classList.add('hidden');
  },

  // ===== 渲染日志 =====
  renderLogs(level) {
    var container = document.getElementById('log-content');
    container.innerHTML = '';

    level.logs.forEach(function(log) {
      var line = document.createElement('div');
      line.className = 'log-line';

      var timeSpan = '<span class="log-time">' + log.time + '</span>';
      var levelSpan = '<span class="log-level ' + log.level + '">' + log.level.toUpperCase() + '</span>';
      var srcSpan = '<span class="log-src">[' + log.src + ']</span>';
      var textSpan = '<span class="log-text">' + escapeHtml(log.text) + '</span>';

      line.innerHTML = timeSpan + ' ' + levelSpan + ' ' + srcSpan + ' ' + textSpan;
      container.appendChild(line);
    });

    // 默认折叠
    var logArea = document.getElementById('log-area');
    logArea.classList.add('collapsed');
    document.getElementById('show-logs-btn').textContent = '📋 展开日志 ▼';
  },

  toggleLogs() {
    var logArea = document.getElementById('log-area');
    var btn = document.getElementById('show-logs-btn');
    if (logArea.classList.contains('collapsed')) {
      logArea.classList.remove('collapsed');
      btn.textContent = '📋 折叠日志 ▲';
      this.logsVisible = true;
    } else {
      logArea.classList.add('collapsed');
      btn.textContent = '📋 展开日志 ▼';
      this.logsVisible = false;
    }
  },

  // ===== 渲染题目 =====
  renderQuestion() {
    var level = FORENSICS_LEVELS[this.currentLevel];
    var q = level.questions[this.currentQuestion];
    var total = level.questions.length;

    document.getElementById('question-progress').textContent =
      '第 ' + (this.currentQuestion + 1) + ' / ' + total + ' 题';
    document.getElementById('question-text').textContent = q.q;

    var optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    var self = this;
    q.options.forEach(function(opt, i) {
      var btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt;
      btn.dataset.index = i;
      btn.addEventListener('click', function() {
        self.selectOption(i);
      });
      optionsContainer.appendChild(btn);
    });

    document.getElementById('feedback-box').classList.add('hidden');
    document.getElementById('submit-btn').style.display = '';
    document.getElementById('next-btn').style.display = 'none';

    this.selectedAnswer = -1;
  },

  selectOption(index) {
    this.selectedAnswer = index;
    var btns = document.querySelectorAll('.option-btn');
    btns.forEach(function(btn, i) {
      btn.classList.toggle('selected', i === index);
    });
  },

  submitAnswer() {
    if (this.selectedAnswer < 0) {
      this.showToast('请先选择一个答案');
      return;
    }

    var level = FORENSICS_LEVELS[this.currentLevel];
    var q = level.questions[this.currentQuestion];
    var correct = this.selectedAnswer === q.answer;

    // 标记正确/错误
    var btns = document.querySelectorAll('.option-btn');
    btns.forEach(function(btn, i) {
      btn.disabled = true;
      if (i === q.answer) btn.classList.add('correct');
      if (i === this.selectedAnswer && !correct) btn.classList.add('wrong');
    }.bind(this));

    // 显示反馈
    var feedbackBox = document.getElementById('feedback-box');
    feedbackBox.classList.remove('hidden');
    feedbackBox.className = 'feedback-box ' + (correct ? 'correct' : 'wrong');
    feedbackBox.innerHTML =
      '<div class="feedback-title">' + (correct ? '✅ 正确！' : '❌ 错误') + '</div>' +
      '<div class="feedback-explain">' + q.explain + '</div>';

    if (correct) this.score += 10;

    document.getElementById('submit-btn').style.display = 'none';
    document.getElementById('next-btn').style.display = '';
    document.getElementById('next-btn').textContent =
      this.currentQuestion < level.questions.length - 1 ? '下一题 →' : '查看结果 →';
  },

  nextQuestion() {
    var level = FORENSICS_LEVELS[this.currentLevel];
    this.currentQuestion++;
    if (this.currentQuestion >= level.questions.length) {
      this.showResult();
    } else {
      this.renderQuestion();
    }
  },

  // ===== 结果 =====
  showResult() {
    var level = FORENSICS_LEVELS[this.currentLevel];
    var total = level.questions.length;

    // 计算星级
    var correctCount = 0;
    var btns = document.querySelectorAll('.option-btn.correct');
    // 重新统计：通过 score 差值
    var levelScore = total * 10;
    // 简单方式：看本轮加分
    var earned = 0;
    for (var i = 0; i < total; i++) {
      // 无法精确回溯，用 score 增量
    }
    // 用一个更简单的方式：根据提交时的计数
    // 这里我们根据当前 score 与开始时的差值来算
    // 但实际上我们没有记录开始时的 score，所以换个方式

    // 直接在 submitAnswer 里记录
    // 改用 this.levelCorrect 来追踪
    // 算了，直接用 this.score 变化来推算不靠谱
    // 改为在 startLevel 记录初始分数
    var levelGained = this.score - this._levelStartScore;
    var correctCnt = levelGained / 10;
    var stars = correctCnt >= total ? 3 : correctCnt >= total * 0.6 ? 2 : correctCnt > 0 ? 1 : 0;

    // 保存进度
    this.levelResults[this.currentLevel] = {
      completed: true,
      stars: Math.max(stars, (this.levelResults[this.currentLevel] && this.levelResults[this.currentLevel].stars) || 0)
    };
    this.saveProgress();

    // 显示完成弹窗
    document.getElementById('complete-title').textContent =
      stars >= 3 ? '🎉 完美通关！' : stars >= 2 ? '👍 不错！' : stars >= 1 ? '✅ 已通过' : '💀 需要再练练';
    document.getElementById('complete-msg').textContent =
      '答对 ' + correctCnt + ' / ' + total + ' 题，获得 ' + levelGained + ' 分';
    document.getElementById('complete-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

    // 知识卡片
    document.getElementById('knowledge-title').textContent = level.knowledge.title;
    document.getElementById('knowledge-body').textContent = level.knowledge.body;

    document.getElementById('level-complete').classList.remove('hidden');

    var nextBtn = document.getElementById('next-level-btn');
    if (this.currentLevel + 1 >= FORENSICS_LEVELS.length) {
      nextBtn.textContent = '🏆 全部完成';
    } else {
      nextBtn.textContent = '下一关 →';
    }
  },

  showToast(msg) {
    var toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function() {
      toast.classList.remove('show');
    }, 2000);
  }
};

// 在 startLevel 里记录初始分数
var _origStartLevel = Game.startLevel.bind(Game);
Game.startLevel = function(index) {
  this._levelStartScore = this.score;
  _origStartLevel(index);
};

// ===== 辅助函数 =====
function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===== 启动 =====
document.addEventListener('DOMContentLoaded', function() {
  Game.init();
});
