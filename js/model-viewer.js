import * as THREE from 'three';
import { OrbitControls }     from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GLTFLoader }        from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader }         from 'three/addons/loaders/OBJLoader.js';
import { STLLoader }         from 'three/addons/loaders/STLLoader.js';
import { RoomEnvironment }   from 'three/addons/environments/RoomEnvironment.js';
import { GLTFExporter }      from 'three/addons/exporters/GLTFExporter.js';

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
 "打开模型": "Open Model",
 "添加模型": "Add Model",
 "移动": "Move",
 "自动旋转": "Auto Rotate",
 "线框": "Wireframe",
 "网格": "Grid",
 "重置视角": "Reset View",
 "截图": "Screenshot",
 "选择要添加的模型": "Choose a model to add",
 "部件编辑": "Part Editor",
 "当前选中": "Selected",
 "未选中 · 改色将应用于全部": "None · color applies to all",
 "颜色（十六进制）": "Color (hex)",
 "应用到全部": "Apply to All",
 "删除选中部件": "Delete Selected",
 "导出(.glb)": "Export (.glb)",
 "存仓库": "Save to repo",
 "把当前场景保存到文件仓库": "Save the current scene to the file repository",
 "正在存入仓库…": "Saving to repository…",
 "已存入仓库": "Saved to repository",
 "存仓库失败": "Failed to save to repository",
 "恢复": "Restore",
 "点击模型选中部件 · 拖动": "Click model to select · drag",
 "箭头": "arrow",
 "移动位置": "Move",
 "十六进制支持": "hex supported",
 "或": "or",
 "拖入": "Drop",
 "移动 ·": "Move ·",
 "旋转 ·": "Rotate ·",
 "视角 ·": "View ·",
 "收起 ·": "Collapse ·",
 "删除 ·": "Delete ·",
 "取消": "Cancel",
 "松开鼠标以载入模型": "Release to load model",
 "支持 .glb / .gltf / .obj / .stl（可一并拖入贴图与 .bin）": ".glb / .gltf / .obj / .stl supported (textures & .bin can be dropped together)",
 "加载中…": "Loading…",
 "场景": "Scene",
 "球体": "Sphere",
 "立方体": "Cube",
 "圆柱": "Cylinder",
 "圆环": "Torus",
 "圆锥": "Cone",
 "不支持的文件类型，请使用 .glb / .gltf / .obj / .stl": "Unsupported type, use .glb / .gltf / .obj / .stl",
 "正在解析模型…": "Parsing model…",
 "文件中没有可用的场景数据": "No usable scene data in file",
 "加载失败：": "Load failed: ",
 "已截图": "Screenshot taken",
 "已导出": "Exported",
 "未命名模型": "Untitled",
 " 副本": " copy",
 "三角体": "Triangular Prism",
 "侧视": "Side",
 "俯视": "Top",
 "加载 mm.gltf 失败：": "mm.gltf load failed: ",
 "加载超时": "Load timeout",
 "变换模式：": "Transform: ",
 "场景中没有可导出的模型": "No models to export",
 "场景中没有模型": "No models in scene",
 "复制失败，请手动选择": "Copy failed, select manually",
 "导出失败：": "Export failed: ",
 "展开面板": "Expand panel",
 "已复制 ": "Copied ",
 "已复制「": "Copied \"",
 "已应用到全部部件": "Applied to all parts",
 "已恢复原模型": "Original restored",
 "已添加「": "Added \"",
 "已载入 mm.gltf": "mm.gltf loaded",
 "平面": "Plane",
 "当前没有可改色的部件": "No parts to recolor",
 "当前没有可调节的部件": "No parts to adjust",
 "截图已保存": "Screenshot saved",
 "收起面板": "Collapse panel",
 "旋转": "Rotate",
 "未命名部件": "Untitled part",
 "未找到 mm.gltf，已载入内置模型": "mm.gltf not found; built-in model loaded",
 "模型不含可见几何体": "No visible geometry in model",
 "模型已导出为 .glb": "Exported as .glb",
 "正在加载 mm.gltf…": "Loading mm.gltf…",
 "正在导出模型…": "Exporting model…",
 "正方体": "Box",
 "正视": "Front",
 "点击模型选中 · 拖动箭头可移动位置": "Click to select · drag arrows to move",
 "缩放": "Scale",
 "胶囊": "Capsule",
 "视角": "View",
 "请先选中一个部件": "Select a part first",
 "部件": "Part",
 "部件 ": "Part ",
 "颜色格式无效，请输入如 #3a7bff": "Invalid color, e.g. #3a7bff",
 "默认模型组合": "Default model set",
 "正": "F",
 "后": "B",
 "左": "L",
 "右": "R",
 "顶": "T",
 "底": "Und",
 "点击模型选中部件 · 拖动<b data-t=\"箭头\">箭头</b>移动位置<br>十六进制支持 <b>#RRGGBB</b> 或 <b>#RGB</b><br>金属度 / 粗糙度对选中部件生效，未选中时应用于全部": "Click the model to select a part · drag the <b data-t=\"箭头\">arrow</b> to move it<br>Hex color supported: <b>#RRGGBB</b> or <b>#RGB</b><br>Metalness / roughness apply to the selected part, or to all when none selected",
 "前视图": "Front view",
 "后视图": "Back view",
 "左视图": "Left view",
 "右视图": "Right view",
 "顶视图": "Top view",
 "底视图": "Bottom view",
 "打开本地模型文件": "Open a local model file",
 "添加默认模型": "Add a default model",
 "移动模式 (M)": "Move mode (M)",
 "自动旋转 (R)": "Auto rotate (R)",
 "线框模式 (W)": "Wireframe mode (W)",
 "显示网格 (G)": "Show grid (G)",
 "重置视角 (F)": "Reset view (F)",
 "保存截图": "Save screenshot",
 "变换模式：移动 / 旋转 / 缩放 (T)": "Transform: move / rotate / scale (T)",
 "关闭": "Close",
 "收起面板": "Collapse panel",
 "拾取颜色": "Pick a color",
 "输入十六进制颜色，回车应用": "Type a hex color, press Enter to apply",
 "复制颜色编号": "Copy color code",
 "把当前颜色应用到所有部件": "Apply current color to all parts",
 "复制选中的部件（含独立材质）": "Duplicate selected part (with its own material)",
 "正视视角": "Front view",
 "侧视视角": "Side view",
 "俯视视角": "Top view",
 "把当前场景导出为 GLB 模型文件": "Export the current scene as a .glb model file",
 "撤销所有删除与改色": "Undo all deletions & color changes",
 "复制部件": "Duplicate Part",
 "材质 · 金属度": "Material · Metalness",
 "材质 · 粗糙度": "Material · Roughness",
 "已载入 ": "Loaded ",
 "已删除「": "Deleted \"",
 " 个模型": " model(s)",
 "网格 ": "Meshes ",
 " · 材质 ": " · Materials ",
 "顶点 ": "Vertices ",
 " · 三角面 ": " · Tris "
};
applyToolLang();


