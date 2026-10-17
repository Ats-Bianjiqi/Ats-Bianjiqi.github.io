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
 "上传": "Upload",
 "撤销": "Undo",
 "适": "Fit",
 "还原": "Reset",
 "导出": "Export",
 "存仓库": "To Repo",
 "点击上传图片 / 视频 / 动图": "Click to upload image / video / GIF",
 "支持 JPG / PNG / WebP / GIF动图 / MP4·WebM视频": "JPG / PNG / WebP / GIF / MP4·WebM supported",
 "小": "S",
 "中": "M",
 "大": "L",
 "取消": "Cancel",
 "确定": "OK",
 "放置文字": "Place Text",
 "查看": "View",
 "裁剪": "Crop",
 "画笔": "Brush",
 "文字": "Text",
 "滤镜": "Filter",
 "变换": "Transform",
 "贴图": "Sticker",
 "💡 双指或滚动条平移画面，＋/− 缩放视图（不影响图片像素）": "💡 Pan with scroll, zoom with ＋/− (view only, pixels untouched)",
 "拖动边角调整，框内拖动移动": "Drag corners to resize, drag inside to move",
 "✓ 应用裁剪": "✓ Apply Crop",
 "全图": "Full",
 "颜色": "Color",
 "粗细": "Size",
 "👆 点击图片位置放置文字": "👆 Click on image to place text",
 "描边:关": "Stroke: off",
 "亮度": "Brightness",
 "对比": "Contrast",
 "饱和": "Saturation",
 "模糊": "Blur",
 "✓ 应用滤镜": "✓ Apply",
 "重置": "Reset",
 "↺ 左转90°": "↺ 90° Left",
 "↻ 右转90°": "↻ 90° Right",
 "⇋ 水平翻转": "⇋ Flip H",
 "⇵ 垂直翻转": "⇵ Flip V",
 "自由旋转": "Free Rotate",
 "✓ 应用": "✓ Apply",
 "＋ 导入贴图": "＋ Add Sticker",
 "✓ 合并到图片": "✓ Merge",
 "清空": "Clear",
 "透明度": "Opacity",
 "缩放": "Scale",
 "🗑 删除此层": "🗑 Delete Layer",
 "导入后拖动贴图调整位置，点缩略图选中图层": "Drag sticker to move, click thumbnail to select layer",
 "请选择图片 / 动图 / 视频文件": "Please choose an image / GIF / video",
 "当前浏览器不支持动图解码，仅编辑第一帧": "GIF decoding unsupported, editing first frame only",
 "正在解析动图…": "Parsing GIF…",
 "正在解析视频…": "Extracting video frames…",
 "视频加载失败": "Video load failed",
 "无法读取视频时长": "Cannot read video duration",
 "已加载 ": "Loaded ",
 "已导入 ": "Imported ",
 " 张贴图，拖动调整位置": " stickers, drag to position",
 "已合并 ": "Merged ",
 " 个贴图层": " sticker layer(s)",
 "已清空全部贴图": "All stickers cleared",
 "已旋转 ": "Rotated ",
 "°": "°",
 "先拖动滑条预览角度": "Drag the slider first",
 "已左转 90°": "Rotated 90° left",
 "已右转 90°": "Rotated 90° right",
 "已水平翻转": "Flipped horizontally",
 "已垂直翻转": "Flipped vertically",
 "滤镜已应用": "Filter applied",
 "滤镜已应用到全部帧": "Filter applied to all frames",
 "滤镜无调整": "No filter changes",
 "请先上传图片": "Upload an image first",
 "已加载": "Loaded",
 "已还原原图": "Restored original",
 "确定还原原图？当前修改将丢失": "Restore original? Current edits will be lost",
 "没有可撤销的操作": "Nothing to undo",
 "已导出": "Exported",
 "已存入仓库": "Saved to repo",
 "导出中…": "Exporting…",
 "帧": "frames",
 "粘贴中 ": "Pasting ",
 "上传中 ": "Uploading ",
 "已上传": "Uploaded",
 "上传失败": "Upload failed",
 "文件过大": "File too large",
 "不支持此格式": "Format not supported",
 "读取失败": "Read failed",
 "图片": "Image",
 "动图": "GIF",
 "视频": "Video",
 "无损图片": "lossless",
 "体积更小": "smaller",
 "高效压缩": "efficient",
 " 以保证流畅": " for smooth playback",
 " 帧": " frame(s)",
 " 帧<br>": " frame(s)<br>",
 "GIF 编码器加载失败（需要网络）": "GIF encoder load failed (network required)",
 "GIF 编码失败": "GIF encode failed",
 "✓ 已存入仓库：": "✓ Saved to repo: ",
 "关": "off",
 "删除此层": "Delete layer",
 "动图已导入：": "GIF imported: ",
 "动图解码失败，按静态图处理": "GIF decode failed, treated as static image",
 "图片加载失败": "Image load failed",
 "图片较大，已缩放至 ": "Image too large, resized to ",
 "存仓库失败": "Save to repo failed",
 "存仓库失败：": "Save to repo failed: ",
 "存入仓库为": "Saved to repo as",
 "导出为": "Exported as",
 "导出失败": "Export failed",
 "尺寸过大，最大支持 8192×8192": "Too large, max 8192×8192",
 "已导出 ": "Exported ",
 "已撤销": "Undone",
 "已放置文字": "Text placed",
 "已裁剪 ": "Cropped ",
 "已裁剪全部帧 ": "Cropped all frames ",
 "已调整尺寸为 ": "Resized to ",
 "已还原": "Restored",
 "开": "on",
 "当前浏览器不支持视频录制": "Video recording unsupported",
 "快照失败": "Snapshot failed",
 "抽帧失败": "Frame extraction failed",
 "描边:": "Stroke: ",
 "撤销失败": "Undo failed",
 "显示此层": "Show layer",
 "正在存入仓库…": "Saving to repo…",
 "正在抽取视频帧…": "Extracting video frames…",
 "正在生成视频…": "Generating video…",
 "正在编码 GIF…": "Encoding GIF…",
 "正在编码 GIF… ": "Encoding GIF… ",
 "确定还原为原图？所有编辑将丢失": "Restore original? All edits will be lost",
 "第 ": "Frame ",
 "裁剪区域太小": "Crop area too small",
 "视频已导入：": "Video imported: ",
 "视频录制初始化失败": "Video recording init failed",
 "请先上传底图": "Upload an image first",
 "请输入文字": "Enter some text",
 "请输入有效的宽度和高度": "Enter valid width & height",
 "适应屏幕": "Fit screen",
 "隐藏此层": "Hide layer",
 "（点击选中）": "(click to select)",
 "尺寸": "Size",
 "宽": "W",
 "高": "H",
 "锁定比例": "Lock ratio",
 "缩小50%": "50%",
 "放大2×": "2×",
 "✓ 应用尺寸": "✓ Apply Size",
 "上传图片": "Upload image",
 "缩小": "Zoom out",
 "放大": "Zoom in",
 "还原原图": "Restore original",
 "存入文件仓库": "Save to repository",
 "播放": "Play",
 "播放速度": "Playback speed",
 "查看/移动": "View / Move",
 "旋转/翻转": "Rotate / Flip",
 "贴图图层": "Sticker layer",
 "调整尺寸": "Resize",
 "自定义颜色": "Custom color",
 "应用旋转到图片": "Apply rotation to image",
 "输入文字…": "Type text…"
};
applyToolLang();

  /* ===== 基础 ===== */
  var cv = document.getElementById('icv'), ctx = cv.getContext('2d');
  var wrap = document.getElementById('imgWrap'), stage = document.getElementById('stage');
  var empty = document.getElementById('empty'), fileIn = document.getElementById('fileIn');
  var cropBox = document.getElementById('cropBox'), cropInfo = document.getElementById('cropInfo');
  var textPop = document.getElementById('textPop'), txtIn = document.getElementById('txtIn');
  var toastEl = document.getElementById('toast');
  var origData = null;         /* 原始图像 dataURL（还原用） */
  var origFile = null;         /* 原始文件（视频/动图还原用） */
  var hasImg = false;
  var zoom = 1;                /* 用户缩放（相对 fit） */
  var fit = 1;                 /* 适应屏幕比例 */
  var tool = 'view';
  var hist = [];               /* 撤销栈（静态图） */
  var HIST_MAX = 12;
  /* ===== 视频/动图帧编辑 ===== */
  var srcKind = 'image';       /* image | anim | video */
  var frames = [];             /* [{cv:离屏canvas}] */
  var frameDelay = 100;        /* 每帧毫秒 */
  var curFrame = 0;
  var playing = false, playTimer = null;
  var playSpeed = 1;           /* 播放速度倍率（动图/视频通用） */
  try { var _ps = parseFloat(localStorage.getItem('ats_img_speed')); if (_ps > 0 && _ps <= 8) playSpeed = _ps; } catch (err) {}
  var ghist = [];              /* 动画组快照栈 */
  var ringPos = null;          /* 文字定位圆圈（图片坐标） */
  var brush = { color:'#ff3b30', size:6 };
  var txtSize = 0.07, txtStroke = false, textColor = '#ffffff';
  var filters = { bri:100, con:100, sat:100, blur:0 };
  var crop = { x:0, y:0, w:0, h:0 };   /* 图片坐标 */
  var pendingTextXY = null;
  function $(id){ return document.getElementById(id); }
  function toast(msg, ms){
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function(){ toastEl.classList.remove('show'); }, ms||1900);
  }
  /* ===== 显示管理：fit × zoom ===== */
  function totalScale(){ return fit * zoom; }
  function applyView(){
    var s = totalScale();
    wrap.style.width = Math.round(cv.width * s) + 'px';
    wrap.style.height = Math.round(cv.height * s) + 'px';
    cv.style.width = '100%'; cv.style.height = '100%';
    $('zPct').textContent = Math.round(s * 100) + '%';
    layoutCrop();
    if (typeof layoutSelBox === 'function') layoutSelBox();
    updateImgInfo();
  }
  function calcFit(){
    var sw = stage.clientWidth - 24, sh = stage.clientHeight - 24;
    if (sw < 60 || sh < 60) { fit = 1; return; }
    fit = Math.min(sw / cv.width, sh / cv.height, 1);
  }
  function setZoom(z, cx, cy){
    var old = totalScale();
    var st = stage;
    zoom = Math.max(0.15, Math.min(8, z));
    if (tool === 'crop') zoom = 1;
    applyView();
    if (cx != null && old > 0){  /* 以指定点为中心缩放 */
      var nx = cx * totalScale() / old, ny = cy * totalScale() / old;
      st.scrollLeft += nx - cx; st.scrollTop += ny - cy;
    }
  }
  /* ===== 上传/加载 ===== */
  $('upBtn').addEventListener('click', function(){ fileIn.click(); });
  empty.addEventListener('click', function(){ fileIn.click(); });
  fileIn.addEventListener('change', function(){ if (fileIn.files && fileIn.files[0]) loadFile(fileIn.files[0]); fileIn.value=''; });
  ['dragover','dragleave','drop'].forEach(function(ev){
    stage.addEventListener(ev, function(e){
      e.preventDefault();
      if (ev === 'drop' && e.dataTransfer.files && e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
    });
  });
  function loadFile(file, silent){
    if (!file) return;
    if (/^video\//.test(file.type)) { loadVideo(file, silent); return; }
    if (file.type === 'image/gif' || file.type === 'image/webp') { tryAnimated(file, silent); return; }
    if (!/^image\//.test(file.type)) { toast('请选择图片 / 动图 / 视频文件'); return; }
    var rd = new FileReader();
    rd.onload = function(){ loadImage(rd.result, !silent); };
    rd.readAsDataURL(file);
  }
  /* 动图尝试：ImageDecoder 解码多帧；失败或单帧则走静态 */
  function tryAnimated(file, silent){
    origFile = file;
    if (!('ImageDecoder' in window)) {
      if (file.type === 'image/gif') toast(T('当前浏览器不支持动图解码，仅编辑第一帧'), 2600);
      var rd0 = new FileReader();
      rd0.onload = function(){ loadImage(rd0.result, !silent); };
      rd0.readAsDataURL(file);
      return;
    }
    toast(T('正在解析动图…'), 1500);
    file.arrayBuffer().then(function(buf){
      var dec = new ImageDecoder({ data: buf, type: file.type });
      return dec.tracks.ready.then(function(){
        /* 解析第一帧以推进元数据（部分格式 ready 时 frameCount 仍为 0） */
        return dec.decode({ frameIndex: 0 }).then(function(first){
          var track = dec.tracks.selectedTrack;
          if (!track) throw new Error('single');
          var n = Math.min(track.frameCount || 1, 60);
          if (n <= 1) throw new Error('single');
          var jobs = [Promise.resolve({ image: first.image })], i;
          for (i = 1; i < n; i++) jobs.push(dec.decode({ frameIndex: i }));
          return Promise.all(jobs).then(function(results){
          var cvs = [], totalMs = 0;
          results.forEach(function(res){
            var img = res.image;
            var c = document.createElement('canvas');
            c.width = img.displayWidth || img.width; c.height = img.displayHeight || img.height;
            c.getContext('2d').drawImage(img, 0, 0);
            cvs.push(c);
            totalMs += (img.duration || 100000) / 1000;
            img.close();
          });
          var delay = Math.max(20, Math.round(totalMs / cvs.length));
          initFrames(cvs, delay, 'anim', !silent);
          });
        });
      });
    }).catch(function(err){
      if (String(err && err.message) === 'single') { /* 静态 webp */ }
      else toast(T('动图解码失败，按静态图处理'), 2200);
      var rd = new FileReader();
      rd.onload = function(){ loadImage(rd.result, !silent); };
      rd.readAsDataURL(file);
    });
  }
  /* 视频抽帧 */
  function loadVideo(file, silent){
    origFile = file;
    toast(T('正在抽取视频帧…'), 4000);
    var url = URL.createObjectURL(file);
    var v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
    var fail = function(msg){
      URL.revokeObjectURL(url);
      toast(msg || T('视频加载失败'), 2400);
    };
    v.onerror = function(){ fail(); };
    v.onloadedmetadata = function(){
      var dur = v.duration;
      if (!dur || !isFinite(dur)) { fail(T('无法读取视频时长')); return; }
      var vw = v.videoWidth || 640, vh = v.videoHeight || 360, MAXF = 1280;
      var k = Math.min(1, MAXF / Math.max(vw, vh));
      var w = Math.max(2, Math.round(vw * k)), h = Math.max(2, Math.round(vh * k));
      /* 采样：目标 10fps，上限 60 帧；视频过长则均匀抽 60 帧 */
      var targetFps = 10, MAX_N = 60;
      var rawN = Math.ceil(dur * targetFps);
      var n = Math.min(rawN, MAX_N);
      var step = dur / n;
      var cvs = [];
      var grab = function(idx){
        return new Promise(function(res){
          v.onseeked = function(){ res(); };
          v.currentTime = Math.min(dur - 0.01, idx * step + step / 2);
        });
      };
      var chain = Promise.resolve();
      for (var i = 0; i < n; i++) {
        (function(idx){
          chain = chain.then(function(){ return grab(idx); }).then(function(){
            var c = document.createElement('canvas'); c.width = w; c.height = h;
            c.getContext('2d').drawImage(v, 0, 0, w, h);
            cvs.push(c);
          });
        })(i);
      }
      chain.then(function(){
        URL.revokeObjectURL(url);
        initFrames(cvs, Math.round(1000 / targetFps), 'video', !silent);
      }).catch(function(){ fail(T('抽帧失败')); });
    };
  }
  /* 初始化帧编辑模式 */
  function initFrames(cvs, delay, kind, fresh){
    frames = cvs.map(function(c){ return { cv: c }; });
    frameDelay = delay; srcKind = kind; curFrame = 0;
    var f0 = frames[0].cv;
    cv.width = f0.width; cv.height = f0.height;
    ctx.drawImage(f0, 0, 0);
    if (fresh){ ghist = []; hist = []; filters = { bri:100, con:100, sat:100, blur:0 }; syncFilterUI(); }
    hasImg = true;
    empty.style.display = 'none'; wrap.style.display = '';
    document.getElementById('framesBar').classList.add('on');
    renderFramesBar();
    calcFit(); zoom = 1; applyView();
    resetOverlays();  /* 新底图：清空贴图层 */
    updateBtns();
    buildExpMenu('dl'); buildExpMenu('repo');
    if (tool !== 'view') setTool(tool);
    if (fresh) toast(kind === 'video' ? T('视频已导入：') + frames.length + T(' 帧') : T('动图已导入：') + frames.length + T(' 帧'), 2200);
  }
  function renderFramesBar(){
    var sc = document.getElementById('framesScroll');
    sc.innerHTML = '';
    frames.forEach(function(f, i){
      var b = document.createElement('button');
      b.className = 'fthumb' + (i === curFrame ? ' on' : '');
      b.title = T('第 ') + (i + 1) + T(' 帧');
      var t = document.createElement('canvas');
      t.width = 60; t.height = Math.max(1, Math.round(60 * f.height / f.width));
      t.getContext('2d').drawImage(f.cv, 0, 0, t.width, t.height);
      var lab = document.createElement('span'); lab.className = 'fi'; lab.textContent = i + 1;
      b.appendChild(t); b.appendChild(lab);
      b.addEventListener('click', function(){ stopPlay(); showFrame(i); });
      sc.appendChild(b);
    });
    var info = document.getElementById('fpsInfo');
    info.innerHTML = frames.length + T(' 帧<br>') + (1000 / frameDelay).toFixed(0) + ' fps';
  }
  function updateFpsInfo(){
    var info = document.getElementById('fpsInfo');
    if (!info || !frames.length) return;
    info.innerHTML = frames.length + T(' 帧<br>') + (1000 / frameDelay).toFixed(0) + ' fps × ' + (playSpeed < 1 ? String(playSpeed) : playSpeed) + '×';
  }
  function markThumb(){
    var sc = document.getElementById('framesScroll');
    Array.prototype.forEach.call(sc.children, function(b, i){ b.classList.toggle('on', i === curFrame); });
    var on = sc.children[curFrame];
    if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  function showFrame(i){
    if (!frames.length || playing) return;
    /* 当前画面存回帧 */
    frames[curFrame].cv.getContext('2d').clearRect(0, 0, cv.width, cv.height);
    frames[curFrame].cv.getContext('2d').drawImage(cv, 0, 0);
    curFrame = Math.max(0, Math.min(frames.length - 1, i));
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(frames[curFrame].cv, 0, 0);
    hideTextPop(); hideRing();
    markThumb();
  }
  function ensureFrameSaved(){
    if (frames.length && srcKind !== 'image'){
      frames[curFrame].cv.getContext('2d').clearRect(0, 0, cv.width, cv.height);
      frames[curFrame].cv.getContext('2d').drawImage(cv, 0, 0);
    }
  }
  function syncCvToFrame(){
    if (frames.length && srcKind !== 'image'){
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(frames[curFrame].cv, 0, 0);
    }
  }
  /* 播放 */
  function stopPlay(){
    playing = false;
    if (playTimer) { clearInterval(playTimer); playTimer = null; }
    var pb = document.getElementById('playBtn');
    if (pb) pb.textContent = '▶';
    if (frames.length && srcKind !== 'image') syncCvToFrame();
    markThumb();
  }
  function togglePlay(){
    if (!frames.length || srcKind === 'image') return;
    if (playing) { stopPlay(); return; }
    playing = true; hideTextPop(); hideRing();
    document.getElementById('playBtn').textContent = '❚❚';
    startLoop(curFrame);
  }
  /* 帧循环：统一入口（播放/变速共用） */
  function startLoop(from){
    if (playTimer) clearInterval(playTimer);
    var i = from % frames.length;
    playTimer = setInterval(function(){
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(frames[i].cv, 0, 0);
      curFrame = i;
      markThumb();
      i = (i + 1) % frames.length;
    }, Math.max(10, frameDelay / playSpeed));
  }
  /* 播放速度：0.25× ~ 4×，播放中切换立即生效 */
  function applySpeed(s){
    if (!(s > 0)) return;
    playSpeed = s;
    try { localStorage.setItem('ats_img_speed', String(s)); } catch (err) {}
    document.querySelectorAll('#speedCtl .spd').forEach(function(b){
      b.classList.toggle('on', parseFloat(b.dataset.s) === s);
    });
    if (playing) startLoop(curFrame);  /* 变速不重头，从当前帧继续 */
    updateFpsInfo();
  }
  document.querySelectorAll('#speedCtl .spd').forEach(function(b){
    b.addEventListener('click', function(){ applySpeed(parseFloat(b.dataset.s)); });
    b.classList.toggle('on', parseFloat(b.dataset.s) === playSpeed);  /* 恢复记忆的速度高亮 */
  });
  document.getElementById('playBtn').addEventListener('click', togglePlay);
  function loadImage(src, isNew){
    var im = new Image();
    im.onload = function(){
      /* 限制超大图（避免移动端崩溃）：最长边 4096 */
      var w = im.naturalWidth, h = im.naturalHeight, MAX = 4096;
      if (Math.max(w, h) > MAX) {
        var k = MAX / Math.max(w, h);
        var t = document.createElement('canvas'); t.width = Math.round(w*k); t.height = Math.round(h*k);
        t.getContext('2d').drawImage(im, 0, 0, t.width, t.height);
        im = t; w = t.width; h = t.height;
        toast(T('图片较大，已缩放至 ') + w + '×' + h + T(' 以保证流畅'), 2600);
      }
      cv.width = w; cv.height = h;
      ctx.drawImage(im, 0, 0);
      srcKind = 'image'; frames = []; curFrame = 0; cropFull();
      document.getElementById('framesBar').classList.remove('on');
      stopPlay();
      if (isNew){ origData = cv.toDataURL('image/png'); hist = []; ghist = []; updateHistBtn(); filters = { bri:100, con:100, sat:100, blur:0 }; syncFilterUI(); }
      hasImg = true;
      empty.style.display = 'none'; wrap.style.display = '';
      calcFit(); zoom = 1; applyView();
      updateBtns();
      buildExpMenu('dl'); buildExpMenu('repo');
      if (tool !== 'view') setTool(tool);  /* 刷新裁剪框等 */
      if (isNew) toast(T('已加载 ') + w + '×' + h);
    };
    im.onerror = function(){ toast(T('图片加载失败')); };
    im.src = src;
  }
  function updateBtns(){
    ['dlBtn','repoBtn','resetBtn'].forEach(function(id){ $(id).disabled = !hasImg; });
    $('undoBtn').disabled = !hasImg || (!hist.length && !ghist.length);
  }
  function updateHistBtn(){ $('undoBtn').disabled = !hasImg || (!hist.length && !ghist.length); }
  /* ===== 历史快照 ===== */
  function histMax(){   /* 大图自动减少步数，防内存溢出 */
    var px = cv.width * cv.height;
    if (px <= 1000000) return HIST_MAX;       /* ≤1MP：12 步 */
    if (px <= 4000000) return 8;              /* ≤4MP：8 步 */
    if (px <= 9000000) return 5;              /* ≤9MP：5 步 */
    return 3;                                  /* 更大：3 步 */
  }
  function pushHist(){
    if (!hasImg) return;
    try {
      if (srcKind !== 'image' && frames.length){
        /* 动画：整组快照（最多 3 组防内存） */
        ensureFrameSaved();
        ghist.push({ w: cv.width, h: cv.height, delay: frameDelay,
          urls: frames.map(function(f){ return f.cv.toDataURL('image/png'); }) });
        while (ghist.length > 3) ghist.shift();
      } else {
        hist.push(cv.toDataURL('image/png'));
        var mx = histMax();
        while (hist.length > mx) hist.shift();
      }
      updateHistBtn();
    } catch(e){ console.warn(T('快照失败'), e); }
  }
  function undo(){
    if (overlays.length) { resetOverlays(); }  /* 撤销时清除未合并贴图层 */
    if (srcKind !== 'image' && ghist.length){ undoGroup(); return; }
    if (!hist.length) { toast(T('没有可撤销的操作')); return; }
    var d = hist.pop();
    var im = new Image();
    im.onload = function(){
      cv.width = im.naturalWidth; cv.height = im.naturalHeight;
      ctx.drawImage(im, 0, 0);
      if (frames.length && srcKind !== 'image') frames[curFrame].cv.getContext('2d').drawImage(im, 0, 0), syncCvToFrame();
      calcFit(); applyView(); updateHistBtn();
      toast(T('已撤销'));
    };
    im.src = d;
  }
  function undoGroup(){
    if (!ghist.length) { toast(T('没有可撤销的操作')); return; }
    var g = ghist.pop();
    var done = 0, err = false;
    var imgs = g.urls.map(function(u){
      var im = new Image();
      im.onload = function(){
        if (err) return;
        var c = document.createElement('canvas'); c.width = g.w; c.height = g.h;
        c.getContext('2d').drawImage(im, 0, 0);
        done++;
        if (done === imgs.length){
          frames = imgs.map(function(mm, i){ return { cv: (function(){ var cc = document.createElement('canvas'); cc.width = g.w; cc.height = g.h; cc.getContext('2d').drawImage(imgs[i], 0, 0); return cc; })() }; });
          cv.width = g.w; cv.height = g.h; frameDelay = g.delay;
          ctx.clearRect(0, 0, g.w, g.h);
          ctx.drawImage(frames[Math.min(curFrame, frames.length - 1)].cv, 0, 0);
          cropFull(); calcFit(); applyView(); updateHistBtn(); renderFramesBar();
          toast(T('已撤销'));
        }
      };
      im.onerror = function(){ err = true; toast(T('撤销失败')); };
      im.src = u;
      return im;
    });
  }
  $('undoBtn').addEventListener('click', undo);
  /* ===== 视图缩放 ===== */
  $('zIn').addEventListener('click', function(){ setZoom(zoom * 1.25); });
  $('zOut').addEventListener('click', function(){ setZoom(zoom / 1.25); });
  $('zFit').addEventListener('click', function(){ calcFit(); zoom = 1; applyView(); toast(T('适应屏幕')); });
  /* ===== 工具切换 ===== */
  var tools = document.querySelectorAll('.tool');
  tools.forEach(function(b){
    b.addEventListener('click', function(){ setTool(b.getAttribute('data-t')); });
  });
  function setTool(t){
    tool = t;
    tools.forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-t') === t); });
    document.querySelectorAll('.prow').forEach(function(p){ p.classList.toggle('on', p.getAttribute('data-p') === t); });
    /* 画笔/文字光标 */
    cv.classList.toggle('paint', t === 'brush');
    cv.classList.toggle('texting', t === 'text');
    hideTextPop(); hideRing();
    if (t === 'crop'){
      if (!hasImg) { toast(T('请先上传图片')); setTool('view'); return; }
      zoom = 1; applyView();
      wrap.classList.add('crop');
      if (crop.w > 0 && crop.w <= cv.width && crop.h > 0 && crop.h <= cv.height) {} else cropFull();
      layoutCrop();
      cropBox.style.display = 'block';
    } else {
      wrap.classList.remove('crop');
      cropBox.style.display = 'none';
    }
    if (t === 'resize'){
      if (!hasImg) { toast(T('请先上传图片')); setTool('view'); return; }
      rsSyncInputs();
    }
    if (t === 'filter') previewFilter();
    else { cv.style.filter = ''; }
    /* 贴图工具：进入时快照纯底图；离开时自动合并未合并的层（防状态错乱） */
    if (t === 'overlay'){
      if (hasImg) ovSnapshot();
    } else if (overlays.length) {
      ensureMerged();
    }
  }
  /* ===== 裁剪 ===== */
  function imgToDisp(){  /* 显示坐标 = 图片坐标 × totalScale */
    return totalScale();
  }
  function dispToImg(v){ return v / totalScale(); }
  function cropFull(){ crop = { x:0, y:0, w:cv.width, h:cv.height }; }
  function layoutCrop(){
    if (tool !== 'crop' || !hasImg) return;
    var s = imgToDisp();
    cropBox.style.left = (crop.x * s) + 'px';
    cropBox.style.top = (crop.y * s) + 'px';
    cropBox.style.width = (crop.w * s) + 'px';
    cropBox.style.height = (crop.h * s) + 'px';
    cropInfo.textContent = Math.round(crop.w) + ' × ' + Math.round(crop.h);
  }
  function applyCrop(){
    var x = Math.max(0, Math.round(crop.x)), y = Math.max(0, Math.round(crop.y));
    var w = Math.min(cv.width - x, Math.round(crop.w)), h = Math.min(cv.height - y, Math.round(crop.h));
    if (w < 8 || h < 8) { toast(T('裁剪区域太小')); return; }
    pushHist();
    var cut = function(c){
      var t = document.createElement('canvas'); t.width = w; t.height = h;
      t.getContext('2d').drawImage(c, x, y, w, h, 0, 0, w, h);
      return t;
    };
    if (srcKind !== 'image' && frames.length){
      ensureFrameSaved();
      frames = frames.map(function(f){ return { cv: cut(f.cv) }; });
      ctx.clearRect(0, 0, cv.width, cv.height);
      cv.width = w; cv.height = h;
      ctx.drawImage(frames[curFrame].cv, 0, 0);
      renderFramesBar();
      toast(T('已裁剪全部帧 ') + w + ' × ' + h);
    } else {
      var t = cut(cv);
      cv.width = w; cv.height = h;
      ctx.drawImage(t, 0, 0);
      toast(T('已裁剪 ') + w + ' × ' + h);
    }
    cropFull(); calcFit(); applyView();
    setTool('view');
  }
  $('cropApply').addEventListener('click', applyCrop);
  $('cropFull').addEventListener('click', function(){ cropFull(); layoutCrop(); });
  /* 裁剪框拖动（pointer events，边角/内部） */
  var cdrag = null;
  cropBox.addEventListener('pointerdown', function(e){
    if (tool !== 'crop') return;
    e.preventDefault(); e.stopPropagation();
    var h = e.target.getAttribute && e.target.getAttribute('data-h');
    cdrag = { mode: h || 'move', sx: e.clientX, sy: e.clientY, c: { x:crop.x, y:crop.y, w:crop.w, h:crop.h } };
    try { cropBox.setPointerCapture(e.pointerId); } catch(err) {}
  });
  window.addEventListener('pointermove', function(e){
    if (!cdrag) return;
    var dx = dispToImg(e.clientX - cdrag.sx), dy = dispToImg(e.clientY - cdrag.sy);
    var c = cdrag.c, m = cdrag.mode, W = cv.width, H = cv.height;
    var x=c.x, y=c.y, w=c.w, h=c.h;
    if (m === 'move'){
      x = Math.min(Math.max(0, c.x + dx), W - c.w);
      y = Math.min(Math.max(0, c.y + dy), H - c.h);
    } else {
      if (m.indexOf('w') >= 0){ x = Math.min(Math.max(0, c.x + dx), c.x + c.w - 24); w = c.w + (c.x - x); }
      if (m.indexOf('e') >= 0){ w = Math.min(Math.max(24, c.w + dx), W - c.x); }
      if (m.indexOf('n') >= 0){ y = Math.min(Math.max(0, c.y + dy), c.y + c.h - 24); h = c.h + (c.y - y); }
      if (m.indexOf('s') >= 0){ h = Math.min(Math.max(24, c.h + dy), H - c.y); }
    }
    crop = { x:x, y:y, w:w, h:h };
    layoutCrop();
  });
  window.addEventListener('pointerup', function(){ cdrag = null; });
  /* ===== 尺寸调整（缩放图片像素，支持动图全帧）===== */
  var rsRatio = 1;
  function rsSyncInputs(){
    if (!hasImg) return;
    $('rsW').value = cv.width;
    $('rsH').value = cv.height;
    rsRatio = cv.height > 0 ? cv.width / cv.height : 1;
  }
  function rsSyncFromW(){
    if (!hasImg || !$('rsLock').checked) return;
    var w = Math.max(1, Math.round(+$('rsW').value || 0));
    $('rsH').value = Math.max(1, Math.round(w / rsRatio));
  }
  function rsSyncFromH(){
    if (!hasImg || !$('rsLock').checked) return;
    var h = Math.max(1, Math.round(+$('rsH').value || 0));
    $('rsW').value = Math.max(1, Math.round(h * rsRatio));
  }
  $('rsW').addEventListener('input', rsSyncFromW);
  $('rsH').addEventListener('input', rsSyncFromH);
  function resizeTo(w, h){
    if (!hasImg){ toast(T('请先上传图片')); setTool('view'); return; }
    w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
    if (w > 8192 || h > 8192){ toast(T('尺寸过大，最大支持 8192×8192')); return; }
    pushHist();
    var t = document.createElement('canvas'); t.width = w; t.height = h;
    var tc = t.getContext('2d');
    tc.imageSmoothingEnabled = true;
    if (srcKind !== 'image' && frames.length){
      ensureFrameSaved();
      frames.forEach(function(f){
        var fc = document.createElement('canvas'); fc.width = w; fc.height = h;
        fc.getContext('2d').drawImage(f.cv, 0, 0, w, h);
        f.cv = fc;
      });
      cv.width = w; cv.height = h;
      ctx.drawImage(frames[curFrame].cv, 0, 0);
    } else {
      tc.drawImage(cv, 0, 0, w, h);
      cv.width = w; cv.height = h;
      ctx.drawImage(t, 0, 0);
    }
    cropFull(); calcFit(); applyView();
    toast(T('已调整尺寸为 ') + w + '×' + h);
  }
  $('rsApply').addEventListener('click', function(){
    var w = Math.round(+$('rsW').value || 0), h = Math.round(+$('rsH').value || 0);
    if (!w || !h){ toast(T('请输入有效的宽度和高度')); return; }
    resizeTo(w, h);
  });
  $('rsHalf').addEventListener('click', function(){
    if (!hasImg) return;
    resizeTo(Math.max(1, Math.round(cv.width / 2)), Math.max(1, Math.round(cv.height / 2)));
  });
  $('rsDouble').addEventListener('click', function(){
    if (!hasImg) return;
    resizeTo(Math.min(8192, cv.width * 2), Math.min(8192, cv.height * 2));
  });
  /* 图片信息：实时尺寸（显示在查看工具参数行） */
  function updateImgInfo(){
    var el = $('imgInfo');
    if (el) el.textContent = hasImg ? (cv.width + ' × ' + cv.height) : '';
  }
  /* ===== 画笔 ===== */
  document.querySelectorAll('.swatch').forEach(function(s){
    s.addEventListener('click', function(){
      document.querySelectorAll('.swatch').forEach(function(x){ x.classList.remove('on'); });
      s.classList.add('on');
      brush.color = s.getAttribute('data-c');
      $('brushColor').value = brush.color;
    });
  });
  $('brushColor').addEventListener('input', function(){
    brush.color = this.value;
    document.querySelectorAll('.swatch').forEach(function(x){ x.classList.remove('on'); });
  });
  $('brushSize').addEventListener('input', function(){
    brush.size = +this.value;
    $('brushSizeV').textContent = this.value;
  });
  var drawing = false, last = null, cvRectCache = null;
  function cacheCvRect(){ cvRectCache = cv.getBoundingClientRect(); }
  function evImgXY(e){
    var r = cvRectCache || cv.getBoundingClientRect();
    return { x:(e.clientX - r.left) * (cv.width / r.width), y:(e.clientY - r.top) * (cv.height / r.height) };
  }
  cv.addEventListener('pointerdown', function(e){
    if (!hasImg || playing) return;
    if (tool === 'brush'){
      e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch(err) {}
      cacheCvRect();          /* 拖动期间 rect 固定，缓存避免高频强制重排 */
      drawing = true; last = evImgXY(e);
      pushHist();
      dot(last.x, last.y);
    } else if (tool === 'text'){
      e.preventDefault();
      cacheCvRect();
      pendingTextXY = evImgXY(e);
      showRing(pendingTextXY);
      showTextPop();
    }
  });
  cv.addEventListener('pointermove', function(e){
    if (!drawing) return;
    var p = evImgXY(e);
    line(last, p); last = p;
  });
  window.addEventListener('pointerup', function(){ drawing = false; last = null; });
  function dot(x, y){
    ctx.fillStyle = brush.color;
    ctx.beginPath();
    ctx.arc(x, y, brush.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  function line(a, b){
    ctx.strokeStyle = brush.color;
    ctx.lineWidth = brush.size;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(a.x, a.y, mx, my);
    ctx.quadraticCurveTo(mx, my, b.x, b.y);
    ctx.stroke();
  }
  /* ===== 文字 ===== */
  document.querySelectorAll('#txtSize button').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('#txtSize button').forEach(function(x){ x.classList.remove('on'); });
      b.classList.add('on');
      txtSize = +b.getAttribute('data-s');
    });
  });
  $('tColor').addEventListener('input', function(){ textColor = this.value; });
  $('tStroke').addEventListener('click', function(){
    txtStroke = !txtStroke;
    this.textContent = T('描边:') + (txtStroke ? T('开') : T('关'));
  });
  function showTextPop(){ textPop.style.display = 'block'; txtIn.value = ''; setTimeout(function(){ txtIn.focus(); }, 60); }
  function hideTextPop(){ textPop.style.display = 'none'; pendingTextXY = null; }
  /* 定位圆圈（图片坐标 → wrap 显示坐标） */
  var posRing = document.getElementById('posRing');
  function showRing(imgXY){
    ringPos = imgXY;
    var s = totalScale();
    posRing.style.left = (imgXY.x * s) + 'px';
    posRing.style.top = (imgXY.y * s) + 'px';
    posRing.style.display = 'block';
  }
  function hideRing(){ posRing.style.display = 'none'; }
  $('txtCx').addEventListener('click', function(){ hideTextPop(); hideRing(); });
  $('txtOk').addEventListener('click', placeText);
  txtIn.addEventListener('keydown', function(e){ if (e.key === 'Enter') placeText(); });
  function placeText(){
    var v = txtIn.value.trim();
    if (!ringPos) { hideTextPop(); hideRing(); return; }
    if (!v) { toast(T('请输入文字')); return; }
    pushHist();
    var px = ringPos.x, py = ringPos.y;
    var fs = Math.max(12, Math.round(cv.width * txtSize));
    ctx.font = '700 ' + fs + 'px ZtFont, system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = fs * 0.06; ctx.shadowOffsetY = 1;
    if (txtStroke){
      ctx.lineWidth = Math.max(2, fs * 0.08);
      ctx.strokeStyle = 'rgba(0,0,0,.55)';
      ctx.strokeText(v, px, py);
    }
    ctx.fillStyle = textColor;
    ctx.fillText(v, px, py);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    toast(T('已放置文字'));
    hideTextPop(); hideRing();
    setTool('view');
  }
  /* ===== 滤镜 ===== */
  var filterDefs = [['fBri','bri','fBriV'],['fCon','con','fConV'],['fSat','sat','fSatV'],['fBlur','blur','fBlurV']];
  filterDefs.forEach(function(d){
    $(d[0]).addEventListener('input', function(){
      filters[d[1]] = +this.value;
      $(d[2]).textContent = this.value;
      previewFilter();
    });
  });
  function filterStr(){
    var f = filters;
    return 'brightness(' + (f.bri/100) + ') contrast(' + (f.con/100) + ') saturate(' + (f.sat/100) + ')' + (f.blur > 0 ? ' blur(' + f.blur + 'px)' : '');
  }
  function previewFilter(){ cv.style.filter = filterStr(); }
  function syncFilterUI(){
    $('fBri').value = filters.bri; $('fBriV').textContent = filters.bri;
    $('fCon').value = filters.con; $('fConV').textContent = filters.con;
    $('fSat').value = filters.sat; $('fSatV').textContent = filters.sat;
    $('fBlur').value = filters.blur; $('fBlurV').textContent = filters.blur;
  }
  $('fReset').addEventListener('click', function(){
    filters = { bri:100, con:100, sat:100, blur:0 };
    syncFilterUI(); previewFilter();
  });
  $('fApply').addEventListener('click', function(){
    if (!hasImg) return;
    if (overlays.length) { ensureMerged(); }  /* 动图滤镜需作用含层帧 */
    var s = filterStr();
    if (s === 'brightness(1) contrast(1) saturate(1)') { toast(T('滤镜无调整')); return; }
    pushHist();
    var applyOne = function(c){
      var cx = c.getContext('2d');
      var t = document.createElement('canvas'); t.width = c.width; t.height = c.height;
      t.getContext('2d').drawImage(c, 0, 0);
      cx.clearRect(0, 0, c.width, c.height);
      cx.filter = s;
      cx.drawImage(t, 0, 0);
      cx.filter = 'none';
    };
    if (srcKind !== 'image' && frames.length){
      ensureFrameSaved();
      frames.forEach(function(f){ applyOne(f.cv); });
      syncCvToFrame();
    } else {
      applyOne(cv);
    }
    cv.style.filter = '';
    filters = { bri:100, con:100, sat:100, blur:0 };
    syncFilterUI();
    toast(srcKind !== 'image' ? T('滤镜已应用到全部帧') : T('滤镜已应用'));
  });
  /* ===== 变换（旋转/翻转） ===== */
  function transformCanvas(fn){
    if (!hasImg) return;
    if (overlays.length) { ensureMerged(); }  /* 变换前合并贴图，防丢层 */
    pushHist();
    var xform = function(c){
      var t = document.createElement('canvas'); t.width = c.width; t.height = c.height;
      t.getContext('2d').drawImage(c, 0, 0);
      var nw = fn.w(t), nh = fn.h(t);
      var nc = document.createElement('canvas'); nc.width = nw; nc.height = nh;
      var ncx = nc.getContext('2d');
      ncx.save();
      fn.draw(ncx, t, nw, nh);
      ncx.restore();
      return nc;
    };
    if (srcKind !== 'image' && frames.length){
      ensureFrameSaved();
      frames = frames.map(function(f){ return { cv: xform(f.cv) }; });
      var cur = frames[curFrame].cv;
      cv.width = cur.width; cv.height = cur.height;
      ctx.drawImage(cur, 0, 0);
      renderFramesBar();
    } else {
      var t = document.createElement('canvas'); t.width = cv.width; t.height = cv.height;
      t.getContext('2d').drawImage(cv, 0, 0);
      var nw = fn.w(t), nh = fn.h(t);
      cv.width = nw; cv.height = nh;
      ctx.save();
      fn.draw(ctx, t, nw, nh);
      ctx.restore();
    }
    cropFull(); calcFit(); applyView();
  }
  $('rotR').addEventListener('click', function(){
    transformCanvas({ w:function(t){ return t.height; }, h:function(t){ return t.width; },
      draw:function(c, t, w, h){ c.translate(w, 0); c.rotate(Math.PI/2); c.drawImage(t, 0, 0); } });
    toast(T('已右转 90°'));
  });
  $('rotL').addEventListener('click', function(){
    transformCanvas({ w:function(t){ return t.height; }, h:function(t){ return t.width; },
      draw:function(c, t, w, h){ c.translate(0, h); c.rotate(-Math.PI/2); c.drawImage(t, 0, 0); } });
    toast(T('已左转 90°'));
  });
  $('flipH').addEventListener('click', function(){
    transformCanvas({ w:function(t){ return t.width; }, h:function(t){ return t.height; },
      draw:function(c, t, w, h){ c.translate(w, 0); c.scale(-1, 1); c.drawImage(t, 0, 0); } });
    toast(T('已水平翻转'));
  });
  $('flipV').addEventListener('click', function(){
    transformCanvas({ w:function(t){ return t.width; }, h:function(t){ return t.height; },
      draw:function(c, t, w, h){ c.translate(0, h); c.scale(1, -1); c.drawImage(t, 0, 0); } });
    toast(T('已垂直翻转'));
  });
  /* ===== 自由旋转（可视化：拖动实时预览，应用才生效）===== */
  var rotPreview = 0, rotBackup = null;
  var rotFree = $('rotFree'), rotFreeV = $('rotFreeV');
  function rotBBox(w, h, r){
    var c = Math.abs(Math.cos(r)), s = Math.abs(Math.sin(r));
    return { w: Math.max(1, Math.round(Math.abs(w * c) + Math.abs(h * s))),
             h: Math.max(1, Math.round(Math.abs(w * s) + Math.abs(h * c))) };
  }
  function snapshotCv(){
    var b = document.createElement('canvas');
    b.width = cv.width; b.height = cv.height;
    b.getContext('2d').drawImage(cv, 0, 0);
    return b;
  }
  /* 拖动中：实时把旋转结果画上主画布（原图保留在 rotBackup） */
  function drawRotPreview(){
    if (!rotBackup) rotBackup = snapshotCv();
    var r = rotPreview * Math.PI / 180;
    var bw = rotBackup.width, bh = rotBackup.height;
    var bb = rotBBox(bw, bh, r);
    cv.width = bb.w; cv.height = bb.h;
    ctx.save();
    ctx.translate(bb.w / 2, bb.h / 2);
    ctx.rotate(r);
    ctx.drawImage(rotBackup, -bw / 2, -bh / 2);
    ctx.restore();
  }
  /* 取消预览：恢复原图 */
  function cancelRotPreview(){
    if (rotBackup){
      cv.width = rotBackup.width; cv.height = rotBackup.height;
      ctx.drawImage(rotBackup, 0, 0);
    }
    rotBackup = null; rotPreview = 0;
    rotFree.value = 0; rotFreeV.textContent = '0°';
    calcFit(); zoom = 1; applyView();
  }
  /* 应用：恢复原图后走统一变换管线（动图全帧生效，计入撤销栈） */
  $('rotApply').addEventListener('click', function(){
    if (!hasImg) { toast(T('请先上传图片')); return; }
    if (!rotPreview) { toast(T('先拖动滑条预览角度')); return; }
    var r = rotPreview * Math.PI / 180;
    cancelRotPreview();
    transformCanvas({
      w: function(t){ return rotBBox(t.width, t.height, r).w; },
      h: function(t){ return rotBBox(t.width, t.height, r).h; },
      draw: function(c, t, w, h){ c.translate(w / 2, h / 2); c.rotate(r); c.drawImage(t, -t.width / 2, -t.height / 2); }
    });
    toast(T('已旋转 ') + Math.round(r * 180 / Math.PI) + '°');
  });
  rotFree.addEventListener('input', function(){
    if (!hasImg) { rotFree.value = 0; toast(T('请先上传图片')); return; }
    rotPreview = +rotFree.value;
    rotFreeV.textContent = rotPreview + '°';
    drawRotPreview();
  });
  rotFree.addEventListener('change', function(){
    if (rotPreview){ calcFit(); zoom = 1; applyView(); }  /* 拖完适配视图 */
  });
  /* ===== 贴图图层：导入图片叠加在画面上，逐层调透明度/缩放/位置 ===== */
  var overlays = [];           /* [{cv,x,y,scale,alpha,visible,name}] 坐标为图片像素 */
  var selLayer = -1, ovDrag = null, ovBackup = null;
  var selBox = document.getElementById('selBox');
  var ovFile = $('ovFile');
  function ovCtx(c){ return c.getContext('2d'); }
  /* 进入贴图工具时的纯底图快照（用于实时重绘与合并前还原） */
  function ovSnapshot(){
    ovBackup = document.createElement('canvas');
    ovBackup.width = cv.width; ovBackup.height = cv.height;
    ovCtx(ovBackup).drawImage(cv, 0, 0);
  }
  function drawLayersOn(c2, w, h){
    overlays.forEach(function(o){
      if (!o.visible) return;
      var lw = o.cv.width * o.scale, lh = o.cv.height * o.scale;
      var ox = o.x * w / cv.width, oy = o.y * h / cv.height;  /* 帧尺寸不同按比例映射 */
      c2.save();
      c2.globalAlpha = o.alpha;
      c2.drawImage(o.cv, ox - lw / 2, oy - lh / 2, lw, lh);
      c2.restore();
    });
  }
  /* 实时预览：从纯底图重绘 + 全部可见层 */
  function redrawOverlays(){
    if (!ovBackup) return;
    cv.width = ovBackup.width; cv.height = ovBackup.height;
    ctx.drawImage(ovBackup, 0, 0);
    drawLayersOn(ctx, cv.width, cv.height);
    layoutSelBox();
  }
  function layoutSelBox(){
    if (selLayer < 0 || !overlays[selLayer] || tool !== 'overlay'){ selBox.style.display = 'none'; return; }
    var o = overlays[selLayer];
    var rect = cv.getBoundingClientRect();
    var wrapRect = imgWrap.getBoundingClientRect();
    var k = rect.width / cv.width;
    var lw = o.cv.width * o.scale * k, lh = o.cv.height * o.scale * k;
    selBox.style.display = 'block';
    selBox.style.left = (rect.left - wrapRect.left + (o.x * k) - lw / 2) + 'px';
    selBox.style.top = (rect.top - wrapRect.top + (o.y * k) - lh / 2) + 'px';
    selBox.style.width = lw + 'px';
    selBox.style.height = lh + 'px';
  }
  function refreshOverlayUI(){
    var merge = $('ovMerge'), clear = $('ovClear');
    merge.disabled = !overlays.length;
    clear.disabled = !overlays.length;
    $('ovHint').style.display = overlays.length ? 'none' : '';
    var list = $('ovList');
    list.innerHTML = '';
    overlays.forEach(function(o, i){
      var d = document.createElement('div');
      d.className = 'ovly' + (i === selLayer ? ' on' : '') + (o.visible ? '' : ' hid');
      var t = document.createElement('canvas');
      var k = Math.min(1, 36 / o.cv.height);
      t.width = Math.max(1, Math.round(o.cv.width * k)); t.height = 36;
      t.getContext('2d').drawImage(o.cv, 0, 0, t.width, t.height);
      t.title = o.name + T('（点击选中）');
      d.appendChild(t);
      var eye = document.createElement('button');
      eye.className = 'oeye'; eye.textContent = o.visible ? '👁' : '·';
      eye.title = o.visible ? T('隐藏此层') : T('显示此层');
      eye.addEventListener('click', function(e){
        e.stopPropagation();
        o.visible = !o.visible;
        redrawOverlays(); refreshOverlayUI();
      });
      d.appendChild(eye);
      var x = document.createElement('button');
      x.className = 'ox'; x.textContent = '✕'; x.title = T('删除此层');
      x.addEventListener('click', function(e){
        e.stopPropagation();
        overlays.splice(i, 1);
        if (selLayer === i) selLayer = -1; else if (selLayer > i) selLayer--;
        redrawOverlays(); refreshOverlayUI();
      });
      d.appendChild(x);
      d.addEventListener('click', function(){ selLayer = i; syncOvCtl(); refreshOverlayUI(); layoutSelBox(); });
      list.appendChild(d);
    });
    syncOvCtl();
  }
  function syncOvCtl(){
    var ctl = $('ovCtl');
    if (selLayer < 0 || !overlays[selLayer]){ ctl.style.display = 'none'; selBox.style.display = 'none'; return; }
    var o = overlays[selLayer];
    ctl.style.display = '';
    $('ovAlpha').value = Math.round(o.alpha * 100);
    $('ovAlphaV').textContent = Math.round(o.alpha * 100) + '%';
    $('ovScale').value = Math.round(o.scale * 100);
    $('ovScaleV').textContent = Math.round(o.scale * 100) + '%';
  }
  $('ovAdd').addEventListener('click', function(){ if (!hasImg){ toast(T('请先上传底图')); return; } ovFile.click(); });
  ovFile.addEventListener('change', function(){
    var files = Array.prototype.slice.call(ovFile.files || []);
    ovFile.value = '';
    if (!files.length) return;
    if (!hasImg){ toast(T('请先上传底图')); return; }
    if (!overlays.length) ovSnapshot();
    var loaded = 0;
    files.forEach(function(f){
      var url = URL.createObjectURL(f);
      var im = new Image();
      im.onload = function(){
        URL.revokeObjectURL(url);
        var c = document.createElement('canvas');
        c.width = im.naturalWidth; c.height = im.naturalHeight;
        c.getContext('2d').drawImage(im, 0, 0);
        var fit = Math.min(1, (cv.width * 0.5) / c.width, (cv.height * 0.5) / c.height);
        overlays.push({ cv: c, x: cv.width / 2, y: cv.height / 2, scale: fit,
          alpha: 1, visible: true, name: f.name || (T('贴图') + (overlays.length + 1)) });
        selLayer = overlays.length - 1;
        loaded++;
        redrawOverlays(); refreshOverlayUI();
        if (loaded === files.length) toast(T('已导入 ') + loaded + T(' 张贴图，拖动调整位置'), 2000);
      };
      im.onerror = function(){ URL.revokeObjectURL(url); loaded++; };
      im.src = url;
    });
  });
  $('ovAlpha').addEventListener('input', function(){
    if (selLayer < 0 || !overlays[selLayer]) return;
    overlays[selLayer].alpha = +this.value / 100;
    $('ovAlphaV').textContent = this.value + '%';
    redrawOverlays();
  });
  $('ovScale').addEventListener('input', function(){
    if (selLayer < 0 || !overlays[selLayer]) return;
    overlays[selLayer].scale = +this.value / 100;
    $('ovScaleV').textContent = this.value + '%';
    redrawOverlays();
  });
  $('ovDel').addEventListener('click', function(){
    if (selLayer < 0 || !overlays[selLayer]) return;
    overlays.splice(selLayer, 1);
    selLayer = -1;
    redrawOverlays(); refreshOverlayUI();
  });
  $('ovMerge').addEventListener('click', mergeOverlays);
  $('ovClear').addEventListener('click', function(){
    if (!overlays.length) return;
    overlays = []; selLayer = -1;
    redrawOverlays(); refreshOverlayUI();
    toast(T('已清空全部贴图'));
  });
  /* 画布拖动贴图：命中检测自顶层向下 */
  cv.addEventListener('pointerdown', function(e){
    if (tool !== 'overlay' || !overlays.length || playing) return;
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    var rect = cv.getBoundingClientRect();
    var ix = (e.clientX - rect.left) / rect.width * cv.width;
    var iy = (e.clientY - rect.top) / rect.height * cv.height;
    var hit = -1;
    for (var i = overlays.length - 1; i >= 0; i--){
      var o = overlays[i];
      if (!o.visible) continue;
      var hw = o.cv.width * o.scale / 2, hh = o.cv.height * o.scale / 2;
      if (ix >= o.x - hw && ix <= o.x + hw && iy >= o.y - hh && iy <= o.y + hh){ hit = i; break; }
    }
    selLayer = hit;
    refreshOverlayUI();
    if (hit < 0) return;
    ovDrag = { ix: ix, iy: iy, ox: overlays[hit].x, oy: overlays[hit].y };
  });
  window.addEventListener('pointermove', function(e){
    if (!ovDrag || !overlays[selLayer]) return;
    var rect = cv.getBoundingClientRect();
    var ix = (e.clientX - rect.left) / rect.width * cv.width;
    var iy = (e.clientY - rect.top) / rect.height * cv.height;
    overlays[selLayer].x = ovDrag.ox + (ix - ovDrag.ix);
    overlays[selLayer].y = ovDrag.oy + (iy - ovDrag.iy);
    redrawOverlays();
  });
  window.addEventListener('pointerup', function(){
    if (ovDrag){ ovDrag = null; refreshOverlayUI(); }
  });
  /* 合并：还原底图 → 记入撤销栈 → 写入像素（动图全帧生效） */
  function mergeOverlays(){
    if (!overlays.length) return;
    if (!ovBackup) ovSnapshot();
    cv.width = ovBackup.width; cv.height = ovBackup.height;
    ctx.drawImage(ovBackup, 0, 0);
    pushHist();
    if (srcKind !== 'image' && frames.length){
      ensureFrameSaved();
      frames.forEach(function(f){ drawLayersOn(ovCtx(f.cv), f.cv.width, f.cv.height); });
      var cur = frames[curFrame].cv;
      cv.width = cur.width; cv.height = cur.height;
      ctx.drawImage(cur, 0, 0);
    } else {
      drawLayersOn(ctx, cv.width, cv.height);
    }
    var n = overlays.length;
    overlays = []; selLayer = -1; ovBackup = null;
    refreshOverlayUI(); selBox.style.display = 'none';
    updateBtns();
    toast(T('已合并 ') + n + T(' 个贴图层'));
  }
  function ensureMerged(){ if (overlays.length) mergeOverlays(); }
  function resetOverlays(){
    overlays = []; selLayer = -1; ovBackup = null; ovDrag = null;
    refreshOverlayUI(); selBox.style.display = 'none';
  }
  /* ===== 导出系统：格式转换 ===== */
  var EXP_FMT = {
    png:  { ext:'png',  mime:'image/png',   label:'PNG',  desc:T('无损图片') },
    jpg:  { ext:'jpg',  mime:'image/jpeg',  label:'JPG',  desc:T('体积更小') },
    webp: { ext:'webp', mime:'image/webp',  label:'WebP', desc:T('高效压缩') },
    gif:  { ext:'gif',  mime:'image/gif',   label:'GIF',  desc:T('动图') },
    webm: { ext:'webm', mime:'video/webm',  label:'WEBM', desc:T('视频') }
  };
  function exportTargets(){
    if (srcKind === 'video') return ['webm', 'gif'];
    if (srcKind === 'anim')  return ['gif', 'webm'];
    return ['png', 'jpg', 'webp'];
  }
  function exportName(fmt){
    var d = new Date(), p = function(n){ return (n<10?'0':'')+n; };
    return 'edited_' + d.getFullYear() + p(d.getMonth()+1) + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) + '.' + EXP_FMT[fmt].ext;
  }
  function buildExpMenu(mode){
    var menu = $(mode === 'dl' ? 'expMenu' : 'expMenuRepo');
    if (!menu) return;
    var ts = exportTargets();
    var head = mode === 'dl' ? T('导出为') : T('存入仓库为');
    var html = '<div class="eh">' + head + '</div>';
    ts.forEach(function(fmt){
      var f = EXP_FMT[fmt];
      html += '<button data-f="' + fmt + '"><b>' + f.label + '</b><span>' + f.desc + '</span><small>.' + f.ext + '</small></button>';
    });
    menu.innerHTML = html;
    Array.prototype.forEach.call(menu.querySelectorAll('button'), function(b){
      b.addEventListener('click', function(){
        menu.classList.remove('on');
        doExport(b.getAttribute('data-f'), mode);
      });
    });
  }
  function ensureCurrentSaved(){ ensureFrameSaved(); }
  function doExport(fmt, mode){
    if (!hasImg) return;
    stopPlay();
    if (overlays.length) { ensureMerged(); }  /* 导出前合并贴图层 */
    ensureCurrentSaved();
    if (fmt === 'png' || fmt === 'jpg' || fmt === 'webp'){
      var q = fmt === 'jpg' ? 0.92 : 1;
      cv.toBlob(function(blob){ deliver(blob, fmt, mode); }, EXP_FMT[fmt].mime, q);
    } else if (fmt === 'gif'){
      encodeGIF(function(blob){ deliver(blob, fmt, mode); });
    } else if (fmt === 'webm'){
      recordWebM(function(blob){ deliver(blob, fmt, mode); });
    }
  }
  function deliver(blob, fmt, mode){
    if (!blob) { toast(T('导出失败')); return; }
    var name = exportName(fmt);
    if (mode === 'repo'){
      var btn = $('repoBtn'); btn.disabled = true;
      toast(T('正在存入仓库…'), 1500);
      var onAck = function(e){
        var d = e.data;
        if (!d || !d.__repoSaveAck) return;
        window.removeEventListener('message', onAck);
        btn.disabled = false;
        toast(d.__repoSaveAck ? T('✓ 已存入仓库：') + d.msg : T('存仓库失败：') + d.msg, 2600);
      };
      window.addEventListener('message', onAck);
      try { parent.postMessage({ __repoSave:true, blob:blob, name:name }, '*'); }
      catch(err){ window.removeEventListener('message', onAck); btn.disabled = false; toast(T('存仓库失败')); }
      setTimeout(function(){ window.removeEventListener('message', onAck); btn.disabled = false; }, 20000);
    } else {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){ URL.revokeObjectURL(a.href); }, 8000);
      toast(T('已导出 ') + EXP_FMT[fmt].label + '（' + (blob.size > 1048576 ? (blob.size/1048576).toFixed(1) + ' MB' : Math.round(blob.size/1024) + ' KB') + '）');
    }
  }
  /* GIF 编码（gif.js CDN + worker blob；失败提示） */
  function encodeGIF(cb){
    toast(T('正在编码 GIF…'), 4000);
    ensureFrameSaved();
    var w = cv.width, h = cv.height;
    var finish = function(){
      try {
        fetch('https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js')
          .then(function(r){ return r.text(); })
          .then(function(t){
            var wurl = URL.createObjectURL(new Blob([t], { type:'application/javascript' }));
            var gif = new GIF({ workers: 2, quality: 10, width: w, height: h, workerScript: wurl });
            frames.forEach(function(f){ gif.addFrame(f.cv, { delay: frameDelay, copy: true }); });
            gif.on('progress', function(p){
              toast(T('正在编码 GIF… ') + Math.round(p * 100) + '%', 800);
            });
            gif.on('finished', function(blob){
              URL.revokeObjectURL(wurl);
              cb(blob);
            });
            gif.render();
          })
          .catch(function(){ toast(T('GIF 编码器加载失败（需要网络）'), 3000); });
      } catch(e){ toast(T('GIF 编码失败'), 2400); }
    };
    if (window.GIF) { finish(); return; }
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js';
    s.onload = finish;
    s.onerror = function(){ toast(T('GIF 编码器加载失败（需要网络）'), 3000); };
    document.head.appendChild(s);
  }
  /* WebM 视频录制（captureStream + MediaRecorder） */
  function recordWebM(cb){
    if (typeof MediaRecorder === 'undefined') { toast(T('当前浏览器不支持视频录制')); return; }
    toast(T('正在生成视频…'), 4000);
    ensureFrameSaved();
    var out = document.createElement('canvas');
    out.width = cv.width; out.height = cv.height;
    var octx = out.getContext('2d');
    var stream = out.captureStream(0);
    var track = stream.getVideoTracks()[0];
    var mime = '';
    ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].forEach(function(m){
      if (!mime && MediaRecorder.isTypeSupported(m)) mime = m;
    });
    var rec;
    try { rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); }
    catch(e){ toast(T('视频录制初始化失败')); return; }
    var chunks = [];
    rec.ondataavailable = function(e){ if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = function(){ cb(new Blob(chunks, { type:'video/webm' })); };
    rec.start();
    var i = 0;
    (function next(){
      if (!frames.length) return;
      if (i >= frames.length) {
        setTimeout(function(){ rec.stop(); }, 150);
        return;
      }
      octx.drawImage(frames[i].cv, 0, 0);
      if (track.requestFrame) track.requestFrame();
      i++;
      setTimeout(next, frameDelay);
    })();
  }
  $('dlBtn').addEventListener('click', function(e){
    e.stopPropagation();
    if (!hasImg) return;
    buildExpMenu('dl');
    var m = $('expMenu'); m.classList.toggle('on');
    $('expMenuRepo').classList.remove('on');
  });
  $('repoBtn').addEventListener('click', function(e){
    e.stopPropagation();
    if (!hasImg) return;
    buildExpMenu('repo');
    var m = $('expMenuRepo'); m.classList.toggle('on');
    $('expMenu').classList.remove('on');
  });
  document.addEventListener('click', function(e){
    var t = e.target;
    if (!t.closest || (!t.closest('.exp-wrap'))) {
      var a = $('expMenu'), b = $('expMenuRepo');
      if (a) a.classList.remove('on');
      if (b) b.classList.remove('on');
    }
  });
  /* ===== 内嵌确认弹窗（替代原生 confirm，样式与主题一致）===== */
  function embeddedConfirm(msg) {
    return new Promise(function (resolve) {
      var ov = document.createElement('div');
      ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center;';
      var box = document.createElement('div');
      box.style.cssText = 'background:#252526;color:#ddd;border-radius:12px;padding:22px 24px;max-width:82%;text-align:center;font-size:14px;box-shadow:0 12px 40px rgba(0,0,0,.5);';
      var txt = document.createElement('div');
      txt.style.cssText = 'margin-bottom:16px;word-break:break-word;line-height:1.6;';
      txt.textContent = msg;
      var row = document.createElement('div');
      var okB = document.createElement('button');
      okB.textContent = T('确定');
      okB.style.cssText = 'margin:0 6px;padding:8px 24px;border:none;border-radius:8px;background:#f44336;color:#fff;cursor:pointer;font-size:14px;';
      var cB = document.createElement('button');
      cB.textContent = T('取消');
      cB.style.cssText = 'margin:0 6px;padding:8px 24px;border:none;border-radius:8px;background:#3a3a3a;color:#ddd;cursor:pointer;font-size:14px;';
      okB.addEventListener('click', function () { document.body.removeChild(ov); resolve(true); });
      cB.addEventListener('click', function () { document.body.removeChild(ov); resolve(false); });
      row.appendChild(cB); row.appendChild(okB);
      box.appendChild(txt); box.appendChild(row); ov.appendChild(box);
      document.body.appendChild(ov);
    });
  }
  /* ===== 还原 ===== */
  $('resetBtn').addEventListener('click', async function(){
    if (!origData && !origFile) return;
    if (!(await embeddedConfirm(T('确定还原为原图？所有编辑将丢失')))) return;
    stopPlay();
    if (origFile) { loadFile(origFile, false); }
    else if (origData) { loadImage(origData, false); }
    toast(T('已还原'));
  });
  /* 调试钩子（导出内部状态） */
  window.__imgDbg = function(){ return { tool:tool, drawing:drawing, hasImg:hasImg, zoom:zoom, fit:fit, brush:brush, histN:hist.length, ghistN:ghist.length, srcKind:srcKind, nFrames:frames.length, curFrame:curFrame, delay:frameDelay, cw:cv.width, ch:cv.height }; };
  /* 快捷键：Ctrl/Cmd+Z 撤销（输入框内除外） */
  window.addEventListener('keydown', function(e){
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
      var el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
      e.preventDefault();
      undo();
    }
  });
  /* 离开页面停止播放 */
  window.addEventListener('beforeunload', stopPlay);
})();
