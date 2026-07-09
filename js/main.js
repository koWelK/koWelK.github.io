document.addEventListener('DOMContentLoaded', function() {
    var searchBtn = document.getElementById('searchBtn');
    var searchInput = document.getElementById('searchInput');
    var resultsDiv = document.getElementById('searchResults');

    // ===== 1. 公司信息映射表（短代码 → 全称 + 颜色） =====
    var companyInfoMap = {
        'NT': { name: '城北客运', color: '#f7a919' },
        'KK': { name: '纪云交通', color: '#1976D2' },
        'FZ': { name: '福竹公交', color: '#D32F2F' },
        'RW': { name: '澜海电铁', color: '#48d32f' }
        //'短代码': { name: '全称', color: '颜色值' }
    };
    var defaultCompanyName = '未知公司';
    var defaultColor = '#333333';

    // ===== 2. 运营状态映射表 =====
    var statusMap = {
        0: { icon: 'images/status_0.png', text: '停运' },
        1: { icon: 'images/status_1.png', text: '部分停运（组织调整）' },
        2: { icon: 'images/status_1.png', text: '部分停运（自然灾害）' },
        3: { icon: 'images/status_2.png', text: '晚点发生中' },
        4: { icon: 'images/status_3.png', text: '正常运行' },
        5: { icon: 'images/status_0.png', text: '停运' },
        6: { icon: 'images/status_1.png', text: '部分停运（事故发生）' }
    };
    var statusMapCompany = {
        0: { icon: 'images/status_0.png', text: '全线网停运' },
        1: { icon: 'images/status_1.png', text: '部分停运' },
        2: { icon: 'images/status_1.png', text: '部分停运' },
        3: { icon: 'images/status_2.png', text: '晚点发生中' },
        4: { icon: 'images/status_3.png', text: '正常运行' },
        5: { icon: 'images/status_0.png', text: '全线停运' },
        6: { icon: 'images/status_1.png', text: '部分停运' }
    };
    var borderColorMap = {
        0: '#e74c3c',
        1: '#f39c12',
        2: '#f39c12',
        3: '#f1c40f',
        4: '#2ecc71',
        5: '#e74c3c',
        6: '#f39c12'
    };

    // ===== 3. 渲染运情卡片 =====
    function renderStatusCards(companies) {
        var container = document.getElementById('statusCards');
        if (!container) return;
        var html = '';
        companies.forEach(function(company) {
            var status = company.status;
            var info = statusMapCompany[status] || { text: '未知状态' };
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

    // ===== 天气状态栏（支持预设/API切换） =====
function getWeatherIcon(code) {
    const map = {
        0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
        45: '🌫️', 48: '🌫️',
        51: '🌦️', 53: '🌧️', 55: '🌧️',
        61: '🌧️', 63: '🌧️', 65: '⛈️',
        71: '❄️', 73: '❄️', 75: '❄️',
        80: '🌦️', 81: '🌧️', 82: '⛈️',
        95: '⛈️', 96: '⛈️', 99: '⛈️',
        101:'🌧️', 102:'🌧️', 103:'🌧️'
    };
    return map[code] || '🌡️';
}

function decodeWeatherCode(code) {
    const map = {
        0: '晴天', 1: '晴间多云', 2: '局部多云', 3: '阴天',
        45: '雾', 48: '雾凇',
        51: '毛毛雨', 53: '毛毛雨', 55: '毛毛雨',
        61: '小雨', 63: '中雨', 65: '大雨',
        71: '小雪', 73: '中雪', 75: '大雪',
        80: '阵雨', 81: '阵雨', 82: '阵雨',
        95: '雷暴', 96: '雷暴', 99: '雷暴',
        101:'大暴雨', 102:'特大暴雨', 103:'特大暴雨'
    };
    return map[code] || '未知';
}

function getRainLevel(precip) {
    if (precip <= 0) return '无雨';
    if (precip < 5) return '小雨';
    if (precip < 15) return '中雨';
    if (precip < 30) return '大雨';
    if (precip < 70) return '暴雨';
    if (precip < 140) return '大暴雨';
    return '特大暴雨';
}
function getPrecipDisplay(rain, isSnow) {
    // 获取降雨等级名称（复用 getRainLevel）
    var level = getRainLevel(rain); // 返回 "无雨"、"小雨" 等

    // 如果不下雪，直接使用雨相关图标和文字
    if (!isSnow) {
        var rainIconMap = {
            '无雨': '☀️',
            '小雨': '🌧️',
            '中雨': '🌧️',
            '大雨': '🌧️',
            '暴雨': '⛈️',
            '大暴雨': '⛈️',
            '特大暴雨': '⛈️'
        };
        return { icon: rainIconMap[level] || '🌧️', text: level };
    } else {
        // 下雪时，将等级名中的“雨”替换为“雪”，并给雪花图标
        var snowLevelMap = {
            '无雨': '无雪',
            '小雨': '小雪',
            '中雨': '中雪',
            '大雨': '大雪',
            '暴雨': '暴雪',
            '大暴雨': '大暴雪',
            '特大暴雨': '特大暴雪'
        };
        var snowText = snowLevelMap[level] || level;
        return { icon: '❄️', text: snowText };
    }
}

function renderWeather(weatherObj) {
    const container = document.getElementById('weatherStatus');
    if (!container) return;
    const icon = getWeatherIcon(weatherObj.weather_code);
    // 获取降水显示（包含图标和文字）
    const precipDisplay = getPrecipDisplay(weatherObj.rain || 0, weatherObj.isSnow || 0, weatherObj.isFlash || false);

    container.innerHTML = `
        <span class="weather-item"> ${weatherObj.city}天气:</span>
        <span class="weather-item"><span class="weather-icon">${precipDisplay.icon}</span> <span class="weather-label">${precipDisplay.text}</span></span>
        <span class="weather-item">温度: ${weatherObj.temp}°C</span>
        <span class="weather-item">风速: ${weatherObj.wind} km/h</span>
    `;
}

    function loadWeather() {
        fetch('files/weather_data.json')
            .then(res => {
                if (!res.ok) throw new Error('天气配置文件不存在');
                return res.json();
            })
            .then(config => {
                if (config.source === 'manual') {
                const data = config.manual;
                renderWeather({
                    city: data.city || '未知',
                    temp: data.temp || 0,
                    weather_code: data.weather_code || 0,
                    weather_text: data.weather_text || '未知天气',
                    wind: data.wind || 0,
                    rain: data.rain || 0,
                    isSnow: data.snow || false,   // 新增
                    isFlash: data.flash || false   // 新增
                });
                console.log('🌤️ 使用预设天气数据');

                } else if (config.source === 'api') {
                    // ===== 使用API实时数据 =====
                    const api = config.api;
                    const url = `https://api.open-meteo.com/v1/forecast?latitude=${api.lat}&longitude=${api.lon}&current=temperature_2m,weather_code,wind_speed_10m,precipitation&timezone=auto`;
                    fetch(url)
                        .then(res => {
                            if (!res.ok) throw new Error('天气API请求失败');
                            return res.json();
                        })
                        .then(data => {
                            const current = data.current;
                            renderWeather({
                                city: api.city || '未知',
                                temp: Math.round(current.temperature_2m),
                                weather_code: current.weather_code,
                                weather_text: decodeWeatherCode(current.weather_code),
                                wind: Math.round(current.wind_speed_10m),
                                rain: current.precipitation || 0,
                                isSnow: isSnow,   // 新增
                                isFlash: flash || false   // 新增
                            });
                            console.log('🌐 使用API实时天气数据');
                        })
                        .catch(err => {
                            console.error('API加载失败，请检查网络', err);
                            const container = document.getElementById('weatherStatus');
                            if (container) container.innerHTML = '<span>⚠️ 实时天气加载失败</span>';
                        });
                } else {
                    throw new Error('source 字段无效，请使用 "manual" 或 "api"');
                }
            })
            .catch(err => {
                console.error('天气配置加载失败:', err);
                const container = document.getElementById('weatherStatus');
                if (container) container.innerHTML = '<span>⚠️ 天气模块未配置</span>';
            });
    }
    // ===== 计算公司整体状态（按严重程度） =====
    function calculateCompanyStatus(routes) {
        // 严重程度映射：数字越小越严重
        function getSeverity(status) {
            // 0 和 5 现在与 1/2/6 同级，不再独占最高级
            if (status === 0 || status === 5 || status === 1 || status === 2 || status === 6) return 1;
            if (status === 3) return 2;
            if (status === 4) return 3;
            return 4;
        }

        function mapToCompanyStatus(severity) {
            if (severity === 0) return 0;   // 已弃用，但保留
            if (severity === 1) return 1;
            if (severity === 2) return 3;
            if (severity === 3) return 4;
            return 4;
        }

        var companyStatusMap = {};
        // 按公司分组
        routes.forEach(function(route) {
            var company = route.company;
            var status = route.status;
            if (!companyStatusMap[company]) {
                companyStatusMap[company] = [];
            }
            companyStatusMap[company].push(status);
        });

        var result = {};
        for (var company in companyStatusMap) {
            var statuses = companyStatusMap[company];
            
            // 新增：检查是否全为 0 或 5
            var allZeroOrFive = statuses.every(function(s) {
                return s === 0 || s === 5;
            });
            if (allZeroOrFive) {
                // 全为 0/5 → 公司状态 0（全线网停运）
                result[company] = 0;
            } else {
                // 否则按原规则：最严重 severity
                var minSeverity = 4;
                statuses.forEach(function(s) {
                    var sev = getSeverity(s);
                    if (sev < minSeverity) minSeverity = sev;
                });
                result[company] = mapToCompanyStatus(minSeverity);
            }
        }
        return result;
    }

    // ===== 加载自定义文字 =====
    function loadStatusText() {
        return fetch('RouteData/company_status_text.json')
            .then(res => {
                if (!res.ok) throw new Error('自定义文字文件不存在');
                return res.json();
            })
            .catch(() => {
                // 文件不存在，返回空对象
                return {};
            });
    }

    // ===== 修改 renderStatusCards 支持额外文字框 =====
    // 在现有的 renderStatusCards 函数中，在卡片内容末尾添加：
    // <div class="status-extra">${extraText}</div>
    // 并接受 customTextMap 作为参数
    function renderStatusCards(companies, statusMap, borderColorMap, customTextMap) {
        var container = document.getElementById('statusCards');
        if (!container) return;
        var html = '';
        companies.forEach(function(company) {
            var status = company.status;
            var info = statusMapCompany[status] || { icon: 'images/status_0.png', text: '未知状态' };
            var borderColor = borderColorMap[status] || '#ccc';
            var encodedName = encodeURIComponent(company.name_cn);
            // 优先使用自定义文字，否则使用状态默认文字
            var extraText = (customTextMap && customTextMap[company.name_cn]) || info.text;

            html += `
                <div class="status-card" 
                    style="border-top-color: ${borderColor};"
                    onclick="window.location.href='company.html?company=${encodedName}'">
                    <div class="name-cn">${company.name_cn}</div>
                    <div class="name-en">${company.name_en || ''}</div>
                    <img src="${info.icon}" alt="${info.text}" class="status-icon-img">
                    <div class="status-text">${info.text}</div>
                    <!-- 新增：下方文字框 -->
                    <div class="status-extra">${extraText}</div>
                </div>
            `;
        });
        container.innerHTML = html;
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

Promise.all([
    fetch('RouteData/route.json').then(res => {
        if (!res.ok) throw new Error('线路数据加载失败');
        return res.json();
    }),
    loadStatusText() // 加载自定义文字（可能为空对象）
])
.then(function(dataArray) {
    var routesData = dataArray[0];
    var customTextMap = dataArray[1];

    // 1. 从 route.json 提取所有公司短代码（去重）
    var companySet = {};
    routesData.forEach(function(route) {
        companySet[route.company] = true;
    });
    var shortCodes = Object.keys(companySet);

    // 2. 构建 companies 数组（从 companyInfoMap 获取中文名和颜色，状态稍后计算）
    var companies = shortCodes.map(function(code) {
        var info = companyInfoMap[code] || { name: code, color: defaultColor };
        return {
            name_cn: info.name,
            name_en: '',   // 没有英文名，留空
            status: 0,     // 暂填，后面覆盖
            logo: ''       // 没有 logo，留空
        };
    });

    // 3. 计算各公司整体状态（返回短代码 → 状态值）
    var computedStatus = calculateCompanyStatus(routesData);

    // 4. 更新 companies 中的 status
    companies.forEach(function(company) {
        // 根据中文名反向查找短代码（因为 computedStatus 的键是短代码）
        var shortCode = null;
        for (var code in companyInfoMap) {
            if (companyInfoMap[code].name === company.name_cn) {
                shortCode = code;
                break;
            }
        }
        if (shortCode && computedStatus[shortCode] !== undefined) {
            company.status = computedStatus[shortCode];
        }
    });

    // 5. 渲染状态卡片（传入 customTextMap）
    renderStatusCards(companies, statusMap, borderColorMap, customTextMap);

    // 6. 绑定搜索事件（仍使用 routesData）
    if (searchBtn && searchInput && resultsDiv) {
        searchBtn.addEventListener('click', function() {
            performSearch(routesData);
        });
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                performSearch(routesData);
            }
        });
    }

    console.log('所有数据加载成功，线路数：' + routesData.length + '，公司数：' + companies.length);
})
    .catch(function(error) {
        console.error('加载数据出错:', error);
        if (resultsDiv) {
            resultsDiv.innerHTML = '<p class="no-result" style="color:red;">数据加载失败，请检查文件路径</p>';
        }
});
    
        // 加载新闻（独立于线路和运情数据）
        loadNews();
        loadPromo();
        loadWeather();

    var clearBtn = document.getElementById('clearBtn');
    var searchInput = document.getElementById('searchInput');
    if (clearBtn && searchInput) {

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
}
});
// ===== 轮播图控制 =====
(function() {
    var track = document.getElementById('carouselTrack');
    if (!track) return;  // ⭐ 如果不存在，直接退出
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


