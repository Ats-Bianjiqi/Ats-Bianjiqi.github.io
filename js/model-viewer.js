import * as THREE from 'three';
import { OrbitControls }     from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GLTFLoader }        from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader }         from 'three/addons/loaders/OBJLoader.js';
import { STLLoader }         from 'three/addons/loaders/STLLoader.js';
import { RoomEnvironment }   from 'three/addons/environments/RoomEnvironment.js';
import { GLTFExporter }      from 'three/addons/exporters/GLTFExporter.js';

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

let currentTitle = '场景';
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
  { id: 'sphere', name: '球体', color: 0x8fb2ff, svg: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/>', make: () => new THREE.SphereGeometry(0.8, 48, 32) },
  { id: 'box', name: '正方体', color: 0xffb765, svg: '<path d="M12 2.6 21 7.3v9.4L12 21.4 3 16.7V7.3z"/><path d="M3 7.3 12 12l9-4.7M12 12v9.4"/>', make: () => new THREE.BoxGeometry(1.3, 1.3, 1.3, 2, 2, 2) },
  { id: 'pyramid', name: '三角体', color: 0x9be08a, svg: '<path d="M12 3 21 19.5H3z"/><path d="M12 3v16.5"/><path d="M12 19.5 7.2 12M12 19.5l4.8-7.5"/>', make: () => new THREE.ConeGeometry(0.95, 1.6, 3, 1) },
  { id: 'cylinder', name: '圆柱', color: 0x7ad3e8, svg: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12a7 3 0 0 0 14 0V6"/>', make: () => new THREE.CylinderGeometry(0.62, 0.62, 1.55, 48) },
  { id: 'cone', name: '圆锥', color: 0xff9db0, svg: '<path d="M12 3 5 18M12 3l7 15"/><ellipse cx="12" cy="18" rx="7" ry="3"/>', make: () => new THREE.ConeGeometry(0.8, 1.55, 48) },
  { id: 'torus', name: '圆环', color: 0xc7a4ff, svg: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.6"/>', make: () => new THREE.TorusGeometry(0.68, 0.25, 24, 64) },
  { id: 'capsule', name: '胶囊', color: 0xffd88a, svg: '<rect x="7" y="3" width="10" height="18" rx="5"/>', make: () => new THREE.CapsuleGeometry(0.45, 0.85, 12, 32) },
  { id: 'plane', name: '平面', color: 0xa8b8d0, svg: '<path d="M3 16.5 9 6h12l-6 10.5z"/>', make: () => new THREE.PlaneGeometry(1.6, 1.6), rot: [-Math.PI / 2, 0, 0] }
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
  if (!opts.silent) { selectMesh(mesh); updateInfo(); toast('已添加「' + def.name + '」'); }
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
  if (!main) { toast('不支持的文件类型，请使用 .glb / .gltf / .obj / .stl', true); return; }
  setLoading(true, '正在解析模型…');
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
    if (!object) throw new Error('文件中没有可用的场景数据');
    importModel(object, main.name);
    toast(`已载入 ${main.name}`);
  } catch (err) {
    console.error(err);
    toast('加载失败：' + (err?.message || err), true);
  } finally { setLoading(false); }
}

function clearScene() {
  clearSelection();
  transformControls.detach();
  while (modelsGroup.children.length) { const c = modelsGroup.children[0]; modelsGroup.remove(c); disposeObject(c); }
  deletedParts.length = 0;
  originalColors.clear();
  addIndex = 0;
}

function importModel(object, title) {
  clearScene();
  let partIndex = 0;
  object.traverse(o => {
    if (o.isMesh) {
      partIndex++;
      if (!o.name) o.name = '部件 ' + partIndex;
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
  if (box.isEmpty()) throw new Error('模型不含可见几何体');
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
  const title = count > 1 ? `场景 · ${count} 个模型` : (currentTitle || '场景');
  infoName.textContent = title;
  infoStats.innerHTML = `网格 <b>${meshes}</b> · 材质 <b>${materials.size}</b><br>顶点 <b>${fmt(Math.round(verts))}</b> · 三角面 <b>${fmt(Math.round(tris))}</b>`;
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
  if (!targets.length) { toast('当前没有可改色的部件', true); return false; }
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
  toast(`已删除「${mesh.name || '部件'}」`);
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
  clearSelection(); updateInfo(); toast('已恢复原模型');
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
const btnRestore    = document.getElementById('btnRestore');

function updateSelectionUI() {
  if (selectedMesh) {
    selNameEl.textContent = selectedMesh.name || '未命名部件';
    selNameEl.classList.add('has');
    btnDelete.disabled = false;
    syncColorUIFromSelection();
  } else {
    selNameEl.textContent = '未选中 · 改色将应用于全部';
    selNameEl.classList.remove('has');
    btnDelete.disabled = true;
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
  toast('截图已保存');
});
colorPicker.addEventListener('input', () => { const hex = colorPicker.value; hexInput.value = hex; hexInput.classList.remove('invalid'); applyColor(hex); });
function commitHexInput() {
  const hex = normalizeHex(hexInput.value);
  if (!hex) { hexInput.classList.add('invalid'); toast('颜色格式无效，请输入如 #3a7bff', true); return; }
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
  try { await navigator.clipboard.writeText(hex); toast('已复制 ' + hex); }
  catch { hexInput.select(); try { document.execCommand('copy'); toast('已复制 ' + hex); } catch { toast('复制失败，请手动选择', true); } }
});
btnApplyAll.addEventListener('click', () => { const hex = normalizeHex(hexInput.value) || colorPicker.value; if (applyColor(hex, true)) toast('已应用到全部部件'); });
btnDelete.addEventListener('click', deleteSelected);

const gltfExporter = new GLTFExporter();

function exportModel() {
  if (!modelsGroup.children.length) {
    toast('场景中没有可导出的模型', true);
    return;
  }
  const prevSelected = selectedMesh;
  unhighlightMesh();
  transformControls.detach();
  setLoading(true, '正在导出模型…');

  const exportRoot = modelsGroup.clone(true);
  exportRoot.name = 'Scene';

  gltfExporter.parse(
    exportRoot,
    (result) => {
      try {
        const blob = new Blob([result], { type: 'model/gltf-binary' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `model-${Date.now()}.glb`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        toast('模型已导出为 .glb');
      } catch (e) {
        console.error(e);
        toast('导出失败：' + (e?.message || e), true);
      } finally {
        setLoading(false);
        if (prevSelected && prevSelected.parent) selectMesh(prevSelected);
      }
    },
    (error) => {
      console.error(error);
      setLoading(false);
      toast('导出失败：' + (error?.message || error), true);
      if (prevSelected && prevSelected.parent) selectMesh(prevSelected);
    },
    { binary: true, onlyVisible: false }
  );
}

btnExportModel.addEventListener('click', exportModel);

function togglePanel(force) {
  const collapsed = (typeof force === 'boolean') ? force : !panelRight.classList.contains('collapsed');
  panelRight.classList.toggle('collapsed', collapsed);
  btnFold.title = collapsed ? '展开面板' : '收起面板';
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
  currentTitle = '默认模型组合';
  clearSelection(); updateInfo(); frameObject(); setMoveMode(true);
  toast('未找到 mm.gltf，已载入内置模型');
}
async function loadStartupModel() {
  setLoading(true, '正在加载 mm.gltf…');
  try {
    const object = await loadGLTF('https://ats-bianjiqi.github.io/mm.gltf');
    if (!object) throw new Error('文件中没有可用的场景数据');
    importModel(object, 'mm.gltf');
    currentTitle = 'mm.gltf';
    updateInfo(); frameObject(); setMoveMode(true);
    toast('已载入 mm.gltf');
  } catch (err) {
    console.warn('加载 mm.gltf 失败：', err);
    loadFallbackScene();
  } finally { setLoading(false); }
}
loadStartupModel();
setTimeout(() => toast('点击模型选中 · 拖动箭头可移动位置'), 1200);
