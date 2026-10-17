/* ===== Ats编辑器 · AI 编辑（GLM-4.7-Flash 驱动）=====
   直接读写当前项目 / 任意项目的文件：AI 输出结构化操作块，自动落盘保存。
   修改文件：===FILE: 路径=== 完整内容 ===END===
   新建文件夹：===FOLDER: 路径===    删除：===DELETE: 路径===
   依赖 app.js 全局：projects / currentProjectId / saveProjects / opfsWrite 等（本文件在 app.js 之后加载） */
(function () {
    'use strict';

    var AI_API_BASE = 'https://open.bigmodel.cn/api/paas/v4/';
    var AI_API = AI_API_BASE + 'chat/completions';
    var AI_MODEL = 'glm-4.7-flash';           /* 免费模型，输入输出均免费（200K 上下文） */
    var AI_KEY_STORE = 'ats_ai_glm_key_v2';    /* 加密存储（XOR+Base64 混淆，非明文） */
    var AI_KEY_LEGACY = 'ats_ai_glm_key';      /* 旧明文键：检测到自动迁移加密 */
    var AI_KEY_DEFAULT = '3ccd2612f0094a03b0ef5d2f7a728b54.kDFPIiW9v1n6dg74';
    var KEY_OBF = 'ats2026glmx';
    function obfKey(s) {
        var out = '';
        for (var i = 0; i < s.length; i++) out += String.fromCharCode(s.charCodeAt(i) ^ KEY_OBF.charCodeAt(i % KEY_OBF.length));
        try { return btoa(unescape(encodeURIComponent(out))); } catch (e) { return ''; }
    }
    function deobfKey(s) {
        try {
            var bin = decodeURIComponent(escape(atob(s)));
            var out = '';
            for (var i = 0; i < bin.length; i++) out += String.fromCharCode(bin.charCodeAt(i) ^ KEY_OBF.charCodeAt(i % KEY_OBF.length));
            return out;
        } catch (e) { return ''; }
    }
    var AI_MODEL_STORE = 'ats_ai_model';

    /* 智谱 GLM 免费 API 模型清单（2026-10-17，用户提供 xlsx + 官方定价页核对） */
    var AI_MODELS = [
        { id: 'glm-4.7-flash',           type: 'chat',  label: 'GLM-4.7-Flash',           use: '文本对话 · 200K',        note: '✅ 已验证' },
        { id: 'glm-z1-flash',            type: 'chat',  label: 'GLM-Z1-Flash',            use: '文本推理 · 带思考过程',   note: '✅ 已验证' },
        { id: 'glm-4-flash-250414',      type: 'chat',  label: 'GLM-4-Flash-250414',      use: '文本轻量 · 响应快',      note: '✅ 已验证' },
        { id: 'glm-4.6v-flash',          type: 'chat',  label: 'GLM-4.6V-Flash',          use: '视觉理解 · 看图问答',     note: '⚠️ 高峰限流' },
        { id: 'glm-4.1v-thinking-flash', type: 'chat',  label: 'GLM-4.1V-Thinking-Flash', use: '视觉推理 · 带思考',       note: '免费' },
        { id: 'glm-4v-flash',            type: 'chat',  label: 'GLM-4V-Flash',            use: '视觉理解 · 轻量',         note: '免费' },
        { id: 'cogview-3-flash',         type: 'image', label: 'CogView-3-Flash',         use: '文生图',                 note: '✅ 已验证' },
        { id: 'cogvideox-flash',         type: 'video', label: 'CogVideoX-Flash',         use: '文生视频 · 异步',         note: '免费' }
    ];

    var CTX_PER_FILE = 20000;                 /* 单文件上下文截断（字符） */
    var CTX_TOTAL = 120000;                   /* 全部文件内容总预算（字符） */
    var HISTORY_KEEP = 14;                    /* 多轮对话保留条数（不含 system） */

    var aiOverlay = null;
    var aiMsgsEl = null;
    var aiInputEl = null;
    var aiProjSel = null;
    var aiSendBtn = null;
    var aiStopBtn = null;
    var aiBusy = false;
    var aiAbort = null;
    var aiHistory = [];                       /* {role, content}，不含 system（system 每次按最新文件重建） */
    var aiLastProjId = null;

    function getKey() {
        try {
            var v = localStorage.getItem(AI_KEY_STORE);
            if (v) { var d = deobfKey(v); if (d) return d; }
            var legacy = localStorage.getItem(AI_KEY_LEGACY);
            if (legacy) {  /* 旧明文自动迁移为加密存储 */
                localStorage.setItem(AI_KEY_STORE, obfKey(legacy));
                localStorage.removeItem(AI_KEY_LEGACY);
                return legacy;
            }
        } catch (e) {}
        return AI_KEY_DEFAULT;
    }
    function isCustomKey() {
        try { return !!localStorage.getItem(AI_KEY_STORE) || !!localStorage.getItem(AI_KEY_LEGACY); } catch (e) { return false; }
    }
    /* ---------- 默认模型（localStorage 持久化） ---------- */
    function getModelId() {
        try { return localStorage.getItem(AI_MODEL_STORE) || AI_MODEL; } catch (e) { return AI_MODEL; }
    }
    function setModelId(id) {
        try { localStorage.setItem(AI_MODEL_STORE, id); } catch (e) {}
    }
    function findModel(id) {
        for (var i = 0; i < AI_MODELS.length; i++) if (AI_MODELS[i].id === id) return AI_MODELS[i];
        return null;
    }
    function currentModel() {
        var m = findModel(getModelId());
        return (m && m.type === 'chat') ? m : findModel(AI_MODEL);
    }
    function refreshModelBadge() {
        if (!aiOverlay) return;
        var btn = aiOverlay.querySelector('#aiModelBtn');
        var m = findModel(getModelId()) || findModel(AI_MODEL);
        if (btn) btn.textContent = (m ? m.label : AI_MODEL) + ' ▾';
    }
    /* ZIP 风格模型下拉菜单：点击出现下方菜单，点选即设为默认 */
    function toggleModelMenu() {
        var menu = aiOverlay.querySelector('#aiModelMenu');
        var pop = aiOverlay.querySelector('#aiKeyPop');
        var show = menu.style.display !== 'block';
        pop.style.display = 'none';
        menu.style.display = show ? 'block' : 'none';
        if (show) renderModelMenu();
    }
    function renderModelMenu() {
        var menu = aiOverlay.querySelector('#aiModelMenu');
        if (!menu) return;
        var cur = getModelId();
        var groups = [
            { title: '💬 ' + t('对话模型'), types: ['chat'] },
            { title: '🎨 ' + t('生成模型'), types: ['image', 'video'] }
        ];
        var html = '';
        groups.forEach(function (g) {
            html += '<div class="ai-mm-group">' + g.title + '</div>';
            AI_MODELS.forEach(function (m) {
                if (g.types.indexOf(m.type) === -1) return;
                html += '<button class="ai-mm-item' + (m.id === cur ? ' on' : '') + '" data-model="' + m.id + '">' +
                    '<span class="ai-mm-label">' + m.label + (m.id === cur ? ' ✓' : '') + '</span>' +
                    '<span class="ai-mm-use">' + t(m.use) + ' · ' + t(m.note) + '</span></button>';
            });
        });
        menu.innerHTML = html;
        Array.prototype.forEach.call(menu.querySelectorAll('.ai-mm-item'), function (b) {
            b.addEventListener('click', function () {
                setModelId(b.getAttribute('data-model'));
                refreshModelBadge();
                menu.style.display = 'none';
                showToast(t('已切换默认模型') + ' · ' + (findModel(getModelId()) || {}).label);
            });
        });
    }
    /* 刷新 Key 设置弹层：默认 Key 永不回显，输入框仅在有自定义 Key 时填入 */
    function refreshKeyPop() {
        if (!aiOverlay) return;
        var inp = aiOverlay.querySelector('#aiKeyInput');
        var st = aiOverlay.querySelector('#aiKeyStatus');
        var custom = isCustomKey();
        var customVal = custom ? getKey() : '';   /* 默认 Key 永不回显 */
        inp.value = customVal;
        inp.placeholder = custom ? t('已使用自定义 Key，可修改后保存') : t('填写你的 API Key（不显示默认）');
        st.textContent = t('当前使用') + ' · ' + (custom ? t('自定义 Key') : t('默认 Key（内置）')) +
            ' · ' + t('默认模型') + '：' + (findModel(getModelId()) || {}).label;
        st.className = 'ai-key-status' + (custom ? ' custom' : '');
    }
    function t(s) { try { return L(s); } catch (e) { return s; } }

    /* ---------- 面板 DOM（动态构建，风格与源码编辑器一致） ---------- */
    function buildPanel() {
        if (aiOverlay) return;
        aiOverlay = document.createElement('div');
        aiOverlay.id = 'aiEditOverlay';
        aiOverlay.className = 'ai-overlay';
        aiOverlay.innerHTML =
            '<div class="ai-panel">' +
              '<div class="ai-head">' +
                '<span class="ai-title"><svg viewBox="0 0 24 24" style="width:16px;height:16px;vertical-align:-3px;"><path d="M12 2l2.1 5.9L20 10l-5.9 2.1L12 18l-2.1-5.9L4 10l5.9-2.1L12 2zM19.5 15.2l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" fill="#c084fc"/></svg> ' +
                  t('AI 编辑') + ' <button class="ai-model-badge" id="aiModelBtn" title="' + t('选择默认模型') + '">GLM-4.7-Flash ▾</button></span>' +
                '<span class="ai-head-btns">' +
                  '<select class="ai-proj-sel" id="aiProjectSel" title="' + t('选择要编辑的项目') + '"></select>' +
                  '<button class="ai-icon-btn" id="aiKeyBtn" title="API Key">🔑</button>' +
                  '<button class="ai-icon-btn" id="aiClearBtn" title="' + t('清空对话') + '">🧹</button>' +
                  '<button class="ai-x" id="aiCloseBtn" title="' + t('关闭') + '">✕</button>' +
                '</span>' +
              '</div>' +
              '<input type="file" id="aiFileInput" multiple style="display:none">' +
              '<input type="file" id="aiImageInput" accept="image/*" style="display:none">' +
              '<div class="ai-msgs" id="aiMsgs"></div>' +
              '<div class="ai-model-menu" id="aiModelMenu" style="display:none"></div>' +
              '<div class="ai-key-pop" id="aiKeyPop" style="display:none">' +
                '<div class="ai-key-row"><input type="text" id="aiKeyInput" autocomplete="off" spellcheck="false" placeholder=""></div>' +
                '<div class="ai-key-status" id="aiKeyStatus"></div>' +
                '<div class="ai-key-btns">' +
                  '<button class="ai-key-btn" id="aiKeyDefaultBtn">' + t('使用默认') + '</button>' +
                  '<button class="ai-key-btn go" id="aiKeySaveBtn">' + t('保存') + '</button>' +
                '</div>' +
                '<div class="ai-key-tip">' + t('默认 Key 已内置可用；填写自定义 Key 后优先使用，点击「使用默认」即恢复内置 Key。') + '</div>' +
              '</div>' +
              '<div class="ai-attach-bar" id="aiAttachBar"></div>' +
              '<div class="ai-input-row">' +
                '<div class="ai-plus-wrap">' +
                  '<button class="ai-plus" id="aiPlusBtn" title="' + t('上传图片 / 文件给 AI') + '">＋</button>' +
                  '<div class="ai-plus-menu" id="aiPlusMenu" style="display:none">' +
                    '<button class="ai-mm-item" id="aiUpImg">🖼 ' + t('上传图片') + '</button>' +
                    '<button class="ai-mm-item" id="aiUpFile">📄 ' + t('上传文件') + '</button>' +
                  '</div>' +
                '</div>' +
                '<textarea id="aiInput" rows="2" spellcheck="false" placeholder="' + t('描述你的修改需求，例如：给 hello.html 加一个深色模式切换按钮…') + '"></textarea>' +
                '<div class="ai-send-col">' +
                  '<button class="ai-send" id="aiSendBtn">' + t('发送') + '</button>' +
                  '<button class="ai-stop" id="aiStopBtn" style="display:none">' + t('停止') + '</button>' +
                '</div>' +
              '</div>' +
            '</div>';
        document.body.appendChild(aiOverlay);
        aiMsgsEl = aiOverlay.querySelector('#aiMsgs');
        aiInputEl = aiOverlay.querySelector('#aiInput');
        aiProjSel = aiOverlay.querySelector('#aiProjectSel');
        aiSendBtn = aiOverlay.querySelector('#aiSendBtn');
        aiStopBtn = aiOverlay.querySelector('#aiStopBtn');

        aiOverlay.querySelector('#aiCloseBtn').addEventListener('click', closeAiPanel);
        aiOverlay.querySelector('#aiClearBtn').addEventListener('click', function () {
            aiHistory = []; renderWelcome(); showToast(t('对话已清空'));
        });
        aiOverlay.querySelector('#aiKeyBtn').addEventListener('click', function () {
            var pop = aiOverlay.querySelector('#aiKeyPop');
            var menu = aiOverlay.querySelector('#aiModelMenu');
            var show = pop.style.display !== 'block';
            menu.style.display = 'none';
            pop.style.display = show ? 'block' : 'none';
            if (show) refreshKeyPop();
        });
        aiOverlay.querySelector('#aiModelBtn').addEventListener('click', function () {
            aiOverlay.querySelector('#aiKeyPop').style.display = 'none';
            toggleModelMenu();
        });
        var plusMenu = aiOverlay.querySelector('#aiPlusMenu');
        aiOverlay.querySelector('#aiPlusBtn').addEventListener('click', function (e) {
            if (e) e.stopPropagation();
            aiOverlay.querySelector('#aiKeyPop').style.display = 'none';
            aiOverlay.querySelector('#aiModelMenu').style.display = 'none';
            plusMenu.style.display = plusMenu.style.display === 'block' ? 'none' : 'block';
        });
        aiOverlay.querySelector('#aiUpImg').addEventListener('click', function () {
            plusMenu.style.display = 'none';
            aiOverlay.querySelector('#aiImageInput').click();
        });
        aiOverlay.querySelector('#aiUpFile').addEventListener('click', function () {
            plusMenu.style.display = 'none';
            aiOverlay.querySelector('#aiFileInput').click();
        });
        aiOverlay.querySelector('#aiImageInput').addEventListener('change', function () {
            var f = this.files && this.files[0];
            this.value = '';
            if (!f) return;
            if (f.size > 8 * 1024 * 1024) { showToast(t('图片过大（超 8MB）')); return; }
            readFileAsDataURL(f).then(function (durl) {
                pendingImage = { dataURL: durl, name: f.name };
                renderAttachBar();
                showToast(t('图片已附加，输入想问的内容后发送'));
            }).catch(function () { showToast(t('读取失败')); });
        });
        aiOverlay.querySelector('#aiFileInput').addEventListener('change', function () {
            var files = this.files;
            this.value = '';
            if (!files) return;
            Array.prototype.forEach.call(files, function (f) {
                if (isBinaryName(f.name)) { showToast(t('该类型无法读取文本') + '：' + f.name + t('（图片请选上传图片）')); return; }
                if (f.size > 200 * 1024) { showToast(t('文件过大（超 200KB）') + '：' + f.name); return; }
                readFileAsText(f).then(function (txt) {
                    pendingFiles.push({ name: f.name, text: String(txt).slice(0, 80000) });
                    renderAttachBar();
                    showToast(t('已附加') + '：' + f.name);
                }).catch(function () { showToast(t('读取失败')); });
            });
        });
        document.addEventListener('click', function (e) {
            if (!plusMenu) return;
            if (plusMenu.style.display === 'block' && !plusMenu.contains(e.target) && e.target.id !== 'aiPlusBtn') plusMenu.style.display = 'none';
        });
        aiOverlay.querySelector('#aiKeySaveBtn').addEventListener('click', function () {
            var v = (aiOverlay.querySelector('#aiKeyInput').value || '').trim();
            try {
                if (v) {
                    localStorage.setItem(AI_KEY_STORE, obfKey(v));
                    localStorage.removeItem(AI_KEY_LEGACY);
                    showToast(t('API Key 已更新') + '（' + t('自定义') + '）');
                } else {
                    localStorage.removeItem(AI_KEY_STORE);
                    localStorage.removeItem(AI_KEY_LEGACY);
                    showToast(t('API Key 已更新') + '（' + t('默认') + '）');
                }
            } catch (e) {}
            refreshKeyPop();
        });
        aiOverlay.querySelector('#aiKeyDefaultBtn').addEventListener('click', function () {
            try { localStorage.removeItem(AI_KEY_STORE); localStorage.removeItem(AI_KEY_LEGACY); } catch (e) {}
            aiOverlay.querySelector('#aiKeyInput').value = '';
            showToast(t('API Key 已更新') + '（' + t('默认') + '）');
            refreshKeyPop();
        });
        aiProjSel.addEventListener('change', function () {
            if (aiLastProjId !== aiProjSel.value) { aiHistory = []; renderWelcome(); }
            aiLastProjId = aiProjSel.value;
        });
        aiSendBtn.addEventListener('click', aiSend);
        aiStopBtn.addEventListener('click', function () { if (aiAbort) aiAbort.abort(); });
        aiInputEl.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); aiSend(); }
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && aiOverlay && aiOverlay.style.display === 'flex') closeAiPanel();
        });
    }

    function fillProjectSelect() {
        aiProjSel.innerHTML = '';
        (projects || []).forEach(function (p) {
            var o = document.createElement('option');
            o.value = p.id;
            o.textContent = p.name || p.id;
            aiProjSel.appendChild(o);
        });
        /* 特殊目标：编辑编辑器自身源码 / 文件仓库 */
        var oSrc = document.createElement('option');
        oSrc.value = '__src__';
        oSrc.textContent = '🛠 ' + t('编辑源码（修改编辑器本身，重启生效）');
        aiProjSel.appendChild(oSrc);
        var oRepo = document.createElement('option');
        oRepo.value = '__repo__';
        oRepo.textContent = '🗄 ' + t('文件仓库（AI 可编辑仓库文本，生成物存这里）');
        aiProjSel.appendChild(oRepo);
        var cur = currentProjectId && (projects || []).some(function (p) { return p.id === currentProjectId; });
        aiProjSel.value = cur ? currentProjectId : ((projects || [])[0] || {}).id || '';
        aiLastProjId = aiProjSel.value;
    }
    function isSrcMode() { return aiProjSel && aiProjSel.value === '__src__'; }
    function isRepoMode() { return aiProjSel && aiProjSel.value === '__repo__'; }

    /* ---------- 仓库模式：AI 读写文件仓库中的文本文件（HTML/JS/CSS 等），图片/视频等二进制仅列出 ---------- */
    function isRepoTextFile(f) {
        if (f.isImage || f.isAudio) return false;
        var mime = f.mime || '';
        if (/^(image|audio|video)\//i.test(mime)) return false;
        try { if (typeof isTextFile === 'function') return isTextFile({ name: f.name, type: mime }); } catch (e) {}
        return /\.(html?|xhtml|css|js|mjs|json|txt|md|svg|xml|csv|yml|yaml)$/i.test(f.name || '');
    }
    async function getRepoText(f) {
        try {
            var file = await opfsRead(REPO_SCOPE, f.id);
            return await file.text();
        } catch (e) { return ''; }
    }
    async function buildRepoSystemPrompt() {
        var items = (typeof repoFiles !== 'undefined' ? repoFiles : []).slice();
        if (!items.length) {
            return t('你是 Ats编辑器 的 AI 助手。当前目标：文件仓库（当前为空）。用户生成的图片/视频会自动存入仓库；仓库中暂无可编辑的文本文件。');
        }
        var list = [], binaries = [];
        items.forEach(function (f) {
            if (isRepoTextFile(f)) list.push('  [文件] ' + f.name);
            else binaries.push(f.name + (f.isImage ? '（' + t('图片') + '）' : f.isAudio ? '（' + t('音频') + '）' : ''));
        });
        var ctx = '';
        var used = 0;
        for (var i = 0; i < items.length; i++) {
            var f = items[i];
            if (!isRepoTextFile(f)) continue;
            if (used >= CTX_TOTAL) { ctx += '\n----- ' + f.name + ' -----\n' + t('（上下文预算已用完，内容省略）') + '\n'; continue; }
            var text = await getRepoText(f);
            if (!text) continue;
            var budget = Math.min(CTX_PER_FILE, CTX_TOTAL - used);
            var truncated = false;
            if (text.length > budget) { text = text.slice(0, budget); truncated = true; }
            used += text.length;
            ctx += '\n----- ' + t('文件') + '：' + f.name + ' -----\n' + text + (truncated ? '\n' + t('（…内容过长已截断）') : '') + '\n----- ' + t('结束') + '：' + f.name + ' -----';
        }
        if (!ctx) ctx = '\n' + t('（仓库中暂无文本文件内容）');
        return t('你是 Ats编辑器 的 AI 助手。当前目标：文件仓库——里面是用户存放的文件。文本文件（HTML/CSS/JS/JSON 等）你可以直接读取和修改；图片/视频/音频等二进制文件仅列出，无法编辑。') +
            '\n\n' + t('【仓库文件清单】') + '\n' + (list.join('\n') || ('  ' + t('（无文本文件）'))) +
            (binaries.length ? ('\n  ' + t('二进制文件（仅列出）：') + binaries.join('、')) : '') +
            '\n\n' + t('【文件内容】') + ctx +
            '\n\n' + t('【仓库操作规则——必须严格遵守】') + '\n' +
            t('1. 修改或新建仓库文本文件，输出操作块（内容必须是完整文件）：\n===FILE: 文件名===\n完整的新文件内容\n===END===') + '\n' +
            t('2. 从仓库删除文件：===DELETE: 文件名===') + '\n' +
            t('3. 用户生成的图片/视频会自动存入仓库，无需你操作。') + '\n' +
            t('4. 仓库中的文件没有文件夹层级，路径就是文件名。') + '\n' +
            t('5. 可以在一次回复中输出多个操作块，同时修改多个文件。') + '\n' +
            t('6. 操作块之外，用简洁的语言说明你做了什么；无法完成的请求直接说明原因，不要伪造操作块。') + '\n' +
            t('【输出示例（格式必须完全一致，禁止用 Markdown 代码块 ``` 代替操作块）】') + '\n' +
            t('好的。\n===FILE: page.html===\n<h1>新内容</h1>\n===END===\n已修改 page.html。');
    }
    /* 仓库模式应用操作块：读写 REPO_SCOPE（按文件名匹配） */
    async function applyRepoOps(ops) {
        var applied = [], skipped = [];
        for (var i = 0; i < ops.length; i++) {
            var op = ops[i];
            var name = normalizePath(op.path);
            if (op.op === 'folder') { skipped.push(name + '（' + t('仓库不支持文件夹') + '）'); continue; }
            var hit = (typeof repoFiles !== 'undefined' ? repoFiles : []).find(function (f) { return f.name === name; }) ||
                      (typeof repoFiles !== 'undefined' ? repoFiles : []).find(function (f) { return f.name.toLowerCase() === name.toLowerCase(); });
            try {
                if (op.op === 'file') {
                    if (hit && !isRepoTextFile(hit)) { skipped.push(name + '（' + t('二进制文件，无法编辑') + '）'); continue; }
                    var blob = new Blob([op.content], { type: (hit && hit.mime) || 'text/plain;charset=utf-8' });
                    if (!hit) {
                        var id = genId('repo');
                        await opfsWrite(REPO_SCOPE, id, blob);
                        repoFiles.push({ id: id, name: name, originalName: name, mime: 'text/plain;charset=utf-8', size: blob.size, isImage: false, isAudio: false, uploaded: Date.now() });
                        applied.push('🆕 ' + name);
                    } else {
                        await opfsWrite(REPO_SCOPE, hit.id, blob);
                        hit.size = blob.size;
                        applied.push('✏️ ' + name);
                    }
                } else if (op.op === 'patch') {
                    if (!hit) { skipped.push(name + '（' + t('未找到') + '）'); continue; }
                    var full = await getRepoText(hit);
                    if (!full) { skipped.push(name + '（' + t('无法读取文件内容') + '）'); continue; }
                    var r = applyPatchToText(full, parsePatchUnits(op.content));
                    if (r.applied) {
                        var blob2 = new Blob([r.text], { type: hit.mime || 'text/plain;charset=utf-8' });
                        await opfsWrite(REPO_SCOPE, hit.id, blob2);
                        hit.size = blob2.size;
                        applied.push('🩹 ' + name + '（' + r.applied + ' ' + t('处') + '）');
                    }
                    if (r.failed.length) skipped.push(name + '：' + r.failed.length + ' ' + t('处原文未匹配') + ' → ' + r.failed[0]);
                } else if (op.op === 'delete') {
                    if (!hit) { skipped.push(name + '（' + t('未找到') + '）'); continue; }
                    try { opfsDelete(REPO_SCOPE, hit.id); } catch (e) {}
                    var idx = repoFiles.findIndex(function (f) { return f.id === hit.id; });
                    if (idx > -1) repoFiles.splice(idx, 1);
                    applied.push('🗑 ' + name);
                }
            } catch (e) { skipped.push(name + '：' + (e && e.message)); }
        }
        try { if (typeof saveRepoMeta === 'function') saveRepoMeta(); } catch (e) {}
        try { if (typeof renderRepoList === 'function' && document.getElementById('repoViewer').style.display === 'flex') renderRepoList(); } catch (e) {}
        return { applied: applied, skipped: skipped };
    }

    /* ---------- 源码模式：AI 修改 Ats编辑器 自身源码（ats_src 覆盖存储，重启生效） ---------- */
    var _srcOrig = {};
    function srcFileList() {
        try { if (typeof SRC_FILES !== 'undefined' && SRC_FILES.length) return SRC_FILES.slice(); } catch (e) {}
        return ['index.html', 'css/style.css', 'css/ai-edit.css', 'js/app.js', 'js/ai-edit.js', 'data/zh.json', 'data/en.json'];
    }
    async function getSrcText(path) {
        var store = {};
        try { store = typeof srcGetStore === 'function' ? srcGetStore() : {}; } catch (e) {}
        if (store[path] !== undefined) return store[path];
        if (_srcOrig[path] !== undefined) return _srcOrig[path];
        try {
            var r = await fetch(path, { cache: 'no-store' });
            var t9 = await r.text();
            _srcOrig[path] = t9;
            return t9;
        } catch (e) { return ''; }
    }
    async function buildSrcSystemPrompt() {
        var files = srcFileList();
        var store = {};
        try { store = typeof srcGetStore === 'function' ? srcGetStore() : {}; } catch (e) {}
        var list = files.map(function (p) {
            return '  [文件] ' + p + (store[p] !== undefined ? (' · ' + t('已修改')) : '');
        }).join('\n');
        var ctx = '';
        var used = 0;
        for (var i = 0; i < files.length; i++) {
            var p = files[i];
            var text = await getSrcText(p);
            if (!text) continue;
            if (used >= CTX_TOTAL) { ctx += '\n----- ' + p + ' -----\n' + t('（上下文预算已用完，内容省略）') + '\n'; continue; }
            var budget = Math.min(CTX_PER_FILE, CTX_TOTAL - used);
            var truncated = false;
            if (text.length > budget) { text = text.slice(0, budget); truncated = true; }
            used += text.length;
            ctx += '\n----- ' + t('文件') + '：' + p + '（' + t('共') + ' ' + (store[p] !== undefined ? store[p].length : _srcOrig[p] ? _srcOrig[p].length : 0) + ' ' + t('字符') + '）-----\n' + text + (truncated ? '\n' + t('（…内容过长已截断）') : '') + '\n----- ' + t('结束') + '：' + p + ' -----';
        }
        return t('你是 Ats编辑器（一个纯前端网页代码编辑器）的源码 AI 助手。你正在修改编辑器自身的源码：用户描述想要的功能或修改，你直接改源码实现，保存后用户重启页面即可生效。') +
            '\n\n' + t('【源码文件清单】') + '\n' + list +
            '\n\n' + t('【文件内容】') + ctx +
            '\n\n' + t('【源码修改规则——必须严格遵守】') + '\n' +
            t('1. 只能修改上面清单中的文件，输出操作块：\n===FILE: 文件名===\n完整的新文件内容\n===END===') + '\n' +
            t('2. 内容被标记（…内容过长已截断）的大文件，禁止用 ===FILE:=== 全量重写（会丢失未展示的部分），必须用增量补丁：\n===PATCH: 文件名===\n<<<<\n文件中一段需要修改的原文（必须与文件内容完全一致）\n>>>>\n替换后的新内容\n====\n（<<<< / >>>> / ==== 可重复多组：<<<< 到 >>>> 之间是原文，>>>> 到 ==== 之间是替换内容）') + '\n' +
            t('3. 完整展示（未截断）的文件优先用 ===FILE:=== 全量输出，更可靠。') + '\n' +
            t('4. ===DELETE: 文件名=== 表示恢复该文件的原始版本（清除覆盖）。') + '\n' +
            t('5. 修改完成后提醒用户：点击重启按钮或刷新页面后生效。') + '\n' +
            t('6. 可以在一次回复中输出多个操作块，同时修改多个文件。') + '\n' +
            t('【输出示例（格式必须完全一致，禁止用 Markdown 代码块 ``` 代替操作块）】') + '\n' +
            t('好的，我来修改。\n===PATCH: js/app.js===\n<<<<\n需要修改的原文一行\n>>>>\n替换后的一行\n====\n===END===\n已修改 js/app.js，重启页面后生效。') + '\n' +
            t('7. 操作块之外，用简洁的语言说明你做了什么；无法完成的请求直接说明原因，不要伪造操作块。');
    }
    /* 解析 PATCH 块内的补丁单元：<<<< 原文 >>>> 新内容 ====（可多组）；全空行单元忽略 */
    function patchUnitEmpty(u) {
        return !(u.old.join('') || u.new.join(''));
    }
    function parsePatchUnits(body) {
        var units = [], cur = { old: [], new: [], phase: 'old' };
        body.split('\n').forEach(function (l) {
            var t8 = l.trim();
            if (t8 === '<<<<') {
                if (cur.old.length || cur.new.length) { if (!patchUnitEmpty(cur)) units.push(cur); cur = { old: [], new: [], phase: 'old' }; }
                cur.phase = 'old';
            } else if (t8 === '>>>>') {
                cur.phase = 'new';
            } else if (t8 === '====') {
                if (cur.old.length || cur.new.length) { if (!patchUnitEmpty(cur)) units.push(cur); cur = { old: [], new: [], phase: 'old' }; }
            } else {
                (cur.phase === 'old' ? cur.old : cur.new).push(l);
            }
        });
        if ((cur.old.length || cur.new.length) && !patchUnitEmpty(cur)) units.push(cur);
        return units;
    }
    function applyPatchToText(text, units) {
        var applied = 0, failed = [];
        units.forEach(function (u) {
            var oldStr = u.old.join('\n');
            var newStr = u.new.join('\n');
            if (!oldStr) { if (newStr) text = text + '\n' + newStr; applied++; return; }
            if (text.indexOf(oldStr) !== -1) { text = text.replace(oldStr, function () { return newStr; }); applied++; }
            else failed.push(oldStr.slice(0, 60));
        });
        return { text: text, applied: applied, failed: failed };
    }
    /* 源码模式应用操作块：写 ats_src 覆盖存储（async：需读取文件原文） */
    async function applySrcOps(ops) {
        var applied = [], skipped = [], rejectedBig = [];
        var store = {};
        try { store = typeof srcGetStore === 'function' ? srcGetStore() : {}; } catch (e) {}
        var files = srcFileList();
        for (var i = 0; i < ops.length; i++) {
            var op = ops[i];
            var clean = normalizePath(op.path);
            if (files.indexOf(clean) === -1) { skipped.push(clean + '（' + t('不在源码清单中') + '）'); continue; }
            try {
                if (op.op === 'file') {
                    var orig = await getSrcText(clean);
                    if (orig && orig.length > CTX_PER_FILE) {
                        rejectedBig.push(clean);
                        skipped.push(clean + '（' + t('文件过大，禁止全量重写，必须用 ===PATCH:=== 增量修改') + '）');
                        continue;
                    }
                    store[clean] = op.content;
                    applied.push('✏️ ' + clean);
                } else if (op.op === 'patch') {
                    var full = await getSrcText(clean);
                    if (!full) { skipped.push(clean + '（' + t('无法读取文件内容') + '）'); continue; }
                    var r = applyPatchToText(full, parsePatchUnits(op.content));
                    if (r.applied) { store[clean] = r.text; applied.push('🩹 ' + clean + '（' + r.applied + ' ' + t('处') + '）'); }
                    if (r.failed.length) skipped.push(clean + '：' + r.failed.length + ' ' + t('处原文未匹配') + ' → ' + r.failed[0]);
                } else if (op.op === 'delete') {
                    delete store[clean];
                    applied.push('↩ ' + clean + '（' + t('恢复默认') + '）');
                }
            } catch (e) { skipped.push(clean + '：' + (e && e.message)); }
        }
        try { if (typeof srcSetStore === 'function') srcSetStore(store); } catch (e) {}
        return { applied: applied, skipped: skipped, rejectedBig: rejectedBig };
    }
    /* ⧉ 复制 AI 回答（含 fallback：clipboard API 不可用时走 execCommand） */
    function addCopyRow(bubble, text) {
        var row = document.createElement('div');
        row.className = 'ai-save-row';
        var b = document.createElement('button');
        b.className = 'ai-save-btn';
        b.textContent = '⧉ ' + t('复制回答');
        b.addEventListener('click', function () {
            function done() { showToast(t('已复制')); b.textContent = '✓ ' + t('已复制'); }
            function fallback() {
                try {
                    var ta = document.createElement('textarea');
                    ta.value = text;
                    ta.style.position = 'fixed'; ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    ta.remove();
                    done();
                } catch (e) { showToast(t('复制失败')); }
            }
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
            else fallback();
        });
        row.appendChild(b);
        bubble.appendChild(row);
        if (aiMsgsEl) aiMsgsEl.scrollTop = aiMsgsEl.scrollHeight;
    }

    /* 源码模式：重启生效按钮 */
    function addRestartRow(bubble) {
        var row = document.createElement('div');
        row.className = 'ai-save-row';
        var b = document.createElement('button');
        b.className = 'ai-save-btn go';
        b.textContent = '🔄 ' + t('重启页面生效');
        b.addEventListener('click', function () {
            try { if (typeof refreshPage === 'function') refreshPage(); else location.reload(); } catch (e) { location.reload(); }
        });
        row.appendChild(b);
        bubble.appendChild(row);
        if (aiMsgsEl) aiMsgsEl.scrollTop = aiMsgsEl.scrollHeight;
    }

    window.openAiPanel = function () {
        try { closeToolsMenu(); } catch (e) {}
        try { closeZipMenu(); } catch (e) {}
        buildPanel();
        fillProjectSelect();
        refreshModelBadge();
        if (!aiHistory.length) renderWelcome();
        aiOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        setTimeout(function () { aiInputEl.focus(); }, 60);
    };
    window.closeAiPanel = function () {
        if (!aiOverlay) return;
        aiOverlay.style.display = 'none';
        document.body.style.overflow = '';
    };
    window.onToolsAiEdit = function (e) {
        if (e) e.stopPropagation();
        openAiPanel();
    };

    function getSelectedProject() {
        return (projects || []).find(function (p) { return p.id === aiProjSel.value; }) || null;
    }

    function renderWelcome() {
        var proj = getSelectedProject();
        aiMsgsEl.innerHTML = '';
        /* AI 自动发送的第一条使用引导（按当前语言切换指令示例） */
        var isEn = (typeof LANG !== 'undefined' && LANG === 'en');
        var imgCmd = isEn ? 'Generate a picture: a cyberpunk orange cat' : '生成一个图片:赛博朋克风格的橘猫';
        var vidCmd = isEn ? 'Generate a video: waves crashing on rocks' : '生成一个视频:海浪拍打礁石';
        var w = document.createElement('div');
        w.className = 'ai-msg ai-msg-assistant ai-msg-guide';
        w.innerHTML =
            '👋 ' + t('你好！我是 AI 编辑助手（默认 GLM-4.7-Flash，全部免费）。') + '<br><br>' +
            t('我可以直接修改你项目里的文件：改代码、修 Bug、新建文件/文件夹，改完自动保存，重新进入项目就是最新内容。') + '<br><br>' +
            '🎨 <b>' + t('生成图片') + '</b>：' + t('发送') + ' <code>' + imgCmd + '</code><br>' +
            '&nbsp;&nbsp;&nbsp;' + t('用免费的 CogView-3-Flash 出图，自动存入项目，可直接使用。') + '<br><br>' +
            '🎬 <b>' + t('生成视频') + '</b>：' + t('发送') + ' <code>' + vidCmd + '</code><br>' +
            '&nbsp;&nbsp;&nbsp;' + t('用免费的 CogVideoX-Flash 生成视频（异步需要等待约1-3分钟），自动存入项目。') + '<br><br>' +
            '🤖 <b>' + t('其他任务') + '</b>：' + t('直接描述需求即可；点击顶部模型按钮可切换 8 个免费模型。') + '<br><br>' +
            '💾 ' + t('生成完成后，气泡下方可保存到本地 / 存入仓库 / 存入项目。') + '<br><br>' +
            '🛠 ' + t('想给编辑器本身加功能？在顶部项目下拉里选「编辑源码」，直接告诉我想要什么，我会修改编辑器源码，点重启按钮后生效。') + '<br><br>' +
            '🗄 ' + t('选「文件仓库」可以让我读写仓库里的文本文件（HTML/JS 等），生成的图片/视频也会自动存进仓库。') +
            '<br><span class="ai-welcome-sub">' + t('当前目标') + '：' + (proj ? (proj.name || proj.id) : (isSrcMode() ? '🛠 ' + t('编辑源码') : (isRepoMode() ? '🗄 ' + t('文件仓库') : '—'))) + '</span>';
        aiMsgsEl.appendChild(w);
    }


    /* ===== 附件：上传图片（视觉理解）/ 文件（文本进上下文）===== */
    var pendingImage = null;   /* {dataURL, name} */
    var pendingFiles = [];     /* {name, text} */
    function readFileAsText(file) {
        return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = rej; fr.readAsText(file); });
    }
    function readFileAsDataURL(file) {
        return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = rej; fr.readAsDataURL(file); });
    }
    function renderAttachBar() {
        if (!aiOverlay) return;
        var bar = aiOverlay.querySelector('#aiAttachBar');
        if (!bar) return;
        bar.innerHTML = '';
        var has = false;
        if (pendingImage) {
            has = true;
            var c = document.createElement('span');
            c.className = 'ai-attach-chip';
            c.title = t('点击移除');
            var im = document.createElement('img');
            im.src = pendingImage.dataURL;
            c.appendChild(im);
            var lbl = document.createElement('span');
            lbl.textContent = pendingImage.name + ' ✕';
            c.appendChild(lbl);
            c.addEventListener('click', function () { pendingImage = null; renderAttachBar(); });
            bar.appendChild(c);
        }
        pendingFiles.forEach(function (f, i) {
            has = true;
            var c2 = document.createElement('span');
            c2.className = 'ai-attach-chip';
            c2.title = t('点击移除');
            c2.textContent = '📄 ' + f.name + ' ✕';
            c2.addEventListener('click', function () { pendingFiles.splice(i, 1); renderAttachBar(); });
            bar.appendChild(c2);
        });
        bar.style.display = has ? 'flex' : 'none';
    }
    function clearAttach() { pendingImage = null; pendingFiles = []; renderAttachBar(); }
    function isBinaryName(name) {
        return /\.(png|jpe?g|gif|webp|bmp|ico|mp4|webm|ogv|mov|m4v|mkv|avi|mp3|wav|ogg|m4a|flac|ttf|otf|woff2?|zip|rar|7z|gz|tar|pdf|exe|apk|dmg)$/i.test(name || '');
    }

    /* ---------- 消息渲染 ---------- */
    function addMsg(kind, text) {
        var d = document.createElement('div');
        d.className = 'ai-msg ai-msg-' + kind;
        d.textContent = text;
        aiMsgsEl.appendChild(d);
        aiMsgsEl.scrollTop = aiMsgsEl.scrollHeight;
        return d;
    }
    function addOpsRow(items) {
        var d = document.createElement('div');
        d.className = 'ai-msg ai-msg-ops';
        d.innerHTML = '<div class="ai-ops-title">' + t('已应用修改') + ' ·</div>';
        items.forEach(function (s) {
            var c = document.createElement('span');
            c.className = 'ai-op-chip';
            c.textContent = s;
            d.appendChild(c);
        });
        aiMsgsEl.appendChild(d);
        aiMsgsEl.scrollTop = aiMsgsEl.scrollHeight;
    }
    function addNote(text, cls) {
        var d = document.createElement('div');
        d.className = 'ai-msg ' + (cls || 'ai-msg-note');
        d.textContent = text;
        aiMsgsEl.appendChild(d);
        aiMsgsEl.scrollTop = aiMsgsEl.scrollHeight;
        return d;
    }

    /* ---------- 上下文：文件列表 + 文本内容 ---------- */
    function collectNodes(project) {
        var out = [];
        (function walk(nodes, dir) {
            (nodes || []).forEach(function (n) {
                var p = dir ? (dir + '/' + n.name) : n.name;
                if (n.type === 'folder') {
                    if (n.id !== 'root') { out.push({ path: p, node: n }); walk(n.children || [], p); }
                    else walk(n.children || [], dir);
                } else {
                    out.push({ path: p, node: n });
                }
            });
        })(project.fileTree || [], '');
        return out;
    }
    async function getNodeText(project, node) {
        if (typeof node.content === 'string') return node.content;
        if (node.inOpfs) {
            try { return (await loadFileContent(project.id, node.id)) || ''; } catch (e) { return ''; }
        }
        return '';
    }
    async function buildSystemPrompt(project) {
        var items = collectNodes(project);
        var treeLines = items.map(function (it) {
            if (it.node.type === 'folder') return '  ' + t('[目录]') + ' ' + it.path + '/';
            var sizeInfo = '';
            if (typeof it.node.content === 'string') sizeInfo = ' ' + it.node.content.length + t('字符');
            else if (it.node.size) sizeInfo = ' ' + formatSize(it.node.size);
            return '  ' + t('[文件]') + ' ' + it.path + sizeInfo;
        });
        var currentHint = '';
        if (currentProjectId === project.id && currentFileId) {
            var cf = findFileById(currentFileId);
            if (cf) currentHint = '\n' + t('用户当前正在编辑的文件：') + resolvePath(project, cf) + t('（优先围绕它工作）');
        }
        var ctx = '';
        var used = 0;
        var textItems = items.filter(function (it) {
            return it.node.type === 'file' && isTextFile(it.node);
        });
        var texts = await Promise.all(textItems.map(function (it) { return getNodeText(project, it.node); }));
        for (var i = 0; i < textItems.length; i++) {
            var path = textItems[i].path;
            var text = texts[i];
            if (!text) continue;
            if (used >= CTX_TOTAL) { ctx += '\n----- ' + path + ' -----\n' + t('（上下文预算已用完，内容省略）') + '\n'; continue; }
            var budget = Math.min(CTX_PER_FILE, CTX_TOTAL - used);
            var truncated = false;
            if (text.length > budget) { text = text.slice(0, budget); truncated = true; }
            used += text.length;
            ctx += '\n----- ' + t('文件') + '：' + path + ' -----\n' + text + (truncated ? '\n' + t('（…内容过长已截断）') : '') + '\n----- ' + t('结束') + '：' + path + ' -----';
        }
        if (!ctx) ctx = '\n' + t('（项目暂无文本文件内容）');
        return t('你是「Ats编辑器」内置的 AI 编程助手，可以直接修改用户网页编辑器项目中的文件。') +
            '\n\n' + t('当前项目') + '：' + (project.name || project.id) + currentHint +
            '\n\n' + t('【项目文件列表】') + '\n' + (treeLines.join('\n') || ('  ' + t('（空项目）'))) +
            '\n\n' + t('【文件内容】') + ctx +
            '\n\n' + t('【文件操作规则——必须严格遵守】') + '\n' +
            t('1. 需要新建或修改文件时，输出操作块（内容必须是完整文件，禁止省略或用 ... 代替未变部分）：\n===FILE: 相对路径===\n完整的新文件内容\n===END===') + '\n' +
            t('2. 需要新建空文件夹时，单独输出一行：===FOLDER: 相对路径===') + '\n' +
            t('3. 需要删除文件或文件夹时，单独输出一行：===DELETE: 相对路径===') + '\n' +
            t('4. 路径相对于项目根目录（如 index.html、css/style.css），不要以 / 或 ./ 开头；新建文件会自动创建所需目录。') + '\n' +
            t('5. 只能操作上面文件列表中出现的位置及新建路径；不要操作二进制文件（图片/音视频/字体等），无法处理。') + '\n' +
            t('6. 操作块之外，用简洁的语言说明你做了什么；无法完成的请求直接说明原因，不要伪造操作块。') + '\n' +
            t('【输出示例（格式必须完全一致，禁止用 Markdown 代码块 ``` 代替操作块）】') + '\n' +
            t('好的，我来修改。\n===PATCH: js/app.js===\n<<<<\n需要修改的原文一行\n>>>>\n替换后的一行\n====\n===END===\n已修改 js/app.js，重启页面后生效。') + '\n' +
            t('7. 可以在一次回复中输出多个操作块，同时新建或修改多个文件；相关联的修改尽量一次性全部完成。');
    }
    function resolvePath(project, target) {
        var found = '';
        (function walk(nodes, dir) {
            (nodes || []).some(function (n) {
                var p = dir ? (dir + '/' + n.name) : n.name;
                if (n === target) { found = p; return true; }
                if (n.type === 'folder' && n.children) {
                    walk(n.children, n.id === 'root' ? dir : p);
                    if (found) return true;
                }
                return false;
            });
        })(project.fileTree || [], '');
        return found || target.name;
    }

    /* ---------- 解析 AI 输出的操作块 ---------- */
    function parseAiOps(text) {
        var ops = [], ranges = [];
        var fileRe = /===FILE:[ \t]*([^\r\n=][^\r\n]*?)[ \t]*===\r?\n([\s\S]*?)\r?\n?===END===/g, m;
        while ((m = fileRe.exec(text))) {
            ops.push({ op: 'file', path: m[1].trim(), content: m[2] });
            ranges.push([m.index, fileRe.lastIndex]);
        }
        var patchRe = /===PATCH:[ \t]*([^\r\n=][^\r\n]*?)[ \t]*===\r?\n([\s\S]*?)\r?\n?===END===/g;
        while ((m = patchRe.exec(text))) {
            ops.push({ op: 'patch', path: m[1].trim(), content: m[2] });
            ranges.push([m.index, patchRe.lastIndex]);
        }
        function inRanges(i) { return ranges.some(function (r) { return i >= r[0] && i < r[1]; }); }
        var re2 = [[/===FOLDER:[ \t]*([^\r\n=]+?)[ \t]*===/g, 'folder'], [/===DELETE:[ \t]*([^\r\n=]+?)[ \t]*===/g, 'delete']];
        re2.forEach(function (pair) {
            var r = pair[0];
            while ((m = r.exec(text))) {
                if (inRanges(m.index)) continue;
                ops.push({ op: pair[1], path: m[1].trim() });
            }
        });
        return ops;
    }


    /* 兜底解析：模型未按操作块格式输出时，从 Markdown 代码块提取文件修改（按“修改/新建 + 文件名”标题关联） */
    function parseFallbackOps(text) {
        var ops = [];
        var re = /(?:^|\n)#{1,6}[ \t]*[^\n]{0,60}?`?([\w\-\/.]+\.(?:html?|xhtml|css|js|mjs|json|txt|md|svg|xml|csv|yml|yaml))`?[ \t]*[^\n]{0,30}\n[\s\S]*?```[\w\-]*[ \t]*\r?\n([\s\S]*?)```/g;
        var m;
        while ((m = re.exec(text))) {
            var content = m[2].replace(/\n$/, '');
            if (content) ops.push({ op: 'file', path: m[1], content: content });
        }
        return ops;
    }
    function parseAiOpsSmart(text) {
        var ops = parseAiOps(text);
        if (!ops.length) ops = parseFallbackOps(text);
        return ops;
    }

    /* ---------- 文件系统操作 ---------- */
    function _san(s) {
        try { return sanitizeItemName(s); }
        catch (e) { return String(s).replace(/[\\/:*?"<>|]/g, '_').slice(0, 120); }
    }
    function normalizePath(p) {
        p = String(p || '').trim().replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '');
        var parts = [];
        p.split('/').forEach(function (s) {
            s = s.trim();
            if (!s || s === '.') return;
            if (s === '..') { parts.pop(); return; }
            s = _san(s);
            if (s) parts.push(s);
        });
        return parts.join('/');
    }
    function ensureFolder(project, dirPath) {
        var tree = project.fileTree = project.fileTree || [];
        var root = tree.find(function (n) { return n.id === 'root' && n.type === 'folder'; });
        var parent = root || { children: tree };
        if (root) root.children = root.children || [];
        if (!dirPath) return parent;
        var segs = dirPath.split('/');
        var cur = parent;
        var acc = '';
        segs.forEach(function (name) {
            acc = acc ? (acc + '/' + name) : name;
            cur.children = cur.children || [];
            var hit = cur.children.find(function (c) { return c.type === 'folder' && c.name === name; });
            if (!hit) {
                hit = { id: genId('folder'), name: name, type: 'folder', children: [] };
                cur.children.push(hit);
            }
            cur = hit;
        });
        return cur;
    }
    async function writeNodeText(project, node, text) {
        if (node.inOpfs) {
            _fileContentCache[node.id] = text;
            clearTimeout(_opfsWritebackTimers[node.id]);
            node.content = text;
            try { await opfsWrite(project.id, node.id, new Blob([text], { type: 'text/plain;charset=utf-8' })); }
            catch (e) { console.warn('AI编辑 OPFS 写入失败：', e); }
        } else {
            node.content = text;
        }
        if (project.id === currentProjectId && currentFileId === node.id) {
            codeEditorEl.value = text;
            codeEditorEl.disabled = false;
            try { updateHighlight(); } catch (e) {}
        }
    }
    function deleteByPath(project, path) {
        var parts = path.split('/');
        var name = parts.pop();
        var parent = parts.length ? ensureFolder(project, parts.join('/')) : ensureFolder(project, '');
        var idx = (parent.children || []).findIndex(function (c) { return c.name === name; });
        if (idx === -1) return false;
        var node = parent.children[idx];
        var removedIds = new Set();
        (function collect(n) {
            removedIds.add(n.id);
            (n.children || []).forEach(collect);
        })(node);
        (function cleanup(n) {
            if (n.type === 'file' && n.inOpfs) {
                try { opfsDelete(project.id, n.id); } catch (e) {}
                try { revokeBlobUrl(n.id); } catch (e) {}
                delete _fileContentCache[n.id];
                clearTimeout(_opfsWritebackTimers[n.id]);
            }
            (n.children || []).forEach(cleanup);
        })(node);
        parent.children.splice(idx, 1);
        if (project.id === currentProjectId && removedIds.has(currentFileId)) {
            openFileIds = openFileIds.filter(function (fid) { return !removedIds.has(fid); });
            currentFileId = null;
            codeEditorEl.value = ''; codeEditorEl.disabled = true;
            try { updateHighlight(); } catch (e) {}
        }
        return true;
    }
    async function applyAiOps(project, ops) {
        var applied = [];
        for (var i = 0; i < ops.length; i++) {
            var op = ops[i];
            var clean = normalizePath(op.path);
            if (!clean) continue;
            try {
                if (op.op === 'folder') {
                    ensureFolder(project, clean);
                    applied.push('📁 ' + clean + '/');
                } else if (op.op === 'delete') {
                    if (deleteByPath(project, clean)) applied.push('🗑 ' + clean);
                } else {
                    var segs = clean.split('/');
                    var name = segs.pop();
                    var parent = ensureFolder(project, segs.join('/'));
                    parent.children = parent.children || [];
                    var node = parent.children.find(function (c) { return c.type === 'file' && c.name === name; });
                    var isNew = !node;
                    if (!node) { node = { id: genId('file'), name: name, type: 'file', content: '' }; parent.children.push(node); }
                    await writeNodeText(project, node, op.content);
                    applied.push((isNew ? '🆕 ' : '✏️ ') + clean);
                }
            } catch (e) { console.warn('AI编辑 应用失败：', clean, e); }
        }
        if (applied.length) {
            try {
                saveProjects(true);
                if (project.id === currentProjectId) { renderFileTree(); renderFileTabs(); }
            } catch (e) {}
        }
        return applied;
    }

    /* ---------- 发送状态与输入锁 ---------- */
    function setBusy(v) {
        aiBusy = v;
        aiSendBtn.disabled = v;
        aiSendBtn.style.display = v ? 'none' : '';
        aiStopBtn.style.display = v ? '' : 'none';
        aiProjSel.disabled = v;
    }

    /* ---------- 意图识别：生成图片 / 生成视频 自动切换免费模型 ---------- */
    function detectIntent(txt) {
        var s = String(txt);
        var low = s.toLowerCase();
        /* 快捷指令前缀：中文「生成一个图片:xxx / 生成一个视频:xxx」+ 英文 Generate a picture:/video: */
        if (/^\s*(please\s+)?generate\s+(an?\s+)?(video|clip)\s*[:：]/i.test(s)) return 'video';
        if (/^\s*(please\s+)?generate\s+(an?\s+)?(image|picture|pic)\s*[:：]/i.test(s)) return 'image';
        if (/(生成|制作|做|拍|来|录)\s*.{0,10}(视频|短片|动画)|文生视频|ai视频/.test(s) ||
            /generate\s*.{0,10}video|text\s*-\s*to\s*-\s*video/.test(low)) return 'video';
        /* 流程图/图表类应走代码生成（SVG/HTML），不算文生图 */
        var isChart = /(流程图|架构图|思维导图|线框图|原型图|时序图|关系图|拓扑图|曲线图|饼图|柱状图|折线图|图表)/.test(s);
        if (/(画|绘|生成|制作|做|来)\s*.{0,10}(图|图片|图像|画|海报|插画|头像|壁纸|logo|图标|icon|banner)|文生图/.test(s) ||
            /^(请|帮我|麻烦|给我)?(画|绘)(出|一|个|张|幅|：|:|\s)/.test(s) ||
            /draw\s|paint\s|generate\s*.{0,10}image|text\s*-\s*to\s*-\s*image/.test(low)) {
            if (!isChart) return 'image';
        }
        return 'chat';
    }
    function cleanImagePrompt(txt) {
        var p = String(txt || '');
        p = p.replace(/^\s*(请|帮我)?\s*生成\s*(一个|一段|个|张)?\s*(图片|图像|图)\s*[:：]\s*/g, '');
        p = p.replace(/^\s*(please\s+)?generate\s+(an?\s+)?(image|picture|pic)\s*[:：]\s*/i, '');
        p = p.replace(/^(请|帮我|麻烦)?(用\s*ai\s*)?(生成|绘制|画|制作|做)(出|一|两|三)?(张|幅|个|段)?(图片|图像|图|画|照片|海报)?(吗|呗|吧)?[:：,，。！]?\s*/g, '');
        p = p.replace(/^(文生图|图片生成|画图|生成图片)[:：]?\s*/g, '');
        return p.trim() || String(txt || '');
    }
    function cleanVideoPrompt(txt) {
        var p = String(txt || '');
        p = p.replace(/^\s*(请|帮我)?\s*生成\s*(一个|一段|个|张)?\s*视频\s*[:：]\s*/g, '');
        p = p.replace(/^\s*(please\s+)?generate\s+(an?\s+)?(video|clip)\s*[:：]\s*/i, '');
        p = p.replace(/^(请|帮我|麻烦)?(用\s*ai\s*)?(生成|制作|做|拍)(出|一|两|三)?(段|个|条)?(视频|短片|动画)?(吗|呗|吧)?[:：,，。！]?\s*/g, '');
        p = p.replace(/^(文生视频|视频生成)[:：]?\s*/g, '');
        return p.trim() || String(txt || '');
    }
    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    /* 给不可控的 Promise 加超时上限，防止个别环境 OPFS/网络挂起卡死整个发送流程 */
    function withTimeout(p, ms) {
        return Promise.race([p, sleep(ms)]);
    }
    function abortErr() { var e = new Error('aborted'); e.name = 'AbortError'; return e; }
    function isLimitError(status, code, msg) {
        var ec = String(code || '');
        return status === 429 || status === 503 || status === 500 ||
            ec === '1305' || ec === '1302' || ec === '1113' || ec === '1301' ||
            /overload|访问量|繁忙|稍后再试|高峰|限流/i.test(String(msg || ''));
    }
    /* 带自动重试的 POST：免费模型高峰限流（429/1305）时自动退避重试，气泡实时显示进度 */
    async function apiPost(url, bodyObj, ctrl, bubble, waitLabel, maxRetry) {
        maxRetry = maxRetry === undefined ? 4 : maxRetry;
        var lastErrMsg = '';
        for (var attempt = 0; attempt <= maxRetry; attempt++) {
            if (attempt > 0) {
                if (ctrl.signal.aborted) throw abortErr();
                if (bubble) bubble.textContent = '⏳ ' + (waitLabel || '') + ' ' + t('服务繁忙，自动重试') + '（' + attempt + '/' + maxRetry + '）…';
                await sleep(5000 * attempt);
                if (ctrl.signal.aborted) throw abortErr();
            }
            try {
                var res = await fetch(url, {
                    method: 'POST', signal: ctrl.signal,
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getKey() },
                    body: JSON.stringify(bodyObj)
                });
                if (res.ok) return res;
                var j = {};
                try { j = await res.json(); } catch (e) {}
                var em = (j.error && (j.error.message || j.error.code)) || ('HTTP ' + res.status);
                if (res.status === 401) { var e401 = new Error(t('API Key 无效') + '：' + em); e401.fatal = true; throw e401; }
                lastErrMsg = em;
                if (!isLimitError(res.status, j.error && j.error.code, em)) { var ef = new Error(em); ef.fatal = true; throw ef; }
            } catch (e) {
                if (e && e.name === 'AbortError') throw e;
                if (e && e.fatal) throw e;
                lastErrMsg = (e && e.message) || String(e);
                /* 网络抖动等错误也进入下一轮重试 */
            }
        }
        throw new Error(lastErrMsg || ('HTTP ' + t('请求失败')));
    }

    /* 生成产物落盘：写入项目根目录（OPFS），文件树即时可见 */
    async function saveBlobToProject(proj, blob, name) {
        var parent = ensureFolder(proj, '');
        parent.children = parent.children || [];
        var node = { id: genId('file'), name: name, type: 'file', content: '', inOpfs: true, size: blob.size };
        if (/\.(png|jpe?g|webp|gif|avif|bmp|ico|svg)$/i.test(name)) node.isImage = true;
        if (/\.(mp4|webm|ogv|mov|m4v|mkv)$/i.test(name)) node.isVideo = true;
        parent.children.push(node);
        try { await withTimeout(opfsWrite(proj.id, node.id, blob), 8000); }
        catch (e) { console.warn('AI生成 OPFS 写入失败：', e); }
        try {
            saveProjects(true);
            if (proj.id === currentProjectId) { renderFileTree(); renderFileTabs(); }
        } catch (e) {}
        return name;
    }

    /* 存入文件仓库（工具里的「文件仓库」，全局共享，任何项目可用） */
    function saveToRepo(blob, name) {
        try {
            if (typeof REPO_SCOPE === 'undefined' || typeof repoFiles === 'undefined' || typeof saveRepoMeta !== 'function' || typeof opfsWrite !== 'function') return false;
            var id = genId('repo');
            var safe = (typeof sanitizeItemName === 'function' ? sanitizeItemName(name) : name) || name;
            opfsWrite(REPO_SCOPE, id, blob).catch(function (e) { console.warn('AI编辑 仓库 OPFS 写入失败：', e); });
            repoFiles.push({
                id: id, name: safe, originalName: safe,
                mime: blob.type || 'application/octet-stream', size: blob.size || 0,
                isImage: /^image\//i.test(blob.type || ''), isAudio: false, uploaded: Date.now()
            });
            saveRepoMeta();
            return true;
        } catch (e) { console.warn('AI编辑 存入仓库失败：', e); return false; }
    }
    /* 生成产物操作行：保存到本地 / 存入仓库 / 存入项目（未自动入项目时） */
    function addSaveRow(bubble, opts) {
        var row = document.createElement('div');
        row.className = 'ai-save-row';
        /* ⬇ 保存到本地 */
        var bLocal = document.createElement('button');
        bLocal.className = 'ai-save-btn';
        bLocal.textContent = '⬇ ' + t('保存到本地');
        bLocal.addEventListener('click', function () {
            try {
                var a = document.createElement('a');
                if (opts.blob) {
                    var u = URL.createObjectURL(opts.blob);
                    a.href = u;
                    a.download = opts.name;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    setTimeout(function () { try { URL.revokeObjectURL(u); } catch (e) {} }, 5000);
                } else {
                    a.href = opts.url; a.target = '_blank'; a.rel = 'noopener';
                    a.download = opts.name;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                }
                showToast(t('已开始下载'));
            } catch (e) { showToast(t('保存失败')); }
        });
        row.appendChild(bLocal);
        /* 🗄 存入仓库 */
        var bRepo = document.createElement('button');
        bRepo.className = 'ai-save-btn';
        bRepo.textContent = '🗄 ' + t('存入仓库');
        bRepo.addEventListener('click', function () {
            if (!opts.blob) { showToast(t('跨域限制无法读取文件，请用「保存到本地」')); return; }
            if (saveToRepo(opts.blob, opts.name)) {
                bRepo.disabled = true;
                bRepo.classList.add('done');
                bRepo.textContent = '✓ ' + t('已存入仓库');
                showToast(t('已存入仓库'));
            } else showToast(t('存入仓库失败'));
        });
        row.appendChild(bRepo);
        /* 📁 存入项目（仅当有项目上下文且未自动存入时显示） */
        if (!opts.savedToProject && opts.blob && opts.proj) {
            var bProj = document.createElement('button');
            bProj.className = 'ai-save-btn';
            bProj.textContent = '📁 ' + t('存入项目');
            bProj.addEventListener('click', function () {
                saveBlobToProject(opts.proj, opts.blob, opts.name).then(function () {
                    bProj.disabled = true;
                    bProj.classList.add('done');
                    bProj.textContent = '✓ ' + t('已存入项目');
                    showToast(t('已存入项目'));
                }).catch(function (e) { console.warn('AI编辑 存入项目失败：', e); showToast(t('保存失败')); });
            });
            row.appendChild(bProj);
        }
        bubble.appendChild(row);
        if (aiMsgsEl) aiMsgsEl.scrollTop = aiMsgsEl.scrollHeight;
    }

    /* 文生图：CogView-3-Flash（免费）→ 自动存入项目（仓库模式自动入仓库）+ 保存按钮行 + 内嵌预览 */
    async function aiGenImage(proj, prompt, bubble, ctrl, autoRepo) {
        bubble.textContent = '🎨 ' + t('图片生成中…') + '\n' + prompt;
        var res = await apiPost(AI_API_BASE + 'images/generations', {
            model: 'cogview-3-flash', prompt: prompt, size: '1024x1024'
        }, ctrl, bubble, '🎨');
        var j = await res.json().catch(function () { return {}; });
        var url = j.data && j.data[0] && j.data[0].url;
        if (!url) throw new Error(t('接口未返回图片'));
        var fname = 'ai_img_' + Date.now() + '.png';
        var savedName = '', savedToProject = false, savedToRepoAuto = false;
        var genBlob = null;
        try {
            var fr = await fetch(url, { signal: ctrl.signal });
            genBlob = await fr.blob();
            if (proj) { savedName = await saveBlobToProject(proj, genBlob, fname); savedToProject = true; }
            else if (autoRepo && saveToRepo(genBlob, fname)) { savedName = fname; savedToRepoAuto = true; }
        } catch (e) {}
        bubble.textContent = '✅ ' + t('图片已生成') +
            (savedName ? ('，' + (savedToRepoAuto ? t('已存入仓库') : t('已存入项目')) + '：' + savedName)
                       : ('（' + t('跨域限制未能自动存入项目，可长按/右键保存下方预览图') + '）'));
        var img = document.createElement('img');
        img.className = 'ai-gen-preview';
        img.src = url;
        img.alt = 'AI generated';
        bubble.appendChild(img);
        addSaveRow(bubble, { proj: proj, blob: genBlob, url: url, name: fname, savedToProject: savedToProject });
        aiMsgsEl.scrollTop = aiMsgsEl.scrollHeight;
    }

    /* 文生视频：CogVideoX-Flash（免费，异步任务轮询）→ 自动存入项目（仓库模式自动入仓库）+ 内嵌预览 */
    async function aiGenVideo(proj, prompt, bubble, ctrl, autoRepo) {
        bubble.textContent = '🎬 ' + t('视频任务提交中…');
        var res = await apiPost(AI_API_BASE + 'videos/generations', {
            model: 'cogvideox-flash', prompt: prompt
        }, ctrl, bubble, '🎬');
        var j = await res.json().catch(function () { return {}; });
        var url = j.video_result && j.video_result[0] && j.video_result[0].url;
        var taskId = j.id;
        if (!url && !taskId) throw new Error(t('接口未返回视频任务'));
        var started = Date.now();
        var deadline = started + 6 * 60 * 1000;
        while (!url) {
            if (ctrl.signal.aborted) { var ae = new Error('aborted'); ae.name = 'AbortError'; throw ae; }
            await sleep(4000);
            if (Date.now() > deadline) throw new Error(t('视频生成超时，请稍后重试'));
            var st = '';
            try {
                var q = await fetch(AI_API_BASE + 'async-result/' + taskId, {
                    headers: { 'Authorization': 'Bearer ' + getKey() }, signal: ctrl.signal
                });
                var qj = await q.json().catch(function () { return {}; });
                st = qj.task_status || '';
                if (st === 'SUCCESS') {
                    url = qj.video_result && qj.video_result[0] && qj.video_result[0].url;
                    if (!url) throw new Error(t('接口未返回视频地址'));
                } else if (st === 'FAIL') { throw new Error(t('视频生成失败')); }
            } catch (e) {
                if (e && e.name === 'AbortError') throw e;
                if (e && e.message === t('视频生成失败')) throw e;
                if (e && e.message === t('接口未返回视频地址')) throw e;
                /* 查询瞬间失败（限流/网络）→ 等待下一轮轮询 */
            }
            bubble.textContent = '🎬 ' + t('视频生成中') + '… ' + Math.round((Date.now() - started) / 1000) + 's（' + (st || '…') + '）';
        }
        var genBlob = null;
        var fname = 'ai_video_' + Date.now() + '.mp4';
        var savedName = '', savedToProject = false, savedToRepoAuto = false;
        try {
            var fr2 = await fetch(url, { signal: ctrl.signal });
            genBlob = await fr2.blob();
            if (proj) { savedName = await saveBlobToProject(proj, genBlob, fname); savedToProject = true; }
            else if (autoRepo && saveToRepo(genBlob, fname)) { savedName = fname; savedToRepoAuto = true; }
        } catch (e) {}
        bubble.textContent = '✅ ' + t('视频已生成') +
            (savedName ? ('，' + (savedToRepoAuto ? t('已存入仓库') : t('已存入项目')) + '：' + savedName)
                       : ('（' + t('跨域限制未能自动存入项目') + '）'));
        var v = document.createElement('video');
        v.className = 'ai-gen-preview';
        v.src = url; v.controls = true; v.preload = 'metadata';
        bubble.appendChild(v);
        addSaveRow(bubble, { proj: proj, blob: genBlob, url: url, name: fname, savedToProject: savedToProject });
        aiMsgsEl.scrollTop = aiMsgsEl.scrollHeight;
    }

    /* 文本对话（流式）：mode = 'project' | 'src' | 'repo'；自动剥离 <think> */
    async function aiChat(proj, bubble, ctrl, mode, extraMessages, imageMsg) {
        var acc = '', rAcc = '', finishReason = '', inThink = false, thinkTail = '';
        var lastPaint = 0;
        /* 💭 思考过程：独立可折叠区块（reasoning_content 或 <think> 都收集到 rAcc） */
        var thinkBox = null, thinkBody = null;
        function showThink() {
            if (!rAcc) return;
            if (!thinkBox) {
                thinkBox = document.createElement('details');
                thinkBox.className = 'ai-think';
                thinkBox.open = true;
                thinkBox.innerHTML = '<summary>💭 ' + t('思考过程') + '</summary><pre class="ai-think-body"></pre>';
                aiMsgsEl.insertBefore(thinkBox, bubble);
                thinkBody = thinkBox.querySelector('.ai-think-body');
            }
            thinkBody.textContent = rAcc;
            aiMsgsEl.scrollTop = aiMsgsEl.scrollHeight;
        }
        function paint(text, cursor) {
            var now = Date.now();
            if (!cursor && now - lastPaint < 100) return;
            lastPaint = now;
            bubble.textContent = text + (cursor ? '▌' : '');
            aiMsgsEl.scrollTop = aiMsgsEl.scrollHeight;
        }
        /* 显示层：操作块（===FILE:/===PATCH:===...======/单行指令）不进入气泡，
           气泡只显示说明文字 + 「⚙ 正在修改：xxx …」状态行；acc 始终完整保留供解析 */
        var disp = '', opTail = '', inOp = 0, opName = '';
        var OP_TAGS = ['===FILE:', '===PATCH:', '===FOLDER:', '===DELETE:'];
        function tailHoldLen(c) {
            for (var k = Math.min(c.length, 10); k > 0; k--) {
                var tail = c.slice(-k);
                for (var j = 0; j < OP_TAGS.length; j++) if (OP_TAGS[j].slice(0, k) === tail) return k;
                if ('===END==='.slice(0, k) === tail) return k;
            }
            return 0;
        }
        function pushDisplay(c) {
            if (opTail) { c = opTail + c; opTail = ''; }
            while (c) {
                if (inOp === 1) {  /* 块内容：等 ===END=== */
                    var e = c.indexOf('===END===');
                    if (e === -1) {
                        var h = tailHoldLen(c);
                        if (h) { opTail = c.slice(-h); return; }
                        return;
                    }
                    c = c.slice(e + 9); inOp = 0; opName = '';
                    continue;
                }
                if (inOp === 2) {  /* 单行指令：等换行 */
                    var nl0 = c.indexOf('\n');
                    if (nl0 === -1) return;
                    c = c.slice(nl0 + 1); inOp = 0;
                    continue;
                }
                var best = -1, tag = null;
                for (var j2 = 0; j2 < OP_TAGS.length; j2++) {
                    var idx = c.indexOf(OP_TAGS[j2]);
                    if (idx !== -1 && (best === -1 || idx < best)) { best = idx; tag = OP_TAGS[j2]; }
                }
                if (best === -1) {
                    var h2 = tailHoldLen(c);
                    if (h2) { disp += c.slice(0, c.length - h2); opTail = c.slice(-h2); return; }
                    disp += c; return;
                }
                disp += c.slice(0, best);
                var rest = c.slice(best + tag.length);
                var nlB = rest.indexOf('\n');
                var path = (nlB === -1 ? rest : rest.slice(0, nlB)).trim();
                if (tag === '===FILE:') { inOp = 1; opName = '✏️ ' + t('正在修改') + '：' + path; }
                else if (tag === '===PATCH:') { inOp = 1; opName = '🩹 ' + t('正在修改') + '：' + path; }
                else if (tag === '===DELETE:') { inOp = 2; opName = '🗑 ' + t('正在删除') + '：' + path; }
                else { inOp = 2; opName = '📁 ' + t('正在新建') + '：' + path; }
                c = nlB === -1 ? '' : rest.slice(nlB + 1);
                if (nlB === -1 && inOp === 2) return;
            }
        }
        function renderBubble(cursor) {
            var now = Date.now();
            if (!cursor && now - lastPaint < 100) return;
            lastPaint = now;
            bubble.textContent = disp + (inOp ? ('\n⚙ ' + opName + ' …') : '') + (cursor ? '▌' : '');
            aiMsgsEl.scrollTop = aiMsgsEl.scrollHeight;
        }
        /* <think> 剥离（跨 chunk 安全）：每次先把上次暂存的前缀拼回来再找标签；
           尾部疑似不完整标签（最长 7 字符）暂存 thinkTail，等下一片拼接后判定 */
        function flushTail() {
            if (!thinkTail) return;
            if (inThink) rAcc += thinkTail; else acc += thinkTail;
            thinkTail = '';
        }
        function pushContent(c) {
            if (thinkTail) { c = thinkTail + c; thinkTail = ''; }
            while (c) {
                if (!inThink) {
                    var i = c.indexOf('<think>');
                    if (i === -1) {
                        var hold = 0;
                        for (var k = Math.min(c.length, 6); k > 0; k--) {
                            if ('<think>'.slice(0, k) === c.slice(-k)) { hold = k; break; }
                        }
                        if (hold) { acc += c.slice(0, c.length - hold); thinkTail = c.slice(-hold); return; }
                        acc += c; return;
                    } else {
                        acc += c.slice(0, i); inThink = true; c = c.slice(i + 7);
                    }
                } else {
                    var j = c.indexOf('</think>');
                    if (j === -1) {
                        var hold2 = 0;
                        for (var k2 = Math.min(c.length, 7); k2 > 0; k2--) {
                            if ('</think>'.slice(0, k2) === c.slice(-k2)) { hold2 = k2; break; }
                        }
                        if (hold2) { rAcc += c.slice(0, c.length - hold2); thinkTail = c.slice(-hold2); return; }
                        rAcc += c; return;
                    } else {
                        rAcc += c.slice(0, j); inThink = false; c = c.slice(j + 8);
                    }
                }
            }
        }
        var useVision = !!imageMsg;
        var visionModels = ['glm-4.6v-flash', 'glm-4.1v-thinking-flash', 'glm-4v-flash'];
        var sys = useVision
            ? t('你是 Ats编辑器 的视觉 AI 助手。用户发来一张图片（可能附带文字）。请根据图片回答问题、分析内容、提出建议；若用户要求根据图片生成或修改项目文件，也用操作块输出：===FILE: 路径=== 完整内容 ===END===。')
            : (mode === 'src' ? await buildSrcSystemPrompt() : (mode === 'repo' ? await buildRepoSystemPrompt() : await buildSystemPrompt(proj)));
        var msgs = [{ role: 'system', content: sys }].concat(aiHistory.slice(-HISTORY_KEEP));
        if (extraMessages && extraMessages.length) msgs = msgs.concat(extraMessages);
        /* apiPost：免费模型高峰限流（429/1305 服务过载）自动重试，气泡实时显示重试进度；
           主模型持续繁忙时自动降级到备用免费模型 glm-4-flash-250414 */
        var mainModel = useVision
            ? (visionModels.indexOf(currentModel().id) > -1 ? currentModel().id : 'glm-4.6v-flash')
            : currentModel().id;
        var chain = (!useVision && mainModel !== 'glm-4-flash-250414') ? [mainModel, 'glm-4-flash-250414'] : [mainModel];
        var res = null;
        for (var ci = 0; ci < chain.length; ci++) {
            try {
                res = await apiPost(AI_API, {
                    model: chain[ci],
                    messages: msgs,
                    stream: true,
                    temperature: 0.3,
                    max_tokens: (useVision || chain[ci] === 'glm-4-flash-250414' ? 16000 : 65536)
                }, ctrl, bubble, useVision ? '🖼' : '');
                if (ci > 0) addNote(t('主模型繁忙，已自动切换备用模型：') + chain[ci]);
                break;
            } catch (e) {
                if (e && e.fatal) throw e;
                if (ctrl.signal.aborted) throw e;
                if (ci === chain.length - 1) throw e;
                addNote(t('主模型繁忙，尝试备用模型：') + chain[ci + 1]);
            }
        }
        var reader = res.body.getReader();
        var dec = new TextDecoder('utf-8');
        var buf = '';
        while (true) {
            var r = await reader.read();
            if (r.done) break;
            buf += dec.decode(r.value, { stream: true });
            var lines = buf.split('\n');
            buf = lines.pop();
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (!line.startsWith('data:')) continue;
                var payload = line.slice(5).trim();
                if (payload === '[DONE]') continue;
                try {
                    var chunk = JSON.parse(payload);
                    var c0 = chunk.choices && chunk.choices[0];
                    var d = (c0 && c0.delta) || {};
                    if (d.reasoning_content) { rAcc += d.reasoning_content; showThink(); }
                    else if (d.content) {
                        pushContent(d.content);
                        pushDisplay(d.content);
                        if (acc && thinkBox && thinkBox.open) thinkBox.open = false;  /* 正文开始：折叠思考区 */
                        if (acc || inOp) renderBubble(true);
                        else if (rAcc) showThink();
                    }
                    if (c0 && c0.finish_reason) finishReason = c0.finish_reason;
                } catch (e) {}
            }
        }
        flushTail();
        if (opTail) { disp += opTail; opTail = ''; }
        if (thinkBox) thinkBox.open = false;  /* 完成：折叠思考区（可手动展开回看） */
        bubble.textContent = disp || (acc ? ('⚙ ' + t('已完成文件修改，见下方清单')) : (rAcc ? ('（' + t('仅输出思考内容，无正文') + '）') : ('（' + t('空回复') + '）')));
        aiMsgsEl.scrollTop = aiMsgsEl.scrollHeight;
        /* 截断检测：未闭合的 FILE 块会被解析器安全忽略，但需明确告知用户 */
        var openBlocks = (acc.match(/===FILE:/g) || []).length;
        var endBlocks = (acc.match(/===END===/g) || []).length;
        if (openBlocks > endBlocks) addNote(t('检测到未闭合的文件块（输出可能被截断），对应文件未应用'), 'ai-msg-error');
        if (finishReason === 'length') addNote(t('回复达到长度上限，正在自动续写…'), 'ai-msg-note');
        return { text: acc, capped: finishReason === 'length' };
    }

    /* ---------- 发送入口：意图路由 ---------- */
    async function aiSend() {
        if (aiBusy) return;
        var txt = (aiInputEl.value || '').trim();
        if (!txt) return;
        var srcMode = isSrcMode();
        var repoMode = isRepoMode();
        var proj = (srcMode || repoMode) ? null : getSelectedProject();
        if (!proj && !srcMode && !repoMode) { showToast(t('请先选择一个项目')); return; }
        var sendImage = pendingImage;
        var sendFiles = pendingFiles.slice();
        pendingImage = null; pendingFiles = [];
        var attachText = '';
        sendFiles.forEach(function (f) { attachText += '\n\n【附件文件：' + f.name + '】\n' + f.text; });
        aiInputEl.value = '';
        var userBubble = addMsg('user', txt);
        if (sendImage) {
            var uim = document.createElement('img');
            uim.className = 'ai-msg-img';
            uim.src = sendImage.dataURL;
            uim.alt = sendImage.name;
            userBubble.appendChild(uim);
        }
        sendFiles.forEach(function (f) {
            var fc = document.createElement('div');
            fc.className = 'ai-attach-file';
            fc.textContent = '📄 ' + f.name;
            userBubble.appendChild(fc);
        });
        aiHistory.push({
            role: 'user',
            content: sendImage
                ? [{ type: 'text', text: (txt + attachText) || t('请看这张图片') }, { type: 'image_url', image_url: { url: sendImage.dataURL } }]
                : (txt + attachText)
        });

        setBusy(true);
        renderAttachBar();
        var bubble = addMsg('assistant', '…');
        var ctrl = new AbortController();
        aiAbort = ctrl;
        var acc = '';
        try {
            var intent = detectIntent(txt);
            if (intent === 'image') {
                await aiGenImage(proj, cleanImagePrompt(txt), bubble, ctrl, repoMode);
                aiHistory.pop();  /* 生成类消息不进入对话上下文 */
            } else if (intent === 'video') {
                await aiGenVideo(proj, cleanVideoPrompt(txt), bubble, ctrl, repoMode);
                aiHistory.pop();
            } else {
                var mode = srcMode ? 'src' : (repoMode ? 'repo' : 'project');
                var seg = await aiChat(proj, bubble, ctrl, mode, null, sendImage);
                acc = seg.text;
                /* 回答超出长度上限：自动开新聊天气泡续写（最多 3 次），内容自动衔接 */
                var conts = 0, lastSeg = acc;
                while (seg.capped && conts < 3 && !ctrl.signal.aborted) {
                    var nb = addMsg('assistant', '…');
                    seg = await aiChat(proj, nb, ctrl, mode, [
                        { role: 'assistant', content: lastSeg },
                        { role: 'user', content: t('继续，从中断处接着输出，不要重复已输出的内容。') }
                    ]);
                    if (!seg.text) { nb.textContent = '（' + t('空回复') + '）'; break; }
                    acc += seg.text;
                    lastSeg = seg.text;
                    conts++;
                    addCopyRow(nb, seg.text);
                }
            }
        } catch (e) {
            if (e && e.name === 'AbortError') {
                bubble.textContent = '（' + t('已停止') + '）';
            } else {
                bubble.classList.add('ai-msg-error');
                bubble.textContent = '⚠ ' + t('请求失败') + '：' + ((e && e.message) || String(e));
            }
        } finally {
            aiAbort = null;
            setBusy(false);   /* finally 兜底：任何分支都必须解锁发送 */
        }
        if (acc) {
            aiHistory.push({ role: 'assistant', content: acc });
            var ops = parseAiOpsSmart(acc);
            if (ops.length && !parseAiOps(acc).length) {
                addNote(t('模型未按标准格式输出，已启用兜底解析（Markdown 提取）'), 'ai-msg-note');
            }
            if (ops.length) {
                if (srcMode) {
                    var r = await applySrcOps(ops);
                    /* 大文件全量重写被拒 → 自动反馈一轮，让 AI 改用 ===PATCH:=== 增量补丁 */
                    if (r.rejectedBig.length) {
                        aiHistory.push({ role: 'assistant', content: acc });
                        var askPatch = t('以下文件过大，全量重写已被系统拒绝：') + r.rejectedBig.join('、') +
                            t('。请立即改用 ===PATCH: 文件名=== 增量补丁输出你的修改（<<<< 原文 >>>> 新内容 ====），只输出操作块和简要说明。');
                        aiHistory.push({ role: 'user', content: askPatch });
                        addNote(t('检测到大文件全量重写，已要求 AI 改用增量补丁…'), 'ai-msg-note');
                        var nb2 = addMsg('assistant', '…');
                        var seg2 = await aiChat(proj, nb2, ctrl, 'src', [
                            { role: 'assistant', content: acc },
                            { role: 'user', content: askPatch }
                        ]);
                        acc += '\n' + seg2.text;
                        var ops2 = parseAiOpsSmart(seg2.text);
                        if (ops2.length) {
                            var r2 = await applySrcOps(ops2);
                            if (r2.applied.length) addOpsRow(r2.applied);
                            if (r2.skipped.length) addNote(t('以下未应用') + '：' + r2.skipped.join(' ｜ '), 'ai-msg-error');
                        }
                        if (r.applied.length) addOpsRow(r.applied);
                        addRestartRow(bubble);
                        showToast(t('已应用修改') + ' · ' + r.applied.length + '，' + t('重启页面生效'));
                    } else {
                        if (r.applied.length) {
                            addOpsRow(r.applied);
                            addRestartRow(bubble);
                            showToast(t('已应用修改') + ' · ' + r.applied.length + '，' + t('重启页面生效'));
                        } else addNote(t('操作块解析失败，未应用任何修改'), 'ai-msg-error');
                        if (r.skipped.length) addNote(t('以下未应用') + '：' + r.skipped.join(' ｜ '), 'ai-msg-error');
                    }
                } else if (repoMode) {
                    var rr = await applyRepoOps(ops);
                    if (rr.applied.length) { addOpsRow(rr.applied); showToast(t('已应用修改') + ' · ' + rr.applied.length); }
                    else addNote(t('操作块解析失败，未应用任何修改'), 'ai-msg-error');
                    if (rr.skipped.length) addNote(t('以下未应用') + '：' + rr.skipped.join(' ｜ '), 'ai-msg-error');
                } else {
                    var applied = await applyAiOps(proj, ops);
                    if (applied.length) { addOpsRow(applied); showToast(t('已应用修改') + ' · ' + applied.length); }
                    else addNote(t('操作块解析失败，未应用任何修改'), 'ai-msg-error');
                }
            }
            if (acc) addCopyRow(bubble, acc);
        }
    }
})();
