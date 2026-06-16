export class AnnotationModule {
    constructor(canvas, container) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.container = container;
        
        this.isAnnotating = false;
        this.currentStrokes = [];
        this.activeColor = 'red';
        this.minPointDistance = 10; // 最小距离阈值，移动小于此值不记录点，减少噪点
        
        // 初始化尺寸
        this.resize();
        
        // 自动绑定窗口大小变化
        window.addEventListener('resize', () => this.resize());

        this.targetPoint = null;         
        this.laserDisplayPoint = null;   
        this.animate();        
    }

    // 统一的尺寸同步逻辑
    resize() {
        // 使用 container 的尺寸作为基准
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;
    }

    toggleAnnotation(enabled, color = null) {
        this.isAnnotating = enabled;
        this.canvas.style.pointerEvents = enabled ? 'auto' : 'none';
        if (color) {
            this.setColor(color);
        }
        if (!enabled) {
            this.endStroke();
        }
    }

    setColor(color) {
        // 在切换颜色前把当前笔画标记为结束，保证已绘制的笔画保持原色
        this.endStroke();
        this.activeColor = color;
    }

    clear() {
        this.currentStrokes = [];
    }

    addPoint(ptr) {
        if (!this.isAnnotating) 
            return;
        
        const rect = this.container.getBoundingClientRect();
        const localX = ptr.screenX - rect.left;
        const localY = ptr.screenY - rect.top;

        if (isNaN(localX) || isNaN(localY)) 
            return;

        if (this.currentStrokes.length === 0 || this.currentStrokes[this.currentStrokes.length - 1].finished) {
            this.currentStrokes.push({ color: this.activeColor, points: [], finished: false });
        }

        // 抖动过滤：如果与上一个点距离过小，则跳过，减少噪点
        const curStroke = this.currentStrokes[this.currentStrokes.length - 1];
        const pts = curStroke.points;
        if (pts.length > 0) {
            const last = pts[pts.length - 1];
            const dx = localX - last.x;
            const dy = localY - last.y;
            const dist2 = dx * dx + dy * dy;
            if (dist2 < this.minPointDistance * this.minPointDistance) {
                return;
            }
        }
        
        this.currentStrokes[this.currentStrokes.length - 1].points.push({ x: localX, y: localY });
    }

    endStroke() {
        if (this.currentStrokes.length === 0) return;
        const last = this.currentStrokes[this.currentStrokes.length - 1];
        if (!last.finished) last.finished = true;
    }

    drawPalette() {
        ['red', 'blue', 'green'].forEach((c, i) => {
            this.ctx.fillStyle = c;
            this.ctx.beginPath();
            this.ctx.arc(50, 100 + i * 60, 20, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = "white";
            this.ctx.stroke();
        });
    }

    // 激光点
    updateLaser(ptr) {
        if (this.isAnnotating) {
            this.laserPoint = null;
            return;
        }
        const rect = this.container.getBoundingClientRect();
        this.targetPoint = { 
            x: ptr.screenX - rect.left, 
            y: ptr.screenY - rect.top 
        };
    }

    // 绘制逻辑
    drawLaser() {
        if (!this.laserDisplayPoint)
             return;
        
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(this.laserDisplayPoint.x, this.laserDisplayPoint.y, 10, 0, Math.PI * 2);
        this.ctx.fillStyle = "#c00000"; 
        this.ctx.fill();
        this.ctx.strokeStyle = "white";
        this.ctx.lineWidth = 3; 
        this.ctx.stroke();
        this.ctx.restore();
    }

    animate() {
         this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

         // 平滑处理
         if (!this.isAnnotating && this.targetPoint) {
             if (!this.laserDisplayPoint) {
             this.laserDisplayPoint = { ...this.targetPoint };
            } else {
                 // 平滑系数
                 this.laserDisplayPoint.x += (this.targetPoint.x - this.laserDisplayPoint.x) * 0.2;
                 this.laserDisplayPoint.y += (this.targetPoint.y - this.laserDisplayPoint.y) * 0.2;
            }
             this.drawLaser();
        } else {
             this.laserDisplayPoint = null; // 无目标时重置
        }
         if (this.isAnnotating) {
             this.drawPalette();
             this.currentStrokes.forEach(stroke => {
                 this.ctx.strokeStyle = stroke.color;
                 this.ctx.lineWidth = 5;
                 this.ctx.beginPath();
                 const pts = stroke.points;
                 if (pts.length === 1) {
                     this.ctx.moveTo(pts[0].x, pts[0].y);
                     this.ctx.lineTo(pts[0].x, pts[0].y);
                 } else if (pts.length === 2) {
                     this.ctx.moveTo(pts[0].x, pts[0].y);
                     this.ctx.lineTo(pts[1].x, pts[1].y);
                 } else if (pts.length > 2) {
                     this.ctx.moveTo(pts[0].x, pts[0].y);
                     for (let i = 1; i < pts.length - 1; i++) {
                         const midX = (pts[i].x + pts[i + 1].x) / 2;
                         const midY = (pts[i].y + pts[i + 1].y) / 2;
                         this.ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
                     }
                     const last = pts[pts.length - 1];
                     this.ctx.lineTo(last.x, last.y);
                 }
                 this.ctx.stroke();
             });
         }
    requestAnimationFrame(() => this.animate());
    }
}