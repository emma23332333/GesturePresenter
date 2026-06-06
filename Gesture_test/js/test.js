// =========================
// DOM
// =========================

const videoElement =
    document.getElementById("webcam");

const canvasElement =
    document.getElementById("output-canvas");

const canvasCtx =
    canvasElement.getContext("2d");

const gestureStatus =
    document.getElementById("gesture-status");

const resultFist =
    document.getElementById("result-fist");

const resultOpen =
    document.getElementById("result-open");

const resultV =
    document.getElementById("result-v");

const resultIndex =
    document.getElementById("result-index");

const resultSwipe =
    document.getElementById("result-swipe");

const logContent =
    document.getElementById("log-content");

// =========================
// Gesture Recognizer
// =========================

const recognizer =
    new GestureRecognizer();

// =========================
// Log
// =========================

function addLog(message) {

    const time =
        new Date()
            .toLocaleTimeString();

    const div =
        document.createElement("div");

    div.textContent =
        `[${time}] ${message}`;

    logContent.prepend(div);

    while (
        logContent.children.length > 20
    ) {
        logContent.removeChild(
            logContent.lastChild
        );
    }
}

// =========================
// MediaPipe Result Callback
// =========================

function onResults(results) {

    canvasCtx.save();

    canvasCtx.clearRect(
        0,
        0,
        canvasElement.width,
        canvasElement.height
    );

    canvasCtx.drawImage(
        results.image,
        0,
        0,
        canvasElement.width,
        canvasElement.height
    );

    if (
        results.multiHandLandmarks &&
        results.multiHandLandmarks.length > 0
    ) {

        const landmarks =
            results.multiHandLandmarks[0];

        // =====================
        // Draw Landmarks
        // =====================

        drawConnectors(
            canvasCtx,
            landmarks,
            HAND_CONNECTIONS,
            {
                color: "#00FF00",
                lineWidth: 3
            }
        );

        drawLandmarks(
            canvasCtx,
            landmarks,
            {
                color: "#FF0000",
                lineWidth: 1,
                radius: 4
            }
        );

        // =====================
        // Finger States
        // =====================

        const finger =
            FingerDetector.getFingerStates(
                landmarks
            );

        const staticGesture =
            StaticGestureDetector.detect(
                landmarks
            );

        const gesture =
            recognizer.recognize(
                landmarks
            );

        // =====================
        // Debug Panel
        // =====================

        resultFist.textContent =
            staticGesture === "closed_fist"
                ? "YES"
                : "NO";

        resultOpen.textContent =
            staticGesture === "open_palm"
                ? "YES"
                : "NO";

        resultV.textContent =
            staticGesture === "v_gesture"
                ? "YES"
                : "NO";

        resultIndex.textContent =
            staticGesture === "index_finger"
                ? "YES"
                : "NO";

        resultSwipe.textContent =
            gesture === "swipe_left" ||
            gesture === "swipe_right"
                ? gesture
                : "--";

        // =====================
        // Gesture Display
        // =====================

        if (gesture) {

            gestureStatus.textContent =
                gesture;

            addLog(
                `Gesture: ${gesture}`
            );
        }
    }

    canvasCtx.restore();
}

// =========================
// MediaPipe Hands
// =========================

const hands =
    new Hands({

        locateFile: (file) => {

            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

hands.setOptions({

    maxNumHands: 1,

    modelComplexity: 1,

    minDetectionConfidence: 0.7,

    minTrackingConfidence: 0.7
});

hands.onResults(onResults);

// =========================
// Camera
// =========================

const camera =
    new Camera(
        videoElement,
        {

            onFrame: async () => {

                await hands.send({

                    image: videoElement
                });
            },

            width: 960,

            height: 720
        }
    );

// =========================
// Start
// =========================

camera.start();

console.log(
    "GesturePresenter Started"
);

addLog(
    "Camera Started"
);