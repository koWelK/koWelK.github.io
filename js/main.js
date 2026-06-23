    document.addEventListener('DOMContentLoaded', function() {
        var searchBtn = document.getElementById('searchBtn');
        var searchInput = document.getElementById('searchInput');
        var resultsDiv = document.getElementById('searchResults');

        // ===== 1. 定义公司颜色映射 =====
        var companyColors = {
            '纪云交通': '#1976D2',
            '城北客运': '#f7a919',
            '福竹公交': '#D32F2F',
        };
        // 默认颜色（未定义的公司使用）
        var defaultColor = '#333333';

        // ===== 2. 获取公司对应的颜色 =====
        function getCompanyColor(company) {
            return companyColors[company] || defaultColor;
        }

        // ===== 3. 执行搜索（使用外部数据） =====
        function performSearch(data) {
            var query = searchInput.value.trim();
            if (query === '') {
                resultsDiv.innerHTML = '<p class="no-result">请输入线路名或站点</p>';
                return;
            }

            var results = data.filter(function(item) {
                return item.line.includes(query) ||
                    item.stops.some(function(stop) {
                        return stop.includes(query);
                    });
            });

            if (results.length === 0) {
                resultsDiv.innerHTML = '<p class="no-result">未找到相关线路或站点</p>';
            } else {
                var html = '<ul style="list-style:none;padding:0;">';
                results.forEach(function(item) {
                    var encodedLine = encodeURIComponent(item.line);
                    var color = getCompanyColor(item.company);
                    // 线路名称使用动态颜色，并显示公司名称
                    html += '<li style="padding:10px;border-bottom:1px solid #eee;">' +
                        '<a href="lines.html?line=' + encodedLine + '" ' +
                        'style="display:block;text-decoration:none;color:' + color + ';font-weight:bold;">' +
                        '<span style="color:' + color + ';">' + item.line + '</span>' +
                        '（' + item.stops.join(' → ') + '）' +
                        ' <span style="font-weight:normal;color:#888;font-size:0.85em;">[' + item.company + ']</span>' +
                        '<span style="float:right;color:#1b1b1b;">查看详情 →</span>' +
                        '</a>' +
                        '</li>';
                });
                html += '</ul>';
                resultsDiv.innerHTML = html;
            }
        }

        // ===== 4. 从外部文件加载数据 =====
        fetch('RouteData/route.json')
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('数据文件加载失败，HTTP状态码：' + response.status);
                }
                return response.json();
            })
            .then(function(data) {
                searchBtn.addEventListener('click', function() {
                    performSearch(data);
                });
                searchInput.addEventListener('keyup', function(e) {
                    if (e.key === 'Enter') {
                        performSearch(data);
                    }
                });
                console.log('数据加载成功，共 ' + data.length + ' 条线路');
            })
            .catch(function(error) {
                console.error('加载数据出错:', error);
                resultsDiv.innerHTML = '<p class="no-result" style="color:red;">数据加载失败</p>';
            });
    });