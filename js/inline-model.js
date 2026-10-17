import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

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
 "模型": "Model",
 "拖拽": "drag",
 "旋转": "rotate",
 "滚轮": "scroll",
 "缩放": "zoom",
 "右键": "right-click",
 "平移": "pan",
 "⟲ 重置视角": "⟲ Reset View",
 "正在加载模型…": "Loading model…",
 "模型加载失败": "Model load failed",
 "未提供模型数据": "No model data",
 "模型解析失败：": "Model parse failed: ",
 "GLTF 加载失败（若为 .gltf 且引用外部 .bin/贴图，请改用 .glb 单文件格式）": "GLTF load failed (for .gltf with external .bin/textures, use single-file .glb)",
 " · 三角面 ": " · tris ",
 "OBJ 加载失败": "OBJ load failed",
 "STL 加载失败": "STL load failed",
 "暂不支持的格式：.": "Unsupported format: .",
 "未命名模型": "Untitled",
 "顶点 ": " vertices "
};
applyToolLang();

window.__MODEL_OK__ = true; /* 引擎已就绪，取消看门狗 */

const info = window.__MODEL__ || {};
const app = document.getElementById('app');
const loading = document.getElementById('loading');
const loadingText = document.getElementById('loadingText');
const statsEl = document.getElementById('stats');
document.getElementById('title').textContent = info.name || T('未命名模型');
document.getElementById('badge').textContent = (info.ext || '3d').toUpperCase();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
(function makeBg() {
  const light = document.body.classList.contains('light-theme');
  const top = light ? '#dfe8f2' : '#16202f', bot = light ? '#eef2f7' : '#070a12';
  const c = document.createElement('canvas');
  c.width = 4; c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, top); g.addColorStop(1, bot);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  scene.background = tex;
  window.__inlineApplyBg = function () { makeBg(); };
})();

window.addEventListener('message', function (e) {
  const d = e.data;
  if (d && d.__atsTheme) {
    if (window.__inlineApplyBg) window.__inlineApplyBg();
  }
});

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 5000);
camera.position.set(3.2, 2.2, 4.2);

scene.add(new THREE.HemisphereLight(0xbcd4ff, 0x1a2233, 0.65));
const key = new THREE.DirectionalLight(0xffffff, 1.5);
key.position.set(4, 7, 5);
scene.add(key);
const rim = new THREE.DirectionalLight(0x7aa2ff, 0.7);
rim.position.set(-5, 3, -4);
scene.add(rim);
try { scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; } catch (e) {}

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.05;
controls.maxDistance = 2000;

function frame(object) {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const k = 3 / maxDim;
  object.position.x -= center.x;
  object.position.y -= box.min.y + size.y / 2;
  object.position.z -= center.z;
  const wrapper = new THREE.Group();
  wrapper.add(object);
  wrapper.scale.setScalar(k);
  scene.add(wrapper);
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  /* 模型已归一化到 3 单位（半径 1.5），相机距离按可视角反推（原公式混入缩放前尺寸，导致相机陷入模型内部，模型与网格线全部不可见） */
  const dist = 1.5 / Math.sin(Math.min(vFov, hFov) / 2) * 1.15;
  camera.position.set(dist * 0.65, dist * 0.45, dist * 0.8);
  controls.target.set(0, (size.y / 2) * k, 0);
  controls.update();
  let verts = 0, tris = 0;
  wrapper.traverse(o => {
    if (o.isMesh && o.geometry) {
      const pos = o.geometry.attributes.position;
      if (pos) { verts += pos.count; tris += o.geometry.index ? o.geometry.index.count / 3 : pos.count / 3; }
      o.castShadow = false;
    }
  });
  statsEl.textContent = T('顶点 ') + verts.toLocaleString() + T(' · 三角面 ') + Math.round(tris).toLocaleString();
}
function fail(msg) {
  loading.classList.add('err');
  loadingText.textContent = msg || T('模型加载失败');
  loading.classList.add('show');
}
function load() {
  const url = info.url, ext = (info.ext || '').toLowerCase();
  if (!url) { fail(T('未提供模型数据')); return; }
  const done = obj => { try { frame(obj); loading.classList.remove('show'); } catch (e) { fail(T('模型解析失败：') + e.message); } };
  if (ext === 'glb' || ext === 'gltf') {
    new GLTFLoader().load(url, g => done(g.scene || (g.scenes && g.scenes[0])), undefined, () => fail(T('GLTF 加载失败（若为 .gltf 且引用外部 .bin/贴图，请改用 .glb 单文件格式）')));
  } else if (ext === 'obj') {
    new OBJLoader().load(url, done, undefined, () => fail(T('OBJ 加载失败')));
  } else if (ext === 'stl') {
    new STLLoader().load(url, geo => {
      geo.computeVertexNormals();
      done(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x9fb4cc, metalness: 0.25, roughness: 0.5 })));
    }, undefined, () => fail(T('STL 加载失败')));
  } else fail(T('暂不支持的格式：.') + ext);
}
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
document.getElementById('btnReset').addEventListener('click', () => {
  camera.position.set(3.2 * 0.65 * 1.2, 3.2 * 0.45 * 1.2, 3.2 * 0.8 * 1.2);
  controls.target.set(0, 1.5 / 2, 0);
  controls.update();
  const wrapper = scene.children.find(c => c.isGroup);
  if (wrapper) {
    const box = new THREE.Box3().setFromObject(wrapper);
    if (!box.isEmpty()) {
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
      const radius = Math.max(size.x, size.y, size.z) / 2;
      const dist = radius / Math.sin(Math.min(vFov, hFov) / 2) * 1.15;
      camera.position.set(center.x + dist * 0.55, center.y + dist * 0.38, center.z + dist * 0.72);
      controls.target.copy(center);
      controls.update();
    }
  }
});
renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
else load();