const container = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
/* 3D 视口背景随主题（浅色渐变 / 深色渐变） */
window.__applyViewportBg = function () {
    const c = mvThemeColors();
    if (window.__mvScene) {
        window.__mvScene.background = makeGradientTexture(c.top, c.bot);
        window.__mvScene.fog = new THREE.Fog(c.fog, 45, 180);
    }
    renderer.setClearColor(new THREE.Color(c.fog), 1);
    if (window.__mvRebuildGrid) window.__mvRebuildGrid();  /* 网格线颜色随主题重建 */
};
window.addEventListener('message', function (e) {
    const d = e.data;
    if (d && d.__atsTheme && window.__applyViewportBg) window.__applyViewportBg();
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
container.appendChild(renderer.domElement);
const canvas = renderer.domElement;

function makeGradientTexture(top, bottom) {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const scene = new THREE.Scene();
/* 视口主题色：浅色 / 深色 */
const mvThemeColors = () => document.body.classList.contains('light-theme')
    ? { top: '#dfe8f2', bot: '#eef2f7', fog: 0xdde7f2 }
    : { top: '#1b2436', bot: '#05070b', fog: 0x0a0f18 };
scene.background = makeGradientTexture(mvThemeColors().top, mvThemeColors().bot);
scene.fog = new THREE.Fog(mvThemeColors().fog, 45, 180);
window.__mvScene = scene;

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 800);
camera.position.set(5.5, 4, 7.5);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.rotateSpeed = 0.9;
controls.zoomSpeed = 0.9;
controls.panSpeed = 0.8;
controls.autoRotateSpeed = 1.6;
controls.minDistance = 0.05;
controls.maxDistance = 300;
controls.target.set(0, 1, 0);

scene.add(new THREE.HemisphereLight(0x9dbaff, 0x1a2230, 1.1));
const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.bias = -0.0008;
keyLight.shadow.normalBias = 0.02;
scene.add(keyLight);
scene.add(keyLight.target);
const rimLight = new THREE.DirectionalLight(0x6a8dff, 1.2);
rimLight.position.set(-6, 4, -7);
scene.add(rimLight);
const fillLight = new THREE.DirectionalLight(0xffffff, 0.45);
fillLight.position.set(-4, 2, 6);
scene.add(fillLight);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();

const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ opacity: 0.32 }));
shadowCatcher.rotation.x = -Math.PI / 2;
shadowCatcher.position.y = 0.001;
shadowCatcher.receiveShadow = true;
scene.add(shadowCatcher);

let gridHelper = null;
let gridOn = false;  /* 默认不显示网格线（用户要求去掉；按钮/G键可再开） */
function rebuildGrid(size) {
  if (gridHelper) { scene.remove(gridHelper); gridHelper.geometry.dispose(); gridHelper.material.dispose(); }
  const gcol = document.body.classList.contains('light-theme') ? { a: 0x5b7ca8, b: 0xa8bcd4 } : { a: 0x4f6b96, b: 0x263148 };
  gridHelper = new THREE.GridHelper(size, 20, gcol.a, gcol.b);
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.85;
  gridHelper.material.depthWrite = false;
  window.__mvRebuildGrid = function(){ rebuildGrid(gridSize); if (gridHelper) gridHelper.visible = gridOn; };
  gridHelper.visible = gridOn;
  scene.add(gridHelper);
  shadowCatcher.scale.set(size, size, 1);
}

const modelsGroup = new THREE.Group();
scene.add(modelsGroup);

let currentTitle = T('场景');
let wireframeOn  = false;
let autoRotateOn = false;
let moveOn       = true;
let selectedMesh    = null;
let highlightedMesh = null;
const originalColors = new Map();
const deletedParts   = [];

const transformControls = new TransformControls(camera, canvas);
transformControls.setMode('translate');
transformControls.setSpace('world');
transformControls.size = 0.95;
const tcObject = (typeof transformControls.getHelper === 'function') ? transformControls.getHelper() : transformControls;
scene.add(tcObject);
let gizmoWasDragging = false;
transformControls.addEventListener('dragging-changed', (e) => { controls.enabled = !e.value; if (e.value) gizmoWasDragging = true; });
function setMoveMode(on) { moveOn = on; btnMove.classList.toggle('active', on); transformControls.enabled = on; tcObject.visible = on; updateTransformAttachment(); }

