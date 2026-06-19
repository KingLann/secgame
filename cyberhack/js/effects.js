/**
 * effects.js - 动画和视觉效果
 */

const Effects = {
  // 矩阵雨背景
  initMatrixRain() {
    const canvas = document.getElementById('matrix-bg');
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()アイウエオカキクケコサシスセソ';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(26, 26, 46, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff9800';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    setInterval(draw, 50);
  },

  // 打字机效果
  async typeText(element, text, speed = 30) {
    for (let i = 0; i < text.length; i++) {
      element.textContent += text[i];
      await this.sleep(speed);
    }
  },

  // 逐行输出到终端（带动画）
  async typewriterLine(container, text, className = 'output', speed = 15) {
    const line = document.createElement('div');
    line.className = `terminal-line ${className}`;
    container.appendChild(line);

    for (let i = 0; i < text.length; i++) {
      line.textContent += text[i];
      if (speed > 0 && i % 3 === 0) {
        await this.sleep(speed);
      }
    }
    container.scrollTop = container.scrollHeight;
    return line;
  },

  // 即时输出一行
  instantLine(container, text, className = 'output') {
    const line = document.createElement('div');
    line.className = `terminal-line ${className}`;
    line.textContent = text;
    container.appendChild(line);
    container.scrollTop = container.scrollHeight;

    // Flag 行支持点击复制
    if (className === 'flag') {
      line.addEventListener('click', () => {
        this.copyToClipboard(text);
      });
    }
    return line;
  },

  // 输出 HTML 内容
  htmlLine(container, html, className = 'output') {
    const line = document.createElement('div');
    line.className = `terminal-line ${className}`;
    line.innerHTML = html;
    container.appendChild(line);
    container.scrollTop = container.scrollHeight;
    return line;
  },

  // 进度条动画
  async progressBar(container, label, duration = 2000) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div style="color: #607080; font-size: 12px; margin: 3px 0;">${label}</div>
      <div class="progress-bar">
        <div class="progress-fill"></div>
        <span class="progress-text">0%</span>
      </div>
    `;
    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;

    const fill = wrapper.querySelector('.progress-fill');
    const text = wrapper.querySelector('.progress-text');
    const steps = 20;
    const stepTime = duration / steps;

    for (let i = 0; i <= steps; i++) {
      const percent = Math.round((i / steps) * 100);
      fill.style.width = `${percent}%`;
      text.textContent = `${percent}%`;
      await this.sleep(stepTime);
    }
    return wrapper;
  },

  // 模拟扫描输出
  async scanOutput(container, lines, lineDelay = 100) {
    for (const line of lines) {
      this.instantLine(container, line.text, line.class || 'output');
      await this.sleep(lineDelay);
    }
  },

  // 闪烁效果
  blink(element, times = 3) {
    let count = 0;
    const interval = setInterval(() => {
      element.style.opacity = element.style.opacity === '0' ? '1' : '0';
      count++;
      if (count >= times * 2) {
        clearInterval(interval);
        element.style.opacity = '1';
      }
    }, 150);
  },

  // 成功弹窗动画
  showLevelComplete(level, score, timeUsed, hintsUsed, newAchievements = [], isLastLevel = false) {
    const modal = document.getElementById('level-complete-modal');
    const msg = document.getElementById('level-complete-msg');
    const stats = document.getElementById('level-stats');

    msg.textContent = isLastLevel ? `🎉 全部任务完成！` : `关卡 ${level.id}: ${level.name} 已攻克！`;

    const timeStr = `${Math.floor(timeUsed / 60)}分${timeUsed % 60}秒`;

    // 成就区域标题
    const achieveTitle = isLastLevel ? '🏆 全部成就汇总' : '🏆 本关成就';

    // 成就 HTML
    let achieveHTML = `<div style="border-top:1px solid #1a2436;padding-top:8px;margin-top:8px;">
      <div style="color:#ffc107;font-size:12px;margin-bottom:6px;">${achieveTitle}</div>`;
    if (newAchievements.length > 0) {
      achieveHTML += newAchievements.map(a =>
        `<div style="margin:3px 0;font-size:13px;">${a.icon} ${a.name} <span style="color:#78909c;font-size:11px;">— ${a.desc}</span></div>`
      ).join('');
    } else {
      achieveHTML += `<div style="color:#78909c;font-size:12px;">本关未获得新成就，试试不用提示？</div>`;
    }
    achieveHTML += `</div>`;

    stats.innerHTML = `
      <div class="stat-line"><span class="stat-label">基础得分</span><span class="stat-value">+${level.baseScore}</span></div>
      <div class="stat-line"><span class="stat-label">用时</span><span class="stat-value">${timeStr}</span></div>
      ${hintsUsed > 0 ? `<div class="stat-line"><span class="stat-label">提示使用</span><span class="stat-value">${hintsUsed} 次 (-${hintsUsed * 50})</span></div>` : ''}
      <div class="stat-line" style="border-top:1px solid #1a2436;padding-top:5px;margin-top:5px;">
        <span class="stat-label">本关得分</span>
        <span class="stat-value" style="color:#ffd600;">${score}</span>
      </div>
      ${achieveHTML}
    `;

    modal.classList.remove('hidden');
  },

  showGameComplete(totalScore, achievements) {
    const modal = document.getElementById('game-complete-modal');
    const stats = document.getElementById('final-stats');

    stats.innerHTML = `
      <div class="stat-line"><span class="stat-label">总分</span><span class="stat-value" style="color:#ffd600;">${totalScore}</span></div>
      <div class="stat-line"><span class="stat-label">成就数</span><span class="stat-value">${achievements.length} 个</span></div>
      <div style="margin-top:10px;">
        ${achievements.map(a => `<span class="achievement-badge">${a.icon} ${a.name}</span>`).join('')}
      </div>
    `;

    modal.classList.remove('hidden');
  },

  // 屏幕震动
  shakeScreen() {
    const app = document.getElementById('app');
    app.classList.add('glitch');
    setTimeout(() => app.classList.remove('glitch'), 300);
  },

  // 复制到剪贴板
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('✅ 已复制到剪贴板');
    } catch {
      // 降级方案
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.showToast('✅ 已复制到剪贴板');
    }
  },

  // Toast 提示
  showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4500);
  },

  // 工具函数
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
