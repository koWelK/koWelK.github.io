(function() {
    // ===== 配置参数（你可以随意调整） =====
    var CONFIG = {
        //colors: ['#EE7093', '#fb88bf', '#ff5858', '#ffcccc'], // 粒子 粉色
        colors: ['#70a4ee', '#b7ceff', '#5892ff', '#9587ff'], // 粒子 蓝色
        maxParticles: 300,          // 屏幕上最多粒子数
        particlesPerMove: 3,        // 每次鼠标移动生成几个粒子
        speed: 3,                   // 粒子扩散速度
        sizeMin: 2,                 // 粒子最小尺寸
        sizeMax: 8,                 // 粒子最大尺寸
        lifeDecay: 0.015            // 粒子消失速度（越大消失越快）
    };

    // ===== 初始化 Canvas =====
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';   // 关键：让鼠标事件穿透
    canvas.style.zIndex = '9999';           // 置于顶层但不遮挡操作
    document.body.appendChild(canvas);

    var particles = [];
    var width = window.innerWidth;
    var height = window.innerHeight;

    // 更新画布尺寸
    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // ===== 粒子生成函数 =====
    function createParticles(x, y) {
        var count = CONFIG.particlesPerMove;
        for (var i = 0; i < count; i++) {
            if (particles.length >= CONFIG.maxParticles) {
                particles.shift(); // 移除最旧的粒子
            }
            var angle = Math.random() * Math.PI * 2;
            var speed = Math.random() * CONFIG.speed + 0.5;
            var color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * (CONFIG.sizeMax - CONFIG.sizeMin) + CONFIG.sizeMin,
                life: 1,               // 初始透明度为1
                color: color
            });
        }
    }

    // ===== 鼠标移动监听 =====
    document.addEventListener('mousemove', function(e) {
        createParticles(e.clientX, e.clientY);
    });

    // ===== 动画循环（绘制和更新） =====
    function animate() {
        // 清空画布（透明背景）
        ctx.clearRect(0, 0, width, height);

        // 更新并绘制每个粒子
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            // 更新位置
            p.x += p.vx;
            p.y += p.vy;
            // 减速（让粒子慢慢停下，产生拖尾感）
            p.vx *= 0.98;
            p.vy *= 0.98;
            // 生命值衰减
            p.life -= CONFIG.lifeDecay;

            // 如果生命值小于0，移除粒子
            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }

            // 绘制粒子（带透明效果）
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); // 粒子随生命变小
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;  // 发光效果（可选）
            ctx.shadowBlur = 10;
            ctx.fill();
        }

        // 重置阴影（防止溢出）
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        requestAnimationFrame(animate);
    }

    // 启动动画
    animate();
})();