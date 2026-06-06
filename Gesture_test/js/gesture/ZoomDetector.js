class ZoomDetector {

    constructor() {

        this.prevDistance = null;

        this.threshold = 80;

        this.cooldown = 1000;

        this.lastTrigger = 0;
    }

    getDistance(hand1, hand2) {

        const x1 = hand1[0].x;
        const y1 = hand1[0].y;

        const x2 = hand2[0].x;
        const y2 = hand2[0].y;

        return Math.sqrt(
            (x2 - x1) * (x2 - x1) +
            (y2 - y1) * (y2 - y1)
        );
    }

    update(hand1, hand2) {

        const now = Date.now();

        const distance =
            this.getDistance(
                hand1,
                hand2
            );

        if (
            this.prevDistance === null
        ) {

            this.prevDistance =
                distance;

            return null;
        }

        const delta =
            distance -
            this.prevDistance;

        this.prevDistance =
            distance;

        if (
            now -
            this.lastTrigger <
            this.cooldown
        ) {

            return null;
        }

        if (
            delta >
            this.threshold / 1000
        ) {

            this.lastTrigger =
                now;

            return "zoom_in";
        }

        if (
            delta <
            -this.threshold / 1000
        ) {

            this.lastTrigger =
                now;

            return "zoom_out";
        }

        return null;
    }

    reset() {

        this.prevDistance =
            null;
    }
}

window.ZoomDetector =
    ZoomDetector;