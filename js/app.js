/* =========================================================
   真实视口高度（Android 地址栏伸缩兼容）
   vh/dvh 在安卓上受地址栏影响不可靠，这里用 visualViewport
   实时测量可见高度写入 --app-h，供 body/弹窗/遮罩使用。
   ========================================================= */
(function () {
    function setVh() {
        var h = window.innerHeight || 0;
        try {
            if (window.visualViewport && window.visualViewport.height) {
                h = window.visualViewport.height;
            }
        } catch (e) {}
        try { document.documentElement.style.setProperty('--app-h', h + 'px'); } catch (e) {}
        try { if (typeof fitSettingsModal === 'function' && document.getElementById('settingsModal') && document.getElementById('settingsModal').style.display !== 'none') fitSettingsModal(); } catch (e) {}
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setVh);
    } else { setVh(); }
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);
    try {
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', setVh);
            window.visualViewport.addEventListener('scroll', setVh);
        }
    } catch (e) {}
})();

/* =========================================================
   语法高亮引擎
   ========================================================= */
const _ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return _ESC_MAP[c]; });
}
function _span(cls, text) {
    return '<span class="tok-' + cls + '">' + escapeHtml(text) + '</span>';
}
const PEEK_LIMIT = 300;

function tokenizeHtml(code) {
    let out = '', i = 0;
    const n = code.length;
    while (i < n) {
        const c = code[i];
        if (c === '<') {
            if (code.startsWith('<!--', i)) {
                const end = code.indexOf('-->', i + 4);
                const j = end === -1 ? n : end + 3;
                out += _span('comment', code.slice(i, j)); i = j; continue;
            }
            if (/^<!doctype/i.test(code.slice(i, i + 10))) {
                const end = code.indexOf('>', i);
                const j = end === -1 ? n : end + 1;
                out += _span('doctype', code.slice(i, j)); i = j; continue;
            }
            if (/^<\/?[a-zA-Z]/.test(code.slice(i, i + 3))) {
                let j = i + 1;
                let open = '<';
                if (code[j] === '/') { open = '</'; j++; }
                out += _span('punct', open); i = j;
                const nameM = /^[a-zA-Z][\w:.-]*/.exec(code.slice(i, i + PEEK_LIMIT));
                if (nameM) { out += _span('tag', nameM[0]); i += nameM[0].length; }
                while (i < n && code[i] !== '>') {
                    if (/\s/.test(code[i])) {
                        let j2 = i; while (j2 < n && /\s/.test(code[j2])) j2++;
                        out += escapeHtml(code.slice(i, j2)); i = j2; continue;
                    }
                    if (code[i] === '"' || code[i] === "'") {
                        const q = code[i];
                        const end = code.indexOf(q, i + 1);
                        const j2 = end === -1 ? n : end + 1;
                        out += _span('string', code.slice(i, j2)); i = j2; continue;
                    }
                    const attrM = /^[^\s=>"'/]+/.exec(code.slice(i, i + PEEK_LIMIT));
                    if (attrM) { out += _span('attr', attrM[0]); i += attrM[0].length; continue; }
                    out += escapeHtml(code[i]); i++;
                }
                if (i < n && code[i] === '>') { out += _span('punct', '>'); i++; }
                continue;
            }
        }
        const next = code.indexOf('<', i + 1);
        const j = next === -1 ? n : next;
        out += escapeHtml(code.slice(i, j));
        i = j;
    }
    return out;
}

function tokenizeCss(code) {
    let out = '', i = 0;
    const n = code.length;
    while (i < n) {
        const c = code[i];
        if (c === '/' && code[i + 1] === '*') {
            const end = code.indexOf('*/', i + 2);
            const j = end === -1 ? n : end + 2;
            out += _span('comment', code.slice(i, j)); i = j; continue;
        }
        if (c === '"' || c === "'") {
            const q = c; let j = i + 1;
            while (j < n) {
                if (code[j] === '\\') { j += 2; continue; }
                if (code[j] === q) { j++; break; }
                j++;
            }
            j = Math.min(j, n);
            out += _span('string', code.slice(i, j)); i = j; continue;
        }
        if (c === '#') {
            const hexM = /^#[0-9a-fA-F]{3,8}\b/.exec(code.slice(i, i + PEEK_LIMIT));
            if (hexM) { out += _span('color', hexM[0]); i += hexM[0].length; continue; }
        }
        if (c >= '0' && c <= '9') {
            const numM = /^\d+(\.\d+)?(px|em|rem|%|vh|vw|vmin|vmax|s|ms|deg|fr|pt|cm|mm|in|ex|ch)?/.exec(code.slice(i, i + PEEK_LIMIT));
            if (numM) { out += _span('number', numM[0]); i += numM[0].length; continue; }
        }
        const propM = /^-?[a-zA-Z][\w-]*(?=\s*:)/.exec(code.slice(i, i + PEEK_LIMIT));
        if (propM) { out += _span('property', propM[0]); i += propM[0].length; continue; }
        if (c === '.' || c === '#') {
            const selM = /^[.#][\w-]+/.exec(code.slice(i, i + PEEK_LIMIT));
            if (selM) { out += _span('selector', selM[0]); i += selM[0].length; continue; }
        }
        if (c === '{' || c === '}' || c === '(' || c === ')' || c === ';' || c === ':' || c === ',') {
            out += _span('punct', c); i++; continue;
        }
        out += escapeHtml(c); i++;
    }
    return out;
}

const JS_KEYWORDS = new Set([
    'var','let','const','function','return','if','else','for','while','do',
    'switch','case','break','continue','new','delete','typeof','instanceof',
    'in','of','this','class','extends','super','import','export','default',
    'from','as','try','catch','finally','throw','await','async','yield',
    'void','static','get','set','with','debugger'
]);
const JS_CONSTANTS = new Set(['true','false','null','undefined','NaN','Infinity']);

function tokenizeJs(code) {
    let out = '', i = 0;
    const n = code.length;
    while (i < n) {
        const c = code[i];
        if (c === '/' && code[i + 1] === '/') {
            let j = code.indexOf('\n', i);
            j = j === -1 ? n : j;
            out += _span('comment', code.slice(i, j)); i = j; continue;
        }
        if (c === '/' && code[i + 1] === '*') {
            const end = code.indexOf('*/', i + 2);
            const j = end === -1 ? n : end + 2;
            out += _span('comment', code.slice(i, j)); i = j; continue;
        }
        if (c === '"' || c === "'" || c === '`') {
            const q = c; let j = i + 1;
            while (j < n) {
                if (code[j] === '\\') { j += 2; continue; }
                if (code[j] === q) { j++; break; }
                if (q !== '`' && code[j] === '\n') break;
                j++;
            }
            out += _span('string', code.slice(i, j)); i = j; continue;
        }
        if ((c >= '0' && c <= '9') || (c === '.' && code[i + 1] >= '0' && code[i + 1] <= '9')) {
            const numM = /^(0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|\d+(\.\d+)?([eE][+-]?\d+)?)/.exec(code.slice(i, i + PEEK_LIMIT));
            if (numM) { out += _span('number', numM[0]); i += numM[0].length; continue; }
        }
        if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_' || c === '$') {
            const idM = /^[a-zA-Z_$][\w$]*/.exec(code.slice(i, i + PEEK_LIMIT));
            const word = idM[0];
            if (JS_KEYWORDS.has(word)) out += _span('keyword', word);
            else if (JS_CONSTANTS.has(word)) out += _span('constant', word);
            else if (word[0] >= 'A' && word[0] <= 'Z') out += _span('class', word);
            else out += _span('ident', word);
            i += word.length; continue;
        }
        if (c === '{' || c === '}' || c === '(' || c === ')' || c === '[' || c === ']' ||
            c === ';' || c === ',' || c === '.') {
            out += _span('punct', c); i++; continue;
        }
        if ('+-*/%=<>!&|^~?:'.indexOf(c) !== -1) {
            const opM = /^[+\-*/%=<>!&|^~?:]+/.exec(code.slice(i, i + 20));
            out += _span('op', opM[0]); i += opM[0].length; continue;
        }
        out += escapeHtml(c); i++;
    }
    return out;
}

function tokenizeJson(code) {
    let out = '', i = 0;
    const n = code.length;
    while (i < n) {
        const c = code[i];
        if (c === '"') {
            let j = i + 1;
            while (j < n) {
                if (code[j] === '\\') { j += 2; continue; }
                if (code[j] === '"') { j++; break; }
                j++;
            }
            let k = j;
            while (k < n && (code[k] === ' ' || code[k] === '\t' || code[k] === '\n' || code[k] === '\r')) k++;
            if (code[k] === ':') out += _span('key', code.slice(i, j));
            else out += _span('string', code.slice(i, j));
            i = j; continue;
        }
        if ((c >= '0' && c <= '9') || c === '-') {
            const numM = /^-?\d+(\.\d+)?([eE][+-]?\d+)?/.exec(code.slice(i, i + PEEK_LIMIT));
            if (numM) { out += _span('number', numM[0]); i += numM[0].length; continue; }
        }
        if (c >= 'a' && c <= 'z') {
            const wM = /^[a-z]+/.exec(code.slice(i, i + PEEK_LIMIT));
            out += _span('constant', wM[0]); i += wM[0].length; continue;
        }
        if (c === '{' || c === '}' || c === '[' || c === ']' || c === ',' || c === ':') {
            out += _span('punct', c); i++; continue;
        }
        out += escapeHtml(c); i++;
    }
    return out;
}

function getLangFromName(name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (['html', 'htm', 'xhtml', 'svg', 'vue', 'xml', 'svelte'].includes(ext)) return 'html';
    if (['css', 'scss', 'sass', 'less'].includes(ext)) return 'css';
    if (['js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx'].includes(ext)) return 'js';
    if (['json', 'json5'].includes(ext)) return 'json';
    return 'plain';
}
function highlight(code, lang) {
    try {
        switch (lang) {
            case 'html': return tokenizeHtml(code);
            case 'css':  return tokenizeCss(code);
            case 'js':   return tokenizeJs(code);
            case 'json': return tokenizeJson(code);
            default:     return escapeHtml(code);
        }
    } catch (e) { return escapeHtml(code); }
}

/* =========================================================
   编辑器主体逻辑
   ========================================================= */
const STORAGE_KEY = 'mini_code_editor_projects_v4';
const THEME_KEY = 'mini_code_editor_theme';
const FONT_KEY = 'mini_code_editor_font_size';
const IDB_NAME = 'mini_code_editor_db';
const IDB_VERSION = 3;
const IDB_STORE = 'kv';
const IDB_KEY = 'projects';
const BACKUP_KEY = STORAGE_KEY + '_backup';
const FONT_MIN = 8, FONT_MAX = 28, FONT_DEFAULT = 14;
const HIGHLIGHT_LIMIT = 30000;
const LINE_NUMBER_LIMIT = 200000;
const PASTE_HIGHLIGHT_DELAY = 200;
const PASTE_CHUNK_SIZE = 30000;
const PASTE_MIN_TRIGGER = 5000;
const UPLOAD_CONCURRENCY = 15;
const TREE_MAX_RENDER = 300;

let storageWarned = false;
let editorFontSize = FONT_DEFAULT;
let projects = [];
let currentProjectId = null;
let currentFileId = null;
let isTreeCollapsed = true;    /* 项目侧边栏默认收起（工具栏 ☰ 可收起/展开），保持原始行为 */
let saveTimer = null;
let snapshotTimer = null;
let folderViewId = null;
let highlightPending = false;
let openFileIds = [];      // ★ 已打开的文件 id，按打开顺序

const codeEditorEl = document.getElementById('codeEditor');
const highlightLayerEl = document.getElementById('highlightLayer');
const gutterEl = document.getElementById('gutter');
const editorRootEl = document.getElementById('editor');

function genId(prefix) { return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7); }
/* 修复：文件/文件夹名称清洗，去掉非法字符与控制符 */
function sanitizeItemName(raw) {
    return String(raw == null ? '' : raw)
        .replace(/[\\/:*?"<>|\r\n\t]/g, '_')
        .replace(/\s+/g, ' ')
        .trim();
}
function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}
let toastTimer2 = null;
function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    clearTimeout(toastTimer2);
    el.textContent = msg;
    el.classList.add('show');
    toastTimer2 = setTimeout(function () { el.classList.remove('show'); }, 1400);
}
let _saveIndicatorTimer = null;
function flashSaveIndicator() {
    const el = document.getElementById('saveIndicator');
    if (!el) return;
    el.classList.add('show');
    clearTimeout(_saveIndicatorTimer);
    _saveIndicatorTimer = setTimeout(function () { el.classList.remove('show'); }, 800);
}

/* ===== 内嵌对话框（替代浏览器原生 confirm/prompt，风格与应用一致）=====
   复用 .modal-overlay/.modal 体系：自动继承明暗主题与液态玻璃外观。
   uiConfirm(msg, {danger}) → Promise<boolean>   删除类传 danger 确认钮变红
   uiPrompt(msg, value)     → Promise<string|null>
   取消/点遮罩：confirm 返回 false、prompt 返回 null */
function uiDialog(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
        let ov = document.getElementById('uiDialogOverlay');
        if (!ov) {
            ov = document.createElement('div');
            ov.className = 'modal-overlay';
            ov.id = 'uiDialogOverlay';
            ov.style.zIndex = '200000';
            ov.innerHTML =
                '<div class="modal ui-dialog-modal">' +
                '  <h3 id="uiDialogTitle"></h3>' +
                '  <p class="ui-dialog-msg" id="uiDialogMsg"></p>' +
                '  <input type="text" class="ui-dialog-input" id="uiDialogInput" style="display:none">' +
                '  <div class="ui-dialog-btns">' +
                '    <button type="button" class="btn-cancel" id="uiDialogCancel"></button>' +
                '    <button type="button" class="btn-confirm" id="uiDialogOk"></button>' +
                '  </div>' +
                '</div>';
            document.body.appendChild(ov);
        }
        const msgEl = ov.querySelector('#uiDialogMsg');
        const inp = ov.querySelector('#uiDialogInput');
        const ok = ov.querySelector('#uiDialogOk');
        const cancel = ov.querySelector('#uiDialogCancel');
        ov.querySelector('#uiDialogTitle').textContent = opts.title || L('提示');
        msgEl.textContent = opts.msg || '';
        msgEl.style.display = opts.msg ? '' : 'none';
        inp.style.display = opts.input ? '' : 'none';
        if (opts.input) inp.value = opts.value || '';
        ok.textContent = opts.okText || I18N[LANG].ok || '确定';
        cancel.textContent = I18N[LANG].cancel || '取消';
        cancel.style.display = opts.onlyOk ? 'none' : '';
        ok.classList.toggle('ui-dialog-danger', !!opts.danger);
        function close(val) {
            ov.style.display = 'none';
            ok.onclick = cancel.onclick = ov.onclick = inp.onkeydown = null;
            resolve(val);
        }
        ok.onclick = function () { close(opts.input ? inp.value : true); };
        cancel.onclick = function () { close(opts.input ? null : false); };
        ov.onclick = function (e) { if (e.target === ov) close(opts.input ? null : false); };
        inp.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); ok.click(); } };
        ov.style.display = 'flex';
        if (opts.input) setTimeout(function () { inp.focus(); inp.select(); }, 60);
    });
}
function uiConfirm(msg, opts) { return uiDialog(Object.assign({ msg: msg }, opts || {})); }
function uiPrompt(msg, value) { return uiDialog({ msg: msg, input: true, value: value }); }

const OPFS_SUPPORTED = !!(navigator.storage && navigator.storage.getDirectory);
let _opfsRootPromise = null;
function getOpfsRoot() {
    if (_opfsRootPromise) return _opfsRootPromise;
    if (!OPFS_SUPPORTED) return Promise.reject(new Error(L('OPFS 不支持')));
    _opfsRootPromise = navigator.storage.getDirectory();
    return _opfsRootPromise;
}
async function opfsGetProjectDir(projectId, create) {
    const root = await getOpfsRoot();
    return root.getDirectoryHandle('proj_' + projectId, { create: !!create });
}
async function opfsWrite(projectId, fileId, blob) {
    const dir = await opfsGetProjectDir(projectId, true);
    const fh = await dir.getFileHandle(fileId, { create: true });
    const w = await fh.createWritable();
    await w.write(blob); await w.close();
}
async function opfsRead(projectId, fileId) {
    const dir = await opfsGetProjectDir(projectId, false);
    const fh = await dir.getFileHandle(fileId);
    return fh.getFile();
}
async function opfsDelete(projectId, fileId) {
    try { const dir = await opfsGetProjectDir(projectId, false); await dir.removeEntry(fileId); } catch (e) {}
}
async function opfsDeleteProject(projectId) {
    try { const root = await getOpfsRoot(); await root.removeEntry('proj_' + projectId, { recursive: true }); } catch (e) {}
}

let _idbPromise = null;
function openIDB() {
    if (_idbPromise) return _idbPromise;
    _idbPromise = new Promise(function (resolve, reject) {
        if (!window.indexedDB) { reject(new Error(L('浏览器不支持 IndexedDB'))); return; }
        const req = indexedDB.open(IDB_NAME, IDB_VERSION);
        req.onupgradeneeded = function (e) {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
        };
        req.onsuccess = function (e) { resolve(e.target.result); };
        req.onerror = function (e) { reject(e.target.error); };
    });
    return _idbPromise;
}
function idbGet(key) {
    return openIDB().then(function (db) {
        return new Promise(function (resolve, reject) {
            const tx = db.transaction(IDB_STORE, 'readonly');
            const req = tx.objectStore(IDB_STORE).get(key);
            req.onsuccess = function () { resolve(req.result); };
            req.onerror = function () { reject(req.error); };
        });
    });
}
function idbSet(key, value) {
    return openIDB().then(function (db) {
        return new Promise(function (resolve, reject) {
            const tx = db.transaction(IDB_STORE, 'readwrite');
            const req = tx.objectStore(IDB_STORE).put(value, key);
            req.onsuccess = function () { resolve(); };
            req.onerror = function () { reject(req.error); };
        });
    });
}

const _fileContentCache = Object.create(null);
const _blobUrlCache = Object.create(null);
async function loadFileContent(projectId, fileId) {
    if (fileId in _fileContentCache) return _fileContentCache[fileId];
    if (!OPFS_SUPPORTED) return null;
    try {
        const f = await opfsRead(projectId, fileId);
        const text = await f.text();
        _fileContentCache[fileId] = text; return text;
    } catch (e) { console.warn(L('OPFS 读失败：'), fileId, e); return null; }
}
async function ensureBlobUrl(projectId, fileId) {
    if (_blobUrlCache[fileId]) return _blobUrlCache[fileId];
    if (!OPFS_SUPPORTED) return null;
    try {
        const f = await opfsRead(projectId, fileId);
        const url = URL.createObjectURL(f);
        _blobUrlCache[fileId] = url; return url;
    } catch (e) { console.warn(L('OPFS Blob URL 失败：'), fileId, e); return null; }
}
function revokeBlobUrl(fileId) {
    if (_blobUrlCache[fileId]) {
        try { URL.revokeObjectURL(_blobUrlCache[fileId]); } catch (e) {}
        delete _blobUrlCache[fileId];
    }
}

/* 默认项目内置 hello.html（中文版原文，用于判断默认项目是否仍是"未动过"的初始状态） */
const DEFAULT_HELLO_ZH =
`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hello World</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
        height: 100%;
        font-family: system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
    }
    body {
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        text-align: center;
        padding: 24px;
    }
    .box {
        background: rgba(255,255,255,.12);
        padding: 48px 40px;
        border-radius: 20px;
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,.2);
        box-shadow: 0 20px 50px rgba(0,0,0,.25);
        max-width: 460px;
    }
    h1 {
        font-size: 42px;
        margin-bottom: 12px;
        letter-spacing: 2px;
    }
    p {
        font-size: 16px;
        opacity: .9;
        line-height: 1.7;
    }
    .tip {
        margin-top: 22px;
        font-size: 13px;
        opacity: .7;
    }
</style>
</head>
<body>
    <div class="box">
        <h1>Hello World 👋</h1>
        <p>这是你的第一个页面，开始创作吧！</p>
        <p class="tip">点击右上角「▶ 运行」查看效果</p>
    </div>
</body>
</html>`;
/* 英文版默认 hello.html（初始语言选 English 时使用） */
const DEFAULT_HELLO_EN =
`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hello World</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
        height: 100%;
        font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
    }
    body {
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        text-align: center;
        padding: 24px;
    }
    .box {
        background: rgba(255,255,255,.12);
        padding: 48px 40px;
        border-radius: 20px;
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,.2);
        box-shadow: 0 20px 50px rgba(0,0,0,.25);
        max-width: 460px;
    }
    h1 {
        font-size: 42px;
        margin-bottom: 12px;
        letter-spacing: 2px;
    }
    p {
        font-size: 16px;
        opacity: .9;
        line-height: 1.7;
    }
    .tip {
        margin-top: 22px;
        font-size: 13px;
        opacity: .7;
    }
</style>
</head>
<body>
    <div class="box">
        <h1>Hello World 👋</h1>
        <p>This is your first page — start creating!</p>
        <p class="tip">Tap "▶ Run" at the top right to see it live</p>
    </div>
</body>
</html>`;
/* 默认项目构建函数：在 initLang() 之后调用，跟随当前语言（中文/英文） */
function buildDefaultProjects() {
    return [
        {
            id: 'default-project',
            name: L('默认项目'),
            fileTree: [
                {
                    id: 'root',
                    name: L('项目根目录'),
                    type: 'folder',
                    children: [
                        {
                            id: 'hello-world-file',
                            name: 'hello.html',
                            type: 'file',
                            content: (LANG === 'en') ? DEFAULT_HELLO_EN : DEFAULT_HELLO_ZH
                        }
                    ]
                }
            ]
        }
    ];
}
/* 判断当前项目列表是否仍是"未动过"的初始默认项目（语言选择后可整体切换为中/英文版）
   注意：首次进入时 currentProjectId 为空，不能用 findFileById（依赖当前项目），
   必须直接在默认项目的文件树里查找 */
function isPristineDefaultProject() {
    if (projects.length !== 1 || projects[0].id !== 'default-project') return false;
    if (projects[0].name !== '默认项目' && projects[0].name !== L('默认项目')) return false;
    const root = (projects[0].fileTree || []).find(function (n) { return n.id === 'root'; });
    if (!root || !Array.isArray(root.children)) return false;
    const f = root.children.find(function (n) { return n.name === 'hello.html'; });
    return !!f && (f.content === DEFAULT_HELLO_ZH || f.content === DEFAULT_HELLO_EN);
}
function getCurrentFileTree() {
    const proj = projects.find(p => p.id === currentProjectId);
    return proj ? proj.fileTree : [];
}
function setCurrentFileTree(tree) {
    const proj = projects.find(p => p.id === currentProjectId);
    if (proj) proj.fileTree = tree;
}
function findFileById(id, nodes) {
    if (!nodes) nodes = getCurrentFileTree();
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
            const found = findFileById(id, node.children);
            if (found) return found;
        }
    }
    return null;
}
function findFileByName(name, nodes) {
    if (!nodes) nodes = getCurrentFileTree();
    for (const node of nodes) {
        if (node.type === 'file' && node.name === name) return node;
        if (node.children) {
            const found = findFileByName(name, node.children);
            if (found) return found;
        }
    }
    return null;
}
/* 查找节点父级（健壮版）：
   - 目标在子文件夹内 → 返回该文件夹节点
   - 目标在根层（root.children）→ 返回 root 节点（旧版返回 null，导致调用方误取整个 fileTree 数组）
   - 未找到 → 返回 null */
function findParent(id) {
    const tree = getCurrentFileTree();
    const root = tree.find(function (n) { return n.id === 'root'; }) || null;
    function walk(nodes, parent) {
        for (const node of nodes) {
            if (node.id === id) return parent;
            if (node.children) {
                const r = walk(node.children, node);
                if (r !== undefined) return r; /* 用 undefined 区分"未找到"与"父是根" */
            }
        }
        return undefined;
    }
    const r = walk(tree, root);
    return r === undefined ? null : r;
}
function syncCurrentFileContent() {
    if (!currentProjectId || !currentFileId) return;
    const file = findFileById(currentFileId);
    if (file && file.editable !== false) {
        file.content = codeEditorEl.value;
        scheduleOpfsWriteback(file, 0);
    }
}
function stringifyProjects() {
    return JSON.stringify(projects, function (key, value) {
        if (key === '_undoStack' || key === '_redoStack' || key === '_blobUrl') return undefined;
        if (key === 'content' && this && typeof this === 'object' && this.inOpfs === true) return undefined;
        return value;
    });
}
function saveProjects(silent) {
    syncCurrentFileContent();
    const json = stringifyProjects();
    idbSet(IDB_KEY, json).then(flashSaveIndicator).catch(function (err) {
        console.warn(L('IDB 保存失败：'), err);
        try { localStorage.setItem(STORAGE_KEY, json); } catch (e) {}
    });
    return true;
}
async function loadProjects() {
    let data = null;
    try {
        const raw = await idbGet(IDB_KEY);
        if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed) && parsed.length > 0) data = parsed; }
    } catch (e) { console.warn(L('IDB 读取失败：'), e); }
    if (!data) {
        try {
            const raw = localStorage.getItem(BACKUP_KEY);
            if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed) && parsed.length > 0) data = parsed; }
        } catch (e) {}
    }
    if (!data) {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    data = parsed;
                    try { await idbSet(IDB_KEY, raw); } catch (e) {}
                    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
                }
            }
        } catch (e) {}
    }
    if (data) {
        data.forEach(function (proj) {
            (function cleanTree(nodes) {
                if (!nodes) return;
                nodes.forEach(function (n) {
                    delete n._undoStack; delete n._redoStack;
                    if (n.children) cleanTree(n.children);
                });
            })(proj.fileTree);
        });
    }
    return data;
}
function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { saveProjects(true); }, 600);
}
/* 修复：inOpfs 文本文件的编辑内容必须回写 OPFS，否则刷新后丢失 */
const _opfsWritebackTimers = Object.create(null);
function scheduleOpfsWriteback(file, delay) {
    if (!file || file.inOpfs !== true || file.editable === false || !currentProjectId) return;
    clearTimeout(_opfsWritebackTimers[file.id]);
    _opfsWritebackTimers[file.id] = setTimeout(function () {
        const text = file.content;
        if (text === null || text === undefined) return;
        _fileContentCache[file.id] = text;
        opfsWrite(currentProjectId, file.id, new Blob([text], { type: 'text/plain;charset=utf-8' }))
            .catch(function (e) { console.warn(L('OPFS 回写失败：'), e); });
    }, delay === undefined ? 400 : delay);
}

