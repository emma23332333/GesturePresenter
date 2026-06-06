class GestureRecognizer {

  constructor() {

    this.mode = "NORMAL";

    this.swipeDetector =
      new SwipeDetector();

    this.holdStart = {};

    this.holdTime = {

      closed_fist: 1000,

      v_gesture: 1000,

      index_finger: 1000,

      open_palm: 2000
    };
  }

  recognize(landmarks) {

    const staticGesture =
      StaticGestureDetector.detect(
        landmarks
      );

    // 优先检测 Swipe
    if (
      staticGesture ===
      "open_palm"
    ) {

      const swipe =
        this.swipeDetector.update(
          landmarks
        );

      if (swipe) {

        return swipe;
      }
    }

    if (!staticGesture) {

      this.holdStart = {};

      return null;
    }

    const now = Date.now();

    if (
      !this.holdStart[
        staticGesture
      ]
    ) {

      this.holdStart[
        staticGesture
      ] = now;

      return null;
    }

    const duration =
      now -
      this.holdStart[
        staticGesture
      ];

    if (
      duration <
      this.holdTime[
        staticGesture
      ]
    ) {

      return null;
    }

    return staticGesture;
  }
}

window.GestureRecognizer =
  GestureRecognizer;