const PRIMITIVES = [
  { id: 'sphere', name: T('球体'), color: 0x8fb2ff, svg: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/>', make: () => new THREE.SphereGeometry(0.8, 48, 32) },
  { id: 'box', name: T('正方体'), color: 0xffb765, svg: '<path d="M12 2.6 21 7.3v9.4L12 21.4 3 16.7V7.3z"/><path d="M3 7.3 12 12l9-4.7M12 12v9.4"/>', make: () => new THREE.BoxGeometry(1.3, 1.3, 1.3, 2, 2, 2) },
  { id: 'pyramid', name: T('三角体'), color: 0x9be08a, svg: '<path d="M12 3 21 19.5H3z"/><path d="M12 3v16.5"/><path d="M12 19.5 7.2 12M12 19.5l4.8-7.5"/>', make: () => new THREE.ConeGeometry(0.95, 1.6, 3, 1) },
  { id: 'cylinder', name: T('圆柱'), color: 0x7ad3e8, svg: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12a7 3 0 0 0 14 0V6"/>', make: () => new THREE.CylinderGeometry(0.62, 0.62, 1.55, 48) },
  { id: 'cone', name: T('圆锥'), color: 0xff9db0, svg: '<path d="M12 3 5 18M12 3l7 15"/><ellipse cx="12" cy="18" rx="7" ry="3"/>', make: () => new THREE.ConeGeometry(0.8, 1.55, 48) },
  { id: 'torus', name: T('圆环'), color: 0xc7a4ff, svg: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.6"/>', make: () => new THREE.TorusGeometry(0.68, 0.25, 24, 64) },
  { id: 'capsule', name: T('胶囊'), color: 0xffd88a, svg: '<rect x="7" y="3" width="10" height="18" rx="5"/>', make: () => new THREE.CapsuleGeometry(0.45, 0.85, 12, 32) },
  { id: 'plane', name: T('平面'), color: 0xa8b8d0, svg: '<path d="M3 16.5 9 6h12l-6 10.5z"/>', make: () => new THREE.PlaneGeometry(1.6, 1.6), rot: [-Math.PI / 2, 0, 0] }
];

let addIndex = 0;
function addPrimitive(def, opts = {}) {
  const geo = def.make();
  const mat = new THREE.MeshStandardMaterial({ color: def.color, metalness: 0.35, roughness: 0.33 });
  const mesh = new THREE.Mesh(geo, mat);
  addIndex++;
  mesh.name = `${def.name} ${addIndex}`;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (def.rot) mesh.rotation.set(def.rot[0], def.rot[1], def.rot[2]);
  mesh.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(mesh);
  mesh.position.y -= bb.min.y;
  if (addIndex > 1) {
    const a = (addIndex - 1) * 2.39996;
    const r = 1.05 + 0.42 * Math.sqrt(addIndex - 1);
    mesh.position.x += Math.cos(a) * r;
    mesh.position.z += Math.sin(a) * r;
  }
  modelsGroup.add(mesh);
  if (!opts.silent) { selectMesh(mesh); updateInfo(); toast(T('已添加「') + def.name + T('」')); }
  return mesh;
}

function buildLibraryUI() {
  const grid = document.getElementById('libGrid');
  grid.innerHTML = '';
  PRIMITIVES.forEach(def => {
    const btn = document.createElement('button');
    btn.className = 'lib-item';
    btn.type = 'button';
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${def.svg}</svg><span>${def.name}</span>`;
    btn.addEventListener('click', () => { addPrimitive(def); hideLibrary(); });
    grid.appendChild(btn);
  });
}

const fileMap = new Map();
let objectURLs = [];
const manager = new THREE.LoadingManager();
manager.setURLModifier((url) => {
  const clean = decodeURIComponent(url.split('?')[0].split('#')[0]);
  const name = clean.split('/').pop().toLowerCase();
  return fileMap.get(name) || url;
});
const gltfLoader = new GLTFLoader(manager);
const objLoader  = new OBJLoader(manager);
const stlLoader  = new STLLoader(manager);

function revokeURLs() { objectURLs.forEach(u => URL.revokeObjectURL(u)); objectURLs = []; }

function loadGLTF(url) { return new Promise((res, rej) => { gltfLoader.load(url, g => res(g.scene || (g.scenes && g.scenes[0])), undefined, rej); }); }
function loadOBJ(url) { return new Promise((res, rej) => objLoader.load(url, res, undefined, rej)); }
function loadSTL(url) {
  return new Promise((res, rej) => {
    stlLoader.load(url, (geometry) => {
      geometry.computeVertexNormals();
      const mat = new THREE.MeshStandardMaterial({ color: 0x9fb4cc, metalness: 0.25, roughness: 0.5 });
      res(new THREE.Mesh(geometry, mat));
    }, undefined, rej);
  });
}

async function loadFiles(fileList) {
  const files = Array.from(fileList || []).filter(f => f.size > 0);
  if (!files.length) return;
  const main = files.find(f => /\.(glb|gltf|obj|stl)$/i.test(f.name));
  if (!main) { toast(T('不支持的文件类型，请使用 .glb / .gltf / .obj / .stl'), true); return; }
  setLoading(true, T('正在解析模型…'));
  revokeURLs();
  fileMap.clear();
  try {
    for (const f of files) {
      const url = URL.createObjectURL(f);
      objectURLs.push(url);
      const lower = f.name.toLowerCase();
      fileMap.set(lower, url);
      fileMap.set(lower.split('/').pop(), url);
    }
    const url = fileMap.get(main.name.toLowerCase());
    const ext = main.name.split('.').pop().toLowerCase();
    let object;
    if (ext === 'glb' || ext === 'gltf') object = await loadGLTF(url);
    else if (ext === 'obj') object = await loadOBJ(url);
    else object = await loadSTL(url);
    if (!object) throw new Error(T('文件中没有可用的场景数据'));
    importModel(object, main.name);
    toast(T('已载入 ') + main.name);
  } catch (err) {
    console.error(err);
    toast(T('加载失败：') + (err?.message || err), true);
  } finally { setLoading(false); }
}

function clearScene() {
  clearSelection();
  transformControls.detach();
  while (modelsGroup.children.length) { const c = modelsGroup.children[0]; modelsGroup.remove(c); disposeObject(c); }
  deletedParts.length = 0;
  originalColors.clear();
  originalMatParams.clear();
  addIndex = 0;
}

function importModel(object, title) {
  clearScene();
  let partIndex = 0;
  object.traverse(o => {
    if (o.isMesh) {
      partIndex++;
      if (!o.name) o.name = T('部件 ') + partIndex;
      if (Array.isArray(o.material)) o.material = o.material.map(m => (m ? m.clone() : m));
      else if (o.material) o.material = o.material.clone();
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  const wrapper = new THREE.Group();
  wrapper.name = title;
  wrapper.add(object);
  modelsGroup.add(wrapper);
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) throw new Error(T('模型不含可见几何体'));
  const center = box.getCenter(new THREE.Vector3());
  const size   = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const k = 3 / maxDim;
  object.position.x -= center.x;
  object.position.y -= box.min.y;
  object.position.z -= center.z;
  wrapper.scale.setScalar(k);
  currentTitle = title;
  applyWireframe(wireframeOn);
  updateInfo();
  frameObject();
}

function frameObject() {
  if (!modelsGroup.children.length) return;
  const box = new THREE.Box3().setFromObject(modelsGroup);
  if (box.isEmpty()) return;
  const size   = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z) * 0.5 * 1.15;
  const midY   = center.y;
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  const dist = radius / Math.sin(Math.min(vFov, hFov) / 2) * 1.08;
  const target = new THREE.Vector3(center.x, midY, center.z);
  controls.target.copy(target);
  const dir = new THREE.Vector3(0.85, 0.58, 1).normalize();
  camera.position.copy(dir.multiplyScalar(dist).add(target));
  camera.near = Math.max(dist / 600, 0.005);
  camera.far  = dist * 220;
  camera.updateProjectionMatrix();
  controls.minDistance = dist * 0.03;
  controls.maxDistance = dist * 30;
  controls.update();
  const gridSize = Math.max(Math.max(size.x, size.z) * 3.6, radius * 6, 4);
  rebuildGrid(THREE.MathUtils.clamp(gridSize, 4, 600));
  const d = Math.max(radius * 3, 3);
  keyLight.position.set(d * 0.75, d * 1.6, d * 1.0);
  keyLight.target.position.copy(target);
  keyLight.target.updateMatrixWorld();
  const sc = keyLight.shadow.camera;
  sc.left = -d; sc.right = d; sc.top = d; sc.bottom = -d;
  sc.near = 0.1; sc.far = d * 10;
  sc.updateProjectionMatrix();
  rimLight.position.set(-d * 1.2, d * 0.9, -d * 0.9);
  fillLight.position.set(-d * 0.6, d * 0.4, d * 1.2);
}

/* ===== 六视图快捷切换：正/后/左/右/顶/底 ===== */
const VIEW_DIRS = {
  front:  [0, 0.12, 1],   back:  [0, 0.12, -1],
  left:   [-1, 0.12, 0],  right: [1, 0.12, 0],
  top:    [0.001, 1, 0.001], bottom: [0.001, -1, 0.001]
};
function setStdView(name) {
  if (!modelsGroup.children.length) { toast(T('场景中没有模型')); return; }
  const dir = VIEW_DIRS[name]; if (!dir) return;
  const box = new THREE.Box3().setFromObject(modelsGroup);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z) * 0.5 * 1.15;
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  const dist = radius / Math.sin(Math.min(vFov, hFov) / 2) * 1.08;
  const target = new THREE.Vector3(center.x, center.y, center.z);
  controls.target.copy(target);
  const d = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
  camera.position.copy(d.multiplyScalar(dist).add(target));
  camera.near = Math.max(dist / 600, 0.005);
  camera.far = dist * 12;
  camera.updateProjectionMatrix();
  controls.update();
}
document.querySelectorAll('#viewBox .vbtn').forEach(function (b) {
  b.addEventListener('click', function () { setStdView(b.getAttribute('data-view')); });
});

function getMats(obj) { if (!obj || !obj.material) return []; return Array.isArray(obj.material) ? obj.material : [obj.material]; }
function collectMeshes() { const arr = []; modelsGroup.traverse(o => { if (o.isMesh) arr.push(o); }); return arr; }
function getTopLevel(obj) { let o = obj; while (o && o.parent && o.parent !== modelsGroup) o = o.parent; return o; }
function disposeObject(obj) {
  obj.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    getMats(o).forEach(m => {
      if (!m) return;
      Object.keys(m).forEach(key => { const v = m[key]; if (v && v.isTexture) v.dispose(); });
      m.dispose();
    });
  });
}
function applyWireframe(on) { modelsGroup.traverse(o => { getMats(o).forEach(m => { if (m && 'wireframe' in m) m.wireframe = on; }); }); }
const fmt = n => n.toLocaleString('en-US');

function updateInfo() {
  let verts = 0, tris = 0, meshes = 0;
  const materials = new Set();
  modelsGroup.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    meshes++;
    const g = o.geometry;
    const pos = g.attributes.position;
    if (pos) { verts += pos.count; tris += g.index ? g.index.count / 3 : pos.count / 3; }
    getMats(o).forEach(m => m && materials.add(m.uuid));
  });
  const count = modelsGroup.children.length;
  const title = count > 1 ? T('场景') + ' · ' + count + T(' 个模型') : (currentTitle || T('场景'));
  infoName.textContent = title;
  infoStats.innerHTML = T('网格 ') + '<b>' + meshes + '</b>' + T(' · 材质 ') + '<b>' + materials.size + '</b><br>' + T('顶点 ') + '<b>' + fmt(Math.round(verts)) + '</b>' + T(' · 三角面 ') + '<b>' + fmt(Math.round(tris)) + '</b>';
}

function highlightMesh(mesh) {
  if (highlightedMesh === mesh) return;
  unhighlightMesh();
  if (!mesh) return;
  highlightedMesh = mesh;
  mesh.userData.__hl = [];
  getMats(mesh).forEach(m => {
    if (m && 'emissive' in m) {
      mesh.userData.__hl.push({ mat: m, color: m.emissive.clone(), intensity: m.emissiveIntensity });
      m.emissive.setHex(0x3f6bff);
      m.emissiveIntensity = 0.95;
    }
  });
}
function unhighlightMesh() {
  if (!highlightedMesh) return;
  (highlightedMesh.userData.__hl || []).forEach(({ mat, color, intensity }) => { mat.emissive.copy(color); mat.emissiveIntensity = intensity; });
  highlightedMesh.userData.__hl = [];
  highlightedMesh = null;
}
function updateTransformAttachment() {
  if (!moveOn || !selectedMesh || !selectedMesh.parent) { transformControls.detach(); return; }
  const top = getTopLevel(selectedMesh);
  if (top && top.parent) transformControls.attach(top);
  else transformControls.detach();
}
function selectMesh(mesh) { selectedMesh = mesh || null; highlightMesh(selectedMesh); updateSelectionUI(); updateTransformAttachment(); }
function clearSelection() { selectedMesh = null; unhighlightMesh(); updateSelectionUI(); transformControls.detach(); }

function normalizeHex(str) {
  let s = String(str || '').trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(s)) s = s.split('').map(c => c + c).join('');
  if (/^[0-9a-fA-F]{6}$/.test(s)) return '#' + s.toLowerCase();
  return null;
}
function colorOfMesh(mesh) { const m = getMats(mesh).find(mm => mm && mm.color); return m ? '#' + m.color.getHexString() : null; }
function rememberColors(mesh) { if (originalColors.has(mesh)) return; const snap = []; getMats(mesh).forEach(m => { if (m && m.color) snap.push({ mat: m, color: m.color.clone() }); }); originalColors.set(mesh, snap); }
function applyColorToMesh(mesh, hex) { const color = new THREE.Color(hex); rememberColors(mesh); getMats(mesh).forEach(m => { if (m && m.color) m.color.copy(color); }); }

function applyColor(hex, all = false) {
  const c = normalizeHex(hex);
  if (!c) return false;
  const targets = (all || !selectedMesh) ? collectMeshes() : [selectedMesh];
  if (!targets.length) { toast(T('当前没有可改色的部件'), true); return false; }
  targets.forEach(mesh => applyColorToMesh(mesh, c));
  colorPicker.value = c; hexInput.value = c; hexInput.classList.remove('invalid');
  if (selectedMesh) syncColorUIFromSelection();
  return true;
}
function syncColorUIFromSelection() {
  if (!selectedMesh) return;
  const hex = colorOfMesh(selectedMesh);
  if (hex) { colorPicker.value = hex; hexInput.value = hex; hexInput.classList.remove('invalid'); }
}
function deleteSelected() {
  if (!selectedMesh) return;
  const mesh = selectedMesh; const parent = mesh.parent; if (!parent) return;
  const index = parent.children.indexOf(mesh);
  deletedParts.push({ mesh, parent, index });
  transformControls.detach();
  clearSelection();
  parent.remove(mesh);
  updateInfo();
  toast(T('已删除「') + (mesh.name || T('部件')) + T('」'));
}
function restoreModel() {
  deletedParts.forEach(({ mesh, parent, index }) => {
    if (mesh.parent) return;
    const i = Math.min(index, parent.children.length);
    parent.children.splice(i, 0, mesh); mesh.parent = parent;
  });
  deletedParts.length = 0;
  originalColors.forEach((snap, mesh) => { snap.forEach(({ mat, color }) => { if (mat && mat.color) mat.color.copy(color); }); });
  originalColors.clear();
  originalMatParams.forEach((snap, mesh) => { snap.forEach(({ mat, metalness, roughness }) => { if (mat) { mat.metalness = metalness; mat.roughness = roughness; } }); });
  originalMatParams.clear();
  clearSelection(); updateInfo(); toast(T('已恢复原模型'));
}

const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();
let pointerDown = null;
function pickAt(clientX, clientY) {
  if (!modelsGroup.children.length) { clearSelection(); return; }
  const rect = canvas.getBoundingClientRect();
  pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNDC, camera);
  const hits = raycaster.intersectObjects(modelsGroup.children, true);
  const hit = hits.find(h => h.object && h.object.isMesh);
  if (hit) selectMesh(hit.object); else clearSelection();
}
canvas.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; pointerDown = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', (e) => {
  if (e.button !== 0 || !pointerDown) return;
  const dx = e.clientX - pointerDown.x, dy = e.clientY - pointerDown.y;
  pointerDown = null;
  const wasGizmo = gizmoWasDragging;
  gizmoWasDragging = false;
  if (wasGizmo) return;
  if (Math.hypot(dx, dy) > 6) return;
  pickAt(e.clientX, e.clientY);
});

const infoName   = document.getElementById('infoName');
const infoStats  = document.getElementById('infoStats');
const dropEl     = document.getElementById('drop');
const loadingEl  = document.getElementById('loading');
const loadingTxt = document.getElementById('loadingText');
const toastEl    = document.getElementById('toast');
const fileInput2 = document.getElementById('fileInput2');
const btnOpen   = document.getElementById('btnOpen');
const btnAdd    = document.getElementById('btnAdd');
const btnMove   = document.getElementById('btnMove');
const btnRotate = document.getElementById('btnRotate');
const btnWire   = document.getElementById('btnWire');
const btnGrid   = document.getElementById('btnGrid');
const btnReset  = document.getElementById('btnReset');
const btnShot   = document.getElementById('btnShot');
const libPop   = document.getElementById('libPop');
const libClose = document.getElementById('libClose');
const panelRight = document.getElementById('panelRight');
const btnFold    = document.getElementById('btnFold');
const selNameEl     = document.getElementById('selName');
const colorPicker   = document.getElementById('colorPicker');
const hexInput      = document.getElementById('hexInput');
const btnCopyHex    = document.getElementById('btnCopyHex');
const btnApplyAll   = document.getElementById('btnApplyAll');
const btnDelete     = document.getElementById('btnDelete');
const btnExportModel = document.getElementById('btnExportModel');
const btnSaveModelRepo = document.getElementById('btnSaveModelRepo');
const btnRestore    = document.getElementById('btnRestore');
const btnMode = document.getElementById('btnMode');
const btnModeLabel = document.getElementById('btnModeLabel');
const matMetal = document.getElementById('matMetal');
const matMetalV = document.getElementById('matMetalV');
const matRough = document.getElementById('matRough');
const matRoughV = document.getElementById('matRoughV');
const btnDuplicate = document.getElementById('btnDuplicate');
const btnViewFront = document.getElementById('btnViewFront');
const btnViewSide  = document.getElementById('btnViewSide');
const btnViewTop   = document.getElementById('btnViewTop');

/* ===== 新增：变换模式（移动 / 旋转 / 缩放）===== */
const TRANSFORM_MODES = [
  { id: 'translate', label: T('移动') },
  { id: 'rotate',    label: T('旋转') },
  { id: 'scale',     label: T('缩放') }
];
let transformModeIdx = 0;
function setTransformMode(i, silent) {
  transformModeIdx = ((i % TRANSFORM_MODES.length) + TRANSFORM_MODES.length) % TRANSFORM_MODES.length;
  const m = TRANSFORM_MODES[transformModeIdx];
  transformControls.setMode(m.id);
  if (btnModeLabel) btnModeLabel.textContent = m.label;
  if (!moveOn) setMoveMode(true);   /* 切换变换模式时自动开启变换控制 */
  if (!silent) toast(T('变换模式：') + m.label);
}
if (btnMode) btnMode.addEventListener('click', () => setTransformMode(transformModeIdx + 1));

/* ===== 新增：复制选中部件（材质独立，便于分别改色）===== */
function cloneMeshIndependent(mesh) {
  const c = mesh.clone(true);
  c.traverse(o => {
    if (o.isMesh) {
      if (Array.isArray(o.material)) o.material = o.material.map(m => (m ? m.clone() : m));
      else if (o.material) o.material = o.material.clone();
    }
  });
  return c;
}
function duplicateSelected() {
  if (!selectedMesh) { toast(T('请先选中一个部件'), true); return; }
  const src = selectedMesh;
  const parent = src.parent;
  if (!parent) return;
  const clone = cloneMeshIndependent(src);
  clone.name = (src.name || T('部件')) + T(' 副本');
  clone.position.x += 0.6;   /* 错开位置，避免完全重叠 */
  clone.position.z += 0.6;
  parent.add(clone);
  selectMesh(clone);
  updateInfo();
  toast(T('已复制「') + (src.name || T('部件')) + '」');
}
if (btnDuplicate) btnDuplicate.addEventListener('click', duplicateSelected);

/* ===== 新增：材质金属度 / 粗糙度（选中部件生效，未选中应用全部）===== */
const originalMatParams = new Map();
function rememberMatParams(mesh) {
  if (originalMatParams.has(mesh)) return;
  const snap = [];
  getMats(mesh).forEach(m => { if (m && 'metalness' in m) snap.push({ mat: m, metalness: m.metalness, roughness: m.roughness }); });
  originalMatParams.set(mesh, snap);
}
function matParamsOf(mesh) {
  const mats = getMats(mesh).filter(m => m && 'metalness' in m);
  if (!mats.length) return null;
  return { metalness: mats[0].metalness, roughness: mats[0].roughness };
}
function applyMatParam(key, val) {
  const targets = selectedMesh ? [selectedMesh] : collectMeshes();
  if (!targets.length) { toast(T('当前没有可调节的部件'), true); return; }
  targets.forEach(mesh => {
    rememberMatParams(mesh);
    getMats(mesh).forEach(m => { if (m && key in m) m[key] = val; });
  });
}
function syncMatUIFromSelection() {
  const p = selectedMesh ? matParamsOf(selectedMesh) : null;
  if (!p || !matMetal || !matRough) return;
  matMetal.value = Math.round(p.metalness * 100);
  matRough.value = Math.round(p.roughness * 100);
  if (matMetalV) matMetalV.textContent = matMetal.value + '%';
  if (matRoughV) matRoughV.textContent = matRough.value + '%';
}
if (matMetal) matMetal.addEventListener('input', function () {
  const v = +this.value / 100;
  if (matMetalV) matMetalV.textContent = this.value + '%';
  applyMatParam('metalness', v);
});
if (matRough) matRough.addEventListener('input', function () {
  const v = +this.value / 100;
  if (matRoughV) matRoughV.textContent = this.value + '%';
  applyMatParam('roughness', v);
});

/* ===== 新增：视角预设（正视 / 侧视 / 俯视）===== */
function viewPreset(kind) {
  if (!modelsGroup.children.length) { toast(T('场景中没有模型'), true); return; }
  const box = new THREE.Box3().setFromObject(modelsGroup);
  if (box.isEmpty()) return;
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z) * 0.5 * 1.15;
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const dist = radius / Math.sin(vFov / 2) * 1.08;
  const dirs = {
    front: new THREE.Vector3(0, 0.06, 1),
    side:  new THREE.Vector3(1, 0.06, 0),
    top:   new THREE.Vector3(0, 1, 0.001)
  };
  const dir = (dirs[kind] || dirs.front).clone().normalize();
  controls.target.copy(center);
  camera.position.copy(dir.multiplyScalar(dist).add(center));
  controls.update();
  toast({ front: T('正视'), side: T('侧视'), top: T('俯视') }[kind] + T('视角'));
}
if (btnViewFront) btnViewFront.addEventListener('click', () => viewPreset('front'));
if (btnViewSide)  btnViewSide.addEventListener('click',  () => viewPreset('side'));
if (btnViewTop)   btnViewTop.addEventListener('click',   () => viewPreset('top'));

function updateSelectionUI() {
  if (selectedMesh) {
    selNameEl.textContent = selectedMesh.name || T('未命名部件');
    selNameEl.classList.add('has');
    btnDelete.disabled = false;
    if (btnDuplicate) btnDuplicate.disabled = false;
    syncColorUIFromSelection();
    syncMatUIFromSelection();
  } else {
    selNameEl.textContent = T('未选中 · 改色将应用于全部');
    selNameEl.classList.remove('has');
    btnDelete.disabled = true;
    if (btnDuplicate) btnDuplicate.disabled = true;
  }
}

btnOpen.addEventListener('click', () => fileInput2.click());
fileInput2.addEventListener('change', (e) => { if (e.target.files.length) loadFiles(e.target.files); e.target.value = ''; });
function showLibrary() { libPop.classList.add('show'); btnAdd.classList.add('active'); }
function hideLibrary() { libPop.classList.remove('show'); btnAdd.classList.remove('active'); }
function toggleLibrary() { libPop.classList.contains('show') ? hideLibrary() : showLibrary(); }
btnAdd.addEventListener('click', (e) => { e.stopPropagation(); toggleLibrary(); });
libClose.addEventListener('click', hideLibrary);
libPop.addEventListener('click', (e) => e.stopPropagation());
document.addEventListener('click', (e) => {
  if (!libPop.classList.contains('show')) return;
  if (libPop.contains(e.target) || e.target === btnAdd) return;
  hideLibrary();
});
btnMove.addEventListener('click', () => setMoveMode(!moveOn));
btnRotate.addEventListener('click', () => { autoRotateOn = !autoRotateOn; btnRotate.classList.toggle('active', autoRotateOn); });
btnWire.addEventListener('click', () => { wireframeOn = !wireframeOn; btnWire.classList.toggle('active', wireframeOn); applyWireframe(wireframeOn); });
btnGrid.addEventListener('click', () => { gridOn = !gridOn; btnGrid.classList.toggle('active', gridOn); if (gridHelper) gridHelper.visible = gridOn; shadowCatcher.visible = gridOn; });
btnReset.addEventListener('click', frameObject);
btnShot.addEventListener('click', () => {
  const vis = tcObject.visible; tcObject.visible = false;
  renderer.render(scene, camera);
  const data = canvas.toDataURL('image/png');
  tcObject.visible = vis;
  const a = document.createElement('a');
  a.href = data; a.download = `model-${Date.now()}.png`;
  document.body.appendChild(a); a.click(); a.remove();
  toast(T('截图已保存'));
});
colorPicker.addEventListener('input', () => { const hex = colorPicker.value; hexInput.value = hex; hexInput.classList.remove('invalid'); applyColor(hex); });
function commitHexInput() {
  const hex = normalizeHex(hexInput.value);
  if (!hex) { hexInput.classList.add('invalid'); toast(T('颜色格式无效，请输入如 #3a7bff'), true); return; }
  hexInput.classList.remove('invalid'); hexInput.value = hex; applyColor(hex);
}
hexInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter')  { e.preventDefault(); commitHexInput(); hexInput.blur(); }
  if (e.key === 'Escape') { syncColorUIFromSelection(); hexInput.blur(); }
});
hexInput.addEventListener('blur', () => { if (normalizeHex(hexInput.value)) commitHexInput(); else syncColorUIFromSelection(); });
hexInput.addEventListener('input', () => { const ok = !!normalizeHex(hexInput.value); hexInput.classList.toggle('invalid', !ok && hexInput.value.length > 0); });
btnCopyHex.addEventListener('click', async () => {
  const hex = normalizeHex(hexInput.value) || hexInput.value;
  try { await navigator.clipboard.writeText(hex); toast(T('已复制 ') + hex); }
  catch { hexInput.select(); try { document.execCommand('copy'); toast(T('已复制 ') + hex); } catch { toast(T('复制失败，请手动选择'), true); } }
});
btnApplyAll.addEventListener('click', () => { const hex = normalizeHex(hexInput.value) || colorPicker.value; if (applyColor(hex, true)) toast(T('已应用到全部部件')); });
btnDelete.addEventListener('click', deleteSelected);

const gltfExporter = new GLTFExporter();

function exportSceneGLB(onBlob) {
  if (!modelsGroup.children.length) {
    toast(T('场景中没有可导出的模型'), true);
    return false;
  }
  const prevSelected = selectedMesh;
  unhighlightMesh();
  transformControls.detach();
  setLoading(true, T('正在导出模型…'));

  const exportRoot = modelsGroup.clone(true);
  exportRoot.name = 'Scene';

  gltfExporter.parse(
    exportRoot,
    (result) => {
      try {
        onBlob(new Blob([result], { type: 'model/gltf-binary' }));
      } catch (e) {
        console.error(e);
        toast(T('导出失败：') + (e?.message || e), true);
      } finally {
        setLoading(false);
        if (prevSelected && prevSelected.parent) selectMesh(prevSelected);
      }
    },
    (error) => {
      console.error(error);
      setLoading(false);
      toast(T('导出失败：') + (error?.message || error), true);
      if (prevSelected && prevSelected.parent) selectMesh(prevSelected);
    },
    { binary: true, onlyVisible: false }
  );
  return true;
}

function exportModel() {
  exportSceneGLB((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model-${Date.now()}.glb`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast(T('模型已导出为 .glb'));
  });
}

/* 编辑后的模型（.glb）存入文件仓库：postMessage 交给父页写入 OPFS 仓库 */
function saveModelToRepo() {
  const sent = exportSceneGLB((blob) => {
    const name = `model-${Date.now()}.glb`;
    try {
      parent.postMessage({ __repoSave: { name: name, blob: blob } }, '*');
    } catch (e) {
      toast(T('存仓库失败'), true);
      return;
    }
    toast(T('正在存入仓库…'));
    const h = (e) => {
      if (!e.data || !e.data.__repoSaveAck) return;
      window.removeEventListener('message', h);
      toast(e.data.__repoSaveAck ? T('已存入仓库') : (T('存仓库失败') + (e.data.msg || '')), !e.data.__repoSaveAck);
    };
    window.addEventListener('message', h);
  });
  if (!sent) toast(T('场景中没有可导出的模型'), true);
}

btnExportModel.addEventListener('click', exportModel);
btnSaveModelRepo.addEventListener('click', saveModelToRepo);

function togglePanel(force) {
  const collapsed = (typeof force === 'boolean') ? force : !panelRight.classList.contains('collapsed');
  panelRight.classList.toggle('collapsed', collapsed);
  btnFold.title = collapsed ? T('展开面板') : T('收起面板');
  btnFold.setAttribute('aria-label', btnFold.title);
}
btnFold.addEventListener('click', (e) => { e.stopPropagation(); togglePanel(); });
document.querySelector('.panel-head').addEventListener('click', () => togglePanel());

let dragDepth = 0;
window.addEventListener('dragenter', (e) => { e.preventDefault(); dragDepth++; dropEl.classList.add('show'); });
window.addEventListener('dragleave', (e) => { e.preventDefault(); dragDepth = Math.max(0, dragDepth - 1); if (dragDepth === 0) dropEl.classList.remove('show'); });
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
  e.preventDefault(); dragDepth = 0; dropEl.classList.remove('show');
  if (e.dataTransfer && e.dataTransfer.files.length) loadFiles(e.dataTransfer.files);
});

window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA');
  if (e.key === 'Escape') { if (libPop.classList.contains('show')) { hideLibrary(); return; } if (!typing) clearSelection(); return; }
  if ((e.key === 'Delete' || e.key === 'Backspace') && !typing) { if (selectedMesh) { e.preventDefault(); deleteSelected(); } return; }
  if (typing) return;
  switch (e.key.toLowerCase()) {
    case 'm': btnMove.click(); break;
    case 't': setTransformMode(transformModeIdx + 1); break;
    case 'r': btnRotate.click(); break;
    case 'w': btnWire.click(); break;
    case 'g': btnGrid.click(); break;
    case 'f': frameObject(); break;
    case 'c': togglePanel(); break;
  }
});