function initTheme() {
    let theme = 'dark';
    try { theme = localStorage.getItem(THEME_KEY) || 'dark'; } catch (e) {}
    applyTheme(theme);
}
/* 工具 iframe 主题引导：继承父页主题 + 监听切换广播（srcdoc 注入占位符） */
const THEME_BOOT = "(function(){var apply=function(t){document.body.classList.toggle('light-theme',t==='light');};try{apply(parent.document.body.classList.contains('light-theme')?'light':'dark');}catch(e){}try{window.addEventListener('message',function(e){var d=e.data;if(d&&d.__atsTheme)apply(d.__atsTheme);});}catch(e){}})();";
function broadcastTheme(theme) {
    document.querySelectorAll('iframe').forEach(function (f) {
        try { if (f.contentWindow) f.contentWindow.postMessage({ __atsTheme: theme }, '*'); } catch (err) {}
    });
}
function applyTheme(theme) {
    if (theme === 'light') document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
    refreshSettingsActive();
    broadcastTheme(theme);
}
function setTheme(theme) {
    try { localStorage.setItem(THEME_KEY, theme); } catch (err) {}
    applyTheme(theme);
}
/* ===== 样式版本（新版：模型查看大图标凸左；旧版：原始紧凑）===== */
const STYLE_KEY = 'ats_ui_style';
let UI_STYLE = 'fancy';
try { const sv = localStorage.getItem(STYLE_KEY); if (sv === 'plain' || sv === 'old') UI_STYLE = 'plain'; } catch (err) {}
/* 玻璃效果：orig=原样（默认），liquid=液态玻璃 */
const GLASS_KEY = 'ats_ui_glass';
let UI_GLASS = 'orig';
try { const gv = localStorage.getItem(GLASS_KEY); if (gv === 'liquid') UI_GLASS = 'liquid'; } catch (err) {}
/* 液态形状：round=圆角（默认），square=方角（仅液态下生效） */
const GLASS_SHAPE_KEY = 'ats_ui_glass_shape';
let UI_GLASS_SHAPE = 'round';
try { const sv = localStorage.getItem(GLASS_SHAPE_KEY); if (sv === 'square') UI_GLASS_SHAPE = 'square'; } catch (err) {}
/* ===== 界面文字大小：编辑区字号不变 ===== */
const UIFS_KEY = 'ats_ui_font';
const UIFS_MIN = 11, UIFS_MAX = 24;   /* 可调范围：与 index.html 滑块 min/max 保持一致 */
/* app.js 由 index.html loader 在 DOMContentLoaded 里动态注入，执行时事件已过期，
   必须按 readyState 判断立即绑定，否则滑块监听永不生效 */
function bindUiFontSizeSlider() {
    const rng = document.getElementById('uiFsRange');
    if (rng && !rng.dataset.fsBound) {
        rng.dataset.fsBound = '1';
        rng.addEventListener('input', function () { applyUiFontSize(this.value); });
        rng.addEventListener('change', function () { applyUiFontSize(this.value); });
        /* 自定义拖动：接管原生滑块（原生在部分安卓上拖不到两端），
           由 JS 精确映射到 UIFS_MIN~UIFS_MAX，外观仍保持原生蓝色圆点 */
        const row = rng.closest('.fs-row');
        let dragging = false;
        function valFromX(clientX) {
            const rect = rng.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            return Math.round(UIFS_MIN + ratio * (UIFS_MAX - UIFS_MIN));
        }
        if (row) row.addEventListener('pointerdown', function (e) {
            dragging = true;
            applyUiFontSize(valFromX(e.clientX));
        });
        window.addEventListener('pointermove', function (e) {
            if (dragging) applyUiFontSize(valFromX(e.clientX));
        });
        function endDrag() { dragging = false; }
        window.addEventListener('pointerup', endDrag);
        window.addEventListener('pointercancel', endDrag);
    }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindUiFontSizeSlider);
} else {
    bindUiFontSizeSlider();
}
function applyUiFontSize(px) {
    const v = Math.max(UIFS_MIN, Math.min(UIFS_MAX, parseInt(px, 10) || 13));
    document.documentElement.style.setProperty('--ui-fs', v + 'px');
    const rng = document.getElementById('uiFsRange');
    const val = document.getElementById('uiFsVal');
    if (rng) {
        rng.value = v;
        try { rng.style.setProperty('--fs-fill', Math.round((v - UIFS_MIN) / (UIFS_MAX - UIFS_MIN) * 100) + '%'); } catch (e) {}
    }
    if (val) val.textContent = v + 'px';
    try { localStorage.setItem(UIFS_KEY, String(v)); } catch (err) {}
}
/* ===== 首次进入：语言选择 ===== */
function showFirstLang() {
    const m = document.getElementById('firstLangModal');
    if (!m) return;
    if (m.parentElement !== document.body) document.body.appendChild(m);  /* 脱离嵌套，保证层级 */
    m.style.display = 'flex';
}
function closeFirstLang() {
    const m = document.getElementById('firstLangModal');
    if (m) m.style.display = 'none';
    try { localStorage.setItem('ats_lang_asked', '1'); } catch (err) {}
}
function pickFirstLang(lang) {
    setLang(lang);
    /* 初始选择英文：把"未动过"的默认项目整体切换为英文版（名称 + hello.html 内容）
       若此时项目列表尚未加载完成（首次进入时序），先记挂起标记，项目加载后再转换 */
    if (lang === 'en') {
        if (typeof isPristineDefaultProject === 'function' && isPristineDefaultProject()) {
            projects = JSON.parse(JSON.stringify(buildDefaultProjects()));
            saveProjects(true);
            renderProjectList();
        } else if (!projects || !projects.length) {
            window.__ATS_PENDING_EN_DEFAULT = true;
        }
    }
    /* 选择后：高亮所选语言，关闭按钮 → 确认按钮（点击确认才关闭） */
    document.querySelectorAll('#firstLangModal .fl-opt').forEach(function (b) {
        b.classList.toggle('picked', b.getAttribute('onclick').indexOf("'" + lang + "'") > -1);
    });
    const btn = document.getElementById('flSkipBtn');
    if (btn) {
        btn.classList.add('confirm');
        btn.setAttribute('data-i18n', 'confirm_lang');
        btn.textContent = I18N[LANG].confirm_lang || '确认';
    }
}
function applyGlassStyle(v) {
    UI_GLASS = (v === 'liquid') ? 'liquid' : 'orig';
    try { localStorage.setItem(GLASS_KEY, UI_GLASS); } catch (err) {}
    document.body.classList.toggle('ui-liquid', UI_GLASS === 'liquid');
    refreshSettingsActive();
}
function applyGlassShape(v) {
    UI_GLASS_SHAPE = (v === 'square') ? 'square' : 'round';
    try { localStorage.setItem(GLASS_SHAPE_KEY, UI_GLASS_SHAPE); } catch (err) {}
    document.body.classList.toggle('ui-liquid-sq', UI_GLASS_SHAPE === 'square');
    refreshSettingsActive();
}
function applyStyleVersion(v) {
    UI_STYLE = (v === 'plain' || v === 'old') ? 'plain' : 'fancy';
    try { localStorage.setItem(STYLE_KEY, UI_STYLE); } catch (err) {}
    document.body.classList.toggle('ui-fancy', UI_STYLE === 'fancy');
    document.body.classList.toggle('ui-plain', UI_STYLE === 'plain');
    /* 模型查看大图标：方角（plain）与圆角（fancy）两种模式保持一致（28px 凸左） */
    const svg = document.getElementById('mvIconSvg');
    const span = document.getElementById('mvIconSpan');
    if (svg && span) {
        svg.style.width = '28px'; svg.style.height = '28px'; svg.style.marginLeft = '-5px';
        span.style.marginLeft = '-5px';
    }
    refreshSettingsActive();
}
/* ===== 设置弹窗（中心：主题 + 语言）===== */
function fitSettingsModal() {
    const m = document.querySelector('.settings-modal');
    if (!m) return;
    let h = window.innerHeight || 0;
    try { if (window.visualViewport && window.visualViewport.height) h = window.visualViewport.height; } catch (e) {}
    m.style.maxHeight = Math.max(220, h - 28) + 'px';
}
function openSettingsModal() {
    closeToolsMenu(); closeZipMenu();
    refreshSettingsActive();
    document.getElementById('settingsModal').style.display = 'flex';
    fitSettingsModal();
}
function closeSettingsModal() {
    const m = document.getElementById('settingsModal');
    if (m) m.style.display = 'none';
}
function refreshSettingsActive() {
    const isLight = document.body.classList.contains('light-theme');
    const d = document.getElementById('optThemeDark');
    const l = document.getElementById('optThemeLight');
    if (d) d.classList.toggle('active', !isLight);
    if (l) l.classList.toggle('active', isLight);
    const zh = document.getElementById('optLangZh');
    const en = document.getElementById('optLangEn');
    if (zh) zh.classList.toggle('active', LANG === 'zh');
    if (en) en.classList.toggle('active', LANG === 'en');
    const sn = document.getElementById('optStyleNew');
    const so = document.getElementById('optStyleOld');
    if (sn) sn.classList.toggle('active', UI_STYLE === 'fancy');
    if (so) so.classList.toggle('active', UI_STYLE === 'plain');
    const go = document.getElementById('optGlassOrig');
    const gl = document.getElementById('optGlassLiquid');
    if (go) go.classList.toggle('active', UI_GLASS === 'orig');
    if (gl) gl.classList.toggle('active', UI_GLASS === 'liquid');
    const sr = document.getElementById('optShapeRound');
    const sq = document.getElementById('optShapeSquare');
    if (sr) sr.classList.toggle('active', UI_GLASS_SHAPE === 'round');
    if (sq) sq.classList.toggle('active', UI_GLASS_SHAPE === 'square');
    refreshFullscreenActive();
}

/* ===== 全屏 / 退出全屏 / 刷新页面（设置面板） ===== */
function fsElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
}
function enterFullscreen() {
    const el = document.documentElement;
    let p = null;
    try {
        if (el.requestFullscreen) p = el.requestFullscreen();
        else if (el.webkitRequestFullscreen) p = el.webkitRequestFullscreen();
        else if (el.msRequestFullscreen) p = el.msRequestFullscreen();
    } catch (e) { p = null; }
    if (!p) showToast((I18N[LANG] && I18N[LANG].fs_unsupported) || '当前浏览器不支持全屏');
    else if (p.catch) p.catch(function () { showToast((I18N[LANG] && I18N[LANG].fs_unsupported) || '当前浏览器不支持全屏'); });
}
function exitFullscreen() {
    let p = null;
    try {
        if (document.exitFullscreen) p = document.exitFullscreen();
        else if (document.webkitExitFullscreen) p = document.webkitExitFullscreen();
        else if (document.msExitFullscreen) p = document.msExitFullscreen();
    } catch (e) { p = null; }
    if (p && p.catch) p.catch(function () {});
}
/* 默认退出全屏：无全屏元素时“退出全屏”按钮为激活态 */
function refreshFullscreenActive() {
    const fs = !!fsElement();
    const on = document.getElementById('optFsOn');
    const off = document.getElementById('optFsOff');
    if (on) on.classList.toggle('active', fs);
    if (off) off.classList.toggle('active', !fs);
}
function refreshPage() {
    try { location.reload(); } catch (e) { location.href = location.href; }
}
document.addEventListener('fullscreenchange', refreshFullscreenActive);
document.addEventListener('webkitfullscreenchange', refreshFullscreenActive);
/* ===== 多语言（中/英）===== */
const LANG_KEY = 'ats_editor_lang';
let LANG = 'zh';
/* I18N loaded from data/zh.json & data/en.json */
/* L()：以中文为键的即时翻译（主文档动态文本用），_z 存于 en.json */
function L(s) {
    try {
        if (LANG === 'en') { var z = I18N.en && I18N.en._z; if (z && z[s] !== undefined) return z[s]; }
    } catch (e) {}
    return s;
}
let I18N = { zh: {}, en: {} };
(function () {
    function loadSync(url) {
        try {
            if (window.__ATS_SRC && window.__ATS_SRC[url] !== undefined) return JSON.parse(window.__ATS_SRC[url]);
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url + '?_=' + Date.now(), false);  /* 缓存穿透 */
            xhr.send();
            if (xhr.status === 200 || xhr.status === 0) return JSON.parse(xhr.responseText);
        } catch (e) { console.warn('i18n load failed:', url, e); }
        return null;
    }
    var zh = loadSync('data/zh.json');
    var en = loadSync('data/en.json');
    if (zh) I18N.zh = zh;
    if (en) I18N.en = en;
})();
function applyLang() {
    const dict = I18N[LANG] || I18N.zh;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
        const k = el.getAttribute('data-i18n');
        if (dict[k] !== undefined) el.textContent = dict[k];
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
        const k = el.getAttribute('data-i18n-ph');
        if (dict[k] !== undefined) el.placeholder = dict[k];
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
        const k = el.getAttribute('data-i18n-title');
        if (dict[k] !== undefined) el.title = dict[k];
    });
    document.documentElement.lang = (LANG === 'en') ? 'en' : 'zh-CN';
    /* 页面标题跟随语言 */
    try { if (dict.title) document.title = dict.title; } catch (err) {}
    /* 字体预览输入框默认值跟随语言（仅在未被用户改过时替换） */
    try {
        const fp = document.getElementById('fontPreviewInput');
        if (fp) {
            const zhVal = I18N.zh.font_preview_val || 'Ats编辑器 字体预览 ABCabc 123';
            const enVal = I18N.en.font_preview_val || 'Ats Editor Font Preview ABCabc 123';
            if (fp.value === zhVal || fp.value === enVal) fp.value = (LANG === 'en') ? enVal : zhVal;
        }
    } catch (err) {}
  /* 工具 iframe 语言广播（实时跟随切换） */
  document.querySelectorAll('iframe').forEach(function (f) {
    try { if (f.contentWindow) f.contentWindow.postMessage({ __atsLang: LANG }, '*'); } catch (err) {}
  });
    try { if (typeof renderProjectList === 'function') renderProjectList(); } catch (err) {}
    refreshSettingsActive();
}
function setLang(lang) {
    LANG = (lang === 'en') ? 'en' : 'zh';
    try { localStorage.setItem(LANG_KEY, LANG); } catch (e) {}
    applyLang();
}
function initLang() {
    try { LANG = localStorage.getItem(LANG_KEY) || 'zh'; } catch (e) { LANG = 'zh'; }
    if (LANG !== 'en' && LANG !== 'zh') LANG = 'zh';
    applyLang();
}

function toggleToolsMenu(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('toolsMenu');
    if (!menu) return;
    menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
}
function closeToolsMenu() {
    const menu = document.getElementById('toolsMenu');
    if (menu) menu.style.display = 'none';
}
document.addEventListener('click', function (e) {
    const wrapper = document.getElementById('toolsWrapper');
    if (!wrapper) return;
    if (!wrapper.contains(e.target)) closeToolsMenu();
});

/* ============ 转换解压工具 ============ */
/* 通用：把模板填充到工具 iframe（标题 + 模板 id），记录参数供刷新按钮重放 */
let lastToolCall = null;

/* ===== 源码覆盖：模板内 js/css 引用替换为 blob URL（编辑源码功能）===== */
function srcOverrideBlob(path) {
    try {
        var SRC = window.__ATS_SRC || {};
        if (SRC[path] !== undefined) return URL.createObjectURL(new Blob([SRC[path]], { type: 'text/plain' }));
    } catch (e) {}
    return null;
}
function applySrcOverridesToHtml(html) {
    try {
        var SRC = window.__ATS_SRC || {};
        var ts = Date.now();
        (typeof SRC_FILES !== 'undefined' ? SRC_FILES : Object.keys(SRC)).forEach(function (p) {
            if (!/\.(js|css)$/.test(p)) return;
            var ov = SRC[p] !== undefined;
            var url = ov ? srcOverrideBlob(p) : (p + '?_=' + ts);  /* 覆盖用 blob，否则缓存穿透 */
            if (!url) return;
            html = html.split('src="' + p + '"').join('src="' + url + '"');
            html = html.split('href="' + p + '"').join('href="' + url + '"');
        });
    } catch (e) {}
    return html;
}

/* 工具 iframe 滚动基线：iOS 上 iframe 内视口滚动不可靠，
   必须让 body 成为固定高度的真实滚动容器（height:100% + overflow-y:auto） */
const IFRAME_SCROLL_CSS =
    '<style>html{height:100%;overflow:hidden;}' +
    'body{height:100%;box-sizing:border-box;margin:0;' +
    'overflow-x:hidden;overflow-y:auto;' +
    '-webkit-overflow-scrolling:touch;overscroll-behavior:contain;}' +
    '</style>';

function openTplTool(tplId, titleKey, fallback) {
    lastToolCall = { tplId: tplId, titleKey: titleKey, fallback: fallback };
    const t = document.getElementById('toolViewerTitle');
    if (t) t.textContent = I18N[LANG][titleKey] || fallback;
    const tpl = document.getElementById(tplId);
    const overlay = document.getElementById('toolViewerOverlay');
    const frame = document.getElementById('toolViewerFrame');
    if (!tpl || !overlay || !frame) return false;
    frame.srcdoc = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
        '<title>' + (I18N[LANG][titleKey] || fallback) + '</title>' +
        IFRAME_SCROLL_CSS + '</head><body>' +
        applySrcOverridesToHtml(tpl.innerHTML) + '<script>' + THEME_BOOT + '<\\/script></body></html>';
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    return true;
}
function onToolsBase64(e) {
    if (e) e.stopPropagation();
    closeToolsMenu();
    openTplTool('base64ToolTemplate', 'convert', '转换解压');
}
function onToolsImg(e) {
    if (e) e.stopPropagation();
    closeToolsMenu();
    openTplTool('imgToolTemplate', 'img_tool', '编辑图片');
}
/* 图片编辑器（iframe）→ 存入文件仓库 */
window.addEventListener('message', function (e) {
    const data = e.data;
    if (!data || data.__editorLog) return;
    if (!data.__repoSave) return;
    (async function () {
        try {
            if (!OPFS_SUPPORTED) { postRepoSaveAck(false, L('当前浏览器不支持 OPFS')); return; }
            const id = genId('repo');
            const safeName = sanitizeItemName(data.name) || ('file_' + Date.now());
            const mime = (data.blob && data.blob.type) || 'application/octet-stream';
            await opfsWrite(REPO_SCOPE, id, data.blob);
            repoFiles.push({
                id: id, name: safeName, originalName: safeName,
                mime: mime, size: (data.blob && data.blob.size) || 0,
                isImage: /^image\//i.test(mime), isAudio: /^audio\//i.test(mime), uploaded: Date.now()
            });
            saveRepoMeta();
            if (document.getElementById('repoViewer').style.display === 'flex') renderRepoList();
            postRepoSaveAck(true, safeName);
        } catch (err) { postRepoSaveAck(false, err.message); }
    })();
});
function postRepoSaveAck(ok, msg) {
    /* 广播到所有可能发起保存的工具 iframe（图片编辑器 / 模型查看器） */
    ['toolViewerFrame', 'modelViewerFrame'].forEach(function (fid) {
        var fr = document.getElementById(fid);
        if (fr && fr.contentWindow) {
            try { fr.contentWindow.postMessage({ __repoSaveAck: ok, msg: msg }, '*'); } catch (e) {}
        }
    });
}
function closeToolViewer() {
    const overlay = document.getElementById('toolViewerOverlay');
    const frame = document.getElementById('toolViewerFrame');
    if (overlay) overlay.classList.remove('active');
    if (frame) frame.srcdoc = '';
    document.body.style.overflow = '';
}
/* 优化：合并三个重复的 Escape 监听，按优先级关闭当前激活的浮层 */
document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    const closers = [
        ['toolViewerOverlay', closeToolViewer],
        ['modelViewerOverlay', closeModelViewer],
        ['appViewerOverlay', closeAppViewer]
    ];
    for (let i = 0; i < closers.length; i++) {
        const overlay = document.getElementById(closers[i][0]);
        if (overlay && overlay.classList.contains('active')) { closers[i][1](); return; }
    }
});


/* ===== 编辑源码：修改 index/css/js/data，保存后刷新页面生效 ===== */
const SRC_FILES = [
    'index.html',
    'css/style.css', 'css/img-tool.css', 'css/base64-tool.css', 'css/model-viewer.css', 'css/inline-model.css', 'css/ai-edit.css',
    'js/app.js', 'js/img-tool.js', 'js/base64-tool.js', 'js/model-viewer.js', 'js/inline-model.js', 'js/ai-edit.js',
    'data/zh.json', 'data/en.json'
];
function onToolsSrcEditor(e) {
    if (e) e.stopPropagation();
    closeToolsMenu(); closeZipMenu();
    openSrcEditor();
}
function srcGetStore() {
    try { return JSON.parse(localStorage.getItem('ats_src') || '{}'); } catch (err) { return {}; }
}
function srcSetStore(o) {
    try { localStorage.setItem('ats_src', JSON.stringify(o)); } catch (err) { showToast(L('保存失败（忽略）：')); }
}
function openSrcEditor() {
    let ov = document.getElementById('srcEditorOverlay');
    if (!ov) {
        ov = document.createElement('div');
        ov.id = 'srcEditorOverlay';
        ov.className = 'src-editor-overlay';
        ov.innerHTML = '<div class="src-editor-panel">' +
            '<div class="src-editor-head">' +
              '<span class="src-editor-title">' + (I18N[LANG].src_title || '源码编辑器') + '</span>' +
              '<span class="src-head-btns">' +
                '<button class="src-toggle-list" id="srcToggleList" onclick="toggleSrcFileList()" title="' + (I18N[LANG].src_collapse_list || '收起文件列表') + '"><svg viewBox="0 0 24 24"><path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg></button>' +
                '<button class="src-x" onclick="closeSrcEditor()" title="' + (I18N[LANG].close || '关闭') + '">✕</button>' +
              '</span>' +
            '</div>' +
            '<div class="src-editor-body">' +
              '<div class="src-file-list" id="srcFileList"></div>' +
              '<div class="src-edit-area">' +
                '<textarea id="srcTextArea" spellcheck="false" wrap="off"></textarea>' +
                '<div class="src-actions">' +
                  '<button class="src-btn go" id="srcSaveBtn" onclick="srcSaveCurrent()">' + (I18N[LANG].src_save || '保存') + '</button>' +
                  '<button class="src-btn" id="srcResetBtn" onclick="srcResetCurrent()">' + (I18N[LANG].src_reset || '恢复默认') + '</button>' +
                  '<span class="src-status" id="srcStatus"></span>' +
                '</div>' +
              '</div>' +
            '</div>' +
        '</div>';
        ov.addEventListener('click', function (e) { if (e.target === ov) closeSrcEditor(); });
        document.body.appendChild(ov);
    }
    ov.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    /* 文件列表默认展开，每次打开重置 */
    const body = ov.querySelector('.src-editor-body');
    if (body) body.classList.remove('list-collapsed');
    const tg = document.getElementById('srcToggleList');
    if (tg) {
        tg.classList.remove('on');
        tg.title = I18N[LANG].src_collapse_list || '收起文件列表';
    }
    renderSrcFileList();
}
/* 收起 / 展开源码编辑器的文件列表 */
function toggleSrcFileList() {
    const body = document.querySelector('.src-editor-body');
    if (!body) return;
    const collapsed = body.classList.toggle('list-collapsed');
    const tg = document.getElementById('srcToggleList');
    if (tg) {
        tg.classList.toggle('on', collapsed);
        tg.title = collapsed
            ? (I18N[LANG].src_expand_list || '展开文件列表')
            : (I18N[LANG].src_collapse_list || '收起文件列表');
    }
}
function closeSrcEditor() {
    const ov = document.getElementById('srcEditorOverlay');
    if (ov) ov.style.display = 'none';
    document.body.style.overflow = '';
}
let srcCurrent = null;
const SRC_GROUPS = { '': '📄 根目录', 'css/': '🎨 css/', 'js/': '⚙️ js/', 'data/': '🌐 data/' };
const srcGroupOpen = { '': true, 'css/': true, 'js/': true, 'data/': true };  /* 默认全展开 */
function renderSrcFileList() {
    const list = document.getElementById('srcFileList');
    const store = srcGetStore();
    list.innerHTML = '';
    /* 按目录分组，组头可折叠 */
    Object.keys(SRC_GROUPS).forEach(function (g) {
        const files = SRC_FILES.filter(function (p) {
            return g === '' ? !p.includes('/') : p.startsWith(g);
        });
        if (!files.length) return;
        const gMod = files.some(function (p) { return store[p] !== undefined; });
        const head = document.createElement('button');
        head.className = 'src-group' + (srcGroupOpen[g] ? ' open' : '');
        head.innerHTML = (srcGroupOpen[g] ? '▾ ' : '▸ ') + (g === '' ? '📄 ' + (I18N[LANG].root_dir || '根目录') : SRC_GROUPS[g]) + (gMod ? ' <span class="src-gmod">●</span>' : '');
        head.addEventListener('click', function () {
            srcGroupOpen[g] = !srcGroupOpen[g];
            renderSrcFileList();
        });
        list.appendChild(head);
        if (!srcGroupOpen[g]) return;
        files.forEach(function (p) {
            const b = document.createElement('button');
            b.className = 'src-file' + (srcCurrent === p ? ' on' : '') + (store[p] !== undefined ? ' mod' : '');
            b.textContent = (store[p] !== undefined ? '● ' : '') + p.split('/').pop();
            b.title = p;
            b.addEventListener('click', function () { loadSrcFile(p); });
            list.appendChild(b);
        });
    });
}
async function loadSrcFile(p) {
    srcCurrent = p;
    const ta = document.getElementById('srcTextArea');
    const st = document.getElementById('srcStatus');
    const store = srcGetStore();
    ta.value = '';
    st.textContent = '…';
    try {
        let text;
        if (store[p] !== undefined) {
            text = store[p];
            st.textContent = (I18N[LANG].src_modified || '已修改');
        } else {
            const r = await fetch(p, { cache: 'no-store' });
            text = await r.text();
            st.textContent = '';
        }
        ta.value = text;
    } catch (err) {
        st.textContent = 'Load failed';
    }
    renderSrcFileList();
}
function srcSaveCurrent() {
    if (!srcCurrent) return;
    const store = srcGetStore();
    store[srcCurrent] = document.getElementById('srcTextArea').value;
    srcSetStore(store);
    document.getElementById('srcStatus').textContent = I18N[LANG].src_saved || '已保存，刷新页面后生效';
    renderSrcFileList();
}
function srcResetCurrent() {
    if (!srcCurrent) return;
    const store = srcGetStore();
    delete store[srcCurrent];
    srcSetStore(store);
    document.getElementById('srcStatus').textContent = I18N[LANG].src_reset_done || '已恢复默认（刷新后生效）';
    loadSrcFile(srcCurrent);
}

