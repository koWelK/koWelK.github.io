(function() {
    var container = document.getElementById('companyPage');

    // ===== 1. 公司元数据映射（短代码 → 中文名、英文名、Logo） =====
    var companyMeta = {
        'KK': { name: '纪云交通', name_en: 'Kikumo Transit', logo: 'images/kklogo.png' },
        'FZ': { name: '福竹公交', name_en: 'Fuzhu P.T.', logo: 'images/fzlogo.png' },
        'NT': { name: '城北客运', name_en: 'Chengbei P.T.', logo: 'images/bllogo.png' },
        'RW': { name: '澜海电铁', name_en: 'LanHai Rail Co., Ltd.', logo: 'images/rwlogo.png' }
        // 新增公司请在此添加
    };

    // ===== 2. 从 URL 获取 company 参数 =====
    var params = new URLSearchParams(window.location.search);
    var companyParam = params.get('company');

    if (!companyParam) {
        container.innerHTML = `
            <div class="not-found">
                <span class="big-icon">🤔</span>
                <h2>未指定公司</h2>
                <p>请通过 ?company=公司名 访问</p>
            </div>
        `;
        return;
    }

    // ===== 3. 加载 route.json =====
    fetch('RouteData/route.json')
        .then(function(response) {
            if (!response.ok) throw new Error('线路数据加载失败');
            return response.json();
        })
        .then(function(routes) {
            // 3.1 计算所有公司的整体状态（复用 main.js 的逻辑）
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

            // 3.2 确定要显示的公司
            var matchedCompany = null;
            var matchedShortCode = null;

            // 先尝试将 companyParam 当作中文名匹配
            for (var code in companyMeta) {
                if (companyMeta[code].name === companyParam) {
                    matchedShortCode = code;
                    matchedCompany = companyMeta[code];
                    break;
                }
            }
            // 如果没匹配到中文名，尝试当作短代码匹配
            if (!matchedCompany && companyMeta[companyParam]) {
                matchedShortCode = companyParam;
                matchedCompany = companyMeta[companyParam];
            }

            if (!matchedCompany) {
                container.innerHTML = `
                    <div class="not-found">
                        <span class="big-icon">😅</span>
                        <h2>公司不存在</h2>
                        <p>未找到名为 “${companyParam}” 的公司</p>
                    </div>
                `;
                return;
            }

            // 3.3 计算各公司状态（得到短代码 → 状态值）
            var computedStatus = calculateCompanyStatus(routes);
            var companyStatus = computedStatus[matchedShortCode];
            if (companyStatus === undefined) {
                // 如果该公司没有任何线路，则默认状态为 4（正常运行）
                companyStatus = 4;
            }

            // 3.4 过滤该公司的线路
            var companyRoutes = routes.filter(function(r) {
                return r.company === matchedShortCode;
            });

            // 3.5 渲染公司详情
            var statusMap = {
                0: { icon: 'images/status_0.png', text: '全线网停运' },
                1: { icon: 'images/status_1.png', text: '部分停运（组织调整）' },
                2: { icon: 'images/status_1.png', text: '部分停运（自然灾害）' },
                3: { icon: 'images/status_2.png', text: '晚点发生中' },
                4: { icon: 'images/status_3.png', text: '正常运行' },
                5: { icon: 'images/status_0.png', text: '全线停运' },
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
            var statusColorMap = {
                0: '#e74c3c',
                1: '#f39c12',
                2: '#f39c12',
                3: '#f1c40f',
                4: '#2ecc71',
                5: '#e74c3c',
                6: '#f39c12'
            };
            var statusInfo = statusMapCompany[companyStatus] || { icon: 'images/status_0.png', text: '未知状态' };
            var statusText = statusInfo.text;
            var statusColor = statusColorMap[companyStatus] || '#999';

            var html = `
                <div class="company-header">
                    <div class="company-logo">
                        <img src="${matchedCompany.logo || 'company-logo/default.png'}" alt="${matchedCompany.name}">
                    </div>
                    <div class="company-meta">
                        <h1>${matchedCompany.name}</h1>
                        <div class="company-en">${matchedCompany.name_en || ''}</div>
                    </div>
                    <div class="company-status-badge" style="background:#f1f1f1; display:flex; flex-direction:column; align-items:center; padding:8px 16px; border-radius:8px;border-bottom: 4px solid ${statusColor};">
                        <img src="${statusInfo.icon}" alt="${statusText}" style="width:52px; height:52px; display:block;">
                        <span style="font-size:14px; margin-top:4px; color:#676767; font-weight:bold;">${statusText}</span>
                    </div>
                </div>

                <div class="route-list">
                    <h2>运营线路（${companyRoutes.length} 条）</h2>
                    ${companyRoutes.length === 0 ? `
                        <p style="padding: 4px; color: #999; text-align:center;">暂无运营线路</p>
                    ` : `
                        <ul>
                            ${companyRoutes.map(function(r) {
                                var encodedLine = encodeURIComponent(r.line);
                                var statusInfoLine = statusMap[r.status] || { icon: '', text: '' };
                                var typeDisplay = r.type ? `<span class="route-type">${r.type}</span>` : '';
                                return `
                                    <li>
                                        <a href="lines.html?line=${encodedLine}" class="route-link">
                                            <span class="route-line">${r.line}路${typeDisplay}</span>
                                            <span class="route-stops">
                                                ${r.stops.join(' — ')}
                                                ${statusInfoLine.icon ? `<img src="${statusInfoLine.icon}" alt="${statusInfoLine.text}" style="width:20px; height:20px; margin-left:8px; vertical-align:middle;">` : ''}
                                                ${statusInfoLine.text ? `<span style="font-size:12px; color:#888; margin-left:4px;">${statusInfoLine.text}</span>` : ''}
                                            </span>
                                        </a>
                                    </li>
                                `;
                            }).join('')}
                        </ul>
                    `}
                </div>
            `;

            container.innerHTML = html;
        })
        .catch(function(error) {
            console.error('加载数据失败:', error);
            container.innerHTML = `
                <div class="not-found">
                    <span class="big-icon">⚠️</span>
                    <h2>数据加载失败</h2>
                    <p>请检查网络或数据文件</p>
                </div>
            `;
        });
})();