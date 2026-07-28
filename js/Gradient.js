// ============================================================
//  坡道纵曲线计算器 · 核心逻辑
// ============================================================

(function() {
    'use strict';

    // ---- DOM 引用 ----
    var inputLength = document.getElementById('inputLength');
    var inputHeight = document.getElementById('inputHeight');
    var inputCurve = document.getElementById('inputCurve');
    var calcBtn = document.getElementById('calcBtn');
    var resetBtn = document.getElementById('resetBtn');
    var errorMsg = document.getElementById('errorMsg');
    var resultArea = document.getElementById('resultArea');
    var summaryCards = document.getElementById('summaryCards');
    var tableBody = document.getElementById('tableBody');
    var canvas = document.getElementById('chartCanvas');

    // ---- 工具函数 ----
    function showError(text) {
        errorMsg.textContent = text;
        errorMsg.classList.add('show');
        resultArea.classList.remove('visible');
    }

    function hideError() {
        errorMsg.textContent = '';
        errorMsg.classList.remove('show');
    }

    function fmt(v, d) {
        d = d || 4;
        return Number(v.toFixed(d));
    }

    function fmtPercent(v) {
        return (v * 100).toFixed(2) + '%';
    }

    function fmtAngle(v) {
        return (Math.atan(v) * 180 / Math.PI).toFixed(2) + '°';
    }

    // ---- 主计算 ----
    function calculate() {
        hideError();
        resultArea.classList.remove('visible');

        var L = parseFloat(inputLength.value);
        var H = parseFloat(inputHeight.value);
        var l = parseFloat(inputCurve.value);

        if (isNaN(L) || L <= 0) {
            showError('⚠️ 坡道总长度 L 必须大于 0');
            return;
        }
        if (isNaN(H) || H < 0) {
            showError('⚠️ 高度差 H 不能为负数');
            return;
        }
        if (isNaN(l) || l < 0) {
            showError('⚠️ 纵曲线长度 l 不能为负数');
            return;
        }
        if (l >= L / 2) {
            if (l === L / 2) {
                // 允许，中间直线段长度为0
            } else {
                showError('⚠️ 纵曲线长度 l 必须小于总长度的一半（l < L/2），否则中间直线段不存在');
                return;
            }
        }
        if (l > L) {
            showError('⚠️ 纵曲线长度 l 不能大于总长度 L');
            return;
        }

        var denominator = L - l;
        if (denominator <= 0) {
            showError('⚠️ L - l 必须大于 0，请调整参数');
            return;
        }
        var i = H / denominator;

        // ---- 各段数据 ----
        var h1 = i * l / 2;
        var len2 = L - 2 * l;
        var h2 = i * len2;
        var h3 = i * l / 2;
        var p2_end = h1 + h2;

        var points = [
            { x: 0, y: 0, label: '起点' },
            { x: l, y: h1, label: '纵曲线终点' },
            { x: L - l, y: p2_end, label: '直线段终点' },
            { x: L, y: H, label: '终点' },
        ];

        renderSummary(i, L, H, l);
        renderTable(l, len2, h1, h2, h3, i, H);
        drawChart(L, H, l, i, points);

        resultArea.classList.add('visible');
    }

    // ---- 渲染摘要 ----
    function renderSummary(i, L, H, l) {
        summaryCards.innerHTML = [
            '<div class="summary-card highlight">',
            '  <div class="value">' + fmt(i, 5) + '</div>',
            '  <div class="label">坡度 (小数)</div>',
            '</div>',
            '<div class="summary-card">',
            '  <div class="value">' + fmtPercent(i) + '</div>',
            '  <div class="label">坡度百分比</div>',
            '</div>',
            '<div class="summary-card">',
            '  <div class="value">' + fmtAngle(i) + '</div>',
            '  <div class="label">坡度角度</div>',
            '</div>',
            '<div class="summary-card">',
            '  <div class="value">' + fmt(l, 2) + ' m</div>',
            '  <div class="label">单段纵曲线长度</div>',
            '</div>',
            '<div class="summary-card">',
            '  <div class="value">' + fmt(L - 2 * l, 2) + ' m</div>',
            '  <div class="label">中间直线段长度</div>',
            '</div>',
            '<div class="summary-card">',
            '  <div class="value">' + fmt(H, 3) + ' m</div>',
            '  <div class="label">总高度差</div>',
            '</div>'
        ].join('');
    }

    // ---- 渲染表格 ----
    function renderTable(l, len2, h1, h2, h3, i, H) {
        var rows = [
            { name: '前纵曲线', color: 'green', len: l, dh: h1, startH: 0, endH: h1, slope: '0 → ' + fmt(i, 4) },
            { name: '中间直线段', color: 'blue', len: len2, dh: h2, startH: h1, endH: h1 + h2, slope: fmt(i, 4) },
            { name: '后纵曲线', color: 'red', len: l, dh: h3, startH: h1 + h2, endH: H, slope: fmt(i, 4) + ' → 0' },
        ];

        var html = '';
        rows.forEach(function(r) {
            html += [
                '<tr>',
                '  <td><span class="color-dot ' + r.color + '"></span>' + r.name + '</td>',
                '  <td>' + fmt(r.len, 3) + '</td>',
                '  <td>' + fmt(r.dh, 4) + '</td>',
                '  <td>' + fmt(r.startH, 4) + '</td>',
                '  <td>' + fmt(r.endH, 4) + '</td>',
                '  <td>' + r.slope + '</td>',
                '</tr>'
            ].join('');
        });
        tableBody.innerHTML = html;
    }

    // ---- 绘制图表 ----
    function drawChart(L, H, l, i, points) {
        var ctx = canvas.getContext('2d');
        var W = canvas.width;
        var H_canvas = canvas.height;

        var margin = { top: 32, bottom: 40, left: 56, right: 32 };
        var plotW = W - margin.left - margin.right;
        var plotH = H_canvas - margin.top - margin.bottom;

        var xMin = 0,
            xMax = L;
        var yMin = Math.min(0, -H * 0.08);
        var yMax = Math.max(H, H * 1.08);

        var xScale = plotW / (xMax - xMin || 1);
        var yScale = plotH / (yMax - yMin || 1);

        function toPixelX(x) { return margin.left + (x - xMin) * xScale; }

        function toPixelY(y) { return margin.top + plotH - (y - yMin) * yScale; }

        function getHeight(x) {
            if (x < 0) return 0;
            if (x <= l) {
                return (i / (2 * l)) * x * x;
            } else if (x <= L - l) {
                return i * l / 2 + i * (x - l);
            } else if (x <= L) {
                var t = x - (L - l);
                return i * l / 2 + i * (L - 2 * l) + i * t - (i / (2 * l)) * t * t;
            } else {
                return H;
            }
        }

        ctx.clearRect(0, 0, W, H_canvas);

        // ---- 网格 ----
        ctx.save();
        ctx.strokeStyle = '#eef3f8';
        ctx.lineWidth = 0.8;
        var ySteps = 6;
        for (var k = 0; k <= ySteps; k++) {
            var y = yMin + (yMax - yMin) * (k / ySteps);
            var py = toPixelY(y);
            ctx.beginPath();
            ctx.moveTo(margin.left, py);
            ctx.lineTo(margin.left + plotW, py);
            ctx.stroke();
            ctx.fillStyle = '#5b7b96';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(fmt(y, 2), margin.left - 10, py);
        }
        var xSteps = 8;
        for (var ks = 0; ks <= xSteps; ks++) {
            var x = xMin + (xMax - xMin) * (ks / xSteps);
            var px = toPixelX(x);
            ctx.beginPath();
            ctx.moveTo(px, margin.top);
            ctx.lineTo(px, margin.top + plotH);
            ctx.stroke();
            ctx.fillStyle = '#5b7b96';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(fmt(x, 1), px, margin.top + plotH + 6);
        }
        ctx.fillStyle = '#3d5d7a';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('水平距离 (m)', margin.left + plotW / 2, H_canvas - 10);
        ctx.save();
        ctx.translate(16, margin.top + plotH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('高程 (m)', 0, 0);
        ctx.restore();

        // ---- 分段填充 ----
        var segments = [
            { start: 0, end: l, color: '#27ae60' },
            { start: l, end: L - l, color: '#2980b9' },
            { start: L - l, end: L, color: '#e74c3c' },
        ];

        segments.forEach(function(seg) {
            if (seg.start >= seg.end) return;
            var steps = Math.max(60, Math.ceil((seg.end - seg.start) * 4));
            ctx.beginPath();
            for (var s = 0; s <= steps; s++) {
                var t = s / steps;
                var x = seg.start + (seg.end - seg.start) * t;
                var y = getHeight(x);
                var px = toPixelX(x);
                var py = toPixelY(y);
                if (s === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.lineTo(toPixelX(seg.end), toPixelY(0));
            ctx.lineTo(toPixelX(seg.start), toPixelY(0));
            ctx.closePath();
            ctx.fillStyle = seg.color + '18';
            ctx.fill();
        });

        // ---- 曲线描线 ----
        segments.forEach(function(seg) {
            if (seg.start >= seg.end) return;
            var steps = Math.max(80, Math.ceil((seg.end - seg.start) * 6));
            ctx.beginPath();
            for (var s = 0; s <= steps; s++) {
                var t = s / steps;
                var x = seg.start + (seg.end - seg.start) * t;
                var y = getHeight(x);
                var px = toPixelX(x);
                var py = toPixelY(y);
                if (s === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = seg.color;
            ctx.lineWidth = 3.2;
            ctx.shadowColor = 'rgba(0,0,0,0.06)';
            ctx.shadowBlur = 6;
            ctx.stroke();
            ctx.shadowBlur = 0;
        });

        // ---- 关键点 ----
        points.forEach(function(p, idx) {
            var px = toPixelX(p.x);
            var py = toPixelY(p.y);
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, 2 * Math.PI);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.15)';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, 2 * Math.PI);
            ctx.fillStyle = '#1a2f44';
            ctx.fill();
            var label = p.label + ' (' + fmt(p.x, 1) + ', ' + fmt(p.y, 3) + ')';
            ctx.fillStyle = '#0f253a';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            var offsetY = (idx === 0) ? -12 : (idx === 3 ? -12 : 16);
            ctx.fillText(label, px, py + offsetY);
        });

        // ---- 图例 ----
        var legend = [
            { color: '#27ae60', label: '前纵曲线' },
            { color: '#2980b9', label: '中间直线段' },
            { color: '#e74c3c', label: '后纵曲线' },
        ];
        var lx = margin.left + 16,
            ly = margin.top + 14;
        ctx.save();
        ctx.font = '12px sans-serif';
        legend.forEach(function(item, idx) {
            var y = ly + idx * 22;
            ctx.fillStyle = item.color;
            ctx.fillRect(lx, y + 4, 18, 4);
            ctx.fillStyle = '#1f3b54';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.label, lx + 26, y + 6);
        });
        ctx.restore();

        // ---- 坡度标注 ----
        if (L - 2 * l > 0.5) {
            var mx = (l + (L - l)) / 2;
            var my = getHeight(mx);
            var px2 = toPixelX(mx);
            var py2 = toPixelY(my);
            ctx.save();
            ctx.font = '12px sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            var tw = ctx.measureText('坡度 ' + fmtPercent(i)).width;
            ctx.fillRect(px2 - tw / 2 - 6, py2 - 24, tw + 12, 22);
            ctx.fillStyle = '#0a2a44';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText('坡度 ' + fmtPercent(i), px2, py2 - 4);
            ctx.restore();
        }

        // ---- 长度标注 ----
        ctx.save();
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#2d5a7a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        if (l > 0.5) {
            var x1 = toPixelX(0);
            var x2 = toPixelX(l);
            var midX = (x1 + x2) / 2;
            var yPos = toPixelY(0) + 14;
            ctx.strokeStyle = '#5b8bb0';
            ctx.lineWidth = 1.2;
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.moveTo(x1, yPos + 4);
            ctx.lineTo(x2, yPos + 4);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#2d5a7a';
            ctx.fillText('l = ' + fmt(l, 1) + 'm', midX, yPos + 8);
        }
        if (l > 0.5) {
            var x3 = toPixelX(L - l);
            var x4 = toPixelX(L);
            var midX2 = (x3 + x4) / 2;
            var yPos2 = toPixelY(0) + 14;
            ctx.strokeStyle = '#5b8bb0';
            ctx.lineWidth = 1.2;
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.moveTo(x3, yPos2 + 4);
            ctx.lineTo(x4, yPos2 + 4);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#2d5a7a';
            ctx.fillText('l = ' + fmt(l, 1) + 'm', midX2, yPos2 + 8);
        }
        if (L - 2 * l > 0.5) {
            var x5 = toPixelX(l);
            var x6 = toPixelX(L - l);
            var midX3 = (x5 + x6) / 2;
            var yPos3 = toPixelY(0) + 36;
            ctx.strokeStyle = '#5b8bb0';
            ctx.lineWidth = 1.2;
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.moveTo(x5, yPos3 + 4);
            ctx.lineTo(x6, yPos3 + 4);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#2d5a7a';
            ctx.fillText('L-2l = ' + fmt(L - 2 * l, 1) + 'm', midX3, yPos3 + 8);
        }
        ctx.restore();

        // ---- 总长度 ----
        ctx.save();
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#1a3a5a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        var yPos4 = toPixelY(0) + 58;
        ctx.strokeStyle = '#4a7a9a';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(toPixelX(0), yPos4 + 4);
        ctx.lineTo(toPixelX(L), yPos4 + 4);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#0a2a44';
        ctx.font = '12px sans-serif';
        ctx.fillText('总长度 L = ' + fmt(L, 1) + 'm', toPixelX(L / 2), yPos4 + 8);
        ctx.restore();

        // ---- 总高度差 ----
        ctx.save();
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#1a3a5a';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        var hx = toPixelX(L) + 18;
        var hy1 = toPixelY(0);
        var hy2 = toPixelY(H);
        ctx.strokeStyle = '#8a5a4a';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(hx - 4, hy1);
        ctx.lineTo(hx - 4, hy2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(hx - 8, hy1 + 4);
        ctx.lineTo(hx - 4, hy1);
        ctx.lineTo(hx, hy1 + 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(hx - 8, hy2 - 4);
        ctx.lineTo(hx - 4, hy2);
        ctx.lineTo(hx, hy2 - 4);
        ctx.stroke();
        ctx.fillStyle = '#6a3a2a';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('H = ' + fmt(H, 2) + 'm', hx + 6, (hy1 + hy2) / 2);
        ctx.restore();
    }

    // ---- 重置 ----
    function resetForm() {
        inputLength.value = '120';
        inputHeight.value = '6.0';
        inputCurve.value = '25';
        hideError();
        resultArea.classList.remove('visible');
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // ---- 事件绑定 ----
    calcBtn.addEventListener('click', calculate);
    resetBtn.addEventListener('click', resetForm);

    document.querySelectorAll('.input-group input').forEach(function(inp) {
        inp.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') calculate();
        });
    });

    // ---- 自动计算 ----
    window.addEventListener('DOMContentLoaded', function() {
        setTimeout(calculate, 80);
    });

    // ---- 窗口重绘防抖 ----
    var resizeTimer = null;
    window.addEventListener('resize', function() {
        if (resultArea.classList.contains('visible')) {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                calculate();
            }, 300);
        }
    });

    console.log('📐 坡道纵曲线计算器已加载');
    console.log('公式: i = H / (L - l)');
    console.log('前纵曲线: y = (i/(2l))·x²');
    console.log('后纵曲线: y = H - (i/(2l))·(L-x)²');

})();