/* ===== AI 编辑（GLM-4.7-Flash）：面板逻辑在 js/ai-edit.js ===== */
function onToolsAiEdit(e) {
    if (e) e.stopPropagation();
    closeToolsMenu(); closeZipMenu();
    if (typeof openAiPanel === 'function') openAiPanel();
}

function onToolsModelViewer(e) {
    if (e) e.stopPropagation();
    closeToolsMenu();
    openModelViewer();
}
function openModelViewer() {
    const tpl = document.getElementById('modelViewerTemplate');
    const overlay = document.getElementById('modelViewerOverlay');
    const frame = document.getElementById('modelViewerFrame');
    if (!tpl || !overlay || !frame) return;
    frame.srcdoc = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
        '<title>' + (I18N[LANG].mv_title || 'Ats模型查看器') + '</title>' + IFRAME_SCROLL_CSS + '</head><body>' +
        applySrcOverridesToHtml(tpl.innerHTML) + '<script>' + THEME_BOOT + '<\\/script></body></html>';
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeModelViewer() {
    const overlay = document.getElementById('modelViewerOverlay');
    const frame = document.getElementById('modelViewerFrame');
    if (overlay) overlay.classList.remove('active');
    if (frame) frame.srcdoc = '';
    document.body.style.overflow = '';
}

/* ============ 应用预览：全屏打开嵌入页面 ============ */
function openAppViewer() {
    const overlay = document.getElementById('appViewerOverlay');
    const frame = document.getElementById('appViewerFrame');
    if (!overlay || !frame) return;
    frame.srcdoc = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
        '<title>' + L('嵌入页面') + '</title>' +
        '<style>' +
        '*{margin:0;padding:0;box-sizing:border-box;}' +
        'html,body{width:100%;height:100%;overflow:hidden;background:#fff;}' +
        'iframe{display:block;width:100%;height:100%;border:none;}' +
        '</style></head><body>' +
        '<iframe src="https://ats-bianjiqi.github.io/Download.html" ' +
        'allowfullscreen loading="lazy" referrerpolicy="no-referrer"></iframe>' +
        '</body></html>';
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeAppViewer() {
    const overlay = document.getElementById('appViewerOverlay');
    const frame = document.getElementById('appViewerFrame');
    if (overlay) overlay.classList.remove('active');
    if (frame) frame.srcdoc = '';
    document.body.style.overflow = '';
}

const downloadBtn = document.getElementById('downloadBtn');
if (downloadBtn) {
    downloadBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeToolsMenu();
        openAppViewer();
    });
}

let warnLogs = [];
let warnMissingSet = new Set();
let warnPanelVisible = false;
let warnFilter = 'all';
let warnUnread = 0;
let warnAutoScroll = true;
function addWarnLog(type, data) {
    if (type === 'error' && typeof data === 'string' && data.startsWith(L('缺失文件：'))) {
        if (warnMissingSet.has(data)) return;
        warnMissingSet.add(data);
    }
    if (warnLogs.length > 500) warnLogs.shift();
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    warnLogs.push({ type: type, data: String(data), time: time, id: Date.now() + '_' + Math.random() });

    if (!warnPanelVisible) warnUnread++;
    renderWarnList();
}

function renderWarnList() {
    const listEl = document.getElementById('warnList');
    const badgeEl = document.getElementById('warnBadge');
    const btnEl = document.getElementById('warnBtn');
    const countEl = document.getElementById('warnCount');
    if (!listEl || !badgeEl || !btnEl) return;

    const errCount = warnLogs.filter(l => l.type === 'error').length;
    const warnCount = warnLogs.length - errCount;
    const total = warnLogs.length;

    // 按钮角标 / 未读状态
    if (total === 0) {
        badgeEl.classList.remove('show');
        btnEl.classList.remove('has-errors', 'unread');
        if (countEl) countEl.textContent = '';
    } else {
        badgeEl.textContent = total > 99 ? '99+' : String(total);
        badgeEl.classList.add('show');
        btnEl.classList.toggle('has-errors', errCount > 0);
        btnEl.classList.toggle('unread', warnUnread > 0 && !warnPanelVisible);
    }
    if (countEl) {
        countEl.textContent = errCount + L(' 错 ') + warnCount + L(' 警');
    }

    // 过滤
    const shown = warnFilter === 'all'
        ? warnLogs
        : warnLogs.filter(l => l.type === warnFilter);

    if (warnLogs.length === 0) {
        listEl.innerHTML = '<div class="warn-empty"><span class="ok-icon">✓</span>' + L('暂无错误或警告') + '</div>';
        return;
    }
    if (shown.length === 0) {
        listEl.innerHTML = '<div class="warn-empty" style="color:#6a7d95">' + L('当前筛选下没有日志') + '</div>';
        return;
    }

    // 记录滚动状态
    const wasAtBottom = listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight < 30;

    listEl.innerHTML = shown.map(function (log) {
        const icon = log.type === 'error' ? '✕' : '⚠';
        const longCls = log.data.length > 200 ? ' long' : '';
        return '<div class="warn-item ' + log.type + longCls + '" data-id="' + log.id + '">' +
            '<span class="warn-icon">' + icon + '</span>' +
            '<span class="warn-text">' + escapeHtml(log.data) + '</span>' +
            '<span class="warn-time">' + log.time + '</span>' +
            '</div>';
    }).join('');

    // 点击展开 / 折叠
    listEl.querySelectorAll('.warn-item').forEach(function (item) {
        item.addEventListener('click', function () {
            if (item.classList.contains('long')) item.classList.toggle('expanded');
        });
    });

    // 自动滚动
    if (warnAutoScroll || wasAtBottom) listEl.scrollTop = listEl.scrollHeight;

    // 用户手动滚动时，暂停自动跟随
    listEl.onscroll = function () {
        const atBottom = listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight < 30;
        warnAutoScroll = atBottom;
    };
}

function copyWarnLog() {
    if (!warnLogs.length) { showToast(L('没有日志可复制')); return; }
    const text = warnLogs.map(function (l) {
        const tag = l.type === 'error' ? L('[错误]') : L('[警告]');
        return tag + ' ' + l.time + '  ' + l.data;
    }).join('\n');
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(
            function () { showToast(L('已复制 ') + warnLogs.length + L(' 条日志')); },
            function () { fallbackCopy(text); }
        );
    } else {
        fallbackCopy(text);
    }
}
function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-1000px;left:-1000px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast(L('已复制日志')); }
    catch (e) { showToast(L('复制失败，请手动选择'), true); }
    ta.remove();
}
function clearWarnLog() { warnLogs = []; warnMissingSet.clear(); renderWarnList(); }
function toggleWarnPanel() {
    const panel = document.getElementById('warnPanel');
    warnPanelVisible = !warnPanelVisible;
    if (warnPanelVisible) {
        panel.classList.add('show');
        warnUnread = 0;
        document.getElementById('warnBtn').classList.remove('unread');
        warnAutoScroll = true;
        requestAnimationFrame(function () {
            const listEl = document.getElementById('warnList');
            if (listEl) listEl.scrollTop = listEl.scrollHeight;
        });
    } else {
        panel.classList.remove('show');
    }
}
function hideWarnPanel() {
    warnPanelVisible = false;
    document.getElementById('warnPanel').classList.remove('show');
}
window.addEventListener('message', function (e) {
    const data = e.data;
    if (!data || !data.__editorLog) return;
    addWarnLog(data.type || 'error', data.data || '');
});

(function initWarnButton() {
    const btn = document.getElementById('warnBtn');
    if (!btn) return;
    let isDragging = false, dragMoved = false;
    let startX = 0, startY = 0, dragOffsetX = 0, dragOffsetY = 0;
    let savedPos = null, activePointerId = null;
    let savedHtmlOverflow = '', savedBodyOverflow = '';
    let savedHtmlTouch = '', savedBodyTouch = '';
    function getViewportSize() {
        const de = document.documentElement;
        return { w: (de && de.clientWidth) || window.innerWidth || 0,
                 h: (de && de.clientHeight) || window.innerHeight || 0 };
    }
    function applyPos(x, y) {
        const vp = getViewportSize();
        const bw = btn.offsetWidth, bh = btn.offsetHeight;
        const maxX = Math.max(0, vp.w - bw), maxY = Math.max(0, vp.h - bh);
        const nx = Math.max(4, Math.min(maxX - 4, x));
        const ny = Math.max(4, Math.min(maxY - 4, y));
        btn.style.left = nx + 'px'; btn.style.top = ny + 'px';
        btn.style.right = 'auto'; btn.style.bottom = 'auto';
        savedPos = { x: nx, y: ny };
    }
    function onMove(e) {
        if (!isDragging) return;
        if (activePointerId !== null && e.pointerId !== undefined && e.pointerId !== activePointerId) return;
        if (e.isPrimary === false) return;
        let cx, cy;
        if (e.touches && e.touches.length > 0) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; }
        else { cx = e.clientX; cy = e.clientY; }
        if (cx === undefined || cy === undefined) return;
        if (!dragMoved) {
            if (Math.abs(cx - startX) < 4 && Math.abs(cy - startY) < 4) return;
            dragMoved = true;
        }
        if (e.cancelable) e.preventDefault();
        applyPos(cx - dragOffsetX, cy - dragOffsetY);
    }
    function lockScroll() {
        const html = document.documentElement, body = document.body;
        savedHtmlOverflow = html.style.overflow; savedBodyOverflow = body.style.overflow;
        savedHtmlTouch = html.style.touchAction; savedBodyTouch = body.style.touchAction;
        html.style.overflow = 'hidden'; body.style.overflow = 'hidden';
        html.style.touchAction = 'none'; body.style.touchAction = 'none';
    }
    function unlockScroll() {
        const html = document.documentElement, body = document.body;
        html.style.overflow = savedHtmlOverflow; body.style.overflow = savedBodyOverflow;
        html.style.touchAction = savedHtmlTouch; body.style.touchAction = savedBodyTouch;
    }
    function onEnd(e) {
        if (!isDragging) return;
        if (activePointerId !== null && e.pointerId !== undefined && e.pointerId !== activePointerId) return;
        isDragging = false;
        document.removeEventListener('pointermove', onMove, true);
        document.removeEventListener('pointerup', onEnd, true);
        document.removeEventListener('pointercancel', onEnd, true);
        document.removeEventListener('mousemove', onMove, true);
        document.removeEventListener('mouseup', onEnd, true);
        document.removeEventListener('touchmove', onMove, true);
        document.removeEventListener('touchend', onEnd, true);
        document.removeEventListener('touchcancel', onEnd, true);
        window.removeEventListener('pointermove', onMove, true);
        window.removeEventListener('pointerup', onEnd, true);
        window.removeEventListener('pointercancel', onEnd, true);
        window.removeEventListener('mousemove', onMove, true);
        window.removeEventListener('mouseup', onEnd, true);
        window.removeEventListener('touchmove', onMove, true);
        window.removeEventListener('touchend', onEnd, true);
        try { if (activePointerId !== null) btn.releasePointerCapture(activePointerId); } catch (err) {}
        activePointerId = null;
        document.body.classList.remove('dragging-warn');
        btn.style.zIndex = '';
        unlockScroll();
        setTimeout(function () { dragMoved = false; }, 100);
    }
    function startDrag(clientX, clientY, pointerId) {
        const rect = btn.getBoundingClientRect();
        dragOffsetX = clientX - rect.left; dragOffsetY = clientY - rect.top;
        startX = clientX; startY = clientY;
        isDragging = true; dragMoved = false;
        activePointerId = (pointerId !== undefined) ? pointerId : null;
        document.body.classList.add('dragging-warn');
        btn.style.zIndex = '9999';
        lockScroll();
        if (pointerId !== undefined) { try { btn.setPointerCapture(pointerId); } catch (err) {} }
        document.addEventListener('pointermove', onMove, true);
        document.addEventListener('pointerup', onEnd, true);
        document.addEventListener('pointercancel', onEnd, true);
        document.addEventListener('mousemove', onMove, true);
        document.addEventListener('mouseup', onEnd, true);
        document.addEventListener('touchmove', onMove, { passive: false, capture: true });
        document.addEventListener('touchend', onEnd, true);
        document.addEventListener('touchcancel', onEnd, true);
        window.addEventListener('pointermove', onMove, true);
        window.addEventListener('pointerup', onEnd, true);
        window.addEventListener('pointercancel', onEnd, true);
        window.addEventListener('mousemove', onMove, true);
        window.addEventListener('mouseup', onEnd, true);
        window.addEventListener('touchmove', onMove, { passive: false, capture: true });
        window.addEventListener('touchend', onEnd, true);
    }
    btn.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (e.isPrimary === false) return;
        e.preventDefault(); e.stopPropagation();
        startDrag(e.clientX, e.clientY, e.pointerId);
    });
    btn.addEventListener('click', function (e) {
        if (dragMoved) { e.preventDefault(); e.stopPropagation(); return; }
        toggleWarnPanel();
    });
    window.addEventListener('resize', function () {
        if (!savedPos) return;
        applyPos(savedPos.x, savedPos.y);
    });
})();
/* ===== 运行日志面板：拖动 ===== */
(function initWarnPanelDrag() {
    const panel = document.getElementById('warnPanel');
    if (!panel) return;
    const header = panel.querySelector('.warn-panel-header');
    if (!header) return;

    let isDragging = false;
    let startX = 0, startY = 0;
    let startLeft = 0, startTop = 0;
    let activePointerId = null;

    function lockToLeftTop() {
        const rect = panel.getBoundingClientRect();
        panel.style.left = rect.left + 'px';
        panel.style.top = rect.top + 'px';
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
        return rect;
    }

    function clamp(x, y) {
        const vw = window.innerWidth, vh = window.innerHeight;
        const w = panel.offsetWidth, h = panel.offsetHeight;
        const minX = 60 - w;
        const maxX = vw - 60;
        const minY = 0;
        const maxY = vh - 40;
        return {
            x: Math.max(minX, Math.min(maxX, x)),
            y: Math.max(minY, Math.min(maxY, y))
        };
    }

    function onMove(e) {
        if (!isDragging) return;
        if (activePointerId !== null && e.pointerId !== undefined && e.pointerId !== activePointerId) return;

        let cx, cy;
        if (e.touches && e.touches.length > 0) {
            cx = e.touches[0].clientX;
            cy = e.touches[0].clientY;
        } else {
            cx = e.clientX;
            cy = e.clientY;
        }
        if (cx === undefined || cy === undefined) return;

        if (e.cancelable) e.preventDefault();
        const p = clamp(startLeft + (cx - startX), startTop + (cy - startY));
        panel.style.left = p.x + 'px';
        panel.style.top  = p.y + 'px';
    }

    function onEnd(e) {
        if (!isDragging) return;
        if (activePointerId !== null && e.pointerId !== undefined && e.pointerId !== activePointerId) return;
        isDragging = false;
        document.body.classList.remove('dragging-warn-panel');
        document.removeEventListener('pointermove', onMove, true);
        document.removeEventListener('pointerup', onEnd, true);
        document.removeEventListener('pointercancel', onEnd, true);
        window.removeEventListener('pointermove', onMove, true);
        window.removeEventListener('pointerup', onEnd, true);
        window.removeEventListener('pointercancel', onEnd, true);
        try { if (activePointerId !== null) header.releasePointerCapture(activePointerId); } catch (err) {}
        activePointerId = null;
    }

    header.addEventListener('pointerdown', function (e) {
        if (e.target.closest('button')) return;
        if (e.target.closest('.warn-filters')) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        e.preventDefault();
        e.stopPropagation();

        const rect = lockToLeftTop();
        startX = e.clientX;
        startY = e.clientY;
        startLeft = rect.left;
        startTop  = rect.top;
        isDragging = true;
        activePointerId = e.pointerId;

        document.body.classList.add('dragging-warn-panel');
        if (e.pointerId !== undefined) {
            try { header.setPointerCapture(e.pointerId); } catch (err) {}
        }
        document.addEventListener('pointermove', onMove, true);
        document.addEventListener('pointerup', onEnd, true);
        document.addEventListener('pointercancel', onEnd, true);
        window.addEventListener('pointermove', onMove, true);
        window.addEventListener('pointerup', onEnd, true);
        window.addEventListener('pointercancel', onEnd, true);
    });

    window.addEventListener('resize', function () {
        if (!panel.style.left) return;
        const curL = parseFloat(panel.style.left) || 0;
        const curT = parseFloat(panel.style.top) || 0;
        const p = clamp(curL, curT);
        panel.style.left = p.x + 'px';
        panel.style.top  = p.y + 'px';
    });
})();

/* 运行日志：过滤按钮 */
document.querySelectorAll('.warn-filter').forEach(function (btn) {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.warn-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        warnFilter = btn.dataset.filter;
        renderWarnList();
    });
});

let cachedCharWidth = null; /* 提前声明，applyFontSize 可安全失效缓存 */
function loadFontSize() {
    let s = FONT_DEFAULT;
    try {
        const v = parseInt(localStorage.getItem(FONT_KEY), 10);
        if (!isNaN(v) && v >= FONT_MIN && v <= FONT_MAX) s = v;
    } catch (e) {}
    return s;
}
/* ===== 每行横线位置：实测排版文本框底（基线+字体 descent），线随字体度量自适应 =====
   原理：探针里放真实文字，Range.getClientRects 量出文字行盒的底
   = baseline + 字体自身 descent（ZtFont@14px ≈ 17.3px，随字号/字体自动缩放）。
   效果：英文降部（g/y/p）恰好"坐"在线上，中文主体底悬 ~1.3px，
   任何 DPR/缩放/fractional 渲染都被真实测量吸收，不做任何硬编码推算 */
function updateLineRuleOffset() {
    let probe = null;
    try {
        const cs = window.getComputedStyle(codeEditorEl);
        const lineHeight = parseFloat(cs.lineHeight) || Math.round((parseFloat(cs.fontSize) || 14) * 1.6);
        probe = document.createElement('div');
        probe.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden;pointer-events:none;margin:0;padding:0;white-space:nowrap;';
        probe.style.font = cs.font;
        probe.style.lineHeight = cs.lineHeight;
        const anchor = document.createElement('span');
        anchor.style.cssText = 'display:inline-block;width:0;height:0;overflow:hidden;';
        const text = document.createElement('span');
        text.textContent = L('汉字Agyp');
        probe.appendChild(anchor);
        probe.appendChild(text);
        document.body.appendChild(probe);
        const boxTop = probe.getBoundingClientRect().top;
        const baseline = anchor.getBoundingClientRect().top - boxTop;
        const range = document.createRange();
        range.selectNodeContents(text);
        const tr = range.getBoundingClientRect();
        const textBoxBottom = tr.bottom - boxTop;
        const textH = tr.height; /* 字体行框高（ascent+descent） */
        document.body.removeChild(probe);
        probe = null;
        /* 行高 1.6 后每行 leading 充足：线放 tile 内贴近底部（lh-0.5），
           同时不越过"下一行文字框顶-2px"，文字与线间隙可达 4px+ */
        const drop = Math.max(4, Math.round(lineHeight * 0.25 * 2) / 2);
        const halfLeading = Math.max(0, (lineHeight - textH) / 2);
        const upper = Math.min(lineHeight - 0.5, lineHeight + halfLeading - 2);
        const inTile = Math.max(4, Math.min(upper, textBoxBottom + drop));
        document.documentElement.style.setProperty('--line-rule-y', inTile.toFixed(2) + 'px');
    } catch (e) { /* 计算失败时保留 CSS 默认回退值 */ }
    finally { if (probe && probe.parentNode) probe.parentNode.removeChild(probe); }
}
function applyFontSize(size) {
    size = Math.max(FONT_MIN, Math.min(FONT_MAX, Math.round(size)));
    if (size === editorFontSize) return;
    editorFontSize = size;
    cachedCharWidth = null; /* 修复：字号变化后使字符宽度缓存失效，保证搜索定位准确 */
    const lineHeight = Math.round(size * 1.6);
    const root = document.documentElement;
    root.style.setProperty('--editor-font-size', size + 'px');
    root.style.setProperty('--editor-line-height', lineHeight + 'px');
    try { localStorage.setItem(FONT_KEY, String(size)); } catch (e) {}
    updateLineRuleOffset();
    updateHighlight(); showToast(L('字号 ') + size + 'px');
}
function initFontSize() {
    editorFontSize = loadFontSize();
    const lineHeight = Math.round(editorFontSize * 1.6);
    const root = document.documentElement;
    root.style.setProperty('--editor-font-size', editorFontSize + 'px');
    root.style.setProperty('--editor-line-height', lineHeight + 'px');
    updateLineRuleOffset();
}
/* ZtFont 异步加载完成后重新测量墨迹位置（metrics 会随字体就位而变化）
   fonts.ready 可能早于 ZtFont 完成就 resolve，需显式 load 触发并重测 */
