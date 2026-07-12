// ===== route.js - 线路页面逻辑 =====

// 1. 定义映射（与 main.js 保持一致）
var companyInfoMap = {
    'NT': { name: '城北客运', color: '#f7a919' },
    'KK': { name: '纪云交通', color: '#1976D2' },
    'FZ': { name: '福竹公交', color: '#D32F2F' },
    'RW': { name: '澜海电铁', color: '#48d32f' }
};
var defaultCompanyName = '未知公司';
var defaultColor = '#333333';

var statusMap = {
    0: { icon: 'images/status_0.png', text: '停运' },
    1: { icon: 'images/status_1.png', text: '部分停运（组织调整）' },
    2: { icon: 'images/status_1.png', text: '部分停运（自然灾害）' },
    3: { icon: 'images/status_2.png', text: '晚点发生中' },
    4: { icon: 'images/status_3.png', text: '正常运行' },
    5: { icon: 'images/status_0.png', text: '停运' },
    6: { icon: 'images/status_1.png', text: '部分停运（事故发生）' }
};

// 存储当前线路和方向
var currentLine = null;
var currentDirection = null;
var allDirectionsData = [];

// 2. 获取 URL 参数
function getQueryParam(param) {
    var urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// 3. 加载线路数据并渲染
function loadLineData() {
    var lineNumber = getQueryParam('line');
    if (!lineNumber) {
        document.querySelector('.line-info-container').innerHTML = '<p>未指定线路</p>';
        document.querySelector('.line-station-container').innerHTML = '<p>未指定线路</p>';
        return;
    }
    currentLine = lineNumber;

    fetch('RouteData/route.json')
        .then(response => {
            if (!response.ok) throw new Error('线路数据加载失败');
            return response.json();
        })
        .then(routes => {
            var route = routes.find(r => r.line === lineNumber);
            if (!route) {
                document.querySelector('.line-info-container').innerHTML = '<p>未找到该线路</p>';
                return;
            }
            renderLineInfo(route);
            loadStationData(lineNumber, null);
        })
        .catch(error => {
            console.error('加载线路数据失败:', error);
            document.querySelector('.line-info-container').innerHTML = '<p>数据加载失败</p>';
        });
}

// 4. 渲染线路信息
function renderLineInfo(route) {
    var container = document.querySelector('.line-info-container');
    if (!container) return;

    var companyInfo = companyInfoMap[route.company] || { name: defaultCompanyName, color: defaultColor };
    var statusInfo = statusMap[route.status] || { icon: 'images/status_0.png', text: '未知状态' };

    var html = `
        <div class="info-item-route">
            <span class="main">${route.line}路</span>
        </div>
        <div class="info-item">
            <span class="label">所属公司</span>
            <span class="value" style="color: ${companyInfo.color};">${companyInfo.name}</span>
        </div>
        <div class="info-item">
            <span class="label">运营状态</span>
            <span class="value">
                <img src="${statusInfo.icon}" alt="${statusInfo.text}" style="width:20px; height:20px; vertical-align:middle;">
                ${statusInfo.text}
            </span>
        </div>
        <div class="info-item">
            <span class="label">运营区间</span>
            <span class="value">${route.stops[0]} — ${route.stops[route.stops.length-1]}</span>
        </div>
        <div class="info-item">
            <span class="label">线路类型</span>
            <span class="value">${route.type || '常规'}</span>
        </div>
    `;

    container.innerHTML = html;
}

// 5. 加载站点数据
function loadStationData(lineNumber, direction) {
    fetch('RouteData/line_station.json')
        .then(response => {
            if (!response.ok) throw new Error('站点数据加载失败');
            return response.json();
        })
        .then(stations => {
            var lineStations = stations.filter(item => item.line === lineNumber);
            if (lineStations.length === 0) {
                document.querySelector('.line-station-container').innerHTML = '<p>该线路暂无站点数据</p>';
                return;
            }
            allDirectionsData = lineStations;
            var selected = direction ? lineStations.find(item => item.direction === direction) : lineStations[0];
            if (!selected) selected = lineStations[0];
            currentDirection = selected.direction;
            renderStations(selected, lineStations);
        })
        .catch(error => {
            console.error('加载站点数据失败:', error);
            document.querySelector('.line-station-container').innerHTML = '<p>站点数据加载失败</p>';
        });
}

// 6. 渲染站点列表
function renderStations(directionData, allDirections) {
    var container = document.querySelector('.line-station-container');
    if (!container) return;

    var stops = directionData.stops;
    var travelTimes = directionData.travel_times || [];
    var departures = directionData.departures || [];

    fetch('RouteData/stations.json')
        .then(response => response.json())
        .then(stationsData => {
            var transferMap = {};
            stationsData.forEach(function(item) {
                transferMap[item.staname] = item.route || [];
            });

            var total = stops.length;
            var html = `
                <div class="station-grid">
                    <div class="station-header">
                        <span class="col-station">车站</span>
                        <span class="col-transfer">换乘</span>
                        <span class="col-time">运营时间</span>
                        <span class="col-action">查看</span>
                    </div>
            `;

            stops.forEach(function(stop, index) {
                var number = index + 1;
                var isStart = index === 0;
                var isEnd = index === total - 1;
                var badge = '';
                var extraClass = '';
                if (isStart) {
                    badge = '<span class="station-badge">起点</span>';
                    extraClass = 'is-start';
                } else if (isEnd) {
                    badge = '<span class="station-badge">终点</span>';
                    extraClass = 'is-end';
                }

                // 换乘图标
                var transferCodes = transferMap[stop] || [];
                var iconMap = { 'NT': '🚌', 'KK': '🚌', 'FZ': '🚌', 'RW': '🚆' };
                var icons = transferCodes.map(c => iconMap[c] || '🚌');
                var uniqueIcons = icons.filter((v, i, self) => self.indexOf(v) === i);
                var transferDisplay = uniqueIcons.length ? uniqueIcons.join(' ') : '—';

                // 计算累计分钟数
                var cumulative = 0;
                var dataValid = false;
                if (travelTimes.length === stops.length) {
                    cumulative = travelTimes[index] || 0;
                    dataValid = true;
                } else if (travelTimes.length === stops.length - 1) {
                    cumulative = 0;
                    for (var i = 0; i < index; i++) {
                        cumulative += (travelTimes[i] || 0);
                    }
                    dataValid = true;
                }
                var timeDisplay = dataValid ? cumulative + "'" : '--:--';

                var stationUrl = 'station.html?station=' + encodeURIComponent(stop);

                html += `
                    <div class="station-item ${extraClass}">
                        <span class="col-station">
                            <span class="station-number">${number}</span>
                            <span class="station-name">${stop}</span>
                            ${badge}
                        </span>
                        <span class="col-transfer">${transferDisplay}</span>
                        <span class="col-time">${timeDisplay}</span>
                        <span class="col-action">
                            <a href="${stationUrl}" class="station-link">站详情</a>
                        </span>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;

            // ❌ 已移除整行点击事件绑定（只保留按钮点击）
            // bindStationClick(container);

            updateDirectionButton(allDirections, directionData.direction);
        })
        .catch(() => {
            renderStationsFallback(directionData, allDirections);
        });
}

// 降级渲染（无换乘数据）
function renderStationsFallback(directionData, allDirections) {
    var container = document.querySelector('.line-station-container');
    if (!container) return;
    var stops = directionData.stops;
    var travelTimes = directionData.travel_times || [];
    var total = stops.length;
    var html = `
        <div class="station-grid">
            <div class="station-header">
                <span class="col-station">车站</span>
                <span class="col-transfer">换乘</span>
                <span class="col-time">运营时间</span>
                <span class="col-action">操作</span>
            </div>
    `;
    stops.forEach(function(stop, index) {
        var number = index + 1;
        var isStart = index === 0;
        var isEnd = index === total - 1;
        var badge = '';
        var extraClass = '';
        if (isStart) {
            badge = '<span class="station-badge">起点</span>';
            extraClass = 'is-start';
        } else if (isEnd) {
            badge = '<span class="station-badge">终点</span>';
            extraClass = 'is-end';
        }
        var cumulative = 0;
        var dataValid = false;
        if (travelTimes.length === stops.length) {
            cumulative = travelTimes[index] || 0;
            dataValid = true;
        } else if (travelTimes.length === stops.length - 1) {
            cumulative = 0;
            for (var i = 0; i < index; i++) {
                cumulative += (travelTimes[i] || 0);
            }
            dataValid = true;
        }
        var timeDisplay = dataValid ? cumulative + "'" : '--:--';
        var stationUrl = 'station.html?station=' + encodeURIComponent(stop);
        html += `
            <div class="station-item ${extraClass}">
                <span class="col-station">
                    <span class="station-number">${number}</span>
                    <span class="station-name">${stop}</span>
                    ${badge}
                </span>
                <span class="col-transfer">—</span>
                <span class="col-time">${timeDisplay}</span>
                <span class="col-action">
                    <a href="${stationUrl}" class="station-link">查看</a>
                </span>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;

    // ❌ 已移除整行点击事件绑定
    // bindStationClick(container);

    updateDirectionButton(allDirections, directionData.direction);
}

// 方向按钮更新
function updateDirectionButton(allDirections, currentDir) {
    var dirBtn = document.querySelector('.btn-direction');
    if (!dirBtn) return;
    var dirNames = { '1': '上行', '2': '下行' };
    var otherDir = allDirections.find(d => d.direction !== currentDir);
    if (otherDir) {
        var otherDirName = dirNames[otherDir.direction] || ('方向' + otherDir.direction);
        dirBtn.innerHTML = '<span class="btn-line-icon">⇄</span><span class="btn-line-text">切换至 ' + otherDirName + '</span>';
        dirBtn.style.opacity = '1';
        dirBtn.style.cursor = 'pointer';
        dirBtn.onclick = function() {
            switchDirection();
        };
    } else {
        dirBtn.innerHTML = '<span class="btn-line-icon">⇄</span><span class="btn-line-text">仅此方向</span>';
        dirBtn.style.opacity = '0.5';
        dirBtn.style.cursor = 'default';
        dirBtn.onclick = null;
    }
}

// 7. 方向切换
function switchDirection() {
    if (allDirectionsData.length <= 1) return;
    var nextDir = allDirectionsData.find(d => d.direction !== currentDirection);
    if (nextDir) {
        currentDirection = nextDir.direction;
        renderStations(nextDir, allDirectionsData);
    }
}

// 8. 刷新线路状态
function refreshLineStatus() {
    if (!currentLine) return;
    fetch('RouteData/route.json')
        .then(response => response.json())
        .then(routes => {
            var route = routes.find(r => r.line === currentLine);
            if (route) {
                renderLineInfo(route);
                var refreshBtn = document.querySelector('.btn-refresh');
                if (refreshBtn) {
                    var origText = refreshBtn.innerHTML;
                    refreshBtn.innerHTML = '<span class="btn-line-icon">✓</span><span class="btn-line-text">已刷新</span>';
                    setTimeout(function() {
                        refreshBtn.innerHTML = origText;
                    }, 1500);
                }
            }
        })
        .catch(err => console.error('刷新失败:', err));
}

// 9. 返回功能
function goBackOrHome() {
    if (document.referrer) {
        window.history.back();
    } else {
        window.location.href = 'index.html';
    }
}

// ===== (已停用) 绑定站点行点击事件（事件委托） =====
// 如需启用整行点击跳转，请取消注释并移除上面 renderStations 中的注释
function bindStationClick(container) {
    container.removeEventListener('click', handleStationClick);
    container.addEventListener('click', handleStationClick);
}

function handleStationClick(event) {
    var target = event.target.closest('.station-item');
    if (!target) return;
    var stationName = target.dataset.station;
    if (stationName) {
        window.location.href = 'station.html?station=' + encodeURIComponent(stationName);
    }
}

// 10. 辅助函数（时间相加，保留备用）
function addMinutes(time, minutes) {
    var parts = time.split(':');
    var h = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    var total = h * 60 + m + minutes;
    var nh = Math.floor(total / 60) % 24;
    var nm = total % 60;
    return String(nh).padStart(2, '0') + ':' + String(nm).padStart(2, '0');
}

// 11. 页面加载后执行
document.addEventListener('DOMContentLoaded', function() {
    loadLineData();
    var refreshBtn = document.querySelector('.btn-refresh');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshLineStatus);
    }
});