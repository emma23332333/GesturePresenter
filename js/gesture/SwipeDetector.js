class SwipeDetector {

  constructor() {

    this.history = [];

    this.maxHistory = 12;

    this.cooldown = 1000;

    this.lastTrigger = 0;
  }

  update(landmarks) {

    const now = Date.now();

    const palm = {

      x:
        (landmarks[0].x +
          landmarks[9].x) / 2,

      y:
        (landmarks[0].y +
          landmarks[9].y) / 2
    };

    this.history.push({

      x: palm.x,
      y: palm.y,
      time: now
    });

    if (
      this.history.length >
      this.maxHistory
    ) {
      this.history.shift();
    }

    if (
      now - this.lastTrigger <
      this.cooldown
    ) {
      return null;
    }

    if (
      this.history.length < 8
    ) {
      return null;
    }

    const first =
      this.history[0];

    const last =
      this.history[
        this.history.length - 1
      ];

    const dx =
      last.x - first.x;

    const dy =
      Math.abs(
        last.y - first.y
      );

    // 要求水平移动明显
    if (
      dx > 0.12 &&
      dy < 0.08
    ) {

      this.lastTrigger = now;

      return "swipe_right";
    }

    if (
      dx < -0.12 &&
      dy < 0.08
    ) {

      this.lastTrigger = now;

      return "swipe_left";
    }

    return null;
  }
}

window.SwipeDetector =
  SwipeDetector;