(function(){
  'use strict';

/* ===== 工具 i18n：静态 data-t + 动态 T()，语言继承父页并实时跟随 ===== */
var LANG = 'zh';
try { LANG = /en/i.test(parent.document.documentElement.lang || '') ? 'en' : 'zh'; } catch (e) {}
try { var _lk = localStorage.getItem('ats_editor_lang'); if (_lk === 'en') LANG = 'en'; else if (_lk === 'zh') LANG = 'zh'; } catch (e) {}
var T = function (s) { if (LANG === 'en') { var d = T.d.en; if (d[s] !== undefined) return d[s]; } return s; };
T.d = { en: {} };
function applyToolLang() {
  var d = T.d.en;
  var pick = function (k) { return (LANG === 'en') ? d[k] : k; };  /* 键即中文原文 */
  Array.prototype.forEach.call(document.querySelectorAll('[data-t]'), function (el) {
    var v = pick(el.getAttribute('data-t')); if (v !== undefined) el.textContent = v;
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-t-title]'), function (el) {
    var v = pick(el.getAttribute('data-t-title')); if (v !== undefined) el.title = v;
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-t-ph]'), function (el) {
    var v = pick(el.getAttribute('data-t-ph')); if (v !== undefined) el.placeholder = v;
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-t-html]'), function (el) {
    var v = pick(el.getAttribute('data-t-html')); if (v !== undefined) el.innerHTML = v;
  });
}
window.addEventListener('message', function (e) {
  var d = e.data;
  if (d && d.__atsLang) {
    LANG = d.__atsLang === 'en' ? 'en' : 'zh';
    applyToolLang();
    if (typeof onToolLangChange === 'function') { try { onToolLangChange(); } catch (err) {} }
  }
});