if (document.fonts && document.fonts.load) {
    document.fonts.ready.then(function () {
        document.fonts.load('16px ZtFont', L('汉字Agyp')).then(function () {
            updateLineRuleOffset();
        }).catch(function () {});
    });
}
codeEditorEl.addEventListener('wheel', function (e) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    if (e.deltaY < 0) applyFontSize(editorFontSize + 1);
    else applyFontSize(editorFontSize - 1);
}, { passive: false });
(function initPinchZoom() {
    let pinchActive = false, startDist = 0, startSize = FONT_DEFAULT;
    function distance(t1, t2) {
        const dx = t1.clientX - t2.clientX, dy = t1.clientY - t2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    codeEditorEl.addEventListener('touchstart', function (e) {
        if (e.touches.length === 2) {
            pinchActive = true;
            startDist = distance(e.touches[0], e.touches[1]);
            startSize = editorFontSize;
        }
    }, { passive: true });
    codeEditorEl.addEventListener('touchmove', function (e) {
        if (!pinchActive || e.touches.length !== 2) return;
        e.preventDefault();
        const dist = distance(e.touches[0], e.touches[1]);
        if (startDist < 10) return;
        applyFontSize(startSize * (dist / startDist));
    }, { passive: false });
    codeEditorEl.addEventListener('touchend', function (e) {
        if (e.touches.length < 2) pinchActive = false;
    });
    codeEditorEl.addEventListener('touchcancel', function () { pinchActive = false; });
})();

function isImageMode() { return editorRootEl.classList.contains('image-mode'); }
function isAudioMode() { return editorRootEl.classList.contains('audio-mode'); }
function isVideoMode() { return editorRootEl.classList.contains('video-mode'); }
/* ===== 行号渲染（折行感知）=====
   长行自动折行时，逻辑行的行号块占 N 个视觉行高，
   行号对齐在该行文字的下方（折行块底部），不再按视觉行连续编号错位 */
let _gutterMeasureEl = null;
let _lastGutterKey = '';
const GUTTER_MEASURE_LIMIT = 5000; /* 超过此逻辑行数退化为逐行一号（不测量折行） */
function getGutterMeasureEl() {
    if (_gutterMeasureEl && _gutterMeasureEl.isConnected) return _gutterMeasureEl;
    const el = document.createElement('div');
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden;pointer-events:none;' +
        'white-space:pre-wrap;word-break:break-word;overflow-wrap:break-word;margin:0;padding:0;';
    document.body.appendChild(el);
    _gutterMeasureEl = el;
    return el;
}
function buildLineNumbers() {
    const code = codeEditorEl.value;
    const lines = code.split('\n');
    const lineCount = lines.length;
    if (lineCount <= 0) { gutterEl.textContent = ''; _lastGutterKey = ''; return; }
    const cs = window.getComputedStyle(codeEditorEl);
    const lineHeight = parseFloat(cs.lineHeight) || 22;
    const padL = parseFloat(cs.paddingLeft) || 0, padR = parseFloat(cs.paddingRight) || 0;
    const contentW = Math.max(1, codeEditorEl.clientWidth - padL - padR);
    /* 缓存键：行数/字符数/内容宽/字号/字体 + 内容摘要，任一变化才重算 */
    const sample = code.length < 4096 ? code : (code.slice(0, 2048) + '§' + code.slice(-2048));
    const key = lineCount + '|' + code.length + '|' + contentW + '|' + cs.fontSize + '|' + cs.fontFamily + '::' + sample;
    if (key === _lastGutterKey) return;
    _lastGutterKey = key;
    if (lineCount > GUTTER_MEASURE_LIMIT) {
        const arr = new Array(lineCount);
        for (let k = 0; k < lineCount; k++) arr[k] = '<div class="ln" style="height:' + lineHeight + 'px">' + (k + 1) + '</div>';
        gutterEl.innerHTML = arr.join('');
        return;
    }
    /* 镜像测量层：与 textarea 同字体/同宽/同折行规则，一次 reflow 拿到每行视觉高度 */
    const measure = getGutterMeasureEl();
    measure.style.font = cs.font;
    measure.style.fontFamily = cs.fontFamily;
    measure.style.fontSize = cs.fontSize;
    measure.style.lineHeight = cs.lineHeight;
    measure.style.letterSpacing = cs.letterSpacing || 'normal';
    measure.style.tabSize = cs.tabSize || '4';
    measure.style.width = contentW + 'px';
    measure.textContent = '';
    const frag = document.createDocumentFragment();
    const rowEls = new Array(lineCount);
    for (let i = 0; i < lineCount; i++) {
        const d = document.createElement('div');
        d.textContent = lines[i] || '\u200B'; /* 空行零宽占位，保证高度 */
        frag.appendChild(d);
        rowEls[i] = d;
    }
    measure.appendChild(frag);
    let html = '';
    for (let i = 0; i < lineCount; i++) {
        const v = Math.max(1, Math.round(rowEls[i].offsetHeight / lineHeight));
        html += '<div class="ln" style="height:' + (v * lineHeight) + 'px">' + (i + 1) + '</div>';
    }
    gutterEl.innerHTML = html;
}
function refreshGutterForResize() {
    _lastGutterKey = ''; /* 宽度可能变化，强制重建 */
    if (typeof codeEditorEl !== 'undefined' && codeEditorEl && currentFileId) requestHighlight();
}
let _gutterResizeTimer = null;
window.addEventListener('resize', function () {
    clearTimeout(_gutterResizeTimer);
    _gutterResizeTimer = setTimeout(refreshGutterForResize, 150);
});
/* ===== 滚动条宽度补偿：让高亮层与 textarea 的文本宽度永远一致 =====
   Windows 等平台滚动条占位（12~17px）：出现滚动条时 textarea 文本变窄，
   高亮层（overflow:hidden 无滚动条）不变 → 两层折行分叉 → 文字与光标/行号错位。
   解法：实时测 textarea 滚动条宽度，等量补偿到高亮层 padding-right */
function syncHighlightScrollbarWidth() {
    const sbw = Math.max(0, codeEditorEl.offsetWidth - codeEditorEl.clientWidth);
    const basePadR = parseFloat(window.getComputedStyle(codeEditorEl).paddingRight) || 16;
    const want = (basePadR + sbw) + 'px';
    if (highlightLayerEl.style.paddingRight !== want) highlightLayerEl.style.paddingRight = want;
}
function updateHighlight() {
    if (isImageMode() || isAudioMode() || (typeof isVideoMode === 'function' && isVideoMode())) {
        highlightLayerEl.textContent = ''; gutterEl.textContent = '';
        _lastGutterKey = ''; return;
    }
    syncHighlightScrollbarWidth();
    const code = codeEditorEl.value;
    const len = code.length;
    if (len > LINE_NUMBER_LIMIT) {
        highlightLayerEl.textContent = code; gutterEl.textContent = '';
        _lastGutterKey = ''; syncScroll(); return;
    }
    if (len > HIGHLIGHT_LIMIT) {
        highlightLayerEl.textContent = code;
    } else {
        const file = currentFileId ? findFileById(currentFileId) : null;
        const lang = file ? getLangFromName(file.name) : 'plain';
        highlightLayerEl.innerHTML = highlight(code, lang);
    }
    requestAnimationFrame(function () {
        buildLineNumbers();
        syncScroll();
    });
}
let _highlightTimer = null;
function requestHighlight() {
    if (highlightPending) return;
    highlightPending = true;
    requestAnimationFrame(function () { highlightPending = false; updateHighlight(); });
}
function requestHighlightSlow() {
    clearTimeout(_highlightTimer);
    _highlightTimer = setTimeout(updateHighlight, PASTE_HIGHLIGHT_DELAY);
}
function syncScroll() {
    highlightLayerEl.scrollTop = codeEditorEl.scrollTop;
    highlightLayerEl.scrollLeft = codeEditorEl.scrollLeft;
    gutterEl.scrollTop = codeEditorEl.scrollTop;
}
codeEditorEl.addEventListener('scroll', syncScroll);
codeEditorEl.addEventListener('keyup', syncScroll);
codeEditorEl.addEventListener('click', syncScroll);
codeEditorEl.addEventListener('focus', syncScroll);
document.addEventListener('selectionchange', function () {
    if (document.activeElement === codeEditorEl) syncScroll();
});
codeEditorEl.addEventListener('compositionupdate', syncScroll);
codeEditorEl.addEventListener('compositionend', function () {
    requestAnimationFrame(syncScroll);
});

function ensureHistory(file) {
    if (!file) return;
    if (!file._undoStack) { file._undoStack = [file.content || '']; file._redoStack = []; }
}
function takeSnapshot() {
    if (!currentFileId) return;
    const file = findFileById(currentFileId);
    if (!file || file.editable === false) return;
    ensureHistory(file);
    const current = codeEditorEl.value;
    const stack = file._undoStack;
    if (stack[stack.length - 1] !== current) {
        stack.push(current);
        if (stack.length > 200) stack.shift();
        file._redoStack = [];
    }
    updateUndoRedoButtons();
}
function scheduleSnapshot() {
    clearTimeout(snapshotTimer);
    snapshotTimer = setTimeout(takeSnapshot, 400);
}
function undo() {
    if (!currentFileId) return;
    const file = findFileById(currentFileId);
    if (!file || file.editable === false) return;
    clearTimeout(snapshotTimer);
    ensureHistory(file);
    const stack = file._undoStack;
    const current = codeEditorEl.value;
    if (stack[stack.length - 1] !== current) { stack.push(current); file._redoStack = []; }
    if (stack.length <= 1) { showToast(L('没有可撤销的操作')); updateUndoRedoButtons(); return; }
    const cur = stack.pop(); file._redoStack.push(cur);
    const prev = stack[stack.length - 1];
    codeEditorEl.value = prev; file.content = prev; scheduleOpfsWriteback(file, 0);
    updateHighlight(); updateUndoRedoButtons(); scheduleSave();
    showToast(L('已撤销'));
}
function redo() {
    if (!currentFileId) return;
    const file = findFileById(currentFileId);
    if (!file || file.editable === false) return;
    clearTimeout(snapshotTimer);
    ensureHistory(file);
    if (!file._redoStack || file._redoStack.length === 0) {
        showToast(L('没有可重做的操作')); updateUndoRedoButtons(); return;
    }
    const next = file._redoStack.pop();
    file._undoStack.push(next);
    codeEditorEl.value = next; file.content = next; scheduleOpfsWriteback(file, 0);
    updateHighlight(); updateUndoRedoButtons(); scheduleSave();
    showToast(L('已重做'));
}
function updateUndoRedoButtons() {
    const btnUndo = document.getElementById('btnUndo');
    const btnRedo = document.getElementById('btnRedo');
    if (!btnUndo || !btnRedo) return;
    let canUndo = false, canRedo = false;
    if (currentFileId) {
        const file = findFileById(currentFileId);
        if (file && file.editable !== false) {
            const stack = file._undoStack || [];
            const redoStack = file._redoStack || [];
            const cur = codeEditorEl.value;
            canUndo = stack.length > 1 || (stack.length > 0 && stack[stack.length - 1] !== cur);
            canRedo = redoStack.length > 0;
        }
    }
    btnUndo.disabled = !canUndo;
    btnRedo.disabled = !canRedo;
}
codeEditorEl.addEventListener('input', function (e) {
    if (currentFileId) {
        const file = findFileById(currentFileId);
        if (file && file.editable !== false) { file.content = this.value; scheduleOpfsWriteback(file); }
    }
    const isPaste = e && typeof e.inputType === 'string' && e.inputType.indexOf('insertFromPaste') === 0;
    if (isPaste || this.value.length > HIGHLIGHT_LIMIT) requestHighlightSlow();
    else requestHighlight();
    scheduleSnapshot();
    updateUndoRedoButtons();
    scheduleSave();
});
codeEditorEl.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        const k = e.key.toLowerCase();
        if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
        if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo(); return; }
    }
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.selectionStart, end = this.selectionEnd, val = this.value;
        this.value = val.slice(0, start) + '    ' + val.slice(end);
        this.selectionStart = this.selectionEnd = start + 4;
        if (currentFileId) {
            const file = findFileById(currentFileId);
            if (file) { file.content = this.value; scheduleOpfsWriteback(file); }
        }
        requestHighlight(); scheduleSnapshot(); updateUndoRedoButtons(); scheduleSave();
        return;
    }
    if (e.key === 'Enter') {
        const start = this.selectionStart, val = this.value;
        const lineStart = val.lastIndexOf('\n', start - 1) + 1;
        const lineText = val.slice(lineStart, start);
        const indentMatch = lineText.match(/^[ \t]*/);
        const indent = indentMatch ? indentMatch[0] : '';
        let extra = '';
        if (/[{\[(:>]\s*$/.test(lineText)) extra = '    ';
        if (indent || extra) {
            e.preventDefault();
            const ins = '\n' + indent + extra;
            const endPos = this.selectionEnd;
            this.value = val.slice(0, start) + ins + val.slice(endPos);
            this.selectionStart = this.selectionEnd = start + ins.length;
            if (currentFileId) {
                const file = findFileById(currentFileId);
                if (file) { file.content = this.value; scheduleOpfsWriteback(file); }
            }
            requestHighlight(); scheduleSnapshot(); updateUndoRedoButtons(); scheduleSave();
        }
    }
});

let searchStatusTimer = null;
function showSearchStatus(msg, isError) {
    const el = document.getElementById('searchStatus');
    clearTimeout(searchStatusTimer);
    if (!msg) { el.classList.remove('show'); return; }
    el.textContent = msg;
    el.className = 'search-status ' + (isError ? 'error' : 'ok');
    void el.offsetWidth; el.classList.add('show');
    searchStatusTimer = setTimeout(function () { el.classList.remove('show'); }, 1800);
}
function onSearchInput() { showSearchStatus(''); }
function getCharWidth() {
    if (cachedCharWidth !== null) return cachedCharWidth;
    const cs = window.getComputedStyle(codeEditorEl);
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;' +
        'font-family:' + cs.fontFamily + ';font-size:' + cs.fontSize + ';letter-spacing:' + cs.letterSpacing + ';';
    probe.textContent = 'MMMMMMMMMM';
    document.body.appendChild(probe);
    cachedCharWidth = probe.offsetWidth / 10;
    document.body.removeChild(probe);
    return cachedCharWidth;
}
function scrollEditorToSelection() {
    const text = codeEditorEl.value;
    const pos = codeEditorEl.selectionStart;
    const before = text.substring(0, pos);
    const lineIndex = before.split('\n').length - 1;
    const lastNL = before.lastIndexOf('\n');
    const col = pos - (lastNL + 1);
    const cs = window.getComputedStyle(codeEditorEl);
    const lineHeight = parseFloat(cs.lineHeight) || 22;
    const paddingTop = parseFloat(cs.paddingTop) || 12;
    const paddingLeft = parseFloat(cs.paddingLeft) || 12;
    const matchY = paddingTop + lineIndex * lineHeight;
    const targetTop = matchY - (codeEditorEl.clientHeight - lineHeight) / 2;
    codeEditorEl.scrollTop = Math.max(0, targetTop);
    const charWidth = getCharWidth();
    const matchX = paddingLeft + col * charWidth;
    const targetLeft = matchX - codeEditorEl.clientWidth / 2;
    codeEditorEl.scrollLeft = Math.max(0, targetLeft);
    syncScroll();
}
function doSearch() {
    if (isImageMode() || isAudioMode() || (typeof isVideoMode === 'function' && isVideoMode()) || codeEditorEl.disabled) {
        showSearchStatus(L('当前文件不支持搜索'), true); return;
    }
    const inputEl = document.getElementById('searchInput');
    const term = inputEl.value;
    if (!term) { showSearchStatus(L('请输入搜索内容'), true); inputEl.focus(); return; }
    const text = codeEditorEl.value;
    const selStart = codeEditorEl.selectionStart;
    const selEnd = codeEditorEl.selectionEnd;
    const selectedText = text.substring(selStart, selEnd);
    let from = (selectedText === term) ? selEnd : selStart;
    let idx = text.indexOf(term, from);
    if (idx === -1 && from > 0) {
        idx = text.indexOf(term, 0);
        if (idx === selStart && selectedText === term) { showSearchStatus(L('没有更多匹配了'), true); return; }
    }
    if (idx === -1) { showSearchStatus(L('没有找到「') + term + '」', true); return; }
    codeEditorEl.focus();
    codeEditorEl.setSelectionRange(idx, idx + term.length);
    scrollEditorToSelection();
    showSearchStatus(L('已找到'), false);
}

function showPasteProgress(pct) {
    const el = document.getElementById('pasteProgress');
    const fill = document.getElementById('pasteProgressFill');
    const text = document.getElementById('pasteProgressText');
    if (!el || !fill || !text) return;
    el.classList.add('show');
    fill.style.width = pct + '%';
    text.textContent = I18N[LANG].pasting + pct + '%';
}
function hidePasteProgress() {
    const el = document.getElementById('pasteProgress');
    if (!el) return;
    setTimeout(function () { el.classList.remove('show'); }, 220);
}
codeEditorEl.addEventListener('paste', function (e) {
    const clip = e.clipboardData || window.clipboardData;
    if (!clip) return;
    const pasted = clip.getData('text');
    if (!pasted) return;
    if (pasted.length < PASTE_MIN_TRIGGER) return;
    e.preventDefault();
    if (currentFileId) {
        const file = findFileById(currentFileId);
        if (file && file.editable !== false) {
            ensureHistory(file);
            const stack = file._undoStack;
            const cur = codeEditorEl.value;
            if (stack[stack.length - 1] !== cur) {
                stack.push(cur);
                if (stack.length > 200) stack.shift();
                file._redoStack = [];
            }
        }
    }
    const startPos = this.selectionStart;
    const endPos = this.selectionEnd;
    const before = this.value.slice(0, startPos);
    const after = this.value.slice(endPos);
    this.value = before + after;
    const total = pasted.length;
    let offset = 0, inserted = '';
    showPasteProgress(0);
    function step() {
        if (offset >= total) {
            const finalPos = startPos + total;
            codeEditorEl.value = before + inserted + after;
            codeEditorEl.selectionStart = codeEditorEl.selectionEnd = finalPos;
            if (currentFileId) {
                const file = findFileById(currentFileId);
                if (file && file.editable !== false) {
                    file.content = codeEditorEl.value;
                    if (file.inOpfs) {
                        const blob = new Blob([codeEditorEl.value], { type: 'text/plain;charset=utf-8' });
                        opfsWrite(currentProjectId, file.id, blob).catch(function (e) {
                            console.warn(L('OPFS 回写失败：'), e);
                        });
                        _fileContentCache[file.id] = codeEditorEl.value;
                    }
                }
            }
            requestHighlightSlow(); scheduleSnapshot(); updateUndoRedoButtons(); scheduleSave();
            showPasteProgress(100); hidePasteProgress();
            return;
        }
        const chunk = pasted.slice(offset, offset + PASTE_CHUNK_SIZE);
        inserted += chunk; offset += chunk.length;
        codeEditorEl.value = before + inserted + after;
        codeEditorEl.selectionStart = codeEditorEl.selectionEnd = startPos + offset;
        const pct = Math.min(100, Math.round(offset / total * 100));
        showPasteProgress(pct);
        requestAnimationFrame(step);
    }
    step();
});

function renderProjectList() {
    const container = document.getElementById('projectCards');
    const emptyState = document.getElementById('emptyState');
    container.innerHTML = '';
    if (projects.length === 0) { emptyState.style.display = 'block'; return; }
    emptyState.style.display = 'none';
    projects.forEach(proj => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.setAttribute('data-proj-id', proj.id);
        card.onclick = () => enterProject(proj.id);
        const fileCount = countFiles(proj.fileTree);
        const folderCount = countFolders(proj.fileTree);
        card.innerHTML = `
            <div class="project-card-actions">
                <button class="proj-btn proj-rename" type="button" title="${L('重命名项目：')}">${UI_ICONS.rename}</button>
                <button class="proj-btn proj-delete" type="button" title="${L('确定删除吗？')}">${UI_ICONS.del}</button>
            </div>
            <div class="project-card-name"><span class="proj-folder-ico">${UI_ICONS.folder}</span><span class="proj-name-text">${escapeHtml(proj.name)}</span></div>
            <div class="project-card-info">${I18N[LANG].files_units.replace('{a}', fileCount).replace('{b}', folderCount)}</div>
            <span class="project-card-badge">${I18N[LANG].click_enter}</span>`;
        card.querySelector('.proj-rename').addEventListener('click', function (e) {
            e.stopPropagation(); startInlineRename(card, proj);
        });
        card.querySelector('.proj-delete').addEventListener('click', function (e) {
            e.stopPropagation(); deleteProject(proj.id);
        });
        container.appendChild(card);
    });
}
/* 项目卡片内联重命名：名称原位变输入框，回车/失焦确认，Esc 取消 */
function startInlineRename(card, proj) {
    if (!card || !proj || card.querySelector('.proj-rename-input')) return;
    const nameEl = card.querySelector('.proj-name-text');
    if (!nameEl) return;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'proj-rename-input';
    input.value = proj.name;
    input.placeholder = L('输入名称');
    nameEl.style.display = 'none';
    nameEl.parentNode.insertBefore(input, nameEl.nextSibling);
    input.focus(); input.select();
    let done = false;
    function finish(save) {
        if (done) return; done = true;
        const v = input.value.trim();
        input.remove();
        nameEl.style.display = '';
        if (save && v && v !== proj.name) {
            proj.name = v;
            renderProjectList(); saveProjects(true); showToast(L('已重命名'));
        } else renderProjectList();
    }
    input.addEventListener('keydown', function (e) {
        e.stopPropagation();
        if (e.key === 'Enter') finish(true);
        else if (e.key === 'Escape') finish(false);
    });
    input.addEventListener('blur', function () { finish(true); });
    input.addEventListener('click', function (e) { e.stopPropagation(); });
}
async function renameProject(id) {
    const proj = projects.find(p => p.id === id);
    if (!proj) return;
    const card = document.querySelector('.project-card[data-proj-id="' + id + '"]');
    if (card) { startInlineRename(card, proj); return; }
    const newName = await uiPrompt(L('重命名项目：'), proj.name);
    if (newName === null) return;
    const trimmed = String(newName).trim();
    if (!trimmed || trimmed === proj.name) return;
    proj.name = trimmed;
    renderProjectList(); saveProjects(true); showToast(L('已重命名'));
}
async function deleteProject(id) {
    const proj = projects.find(p => p.id === id);
    if (!proj) return;
    if (!(await uiConfirm(L('确定删除项目「') + proj.name + L('」吗？\n该项目下的所有文件都会被删除，操作不可撤销。'), { danger: true }))) return;
    if (currentProjectId === id) {
        currentProjectId = null; currentFileId = null; folderViewId = null;
        openFileIds = []; renderFileTabs();
        stopPreview();
        document.getElementById('editorArea').style.display = 'none';
        document.getElementById('toolbar').style.display = 'none';
        document.getElementById('fab').classList.remove('hidden');
        isTreeCollapsed = true;
        document.getElementById('sidebar').classList.add('collapsed');
        document.getElementById('fileTree').innerHTML = '';
        const themeBtn = document.getElementById('themeBtn');
        if (themeBtn) themeBtn.style.display = 'flex';
        const toolsWrapper = document.getElementById('toolsWrapper');
        if (toolsWrapper) toolsWrapper.style.display = '';
    }
    opfsDeleteProject(id);
    projects = projects.filter(p => p.id !== id);
    renderProjectList(); saveProjects(true); showToast(L('已删除项目'));
}
function countFiles(nodes) {
    let count = 0;
    for (const node of nodes) {
        if (node.type === 'file') count++;
        if (node.children) count += countFiles(node.children);
    }
    return count;
}
function countFolders(nodes) {
    let count = 0;
    for (const node of nodes) {
        if (node.type === 'folder') count++;
        if (node.children) count += countFolders(node.children);
    }
    return count;
}
function findFirstFile(nodes) {
    for (const node of nodes) {
        if (node.type === 'file') return node;
        if (node.children) {
            const found = findFirstFile(node.children);
            if (found) return found;
        }
    }
    return null;
}
function enterProject(projectId) {
    currentProjectId = projectId;
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    document.getElementById('projectListView').style.display = 'none';
    document.getElementById('editorArea').style.display = 'flex';
    document.getElementById('fab').classList.add('hidden');
    const toolbar = document.getElementById('toolbar');
    toolbar.style.display = 'flex';
    document.getElementById('btnToggleTree').style.display = 'inline-block';
    document.getElementById('btnExit').style.display = 'inline-block';
    document.getElementById('btnRun').style.display = 'inline-block';
    document.getElementById('btnStop').style.display = 'none';
    document.getElementById('zipWrapper').style.display = 'inline-block';
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) themeBtn.style.display = 'none';
    const toolsWrapper = document.getElementById('toolsWrapper');
    if (toolsWrapper) toolsWrapper.style.display = 'none';
    closeSettingsModal(); closeToolsMenu();
    document.getElementById('searchInput').value = '';
    showSearchStatus('');
    /* 项目侧边栏默认收起（点击工具栏 ☰ 可收起 / 展开），保持原始行为 */
    isTreeCollapsed = true;
    document.getElementById('sidebar').classList.add('collapsed');
    /* 修复：进入项目直接展开根目录视图，立即可见 index.html 等文件（原先只显示"根目录"需再点一下） */
    const rootFolder = (getCurrentFileTree() || []).find(n => n.type === 'folder');
    folderViewId = rootFolder ? rootFolder.id : null;
    openFileIds = []; renderFileTabs();
    renderFileTree();
    renderBreadcrumb();
    const firstFile = findFirstFile(getCurrentFileTree());
    if (firstFile) selectFile(firstFile.id);
    else updateUndoRedoButtons();
}
function backToProjectList() {
    /* 沙箱/隐私模式等存储不可用时，退出导航绝不能被保存异常中断 */
    try { syncCurrentFileContent(); saveProjects(true); } catch (e) { console.warn(L('保存失败（忽略）：'), e); }
    currentProjectId = null; currentFileId = null; folderViewId = null;
    openFileIds = []; renderFileTabs();
    stopPreview(); closeZipMenu(); closeToolsMenu();
    stopVideoViewer();
    document.getElementById('projectListView').style.display = 'flex';
    document.getElementById('editorArea').style.display = 'none';
    document.getElementById('fab').classList.remove('hidden');
    document.getElementById('toolbar').style.display = 'none';
    isTreeCollapsed = true;
    document.getElementById('sidebar').classList.add('collapsed');
    document.getElementById('fileTree').innerHTML = '';
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) themeBtn.style.display = 'flex';
    const toolsWrapper = document.getElementById('toolsWrapper');
    if (toolsWrapper) toolsWrapper.style.display = '';
    renderProjectList();
}
function exitProject() { backToProjectList(); }

/* ★ 文件图标：内联 SVG（对应压缩包内的各类型图标） */
const UI_ICONS = {
  tool: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.0 24.0"> <path d="M 21.4 18.1 L 13.5 10.1 C 14.2 8.1 13.7 5.7 12.1 4.1 C 10.3 2.3 7.8 1.9 5.6 3 L 9.3 6.7 L 6.8 9.2 L 2.9 5.5 C 1.8 7.7 2.3 10.3 4.1 12 C 5.7 13.7 8.1 14.1 10.1 13.4 L 18.1 21.3 C 18.4 21.7 18.8 21.7 19.2 21.3 L 21.3 19.2 C 21.8 18.8 21.8 18.4 21.4 18.1 Z" fill="#808080" /> </svg>',
  settings: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.0 24.0"> <path d="M19.43,12.98c0.04,-0.32 0.07,-0.64 0.07,-0.98s-0.03,-0.66 -0.07,-0.98l2.11,-1.65c0.19,-0.15 0.24,-0.42 0.12,-0.64l-2,-3.46c-0.12,-0.22 -0.39,-0.3 -0.61,-0.22l-2.49,1c-0.52,-0.4 -1.08,-0.73 -1.69,-0.98l-0.38,-2.65C14.46,2.18 14.25,2 14,2h-4c-0.25,0 -0.46,0.18 -0.49,0.42l-0.38,2.65c-0.61,0.25 -1.17,0.59 -1.69,0.98l-2.49,-1c-0.23,-0.09 -0.49,0 -0.61,0.22l-2,3.46c-0.13,0.22 -0.07,0.49 0.12,0.64l2.11,1.65c-0.04,0.32 -0.07,0.65 -0.07,0.98s0.03,0.66 0.07,0.98l-2.11,1.65c-0.19,0.15 -0.24,0.42 -0.12,0.64l2,3.46c0.12,0.22 0.39,0.3 0.61,0.22l2.49,-1c0.52,0.4 1.08,0.73 1.69,0.98l0.38,2.65c0.03,0.24 0.24,0.42 0.49,0.42h4c0.25,0 0.46,-0.18 0.49,-0.42l0.38,-2.65c0.61,-0.25 1.17,-0.59 1.69,-0.98l2.49,1c0.23,0.09 0.49,0 0.61,-0.22l2,-3.46c0.12,-0.22 0.07,-0.49 -0.12,-0.64l-2.11,-1.65zM12,15.5c-1.93,0 -3.5,-1.57 -3.5,-3.5s1.57,-3.5 3.5,-3.5 3.5,1.57 3.5,3.5 -1.57,3.5 -3.5,3.5z" fill="#808080" /> </svg>',
  light: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.0 24.0"> <path d="M20,8.69L20,4h-4.69L12,0.69 8.69,4L4,4v4.69L0.69,12 4,15.31L4,20h4.69L12,23.31 15.31,20L20,20v-4.69L23.31,12 20,8.69zM12,18c-3.31,0 -6,-2.69 -6,-6s2.69,-6 6,-6 6,2.69 6,6 -2.69,6 -6,6zM12,8c-2.21,0 -4,1.79 -4,4s1.79,4 4,4 4,-1.79 4,-4 -1.79,-4 -4,-4z" fill="#FFA500" /> </svg>',
  dark: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.0 24.0"> <path d="M10,2c-1.82,0 -3.53,0.5 -5,1.35C7.99,5.08 10,8.3 10,12s-2.01,6.92 -5,8.65C6.47,21.5 8.18,22 10,22c5.52,0 10,-4.48 10,-10S15.52,2 10,2z" fill="#C8C8C8" /> </svg>',
  upload: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.0 24.0"> <path d="M5,19v-8H3v8c0,1.1 0.9,2 2,2h14c1.1,0 2,-0.9 2,-2v-8h-2v8H5ZM17,7 l-1.4,1.4L13,5.8V16h-2V5.8L8.4,8.4 7,7l5,-5 5,5Z" fill="#8B4513" /> </svg>',
  download: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.0 24.0"> <path d="M17,11L15.6,9.6L13,12.2L13,2L11,2L11,12.2L8.4,9.6L7,11L12,16L17,11ZM5,19v-8H3v8c0,1.1 0.9,2 2,2h14c1.1,0 2,-0.9 2,-2v-8h-2v8H5Z" fill="#8B4513" /> </svg>',
  del: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.0 24.0"> <path d="M6,19c0,1.1 0.9,2 2,2h8c1.1,0 2,-0.9 2,-2V7H6v12zM19,4h-3.5l-1,-1h-5l-1,1H5v2h14V4z" fill="#B7422F" /> </svg>',
  rename: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.0 24.0"> <path d="M 1.95 17.87 L 1.95 22.06 L 6.14 22.06 L 18.5 9.71 L 14.3 5.52 L 1.95 17.87 Z M 21.73 6.46 C 22.17 6.03 22.17 5.33 21.73 4.89 L 19.12 2.28 C 18.69 1.83 17.99 1.83 17.54 2.28 L 15.5 4.32 L 19.7 8.51 L 21.73 6.46 Z" fill="#FFA500" /> </svg>',
  folder: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.0 24.0"> <g> <path d="M4.5 8 L19.5 8 L19.5 18 L4.5 18 Z" fill="#5599DD" /> <path d="M 19.5 6 L 12.5 6 L 10.5 4 L 4.5 4 C 3.4 4 2.51 4.9 2.51 6 L 2.5 18 C 2.5 19.1 3.4 20 4.5 20 L 19.5 20 C 20.6 20 21.5 19.1 21.5 18 L 21.5 8 C 21.5 6.9 20.6 6 19.5 6 Z M 19.5 18 L 4.5 18 L 4.5 8 L 19.5 8 L 19.5 18 Z" fill="#1177BB" /> </g> </svg>',
};

