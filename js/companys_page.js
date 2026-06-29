(function() {
            var container = document.getElementById('companyPage');

            // 1. 从 URL 获取 company 参数
            var params = new URLSearchParams(window.location.search);
            var companyName = params.get('company');
            var companyCodeMap = {
                'KK': '纪云交通',
                'FZ': '福竹公交',
                'NT': '城北客运',
                'RW': '澜海电铁'
            };
            if (!companyName) {
                container.innerHTML = `
                    <div class="not-found">
                        <span class="big-icon">🤔</span>
                        <h2>未指定公司</h2>
                        <p>请通过 ?company=公司名 访问</p>
                    </div>
                `;
                return;
            }

            // 2. 并行加载两个数据文件
            Promise.all([
                fetch('RouteData/company_status.json').then(r => r.json()),
                fetch('RouteData/route.json').then(r => r.json())
            ])
            .then(function(dataArray) {
                var companies = dataArray[0];   // 公司状态列表
                var routes = dataArray[1];      // 线路列表

                // 3. 查找匹配的公司信息（匹配 name_cn 或 name_en，支持简写）
                var matchedCompany = companies.find(function(c) {
                    return c.name_cn === companyName;
                });

                if (!matchedCompany) {
                    container.innerHTML = `
                        <div class="not-found">
                            <span class="big-icon">😅</span>
                            <h2>公司不存在</h2>
                            <p>未找到名为 “${companyName}” 的公司</p>
                        </div>
                    `;
                    return;
                }

                // 4. 过滤出该公司的所有线路
                // 先通过映射表找出该中文名对应的短代码
                var shortCode = Object.keys(companyCodeMap).find(function(key) {
                    return companyCodeMap[key] === matchedCompany.name_cn;
                });

                // 然后用短代码去过滤线路
                var companyRoutes = routes.filter(function(r) {
                    return r.company === shortCode;
                });

                if (companyCodeMap[companyName]) {
                    companyName = companyCodeMap[companyName];
                }

                // 5. 渲染公司详情
                var statusMap = {
                0: { icon: 'images/status_0.png', text: '全线网停运' },
                1: { icon: 'images/status_1.png', text: '部分停运（组织调整）' },
                2: { icon: 'images/status_1.png', text: '部分停运（自然灾害）' },
                3: { icon: 'images/status_2.png', text: '晚点发生中' },
                4: { icon: 'images/status_3.png', text: '正常运行' },
                5: { icon: 'images/status_0.png', text: '全线停运' },
                6: { icon: 'images/status_1.png', text: '部分停运（事故发生）' }
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
                var status = matchedCompany.status;
                var statusText = statusMap[status] ? statusMap[status].text : '未知状态';
                var statusColor = statusColorMap[status] || '#999';

                var html = `

                    <div class="company-header">
                        <div class="company-logo">
                            <img src="${matchedCompany.logo || 'company-logo/default.png'}" alt="${matchedCompany.name_cn}">
                        </div>
                        <div class="company-meta">
                            <h1>${matchedCompany.name_cn}</h1>
                            <div class="company-en">${matchedCompany.name_en || ''}</div>
                        </div>
                        <div class="company-status-badge" style="background:#f1f1f1; display:flex; flex-direction:column; align-items:center; padding:8px 16px; border-radius:8px;border-bottom: 4px solid ${statusColor};">
                            <img src="${statusMap[status].icon}" alt="${statusText}" style="width:52px; height:52px; display:block;">
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
                                    var encodedLine = encodeURIComponent(r.line); // 对线路号进行 URL 编码
                                    return `
                                        <li>
                                            <a href="lines.html?line=${encodedLine}" class="route-link">
                                                <span class="route-line">${r.line}路</span>
                                                <span class="route-stops">${r.stops.join(' — ')}</span>
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