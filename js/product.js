// ===== 从 URL 获取项目名，默认 omsi =====
const params = new URLSearchParams(window.location.search);
const project = params.get('project') || 'omsi';

// ===== 根据 project 动态加载对应的 JSON =====
const jsonFile = `${project}_version.json`;

fetch(jsonFile)
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        const container = document.getElementById('content');
        let html = '';

        // 标题
        html += `<h1>${data.name}</h1>`;
        html += `<div class="subtitle">${data.description || ''}</div>`;

        // 基本信息
        html += `<h2>基本信息</h2>`;
        html += `<ul>`;
        html += `<li><span class="label">作者</span> ${data.author}</li>`;
        html += `<li><span class="label">协力</span> ${data.help}</li>`;
        html += `<li><span class="label">欢迎加入我们！`;
        if (data.website) {
            html += `<li><span class="label">网站</span> <a href="${data.website}" target="_blank">${data.website}</a></li>`;
        }
        html += `</ul>`;

        // 下载
        if (data.downloads && data.downloads.length) {
            html += `<h2>下载</h2>`;
            data.downloads.forEach(item => {
                let line = `<a href="${item.link}" target="_blank">${item.type}</a>`;
                if (item.extras) line += `　${item.extras}`;
                html += `<p>${line}</p>`;
            });
        }

        // 更新日志（表格）
        if (data.changelog && data.changelog.length) {
            html += `<h2>更新</h2>`;
            html += `<div class="table-wrapper">`;   // 新增包裹层
            html += `<table>`;
            html += `<tr><th>版本</th><th>更新内容</th></tr>`;
            data.changelog.forEach(item => {
                const dateStr = item.date ? `<span class="date-col">${item.date}</span>` : '';
                html += `<tr>
                    <td><span class="version-col">${item.version}</span> ${dateStr}</td>
                    <td>${item.details}</td>
                </tr>`;
            });
            html += `</table>`;
            html += `</div>`;  // 关闭包裹层
        }

        // 底部信息
        html += `<div class="sep"></div>`;
        html += `<p style="font-size:14px; color:#888;">关于本作品的详细说明、截图及开发进度，请关注后续更新。</p>`;
        let lastUpdated = '暂无更新记录';
        if (data.changelog && data.changelog.length > 0) {
            // 假设 changelog 按时间倒序排列（最新在前），取第一个
            lastUpdated = data.changelog[0].date || '暂无';
        }
        html += `<div class="footnote">最后更新：${lastUpdated}</div>`;

        container.innerHTML = html;
    })
    .catch(err => {
        document.getElementById('content').innerHTML = `<p style="color:red;">无法加载项目数据（${jsonFile}），请检查文件是否存在。</p>`;
        console.error('加载失败:', err);
    });