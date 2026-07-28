// ============================================
// 信息查询页面 JavaScript（真实数据搜索）
// ============================================

document.addEventListener('DOMContentLoaded', function() {

    var searchInput = document.getElementById('searchInput');
    var searchBtn = document.getElementById('searchBtn');
    var searchResults = document.getElementById('searchResults');

    // ===== 1. 加载真实数据 =====
    var routeData = []; // 存储从 route.json 加载的数据

    function loadRouteData() {
        fetch('RouteData/route.json')
            .then(response => {
                if (!response.ok) throw new Error('线路数据加载失败');
                return response.json();
            })
            .then(data => {
                routeData = data;
                console.log('✅ 线路数据加载成功，共 ' + data.length + ' 条');
            })
            .catch(error => {
                console.error('加载线路数据失败:', error);
                searchResults.innerHTML = '<div class="result-item" style="color:#e74c3c;text-align:center;">数据加载失败，请刷新重试</div>';
                searchResults.classList.add('active');
            });
    }

    // ===== 2. 执行搜索 =====
    function performSearch() {
        var query = searchInput.value.trim();
        if (!query) {
            searchResults.classList.remove('active');
            return;
        }

        // 如果数据尚未加载完成，显示提示
        if (routeData.length === 0) {
            searchResults.innerHTML = '<div class="result-item" style="color:#999;text-align:center;">数据加载中，请稍后…</div>';
            searchResults.classList.add('active');
            return;
        }

        // 过滤数据（匹配线路名或站点）
        var results = routeData.filter(function(item) {
            // 匹配线路名
            var lineMatch = item.line.includes(query);
            // 匹配站点（item.stops 是数组）
            var stopMatch = item.stops.some(function(stop) {
                return stop.includes(query);
            });
            return lineMatch || stopMatch;
        });

        // 渲染结果
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="result-item" style="color:#999;text-align:center;">未找到相关线路或站点</div>';
        } else {
            var html = '';
            results.forEach(function(item) {
                // 构建显示文本：线路名 + 起点 → 终点
                var displayText = item.line + '路（' + item.stops[0] + ' → ' + item.stops[item.stops.length-1] + '）';
                // 附加公司名（可选）
                var companyName = '';
                if (item.company) {
                    // 可以从映射表获取中文名，但这里简化
                    var companyMap = { 'NT': '城北客运', 'KK': '纪云交通', 'FZ': '福竹公交', 'RW': '澜海电铁' };
                    companyName = ' [' + (companyMap[item.company] || item.company) + ']';
                }
                html += '<div class="result-item" data-line="' + encodeURIComponent(item.line) + '">' 
                        + displayText + companyName 
                        + '</div>';
            });
            searchResults.innerHTML = html;
        }
        searchResults.classList.add('active');
    }

    // ===== 3. 绑定事件 =====
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    // ===== 4. 结果点击跳转 =====
    if (searchResults) {
        searchResults.addEventListener('click', function(e) {
            var item = e.target.closest('.result-item');
            if (item) {
                var line = item.dataset.line;
                if (line) {
                    // 跳转到线路详情页
                    window.location.href = 'lines.html?line=' + line;
                }
            }
        });
    }

    // ===== 5. 初始化：加载数据 =====
    loadRouteData();

    console.log('✅ 信息查询页面已加载（真实数据模式）');
});