T.d.en = {
 "Base64 编码 / 解码 / 压缩包工具": "Base64 Encode / Decode / ZIP Tool",
 "Base64 编码 / 解码 工具": "Base64 Encode / Decode",
 "文本 / 文件 → Base64 · Base64 → 文本 / 文件 · 支持 ZIP 压缩包打包与解压保存": "Text/File → Base64 · Base64 → Text/File · ZIP pack & extract supported",
 "⚡ 编码 → Base64": "⚡ Encode → Base64",
 "📦 Base64 → 还原": "📦 Base64 → Decode",
 "📝 文本": "📝 Text",
 "📁 文件 / ZIP": "📁 File / ZIP",
 "清空": "Clear",
 "生成 Base64": "Generate Base64",
 "点击选择文件，或把文件 / 文件夹拖到这里": "Click to choose files, or drop files / folders here",
 "支持多选与整个文件夹 · 保留目录结构打包成 ZIP": "Multi-select & whole folders · keeps folder structure as ZIP",
 "压缩（DEFLATE）": "Compress (DEFLATE)",
 "原始": "Raw",
 "清空文件": "Clear Files",
 "仅打包下载 ZIP": "Download ZIP only",
 "Base64 输出": "Base64 Output",
 "📋 复制": "📋 Copy",
 "⬇ 下载为 .txt": "⬇ Save .txt",
 "↪ 发送到解码区": "↪ Send to Decoder",
 "📂 从 .txt 导入": "📂 Import .txt",
 "解码 / 还原": "Decode / Restore",
 "不是有效的 ZIP 文件": "Not a valid ZIP file",
 "暂不支持 ZIP64 格式": "ZIP64 not supported",
 "解压失败：": "Extract failed: ",
 "CRC 校验失败：": "CRC check failed: ",
 "请先输入文本": "Enter some text first",
 " 字节 → ": " bytes → ",
 " 项": " item(s)",
 "已复制": "Copied",
 "复制失败": "Copy failed",
 "已下载": "Downloaded",
 "已发送到解码区": "Sent to decoder",
 "已导入 ": "Imported ",
 " 个文件": " file(s)",
 "请选择文件": "Choose a file first",
 "打包中…": "Packing…",
 "解压中…": "Extracting…",
 "已打包 ": "Packed ",
 " 个条目": " entries",
 "保存": "Save",
 "文件名": "Filename",
 "内容为空": "Content is empty",
 "读取失败": "Read failed",
 "打包失败": "Pack failed",
 " · 图片预览失败（文件可能不完整）": " · image preview failed (file may be incomplete)",
 " 个在子目录": " in subfolders",
 " 个）": " items)",
 " 字符": " chars",
 "Base64 长度不正确": "Invalid Base64 length",
 "ZIP 解析失败：": "ZIP parse failed: ",
 "✓ 已复制": "✓ Copied",
 "✨ 压缩节省 ": "✨ saved ",
 "下载": "Download",
 "不是有效的 Base64 字符串": "Not a valid Base64 string",
 "保存中…": "Saving…",
 "保存失败：": "Save failed: ",
 "内容不是文本，也不是 ZIP 压缩包。可以自定义文件名后保存（记得带上正确的扩展名）。": "Not text or ZIP. You can still save with a custom filename (include the right extension).",
 "内容较大，复制可能需要几秒": "Large content; copying may take a few seconds",
 "压缩包内没有文件（或全部校验失败）。": "No files in archive (or all failed checks).",
 "处理中…": "Processing…",
 "复制失败，请手动选中复制": "Copy failed, select manually",
 "复制失败，请手动选择": "Copy failed, please select manually",
 "已下载 ": "Downloaded ",
 "已保存图片": "Image saved",
 "已全部保存到所选文件夹": "All saved to selected folder",
 "已复制 Data URL": "Data URL copied",
 "已复制到剪贴板": "Copied to clipboard",
 "已开始下载 ": "Started download: ",
 "已添加 ": "Added ",
 "已生成 Base64": "Base64 generated",
 "已生成 Data URL，可直接用于 img src / CSS url()": "Data URL ready for img src / CSS url()",
 "已生成 ZIP 压缩包的 Base64": "ZIP Base64 generated",
 "当前内容已是 Data URL": "Already a Data URL",
 "当前浏览器不支持选择文件夹，已逐个下载": "Folder picker unsupported; downloading one by one",
 "打包失败：": "Pack failed: ",
 "提取失败": "Extract failed",
 "文件已在列表中": "File already in list",
 "未压缩（文件太小或已关闭压缩）": "Uncompressed (too small or disabled)",
 "松手即可添加": "Release to add",
 "检测到 ZIP 压缩包": "ZIP archive detected",
 "没有内容": "Nothing here",
 "没有可下载的内容": "Nothing to download",
 "没有可复制的内容": "Nothing to copy",
 "没有可转换的内容": "Nothing to convert",
 "生成失败：": "Generate failed: ",
 "移除": "Remove",
 "解析中…": "Parsing…",
 "解析失败：": "Parse failed: ",
 "解码出的图片预览": "Decoded image preview",
 "解码结果 · 二进制文件": "Result · binary",
 "解码结果 · 图片": "Result · image",
 "解码结果 · 文本": "Result · text",
 "解码结果为空": "Empty result",
 "请先选择文件": "Choose a file first",
 "请粘贴 Base64 内容": "Paste Base64 content",
 "（压缩节省 ": "(saved ",
 "（含子目录 ": "(incl. subfolders ",
 "💾 保存为文件": "💾 Save as File",
 "💾 保存图片": "💾 Save Image",
 "💾 全部保存到文件夹…": "💾 Save All to Folder…",
 "📋 复制 Data URL": "📋 Copy Data URL",
 "📋 复制文本": "📋 Copy Text",
 "输出": "Output",
 "运行": "Run",
 "🔒 编码": "🔒 Encode",
 "🔓 解码": "🔓 Decode",
 "https://example.com/搜索?q=你好 world": "https://example.com/search?q=hello world",
 "🔗 URL 编码": "🔗 URL Encode",
 "🔗 生成 Data URL": "🔗 Data URL",
 "在这里输入要编码的文本（支持中文 / emoji）…": "Type the text to encode here (Chinese / emoji supported)…",
 "ZIP 文件名（默认 files_时间戳.zip）": "ZIP file name (default files_timestamp.zip)",
 "结果会显示在这里…": "Result will appear here…",
 "粘贴 Base64 字符串（可带 data:image/png;base64, 前缀，可含换行 / 空格）…": "Paste a Base64 string (a data:image/png;base64, prefix, line breaks / spaces are OK)…"
};
applyToolLang();


  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const fmtSize = n =>
      n < 1024 ? n + ' B' :
      n < 1048576 ? (n / 1024).toFixed(1) + ' KB' :
      (n / 1048576).toFixed(2) + ' MB';
  const basename = p => { const a = p.split('/'); return a[a.length - 1] || 'file'; };
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function toast(msg){
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 1900);
  }

  function bytesToBase64(bytes){
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk){
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }
  function base64ToBytes(b64){
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  const strToBase64 = s => bytesToBase64(new TextEncoder().encode(s));

  /* ===== 内联 ZIP 引擎（离线可用，不依赖 CDN）=====
     打包：DEFLATE 压缩（CompressionStream 不可用或得不偿失时回退 STORE）
     解压：并发 inflate + UTF-8/GBK 文件名解码 + CRC32 校验 */
  const ZIP_CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++){
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  function zipCrc32(bytes){
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = ZIP_CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  async function zipDeflateRaw(bytes){
    const cs = new CompressionStream('deflate-raw');
    const ab = await new Response(new Blob([bytes]).stream().pipeThrough(cs)).arrayBuffer();
    return new Uint8Array(ab);
  }
  async function zipInflateRaw(bytes){
    const ds = new DecompressionStream('deflate-raw');
    const ab = await new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer();
    return new Uint8Array(ab);
  }
  async function buildZipAsync(files, noCompress){
    const CAN = !noCompress && (typeof CompressionStream !== 'undefined');
    let idx = 0;
    async function prep(f){
      f._method = 0; f._data = f.bytes;
      if (CAN && f.bytes.length >= 64){
        try{
          const comp = await zipDeflateRaw(f.bytes);
          if (comp && comp.length < f.bytes.length){ f._method = 8; f._data = comp; }
        }catch(e){ /* 回退 STORE */ }
      }
    }
    const ws = [];
    for (let i = 0; i < Math.min(4, files.length); i++) ws.push((async () => { while (idx < files.length) await prep(files[idx++]); })());
    await Promise.all(ws);
    const now = new Date();
    const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF;
    const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;
    const chunks = [], central = [];
    let offset = 0, totalOrig = 0, totalPacked = 0;
    for (const f of files){
      const nb = new TextEncoder().encode(f.name);
      const crc = zipCrc32(f.bytes);
      const method = f._method, comp = f._data;
      const lfh = new Uint8Array(30 + nb.length);
      const dv = new DataView(lfh.buffer);
      dv.setUint32(0, 0x04034b50, true); dv.setUint16(4, 20, true); dv.setUint16(6, 0x0800, true);
      dv.setUint16(8, method, true); dv.setUint16(10, dosTime, true); dv.setUint16(12, dosDate, true);
      dv.setUint32(14, crc, true); dv.setUint32(18, comp.length, true); dv.setUint32(22, f.bytes.length, true);
      dv.setUint16(26, nb.length, true); dv.setUint16(28, 0, true);
      lfh.set(nb, 30);
      chunks.push(lfh, comp);
      const cdh = new Uint8Array(46 + nb.length);
      const cv = new DataView(cdh.buffer);
      cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, method, true); cv.setUint16(12, dosTime, true); cv.setUint16(14, dosDate, true);
      cv.setUint32(16, crc, true); cv.setUint32(20, comp.length, true); cv.setUint32(24, f.bytes.length, true);
      cv.setUint16(28, nb.length, true); cv.setUint32(42, offset, true);
      cdh.set(nb, 46);
      central.push(cdh);
      totalOrig += f.bytes.length; totalPacked += comp.length;
      offset += lfh.length + comp.length;
    }
    const cdStart = offset;
    let cdSize = 0;
    for (const c of central){ chunks.push(c); cdSize += c.length; }
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true);
    ev.setUint32(12, cdSize, true); ev.setUint32(16, cdStart, true);
    chunks.push(eocd);
    let total = 0;
    for (const c of chunks) total += c.length;
    const out = new Uint8Array(total);
    let pos = 0;
    for (const c of chunks){ out.set(c, pos); pos += c.length; }
    return { bytes: out, original: totalOrig, packed: totalPacked };
  }
  function decodeZipName(nb, flags){
    let s = '';
    try{ s = new TextDecoder('utf-8').decode(nb); }catch(e){}
    if (flags & 0x0800) return s;
    if (s && !s.includes('\uFFFD')) return s;
    try{
      const g = new TextDecoder('gbk').decode(nb);
      if (g && !g.includes('\uFFFD')) return g;
    }catch(e){}
    return s;
  }
  async function parseZip(ab){
    const bytes = new Uint8Array(ab);
    const dv = new DataView(ab);
    let eocdOff = -1;
    const minPos = Math.max(0, bytes.length - 22 - 65536);
    for (let i = bytes.length - 22; i >= minPos; i--){
      if (dv.getUint32(i, true) === 0x06054b50){ eocdOff = i; break; }
    }
    if (eocdOff === -1) throw new Error(T('不是有效的 ZIP 文件'));
    const total = dv.getUint16(eocdOff + 10, true);
    const cdOff = dv.getUint32(eocdOff + 16, true);
    if (total === 0xFFFF || cdOff === 0xFFFFFFFF) throw new Error(T('暂不支持 ZIP64 格式'));
    const metas = [];
    let p = cdOff;
    for (let i = 0; i < total; i++){
      if (p + 46 > bytes.length || dv.getUint32(p, true) !== 0x02014b50) break;
      const flags = dv.getUint16(p + 8, true);
      metas.push({
        flags,
        method: dv.getUint16(p + 10, true),
        crc: dv.getUint32(p + 16, true),
        compSize: dv.getUint32(p + 20, true),
        size: dv.getUint32(p + 24, true),
        nameLen: dv.getUint16(p + 28, true),
        extraLen: dv.getUint16(p + 30, true),
        commentLen: dv.getUint16(p + 32, true),
        localOff: dv.getUint32(p + 42, true),
        nb: bytes.slice(p + 46, p + 46 + dv.getUint16(p + 28, true)),
        index: i
      });
      p += 46 + metas[i].nameLen + metas[i].extraLen + metas[i].commentLen;
    }
    const files = [];
    let wi = 0;
    async function extract(m){
      const name = decodeZipName(m.nb, m.flags).replace(/\\/g, '/');
      if (name.endsWith('/') || name.startsWith('__MACOSX/')) return;
      const bn = name.split('/').pop();
      if (bn === '.DS_Store' || bn === 'Thumbs.db') return;
      const lo = m.localOff;
      if (lo + 30 > bytes.length || dv.getUint32(lo, true) !== 0x04034b50) return;
      const dataStart = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true);
      const comp = bytes.slice(dataStart, dataStart + m.compSize);
      let data;
      if (m.method === 0) data = comp;
      else if (m.method === 8){
        try{ data = await zipInflateRaw(comp); }
        catch(e){ console.warn(T('解压失败：'), name, e); return; }
      } else return;
      if (zipCrc32(data) !== m.crc || (m.size > 0 && data.length !== m.size)){
        console.warn(T('CRC 校验失败：'), name); return;
      }
      files.push({ name, data, _i: m.index });
    }
    const ws = [];
    for (let i = 0; i < Math.min(6, metas.length); i++) ws.push((async () => { while (wi < metas.length) await extract(metas[wi++]); })());
    await Promise.all(ws);
    files.sort((a, b) => a._i - b._i);
    return files;
  }

  async function copyText(text){
    if (navigator.clipboard && window.isSecureContext){
      try { await navigator.clipboard.writeText(text); return true; } catch(e){ }
    }
    try{
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly','');
      ta.style.cssText = 'position:fixed;top:-1000px;left:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    }catch(e){ return false; }
  }

  function saveBlob(blob, filename){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 20000);
  }

  function timestamp(){
    const d = new Date(), p = n => String(n).padStart(2,'0');
    return '' + d.getFullYear() + p(d.getMonth()+1) + p(d.getDate())
      + '_' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  }

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
      const target = tab.dataset.tab;
      $('panel-encode').hidden = target !== 'encode';
      $('panel-decode').hidden = target !== 'decode';
      $('panel-url').style.display = target === 'url' ? '' : 'none';
    });
  });

  /* ===== URL 编码 / 解码 ===== */
  let urlMode = 'enc';
  document.querySelectorAll('.useg').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.useg').forEach(x => x.classList.toggle('active', x === b));
      urlMode = b.dataset.umode;
    });
  });
  $('btnClearUrl').addEventListener('click', () => { $('urlInput').value = ''; $('urlOutput').value = ''; });
  $('btnUrlGo').addEventListener('click', () => {
    const s = $('urlInput').value;
    if (!s.trim()) { toast(T('没有内容')); return; }
    let r = '';
    try {
      if (urlMode === 'enc') {
        /* 整体 encodeURI，空格等安全字符保留可读性；含 ?&=# 时用完整 encodeURIComponent */
        r = /[?#&=]/.test(s) ? encodeURIComponent(s) : encodeURI(s);
      } else {
        r = decodeURIComponent(s.replace(/\+/g, ' '));
      }
    } catch (err) {
      toast((urlMode === 'enc' ? 'Encode' : 'Decode') + ' failed');
      return;
    }
    $('urlOutput').value = r;
  });
  $('btnUrlCopy').addEventListener('click', () => {
    const v = $('urlOutput').value;
    if (!v) { toast(T('没有可复制的内容')); return; }
    copyText(v);
  });

  document.querySelectorAll('.seg-btn').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.seg-btn').forEach(x => x.classList.toggle('active', x === b));
      const m = b.dataset.mode;
      $('mode-text').hidden = m !== 'text';
      $('mode-file').hidden = m !== 'file';
    });
  });

  $('btnEncodeText').addEventListener('click', () => {
    const t = $('textInput').value;
    if (!t){ toast(T('请先输入文本')); return; }
    const b64 = strToBase64(t);
    $('output').value = b64;
    _lastEncodeMime = 'text/plain;charset=utf-8';
    $('outInfo').textContent =
      new TextEncoder().encode(t).length + T(' 字节 → ') + b64.length.toLocaleString() + T(' 字符');
    toast(T('已生成 Base64'));
  });
  $('btnClearText').addEventListener('click', () => {
    $('textInput').value = '';
    $('textInput').focus();
  });

  let pickedFiles = []; /* {name, path, size, file}，path 含相对目录（拖入文件夹时） */

  function fileIcon(name){
    const ext = (name.split('.').pop() || '').toLowerCase();
    const map = {
      png:'🖼️',jpg:'🖼️',jpeg:'🖼️',gif:'🖼️',webp:'🖼️',svg:'🖼️',bmp:'🖼️',ico:'🖼️',
      mp4:'🎬',mkv:'🎬',mov:'🎬',avi:'🎬',webm:'🎬',
      mp3:'🎵',wav:'🎵',flac:'🎵',ogg:'🎵',m4a:'🎵',
      zip:'📦',rar:'📦','7z':'📦',tar:'📦',gz:'📦',
      html:'🌐',htm:'🌐',css:'🎨',js:'📜',mjs:'📜',ts:'📜',json:'🧾',
      pdf:'📕',doc:'📄',docx:'📄',xls:'📊',xlsx:'📊',ppt:'📊',pptx:'📊',
      txt:'📄',md:'📄',log:'📄'
    };
    return map[ext] || '📎';
  }

  function renderFiles(){
    const box = $('fileList');
    box.innerHTML = '';
    const summary = $('listSummary');
    if (!pickedFiles.length){
      summary.hidden = true;
      $('btnClearFiles').disabled = true;
      return;
    }
    $('btnClearFiles').disabled = false;
    let total = 0;
    pickedFiles.forEach(f => total += f.size);
    const withDir = pickedFiles.filter(f => f.path && f.path !== f.name).length;
    summary.hidden = false;
    summary.innerHTML = '';
    const parts = [
      el('b', null, pickedFiles.length + T(' 个文件')),
      el('span','sep','·'),
      el('span', null, fmtSize(total))
    ];
    if (withDir) parts.push(el('span', null, ' · ' + withDir + T(' 个在子目录')));
    parts.forEach(n => summary.appendChild(n));
    pickedFiles.forEach((f, idx) => {
      const row = el('div','fileitem');
      row.appendChild(el('span','ficon', fileIcon(f.name)));
      const main = el('div','fmain');
      main.appendChild(el('span','fname', f.name));
      if (f.path && f.path !== f.name) main.appendChild(el('span','fpath', f.path));
      row.appendChild(main);
      row.appendChild(el('span','fsize', fmtSize(f.size)));
      const del = el('button','btn small ghost','✕');
      del.title = T('移除');
      del.addEventListener('click', () => { pickedFiles.splice(idx,1); renderFiles(); });
      row.appendChild(del);
      box.appendChild(row);
    });
  }

  /* 拖入文件夹：递归收集（webkitGetAsEntry），保留目录结构 */
  async function collectDroppedFiles(dt){
    const out = [];
    const items = dt.items ? Array.from(dt.items) : [];
    const entries = items
      .map(it => (it.webkitGetAsEntry ? it.webkitGetAsEntry() : null))
      .filter(Boolean);
    if (entries.length){
      async function walk(entry, prefix){
        if (entry.isFile){
          try{
            const file = await new Promise((res, rej) => entry.file(res, rej));
            out.push({ name: file.name, path: prefix + file.name, size: file.size, file });
          }catch(e){ /* 单文件读取失败：跳过 */ }
        } else if (entry.isDirectory){
          const reader = entry.createReader();
          let batch;
          do {
            batch = await new Promise((res, rej) => reader.readEntries(res, rej));
            for (const e of batch) await walk(e, prefix + entry.name + '/');
          } while (batch.length);
        }
      }
      for (const entry of entries) await walk(entry, '');
    } else {
      for (const f of dt.files) out.push({ name: f.name, path: f.name, size: f.size, file: f });
    }
    return out;
  }

  function addFiles(list){
    let added = 0, fromDir = 0;
    list.forEach(f => {
      const path = f.path || f.name;
      if (!pickedFiles.some(p => p.path === path && p.size === f.size)){
        pickedFiles.push(f);
        added++;
        if (path !== f.name) fromDir++;
      }
    });
    if (pickedFiles.length > 1) $('zipToggle').checked = true; /* 多文件：自动启用 ZIP */
    renderFiles();
    if (added){
      let msg = T('已添加 ') + added + T(' 个文件');
      if (fromDir) msg += T('（含子目录 ') + fromDir + T(' 个）');
      toast(msg);
    } else if (list.length) toast(T('文件已在列表中'));
  }

  $('dropZone').addEventListener('click', () => $('fileInput').click());
  $('fileInput').addEventListener('change', e => {
    addFiles(Array.from(e.target.files).map(f => ({
      name: f.name, path: f.webkitRelativePath || f.name, size: f.size, file: f
    })));
    e.target.value = '';
  });

  ['dragenter','dragover'].forEach(ev =>
    $('dropZone').addEventListener(ev, e => {
      e.preventDefault(); e.stopPropagation();
      $('dropZone').classList.add('over');
      $('dropMain').textContent = T('松手即可添加');
    }));
  ['dragleave','drop'].forEach(ev =>
    $('dropZone').addEventListener(ev, e => {
      e.preventDefault(); e.stopPropagation();
      $('dropZone').classList.remove('over');
      $('dropMain').textContent = T('点击选择文件，或把文件 / 文件夹拖到这里');
    }));
  $('dropZone').addEventListener('drop', async e => {
    if (!e.dataTransfer) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length){
      const list = await collectDroppedFiles(e.dataTransfer);
      addFiles(list);
    }
  });

  $('btnClearFiles').addEventListener('click', () => {
    pickedFiles = [];
    renderFiles();
    $('packResult').hidden = true;
  });

  let _lastZipStats = '';
  let _lastZipResult = null;
  let _lastEncodeMime = 'text/plain;charset=utf-8';   /* 记录最近一次编码的 MIME，供 Data URL 使用 */
  function zipFileName(){
    let n = ($('zipName').value || '').trim();
    n = n.replace(/[\\/:*?"<>|]/g, '_');
    if (!n) return 'files_' + timestamp() + '.zip';
    if (!/\.zip$/i.test(n)) n += '.zip';
    return n;
  }
  async function buildZipBlob(){
    const files = [];
    for (const f of pickedFiles){
      files.push({ name: f.path || f.name, bytes: new Uint8Array(await f.file.arrayBuffer()) });
    }
    const result = await buildZipAsync(files, !$('zipToggle').checked);
    _lastZipResult = result;
    _lastZipStats = (result.original > 0 && result.packed < result.original)
      ? T('（压缩节省 ') + Math.round((1 - result.packed / result.original) * 100) + '%）'
      : '';
    return new Blob([result.bytes], { type: 'application/zip' });
  }
  function showPackResult(zipName){
    const r = _lastZipResult;
    if (!r) return;
    const box = $('packResult');
    $('prHead').textContent = '📦 ' + zipName + ' · ' + pickedFiles.length + T(' 个文件');
    $('prSizeOrig').textContent = fmtSize(r.original);
    $('prSizeComp').textContent = fmtSize(r.packed);
    const pct = r.original > 0 ? Math.max(1.5, Math.round(r.packed / r.original * 100)) : 100;
    $('prBarOrig').style.width = '100%';
    $('prBarComp').style.width = '0%';
    box.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => { $('prBarComp').style.width = pct + '%'; }));
    $('prNote').textContent = (r.original > 0 && r.packed < r.original)
      ? T('✨ 压缩节省 ') + Math.round((1 - r.packed / r.original) * 100) + '%（' + fmtSize(r.original) + ' → ' + fmtSize(r.packed) + '）'
      : T('未压缩（文件太小或已关闭压缩）');
  }

  $('btnEncodeFiles').addEventListener('click', async () => {
    if (!pickedFiles.length){ toast(T('请先选择文件')); return; }
    const btn = $('btnEncodeFiles');
    const old = btn.textContent;
    btn.disabled = true;
    btn.textContent = T('处理中…');
    try{
      const useZip = $('zipToggle').checked || pickedFiles.length > 1;
      let bytes;
      if (useZip){
        const blob = await buildZipBlob();
        bytes = new Uint8Array(await blob.arrayBuffer());
        showPackResult(zipFileName());
      } else {
        bytes = new Uint8Array(await pickedFiles[0].file.arrayBuffer());
        $('packResult').hidden = true;
      }
      const b64 = bytesToBase64(bytes);
      $('output').value = b64;
      _lastEncodeMime = useZip ? 'application/zip' : (pickedFiles[0].file.type || 'application/octet-stream');
      $('outInfo').textContent =
        fmtSize(bytes.length) + ' → ' + b64.length.toLocaleString() + T(' 字符');
      toast(useZip ? T('已生成 ZIP 压缩包的 Base64') : T('已生成 Base64'));
      if (b64.length > 5_000_000) setTimeout(() => toast(T('内容较大，复制可能需要几秒')), 1200);
    }catch(err){
      console.error(err);
      toast(T('生成失败：') + err.message);
    }finally{
      btn.disabled = false;
      btn.textContent = old;
    }
  });

  $('btnZipDownload').addEventListener('click', async () => {
    if (!pickedFiles.length){ toast(T('请先选择文件')); return; }
    const btn = $('btnZipDownload');
    const old = btn.textContent;
    btn.disabled = true;
    btn.textContent = T('打包中…');
    try{
      const blob = await buildZipBlob();
      const name = zipFileName();
      saveBlob(blob, name);
      showPackResult(name);
      toast(T('已开始下载 ') + name + _lastZipStats);
    }catch(err){
      toast(T('打包失败：') + err.message);
    }finally{
      btn.disabled = false;
      btn.textContent = old;
    }
  });

  $('btnCopy').addEventListener('click', async () => {
    const v = $('output').value;
    if (!v){ toast(T('没有可复制的内容')); return; }
    const btn = $('btnCopy');
    const old = btn.textContent;
    const ok = await copyText(v);
    btn.textContent = ok ? T('✓ 已复制') : T('复制失败');
    toast(ok ? T('已复制到剪贴板') : T('复制失败，请手动选中复制'));
    setTimeout(() => { btn.textContent = old; }, 1400);
  });

  $('btnDownloadTxt').addEventListener('click', () => {
    const v = $('output').value;
    if (!v){ toast(T('没有可下载的内容')); return; }
    saveBlob(new Blob([v], { type: 'text/plain;charset=utf-8' }), 'base64_' + timestamp() + '.txt');
  });

  /* ===== 生成 Data URL：可直接用于 <img src> / CSS url() ===== */
  $('btnDataUrl').addEventListener('click', () => {
    const v = $('output').value;
    if (!v){ toast(T('没有可转换的内容')); return; }
    if (/^data:/i.test(v)){ toast(T('当前内容已是 Data URL')); return; }
    const url = 'data:' + _lastEncodeMime + ';base64,' + v;
    $('output').value = url;
    $('outInfo').textContent = 'Data URL · ' + url.length.toLocaleString() + T(' 字符');
    toast(T('已生成 Data URL，可直接用于 img src / CSS url()'));
  });

  $('btnToDecode').addEventListener('click', () => {
    const v = $('output').value;
    if (!v){ toast(T('没有内容')); return; }
    $('decodeInput').value = v;
    document.querySelector('.tab[data-tab="decode"]').click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  $('btnClearDecode').addEventListener('click', () => {
    $('decodeInput').value = '';
    const area = $('resultArea');
    area.innerHTML = '';
    area.hidden = true;
  });

  $('btnImportB64').addEventListener('click', () => $('b64FileInput').click());
  $('b64FileInput').addEventListener('change', async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try{
      $('decodeInput').value = await f.text();
      toast(T('已导入 ') + f.name);
    }catch(err){ toast(T('读取失败')); }
  });

  function isTextLike(bytes){
    const n = Math.min(bytes.length, 8192);
    if (!n) return false;
    let bad = 0;
    for (let i = 0; i < n; i++){
      const b = bytes[i];
      if (b === 0) return false;
      if (b < 9 || (b > 13 && b < 32) || b === 127) bad++;
    }
    return bad / n < 0.02;
  }

  /* ===== 识别常见图片格式（魔术字节）===== */
  function detectImageMime(b){
    if (!b || b.length < 12) return null;
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return 'image/png';
    if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'image/jpeg';
    if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'image/gif';
    if (b[0] === 0x42 && b[1] === 0x4D) return 'image/bmp';
    if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
        b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
    return null;
  }
  function mimeToExt(mime){
    return (mime.split('/')[1] || 'png').replace('jpeg', 'jpg').replace('x-icon', 'ico');
  }

  $('btnDecode').addEventListener('click', async () => {
    let raw = $('decodeInput').value.trim();
    if (!raw){ toast(T('请粘贴 Base64 内容')); return; }

    raw = raw.replace(/^data:[^,]*,/i, '');
    raw = raw.replace(/\s+/g, '');
    let s = raw.replace(/-/g, '+').replace(/_/g, '/');
    const mod = s.length % 4;
    if (mod === 1){ toast(T('Base64 长度不正确')); return; }
    if (mod) s += '='.repeat(4 - mod);

    let bytes;
    try{ bytes = base64ToBytes(s); }
    catch(e){ toast(T('不是有效的 Base64 字符串')); return; }
    if (!bytes.length){ toast(T('解码结果为空')); return; }

    const btn = $('btnDecode');
    const old = btn.textContent;
    btn.disabled = true;
    btn.textContent = T('解析中…');
    try{
      const isZip = bytes[0] === 0x50 && bytes[1] === 0x4B;
      const imgMime = detectImageMime(bytes);
      if (isZip){
        await showZip(bytes);
      } else if (imgMime){
        showImage(bytes, imgMime);
      } else if (isTextLike(bytes)){
        showText(new TextDecoder('utf-8').decode(bytes));
      } else {
        showBinary(bytes);
      }
      $('resultArea').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }catch(err){
      console.error(err);
      toast(T('解析失败：') + err.message);
    }finally{
      btn.disabled = false;
      btn.textContent = old;
    }
  });

  function showText(text){
    const area = $('resultArea');
    area.innerHTML = '';
    area.hidden = false;

    const card = el('div','card fade-up');
    const hero = el('div','result-hero');
    hero.append(
      (() => { const i = el('div','rh-icon','📝'); return i; })(),
      (() => { const m = el('div','rh-main');
        m.append(el('div','rh-title',T('解码结果 · 文本')),
                 el('div','rh-info', text.length.toLocaleString() + T(' 字符')));
        return m; })()
    );

    const ta = el('textarea','mono');
    ta.readOnly = true;
    ta.value = text;

    const row = el('div','row');
    const bCopy = el('button','btn primary',T('📋 复制文本'));
    bCopy.addEventListener('click', async () => {
      const ok = await copyText(text);
      toast(ok ? T('已复制') : T('复制失败，请手动选择'));
    });
    const bDl = el('button','btn',T('⬇ 下载为 .txt'));
    bDl.addEventListener('click', () =>
      saveBlob(new Blob([text], { type:'text/plain;charset=utf-8' }), 'decoded_' + timestamp() + '.txt'));
    row.append(bCopy, bDl);

    card.append(hero, ta, row);
    area.appendChild(card);
  }

  function showBinary(bytes){
    const area = $('resultArea');
    area.innerHTML = '';
    area.hidden = false;

    const card = el('div','card fade-up');
    const hero = el('div','result-hero');
    const heroIcon = el('div','rh-icon','🧩');
    const heroMain = el('div','rh-main');
    heroMain.append(el('div','rh-title',T('解码结果 · 二进制文件')),
                    el('div','rh-info', fmtSize(bytes.length)));
    hero.append(heroIcon, heroMain);

    const hint = el('p','hint',T('内容不是文本，也不是 ZIP 压缩包。可以自定义文件名后保存（记得带上正确的扩展名）。'));

    const row = el('div','row');
    const nameInput = el('input','nameinput');
    nameInput.value = 'decoded.bin';
    const bDl = el('button','btn primary',T('💾 保存为文件'));
    bDl.addEventListener('click', () => {
      const name = (nameInput.value || '').trim() || 'decoded.bin';
      saveBlob(new Blob([bytes]), name);
    });
    row.append(nameInput, bDl);

    card.append(hero, hint, row);
    area.appendChild(card);
  }

  /* ===== 解码结果 · 图片（预览 + 保存 + 复制 Data URL）===== */
  function showImage(bytes, mime){
    const area = $('resultArea');
    area.innerHTML = '';
    area.hidden = false;

    const card = el('div','card fade-up');
    const hero = el('div','result-hero');
    const heroIcon = el('div','rh-icon','🖼️');
    const heroMain = el('div','rh-main');
    const heroTitle = el('div','rh-title',T('解码结果 · 图片'));
    const info = el('div','rh-info', fmtSize(bytes.length) + ' · ' + mime);
    heroMain.append(heroTitle, info);
    hero.append(heroIcon, heroMain);

    const img = el('img','result-img');
    const objUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
    img.alt = T('解码出的图片预览');
    img.addEventListener('load', () => {
      info.textContent = fmtSize(bytes.length) + ' · ' + img.naturalWidth + '×' + img.naturalHeight + ' · ' + mime;
    });
    img.addEventListener('error', () => {
      info.textContent = fmtSize(bytes.length) + T(' · 图片预览失败（文件可能不完整）');
    });
    img.src = objUrl;

    const row = el('div','row');
    const bDl = el('button','btn primary',T('💾 保存图片'));
    bDl.addEventListener('click', () => {
      saveBlob(new Blob([bytes], { type: mime }), 'decoded_' + timestamp() + '.' + mimeToExt(mime));
      toast(T('已保存图片'));
    });
    const bCopy = el('button','btn',T('📋 复制 Data URL'));
    bCopy.addEventListener('click', async () => {
      const ok = await copyText('data:' + mime + ';base64,' + bytesToBase64(bytes));
      toast(ok ? T('已复制 Data URL') : T('复制失败，请手动选择'));
    });
    row.append(bDl, bCopy);

    card.append(hero, img, row);
    area.appendChild(card);
    setTimeout(() => { try { URL.revokeObjectURL(objUrl); } catch(e){} }, 60000);
  }

  async function showZip(bytes){
    const area = $('resultArea');
    area.innerHTML = '';
    area.hidden = false;

    const card = el('div','card fade-up');
    const hero = el('div','result-hero');
    const heroIcon = el('div','rh-icon','📦');
    const heroMain = el('div','rh-main');
    const heroTitle = el('div','rh-title',T('检测到 ZIP 压缩包'));
    const info = el('div','rh-info',T('解析中…'));
    heroMain.append(heroTitle, info);
    hero.append(heroIcon, heroMain);

    const listBox = el('div','filelist zip-list');
    card.append(hero, listBox);
    area.appendChild(card);

    let entries;
    try{
      entries = await parseZip(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    }catch(err){
      info.textContent = '';
      listBox.appendChild(el('div','hint',T('ZIP 解析失败：') + err.message));
      return;
    }

    info.textContent = entries.length + T(' 个文件');
    if (!entries.length){
      listBox.appendChild(el('div','hint',T('压缩包内没有文件（或全部校验失败）。')));
      return;
    }

    entries.forEach(entry => {
      const row = el('div','zipitem');
      row.appendChild(el('span','zicon', fileIcon(entry.name)));
      const nm = el('span','name', entry.name);
      nm.title = entry.name;
      const sz = el('span','size', fmtSize(entry.data.length));
      const bDl = el('button','btn small',T('下载'));
      bDl.addEventListener('click', () => {
        try{
          saveBlob(new Blob([entry.data]), basename(entry.name));
          toast(T('已下载 ') + basename(entry.name));
        }catch(err){
          toast(T('提取失败'));
        }
      });
      row.append(nm, sz, bDl);
      listBox.appendChild(row);
    });

    const row = el('div','row');
    const bAll = el('button','btn primary',T('💾 全部保存到文件夹…'));
    bAll.addEventListener('click', () => saveAllEntries(entries, bAll));
    row.appendChild(bAll);
    card.appendChild(row);
  }

  async function saveAllEntries(entries, btn){
    const old = btn.textContent;
    btn.disabled = true;
    btn.textContent = T('保存中…');
    try{
      if (window.showDirectoryPicker){
        let dir;
        try{
          dir = await window.showDirectoryPicker({ mode: 'readwrite' });
        }catch(e){
          if (e && e.name === 'AbortError') return;
          throw e;
        }
        for (const entry of entries){
          const parts = entry.name.split('/').filter(Boolean);
          const fname = parts.pop();
          let cur = dir;
          for (const p of parts){
            cur = await cur.getDirectoryHandle(p, { create: true });
          }
          const fh = await cur.getFileHandle(fname, { create: true });
          const w = await fh.createWritable();
          await w.write(new Blob([entry.data]));
          await w.close();
        }
        toast(T('已全部保存到所选文件夹'));
      } else {
        for (const entry of entries){
          saveBlob(new Blob([entry.data]), basename(entry.name));
          await sleep(400);
        }
        toast(T('当前浏览器不支持选择文件夹，已逐个下载'));
      }
    }catch(err){
      if (!err || err.name !== 'AbortError') toast(T('保存失败：') + (err && err.message));
    }finally{
      btn.disabled = false;
      btn.textContent = old;
    }
  }

  renderFiles(); /* 初始化按钮/统计栏状态 */
})();
