/**
 * game.js - IncidentResp 安全事件应急响应 游戏逻辑
 */

var Game = {
  state: 'menu',
  currentLevel: 0,
  currentQuestion: 0,
  score: 0,
  levelResults: [],
  selectedAnswer: -1,
  _levelStartScore: 0,

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
      if (next < INCIDENT_LEVELS.length) {
        self.startLevel(next);
      } else {
        self.showScreen('levels');
        self.renderLevels();
      }
    });

    document.getElementById('replay-btn').addEventListener('click', function() {
      self.startLevel(self.currentLevel);
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
      var saved = localStorage.getItem('incident_progress');
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
      localStorage.setItem('incident_progress', JSON.stringify({
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

    INCIDENT_LEVELS.forEach(function(level, i) {
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
    this._levelStartScore = this.score;
    this.currentLevel = index;
    this.currentQuestion = 0;
    this.showScreen('game');

    var level = INCIDENT_LEVELS[index];
    document.getElementById('level-title').textContent = level.icon + ' ' + level.name;
    document.getElementById('level-difficulty').textContent = level.difficulty;

    this.renderAlert(level);
    this.renderTimeline(level);
    this.renderQuestion();
    document.getElementById('level-complete').classList.add('hidden');
  },

  // ===== 渲染告警信息 =====
  renderAlert(level) {
    var a = level.alert;
    var container = document.getElementById('alert-card');
    container.innerHTML =
      '<div class="alert-title">' + escapeHtml(a.title) + '</div>' +
      '<div class="alert-row"><span class="alert-key">时间:</span><span class="alert-val">' + escapeHtml(a.time) + '</span></div>' +
      '<div class="alert-row"><span class="alert-key">来源:</span><span class="alert-val">' + escapeHtml(a.source) + '</span></div>' +
      '<div class="alert-row"><span class="alert-key">等级:</span><span class="alert-val"><span class="severity ' + a.severity + '">' + a.severity + '</span></span></div>' +
      '<div class="alert-row"><span class="alert-key">目标:</span><span class="alert-val">' + escapeHtml(a.target) + '</span></div>' +
      '<div class="alert-row"><span class="alert-key">描述:</span><span class="alert-val">' + escapeHtml(a.desc) + '</span></div>';
  },

  // ===== 渲染时间线 =====
  renderTimeline(level) {
    var container = document.getElementById('timeline');
    container.innerHTML = '';

    level.timeline.forEach(function(item) {
      var div = document.createElement('div');
      div.className = 'timeline-item';
      div.innerHTML =
        '<span class="timeline-time">' + escapeHtml(item.time) + '</span>' +
        '<span class="timeline-dot ' + item.type + '"></span>' +
        '<span class="timeline-text ' + item.type + '">' + escapeHtml(item.event) + '</span>';
      container.appendChild(div);
    });
  },

  // ===== 渲染题目 =====
  renderQuestion() {
    var level = INCIDENT_LEVELS[this.currentLevel];
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

    var level = INCIDENT_LEVELS[this.currentLevel];
    var q = level.questions[this.currentQuestion];
    var correct = this.selectedAnswer === q.answer;

    var btns = document.querySelectorAll('.option-btn');
    btns.forEach(function(btn, i) {
      btn.disabled = true;
      if (i === q.answer) btn.classList.add('correct');
      if (i === this.selectedAnswer && !correct) btn.classList.add('wrong');
    }.bind(this));

    var feedbackBox = document.getElementById('feedback-box');
    feedbackBox.classList.remove('hidden');
    feedbackBox.className = 'feedback-box ' + (correct ? 'correct' : 'wrong');
    document.getElementById('feedback-title').textContent = correct ? '✅ 正确判断！' : '❌ 判断错误';
    document.getElementById('feedback-explain').textContent = q.explain;

    if (correct) this.score += 10;

    document.getElementById('submit-btn').style.display = 'none';
    document.getElementById('next-btn').style.display = '';
    document.getElementById('next-btn').textContent =
      this.currentQuestion < level.questions.length - 1 ? '下一题 →' : '查看结果 →';
  },

  nextQuestion() {
    var level = INCIDENT_LEVELS[this.currentLevel];
    this.currentQuestion++;
    if (this.currentQuestion >= level.questions.length) {
      this.showResult();
    } else {
      this.renderQuestion();
    }
  },

  // ===== 结果 =====
  showResult() {
    var level = INCIDENT_LEVELS[this.currentLevel];
    var total = level.questions.length;

    var levelGained = this.score - this._levelStartScore;
    var correctCnt = levelGained / 10;
    var stars = correctCnt >= total ? 3 : correctCnt >= total * 0.6 ? 2 : correctCnt > 0 ? 1 : 0;

    this.levelResults[this.currentLevel] = {
      completed: true,
      stars: Math.max(stars, (this.levelResults[this.currentLevel] && this.levelResults[this.currentLevel].stars) || 0)
    };
    this.saveProgress();

    document.getElementById('complete-title').textContent =
      stars >= 3 ? '🎉 完美响应！' : stars >= 2 ? '👍 处置得当！' : stars >= 1 ? '✅ 已完成' : '💀 需要加强训练';
    document.getElementById('complete-msg').textContent =
      '答对 ' + correctCnt + ' / ' + total + ' 题，获得 ' + levelGained + ' 分';
    document.getElementById('complete-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

    document.getElementById('knowledge-title').textContent = level.knowledge.title;
    document.getElementById('knowledge-body').textContent = level.knowledge.body;

    document.getElementById('level-complete').classList.remove('hidden');

    var nextBtn = document.getElementById('next-level-btn');
    if (this.currentLevel + 1 >= INCIDENT_LEVELS.length) {
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