const FILE_ICONS = {
  model: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> <path fill="#00CED1" d="M20,2H4c-1.1,0-2,0.9-2,2v16c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V4c0-1.1-0.9-2-2-2z"/> <g transform="translate(1.2,1.2) scale(0.9)"> <path fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-linejoin="round" d="M6,9L12,6L18,9L12,12Z"/> <path fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-linejoin="round" d="M6,9L6,16.5L12,19.45L12,12Z"/> <path fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-linejoin="round" d="M18,9L18,16.5L12,19.45L12,12Z"/> </g> </svg>',
  archive: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.0 24.0"> <g> <path d="M20,2L4,2c-1.1,0 -2,0.9 -2,2v16c0,1.1 0.9,2 2,2h16c1.1,0 2,-0.9 2,-2L22,4c0,-1.1 -0.9,-2 -2,-2z" fill="#8B4513" /> <g transform="translate(4.8 4.8) scale(0.6 0.6)"> <path d="M20.54,5.23l-1.39,-1.68C18.88,3.21 18.47,3 18,3H6c-0.47,0 -0.88,0.21 -1.16,0.55L3.46,5.23C3.17,5.57 3,6.02 3,6.5V19c0,1.1 0.9,2 2,2h14c1.1,0 2,-0.9 2,-2V6.5c0,-0.48 -0.17,-0.93 -0.46,-1.27zM12,17.5L6.5,12H10v-2h4v2h3.5L12,17.5zM5.12,5l0.81,-1h12l0.94,1H5.12z" fill="#FFFFFF" /> </g> </g> </svg>',
  image: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.0 24.0"> <g> <path d="M20,2L4,2c-1.1,0 -2,0.9 -2,2v16c0,1.1 0.9,2 2,2h16c1.1,0 2,-0.9 2,-2L22,4c0,-1.1 -0.9,-2 -2,-2z" fill="#5C9D9E" /> <g transform="translate(4.8 4.8) scale(0.6 0.6)"> <path d="M21,19V5c0,-1.1 -0.9,-2 -2,-2H5c-1.1,0 -2,0.9 -2,2v14c0,1.1 0.9,2 2,2h14c1.1,0 2,-0.9 2,-2zM8.5,13.5l2.5,3.01L14.5,12l4.5,6H5l3.5,-4.5z M17,5 A2,2 0 1,1 17,9 A2,2 0 1,1 17,5 Z" fill="#FFFFFF" /> </g> </g> </svg>',
  audio: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.0 24.0"> <g> <path d="M20,2L4,2c-1.1,0 -2,0.9 -2,2v16c0,1.1 0.9,2 2,2h16c1.1,0 2,-0.9 2,-2L22,4c0,-1.1 -0.9,-2 -2,-2z" fill="#FF4500" /> <g transform="translate(3.6 3.6) scale(0.7 0.7)"> <path d="M12,3v9.28c-0.47,-0.17 -0.97,-0.28 -1.5,-0.28C8.01,12 6,14.01 6,16.5S8.01,21 10.5,21c2.31,0 4.2,-1.75 4.45,-4H15V6h4V3h-7z" fill="#FFFFFF" /> </g> </g> </svg>',
  video: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.0 24.0"> <g> <path d="M20,2L4,2c-1.1,0 -2,0.9 -2,2v16c0,1.1 0.9,2 2,2h16c1.1,0 2,-0.9 2,-2L22,4c0,-1.1 -0.9,-2 -2,-2z" fill="#FFA500" /> <g transform="translate(3.6 3.6) scale(0.7 0.7)"> <path d="M16,6H4c-0.55,0 -1,0.45 -1,1v10c0,0.55 0.45,1 1,1h12c0.55,0 1,-0.45 1,-1v-3.5l4,4v-11l-4,4V7c0,-0.55 -0.45,-1 -1,-1z" fill="#FFFFFF" /> </g> </g> </svg>',
  html: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.0 24.0"> <g> <path d="M20,2L4,2c-1.1,0 -2,0.9 -2,2v16c0,1.1 0.9,2 2,2h16c1.1,0 2,-0.9 2,-2L22,4c0,-1.1 -0.9,-2 -2,-2z" fill="#1177BB" /> <g transform="translate(4.8 4.8) scale(0.6 0.6)"> <path d="M11.99,2C6.47,2 2,6.48 2,12s4.47,10 9.99,10C17.52,22 22,17.52 22,12S17.52,2 11.99,2zM18.92,8h-2.95c-0.32,-1.25 -0.78,-2.45 -1.38,-3.56 1.84,0.63 3.37,1.91 4.33,3.56zM12,4.04c0.83,1.2 1.48,2.53 1.91,3.96h-3.82c0.43,-1.43 1.08,-2.76 1.91,-3.96zM4.26,14C4.1,13.36 4,12.69 4,12s0.1,-1.36 0.26,-2h3.38c-0.08,0.66 -0.14,1.32 -0.14,2 0,0.68 0.06,1.34 0.14,2L4.26,14zM5.08,16h2.95c0.32,1.25 0.78,2.45 1.38,3.56 -1.84,-0.63 -3.37,-1.9 -4.33,-3.56zM8.03,8L5.08,8c0.96,-1.66 2.49,-2.93 4.33,-3.56C8.81,5.55 8.35,6.75 8.03,8zM12,19.96c-0.83,-1.2 -1.48,-2.53 -1.91,-3.96h3.82c-0.43,1.43 -1.08,2.76 -1.91,3.96zM14.34,14L9.66,14c-0.09,-0.66 -0.16,-1.32 -0.16,-2 0,-0.68 0.07,-1.35 0.16,-2h4.68c0.09,0.65 0.16,1.32 0.16,2 0,0.68 -0.07,1.34 -0.16,2zM14.59,19.56c0.6,-1.11 1.06,-2.31 1.38,-3.56h2.95c-0.96,1.65 -2.49,2.93 -4.33,3.56zM16.36,14c0.08,-0.66 0.14,-1.32 0.14,-2 0,-0.68 -0.06,-1.34 -0.14,-2h3.38c0.16,0.64 0.26,1.31 0.26,2s-0.1,1.36 -0.26,2h-3.38z" fill="#FFFFFF" /> </g> </g> </svg>',
  xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.0 24.0"> <g> <path d="M20,2L4,2c-1.1,0 -2,0.9 -2,2v16c0,1.1 0.9,2 2,2h16c1.1,0 2,-0.9 2,-2L22,4c0,-1.1 -0.9,-2 -2,-2z" fill="#9966CC" /> <g transform="translate(4.8 4.8) scale(0.6 0.6)"> <path d="M14,2L6,2C4.9,2 4,2.9 4,4L4,20C4,21.1 4.9,22 6,22L18,22C19.1,22 20,21.1 20,20L20,8L14,2ZM11.034,13.652L8.441,15.215L11.034,16.714L11.034,18.451L6.734,15.651L6.734,14.751L11.034,11.851L11.034,13.652ZM17.207,15.562L13.007,18.449L12.995,16.712L15.464,15.164L13.007,13.65L13.007,11.862L17.207,14.762L17.207,15.562L17.207,15.562ZM13,9L13,3.5L18.5,9L13,9Z" fill="#FFFFFF" /> </g> </g> </svg>',
  js: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.0 24.0"> <g> <path d="M20,2L4,2c-1.1,0 -2,0.9 -2,2v16c0,1.1 0.9,2 2,2h16c1.1,0 2,-0.9 2,-2L22,4c0,-1.1 -0.9,-2 -2,-2z" fill="#90EE90" /> <g transform="translate(4.8 4.8) scale(0.6 0.6)"> <path d="M14,2L6,2c-1.1,0 -1.99,0.9 -1.99,2L4,20c0,1.1 0.89,2 1.99,2L18,22c1.1,0 2,-0.9 2,-2L20,8l-6,-6zM16,18L8,18v-2h8v2zM16,14L8,14v-2h8v2zM13,9L13,3.5L18.5,9L13,9z" fill="#FFFFFF" /> </g> </g> </svg>',
  css: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.0 24.0"> <g> <path d="M20,2L4,2c-1.1,0 -2,0.9 -2,2v16c0,1.1 0.9,2 2,2h16c1.1,0 2,-0.9 2,-2L22,4c0,-1.1 -0.9,-2 -2,-2z" fill="#7B1FA2" /> <g transform="translate(4.8 4.8) scale(0.6 0.6)"> <path d="M14,2L6,2c-1.1,0 -1.99,0.9 -1.99,2L4,20c0,1.1 0.89,2 1.99,2L18,22c1.1,0 2,-0.9 2,-2L20,8l-6,-6zM16,18L8,18v-2h8v2zM16,14L8,14v-2h8v2zM13,9L13,3.5L18.5,9L13,9z" fill="#FFFFFF" /> </g> </g> </svg>',
  text: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.0 24.0"> <g> <path d="M20,2L4,2c-1.1,0 -2,0.9 -2,2v16c0,1.1 0.9,2 2,2h16c1.1,0 2,-0.9 2,-2L22,4c0,-1.1 -0.9,-2 -2,-2z" fill="#808080" /> <g transform="translate(4.8 4.8) scale(0.6 0.6)"> <path d="M6,2c-1.1,0 -1.99,0.9 -1.99,2L4,20c0,1.1 0.89,2 1.99,2L18,22c1.1,0 2,-0.9 2,-2L20,8l-6,-6L6,2zM13,9L13,3.5L18.5,9L13,9z" fill="#FFFFFF" /> </g> </g> </svg>',
  font: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.0 24.0"> <g> <path d="M20,2L4,2c-1.1,0 -2,0.9 -2,2v16c0,1.1 0.9,2 2,2h16c1.1,0 2,-0.9 2,-2L22,4c0,-1.1 -0.9,-2 -2,-2z" fill="#4A148C" /> <g transform="translate(4.8 4.8) scale(0.6 0.6)"> <path d="M9,4v3h5v12h3L17,7h5L22,4L9,4zM3,12h3v7h3v-7h3L12,9L3,9v3z" fill="#FFFFFF" /> </g> </g> </svg>',
  app: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.0 24.0"> <g> <path d="M20,2L4,2c-1.1,0 -2,0.9 -2,2v16c0,1.1 0.9,2 2,2h16c1.1,0 2,-0.9 2,-2L22,4c0,-1.1 -0.9,-2 -2,-2z" fill="#A4C639" /> <g transform="translate(4.8 4.8) scale(0.6 0.6)"> <path d="M17,11L15.6,9.6L13,12.2L13,2L11,2L11,12.2L8.4,9.6L7,11L12,16L17,11ZM5,19v-8H3v8c0,1.1 0.9,2 2,2h14c1.1,0 2,-0.9 2,-2v-8h-2v8H5Z" fill="#FFFFFF" /> </g> </g> </svg>',
  unknown: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.0 24.0"> <g> <path d="M20,2L4,2c-1.1,0 -2,0.9 -2,2v16c0,1.1 0.9,2 2,2h16c1.1,0 2,-0.9 2,-2L22,4c0,-1.1 -0.9,-2 -2,-2z" fill="#808080" /> <g transform="translate(4.8 4.8) scale(0.6 0.6)"> <path d="M10.5 21.1h3.1V18h-3.1v3.1zM12.1 2.9C8.7 2.9 6 5.6 6 9h3c0-1.7 1.4-3.1 3.1-3.1 1.6 0 3 1.4 3 3.1 0 3-4.6 2.6-4.6 7.6h3.1c0-3.4 4.5-3.9 4.5-7.6 0-3.4-2.7-6.1-6-6.1z" fill="#FFFFFF" /> </g> </g> </svg>',
};

function getFileIcon(node) {
    const name = (node.name || '').toLowerCase();
    const ext = name.split('.').pop();

    if (['glb','gltf','obj','stl','fbx','dae','3ds','ply','abc','usd','usdz'].includes(ext)) return FILE_ICONS.model;
    if (['zip','rar','7z','tar','gz','bz2','xz','tgz'].includes(ext)) return FILE_ICONS.archive;
    if (node.isImage || ['png','jpg','jpeg','gif','webp','bmp','ico','svg','avif'].includes(ext)) return FILE_ICONS.image;
    if (node.isAudio || ['mp3','ogg','oga','wav','m4a','aac','flac','opus','weba','wma','amr','3gp','mid','midi','aiff','au'].includes(ext)) return FILE_ICONS.audio;
    if (['mp4','webm','ogv','mov','avi','mkv','m4v','flv','wmv','3gp'].includes(ext)) return FILE_ICONS.video;
    if (['html','htm','xhtml','vue','svelte'].includes(ext)) return FILE_ICONS.html;
    if (['xml','xsl','xslt','xsd','dtd'].includes(ext)) return FILE_ICONS.xml;
    if (['js','mjs','cjs','jsx','ts','tsx'].includes(ext)) return FILE_ICONS.js;
    if (['css','scss','sass','less'].includes(ext)) return FILE_ICONS.css;
    if (['json','json5'].includes(ext)) return FILE_ICONS.text;
    if (['txt','md','markdown','log','csv','tsv','ini','conf','cfg','env'].includes(ext)) return FILE_ICONS.text;
    if (['ttf','otf','woff','woff2','eot','fon','fnt'].includes(ext)) return FILE_ICONS.font;
    if (['exe','msi','apk','dmg','pkg','deb','rpm','bat','sh','app','ipa'].includes(ext)) return FILE_ICONS.app;
    return FILE_ICONS.unknown;
}

/* ★ 文件标签栏：渲染 */
function renderFileTabs() {
    const bar = document.getElementById('fileTabs');
    if (!bar) return;
    bar.innerHTML = '';
    openFileIds = openFileIds.filter(fid => !!findFileById(fid));
    if (!openFileIds.length) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';

    openFileIds.forEach(fid => {
        const f = findFileById(fid);
        if (!f) return;
        const isActive = fid === currentFileId;
        const tab = document.createElement('div');
        tab.className = 'file-tab' + (isActive ? ' active' : '');
        tab.title = f.name;

        tab.innerHTML =
            '<span class="tab-icon"></span>' +
            '<span class="tab-name"></span>' +
            '<span class="tab-close" title="' + (I18N[LANG].close || '关闭') + '">✕</span>';

        tab.querySelector('.tab-icon').innerHTML = getFileIcon(f);
        tab.querySelector('.tab-name').textContent = f.name;

        tab.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-close')) return;
            if (fid !== currentFileId) selectFile(fid);
        });

        tab.querySelector('.tab-close').addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(fid);
        });

        bar.appendChild(tab);
        if (isActive) {
            requestAnimationFrame(() => {
                tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            });
        }
    });
}

/* ★ 关闭某个标签 */
function closeTab(fid) {
    const idx = openFileIds.indexOf(fid);
    if (idx === -1) return;
    openFileIds.splice(idx, 1);

    if (fid === currentFileId) {
        if (openFileIds.length === 0) {
            currentFileId = null;
            codeEditorEl.value = '';
            codeEditorEl.disabled = true;
            stopAudioViewer();
            stopVideoViewer();
            closeInlineModelViewer();
            editorRootEl.classList.remove('image-mode', 'audio-mode', 'video-mode');
            document.getElementById('imageViewer').classList.remove('active');
            document.getElementById('imageViewerImg').src = '';
            document.getElementById('audioViewer').classList.remove('active');
            document.getElementById('videoViewer').classList.remove('active');
            document.getElementById('currentFileName').textContent = I18N[LANG].no_file;
            updateHighlight();
            updateUndoRedoButtons();
        } else {
            const next = openFileIds[Math.min(idx, openFileIds.length - 1)];
            selectFile(next);
            return;
        }
    }
    renderFileTabs();
}

