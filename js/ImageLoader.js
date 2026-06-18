/**
 * ImageLoader 模块：处理图片上传、预览及画布尺寸同步
 */
const ImageLoader = {
    /**
     * 初始化图片加载器
     * @param {string} inputId - 文件上传的 ID
     * @param {string} imgId - 用于显示图片的标签 ID
     * @param {string} canvasId - 用于批注的标签 ID
     * @param {Function} onLoadedCallback - 图片加载完成后的回调
     */
    init: function(inputId, imgId, canvasId, onLoadedCallback) {
        const input = document.getElementById(inputId);
        const img = document.getElementById(imgId);
        const canvas = document.getElementById(canvasId);

        if (!input || !img || !canvas) {
            console.error("ImageLoader: 找不到指定的 DOM 元素");
            return;
        }

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                img.src = event.target.result;
                
                // 等待图片元数据加载完成，以获取正确尺寸
                img.onload = () => {
                    // 同步批注画布的渲染尺寸与 CSS 显示尺寸一致
                    canvas.width = img.clientWidth;
                    canvas.height = img.clientHeight;
                    
                    console.log(`画布已重置为: ${canvas.width}x${canvas.height}`);
                    
                    if (typeof onLoadedCallback === 'function') {
                        onLoadedCallback();
                    }
                };
            };
            reader.readAsDataURL(file);
        });
    }
};

window.ImageLoader = ImageLoader;