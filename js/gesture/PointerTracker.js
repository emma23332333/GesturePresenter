class PointerTracker {
    static getPointer(landmarks, width, height, gesture = null) {
        // 如果 landmarks 不存在，返回默认值
        if (!landmarks || !landmarks[8]) {
            return {
                 gesture,
                 normalizedX: 0, 
                 normalizedY: 0, 
                 screenX: 0, 
                 screenY: 0 
            };
        }

        const tip = landmarks[8];
        
        const w = (width && width > 0) ? width : 1;
        const h = (height && height > 0) ? height : 1;

        return {
            gesture,
            normalizedX: tip.x,
            normalizedY: tip.y,
            screenX: tip.x * w, 
            screenY: tip.y * h
        };
    }
}
window.PointerTracker = PointerTracker;