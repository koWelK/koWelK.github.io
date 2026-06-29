(function() {
    // 获取 DOM 元素
    var overlay = document.getElementById('loader-overlay');
    var pageContent = document.getElementById('pageContent');
    var progressFill = document.getElementById('progressFill');
    var progressText = document.getElementById('progressText');

    

    var isRevealed = false;        // 是否已显示内容
    var startTime = Date.now();    // 记录页面加载开始时间
    var progress = 0;
    var intervalId = null;
    var timeoutId = null;

    // ===== 更新进度条 =====
    function updateProgress(value) {
        progress = Math.min(value, 100);
        progressFill.style.width = progress + '%';
        progressText.textContent = Math.round(progress) + '%';
    }

    // ===== 显示页面（强制至少 1 秒） =====
    function revealPage() {
        if (isRevealed) return;
        isRevealed = true;

        // 清除所有定时器
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }

        // 计算已耗时
        var elapsed = Date.now() - startTime;
        var remaining = Math.max(0, 500 - elapsed); // 至少显示 1 秒

        // 如果不足 1 秒，延迟到满 1 秒再显示
        setTimeout(function() {
            // 强制进度到 100%
            updateProgress(100);

            // 短暂延迟后隐藏加载遮罩，显示内容
            setTimeout(function() {
                overlay.classList.add('hide');
                pageContent.classList.add('show');
            }, 300);
        }, remaining);
    }

    // ===== 模拟加载进度（0% → 80%，在 6 秒内完成） =====
    function startFakeProgress() {
        var fakeStart = Date.now();
        var duration = 6000; // 6 秒走到 80%
        intervalId = setInterval(function() {
            var elapsed = Date.now() - fakeStart;
            var raw = (elapsed / duration) * 80;
            var current = Math.min(raw, 80);
            updateProgress(current);
            if (current >= 80) {
                clearInterval(intervalId);
                intervalId = null;
            }
        }, 100);
    }

    // ===== 1. 页面加载完成（所有资源） =====
    window.addEventListener('load', function() {
        revealPage();
    });

    // ===== 2. 超时保底（15 秒） =====
    timeoutId = setTimeout(function() {
        revealPage();
    }, 15000);

    // ===== 启动模拟进度 =====
    startFakeProgress();
})();