let toastTimer;
function toast(msg, isError = false) {
  toastEl.textContent = msg;
  toastEl.classList.toggle('error', isError);
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3000);
}
function setLoading(on, text) { loadingEl.classList.toggle('show', on); if (text) loadingTxt.textContent = text; }
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
renderer.setAnimationLoop(() => { controls.autoRotate = autoRotateOn; controls.update(); renderer.render(scene, camera); });

buildLibraryUI();
function loadFallbackScene() {
  ['sphere', 'box', 'pyramid', 'cylinder'].forEach(id => {
    const def = PRIMITIVES.find(p => p.id === id);
    if (def) addPrimitive(def, { silent: true });
  });
  currentTitle = T('默认模型组合');
  clearSelection(); updateInfo(); frameObject(); setMoveMode(true);
  toast(T('未找到 mm.gltf，已载入内置模型'));
}
async function loadStartupModel() {
  setLoading(true, T('正在加载 mm.gltf…'));
  try {
    /* 网络慢/不可用时不能永久卡在加载态：8 秒超时后回退到内置模型 */
    const object = await Promise.race([
      loadGLTF('https://ats-bianjiqi.github.io/mm.gltf'),
      new Promise((_, rej) => setTimeout(() => rej(new Error(T('加载超时'))), 8000))
    ]);
    if (!object) throw new Error(T('文件中没有可用的场景数据'));
    importModel(object, 'mm.gltf');
    currentTitle = 'mm.gltf';
    updateInfo(); frameObject(); setMoveMode(true);
    toast(T('已载入 mm.gltf'));
  } catch (err) {
    console.warn(T('加载 mm.gltf 失败：'), err);
    loadFallbackScene();
  } finally { setLoading(false); }
}
loadStartupModel();
setTimeout(() => toast(T('点击模型选中 · 拖动箭头可移动位置')), 1200);
