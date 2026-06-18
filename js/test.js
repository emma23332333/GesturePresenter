import { AnnotationModule } from './AnnotationModule.js';
import { SlideController } from './SlideController.js';

export function initApp(AnnotationModule) {
    const videoElement = document.getElementById("webcam");
    const canvasElement = document.getElementById("output-canvas");
    const canvasCtx = canvasElement.getContext("2d");
    const gestureStatus = document.getElementById("gesture-status");
    const fileNameText = document.getElementById("file-name");
    const resultFist = document.getElementById("result-fist");
    const resultOpen = document.getElementById("result-open");
    const resultV = document.getElementById("result-v");
    const resultIndex = document.getElementById("result-index");
    const resultThree = document.getElementById("result-three");
    const resultSwipe = document.getElementById("result-swipe");
    const resultZoom = document.getElementById("result-zoom");
    const canvasContainer = document.getElementById("canvas-container");
    const displayImage = document.getElementById("display-image");
    const annoCanvas = document.getElementById("annotation-canvas");

    function setText(el, text) {
        if (el) {
            el.textContent = text;
        }
    }

    const annoModule = new AnnotationModule(annoCanvas, canvasContainer);
    const slideController = new SlideController(canvasContainer, displayImage, {
        canControl: () => !annoModule.isAnnotating
    });
    slideController.bindEvents();

    // 辅助：更新画面上的模式与颜色指示器
    function setModeIndicator(mode, color) {
        const modeText = document.getElementById('mode-indicator-text');
        const swatch = document.getElementById('mode-indicator-color');
        const rightModeText = document.getElementById('mode-text');
        if (modeText) modeText.innerText = mode;
        if (rightModeText) rightModeText.innerText = mode;
        if (swatch) {
            if (mode === 'NORMAL') {
                swatch.style.display = 'none';
            } else if (color) {
                swatch.style.display = 'block';
                swatch.style.background = color;
                swatch.style.opacity = 1;
            } else {
                swatch.style.display = 'block';
                swatch.style.opacity = 0.2;
            }
        }
    }

    // 初始指示
    setModeIndicator('NORMAL', null);

    let lastOpenPalmTime = 0;
    let dualHandExitTime = 0;
    let annotationIndexFingerStableFrames = 0;
    const annotationStableThreshold = 3;

    function addLog(message) {
        // 日志已移除，保留空函数以避免调用点影响功能
    }

    function setFileName(name) {
        if (fileNameText) {
            fileNameText.textContent = name || '未加载';
        }
        const toolbarName = document.getElementById('toolbar-file-name');
        if (toolbarName) {
            if (name) {
                toolbarName.textContent = name;
            } else {
                toolbarName.textContent = '';
            }
        }
    }

    // 帮助面板事件监听
    const helpModal = document.getElementById('help-modal');
    const helpBtn = document.getElementById('help-btn');
    const helpClose = document.getElementById('help-close');

    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            if (helpModal) {
                helpModal.classList.add('show');
            }
        });
    }

    if (helpClose) {
        helpClose.addEventListener('click', () => {
            if (helpModal) {
                helpModal.classList.remove('show');
            }
        });
    }

    // 点击模态框背景关闭
    if (helpModal) {
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.classList.remove('show');
            }
        });
    }

    // 图片 / PDF 上传
    document.getElementById("image-upload").addEventListener("change", async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const pdfFiles = files.filter(f => f.type === 'application/pdf');
        const imageFiles = files.filter(f => f.type.startsWith('image/'));

        if (pdfFiles.length > 0) {
            const pdfFile = pdfFiles[0];
            setFileName(pdfFile.name);
            addLog(`正在加载 PDF: ${pdfFile.name}`);
            try {
                const urls = await renderPdfToImages(pdfFile);
                if (urls.length > 0) {
                    slideController.loadImages(urls);
                    addLog(`PDF 已加载，共 ${urls.length} 页`);
                } else {
                    addLog("PDF 渲染失败或页面为空");
                }
            } catch (err) {
                addLog(`PDF 加载错误: ${err.message}`);
            }
        } else if (imageFiles.length > 0) {
            setFileName(imageFiles[0].name);
            slideController.loadImages(imageFiles);
            addLog(`已加载 ${imageFiles.length} 张图片`);
        } else {
            addLog("不支持的文件格式");
        }
    });

    async function renderPdfToImages(file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const totalPages = pdf.numPages;
        const pageUrls = [];
        const offscreenCanvas = document.createElement('canvas');
        const ctx = offscreenCanvas.getContext('2d');
        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            offscreenCanvas.width = viewport.width;
            offscreenCanvas.height = viewport.height;
            await page.render({ canvasContext: ctx, viewport: viewport }).promise;
            const dataUrl = offscreenCanvas.toDataURL('image/jpeg', 0.9);
            pageUrls.push(dataUrl);
        }
        return pageUrls;
    }

    // 手势事件
    const recognizer = new GestureRecognizer();
    const zoomDetector = new ZoomDetector();

    GestureEvents.on(GestureType.V_GESTURE, () => {
        if (!annoModule.isAnnotating) {
            annoModule.toggleAnnotation(true, 'red');
            setModeIndicator('ANNOTATION', 'red');
            addLog("模式切换: 批注模式 (当前颜色: 红色)");
        } else {
            annoModule.setColor('blue');
            setModeIndicator('ANNOTATION', 'blue');
            addLog("颜色切换: 蓝色");
        }
    });

    GestureEvents.on(GestureType.CLOSED_FIST, () => {
        annoModule.toggleAnnotation(false);
        setModeIndicator('NORMAL', null);
        addLog("模式切换: 普通模式");
    });

    GestureEvents.on(GestureType.THREE_FINGER, () => {
        if (annoModule.isAnnotating) {
            annoModule.setColor('green');
            setModeIndicator('ANNOTATION', 'green');
            addLog("颜色切换: 绿色");
        }
    });

    GestureEvents.on(GestureType.OPEN_PALM, () => {
        annoModule.clear();
        addLog("操作: 清屏");
    });

    GestureEvents.on(GestureType.POINTER_MOVE, (ptr) => {
        annoModule.addPoint(ptr);
    });

    // MediaPipe 回调
    function onResults(results) {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const handsList = results.multiHandLandmarks;

            if (handsList.length === 2) {
                const hand1 = handsList[0];
                const hand2 = handsList[1];
                const gesture1 = StaticGestureDetector.detect(hand1);
                const gesture2 = StaticGestureDetector.detect(hand2);

                if (gesture1 === "open_palm" && gesture2 === "open_palm") {
                    if (!annoModule.isAnnotating) {
                        slideController.updateDualHands(hand1, hand2);
                        const zoom = zoomDetector.update(hand1, hand2);
                        if (zoom) {
                            setText(gestureStatus, zoom);
                            setText(resultZoom, zoom);
                            addLog(`Gesture: ${zoom}`);
                        }
                    }
                    drawConnectors(canvasCtx, hand1, HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 3 });
                    drawLandmarks(canvasCtx, hand1, { color: "#FF0000", radius: 2 });
                    drawConnectors(canvasCtx, hand2, HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 3 });
                    drawLandmarks(canvasCtx, hand2, { color: "#FF0000", radius: 2 });
                    dualHandExitTime = 0;
                    canvasCtx.restore();
                    return;
                } else {
                    slideController.resetDualHands();
                    dualHandExitTime = Date.now();
                    slideController.setSwipeCooldown(500);
                }
            } else {
                slideController.resetDualHands();
            }

            zoomDetector.reset();
            setText(resultZoom, "--");

            const landmarks = handsList[0];
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 3 });
            drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 1, radius: 2 });

            const staticGesture = StaticGestureDetector.detect(landmarks);
            const gesture = recognizer.recognize(landmarks);
            const rect = canvasContainer.getBoundingClientRect();
            const pointer = PointerTracker.getPointer(landmarks, rect.width, rect.height, staticGesture);

            if (annoModule.isAnnotating) {
                if (staticGesture === "index_finger") {
                    annotationIndexFingerStableFrames++;
                    if (annotationIndexFingerStableFrames >= annotationStableThreshold) {
                        GestureEvents.emit(GestureType.POINTER_MOVE, {
                            screenX: pointer.screenX + rect.left,
                            screenY: pointer.screenY + rect.top
                        });
                    }
                } else {
                    annotationIndexFingerStableFrames = 0;
                    annoModule.endStroke();
                }
            } else {
                annotationIndexFingerStableFrames = 0;
                if (staticGesture === "index_finger") {
                    annoModule.updateLaser({
                        screenX: pointer.screenX + rect.left,
                        screenY: pointer.screenY + rect.top
                    });
                    GestureEvents.emit(GestureType.POINTER_MOVE, {
                        screenX: pointer.screenX + rect.left,
                        screenY: pointer.screenY + rect.top
                    });
                }
            }

            if (staticGesture === "open_palm") {
                if (gesture === "swipe_left" || gesture === "swipe_right") {
                    if (dualHandExitTime && Date.now() - dualHandExitTime < 500) {
                        setText(resultSwipe, "--");
                        addLog(`滑动已屏蔽（冷却中）`);
                    } else {
                        setText(gestureStatus, gesture);
                        setText(resultSwipe, gesture);
                        addLog(`Gesture: ${gesture}`);
                        GestureEvents.emit(gesture);
                    }
                } else {
                    setText(resultSwipe, "--");
                }
            } else {
                setText(resultSwipe, "--");
            }

            if (gesture === "three_finger") {
                GestureEvents.emit(GestureType.THREE_FINGER);
            } else if (gesture && gesture !== "swipe_left" && gesture !== "swipe_right") {
                GestureEvents.emit(gesture);
            }

            setText(resultFist, staticGesture === "closed_fist" ? "YES" : "NO");
            setText(resultOpen, staticGesture === "open_palm" ? "YES" : "NO");
            setText(resultV, staticGesture === "v_gesture" ? "YES" : "NO");
            setText(resultIndex, staticGesture === "index_finger" ? "YES" : "NO");
            setText(resultThree, staticGesture === "three_finger" ? "YES" : "NO");

            if (staticGesture) {
                setText(gestureStatus, staticGesture);
            }
        } else {
            slideController.resetDualHands();
            dualHandExitTime = Date.now();
            slideController.setSwipeCooldown(500);
        }
        canvasCtx.restore();
    }

    const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });
    hands.onResults(onResults);

    const camera = new Camera(videoElement, {
        onFrame: async () => { await hands.send({ image: videoElement }); },
        width: 960, height: 720
    });
    camera.start();
}