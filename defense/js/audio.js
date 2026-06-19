/**
 * audio.js - Web Audio API 音效生成器
 */

const Audio = {
  ctx: null,
  enabled: true,
  volume: 0.3,

  init() {
    // 需要用户交互后才能创建 AudioContext
    const resume = () => {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    };
    document.addEventListener('click', resume, { once: false });
    document.addEventListener('keydown', resume, { once: false });
  },

  // 播放音调
  playTone(freq, duration, type = 'square', vol = this.volume) {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },

  // 噪音
  playNoise(duration, vol = this.volume * 0.5) {
    if (!this.enabled || !this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();
  },

  // ===== 游戏音效 =====

  // 塔射击
  shoot() {
    this.playTone(800, 0.08, 'square', 0.15);
  },

  // 子弹命中
  hit() {
    this.playTone(400, 0.05, 'sawtooth', 0.1);
  },

  // 敌人死亡
  death() {
    this.playTone(300, 0.1, 'square', 0.2);
    setTimeout(() => this.playTone(200, 0.15, 'square', 0.15), 50);
  },

  // Boss死亡
  bossDeath() {
    this.playTone(200, 0.15, 'sawtooth', 0.25);
    setTimeout(() => this.playTone(300, 0.15, 'sawtooth', 0.2), 80);
    setTimeout(() => this.playTone(400, 0.2, 'sawtooth', 0.15), 160);
    setTimeout(() => this.playNoise(0.3, 0.15), 250);
  },

  // 放置塔
  place() {
    this.playTone(600, 0.05, 'sine', 0.2);
    setTimeout(() => this.playTone(900, 0.08, 'sine', 0.15), 40);
  },

  // 出售塔
  sell() {
    this.playTone(500, 0.08, 'sine', 0.15);
    setTimeout(() => this.playTone(350, 0.1, 'sine', 0.12), 50);
  },

  // 波次开始
  waveStart() {
    this.playTone(400, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(500, 0.1, 'sine', 0.2), 100);
    setTimeout(() => this.playTone(700, 0.15, 'sine', 0.2), 200);
  },

  // 波次完成
  waveComplete() {
    this.playTone(500, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(600, 0.1, 'sine', 0.2), 80);
    setTimeout(() => this.playTone(800, 0.2, 'sine', 0.25), 160);
  },

  // 扣血
  lifeLost() {
    this.playTone(200, 0.2, 'sawtooth', 0.3);
    setTimeout(() => this.playTone(150, 0.3, 'sawtooth', 0.2), 100);
  },

  // 游戏胜利
  victory() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 0.2, 'sine', 0.2), i * 120);
    });
  },

  // 游戏失败
  gameOver() {
    const notes = [400, 350, 300, 200];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 0.3, 'sawtooth', 0.2), i * 200);
    });
  },

  // 塔冻结
  freeze() {
    this.playTone(1200, 0.15, 'sine', 0.1);
    setTimeout(() => this.playTone(800, 0.2, 'sine', 0.08), 80);
  },

  // 按钮点击
  click() {
    this.playTone(700, 0.04, 'sine', 0.1);
  },
};

// 初始化
document.addEventListener('DOMContentLoaded', () => Audio.init());
