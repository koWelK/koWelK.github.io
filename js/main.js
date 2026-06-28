document.addEventListener('DOMContentLoaded', function() {
    var searchBtn = document.getElementById('searchBtn');
    var searchInput = document.getElementById('searchInput');
    var resultsDiv = document.getElementById('searchResults');

    // ===== 1. 公司信息映射表（短代码 → 全称 + 颜色） =====
    var companyInfoMap = {
        'NT': { name: '城北客运', color: '#f7a919' },
        'KK': { name: '纪云交通', color: '#1976D2' },
        'FZ': { name: '福竹公交', color: '#D32F2F' }
        //'短代码': { name: '全称', color: '颜色值' }
    };
    var defaultCompanyName = '未知公司';
    var defaultColor = '#333333';

    // ===== 2. 运营状态映射表 =====
    var statusMap = {
        0: { icon: 'images/status_0.png', text: '全线网停运' },
        1: { icon: 'images/status_1.png', text: '部分线路停运（组织调整）' },
        2: { icon: 'images/status_1.png', text: '部分线路停运（自然灾害）' },
        3: { icon: 'images/status_2.png', text: '晚点发生中' },
        4: { icon: 'images/status_3.png', text: '正常运行' }
    };
    var borderColorMap = {
        0: '#e74c3c',
        1: '#f39c12',
        2: '#f39c12',
        3: '#f1c40f',
        4: '#2ecc71'
    };

    // ===== 3. 渲染运情卡片 =====
    function renderStatusCards(companies) {
        var container = document.getElementById('statusCards');
        if (!container) return;
        var html = '';
        companies.forEach(function(company) {
            var status = company.status;
            var info = statusMap[status] || { text: '未知状态' };
            var borderColor = borderColorMap[status] || '#ccc';
            var encodedName = encodeURIComponent(company.name_cn);
            html += `
                <div class="status-card" 
                     style="border-top-color: ${borderColor};"
                     onclick="window.location.href='company.html?company=${encodedName}'">
                    <div class="name-cn">${company.name_cn}</div>
                    <div class="name-en">${company.name_en || ''}</div>
                    <img src="${info.icon}" alt="${info.text}" class="status-icon-img">
                    <div class="status-text">${info.text}</div>
                </div>
            `;
        });
        container.innerHTML = html;
    }
    // ===== 6. 加载新闻列表 =====
    function loadNews() {
        console.log('loadNews 函数已执行'); 
        var container = document.getElementById('informationsContainer');
        if (!container) return;

        fetch('files/news_info.json')
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('新闻数据加载失败，状态码：' + response.status);
                }
                return response.json();
            })
            .then(function(newsList) {
                if (newsList.length === 0) {
                    container.innerHTML = '<p style="text-align:center;color:#999;">暂无新闻</p>';
                    return;
                }
                var html = '<ul style="list-style:none;padding:0;">';
                newsList.forEach(function(item) {
                    var date = item.date || '';
                    html += '<li style="padding:12px 15px;border-bottom:1px solid #e9ecef;background:#fff;border-radius:4px;margin-bottom:8px;">' +
                        '<a href="' + item.pdf_url + '" target="_blank" style="text-decoration:none;color:#2c3e50;font-size:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;">' +
                        '📄 ' + item.title +
                        ' <span style="color:#868e96;font-size:14px;font-weight:normal;">' + date + '</span>' +
                        '</a>' +
                        '</li>';
                });
                html += '</ul>';
                container.innerHTML = html;
            })
            .catch(function(error) {
                console.error('加载新闻出错:', error);
                container.innerHTML = '<p style="text-align:center;color:red;">新闻加载失败，请检查数据文件</p>';
            });
    }

        // ===== 加载宣传栏数据 =====
        function loadPromo() {
            var container = document.getElementById('promoGrid');
            if (!container) return;

            fetch('files/promo.json')
                .then(response => {
                    if (!response.ok) throw new Error('宣传数据加载失败');
                    return response.json();
                })
                .then(items => {
                    if (items.length === 0) {
                        container.innerHTML = '<p style="text-align:center;color:#999;">暂无宣传内容</p>';
                        return;
                    }
                    var html = '';
                    items.forEach(item => {
                        html += `
                            <a href="${item.link}" class="promo-item">
                                <img src="${item.img}" alt="${item.title}">
                                <div class="promo-overlay">
                                    <span class="promo-title">${item.title}</span>
                                    <span class="promo-desc">${item.desc}</span>
                                </div>
                            </a>
                        `;
                    });
                    container.innerHTML = html;
                    console.log('✅ 宣传栏加载成功，共 ' + items.length + ' 项');
                })
                .catch(error => {
                    console.error('宣传栏加载出错:', error);
                    container.innerHTML = '<p style="text-align:center;color:red;">宣传内容加载失败</p>';
                });
        }


    // ===== 4. 搜索功能（使用线路数据） =====
    function performSearch(linesData) {
        var query = searchInput.value.trim();
        if (query === '') {
            resultsDiv.innerHTML = '<p class="no-result">请输入线路名或站点</p>';
            return;
        }
        var results = linesData.filter(function(item) {
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
                // 从映射表获取公司信息
                var info = companyInfoMap[item.company];
                var displayName = info ? info.name : (item.company || defaultCompanyName);
                var color = info ? info.color : defaultColor;

                html += '<li style="padding:10px;border-bottom:1px solid #eee;">' +
                    '<a href="lines.html?line=' + encodedLine + '" ' +
                    'style="display:block;text-decoration:none;color:#333;font-weight:bold;">' +
                    item.line + '（' + item.stops.join(' <-> ') + '）' +
                    ' <span style="background-color:' + color + ';color:#fff;padding:2px 10px;border-radius:12px;font-size:0.75rem;font-weight:normal;display:inline-block;">' + displayName + '</span>' + 
                    ' <span style=color:#5f5f5f;font-size:0.75rem;>' + item.type + '</span>' +
                    //' <span class="line-type">' + (item.type || '') + '</span>' +
                    '<span style="float:right;color:#3a3a3a;">查看详情 →</span>' +
                    '</a>' +
                    '</li>';
            });
            html += '</ul>';
            resultsDiv.innerHTML = html;
        }
    }

    // ===== 5. 分别加载两个 JSON 文件 =====
    var linesUrl = 'RouteData/route.json';
    var statusUrl = 'RouteData/company_status.json';

    Promise.all([
        fetch(linesUrl).then(function(res) {
            if (!res.ok) throw new Error('线路数据加载失败');
            return res.json();
        }),
        fetch(statusUrl).then(function(res) {
            if (!res.ok) throw new Error('运行情报数据加载失败');
            return res.json();
        })
    ])
    .then(function(dataArray) {
        var linesData = dataArray[0];
        var companiesData = dataArray[1];

        renderStatusCards(companiesData);

        searchBtn.addEventListener('click', function() {
            performSearch(linesData);
        });
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                performSearch(linesData);
            }
        });

        console.log('所有数据加载成功，线路数：' + linesData.length + '，公司数：' + companiesData.length);
    })
    .catch(function(error) {
        console.error('加载数据出错:', error);
        resultsDiv.innerHTML = '<p class="no-result" style="color:red;">数据加载失败，请检查文件路径</p>';
    });
    
        // 加载新闻（独立于线路和运情数据）
        loadNews();
        loadPromo();

    var clearBtn = document.getElementById('clearBtn');
    var searchInput = document.getElementById('searchInput');

    // 监听输入事件，控制清空按钮的显示/隐藏
    searchInput.addEventListener('input', function() {
        if (this.value.length > 0) {
            clearBtn.style.display = 'block';
        } else {
            clearBtn.style.display = 'none';
        }
    });

    // 点击清空按钮：清空输入框、隐藏按钮、并聚焦
    clearBtn.addEventListener('click', function() {
        searchInput.value = '';
        this.style.display = 'none';
        searchInput.focus();
        // 如果需要清空后自动触发搜索（清空后不搜索，但如果你想，可以加上）
        // 如果你希望清空后立即显示所有线路（即不搜索），可以调用 performSearch 并传入全部数据，但这里我们只清空，让用户自己再输入。
});
});
// ===== 轮播图控制 =====
(function() {
    var track = document.getElementById('carouselTrack');
    var slides = track.querySelectorAll('.carousel-slide');
    var totalSlides = slides.length;
    var currentIndex = 0;
    var autoPlayInterval = null;
    var dotsContainer = document.getElementById('carouselDots');

    // 1. 创建指示点
    for (var i = 0; i < totalSlides; i++) {
        var dot = document.createElement('span');
        dot.dataset.index = i;
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', function() {
            goTo(parseInt(this.dataset.index));
        });
        dotsContainer.appendChild(dot);
    }

    var dots = dotsContainer.querySelectorAll('span');

    // 2. 跳转到指定幻灯片
    function goTo(index) {
        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;
        currentIndex = index;
        track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
        // 更新指示点
        dots.forEach(function(dot, i) {
            dot.classList.toggle('active', i === currentIndex);
        });
    }

    // 3. 下一张/上一张
    function nextSlide() {
        goTo(currentIndex + 1);
    }
    function prevSlide() {
        goTo(currentIndex - 1);
    }

    // 4. 绑定按钮事件
    document.getElementById('nextBtn').addEventListener('click', function() {
        nextSlide();
        resetAutoPlay();
    });
    document.getElementById('prevBtn').addEventListener('click', function() {
        prevSlide();
        resetAutoPlay();
    });

    // 5. 自动播放
    function startAutoPlay() {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(nextSlide, 4000); // 4秒切换
    }
    function resetAutoPlay() {
        clearInterval(autoPlayInterval);
        startAutoPlay();
    }

    // 6. 鼠标悬停暂停自动播放（提升体验）
    var container = track.parentElement;
    container.addEventListener('mouseenter', function() {
        clearInterval(autoPlayInterval);
    });
    container.addEventListener('mouseleave', function() {
        startAutoPlay();
    });

    // 7. 初始化
    goTo(0);
    startAutoPlay();

    // 8. 窗口改变时保持位置（可选）
    window.addEventListener('resize', function() {
        // 无需额外处理，因为 flex:0 0 100% 自适应
    });
})();