function renderFileTree() {
    const treeEl = document.getElementById('fileTree');
    treeEl.innerHTML = '';
    const viewFolder = folderViewId ? findFileById(folderViewId) : null;
    const nodes = (viewFolder && viewFolder.children) ? viewFolder.children : getCurrentFileTree();
    let renderedCount = 0, totalCount = 0;
    function renderNodes(nodes, container) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            totalCount++;
            if (renderedCount >= TREE_MAX_RENDER) continue;
            if (node.type === 'folder') {
                const folderEl = document.createElement('div');
                folderEl.className = 'folder';
                /* 修复：根目录不提供重命名/删除入口，防止误删整个项目 */
                const actions = node.id === 'root' ? '' : `
                            <span class="actions">
                                <button onclick="event.stopPropagation(); renameItem('${node.id}')" title="重命名">${UI_ICONS.rename}</button>
                                <button onclick="event.stopPropagation(); deleteItem('${node.id}')" title="删除">${UI_ICONS.del}</button>
                            </span>`;
                folderEl.innerHTML = `
                    <div class="file-item-row" onclick="enterFolder('${node.id}')">
                        <div class="file-item">
                            <span class="icon">${UI_ICONS.folder}</span>
                            <span class="name">${escapeHtml(node.name)}</span>${actions}
                        </div>
                    </div>`;
                container.appendChild(folderEl);
            } else {
                const fileEl = document.createElement('div');
                fileEl.className = 'file-item-row';
                let icon = getFileIcon(node);
                const tip = node.originalName && node.originalName !== node.name
                    ? ` title="${L('原文件名：')}${escapeHtml(node.originalName)}"` : '';
                fileEl.innerHTML = `
                    <div class="file-item ${currentFileId === node.id ? 'active' : ''}" onclick="selectFile('${node.id}')"${tip}>
                        <span class="icon">${icon}</span>
                        <span class="name">${escapeHtml(node.name)}</span>
                        <span class="actions">
                            <button onclick="event.stopPropagation(); renameItem('${node.id}')" title="${I18N[LANG].rename_t || '重命名'}">${UI_ICONS.rename}</button>
                            <button onclick="event.stopPropagation(); deleteItem('${node.id}')" title="${I18N[LANG].delete_t || '删除'}">${UI_ICONS.del}</button>
                        </span>
                    </div>`;
                container.appendChild(fileEl);
            }
            renderedCount++;
        }
    }
    renderNodes(nodes, treeEl);
    if (totalCount > TREE_MAX_RENDER) {
        const hint = document.createElement('div');
        hint.style.cssText = 'padding:14px;color:#888;font-size:12px;text-align:center;line-height:1.6;';
        hint.textContent = L('共 ') + totalCount + L(' 项，仅显示前 ') + TREE_MAX_RENDER + L(' 项');
        treeEl.appendChild(hint);
    }
    const backBtn = document.getElementById('btnBackFolder');
    const vf = folderViewId ? findFileById(folderViewId) : null;
    if (backBtn) backBtn.style.display = (vf ? 'inline-flex' : 'none');
    renderBreadcrumb();
}
function enterFolder(id) {
    folderViewId = id;
    renderFileTree();
}
function backToParent() {
    if (!folderViewId) return;
    const vf = findFileById(folderViewId);
    if (!vf) { folderViewId = null; renderFileTree(); return; } /* id 悬挂兜底：视图回根并刷新 */
    const parent = findParent(folderViewId);
    if (parent && parent.type === 'folder' && parent.id !== 'root') folderViewId = parent.id;
    else folderViewId = null;
    renderFileTree();
}
/* 面包屑导航：点击任意层级直接跳转，永远知道自己在哪里 */
function jumpToFolder(id) {
    folderViewId = id;
    renderFileTree();
}
function renderBreadcrumb() {
    const nav = document.getElementById('folderBreadcrumb');
    if (!nav) return;
    const chain = [];
    let cur = folderViewId ? findFileById(folderViewId) : null;
    let guard = 0;
    while (cur && cur.id !== 'root' && guard++ < 32) {
        chain.unshift(cur);
        const p = findParent(cur.id);
        cur = (p && p.id !== cur.id) ? p : null;
    }
    let html = '<span class="crumb' + (chain.length ? '' : ' current') + '" onclick="jumpToFolder(null)">' + I18N[LANG].root_dir + '</span>';
    for (const node of chain) {
        const isCur = node.id === folderViewId;
        html += '<span class="crumb-sep">›</span><span class="crumb' + (isCur ? ' current' : '') + '" onclick="jumpToFolder(\'' + node.id + '\')">' + escapeHtml(node.name) + '</span>';
    }
    nav.innerHTML = html;
}
function toggleFileTree() {
    isTreeCollapsed = !isTreeCollapsed;
    const sidebar = document.getElementById('sidebar');
    if (isTreeCollapsed) sidebar.classList.add('collapsed');
    else sidebar.classList.remove('collapsed');
}
function getFileInfoText(file) {
    const isImage = file.isImage || (file.mime && file.mime.startsWith('image/'));
    const isAudio = file.isAudio || (file.mime && file.mime.startsWith('audio/'));
    let text = '';
    if (file.originalName && file.originalName !== file.name) text += L('📎 原始文件名：') + file.originalName + '\n';
    text += L('📎 当前名称：') + file.name + '\n';
    text += L('类型：') + (file.mime || L('未知')) + '\n';
    text += L('大小：') + (file.size ? formatSize(file.size) : L('未知')) + '\n\n';
    if (isImage) text += L('✅ 这个图片已经保存在项目中\n在 HTML 里这样引用它：\n\n  <img src="') + file.name + '" alt="">\n';
    else if (isAudio) text += L('✅ 这个音频已经保存在项目中\n在 HTML 里这样引用它：\n\n  <audio src="') + file.name + '" controls></audio>\n';
    else text += L('这是二进制文件，已保存到项目中，可以在 HTML 里通过文件名引用。');
    return text;
}
function stopAudioViewer() {
    const audioPlayer = document.getElementById('audioViewerPlayer');
    if (!audioPlayer) return;
    try { audioPlayer.pause(); } catch (e) {}
    audioPlayer.removeAttribute('src');
    try { audioPlayer.load(); } catch (e) {}
}
/* 视频查看器：编辑区内直接播放视频文件 */
function isVideoFile(file) {
    if (file.isVideo) return true;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    return ['mp4', 'webm', 'ogv', 'mov', 'm4v', 'mkv', 'avi', 'flv', 'wmv', '3gp'].includes(ext);
}
function stopVideoViewer() {
    const vp = document.getElementById('videoViewerPlayer');
    if (vp) {
        try { vp.pause(); } catch (e) {}
        vp.removeAttribute('src');
        try { vp.load(); } catch (e) {}
    }
    const vv = document.getElementById('videoViewer');
    if (vv) vv.classList.remove('active');
    if (typeof editorRootEl !== 'undefined' && editorRootEl) editorRootEl.classList.remove('video-mode');
}
/* ===== 编辑器内模型查看：仅旋转/缩放/平移的轻量预览 ===== */
function isModelFile(file) {
    if (!file || file.type !== 'file') return false;
    const ext = (file.name || '').split('.').pop().toLowerCase();
    return ext === 'glb' || ext === 'gltf' || ext === 'obj' || ext === 'stl';
}
function buildInlineModelDoc(file, url) {
    const tpl = document.getElementById('inlineModelTemplate');
    if (!tpl) return null;
    const data = JSON.stringify({ url: url, name: file.name, ext: (file.name.split('.').pop() || '').toLowerCase() });
    return tpl.innerHTML
        .replace('window.__MODEL__ = null;', 'window.__MODEL__ = ' + data + ';')
        .replace('/*__THEME_BOOT__*/', THEME_BOOT);
}
async function openInlineModelViewer(file) {
    const viewer = document.getElementById('modelInlineViewer');
    const frame = document.getElementById('modelInlineFrame');
    if (!viewer || !frame) return false;
    if (!OPFS_SUPPORTED) { showToast(L('当前浏览器不支持 OPFS，无法读取模型')); return false; }
    const url = await ensureBlobUrl(currentProjectId, file.id);
    if (!url) { showToast(L('无法读取模型文件')); return false; }
    const doc = buildInlineModelDoc(file, url);
    if (!doc) return false;
    frame.srcdoc = doc;
    viewer.classList.add('active');
    return true;
}
function closeInlineModelViewer() {
    const viewer = document.getElementById('modelInlineViewer');
    const frame = document.getElementById('modelInlineFrame');
    if (viewer) viewer.classList.remove('active');
    if (frame) frame.srcdoc = '';
}
async function selectFile(id) {
    const file = findFileById(id);
    if (!file || file.type === 'folder') return;
    stopAudioViewer();
    stopVideoViewer();
    closeFontViewer();
    closeMarkdownViewer();
    if (currentFileId && currentFileId !== id) {
        const cur = findFileById(currentFileId);
        if (cur && cur.editable !== false) cur.content = codeEditorEl.value;
        clearTimeout(snapshotTimer);
    }
    currentFileId = id;
    if (!openFileIds.includes(id)) openFileIds.push(id);
    if (file.inOpfs && file.editable !== false && typeof file.content !== 'string') {
        const text = await loadFileContent(currentProjectId, file.id);
        file.content = text || '';
    }
    ensureHistory(file);
    const imageViewer = document.getElementById('imageViewer');
    const imageViewerImg = document.getElementById('imageViewerImg');
    const imageViewerMeta = document.getElementById('imageViewerMeta');
    const audioViewer = document.getElementById('audioViewer');
    const audioViewerName = document.getElementById('audioViewerName');
    const audioViewerMeta = document.getElementById('audioViewerMeta');
    const audioPlayer = document.getElementById('audioViewerPlayer');
    const videoViewer = document.getElementById('videoViewer');
    const videoViewerName = document.getElementById('videoViewerName');
    const videoViewerMeta = document.getElementById('videoViewerMeta');
    const videoPlayer = document.getElementById('videoViewerPlayer');
    const isImage = file.isImage;
    const isAudio = file.isAudio;
    const isVideo = isVideoFile(file);
    imageViewer.classList.remove('active');
    audioViewer.classList.remove('active');
    stopVideoViewer();
    closeInlineModelViewer();
    editorRootEl.classList.remove('image-mode', 'audio-mode', 'video-mode');
    const _mdBtn = document.getElementById('btnMdPreview');
    if (_mdBtn) _mdBtn.style.display = 'none'; /* 各查看器模式统一隐藏，编辑分支按需显示 */
    if (isImage) {
        const url = await ensureBlobUrl(currentProjectId, file.id);
        imageViewerImg.src = url || '';
        let meta = file.name;
        if (file.size) meta += ' · ' + formatSize(file.size);
        if (file.originalName && file.originalName !== file.name) meta += L(' · 原文件名：') + file.originalName;
        imageViewerMeta.textContent = meta;
        imageViewer.classList.add('active');
        editorRootEl.classList.add('image-mode');
        codeEditorEl.value = ''; codeEditorEl.disabled = true;
        updateHighlight();
    } else if (isAudio) {
        const url = await ensureBlobUrl(currentProjectId, file.id);
        audioViewerName.textContent = file.name;
        let meta = '';
        if (file.size) meta += formatSize(file.size);
        if (file.originalName && file.originalName !== file.name) {
            if (meta) meta += ' · ';
            meta += L('原文件名：') + file.originalName;
        }
        audioViewerMeta.textContent = meta;
        audioPlayer.src = url || '';
        audioViewer.classList.add('active');
        editorRootEl.classList.add('audio-mode');
        codeEditorEl.value = ''; codeEditorEl.disabled = true;
        updateHighlight();
    } else if (isVideo) {
        /* 视频文件：编辑区内直接播放 */
        const url = await ensureBlobUrl(currentProjectId, file.id);
        videoViewerName.textContent = file.name;
        let vmeta = '';
        if (file.size) vmeta += formatSize(file.size);
        if (file.originalName && file.originalName !== file.name) {
            if (vmeta) vmeta += ' · ';
            vmeta += L('原文件名：') + file.originalName;
        }
        videoViewerMeta.textContent = vmeta;
        videoPlayer.src = url || '';
        videoViewer.classList.add('active');
        editorRootEl.classList.add('video-mode');
        codeEditorEl.value = ''; codeEditorEl.disabled = true;
        updateHighlight();
    } else if (isModelFile(file)) {
        /* 模型文件：编辑器内直接查看（仅旋转/缩放/平移） */
        const ok = await openInlineModelViewer(file);
        if (!ok) {
            codeEditorEl.value = getFileInfoText(file); codeEditorEl.disabled = true;
            updateHighlight();
        } else {
            codeEditorEl.value = ''; codeEditorEl.disabled = true;
            updateHighlight();
        }
    } else if (isFontFile(file)) {
        /* 字体文件：预览器（输入文字实时预览） */
        await openFontViewer(file);
    } else if (isMarkdownFile(file) && !_mdSkipOnce) {
        /* Markdown：默认打开预览（✏️ 编辑按钮可切换） */
        await openMarkdownViewer(file);
    } else {
        _mdSkipOnce = false;
        imageViewerImg.src = '';
        closeFontViewer();
        const mdBtn = document.getElementById('btnMdPreview');
        if (mdBtn) mdBtn.style.display = isMarkdownFile(file) ? 'inline-flex' : 'none';
        if (file.editable === false) {
            codeEditorEl.value = getFileInfoText(file); codeEditorEl.disabled = true;
        } else {
            codeEditorEl.value = file.content || ''; codeEditorEl.disabled = false;
        }
        updateHighlight();
        codeEditorEl.scrollTop = 0; codeEditorEl.scrollLeft = 0;
        syncScroll();
    }
    document.getElementById('currentFileName').textContent = file.name;
    showSearchStatus('');
    updateUndoRedoButtons();
    renderFileTree();
    renderFileTabs();
}
let _inputModalCb = null;
let _lastInputModalCb = null; /* 校验失败重开时恢复回调用 */
let _inputModalDual = false;
function showInputModal(title, placeholder, defaultValue, cb, dual) {
    _inputModalCb = cb;
    _lastInputModalCb = cb;
    _inputModalDual = !!dual;
    document.getElementById('inputModalTitle').textContent = title;
    const inp = document.getElementById('inputModalInput');
    inp.value = (defaultValue !== undefined && defaultValue !== null) ? defaultValue : '';
    inp.placeholder = placeholder || '';
    /* 双类型模式：确定按钮换成 文件/文件夹 两个创建按钮 */
    document.getElementById('inputModalOkBtn').style.display = _inputModalDual ? 'none' : '';
    document.getElementById('inputModalFileBtn').style.display = _inputModalDual ? 'inline-block' : 'none';
    document.getElementById('inputModalFolderBtn').style.display = _inputModalDual ? 'inline-block' : 'none';
    removeInputModalError();
    inp.select();
    document.getElementById('inputModal').style.display = 'flex';
    setTimeout(function () { inp.focus(); }, 50);
}
function hideInputModal() {
    document.getElementById('inputModal').style.display = 'none';
    _inputModalCb = null;
    removeInputModalError();
}
/* 校验失败：弹窗不关，显示红色错误并选中输入内容，方便直接修改 */
function inputModalError(msg) {
    const modal = document.getElementById('inputModal');
    const inp = document.getElementById('inputModalInput');
    if (!modal || !inp) { showToast(msg); return; }
    if (!_inputModalCb && _lastInputModalCb) _inputModalCb = _lastInputModalCb; /* 恢复回调 */
    let err = document.getElementById('inputModalError');
    if (!err) {
        err = document.createElement('div');
        err.id = 'inputModalError';
        err.style.cssText = 'color:#ff8e8e;font-size:12px;margin:-6px 0 10px;line-height:1.5;word-break:break-all;';
        inp.insertAdjacentElement('afterend', err);
    }
    err.textContent = msg;
    modal.style.display = 'flex';
    inp.focus();
    inp.select();
}
function removeInputModalError() {
    const err = document.getElementById('inputModalError');
    if (err) err.remove();
}
function confirmInputModal(type) {
    const val = document.getElementById('inputModalInput').value;
    const cb = _inputModalCb;
    const dual = _inputModalDual;
    hideInputModal();
    /* 双类型模式下回车默认创建文件 */
    if (typeof cb === 'function') cb(val, dual ? (type || 'file') : undefined);
}
/* 统一新建入口：弹窗确定区显示 [📄 文件] [📁 文件夹]，点哪个建哪个 */
function newItem() {
    showInputModal(I18N[LANG].new_f, I18N[LANG].new_name_ph, 'newfile.html', function (name, type) {
        const clean = sanitizeItemName(name);
        if (!clean) { showToast(L('名称不能为空')); return; }
        // 有展开的文件夹则新建到该文件夹，否则新建到根目录
        const target = getUploadTargetFolder() || { children: getCurrentFileTree() };
        const siblings = target.children || getCurrentFileTree();
        if (type === 'folder') {
            if (siblings.some(c => c.type === 'folder' && c.name === clean)) {
                showToast(L('同名文件夹已存在：') + clean);
                inputModalError(L('同一目录下已存在同名文件夹「') + clean + L('」，请换个名称'));
                return;
            }
            const id = genId('folder');
            const newFolderObj = { id: id, name: clean, type: 'folder', children: [] };
            if (target.children) target.children.push(newFolderObj);
            else { const tree = getCurrentFileTree(); tree.push(newFolderObj); setCurrentFileTree(tree); }
            renderFileTree(); saveProjects(true);
        } else {
            if (siblings.some(c => c.type === 'file' && c.name === clean)) {
                showToast(L('同名文件已存在：') + clean);
                inputModalError(L('同一目录下已存在同名文件「') + clean + L('」，请换个名称'));
                return;
            }
            const id = genId('file');
            const newFileObj = { id: id, name: clean, type: 'file', content: '' };
            if (target.children) target.children.push(newFileObj);
            else { const tree = getCurrentFileTree(); tree.push(newFileObj); setCurrentFileTree(tree); }
            renderFileTree(); selectFile(id); saveProjects(true);
        }
    }, true);
}
function renameItem(id) {
    if (id === 'root') { showToast(L('根目录不能重命名')); return; }
    const item = findFileById(id);
    if (!item) return;
    showInputModal(I18N[LANG].rename_f, I18N[LANG].rename_ph, item.name, function (newName) {
        const clean = sanitizeItemName(newName);
        if (!clean) { showToast(L('名称不能为空')); return; }
        if (clean === item.name) return;
        const parent = findParent(id);
        const siblings = (parent && parent.children) || getCurrentFileTree();
        if (siblings.some(c => c !== item && c.type === item.type && c.name === clean)) {
            showToast(L('同名项目已存在：') + clean);
            inputModalError(L('同一目录下已存在同名') + (item.type === 'folder' ? (I18N[LANG].folder || '文件夹') : (I18N[LANG].file || '文件')) + L('「') + clean + L('」，请换个名称'));
            return;
        }
        item.name = clean;
        renderFileTree(); renderFileTabs();
        const cf = document.getElementById('currentFileName');
        if (cf) cf.textContent = item.name;
        updateHighlight(); saveProjects(true);
    });
}
async function deleteItem(id) {
    if (id === 'root') { showToast(L('根目录不能删除')); return; }
    const item = findFileById(id);
    if (!item) return;
    if (!(await uiConfirm(L('确定删除吗？') + (item.type === 'folder' ? '\n' + L('文件夹内的所有文件都会被删除') : ''), { danger: true }))) return;
    /* 修复：先收集整个子树的 id，避免删除文件夹后 currentFileId / openFileIds / folderViewId 悬挂 */
    const removedIds = new Set();
    (function collectIds(node) {
        if (!node) return;
        removedIds.add(node.id);
        if (node.children) node.children.forEach(collectIds);
    })(item);
    (function removeOpfsContents(node) {
        if (!node) return;
        if (node.type === 'file' && node.inOpfs) {
            opfsDelete(currentProjectId, node.id);
            revokeBlobUrl(node.id);
            delete _fileContentCache[node.id];
            clearTimeout(_opfsWritebackTimers[node.id]);
            const _ff = _fontFaceCache.get(node.id); /* 字体预览缓存同步清理 */
            if (_ff) { try { document.fonts.delete(_ff); } catch (e) {} _fontFaceCache.delete(node.id); }
        }
        if (node.children) node.children.forEach(removeOpfsContents);
    })(item);
    openFileIds = openFileIds.filter(fid => !removedIds.has(fid));
    const parent = findParent(id);
    if (parent && parent.children) parent.children = parent.children.filter(c => c.id !== id);
    else { const tree = getCurrentFileTree(); setCurrentFileTree(tree.filter(c => c.id !== id)); }
    if (removedIds.has(currentFileId)) {
        stopAudioViewer();
        stopVideoViewer();
        closeInlineModelViewer();
        currentFileId = null;
        codeEditorEl.value = ''; codeEditorEl.disabled = true;
        editorRootEl.classList.remove('image-mode', 'audio-mode', 'video-mode');
        document.getElementById('imageViewer').classList.remove('active');
        document.getElementById('imageViewerImg').src = '';
        document.getElementById('audioViewer').classList.remove('active');
        document.getElementById('currentFileName').textContent = I18N[LANG].no_file;
        updateHighlight(); updateUndoRedoButtons();
        const next = openFileIds.find(fid => !!findFileById(fid));
        if (next) { selectFile(next); return; }
    }
    if (folderViewId && removedIds.has(folderViewId)) folderViewId = null;
    renderFileTree(); renderFileTabs(); saveProjects(true);
}

