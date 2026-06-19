/**
 * game.js - 塔防游戏主逻辑
 */

const Game = {
  canvas: null,
  ctx: null,
  // 游戏状态
  state: 'menu', // menu, playing, paused, gameover, victory
  level: null,
  levelIndex: 0,
  lives: 20,
  credits: 200,
  score: 0,
  // 实体
  towers: [],
  enemies: [],
  bullets: [],
  particles: [],
  // 波次
  currentWave: 0,
  waveActive: false,
  waveTimer: 0,
  spawnQueue: [],
  // 选塔
  selectedTower: null,
  hoveredCell: null,
  // 已建造的格子
  built: {},
  // 冻结的塔
  frozenTowers: [],
  // 时间
  lastTime: 0,
  dt: 0,

  // ===== 初始化 =====
  init() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = COLS * CELL;
    this.canvas.height = ROWS * CELL;
    // 当前关卡的地图和路径（从level获取）
    this.mapData = null;
    this.pathData = null;

    this.setupUI();
    this.showLevelSelect();
    this.gameLoop(0);
  },

  // ===== UI =====
  setupUI() {
    // 塔列表
    const towerList = document.getElementById('tower-list');
    towerList.innerHTML = '';
    for (const [id, t] of Object.entries(TOWERS)) {
      const div = document.createElement('div');
      div.className = 'tower-item';
      div.dataset.tower = id;
      div.innerHTML = `
        <span class="tower-icon">${t.icon}</span>
        <div class="tower-meta">
          <div class="tower-name">${t.name}</div>
          <div class="tower-cost">💰 ${t.cost}</div>
          <div class="tower-desc">${t.desc}</div>
        </div>
      `;
      div.addEventListener('click', () => { Audio.click(); this.selectTower(id); });
      towerList.appendChild(div);
    }

    // 画布事件
    this.canvas.addEventListener('mousemove', e => this.onMouseMove(e));
    this.canvas.addEventListener('click', e => this.onClick(e));
    this.canvas.addEventListener('contextmenu', e => { e.preventDefault(); this.onRightClick(e); });

    // 按钮
    document.getElementById('start-btn').addEventListener('click', () => { Audio.click(); this.startWaves(); });
    document.getElementById('next-wave-btn').addEventListener('click', () => { Audio.click(); this.startNextWave(); });
    document.getElementById('retry-btn').addEventListener('click', () => { Audio.click(); this.startLevel(this.levelIndex); });
    document.getElementById('back-btn').addEventListener('click', () => { Audio.click(); this.showLevelSelect(); });
    document.getElementById('back-to-menu-btn').addEventListener('click', () => { Audio.click(); this.showLevelSelect(); });
    document.getElementById('victory-next-btn').addEventListener('click', () => {
      Audio.click();
      if (this.levelIndex < LEVELS.length - 1) this.startLevel(this.levelIndex + 1);
      else this.showLevelSelect();
    });
    document.getElementById('victory-back-btn').addEventListener('click', () => { Audio.click(); this.showLevelSelect(); });
  },

  showLevelSelect() {
    this.state = 'menu';
    document.getElementById('level-select').classList.remove('hidden');
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('victory').classList.add('hidden');

    const btns = document.getElementById('level-buttons');
    btns.innerHTML = '';
    LEVELS.forEach((lv, i) => {
      const btn = document.createElement('button');
      btn.className = 'level-btn';
      btn.innerHTML = `<span class="level-num">关卡 ${lv.id}</span><span class="level-name">${lv.name}</span><span class="level-desc">${lv.desc}</span>`;
      btn.addEventListener('click', () => { Audio.click(); this.startLevel(i); });
      btns.appendChild(btn);
    });
  },

  updateUI() {
    document.getElementById('lives').textContent = this.lives;
    document.getElementById('credits').textContent = this.credits;
    document.getElementById('wave-num').textContent = this.currentWave;
    document.getElementById('wave-total').textContent = this.level.waves.length;
    document.getElementById('score').textContent = this.score;

    // 塔列表可用性
    document.querySelectorAll('.tower-item').forEach(el => {
      const t = TOWERS[el.dataset.tower];
      el.classList.toggle('disabled', this.credits < t.cost);
      el.classList.toggle('selected', this.selectedTower === t.id);
    });

    // 塔信息
    if (this.selectedTower) {
      const t = TOWERS[this.selectedTower];
      document.getElementById('tower-info').innerHTML = `
        <div style="font-weight:600;margin-bottom:4px;">${t.icon} ${t.name}</div>
        <div class="tower-stat"><span class="label">伤害</span><span class="value">${t.damage}</span></div>
        <div class="tower-stat"><span class="label">射程</span><span class="value">${t.range} 格</span></div>
        <div class="tower-stat"><span class="label">攻速</span><span class="value">${(1/t.fireRate).toFixed(1)}/秒</span></div>
        <div class="tower-stat"><span class="label">费用</span><span class="value">💰 ${t.cost}</span></div>
        <div style="margin-top:4px;color:#607d8b;font-size:11px;">${t.desc}</div>
      `;
    }

    // 关卡信息
    document.getElementById('level-info').innerHTML = `
      <div>${this.level.name}</div>
      <div style="color:#607d8b;font-size:11px;">${this.level.desc}</div>
      <div style="margin-top:4px;">波次: ${this.currentWave}/${this.level.waves.length}</div>
    `;
  },

  // ===== 关卡 =====
  startLevel(index) {
    this.levelIndex = index;
    this.level = LEVELS[index];
    this.mapData = this.level.map;
    this.pathData = this.level.path;
    this.lives = this.level.lives;
    this.credits = this.level.credits;
    this.score = 0;
    this.towers = [];
    this.enemies = [];
    this.bullets = [];
    this.particles = [];
    this.currentWave = 0;
    this.waveActive = false;
    this.spawnQueue = [];
    this.selectedTower = null;
    this.built = {};
    this.frozenTowers = [];

    document.getElementById('level-select').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('victory').classList.add('hidden');
    document.getElementById('start-btn').classList.remove('hidden');
    document.getElementById('next-wave-btn').classList.add('hidden');

    this.state = 'playing';
    this.updateUI();

    // 敌人图鉴
    const guide = document.getElementById('enemy-guide');
    const enemyTypes = new Set();
    this.level.waves.forEach(w => w.enemies.forEach(e => enemyTypes.add(e.type)));
    guide.innerHTML = [...enemyTypes].map(type => {
      const e = ENEMIES[type];
      return `<div class="enemy-entry"><span class="icon">${e.icon}</span><div><div class="name">${e.name}</div><div class="desc">${e.desc}</div></div></div>`;
    }).join('');
  },

  // ===== 波次 =====
  startWaves() {
    this.currentWave = 0;
    document.getElementById('start-btn').classList.add('hidden');
    this.startNextWave();
  },

  startNextWave() {
    if (this.currentWave >= this.level.waves.length) return;
    const wave = this.level.waves[this.currentWave];
    this.currentWave++;
    this.waveActive = true;
    this.spawnQueue = [];
    Audio.waveStart();

    // 构建生成队列
    let delay = 0;
    for (const group of wave.enemies) {
      for (let i = 0; i < group.count; i++) {
        this.spawnQueue.push({ type: group.type, time: delay });
        delay += group.interval;
      }
    }
    this.waveTimer = 0;

    document.getElementById('next-wave-btn').classList.add('hidden');
    this.updateUI();
  },

  checkWaveComplete() {
    if (!this.waveActive) return;
    if (this.spawnQueue.length === 0 && this.enemies.length === 0) {
      this.waveActive = false;
      Audio.waveComplete();
      if (this.currentWave >= this.level.waves.length) {
        // 全部波次完成
        this.victory();
      } else {
        document.getElementById('next-wave-btn').classList.remove('hidden');
      }
    }
  },

  // ===== 塔操作 =====
  selectTower(id) {
    if (this.selectedTower === id) {
      this.selectedTower = null;
    } else {
      this.selectedTower = id;
    }
    this.updateUI();
  },

  placeTower(col, row) {
    if (!this.selectedTower) return;
    const key = `${col},${row}`;
    if (this.built[key]) return;
    if (this.mapData[row][col] !== 0) return;

    const t = TOWERS[this.selectedTower];
    if (this.credits < t.cost) return;

    this.credits -= t.cost;
    const tower = {
      ...t,
      col, row,
      x: col * CELL + CELL / 2,
      y: row * CELL + CELL / 2,
      cooldown: 0,
      angle: 0,
      frozen: false,
      freezeTimer: 0,
    };
    this.towers.push(tower);
    this.built[key] = true;
    Audio.place();
    this.updateUI();
  },

  sellTower(col, row) {
    const key = `${col},${row}`;
    const idx = this.towers.findIndex(t => t.col === col && t.row === row);
    if (idx === -1) return;
    const tower = this.towers[idx];
    this.credits += Math.floor(tower.cost * 0.6);
    this.towers.splice(idx, 1);
    delete this.built[key];
    Audio.sell();
    this.updateUI();
  },

  // ===== 敌人生成 =====
  spawnEnemy(type) {
    const def = ENEMIES[type];
    const start = this.pathData[0];
    const enemy = {
      ...def,
      x: start.x * CELL + CELL / 2,
      y: start.y * CELL + CELL / 2,
      currentHp: def.hp,
      maxHp: def.hp,
      pathIndex: 0,
      slowTimer: 0,
      slowFactor: 1,
      visible: !def.stealth,
      alive: true,
    };
    this.enemies.push(enemy);
  },

  // ===== 输入 =====
  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / CELL);
    const row = Math.floor(y / CELL);
    this.hoveredCell = { col, row };
  },

  onClick(e) {
    if (this.state !== 'playing') return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / CELL);
    const row = Math.floor(y / CELL);
    this.placeTower(col, row);
  },

  onRightClick(e) {
    if (this.state !== 'playing') return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / CELL);
    const row = Math.floor(y / CELL);
    const key = `${col},${row}`;
    if (this.built[key]) {
      this.showContextMenu(e.clientX, e.clientY, col, row);
    }
  },

  showContextMenu(x, y, col, row) {
    this.removeContextMenu();
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    const tower = this.towers.find(t => t.col === col && t.row === row);
    const refund = tower ? Math.floor(tower.cost * 0.6) : 0;
    menu.innerHTML = `<div class="context-item danger">🗑️ 出售 (💰${refund})</div>`;
    menu.querySelector('.context-item').addEventListener('click', () => {
      this.sellTower(col, row);
      this.removeContextMenu();
    });
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', this._removeCtx = () => this.removeContextMenu(), { once: true }), 10);
  },

  removeContextMenu() {
    document.querySelectorAll('.context-menu').forEach(m => m.remove());
    if (this._removeCtx) document.removeEventListener('click', this._removeCtx);
  },

  // ===== 游戏结束 =====
  gameOver() {
    this.state = 'gameover';
    Audio.gameOver();
    const modal = document.getElementById('game-over');
    document.getElementById('game-over-msg').textContent = `在第 ${this.currentWave} 波被攻破`;
    document.getElementById('game-over-stats').innerHTML = `
      <div class="stat-line"><span class="label">得分</span><span class="value">${this.score}</span></div>
      <div class="stat-line"><span class="label">建造塔数</span><span class="value">${this.towers.length}</span></div>
    `;
    modal.classList.remove('hidden');
  },

  victory() {
    this.state = 'victory';
    Audio.victory();
    const modal = document.getElementById('victory');
    document.getElementById('victory-msg').textContent = `${this.level.name} 防御成功！`;
    document.getElementById('victory-stats').innerHTML = `
      <div class="stat-line"><span class="label">得分</span><span class="value">${this.score}</span></div>
      <div class="stat-line"><span class="label">剩余生命</span><span class="value">❤️ ${this.lives}</span></div>
      <div class="stat-line"><span class="label">剩余资金</span><span class="value">💰 ${this.credits}</span></div>
    `;
    if (this.levelIndex >= LEVELS.length - 1) {
      document.getElementById('victory-next-btn').textContent = '📋 选关';
    } else {
      document.getElementById('victory-next-btn').textContent = '▶ 下一关';
    }
    modal.classList.remove('hidden');
  },

  // ===== 游戏主循环 =====
  gameLoop(time) {
    this.dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    if (this.state === 'playing') {
      this.update();
    }
    this.render();
    requestAnimationFrame(t => this.gameLoop(t));
  },

  update() {
    // 生成敌人
    this.waveTimer += this.dt;
    while (this.spawnQueue.length > 0 && this.spawnQueue[0].time <= this.waveTimer) {
      const spawn = this.spawnQueue.shift();
      this.spawnEnemy(spawn.type);
    }

    // 更新冻结
    this.frozenTowers = this.frozenTowers.filter(f => {
      f.timer -= this.dt;
      if (f.timer <= 0) {
        f.tower.frozen = false;
        return false;
      }
      return true;
    });

    // 更新敌人
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;

      // 减速
      if (enemy.slowTimer > 0) {
        enemy.slowTimer -= this.dt;
        if (enemy.slowTimer <= 0) enemy.slowFactor = 1;
      }

      // 移动
      const target = this.pathData[enemy.pathIndex + 1];
      if (!target) {
        // 到达终点
        this.lives -= enemy.damage;
        enemy.alive = false;
        Audio.lifeLost();
        if (this.lives <= 0) {
          this.lives = 0;
          this.gameOver();
          return;
        }
        this.updateUI();
        continue;
      }

      const tx = target.x * CELL + CELL / 2;
      const ty = target.y * CELL + CELL / 2;
      const dx = tx - enemy.x;
      const dy = ty - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = enemy.speed * enemy.slowFactor * CELL * this.dt;

      if (dist <= speed) {
        enemy.x = tx;
        enemy.y = ty;
        enemy.pathIndex++;
      } else {
        enemy.x += (dx / dist) * speed;
        enemy.y += (dy / dist) * speed;
      }
    }

    // 更新塔
    for (const tower of this.towers) {
      if (tower.frozen) continue;
      tower.cooldown -= this.dt;
      if (tower.cooldown > 0) continue;

      // 找目标
      let target = null;
      let minDist = Infinity;
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        if (enemy.stealth && !enemy.visible && tower.special !== 'slow_reveal') continue;
        const dx = enemy.x - tower.x;
        const dy = enemy.y - tower.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= tower.range * CELL && dist < minDist) {
          minDist = dist;
          target = enemy;
        }
      }

      if (target) {
        tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
        tower.cooldown = tower.fireRate;
        Audio.shoot();

        // 发射子弹
        this.bullets.push({
          x: tower.x,
          y: tower.y,
          target,
          damage: tower.damage,
          speed: 6 * CELL,
          color: tower.bulletColor,
          special: tower.special,
          tower,
        });
      }
    }

    // 更新子弹
    for (const bullet of this.bullets) {
      if (!bullet.target.alive) { bullet.done = true; continue; }
      const dx = bullet.target.x - bullet.x;
      const dy = bullet.target.y - bullet.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const move = bullet.speed * this.dt;

      if (dist <= move + 5) {
        // 命中
        let dmg = bullet.damage;
        if (bullet.special === 'anti_inject' && bullet.target.type === 'inject') dmg *= 2;

        bullet.target.currentHp -= dmg;
        bullet.done = true;
        Audio.hit();

        // 特殊效果
        if (bullet.special === 'slow_reveal') {
          bullet.target.slowTimer = 2;
          bullet.target.slowFactor = 0.5;
          bullet.target.visible = true;
        }
        if (bullet.special === 'attract') {
          bullet.target.slowTimer = 1.5;
          bullet.target.slowFactor = 0.6;
        }

        // 粒子效果
        this.addParticle(bullet.target.x, bullet.target.y, bullet.color, 5);

        // 敌人死亡
        if (bullet.target.currentHp <= 0) {
          bullet.target.alive = false;
          this.credits += bullet.target.reward;
          this.score += bullet.target.reward;
          this.addParticle(bullet.target.x, bullet.target.y, '#ffd54f', 10);
          if (bullet.target.isBoss) Audio.bossDeath();
          else Audio.death();

          // 勒索病毒死亡效果
          if (bullet.target.freezeOnDeath) {
            Audio.freeze();
            for (const tower of this.towers) {
              const tdx = tower.x - bullet.target.x;
              const tdy = tower.y - bullet.target.y;
              if (Math.sqrt(tdx * tdx + tdy * tdy) <= bullet.target.freezeRadius * CELL) {
                tower.frozen = true;
                this.frozenTowers.push({ tower, timer: bullet.target.freezeDuration });
              }
            }
          }

          this.updateUI();
        }
      } else {
        bullet.x += (dx / dist) * move;
        bullet.y += (dy / dist) * move;
      }
    }
    this.bullets = this.bullets.filter(b => !b.done);

    // 更新粒子
    this.particles = this.particles.filter(p => {
      p.life -= this.dt;
      p.x += p.vx * this.dt;
      p.y += p.vy * this.dt;
      return p.life > 0;
    });

    // 清理死亡敌人
    this.enemies = this.enemies.filter(e => e.alive);

    // 检查波次完成
    this.checkWaveComplete();
  },

  addParticle(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 100,
        vy: (Math.random() - 0.5) * 100,
        life: 0.3 + Math.random() * 0.3,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  },

  // ===== 渲染 =====
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 地图
    if (!this.mapData) return;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * CELL;
        const y = r * CELL;
        const cell = this.mapData[r][c];

        if (cell === 0) {
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(x, y, CELL, CELL);
          ctx.strokeStyle = '#cbd5e1';
          ctx.strokeRect(x, y, CELL, CELL);
        } else if (cell === 1) {
          ctx.fillStyle = '#b0bec5';
          ctx.fillRect(x, y, CELL, CELL);
          ctx.strokeStyle = '#90a4ae';
          ctx.strokeRect(x, y, CELL, CELL);
        } else if (cell === 2) {
          ctx.fillStyle = '#1b5e20';
          ctx.fillRect(x, y, CELL, CELL);
          ctx.fillStyle = '#4caf50';
          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('▶', x + CELL/2, y + CELL/2);
        } else if (cell === 3) {
          ctx.fillStyle = '#b71c1c';
          ctx.fillRect(x, y, CELL, CELL);
          ctx.fillStyle = '#f44336';
          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🖥️', x + CELL/2, y + CELL/2);
        }
      }
    }

    // 悬浮格子高亮
    if (this.hoveredCell && this.selectedTower && this.state === 'playing') {
      const { col, row } = this.hoveredCell;
      const key = `${col},${row}`;
      const canPlace = this.mapData[row] && this.mapData[row][col] === 0 && !this.built[key];
      ctx.fillStyle = canPlace ? 'rgba(0,131,143,0.25)' : 'rgba(198,40,40,0.25)';
      ctx.fillRect(col * CELL, row * CELL, CELL, CELL);
      ctx.strokeStyle = canPlace ? '#00838f' : '#c62828';
      ctx.strokeRect(col * CELL, row * CELL, CELL, CELL);

      // 射程预览
      if (canPlace) {
        const t = TOWERS[this.selectedTower];
        ctx.beginPath();
        ctx.arc(col * CELL + CELL/2, row * CELL + CELL/2, t.range * CELL, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,131,143,0.35)';
        ctx.stroke();
      }
    }

    // 塔
    for (const tower of this.towers) {
      const x = tower.x;
      const y = tower.y;

      // 射程（选中时）
      if (this.selectedTower === tower.id) {
        ctx.beginPath();
        ctx.arc(x, y, tower.range * CELL, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,131,143,0.25)';
        ctx.stroke();
      }

      // 塔身
      ctx.save();
      ctx.translate(x, y);

      // 底座
      ctx.fillStyle = tower.frozen ? '#455a64' : tower.color;
      ctx.beginPath();
      ctx.arc(0, 0, CELL * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // 图标
      ctx.font = `${CELL * 0.5}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tower.icon, 0, 0);

      // 冻结效果
      if (tower.frozen) {
        ctx.fillStyle = 'rgba(33,150,243,0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, CELL * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.fillText('❄️', 0, -CELL * 0.3);
      }

      // 炮管方向
      if (!tower.frozen) {
        ctx.rotate(tower.angle);
        ctx.fillStyle = tower.color;
        ctx.fillRect(0, -3, CELL * 0.4, 6);
        ctx.restore();
      } else {
        ctx.restore();
      }
    }

    // 敌人
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (enemy.stealth && !enemy.visible) {
        // 隐身敌人半透明
        ctx.globalAlpha = 0.15;
      }

      const x = enemy.x;
      const y = enemy.y;

      // 血条背景
      const barW = CELL * 0.7;
      const barH = 4;
      const barX = x - barW / 2;
      const barY = y - CELL * 0.45;
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barW, barH);

      // 血条
      const hpPct = enemy.currentHp / enemy.maxHp;
      ctx.fillStyle = hpPct > 0.5 ? '#4caf50' : hpPct > 0.25 ? '#ff9800' : '#f44336';
      ctx.fillRect(barX, barY, barW * hpPct, barH);

      // 敌人图标
      ctx.font = `${CELL * 0.55}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(enemy.icon, x, y);

      // Boss 光环
      if (enemy.isBoss) {
        ctx.beginPath();
        ctx.arc(x, y, CELL * 0.45, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(224,64,251,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.lineWidth = 1;
      }

      // 减速效果
      if (enemy.slowTimer > 0) {
        ctx.fillStyle = 'rgba(156,39,176,0.3)';
        ctx.beginPath();
        ctx.arc(x, y, CELL * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    }

    // 子弹
    for (const bullet of this.bullets) {
      ctx.fillStyle = bullet.color;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 粒子
    for (const p of this.particles) {
      ctx.globalAlpha = p.life / 0.6;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.life / 0.6), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
};

// 启动
document.addEventListener('DOMContentLoaded', () => Game.init());
