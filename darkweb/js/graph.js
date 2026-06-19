// 交易网络图渲染引擎
// 使用 Canvas 绘制连线 + HTML div 绘制节点

class TransactionGraph {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'graph-canvas';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.nodes = [];
    this.edges = [];
    this.nodeElements = {};
    this.selectedNode = null;
    this.onNodeClick = null;
    this.animationOffset = 0;
    this.animating = true;

    // 拖拽状态
    this.dragging = null;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;

    this._setupListeners();
    this._animate();
  }

  // 加载案例数据
  loadCase(caseData) {
    this.nodes = JSON.parse(JSON.stringify(caseData.nodes));
    this.edges = JSON.parse(JSON.stringify(caseData.edges));
    this._createNodeElements();
    this._resize();
    this.render();
  }

  // 清空
  clear() {
    this.nodes = [];
    this.edges = [];
    Object.values(this.nodeElements).forEach(el => el.remove());
    this.nodeElements = {};
    this.selectedNode = null;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // 创建节点 DOM 元素
  _createNodeElements() {
    Object.values(this.nodeElements).forEach(el => el.remove());
    this.nodeElements = {};

    this.nodes.forEach(node => {
      const el = document.createElement('div');
      el.className = `graph-node node-${node.type}`;
      el.dataset.id = node.id;
      el.innerHTML = `
        <div class="node-icon">${this._getIcon(node.type)}</div>
        <div class="node-label">${node.label}</div>
      `;
      el.style.left = node.x + 'px';
      el.style.top = node.y + 'px';

      // 点击事件
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectNode(node.id);
      });

      // 拖拽事件
      el.addEventListener('mousedown', (e) => {
        this.dragging = node;
        const rect = el.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        this.dragOffsetX = e.clientX - rect.left;
        this.dragOffsetY = e.clientY - rect.top;
        el.style.zIndex = 100;
        e.preventDefault();
      });

      this.container.appendChild(el);
      this.nodeElements[node.id] = el;
    });
  }

  // 更新节点位置（拖拽后）
  _updateNodePosition(node) {
    const el = this.nodeElements[node.id];
    if (el) {
      el.style.left = node.x + 'px';
      el.style.top = node.y + 'px';
    }
  }

  // 选中节点
  selectNode(id) {
    // 取消之前的选中
    Object.values(this.nodeElements).forEach(el => el.classList.remove('selected'));

    this.selectedNode = this.nodes.find(n => n.id === id);
    if (this.selectedNode) {
      this.nodeElements[id].classList.add('selected');
    }

    if (this.onNodeClick) {
      this.onNodeClick(this.selectedNode);
    }
  }

  // 取消选中
  deselectAll() {
    Object.values(this.nodeElements).forEach(el => el.classList.remove('selected'));
    this.selectedNode = null;
  }

  // 高亮指定路径
  highlightPath(nodeIds) {
    Object.values(this.nodeElements).forEach(el => el.classList.remove('path-highlight'));
    nodeIds.forEach(id => {
      if (this.nodeElements[id]) {
        this.nodeElements[id].classList.add('path-highlight');
      }
    });
    this._highlightedEdges = [];
    for (let i = 0; i < nodeIds.length - 1; i++) {
      this._highlightedEdges.push({ from: nodeIds[i], to: nodeIds[i + 1] });
    }
    this.render();
  }

  // 清除路径高亮
  clearHighlight() {
    Object.values(this.nodeElements).forEach(el => el.classList.remove('path-highlight'));
    this._highlightedEdges = [];
    this.render();
  }

  // 更新节点外观（揭示后）
  updateNode(id, newData) {
    const node = this.nodes.find(n => n.id === id);
    if (!node) return;

    Object.assign(node, newData);
    const el = this.nodeElements[id];
    if (el) {
      el.className = `graph-node node-${node.type} revealed`;
      el.querySelector('.node-icon').textContent = this._getIcon(node.type);
      el.querySelector('.node-label').textContent = node.label;
    }
  }

  // 获取节点图标
  _getIcon(type) {
    const icons = {
      darknet:  '🔴',
      mixer:    '🟠',
      exchange: '🔵',
      personal: '🟢',
      unknown:  '⚪'
    };
    return icons[type] || '⚪';
  }

  // 设置画布大小
  _resize() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  // 渲染连线
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.edges.forEach(edge => {
      const fromNode = this.nodes.find(n => n.id === edge.from);
      const toNode = this.nodes.find(n => n.id === edge.to);
      if (!fromNode || !toNode) return;

      const fromEl = this.nodeElements[fromNode.id];
      const toEl = this.nodeElements[toNode.id];
      if (!fromEl || !toEl) return;

      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();

      const fromX = fromRect.left + fromRect.width / 2 - containerRect.left;
      const fromY = fromRect.top + fromRect.height / 2 - containerRect.top;
      const toX = toRect.left + toRect.width / 2 - containerRect.left;
      const toY = toRect.top + toRect.height / 2 - containerRect.top;

      // 检查是否是高亮路径
      const isHighlighted = this._highlightedEdges && this._highlightedEdges.some(
        h => h.from === edge.from && h.to === edge.to
      );

      this._drawArrow(ctx, fromX, fromY, toX, toY, isHighlighted);

      // 显示金额+时间标签
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;
      this._drawAmountLabel(ctx, midX, midY, edge.amount, edge.unit || 'BTC', edge.time);
    });
  }

  // 绘制带箭头的连线
  _drawArrow(ctx, fromX, fromY, toX, toY, highlighted) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    const nodeRadius = 32;

    // 起止点偏移到节点边缘
    const startX = fromX + Math.cos(angle) * nodeRadius;
    const startY = fromY + Math.sin(angle) * nodeRadius;
    const endX = toX - Math.cos(angle) * nodeRadius;
    const endY = toY - Math.sin(angle) * nodeRadius;

    ctx.save();

    // 线条样式
    ctx.strokeStyle = highlighted ? '#2563eb' : '#94a3b8';
    ctx.lineWidth = highlighted ? 3 : 2;
    ctx.setLineDash([8, 4]);
    ctx.lineDashOffset = -this.animationOffset;

    // 画线
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // 箭头
    const arrowLen = 12;
    const arrowAngle = Math.PI / 6;
    ctx.setLineDash([]);
    ctx.fillStyle = highlighted ? '#2563eb' : '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowLen * Math.cos(angle - arrowAngle),
      endY - arrowLen * Math.sin(angle - arrowAngle)
    );
    ctx.lineTo(
      endX - arrowLen * Math.cos(angle + arrowAngle),
      endY - arrowLen * Math.sin(angle + arrowAngle)
    );
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // 绘制金额+时间标签
  _drawAmountLabel(ctx, x, y, amount, unit, time) {
    const amountText = `${amount} ${unit}`;
    const timeText = time || '';
    ctx.save();
    ctx.font = '12px "Courier New", monospace';
    const amountMetrics = ctx.measureText(amountText);
    const timeMetrics = timeText ? ctx.measureText(timeText) : { width: 0 };
    const textWidth = Math.max(amountMetrics.width, timeMetrics.width);
    const padding = 8;
    const width = textWidth + padding * 2;
    const lineHeight = 16;
    const height = timeText ? lineHeight * 2 + 6 : lineHeight + 4;

    // 背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // roundRect polyfill
    const rx = x - width / 2, ry = y - height / 2, r = 5;
    ctx.moveTo(rx + r, ry);
    ctx.lineTo(rx + width - r, ry);
    ctx.quadraticCurveTo(rx + width, ry, rx + width, ry + r);
    ctx.lineTo(rx + width, ry + height - r);
    ctx.quadraticCurveTo(rx + width, ry + height, rx + width - r, ry + height);
    ctx.lineTo(rx + r, ry + height);
    ctx.quadraticCurveTo(rx, ry + height, rx, ry + height - r);
    ctx.lineTo(rx, ry + r);
    ctx.quadraticCurveTo(rx, ry, rx + r, ry);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 金额文字（上行，加粗）
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (timeText) {
      ctx.fillText(amountText, x, y - lineHeight / 2);
      // 时间文字（下行，灰色小字）
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px "Courier New", monospace';
      ctx.fillText(timeText, x, y + lineHeight / 2);
    } else {
      ctx.fillText(amountText, x, y);
    }
    ctx.restore();
  }

  // 设置事件监听
  _setupListeners() {
    // 窗口大小变化
    window.addEventListener('resize', () => {
      this._resize();
      this.render();
    });

    // 点击空白处取消选中
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container || e.target === this.canvas) {
        this.deselectAll();
        if (this.onNodeClick) this.onNodeClick(null);
      }
    });

    // 拖拽
    document.addEventListener('mousemove', (e) => {
      if (!this.dragging) return;
      const containerRect = this.container.getBoundingClientRect();
      this.dragging.x = e.clientX - containerRect.left - this.dragOffsetX;
      this.dragging.y = e.clientY - containerRect.top - this.dragOffsetY;
      this._updateNodePosition(this.dragging);
      this.render();
    });

    document.addEventListener('mouseup', () => {
      if (this.dragging) {
        this.nodeElements[this.dragging.id].style.zIndex = '';
        this.dragging = null;
      }
    });
  }

  // 动画循环
  _animate() {
    if (!this.animating) return;
    this.animationOffset = (this.animationOffset + 0.5) % 12;
    if (this.edges.length > 0) {
      this.render();
    }
    requestAnimationFrame(() => this._animate());
  }

  // 销毁
  destroy() {
    this.animating = false;
    Object.values(this.nodeElements).forEach(el => el.remove());
    this.canvas.remove();
  }
}