function getUploadTargetFolder() {
    if (folderViewId) {
        const folder = findFileById(folderViewId);
        if (folder && folder.type === 'folder') return folder;
    }
    const rootFolder = findFileById('root');
    if (rootFolder && rootFolder.type === 'folder') return rootFolder;
    return null;
}
function isTextFile(file) {
    const type = (file.type || '').toLowerCase();
    if (type.startsWith('text/')) return true;
    const textTypes = ['application/json', 'application/javascript', 'application/x-javascript',
        'application/xml', 'application/x-httpd-php', 'application/x-sh', 'application/sql'];
    if (textTypes.includes(type)) return true;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const textExts = [
        'html','htm','xhtml','css','scss','sass','less',
        'js','mjs','cjs','jsx','ts','tsx','vue','svelte',
        'json','json5','xml','svg','yml','yaml','toml',
        'txt','md','markdown','csv','tsv','log',
        'py','java','c','cpp','cc','h','hpp','cs',
        'go','rs','rb','php','swift','kt','scala',
        'sh','bash','zsh','bat','cmd','ps1',
        'sql','ini','conf','cfg','env','gitignore',
        'dockerfile','makefile'];
    return textExts.includes(ext);
}
function isImageFile(file) {
    if ((file.type || '').startsWith('image/')) return true;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    return ['png','jpg','jpeg','gif','webp','bmp','ico','svg','avif'].includes(ext);
}
function isFontFile(file) {
    if ((file.type || '').startsWith('font/')) return true;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    return ['woff','woff2','ttf','otf'].includes(ext);
}
function isAudioFile(file) {
    if ((file.type || '').startsWith('audio/')) return true;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    return ['mp3','ogg','oga','wav','m4a','aac','flac','opus','weba',
            'wma','amr','3gp','mid','midi','aiff','au'].includes(ext);
}
/* ===== 字体预览器：点击字体文件 → FontFace 加载 → 输入文字实时预览 ===== */
const _fontFaceCache = new Map(); /* fileId -> FontFace */
function fontPreviewFamily(id) { return 'PreviewFont_' + id.replace(/[^a-zA-Z0-9_]/g, ''); }
function updateFontPreviewLines() {
    const v = document.getElementById('fontPreviewInput').value;
    ['fpL1','fpL2','fpL3','fpL4'].forEach(function (lid) {
        document.getElementById(lid).textContent = v;
    });
}
document.getElementById('fontPreviewInput').addEventListener('input', updateFontPreviewLines);
async function openFontViewer(file) {
    const viewer = document.getElementById('fontViewer');
    editorRootEl.classList.add('font-mode');
    editorRootEl.classList.remove('image-mode', 'audio-mode');
    viewer.classList.add('active');
    codeEditorEl.value = ''; codeEditorEl.disabled = true;
    highlightLayerEl.textContent = ''; gutterEl.textContent = '';
    document.getElementById('fontViewerName').textContent = file.originalName || file.name;
    document.getElementById('fontViewerMeta').textContent = getFileInfoText(file).split('\n').slice(1).join(' · ');
    updateFontPreviewLines();
    /* 加载字体（缓存复用） */
    let ff = _fontFaceCache.get(file.id);
    if (!ff) {
        try {
            const url = await ensureBlobUrl(currentProjectId, file.id);
            ff = new FontFace(fontPreviewFamily(file.id), 'url(' + url + ')');
            await ff.load();
            document.fonts.add(ff);
            _fontFaceCache.set(file.id, ff);
        } catch (e) {
            document.getElementById('fontViewerMeta').textContent = L('字体加载失败：') + (e.message || e);
            return;
        }
    }
    const fam = '"' + ff.family + '"';
    ['fpL1','fpL2','fpL3','fpL4'].forEach(function (lid) {
        document.getElementById(lid).style.fontFamily = fam;
    });
    const charsEl = document.getElementById('fontChars');
    charsEl.style.fontFamily = fam;
    /* 字符集抽样：逐字符检测是否被字体覆盖，缺失的置灰 */
    const sample = 'ABCÇDEFGHIJKLMNOPQRSTUVWXYZabcçdefghijklmnopqrstuvwxyz0123456789' +
        '的一是在了不和有这上们来到时大地为子中你说生国年着就那和要她出也得里后自以会家可下而过天去能对小多然于心学么之都好看起发当没成只如事把还用第样道想作种开美总从无情己面最女但现前些所同日手又行意动方期它头经长儿回位分爱老因很给名法间斯知世什两次使身者被高已亲其进此话常与活正感' +
    '！？。，、；：""\'\'（）《》…—·￥%€$+-×÷=<>@#&*^~`|/\\[]{}';
    let html = '';
    for (const ch of sample) {
        html += '<span>' + escapeHtml(ch) + '</span>';
    }
    charsEl.innerHTML = html;
    /* 宽度探针批量检测缺失字形（0 宽或 tofu 宽度异常跳过：仅做视觉参考） */
    requestAnimationFrame(function () {
        try {
            const probe = document.createElement('span');
            probe.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden;font-family:' + fam + ';font-size:22px;white-space:pre;';
            charsEl.appendChild(probe);
            const spans = charsEl.querySelectorAll('span:not(.probe)');
            const fallbackW = (function () { probe.style.fontFamily = 'monospace'; probe.textContent = L('汉'); return probe.getBoundingClientRect().width; })();
            spans.forEach(function (s) {
                probe.style.fontFamily = fam;
                probe.textContent = s.textContent;
                const w = probe.getBoundingClientRect().width;
                if (w === 0 || w > fallbackW * 3) s.classList.add('miss');
            });
            probe.remove();
        } catch (e) { /* 检测失败：忽略，全部原样显示 */ }
    });
}
function closeFontViewer() {
    const viewer = document.getElementById('fontViewer');
    if (viewer) viewer.classList.remove('active');
    editorRootEl.classList.remove('font-mode');
}
/* ===== Markdown 预览器：点击 .md 文件渲染预览，✏️ 切换编辑 ===== */
function isMarkdownFile(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    return ['md','markdown','mdown'].includes(ext);
}
/* 轻量 MD 渲染器（无依赖）：标题/代码块/引用/列表/表格/链接/图片/行内标记 */
function renderMarkdown(src) {
    const codeBlocks = [];
    let text = String(src == null ? '' : src).replace(/\r\n?/g, '\n');
    /* 1. 提取 fenced code blocks */
    text = text.replace(/```([\w+-]*)\n?([\s\S]*?)(?:```|$)/g, function (m, lang, code) {
        codeBlocks.push('<pre><code data-lang="' + escapeHtml(lang || '') + '">' + escapeHtml(code.replace(/\n$/, '')) + '</code></pre>');
        return '\u0000CB' + (codeBlocks.length - 1) + '\u0000';
    });
    /* 2. 逐行块级解析 */
    const lines = text.split('\n');
    const out = [];
    let para = [], listType = null, listOpen = false, quoteOpen = false, tableRows = null;
    function flushPara() {
        if (para.length) { out.push('<p>' + inline(para.join('\n')) + '</p>'); para = []; }
    }
    function flushList() {
        if (listOpen) { out.push('</' + listType + '>'); listOpen = false; listType = null; }
    }
    function flushQuote() {
        if (quoteOpen) { out.push('</blockquote>'); quoteOpen = false; }
    }
    function flushAll() { flushPara(); flushList(); flushQuote(); if (tableRows) flushTable(); }
    function flushTable() {
        if (!tableRows || tableRows.length === 0) { tableRows = null; return; }
        let html = '<table><thead><tr>';
        tableRows[0].forEach(function (c) { html += '<th>' + inline(c) + '</th>'; });
        html += '</tr></thead><tbody>';
        for (let i = 1; i < tableRows.length; i++) {
            html += '<tr>';
            tableRows[i].forEach(function (c) { html += '<td>' + inline(c) + '</td>'; });
            html += '</tr>';
        }
        html += '</tbody></table>';
        out.push(html);
        tableRows = null;
    }
    function inline(s) {
        s = escapeHtml(s);
        s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');
        s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
        s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
        s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
        s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, '<img alt="$1" src="$2" loading="lazy">');
        s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, function (m, t, u) {
            const safe = /^(https?:|#|\/)/i.test(u) ? u : '#';
            return '<a href="' + escapeHtml(safe) + '" target="_blank" rel="noopener">' + t + '</a>';
        });
        return s;
    }
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const cbM = line.match(/^\u0000CB(\d+)\u0000$/);
        if (cbM) { flushAll(); out.push(codeBlocks[parseInt(cbM[1], 10)]); continue; }
        /* 表格：| a | b | 且下一行是 |---|---| */
        if (/^\s*\|.+\|\s*$/.test(line)) {
            const next = lines[i + 1] || '';
            if (/^\s*\|[\s:|-]+\|\s*$/.test(next)) {
                if (!tableRows) {
                    flushAll();
                    tableRows = [];
                    tableRows.push(line.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); }));
                    i++; /* 跳过分隔行 */
                    continue;
                }
            }
            if (tableRows) {
                tableRows.push(line.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); }));
                continue;
            }
        } else if (tableRows) { flushTable(); }
        const h = line.match(/^(#{1,6})\s+(.*)$/);
        if (h) { flushAll(); out.push('<h' + h[1].length + '>' + inline(h[2]) + '</h' + h[1].length + '>'); continue; }
        if (/^\s*(?:---+|\*\*\*+|___+)\s*$/.test(line)) { flushAll(); out.push('<hr>'); continue; }
        const q = line.match(/^\s*>\s?(.*)$/);
        if (q) {
            flushPara(); flushList();
            if (!quoteOpen) { out.push('<blockquote>'); quoteOpen = true; }
            out.push('<p>' + inline(q[1]) + '</p>');
            continue;
        }
        if (quoteOpen) flushQuote();
        const ul = line.match(/^\s*[-*+]\s+(.*)$/);
        const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
        if (ul || ol) {
            flushPara();
            const t = ul ? 'ul' : 'ol';
            if (!listOpen || listType !== t) { flushList(); out.push('<' + t + '>'); listOpen = true; listType = t; }
            out.push('<li>' + inline((ul || ol)[1]) + '</li>');
            continue;
        }
        if (listOpen) flushList();
        if (/^\s*$/.test(line)) { flushPara(); continue; }
        para.push(line);
    }
    flushAll();
    let html = out.join('\n');
    /* 还原代码块占位（防嵌套替换） */
    html = html.replace(/\u0000CB(\d+)\u0000/g, function (m, idx) { return codeBlocks[parseInt(idx, 10)]; });
    return '<div class="md-inner">' + html + '</div>';
}
async function resolveMdImages(file) {
    const imgs = document.querySelectorAll('#mdBody img');
    for (const img of imgs) {
        const src = img.getAttribute('src') || '';
        if (/^(https?:|data:|#)/i.test(src)) continue;
        const base = decodeURIComponent(src.split('/').pop().split('?')[0]);
        const target = (function find(nodes) {
            for (const n of nodes) {
                if (n.type === 'file' && n.name === base && (n.isImage || isImageFile(n))) return n;
                if (n.children) { const f = find(n.children); if (f) return f; }
            }
            return null;
        })(getCurrentFileTree());
        if (target) {
            try {
                const url = await ensureBlobUrl(currentProjectId, target.id);
                if (url) img.src = url;
            } catch (e) { /* 图片读取失败：保留原样 */ }
        }
    }
}
let _mdSkipOnce = false;
async function openMarkdownViewer(file) {
    const viewer = document.getElementById('mdViewer');
    editorRootEl.classList.remove('image-mode', 'audio-mode');
    viewer.classList.add('active');
    codeEditorEl.value = ''; codeEditorEl.disabled = true;
    highlightLayerEl.textContent = ''; gutterEl.textContent = '';
    document.getElementById('mdViewerName').textContent = file.name;
    let content = file.content;
    if (typeof content !== 'string') content = await loadFileContent(currentProjectId, file.id) || '';
    document.getElementById('mdBody').innerHTML = renderMarkdown(content);
    document.getElementById('btnMdPreview').style.display = 'none';
    resolveMdImages(file);
}
function closeMarkdownViewer() {
    const viewer = document.getElementById('mdViewer');
    if (viewer) viewer.classList.remove('active');
}
function mdSwitchToEdit() {
    if (!currentFileId) return;
    closeMarkdownViewer();
    _mdSkipOnce = true;
    selectFile(currentFileId);
}
function mdRequestPreview() {
    if (!currentFileId) return;
    const file = findFileById(currentFileId);
    if (file) openMarkdownViewer(file);
}
/* ===== 文件仓库：跨项目共享的文件存储区 =====
   二进制存 OPFS 固定目录（REPO_SCOPE），元数据存 IDB（REPO_KEY）
   两种模式：manage（工具菜单打开，可上传/重命名/删除）、select（项目内勾选导入） */
const REPO_SCOPE = '__repo__';
const REPO_KEY = 'ats_repo_files';
let repoFiles = [];
let repoMode = 'manage';
let repoSelected = new Set();
/* 新增：仓库搜索 / 排序 / 统计 */
let repoSearch = '';
let repoSort = 'time';
let repoVisible = [];
const REPO_SORTS = [
    { id: 'time', label: '按时间', key: 'repo_sort_time' },
    { id: 'name', label: '按名称', key: 'repo_sort_name' },
    { id: 'size', label: '按大小', key: 'repo_sort_size' }
];
function repoSortLabel() {
    const s = REPO_SORTS.find(function (x) { return x.id === repoSort; });
    if (!s) return '按时间';
    return (I18N[LANG] && I18N[LANG][s.key]) || s.label;
}
function repoCycleSort() {
    const i = REPO_SORTS.findIndex(function (s) { return s.id === repoSort; });
    repoSort = REPO_SORTS[(i + 1) % REPO_SORTS.length].id;
    const lb = document.getElementById('repoSortLabel');
    if (lb) lb.textContent = repoSortLabel();
    renderRepoList();
}
/* 过滤 + 排序后的可见列表（搜索/排序/统计都基于它） */
function repoComputeVisible() {
    const kw = repoSearch.trim().toLowerCase();
    const list = repoFiles.filter(function (f) {
        return !kw || (f.name || '').toLowerCase().indexOf(kw) >= 0;
    });
    list.sort(function (a, b) {
        if (repoSort === 'name') return (a.name || '').localeCompare(b.name || '', 'zh');
        if (repoSort === 'size') return (b.size || 0) - (a.size || 0);
        return (b.uploaded || 0) - (a.uploaded || 0);
    });
    repoVisible = list;
    return list;
}
function repoUpdateStats(list) {
    const el = document.getElementById('repoStats');
    if (!el) return;
    if (!repoFiles.length) { el.textContent = ''; return; }
    let total = 0;
    repoFiles.forEach(function (f) { total += (f.size || 0); });
    el.textContent = (list.length === repoFiles.length)
        ? repoFiles.length + L(' 个文件 · 共 ') + formatSize(total)
        : L('筛选出 ') + list.length + ' / ' + repoFiles.length + L(' 个 · 共 ') + formatSize(total);
}
function saveRepoMeta() { idbSet(REPO_KEY, repoFiles).catch(function (e) { console.warn(L('仓库元数据保存失败：'), e); }); }
function initRepo() {
    const lb = document.getElementById('repoSortLabel');
    if (lb) lb.textContent = repoSortLabel();
    idbGet(REPO_KEY).then(function (v) {
        if (Array.isArray(v)) repoFiles = v;
        if (document.getElementById('repoViewer').style.display === 'flex') renderRepoList();
    }).catch(function () {});
}
function onToolsRepo(e) {
    if (e) e.stopPropagation();
    closeToolsMenu(); closeZipMenu();
    openRepoViewer('manage');
}
function openRepoViewer(mode) {
    repoMode = (mode === 'select') ? 'select' : 'manage';
    repoSelected = new Set();
    closeSettingsModal();
    document.getElementById('repoSelectBar').style.display = repoMode === 'select' ? 'flex' : 'none';
    document.getElementById('repoFoot').style.display = repoMode === 'select' ? 'flex' : 'none';
    document.getElementById('repoSelCount').textContent = '0';
    document.getElementById('repoImportBtn').disabled = true;
    document.getElementById('repoViewer').style.display = 'flex';
    renderRepoList();
}
function closeRepoViewer() {
    document.getElementById('repoViewer').style.display = 'none';
    repoSelected = new Set();
}
function renderRepoList() {
    const list = document.getElementById('repoList');
    const visible = repoComputeVisible();
    repoUpdateStats(visible);
    const empty = '<div class="repo-empty">' + (repoSearch.trim()
        ? (I18N[LANG].repo_no_match || '没有匹配的文件')
        : (I18N[LANG] && I18N[LANG].repo_empty ? I18N[LANG].repo_empty : L('仓库为空，点击右上角 ➕ 上传文件'))) + '</div>';
    if (!visible.length) { list.innerHTML = empty; return; }
    let html = '';
    for (const f of visible) {
        const icon = getFileIcon(f);
        const checked = repoSelected.has(f.id);
        const check = repoMode === 'select'
            ? '<input type="checkbox" ' + (checked ? 'checked' : '') + ' onchange="repoToggle(\'' + f.id + '\', this.checked)">'
            : '';
        const actions = repoMode === 'manage'
            ? '<div class="repo-item-actions">' +
              '<button onclick="repoRename(\'' + f.id + '\')" title="' + (I18N[LANG].rename_t || '重命名') + '">' + UI_ICONS.rename + '</button>' +
              '<button onclick="repoDelete(\'' + f.id + '\')" title="' + (I18N[LANG].delete_t || '删除') + '">' + UI_ICONS.del + '</button>' +
              '</div>'
            : '';
        html += '<div class="repo-item" data-rid="' + f.id + '">' + check +
            '<span class="repo-item-icon">' + icon + '</span>' +
            '<span class="repo-item-info"><span class="repo-item-name">' + escapeHtml(f.name) + '</span>' +
            '<span class="repo-item-meta">' + formatSize(f.size) + '</span></span>' +
            actions + '</div>';
    }
    list.innerHTML = html;
    /* 修复：点击仓库文件行无反应——选择模式=勾选切换；管理模式=图片/音频直接预览，其他提示操作 */
    Array.prototype.forEach.call(list.querySelectorAll('.repo-item'), function (row) {
        row.addEventListener('click', function (e) {
            if (e.target.closest('.repo-item-actions') || e.target.closest('input[type=checkbox]')) return;
            const id = row.getAttribute('data-rid');
            const f = repoFiles.find(function (x) { return x.id === id; });
            if (!f) return;
            if (repoMode === 'select') {
                const cb = row.querySelector('input[type=checkbox]');
                if (cb) { cb.checked = !cb.checked; repoToggle(id, cb.checked); }
            } else {
                const isImg = /^image\//.test(f.type || '') || /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(f.name);
                const isAudio = /^audio\//.test(f.type || '') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(f.name);
                const isModel = /\.(glb|gltf|obj|stl)$/i.test(f.name);
                if (isImg || isAudio || isModel) {
                    repoPreviewFile(f, isImg ? 'image' : (isAudio ? 'audio' : 'model'));
                } else {
                    showToast(I18N[LANG].repo_click_hint);
                }
            }
        });
    });
}
/* 仓库文件预览：图片/音频/模型（只读，新标签打开） */
async function repoPreviewFile(f, kind) {
    try {
        const blob = await opfsRead(REPO_SCOPE, f.id);
        if (!blob) { showToast(L('读取失败：')); return; }
        const url = URL.createObjectURL(blob);
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.title = f.name;
        if (kind === 'image') {
            w.document.body.style.cssText = 'margin:0;background:#111';
            w.document.body.innerHTML = '<img src="' + url + '" style="max-width:100vw;max-height:100vh;object-fit:contain;display:block;margin:auto">';
        } else if (kind === 'audio') {
            w.document.body.style.cssText = 'margin:0';
            w.document.body.innerHTML = '<div style="padding:40px;font-family:system-ui"><h3>' + escapeHtml(f.name) + '</h3><audio controls autoplay src="' + url + '" style="width:100%"></audio></div>';
        } else {
            w.document.body.style.cssText = 'margin:0';
            w.document.body.innerHTML = '<div style="padding:24px;font-family:system-ui"><h3>' + escapeHtml(f.name) + '</h3><div style="border:1px dashed #888;padding:28px;text-align:center;color:#666">' + (LANG === 'en' ? 'Import to a project and open from the file tree for 3D preview' : '3D 预览请导入项目后从文件树打开') + '</div></div>';
        }
    } catch (err) { showToast(L('读取失败：')); }
}
function repoPickFiles() {
    const inp = document.getElementById('repoFileInput');
    inp.value = '';
    inp.click();
}
async function repoHandleFiles(input) {
    const files = Array.from(input.files || []);
    if (!files.length || !OPFS_SUPPORTED) { if (!OPFS_SUPPORTED) showToast(L('当前浏览器不支持 OPFS')); return; }
    for (const f of files) {
        const id = genId('repo');
        const safeName = sanitizeItemName(f.name) || ('file_' + Date.now());
        try {
            await opfsWrite(REPO_SCOPE, id, f);
            repoFiles.push({
                id: id, name: safeName, originalName: f.name,
                mime: f.type || '', size: f.size,
                isImage: (f.type || '').startsWith('image/'), isAudio: (f.type || '').startsWith('audio/'),
                uploaded: Date.now()
            });
        } catch (e) { console.warn(L('仓库写入失败：'), f.name, e); }
    }
    saveRepoMeta();
    renderRepoList();
    showToast(I18N[LANG].repo_saved || '已存入仓库');
}
function repoRename(id) {
    const f = repoFiles.find(function (x) { return x.id === id; });
    if (!f) return;
    showInputModal(I18N[LANG].repo_rename || '重命名', I18N[LANG].new_ph || L('输入名称'), f.name, function (name) {
        name = sanitizeItemName(name);
        if (!name) return;
        f.name = name;
        saveRepoMeta();
        renderRepoList();
        showToast(I18N[LANG].repo_renamed || '已重命名');
    });
}
async function repoDelete(id) {
    const f = repoFiles.find(function (x) { return x.id === id; });
    if (!f) return;
    if (!(await uiConfirm((I18N[LANG].repo_del_confirm || '确定从仓库删除「%s」吗？').replace('%s', f.name), { danger: true }))) return;
    opfsDelete(REPO_SCOPE, id).catch(function () {});
    repoFiles = repoFiles.filter(function (x) { return x.id !== id; });
    repoSelected.delete(id);
    saveRepoMeta();
    renderRepoList();
    showToast(I18N[LANG].repo_deleted || '已删除');
}
function repoToggle(id, on) {
    if (on) repoSelected.add(id); else repoSelected.delete(id);
    repoSelUpdate();
}
function repoToggleAll(on) {
    repoSelected = new Set();
    if (on) repoVisible.forEach(function (f) { repoSelected.add(f.id); });
    document.querySelectorAll('#repoList input[type=checkbox]').forEach(function (cb) {
        cb.checked = on;
    });
    repoSelUpdate();
}
function repoSelUpdate() {
    document.getElementById('repoSelCount').textContent = repoSelected.size;
    document.getElementById('repoImportBtn').disabled = repoSelected.size === 0;
    const all = document.getElementById('repoCheckAll');
    if (all) all.checked = repoVisible.length > 0 && repoSelected.size === repoVisible.length;
}
async function repoImport() {
    if (!repoSelected.size || !currentProjectId) return;
    if (!OPFS_SUPPORTED) { showToast(L('当前浏览器不支持 OPFS')); return; }
    const targetFolder = getUploadTargetFolder();
    const tree = targetFolder ? targetFolder.children : getCurrentFileTree();
    let imported = 0;
    for (const f of repoFiles) {
        if (!repoSelected.has(f.id)) continue;
        try {
            const blob = await opfsRead(REPO_SCOPE, f.id);
            if (!blob) continue;
            /* 项目内重名自动编号 */
            let name = f.name;
            let n = 1;
            const dot = name.lastIndexOf('.');
            const head = dot > 0 ? name.slice(0, dot) : name;
            const ext = dot > 0 ? name.slice(dot) : '';
            while (tree.some(function (c) { return c.type === 'file' && c.name === name; })) { name = n + ext; n++; }
            const id = genId('upload');
            await opfsWrite(currentProjectId, id, blob);
            const fileExt = (name.split('.').pop() || '').toLowerCase();
            const node = {
                id: id, name: name, originalName: f.originalName || f.name,
                type: 'file', mime: f.mime || '', size: f.size,
                uploaded: true, isImage: !!f.isImage, isAudio: !!f.isAudio,
                editable: isTextByExt(fileExt), inOpfs: true
            };
            tree.push(node);
            imported++;
        } catch (e) { console.warn(L('导入失败：'), f.name, e); }
    }
    saveProjects(true);
    renderFileTree();
    closeRepoViewer();
    showToast((I18N[LANG].repo_imported || '已导入 %s 个文件').replace('%s', imported));
}
document.getElementById('repoFileInput').addEventListener('change', function () { repoHandleFiles(this); });
/* 仓库搜索：输入即筛选（防抖 120ms） */
(function () {
    const inp = document.getElementById('repoSearchInput');
    if (!inp) return;
    let t = null;
    inp.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () { repoSearch = inp.value; renderRepoList(); }, 120);
    });
})();
/* ===== 上传来源选择（手机文件 / 仓库文件）===== */
function showUploadSourceModal() {
    closeToolsMenu();
    document.getElementById('uploadSourceModal').style.display = 'flex';
}
function hideUploadSourceModal() {
    document.getElementById('uploadSourceModal').style.display = 'none';
}
function pickUploadSource(kind) {
    hideUploadSourceModal();
    if (kind === 'device') {
        document.getElementById('fileInput').click();
    } else {
        openRepoViewer('select');
    }
}
function showUploadProgress(pct, label) {
    const el = document.getElementById('uploadProgress');
    const fill = document.getElementById('uploadProgressFill');
    const text = document.getElementById('uploadProgressText');
    if (!el || !fill || !text) return;
    el.classList.add('show');
    fill.style.width = pct + '%';
    text.textContent = label || (I18N[LANG].uploading + pct + '%');
}
function hideUploadProgress() {
    const el = document.getElementById('uploadProgress');
    if (!el) return;
    setTimeout(function () { el.classList.remove('show'); }, 260);
}
function uploadFile(input) {
    const files = Array.from(input.files || []);
    if (files.length === 0) return;
    input.value = '';
    if (!OPFS_SUPPORTED) {
        showToast(L('当前浏览器不支持 OPFS，请用最新版 Chrome / Edge / Firefox / Safari。'));
        return;
    }
    const projectId = currentProjectId;
    const targetFolder = getUploadTargetFolder();
    const listEl = targetFolder ? targetFolder.children : getCurrentFileTree();
    const total = files.length;
    let completed = 0, lastAddedId = null, lastProgressAt = 0;
    const usedByExt = new Map();
    function ensureUsedSet(ext) {
        let s = usedByExt.get(ext);
        if (!s) { s = new Set(); usedByExt.set(ext, s); }
        return s;
    }
    (function collect(nodes) {
        if (!nodes) return;
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (node.type === 'file') {
                const dot = node.name.lastIndexOf('.');
                if (dot > 0) {
                    const head = node.name.slice(0, dot);
                    if (/^\d+$/.test(head)) {
                        const num = parseInt(head, 10);
                        const ext = node.name.slice(dot + 1).toLowerCase();
                        ensureUsedSet(ext).add(num);
                    }
                }
            }
            if (node.children) collect(node.children);
        }
    })(listEl);
    function nextNameFor(rawExt) {
        const ext = (rawExt || 'bin').toLowerCase();
        const used = ensureUsedSet(ext);
        let n = 1;
        while (used.has(n)) n++;
        used.add(n);
        return n + '.' + ext;
    }
    function processOne(file, done) {
        const id = genId('upload');
        const isText = isTextFile(file);
        const isImg = isImageFile(file);
        const isAud = isAudioFile(file);
        const ext = (file.name.split('.').pop() || 'txt').toLowerCase();
        const newFileObj = {
            id: id, name: nextNameFor(ext), originalName: file.name,
            type: 'file', mime: file.type || '', size: file.size,
            uploaded: true, isImage: isImg, isAudio: isAud,
            editable: isText, inOpfs: true
        };
        opfsWrite(projectId, id, file).then(function () {
            if (isText) {
                file.text().then(function (text) {
                    _fileContentCache[id] = text;
                    listEl.push(newFileObj);
                    lastAddedId = id; completed++; done();
                }).catch(function () {
                    listEl.push(newFileObj);
                    lastAddedId = id; completed++; done();
                });
            } else {
                listEl.push(newFileObj);
                lastAddedId = id; completed++; done();
            }
        }).catch(function (err) {
            console.warn(L('OPFS 写失败：'), file.name, err);
            completed++; done();
        });
    }
    let nextIndex = 0, inFlight = 0;
    showUploadProgress(0, L('准备上传 0/') + total);
    function pump() {
        while (inFlight < UPLOAD_CONCURRENCY && nextIndex < total) {
            const file = files[nextIndex++];
            inFlight++;
            processOne(file, function () {
                inFlight--;
                const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
                if (now - lastProgressAt > 100 || completed === total) {
                    lastProgressAt = now;
                    const pct = Math.round(completed / total * 100);
                    showUploadProgress(pct, '上传中 ' + completed + '/' + total);
                }
                pump();
            });
        }
        if (nextIndex >= total && inFlight === 0) {
            showUploadProgress(100, L('已完成 ') + total + '/' + total);
            hideUploadProgress();
            renderFileTree();
            if (lastAddedId && total <= 50) selectFile(lastAddedId);
            scheduleSave();
        }
    }
    pump();
}

function isExternalUrl(url) {
    if (!url) return true;
    return /^(https?:)?\/\//i.test(url) || url.startsWith('data:') ||
           url.startsWith('blob:') || url.startsWith('#') ||
           url.startsWith('mailto:') || url.startsWith('tel:') ||
           url.startsWith('javascript:');
}
function buildFileMap() {
    const map = new Map();
    (function walk(nodes, prefix) {
        for (const node of nodes) {
            const path = prefix ? prefix + '/' + node.name : node.name;
            if (node.type === 'file') {
                if (!map.has(path)) map.set(path, node);
                if (!map.has(node.name)) map.set(node.name, node);
            }
            if (node.children) walk(node.children, path);
        }
    })(findFileById('root') ? findFileById('root').children : [], '');
    return map;
}
async function resolveLocalRefAsync(url, fileMap) {
    if (!url || isExternalUrl(url)) return null;
    const clean = url.split('?')[0].split('#')[0].replace(/^\.\//, '').replace(/^\//, '');
    if (!clean) return null;
    let file = fileMap.get(clean);
    if (!file) { const name = clean.split('/').pop(); file = fileMap.get(name); }
    if (!file) { addWarnLog('error', L('缺失文件：') + clean); return null; }
    if (file.inOpfs) {
        if (file.editable !== false) {
            if (file.content != null) return file.content;
            const text = await loadFileContent(currentProjectId, file.id);
            file.content = text || ''; return file.content;
        } else {
            return await ensureBlobUrl(currentProjectId, file.id);
        }
    }
    return file.content;
}
async function resolveCssUrlsAsync(cssContent, fileMap) {
    if (!cssContent) return cssContent;
    const re = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
    const matches = [];
    let m;
    while ((m = re.exec(cssContent)) !== null)
        matches.push({ match: m[0], url: m[2], index: m.index });
    if (matches.length === 0) return cssContent;
    const replacements = await Promise.all(matches.map(async function (mm) {
        const resolved = await resolveLocalRefAsync(mm.url, fileMap);
        return resolved !== null ? 'url("' + resolved + '")' : null;
    }));
    let result = '', lastIndex = 0;
    for (let i = 0; i < matches.length; i++) {
        const mm = matches[i];
        result += cssContent.slice(lastIndex, mm.index);
        result += replacements[i] != null ? replacements[i] : mm.match;
        lastIndex = mm.index + mm.match.length;
    }
    result += cssContent.slice(lastIndex);
    return result;
}
async function buildPreviewHtmlAsync(htmlContent) {
    if (!htmlContent) return '<!DOCTYPE html><html><body></body></html>';
    const fileMap = buildFileMap();
    let html = htmlContent;
    const srcRe = /(<(?:img|source|video|audio|embed|iframe|input)\b[^>]*?)\ssrc\s*=\s*(['"])([^'"]*)\2/gi;
    const srcMatches = [];
    let sm;
    while ((sm = srcRe.exec(html)) !== null)
        srcMatches.push({ match: sm[0], before: sm[1], quote: sm[2], url: sm[3], index: sm.index });
    const srcReplacements = await Promise.all(srcMatches.map(async function (mm) {
        const r = await resolveLocalRefAsync(mm.url, fileMap);
        return r !== null ? mm.before + ' src=' + mm.quote + r + mm.quote : null;
    }));
    let htmlOut = '', lastIdx = 0;
    for (let i = 0; i < srcMatches.length; i++) {
        const mm = srcMatches[i];
        htmlOut += html.slice(lastIdx, mm.index);
        htmlOut += srcReplacements[i] != null ? srcReplacements[i] : mm.match;
        lastIdx = mm.index + mm.match.length;
    }
    htmlOut += html.slice(lastIdx);
    html = htmlOut;
    const linkRe = /<link\b[^>]*>/gi;
    const linkMatches = [];
    let lm;
    while ((lm = linkRe.exec(html)) !== null) linkMatches.push({ match: lm[0], index: lm.index });
    const linkReplacements = await Promise.all(linkMatches.map(async function (mm) {
        const tag = mm.match;
        if (!/rel\s*=\s*(['"])?stylesheet\1?/i.test(tag)) return null;
        const hrefM = tag.match(/href\s*=\s*(['"])([^'"]*)\1/i);
        if (!hrefM) return null;
        const r = await resolveLocalRefAsync(hrefM[2], fileMap);
        if (r === null) return null;
        const css = await resolveCssUrlsAsync(r, fileMap);
        return '<style>' + css + '</style>';
    }));
    htmlOut = ''; lastIdx = 0;
    for (let i = 0; i < linkMatches.length; i++) {
        const mm = linkMatches[i];
        htmlOut += html.slice(lastIdx, mm.index);
        htmlOut += linkReplacements[i] != null ? linkReplacements[i] : mm.match;
        lastIdx = mm.index + mm.match.length;
    }
    htmlOut += html.slice(lastIdx);
    html = htmlOut;
    const scriptRe = /<script\b([^>]*?)\ssrc\s*=\s*(['"])([^'"]*)\2([^>]*?)>\s*<\/script>/gi;
    const scriptMatches = [];
    let scm;
    while ((scm = scriptRe.exec(html)) !== null)
        scriptMatches.push({ match: scm[0], before: scm[1], quote: scm[2], url: scm[3], after: scm[4], index: scm.index });
    const scriptReplacements = await Promise.all(scriptMatches.map(async function (mm) {
        const r = await resolveLocalRefAsync(mm.url, fileMap);
        return r !== null ? '<script' + mm.before + mm.after + '>' + r + '<\/script>' : null;
    }));
    htmlOut = ''; lastIdx = 0;
    for (let i = 0; i < scriptMatches.length; i++) {
        const mm = scriptMatches[i];
        htmlOut += html.slice(lastIdx, mm.index);
        htmlOut += scriptReplacements[i] != null ? scriptReplacements[i] : mm.match;
        lastIdx = mm.index + mm.match.length;
    }
    htmlOut += html.slice(lastIdx);
    html = htmlOut;
    const styleRe = /<style\b([^>]*)>([\s\S]*?)<\/style>/gi;
    const styleMatches = [];
    let stm;
    while ((stm = styleRe.exec(html)) !== null)
        styleMatches.push({ match: stm[0], attrs: stm[1], content: stm[2], index: stm.index });
    const styleReplacements = await Promise.all(styleMatches.map(async function (mm) {
        const css = await resolveCssUrlsAsync(mm.content, fileMap);
        return '<style' + mm.attrs + '>' + css + '</style>';
    }));
    htmlOut = ''; lastIdx = 0;
    for (let i = 0; i < styleMatches.length; i++) {
        const mm = styleMatches[i];
        htmlOut += html.slice(lastIdx, mm.index);
        htmlOut += styleReplacements[i] != null ? styleReplacements[i] : mm.match;
        lastIdx = mm.index + mm.match.length;
    }
    htmlOut += html.slice(lastIdx);
    return htmlOut;
}
function injectErrorScript(html) {
    const _en = (LANG === 'en');
    const _mRes = _en ? 'Resource load failed: <' : '资源加载失败：<';
    const _mUnk = _en ? 'Unknown error' : '未知错误';
    const _mLine = _en ? '  (line ' : '  (行 ';
    const _mProm = _en ? 'Unhandled promise rejection: ' : '未处理的 Promise 拒绝：';
    const script =
'<script>(function(){' +
'function send(t,d){try{parent.postMessage({__editorLog:true,type:t,data:d},"*");}catch(e){}}' +
'window.addEventListener("error",function(e){' +
  'if(e&&e.target&&e.target.tagName){' +
    'var tg=e.target.tagName.toUpperCase();' +
    'if(tg==="IMG"||tg==="SCRIPT"||tg==="LINK"||tg==="SOURCE"||tg==="VIDEO"||tg==="AUDIO"||tg==="IFRAME"||tg==="EMBED"){' +
      'var u=e.target.src||e.target.href||"";' +
      'send("error",' + JSON.stringify(_mRes) + '+tg.toLowerCase()+(u?" src=\\""+u+"\\"":"")+">");' +
      'return;' +
    '}' +
  '}' +
  'send("error",(e&&e.message?e.message:' + JSON.stringify(_mUnk) + ')+(e&&e.lineno?' + JSON.stringify(_mLine) + '+e.lineno+")":""));' +
'},true);' +
'window.addEventListener("unhandledrejection",function(e){' +
  'var m=(e&&e.reason&&e.reason.message)?e.reason.message:String(e&&e.reason);' +
  'send("error",' + JSON.stringify(_mProm) + '+m);' +
'});' +
'var _err=console.error;console.error=function(){send("error",Array.prototype.map.call(arguments,String).join(" "));_err.apply(console,arguments);};' +
'var _warn=console.warn;console.warn=function(){send("warn",Array.prototype.map.call(arguments,String).join(" "));_warn.apply(console,arguments);};' +
'})();<\/script>';
    if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, m => m + script);
    if (/<body[^>]*>/i.test(html)) return html.replace(/<body[^>]*>/i, m => script + m);
    return script + html;
}
/* ===== 预览隔离：防止项目里运行的代码（如复制进去的编辑器源码）与编辑器共用同一份存储进度 =====
   原理：预览 iframe 内把 localStorage/sessionStorage 替换为带前缀的 sessionStorage（按标签页隔离），
   IndexedDB 数据库名加前缀，OPFS 读写重定向到隔离子目录 —— 与编辑器的真实进度互不可见。 */
const PREVIEW_ISO_SHIM =
'(function(){' +
'var P="__ats_iso__";' +
'function shim(){var s=window.sessionStorage;return{' +
'getItem:function(k){try{return s.getItem(P+k);}catch(e){return null;}},' +
'setItem:function(k,v){try{s.setItem(P+k,String(v));}catch(e){}},' +
'removeItem:function(k){try{s.removeItem(P+k);}catch(e){}},' +
'clear:function(){try{s.clear();}catch(e){}},' +
'key:function(i){try{return s.key(i);}catch(e){return null;}},' +
'get length(){try{return s.length;}catch(e){return 0;}}};}' +
'try{Object.defineProperty(window,"localStorage",{value:shim(),configurable:true});}catch(e){}' +
'try{Object.defineProperty(window,"sessionStorage",{value:shim(),configurable:true});}catch(e){}' +
'try{var real=window.indexedDB;var sh=Object.create(real);' +
'sh.open=function(name,ver){return real.open(P+name,ver);};' +
'sh.deleteDatabase=function(name){return real.deleteDatabase(P+name);};' +
'Object.defineProperty(window,"indexedDB",{value:sh,configurable:true});}catch(e){}' +
'try{if(navigator.storage&&navigator.storage.getDirectory){' +
'var og=navigator.storage.getDirectory.bind(navigator.storage);' +
'navigator.storage.getDirectory=function(){return og().then(function(root){return root.getDirectoryHandle(P,{create:true});});};' +
'}}catch(e){}' +
'})();';
function injectPreviewIsolation(html) {
    var s = '<script>' + PREVIEW_ISO_SHIM + '<\/script>';
    if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, function (m) { return m + s; });
    if (/<html[^>]*>/i.test(html)) return html.replace(/<html[^>]*>/i, function (m) { return m + s; });
    return s + html;
}

async function runCode() {
    if (!currentFileId) { showToast(L('请先选择或创建一个 HTML 文件')); return; }
    const file = findFileById(currentFileId);
    if (!file) return;
    if (file.editable !== false) file.content = codeEditorEl.value;
    clearWarnLog();
    document.getElementById('btnRun').style.display = 'none';
    document.getElementById('btnStop').style.display = 'inline-block';
    document.getElementById('previewArea').classList.add('active');
    document.getElementById('warnBtn').classList.add('show');
    const iframe = document.getElementById('previewFrameFull');
    let html;
    if (file.isImage || file.isAudio) {
        const url = await ensureBlobUrl(currentProjectId, file.id);
        if (file.isImage) {
            html = '<!DOCTYPE html><html><body style="margin:0;display:flex;align-items:center;justify-content:center;background:#2d2d2d;min-height:100vh;"><img src="' + url + '" style="max-width:100%;max-height:100vh;"></body></html>';
        } else {
            html = '<!DOCTYPE html><html><body style="margin:0;display:flex;align-items:center;justify-content:center;background:#2d2d2d;min-height:100vh;"><audio src="' + url + '" controls autoplay style="width:80%;max-width:440px;"></audio></body></html>';
        }
    } else if (isModelFile(file)) {
        /* 模型文件：运行即在预览区打开 3D 查看 */
        const url = await ensureBlobUrl(currentProjectId, file.id);
        if (!url) { showToast(L('无法读取模型文件')); return; }
        html = buildInlineModelDoc(file, url) || '';
    } else if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
        html = '<!DOCTYPE html><html><body style="margin:0;"><pre style="padding:20px;background:#f5f5f5;white-space:pre-wrap;word-break:break-all;font-family:monospace;">' + escapeHtml(file.content || '') + '</pre></body></html>';
    } else {
        html = await buildPreviewHtmlAsync(file.content || '');
    }
    iframe.srcdoc = injectErrorScript(injectPreviewIsolation(html));
}
function stopPreview() {
    document.getElementById('previewArea').classList.remove('active');
    document.getElementById('btnRun').style.display = 'inline-block';
    document.getElementById('btnStop').style.display = 'none';
    document.getElementById('previewFrameFull').srcdoc = '';
    document.getElementById('warnBtn').classList.remove('show');
    hideWarnPanel();
}
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.getElementById('previewArea').classList.contains('active')) {
        stopPreview();
    }
});

const _CRC_TABLE = (function () {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++)
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        t[n] = c >>> 0;
    }
    return t;
})();
function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++)
        c = _CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
}
function textToBytes(str) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
    const utf8 = unescape(encodeURIComponent(str));
    const arr = new Uint8Array(utf8.length);
    for (let i = 0; i < utf8.length; i++) arr[i] = utf8.charCodeAt(i);
    return arr;
}
async function deflateRaw(bytes) {
    const cs = new CompressionStream('deflate-raw');
    const stream = new Blob([bytes]).stream().pipeThrough(cs);
    const ab = await new Response(stream).arrayBuffer();
    return new Uint8Array(ab);
}
/* buildZipAsync：DEFLATE 压缩打包（不可用或得不偿失时自动回退 STORE）
   返回 { bytes, original, packed } 用于压缩率统计 */
