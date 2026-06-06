class PointerTracker {

    static getPointer(
        landmarks,
        width,
        height,
        gesture = null
    ) {

        const tip =
            landmarks[8];

        return {

            gesture,
            
            normalizedX:
                tip.x,

            normalizedY:
                tip.y,

            screenX:
                tip.x * width,

            screenY:
                tip.y * height
        };
    }
}

window.PointerTracker =
    PointerTracker;