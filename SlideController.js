export class SlideController {
    constructor(container, imageElement, options = {}) {
        this.container = container;
        this.image = imageElement;
        this.images = [];
        this.currentIndex = 0;
        this.scale = 1;
        this.minScale = 1;
        this.maxScale = 3;
        this.translateX = 0;
        this.translateY = 0;

        this.lastDualDistance = null;
        this.lastDualCenter = null;
        this.isDualHandActive = false;

        this.zoomStep = options.zoomStep || 0.05;
        this.panSensitivity = options.panSensitivity || 3.5;
        this.canControl = typeof options.canControl === 'function' ? options.canControl : () => true;

        this.zoomPercentEl = document.getElementById('zoom-percent');
        this.pageIndicatorEl = document.getElementById('page-indicator');

        this.swipeCooldown = false;
        this._cooldownTimer = null;

        this._onSwipeLeft = this._onSwipeLeft.bind(this);
        this._onSwipeRight = this._onSwipeRight.bind(this);
        this._onZoomIn = this._onZoomIn.bind(this);
        this._onZoomOut = this._onZoomOut.bind(this);

        // 移除图片原有的 CSS 尺寸限制，完全由 transform 控制
        this.image.style.maxWidth = 'none';
        this.image.style.maxHeight = 'none';
        this.image.style.position = 'absolute';
        this.image.style.top = '0';
        this.image.style.left = '0';

        this.image.style.transformOrigin = '0 0';
        this._updateTransform();
        this._updateUI();
    }

    loadImages(files) {
        this.images = [];
        const promises = [];
        for (let file of files) {
            if (file instanceof File) {
                promises.push(new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(file);
                }));
            } else if (typeof file === 'string') {
                promises.push(Promise.resolve(file));
            }
        }
        Promise.all(promises).then(urls => {
            this.images = urls;
            if (this.images.length > 0) {
                this.currentIndex = 0;
                this.resetView();
                this._showCurrentImage();
            }
        });
    }

    addImage(url) {
        this.images.push(url);
        if (this.images.length === 1) {
            this.currentIndex = 0;
            this.resetView();
            this._showCurrentImage();
        }
        this._updateUI();
    }

    next() {
        if (this.currentIndex < this.images.length - 1) {
            this.currentIndex++;
            this.resetView();
            this._showCurrentImage();
        }
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.resetView();
            this._showCurrentImage();
        }
    }

    resetView() {
        this.scale = this.minScale;
        this.translateX = 0;
        this.translateY = 0;
        this._updateTransform();
    }

    zoomIn(step = this.zoomStep) {
        const newScale = Math.min(this.maxScale, this.scale + step);
        this._applyScale(newScale);
    }

    zoomOut(step = this.zoomStep) {
        const newScale = Math.max(this.minScale, this.scale - step);
        this._applyScale(newScale);
    }

    _applyScale(newScale) {
        if (newScale === this.scale) return;
        const rect = this.container.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const ratio = newScale / this.scale;
        this.translateX = cx - ratio * (cx - this.translateX);
        this.translateY = cy - ratio * (cy - this.translateY);
        this.scale = newScale;
        // 移除边界限制：不再调用 _constrainTranslate
        this._updateTransform();
        this._updateUI();
    }

    pan(dx, dy) {
        // 缩放比例小于等于 minScale 时不响应平移（图片已完整显示）
        if (this.scale <= this.minScale) return;
        this.translateX += dx * this.panSensitivity;
        this.translateY += dy * this.panSensitivity;
        // 移除边界限制：不再调用 _constrainTranslate
        this._updateTransform();
    }

    // 彻底移除平移边界限制，允许图片自由移动到任意位置
    _constrainTranslate() {
        // 空实现，不做任何限制
    }

    _updateTransform() {
        this.image.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    }

    _showCurrentImage() {
        if (this.images.length === 0) return;
        const url = this.images[this.currentIndex];
        const img = this.image;
        img.src = url;

        if (img.complete && img.naturalWidth !== 0) {
            this._onImageLoaded();
        } else {
            img.onload = () => this._onImageLoaded();
        }
    }

    _onImageLoaded() {
        this._calculateMinScale();
        if (this.scale < this.minScale) {
            this.scale = this.minScale;
            this.translateX = 0;
            this.translateY = 0;
            this._updateTransform();
        }
        if (this.scale > this.maxScale) {
            this.scale = this.maxScale;
            this._updateTransform();
        }
        this._updateUI();
    }

    _calculateMinScale() {
        const rect = this.container.getBoundingClientRect();
        const imgW = this.image.naturalWidth;
        const imgH = this.image.naturalHeight;
        if (!imgW || !imgH) return;
        this.minScale = Math.min(rect.width / imgW, rect.height / imgH);
    }

    _updateUI() {
        if (this.zoomPercentEl) {
            this.zoomPercentEl.textContent = Math.round(this.scale * 100) + '%';
        }
        if (this.pageIndicatorEl) {
            const total = this.images.length;
            const current = total > 0 ? this.currentIndex + 1 : 0;
            this.pageIndicatorEl.textContent = `${current} / ${total}`;
        }
    }

    updateDualHands(hand1, hand2) {
        if (!hand1 || !hand2) {
            this.isDualHandActive = false;
            this.lastDualDistance = null;
            return;
        }
        this.isDualHandActive = true;

        const wrist1 = hand1[0];
        const wrist2 = hand2[0];
        const cx = (wrist1.x + wrist2.x) / 2;
        const cy = (wrist1.y + wrist2.y) / 2;
        const dist = Math.hypot(wrist1.x - wrist2.x, wrist1.y - wrist2.y);

        if (this.lastDualDistance === null) {
            this.lastDualDistance = dist;
            this.lastDualCenter = { x: cx, y: cy };
            return;
        }

        const ratio = dist / this.lastDualDistance;
        const containerRect = this.container.getBoundingClientRect();
        const containerW = containerRect.width;
        const containerH = containerRect.height;

        if (Math.abs(ratio - 1) > 0.015) {
            let newScale = this.scale * ratio;
            newScale = Math.max(this.minScale, Math.min(this.maxScale, newScale));
            const originX = cx * containerW;
            const originY = cy * containerH;
            const scaleRatio = newScale / this.scale;
            this.translateX = originX - scaleRatio * (originX - this.translateX);
            this.translateY = originY - scaleRatio * (originY - this.translateY);
            this.scale = newScale;
            // 不限制平移，直接更新
            this._updateTransform();
            this._updateUI();
            this.lastDualDistance = dist;
            this.lastDualCenter = { x: cx, y: cy };
        } else {
            const dx = (cx - this.lastDualCenter.x) * containerW;
            const dy = (cy - this.lastDualCenter.y) * containerH;
            this.pan(dx, dy);
            this.lastDualCenter = { x: cx, y: cy };
            this.lastDualDistance = dist;
        }
    }

    resetDualHands() {
        this.isDualHandActive = false;
        this.lastDualDistance = null;
        this.lastDualCenter = null;
    }

    bindEvents() {
        GestureEvents.on(GestureType.SWIPE_LEFT, this._onSwipeLeft);
        GestureEvents.on(GestureType.SWIPE_RIGHT, this._onSwipeRight);
        GestureEvents.on(GestureType.ZOOM_IN, this._onZoomIn);
        GestureEvents.on(GestureType.ZOOM_OUT, this._onZoomOut);
    }

    _onSwipeLeft() {
        if (this.swipeCooldown || !this.canControl()) return;
        this.prev();
    }

    _onSwipeRight() {
        if (this.swipeCooldown || !this.canControl()) return;
        this.next();
    }

    setSwipeCooldown(duration) {
        this.swipeCooldown = true;
        clearTimeout(this._cooldownTimer);
        this._cooldownTimer = setTimeout(() => {
            this.swipeCooldown = false;
        }, duration);
    }

    _onZoomIn() {
        if (!this.canControl()) return;
        this.zoomIn();
    }

    _onZoomOut() {
        if (!this.canControl()) return;
        this.zoomOut();
    }
}