class FingerDetector {

  static getFingerStates(landmarks) {

    return {

      thumb:
        landmarks[4].x > landmarks[3].x,

      index:
        landmarks[8].y < landmarks[6].y,

      middle:
        landmarks[12].y < landmarks[10].y,

      ring:
        landmarks[16].y < landmarks[14].y,

      pinky:
        landmarks[20].y < landmarks[18].y
    };
  }
}

window.FingerDetector = FingerDetector;