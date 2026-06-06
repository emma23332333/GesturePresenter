class StaticGestureDetector {

  static detect(landmarks) {

    const finger =
      FingerDetector.getFingerStates(
        landmarks
      );

    const {
      index,
      middle,
      ring,
      pinky
    } = finger;

    // 握拳
    if (
      !index &&
      !middle &&
      !ring &&
      !pinky
    ) {
      return "closed_fist";
    }

    // 五指张开
    if (
      index &&
      middle &&
      ring &&
      pinky
    ) {
      return "open_palm";
    }

    // V字
    if (
      index &&
      middle &&
      !ring &&
      !pinky
    ) {
      return "v_gesture";
    }

    // 仅食指
    if (
      index &&
      !middle &&
      !ring &&
      !pinky
    ) {
      return "index_finger";
    }

    return null;
  }
}

window.StaticGestureDetector =
  StaticGestureDetector;