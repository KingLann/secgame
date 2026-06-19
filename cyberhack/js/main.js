/**
 * main.js - 游戏入口和初始化
 */

const Game = {
  init() {
    // 初始化矩阵雨背景
    Effects.initMatrixRain();

    // 初始化终端
    Terminal.init();

    // 加载存档
    GameState.load();

    // 绑定事件
    this.bindEvents();

    // 显示开始界面
    document.getElementById('start-screen').classList.add('active');

    // 聚焦输入
    document.addEventListener('click', () => {
      const input = document.getElementById('terminal-input');
      if (input) input.focus();
    });
  },

  bindEvents() {
    // 开始按钮
    document.getElementById('start-btn').addEventListener('click', () => {
      this.startGame();
    });

    // 下一关按钮
    document.getElementById('next-level-btn').addEventListener('click', () => {
      document.getElementById('level-complete-modal').classList.add('hidden');
      this.nextLevel();
    });

    // 留在当前关按钮
    document.getElementById('stay-btn').addEventListener('click', () => {
      document.getElementById('level-complete-modal').classList.add('hidden');
      document.getElementById('terminal-input').focus();
    });

    // 重新开始按钮
    document.getElementById('restart-btn').addEventListener('click', () => {
      document.getElementById('game-complete-modal').classList.add('hidden');
      GameState.reset();
      this.startGame();
    });

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      // 在开始界面按 Enter 开始
      if (e.key === 'Enter' && document.getElementById('start-screen').classList.contains('active')) {
        this.startGame();
      }
    });
  },

  startGame() {
    // 切换到游戏界面
    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');

    // 如果有存档且不是第一关，询问是否继续
    if (GameState.currentLevel > 0) {
      this.showWelcomeBack();
    } else {
      // 重置状态
      GameState.reset();
      // 显示第一关
      this.loadLevel(0);
    }

    // 聚焦输入
    setTimeout(() => {
      document.getElementById('terminal-input').focus();
    }, 100);
  },

  async showWelcomeBack() {
    const level = GameState.getCurrentLevel();
    if (!level) {
      this.loadLevel(0);
      return;
    }

    Effects.instantLine(Terminal.output, `欢迎回来，特工！`, 'success');
    Effects.instantLine(Terminal.output, `当前进度: 关卡 ${level.id} - ${level.name}`, 'info');
    Effects.instantLine(Terminal.output, `当前得分: ${GameState.score}`, 'info');
    Effects.instantLine(Terminal.output, ``, 'output');
    Effects.instantLine(Terminal.output, `输入 "continue" 继续，或输入 "restart" 重新开始:`, 'warning');

    // 临时覆盖命令处理
    const originalProcess = Terminal.processCommand.bind(Terminal);
    const self = this;
    Terminal.processCommand = async function() {
      const val = Terminal.input.value.trim().toLowerCase();
      Terminal.input.value = '';

      if (val === 'continue' || val === '') {
        Terminal.processCommand = originalProcess;
        self.loadLevel(GameState.currentLevel);
      } else if (val === 'restart') {
        Terminal.processCommand = originalProcess;
        GameState.reset();
        self.loadLevel(0);
      } else {
        Effects.instantLine(Terminal.output, `请输入 "continue" 或 "restart"`, 'error');
      }
    };
  },

  async loadLevel(index) {
    if (index >= Levels.length) {
      this.gameComplete();
      return;
    }

    GameState.currentLevel = index;
    const level = Levels[index];
    await Terminal.showLevelIntro(level);

    // 聚焦输入
    document.getElementById('terminal-input').focus();
  },

  nextLevel() {
    const nextIndex = GameState.currentLevel + 1;
    if (nextIndex >= Levels.length) {
      this.gameComplete();
    } else {
      this.loadLevel(nextIndex);
    }
  },

  gameComplete() {
    GameState.addAchievement(Achievements.ALL_CLEAR);
    Terminal.updateAchievements();
    GameState.save();
    Effects.showGameComplete(GameState.score, GameState.achievements);
  }
};

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
  Game.init();
});