async function buildZipAsync(files) {
    const CAN_DEFLATE = (typeof CompressionStream !== 'undefined');
    let prepIdx = 0;
    async function prepOne(f) {
        f._method = 0; f._data = f.bytes;
        if (CAN_DEFLATE && f.bytes.length >= 64) {
            try {
                const comp = await deflateRaw(f.bytes);
                if (comp && comp.length < f.bytes.length) { f._method = 8; f._data = comp; }
            } catch (e) { /* 单个文件压缩失败：回退 STORE，不影响整体 */ }
        }
    }
    const prepWorkers = [];
    for (let i = 0; i < Math.min(4, files.length); i++) prepWorkers.push((async function () { while (prepIdx < files.length) await prepOne(files[prepIdx++]); })());
    await Promise.all(prepWorkers);

    const chunks = [], central = [];
    let offset = 0, totalOrig = 0, totalPacked = 0;
    const now = new Date();
    const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF;
    const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;
    for (const f of files) {
        const nameBytes = textToBytes(f.name);
        const crc = crc32(f.bytes);
        const method = f._method, comp = f._data;
        const lfh = new Uint8Array(30 + nameBytes.length);
        const dv = new DataView(lfh.buffer);
        dv.setUint32(0, 0x04034b50, true);
        dv.setUint16(4, 20, true);
        dv.setUint16(6, 0x0800, true);
        dv.setUint16(8, method, true);
        dv.setUint16(10, dosTime, true);
        dv.setUint16(12, dosDate, true);
        dv.setUint32(14, crc, true);
        dv.setUint32(18, comp.length, true);
        dv.setUint32(22, f.bytes.length, true);
        dv.setUint16(26, nameBytes.length, true);
        dv.setUint16(28, 0, true);
        lfh.set(nameBytes, 30);
        chunks.push(lfh); chunks.push(comp);
        const cdh = new Uint8Array(46 + nameBytes.length);
        const cdv = new DataView(cdh.buffer);
        cdv.setUint32(0, 0x02014b50, true);
        cdv.setUint16(4, 20, true);
        cdv.setUint16(6, 20, true);
        cdv.setUint16(8, 0x0800, true);
        cdv.setUint16(10, method, true);
        cdv.setUint16(12, dosTime, true);
        cdv.setUint16(14, dosDate, true);
        cdv.setUint32(16, crc, true);
        cdv.setUint32(20, comp.length, true);
        cdv.setUint32(24, f.bytes.length, true);
        cdv.setUint16(28, nameBytes.length, true);
        cdv.setUint16(30, 0, true);
        cdv.setUint16(32, 0, true);
        cdv.setUint16(34, 0, true);
        cdv.setUint16(36, 0, true);
        cdv.setUint32(38, 0, true);
        cdv.setUint32(42, offset, true);
        cdh.set(nameBytes, 46);
        central.push(cdh);
        totalOrig += f.bytes.length; totalPacked += comp.length;
        offset += lfh.length + comp.length;
    }
    const cdStart = offset;
    let cdSize = 0;
    for (const c of central) { chunks.push(c); cdSize += c.length; }
    const eocd = new Uint8Array(22);
    const edv = new DataView(eocd.buffer);
    edv.setUint32(0, 0x06054b50, true);
    edv.setUint16(4, 0, true);
    edv.setUint16(6, 0, true);
    edv.setUint16(8, files.length, true);
    edv.setUint16(10, files.length, true);
    edv.setUint32(12, cdSize, true);
    edv.setUint32(16, cdStart, true);
    edv.setUint16(20, 0, true);
    chunks.push(eocd);
    let total = 0;
    for (const c of chunks) total += c.length;
    const out = new Uint8Array(total);
    let p = 0;
    for (const c of chunks) { out.set(c, p); p += c.length; }
    return { bytes: out, original: totalOrig, packed: totalPacked };
}
function sanitizeFileName(name) {
    return String(name).replace(/[\\/:*?"<>|]/g, '_').trim() || 'project';
}
async function packProject() {
    if (!currentProjectId) { showToast(L('请先进入一个项目')); return; }
    const proj = projects.find(p => p.id === currentProjectId);
    if (!proj) return;
    syncCurrentFileContent();
    showToast(L('正在打包...'));
    const entries = [];
    (function walk(nodes, prefix) {
        for (const node of nodes) {
            if (node.type === 'folder') {
                const nextPrefix = prefix ? prefix + '/' + node.name : node.name;
                walk(node.children, nextPrefix);
            } else {
                const path = prefix ? prefix + '/' + node.name : node.name;
                entries.push({ node: node, path: path });
            }
        }
    })(proj.fileTree, '');
    if (entries.length === 0) { showToast(L('项目里还没有文件，无法打包')); return; }
    const rootName = sanitizeFileName(proj.name);
    const files = [];
    const CONC = 8;
    let idx = 0;
    const tasks = [];
    async function readOne(entry) {
        let bytes;
        if (entry.node.inOpfs) {
            try {
                const f = await opfsRead(currentProjectId, entry.node.id);
                const ab = await f.arrayBuffer();
                bytes = new Uint8Array(ab);
            } catch (e) {
                console.warn(L('读取 OPFS 失败：'), entry.path, e);
                bytes = textToBytes('');
            }
        } else {
            bytes = textToBytes(entry.node.content || '');
        }
        files.push({ name: rootName + '/' + entry.path, bytes: bytes });
    }
    async function worker() {
        while (idx < entries.length) { await readOne(entries[idx++]); }
    }
    for (let i = 0; i < CONC; i++) tasks.push(worker());
    await Promise.all(tasks);
    try {
        const result = await buildZipAsync(files);
        const zipBytes = result.bytes;
        const blob = new Blob([zipBytes], { type: 'application/zip' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = rootName + '.zip';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
        let msg = L('已打包 ') + files.length + L(' 个文件');
        if (result.original > 0 && result.packed < result.original) {
            const pct = Math.round((1 - result.packed / result.original) * 100);
            const mb = function (n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; };
            msg += L('，压缩节省 ') + pct + '%（' + mb(result.original) + ' → ' + mb(result.packed) + '）';
        }
        showToast(msg);
    } catch (e) {
        console.error(L('打包失败：'), e);
        showToast(L('打包失败：') + e.message);
    }
}
function toggleZipMenu(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('zipMenu');
    if (!menu) return;
    const row = menu.closest('.toolbar-row');
    const willOpen = (menu.style.display !== 'block');
    menu.style.display = willOpen ? 'block' : 'none';
    /* ZIP 菜单展开时解除首行工具栏的横向裁剪，防止下拉被 overflow 裁掉 */
    if (row) row.classList.toggle('menu-open', willOpen);
}
function closeZipMenu() {
    const menu = document.getElementById('zipMenu');
    if (menu) menu.style.display = 'none';
    const row = document.querySelector('.toolbar-row.menu-open');
    if (row) row.classList.remove('menu-open');
}
function onZipMenuPack(e) { if (e) e.stopPropagation(); closeZipMenu(); packProject(); }
function onZipMenuUpload(e) { if (e) e.stopPropagation(); closeZipMenu(); document.getElementById('zipInput').click(); }
document.addEventListener('click', function (e) {
    const wrapper = document.getElementById('zipWrapper');
    if (!wrapper) return;
    if (!wrapper.contains(e.target)) closeZipMenu();
});
function guessMime(name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    const map = {
        'html': 'text/html', 'htm': 'text/html', 'xhtml': 'application/xhtml+xml',
        'css': 'text/css', 'scss': 'text/x-scss', 'sass': 'text/x-sass', 'less': 'text/x-less',
        'js': 'application/javascript', 'mjs': 'application/javascript', 'cjs': 'application/javascript',
        'json': 'application/json', 'json5': 'application/json',
        'xml': 'application/xml', 'svg': 'image/svg+xml',
        'txt': 'text/plain', 'md': 'text/markdown', 'markdown': 'text/markdown',
        'csv': 'text/csv', 'tsv': 'text/tab-separated-values',
        'yml': 'text/yaml', 'yaml': 'text/yaml',
        'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
        'gif': 'image/gif', 'webp': 'image/webp', 'bmp': 'image/bmp',
        'ico': 'image/x-icon', 'avif': 'image/avif',
        'mp3': 'audio/mpeg', 'ogg': 'audio/ogg', 'oga': 'audio/ogg',
        'wav': 'audio/wav', 'm4a': 'audio/mp4', 'aac': 'audio/aac',
        'flac': 'audio/flac', 'opus': 'audio/opus', 'weba': 'audio/webm',
        'wma': 'audio/x-ms-wma', 'amr': 'audio/amr', 'mid': 'audio/midi',
        'midi': 'audio/midi', 'aiff': 'audio/aiff', 'au': 'audio/basic',
        'woff': 'font/woff', 'woff2': 'font/woff2', 'ttf': 'font/ttf', 'otf': 'font/otf'
    };
    return map[ext] || '';
}
function isTextByExt(ext) {
    return ['html','htm','xhtml','css','scss','sass','less','js','mjs','cjs','jsx','ts','tsx','vue','svelte',
        'json','json5','xml','svg','yml','yaml','toml','txt','md','markdown','csv','tsv','log',
        'py','java','c','cpp','cc','h','hpp','cs','go','rs','rb','php','swift','kt','scala',
        'sh','bash','zsh','bat','cmd','ps1','sql','ini','conf','cfg','env','gitignore',
        'dockerfile','makefile'].includes(ext);
}
async function inflateRaw(bytes) {
    if (typeof DecompressionStream === 'undefined') {
        throw new Error(L('当前浏览器不支持 DecompressionStream，无法解压'));
    }
    const ds = new DecompressionStream('deflate-raw');
    const stream = new Blob([bytes]).stream().pipeThrough(ds);
    const ab = await new Response(stream).arrayBuffer();
    return new Uint8Array(ab);
}
/* ZIP 文件名解码：UTF-8 优先，非 UTF-8 标记且出现乱码时回退 GBK（兼容 Windows 压缩包） */
function decodeZipEntryName(nameBytes, flags) {
    let utf8Name = '';
    try { utf8Name = new TextDecoder('utf-8').decode(nameBytes); } catch (e) { utf8Name = ''; }
    if ((flags & 0x0800) !== 0) return utf8Name; /* 明确声明 UTF-8：直接采用 */
    if (utf8Name && utf8Name.indexOf('\uFFFD') === -1) return utf8Name; /* 干净的 ASCII/UTF-8 */
    try {
        const gbkName = new TextDecoder('gbk').decode(nameBytes);
        if (gbkName && gbkName.indexOf('\uFFFD') === -1) return gbkName;
    } catch (e) { /* 浏览器不支持 GBK：保留 UTF-8 结果 */ }
    return utf8Name;
}
async function parseZip(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    const dv = new DataView(arrayBuffer);
    let eocdOffset = -1;
    const minPos = Math.max(0, bytes.length - 22 - 65536);
    for (let i = bytes.length - 22; i >= minPos; i--) {
        if (dv.getUint32(i, true) === 0x06054b50) { eocdOffset = i; break; }
    }
    if (eocdOffset === -1) throw new Error(L('不是有效的 ZIP 文件'));
    const totalEntries = dv.getUint16(eocdOffset + 10, true);
    const cdOffset = dv.getUint32(eocdOffset + 16, true);
    if (totalEntries === 0xFFFF || cdOffset === 0xFFFFFFFF)
        throw new Error(L('暂不支持 ZIP64 格式（文件超过 4GB）'));
    const entries = [];
    let p = cdOffset;
    for (let i = 0; i < totalEntries; i++) {
        if (p + 46 > bytes.length) break;
        if (dv.getUint32(p, true) !== 0x02014b50) break;
        const flags = dv.getUint16(p + 8, true);
        const method = dv.getUint16(p + 10, true);
        const crc = dv.getUint32(p + 16, true);
        const compSize = dv.getUint32(p + 20, true);
        const size = dv.getUint32(p + 24, true);
        const nameLen = dv.getUint16(p + 28, true);
        const extraLen = dv.getUint16(p + 30, true);
        const commentLen = dv.getUint16(p + 32, true);
        const localOffset = dv.getUint32(p + 42, true);
        const nameBytes = bytes.slice(p + 46, p + 46 + nameLen);
        entries.push({
            name: decodeZipEntryName(nameBytes, flags).replace(/\\/g, '/'),
            method: method, compSize: compSize, size: size, crc: crc, localOffset: localOffset,
            index: i
        });
        p += 46 + nameLen + extraLen + commentLen;
    }
    /* 并发解压（池化），并按压缩包内原始顺序输出 */
    const files = [];
    const corrupted = [];
    let workIdx = 0;
    async function extractOne(entry) {
        if (entry.name.endsWith('/')) return;
        if (entry.name.startsWith('__MACOSX/')) return;
        const baseName = entry.name.split('/').pop();
        if (baseName === '.DS_Store' || baseName === 'Thumbs.db') return;
        const lhOff = entry.localOffset;
        if (lhOff + 30 > bytes.length) return;
        if (dv.getUint32(lhOff, true) !== 0x04034b50) return;
        const lhNameLen = dv.getUint16(lhOff + 26, true);
        const lhExtraLen = dv.getUint16(lhOff + 28, true);
        const dataStart = lhOff + 30 + lhNameLen + lhExtraLen;
        const compData = bytes.slice(dataStart, dataStart + entry.compSize);
        let data;
        if (entry.method === 0) data = compData;
        else if (entry.method === 8) {
            try { data = await inflateRaw(compData); }
            catch (err) { console.warn(L('解压失败：'), entry.name, err); corrupted.push(entry.name); return; }
        } else return;
        if (crc32(data) !== entry.crc || (entry.size > 0 && data.length !== entry.size)) {
            console.warn(L('CRC 校验失败，已跳过：'), entry.name);
            corrupted.push(entry.name);
            return;
        }
        files.push({ name: entry.name, data: data, _i: entry.index });
    }
    const workers = [];
    for (let i = 0; i < Math.min(6, entries.length); i++) workers.push((async function () { while (workIdx < entries.length) await extractOne(entries[workIdx++]); })());
    await Promise.all(workers);
    files.sort(function (a, b) { return a._i - b._i; });
    if (files.length === 0 && corrupted.length > 0)
        throw new Error(L('所有文件解压失败，压缩包可能已损坏'));
    return files;
}
function findCommonTopDir(files) {
    if (files.length === 0) return '';
    const firstPart = files[0].name.split('/')[0];
    if (!firstPart || files[0].name.indexOf('/') === -1) return '';
    for (const f of files) {
        const parts = f.name.split('/');
        if (parts.length < 2) return '';
        if (parts[0] !== firstPart) return '';
    }
    return firstPart + '/';
}
async function applyZipEntriesAsync(files) {
    const rootFolder = findFileById('root');
    if (!rootFolder) return 0;
    const prefix = findCommonTopDir(files);
    if (prefix) for (const f of files) f.name = f.name.slice(prefix.length);
    let count = 0;
    const projectId = currentProjectId;
    const CONC = 8;
    let idx = 0;
    async function writeOne(entry) {
        const parts = entry.name.split('/').filter(p => p && p !== '.');
        if (parts.length === 0) return;
        const fileName = parts[parts.length - 1];
        const folderPath = parts.slice(0, -1);
        let current = rootFolder;
        for (const folderName of folderPath) {
            let sub = current.children.find(c => c.type === 'folder' && c.name === folderName);
            if (!sub) {
                sub = { id: genId('folder'), name: folderName, type: 'folder', children: [] };
                current.children.push(sub);
            }
            current = sub;
        }
        const mime = guessMime(fileName);
        const ext = (fileName.split('.').pop() || '').toLowerCase();
        const isText = mime.startsWith('text/') || mime === 'application/javascript' ||
                       mime === 'application/json' || mime === 'application/xml' || isTextByExt(ext);
        const isImage = mime.startsWith('image/');
        const isAudio = mime.startsWith('audio/');
        const id = genId('upload');
        const blob = new Blob([entry.data], { type: mime || 'application/octet-stream' });
        try { await opfsWrite(projectId, id, blob); }
        catch (e) { console.warn(L('OPFS 写失败：'), fileName, e); }
        const newFileObj = {
            id: id, name: fileName, originalName: fileName,
            type: 'file', mime: mime || '', size: entry.data.length,
            uploaded: true, isImage: isImage, isAudio: isAudio,
            editable: isText, inOpfs: true
        };
        if (isText) {
            try { _fileContentCache[id] = new TextDecoder('utf-8').decode(entry.data); } catch (e) {}
        }
        const existing = current.children.findIndex(c => c.type === 'file' && c.name === fileName);
        if (existing !== -1) {
            const old = current.children[existing];
            if (old.inOpfs) {
                opfsDelete(projectId, old.id);
                revokeBlobUrl(old.id);
                delete _fileContentCache[old.id];
            }
            current.children[existing] = newFileObj;
        } else {
            current.children.push(newFileObj);
        }
        count++;
    }
    async function worker() { while (idx < files.length) { await writeOne(files[idx++]); } }
    const tasks = [];
    for (let i = 0; i < CONC; i++) tasks.push(worker());
    await Promise.all(tasks);
    return count;
}
async function importZip(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    input.value = '';
    if (!currentProjectId) { showToast(L('请先进入一个项目')); return; }
    if (!OPFS_SUPPORTED) { showToast(L('当前浏览器不支持 OPFS')); return; }
    showToast(L('正在解压 ZIP ...'));
    try {
        const arrayBuffer = await file.arrayBuffer();
        const entries = await parseZip(arrayBuffer);
        if (entries.length === 0) { showToast(L('ZIP 文件为空')); return; }
        const count = await applyZipEntriesAsync(entries);
        folderViewId = null;
        renderFileTree();
        scheduleSave();
        showToast(L('已导入 ') + count + L(' 个文件'));
    } catch (e) {
        console.error(L('解压失败：'), e);
        showToast(L('解压失败：') + e.message);
    }
}

function showNewProjectModal() {
    document.getElementById('projectModal').style.display = 'flex';
    document.getElementById('projectName').value = '';
    document.getElementById('projectName').focus();
}
function hideNewProjectModal() {
    document.getElementById('projectModal').style.display = 'none';
}
function confirmNewProject() {
    const name = document.getElementById('projectName').value.trim();
    if (!name) { showToast(L('请输入项目名称')); return; }
    const id = genId('proj');
    const newProject = {
        id: id, name: name,
        fileTree: [
            { id: 'root', name: name + ' ' + L('根目录'), type: 'folder', children: [
                { id: genId('file'), name: 'index.html', type: 'file', content:
'<!DOCTYPE html>\n<html' + (LANG === 'en' ? ' lang="en"' : '') + '>\n<head>\n  <title>' + name + '</title>\n  <style>\n    body { font-family: system-ui, sans-serif; padding: 20px; text-align: center; }\n    h1 { color: #0e639c; }\n  </style>\n</head>\n<body>\n  <h1>' + L('欢迎来到 ') + name + '</h1>\n  <p>' + L('开始你的创作吧！') + '</p>\n</body>\n</html>' }
            ]}
        ]
    };
    projects.push(newProject);
    hideNewProjectModal();
    renderProjectList();
    saveProjects(true);
    enterProject(id);
}
document.getElementById('projectName').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') confirmNewProject();
});
window.addEventListener('beforeunload', function () {
    syncCurrentFileContent();
    /* 修复：关闭页面前尽力把当前 inOpfs 文件立即落盘（不等待防抖） */
    try {
        const file = currentFileId ? findFileById(currentFileId) : null;
        if (file && file.inOpfs === true && file.editable !== false && typeof file.content === 'string') {
            _fileContentCache[file.id] = file.content;
            opfsWrite(currentProjectId, file.id, new Blob([file.content], { type: 'text/plain;charset=utf-8' }));
        }
    } catch (e) {}
    const json = stringifyProjects();
    try { localStorage.setItem(BACKUP_KEY, json); } catch (e) {}
    try { idbSet(IDB_KEY, json); } catch (e) {}
});
document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') saveProjects(true);
});

/* ===== 为所有预览窗口的 ✕ 左侧加一个刷新按钮 ===== */
(function initRefreshButtons() {
    const configs = [
        {
            sel: '#modelViewerOverlay .model-viewer-close',
            refresh: () => { if (typeof openModelViewer === 'function') openModelViewer(); }
        },
        {
            sel: '#appViewerOverlay .model-viewer-close',
            refresh: () => { if (typeof openAppViewer === 'function') openAppViewer(); }
        },
        {
            sel: '#toolViewerOverlay .model-viewer-close',
            refresh: () => {
                if (typeof openTplTool === 'function' && typeof lastToolCall !== 'undefined' && lastToolCall) {
                    openTplTool(lastToolCall.tplId, lastToolCall.titleKey, lastToolCall.fallback);
                }
            }
        },
        {
            sel: '#previewArea .close-preview',
            refresh: () => {
                if (typeof currentFileId !== 'undefined' && currentFileId && typeof runCode === 'function') {
                    runCode();
                } else if (typeof showToast === 'function') {
                    showToast(L('没有正在运行的页面'));
                }
            }
        }
    ];

    configs.forEach(cfg => {
        const closeBtn = document.querySelector(cfg.sel);
        if (!closeBtn) return;
        const parent = closeBtn.parentNode;
        if (!parent) return;
        if (closeBtn.previousElementSibling &&
            closeBtn.previousElementSibling.classList.contains('btn-refresh-round')) return;

        const refresh = document.createElement('button');
        refresh.type = 'button';
        refresh.className = 'btn-refresh-round';
        refresh.title = L('刷新');
        refresh.setAttribute('aria-label', L('刷新'));
        refresh.textContent = '↻';

        refresh.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            refresh.classList.add('spinning');
            setTimeout(() => refresh.classList.remove('spinning'), 800);
            try {
                cfg.refresh();
            } catch (err) {
                console.warn(L('刷新失败：'), err);
            }
        });

        parent.insertBefore(refresh, closeBtn);
    });
})();

async function init() {
    initTheme();
applyStyleVersion(UI_STYLE);
applyGlassStyle(UI_GLASS);
applyGlassShape(UI_GLASS_SHAPE);
try { applyUiFontSize(localStorage.getItem(UIFS_KEY) || 13); } catch (err) {}
try {
    if (!localStorage.getItem(LANG_KEY) && !localStorage.getItem('ats_lang_asked')) showFirstLang();
} catch (err) {}
    initLang();
    initFontSize();
    initRepo();
    const saved = await loadProjects();
    if (saved) projects = saved;
    else { projects = JSON.parse(JSON.stringify(buildDefaultProjects())); saveProjects(true); }
    /* 首次进入选择英文时，把未动过的默认项目切换为英文版（处理弹窗先于项目加载的时序） */
    try {
        if (window.__ATS_PENDING_EN_DEFAULT && isPristineDefaultProject()) {
            projects = JSON.parse(JSON.stringify(buildDefaultProjects()));
            saveProjects(true);
        }
        window.__ATS_PENDING_EN_DEFAULT = false;
    } catch (err) {}
    renderProjectList();
    renderWarnList();
    isTreeCollapsed = true;
    document.getElementById('sidebar').classList.add('collapsed');
    document.getElementById('toolbar').style.display = 'none';
}
init();
