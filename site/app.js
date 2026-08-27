import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

const viewport = document.querySelector('#viewport');
const loading = document.querySelector('#loading');
const componentList = document.querySelector('#componentList');
const selectedTitle = document.querySelector('#selectedTitle');
const infoTitle = document.querySelector('#infoTitle');
const infoDescription = document.querySelector('#infoDescription');
const infoFunction = document.querySelector('#infoFunction');
const infoState = document.querySelector('#infoState');
const statusBadge = document.querySelector('#statusBadge');
const energizeBtn = document.querySelector('#energizeBtn');
const explodeBtn = document.querySelector('#explodeBtn');
const assembleBtn = document.querySelector('#assembleBtn');
const showAllBtn = document.querySelector('#showAllBtn');
const resetSelectedBtn = document.querySelector('#resetSelectedBtn');
const hideSelectedBtn = document.querySelector('#hideSelectedBtn');
const saveBtn = document.querySelector('#saveBtn');
const restoreBtn = document.querySelector('#restoreBtn');
const exportBtn = document.querySelector('#exportBtn');
const importInput = document.querySelector('#importInput');
const resetAllBtn = document.querySelector('#resetAllBtn');
const positionInputs = [document.querySelector('#posX'), document.querySelector('#posY'), document.querySelector('#posZ')];
const modeButtons = [...document.querySelectorAll('.mode-button')];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e13);
scene.fog = new THREE.Fog(0x0a0e13, 24, 44);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(12, 9, 14);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (error) {
  loading.textContent = 'Este navegador não conseguiu iniciar WebGL.';
  throw error;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
viewport.prepend(renderer.domElement);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.06;
orbit.target.set(0, 0, 0);
orbit.minDistance = 8;
orbit.maxDistance = 32;
orbit.maxPolarAngle = Math.PI * 0.88;

const transform = new TransformControls(camera, renderer.domElement);
scene.add(transform.getHelper());
transform.setMode('translate');
transform.setSize(0.72);

const hemi = new THREE.HemisphereLight(0xbcd8ff, 0x1c2630, 1.45);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 3.1);
key.position.set(8, 14, 10);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 0.1;
key.shadow.camera.far = 40;
key.shadow.camera.left = -12;
key.shadow.camera.right = 12;
key.shadow.camera.top = 12;
key.shadow.camera.bottom = -12;
scene.add(key);
const rim = new THREE.DirectionalLight(0x8ad7ff, 1.3);
rim.position.set(-10, 5, -8);
scene.add(rim);

const grid = new THREE.GridHelper(24, 24, 0x304150, 0x17212b);
grid.position.y = -5.05;
scene.add(grid);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(26, 26),
  new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.28 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -5.03;
floor.receiveShadow = true;
scene.add(floor);

const materials = {
  plastic: new THREE.MeshStandardMaterial({ color: 0x181d23, roughness: 0.74, metalness: 0.05 }),
  plasticSoft: new THREE.MeshStandardMaterial({ color: 0x2b333d, roughness: 0.72, metalness: 0.03 }),
  white: new THREE.MeshStandardMaterial({ color: 0xd7d4c7, roughness: 0.62, metalness: 0.02 }),
  whiteDark: new THREE.MeshStandardMaterial({ color: 0xa7a79f, roughness: 0.65, metalness: 0.02 }),
  copper: new THREE.MeshStandardMaterial({ color: 0xa75f31, roughness: 0.35, metalness: 0.72 }),
  copperBright: new THREE.MeshStandardMaterial({ color: 0xce7c40, roughness: 0.3, metalness: 0.68 }),
  silver: new THREE.MeshStandardMaterial({ color: 0xc7d0d7, roughness: 0.25, metalness: 0.88 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x626d77, roughness: 0.42, metalness: 0.8 }),
  steelDark: new THREE.MeshStandardMaterial({ color: 0x343c45, roughness: 0.48, metalness: 0.76 }),
  coil: new THREE.MeshStandardMaterial({ color: 0xb76528, roughness: 0.32, metalness: 0.62, emissive: 0x000000, emissiveIntensity: 0 }),
  field: new THREE.MeshBasicMaterial({ color: 0x4fc7ff, transparent: true, opacity: 0.18, side: THREE.DoubleSide }),
  energized: new THREE.MeshStandardMaterial({ color: 0xd7d4c7, roughness: 0.62, metalness: 0.02, emissive: 0x14552f, emissiveIntensity: 0 })
};

const modelRoot = new THREE.Group();
modelRoot.name = 'Contator CWM18 — estudo procedural';
scene.add(modelRoot);

const componentMap = new Map();
let selectedId = null;
let boxHelper = null;
let isExploded = false;
let isEnergized = false;
let animationToken = 0;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinder(r, h, material, x = 0, y = 0, z = 0, rotation = [0, 0, 0], segments = 28) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segments), material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function screw(x, y, z, rotation = [Math.PI / 2, 0, 0]) {
  const group = new THREE.Group();
  const head = cylinder(0.28, 0.14, materials.steel, 0, 0, 0, rotation, 32);
  const slot = box(0.32, 0.035, 0.055, materials.steelDark, 0, 0.075, 0);
  group.add(head, slot);
  group.position.set(x, y, z);
  return group;
}

function addComponent({ id, label, category, description, functionText, position, explode = [0, 0, 0], energized = [0, 0, 0], build }) {
  const group = new THREE.Group();
  group.name = label;
  group.position.set(...position);
  build(group);
  group.userData.componentId = id;
  group.traverse((child) => {
    if (child.isMesh) child.userData.componentId = id;
  });
  modelRoot.add(group);
  componentMap.set(id, {
    id,
    label,
    category,
    description,
    functionText,
    group,
    initialPosition: group.position.clone(),
    initialRotation: group.rotation.clone(),
    initialScale: group.scale.clone(),
    explodeOffset: new THREE.Vector3(...explode),
    energizedOffset: new THREE.Vector3(...energized)
  });
}

addComponent({
  id: 'housing', label: 'Carcaça isolante', category: 'Estrutura',
  description: 'Estrutura plástica que sustenta e separa eletricamente os polos. A lateral foi aberta para permitir a visualização didática do interior.',
  functionText: 'Suporte mecânico e isolamento dielétrico.',
  position: [0, 0, 0], explode: [-4.5, 0.4, -1.1],
  build(group) {
    group.add(
      box(6.7, 0.45, 4.5, materials.plastic, 0, -4.35, 0),
      box(0.42, 8.8, 4.5, materials.plastic, -3.15, 0, 0),
      box(0.42, 8.8, 4.5, materials.plastic, 3.15, 0, 0),
      box(6.7, 0.38, 4.5, materials.plastic, 0, 4.25, 0),
      box(6.25, 8.0, 0.35, materials.plasticSoft, 0, 0, -2.05),
      box(6.25, 0.4, 1.6, materials.plasticSoft, 0, 2.75, 1.4),
      box(6.25, 0.4, 1.6, materials.plasticSoft, 0, -2.65, 1.4)
    );
    for (const x of [-2.1, -0.7, 0.7, 2.1]) {
      group.add(box(0.12, 7.4, 3.5, materials.plasticSoft, x + 0.55, 0, -0.1));
    }
  }
});

addComponent({
  id: 'input', label: 'Terminais de entrada L1/L2/L3/13', category: 'Potência',
  description: 'Bornes superiores de entrada das três fases e do contato auxiliar normalmente aberto.',
  functionText: 'Recebem alimentação L1, L2, L3 e o terminal 13 do auxiliar.',
  position: [0, 3.45, 0.95], explode: [0, 3.0, 0.8],
  build(group) {
    const xs = [-2.25, -0.75, 0.75, 2.25];
    xs.forEach((x, index) => {
      group.add(box(1.28, 1.1, 1.55, materials.white, x, 0, 0));
      group.add(screw(x, 0.1, 0.81));
      const barMaterial = index < 3 ? materials.copper : materials.copperBright;
      group.add(box(0.32, 1.8, 0.32, barMaterial, x, -1.25, 0.05));
    });
  }
});

addComponent({
  id: 'output', label: 'Terminais de saída T1/T2/T3/14', category: 'Potência',
  description: 'Bornes inferiores conectados à carga e à saída do contato auxiliar.',
  functionText: 'Entregam as fases comutadas em T1, T2, T3 e o terminal 14.',
  position: [0, -3.35, 0.95], explode: [0, -3.0, 0.8],
  build(group) {
    const xs = [-2.25, -0.75, 0.75, 2.25];
    xs.forEach((x, index) => {
      group.add(box(1.28, 1.1, 1.55, materials.white, x, 0, 0));
      group.add(screw(x, -0.08, 0.81));
      const barMaterial = index < 3 ? materials.copper : materials.copperBright;
      group.add(box(0.32, 1.75, 0.32, barMaterial, x, 1.22, 0.05));
    });
  }
});

addComponent({
  id: 'arc', label: 'Câmaras de extinção de arco', category: 'Potência',
  description: 'Conjunto de abafadores próximo aos contatos principais, representado por placas metálicas espaçadas.',
  functionText: 'Divide, alonga e resfria o arco durante a abertura dos contatos.',
  position: [0, 2.1, 0.35], explode: [3.8, 2.0, 0.5],
  build(group) {
    for (const x of [-2.25, -0.75, 0.75]) {
      for (let i = 0; i < 6; i += 1) {
        group.add(box(0.9, 0.08, 1.1, materials.steelDark, x, i * 0.16 - 0.4, 0));
      }
      group.add(box(1.15, 1.2, 1.35, materials.plasticSoft, x, 0, -0.02));
    }
  }
});

addComponent({
  id: 'contacts', label: 'Contatos principais', category: 'Potência',
  description: 'Três pontes móveis de cobre com pastilhas metálicas, uma para cada fase do circuito de potência.',
  functionText: 'Fecham ou abrem L1–T1, L2–T2 e L3–T3.',
  position: [0, 0.9, 0.78], explode: [4.3, 0.4, 1.1], energized: [0, -0.34, 0],
  build(group) {
    for (const x of [-2.25, -0.75, 0.75]) {
      group.add(box(0.42, 2.1, 0.28, materials.copper, x, 0, 0));
      group.add(box(0.78, 0.22, 0.44, materials.silver, x, 0.72, 0.03));
      group.add(box(0.78, 0.22, 0.44, materials.silver, x, -0.72, 0.03));
      group.add(box(0.84, 0.12, 0.5, materials.silver, x, 1.05, 0.04));
      group.add(box(0.84, 0.12, 0.5, materials.silver, x, -1.05, 0.04));
    }
  }
});

addComponent({
  id: 'mechanism', label: 'Mecanismo de acionamento', category: 'Mecânica',
  description: 'Travessa isolante e hastes que transmitem o deslocamento da armadura para os contatos móveis.',
  functionText: 'Sincroniza o movimento dos três polos e do contato auxiliar.',
  position: [-0.75, 0.35, -0.35], explode: [0, 0.3, 3.2], energized: [0, -0.34, 0],
  build(group) {
    group.add(box(4.9, 0.48, 0.72, materials.whiteDark, 0, 0.55, 0));
    for (const x of [-1.5, 0, 1.5]) {
      group.add(box(0.3, 2.3, 0.42, materials.white, x, -0.55, 0));
    }
    group.add(box(1.8, 0.42, 0.68, materials.plasticSoft, 0, -1.65, 0));
  }
});

addComponent({
  id: 'armature', label: 'Armadura móvel', category: 'Circuito magnético',
  description: 'Parte móvel ferromagnética que é atraída pelo núcleo quando a bobina é energizada.',
  functionText: 'Converte a força magnética em deslocamento mecânico.',
  position: [0, -1.05, -0.85], explode: [-3.8, -0.1, -0.7], energized: [0, -0.5, 0],
  build(group) {
    group.add(box(3.2, 0.62, 1.55, materials.steel, 0, 0.5, 0));
    group.add(box(0.7, 1.8, 1.55, materials.steel, -1.25, -0.45, 0));
    group.add(box(0.7, 1.8, 1.55, materials.steel, 1.25, -0.45, 0));
    group.add(box(0.72, 1.35, 1.55, materials.steelDark, 0, -0.25, 0));
  }
});

addComponent({
  id: 'core', label: 'Núcleo magnético fixo', category: 'Circuito magnético',
  description: 'Pacote laminado fixo que fecha o circuito magnético e concentra o fluxo produzido pela bobina.',
  functionText: 'Guia o fluxo e atrai a armadura móvel.',
  position: [0, -2.6, -0.85], explode: [-3.8, -2.0, -0.7],
  build(group) {
    group.add(box(3.2, 0.64, 1.6, materials.steelDark, 0, -0.45, 0));
    group.add(box(0.72, 1.7, 1.6, materials.steelDark, -1.25, 0.42, 0));
    group.add(box(0.72, 1.7, 1.6, materials.steelDark, 1.25, 0.42, 0));
    group.add(box(0.78, 1.55, 1.6, materials.steel, 0, 0.35, 0));
  }
});

addComponent({
  id: 'coil', label: 'Bobina eletromagnética A1/A2', category: 'Comando',
  description: 'Enrolamento de cobre esmaltado. Quando alimentado, cria o campo magnético que aciona o contator.',
  functionText: 'Gera força magnetomotriz no circuito magnético.',
  position: [0, -2.1, -0.85], explode: [0, -3.4, -1.5],
  build(group) {
    group.add(cylinder(0.92, 1.8, materials.whiteDark, 0, 0, 0, [0, 0, Math.PI / 2], 32));
    for (let i = 0; i < 18; i += 1) {
      const torus = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.045, 8, 40), materials.coil);
      torus.rotation.y = Math.PI / 2;
      torus.position.x = -0.72 + i * 0.085;
      torus.castShadow = true;
      group.add(torus);
    }
    group.add(box(0.18, 0.3, 0.6, materials.copperBright, -1.25, -0.95, 0.6));
    group.add(box(0.18, 0.3, 0.6, materials.copperBright, 1.25, -0.95, 0.6));
  }
});

addComponent({
  id: 'springs', label: 'Molas de retorno', category: 'Mecânica',
  description: 'Molas que mantêm o mecanismo na posição de repouso e promovem abertura rápida ao retirar energia da bobina.',
  functionText: 'Retornam armadura e contatos à posição aberta.',
  position: [0, -0.2, -0.65], explode: [3.6, -1.4, -1.0],
  build(group) {
    for (const x of [-2.0, 2.0]) {
      const points = [];
      const turns = 8;
      for (let i = 0; i <= turns * 12; i += 1) {
        const t = i / 12;
        points.push(new THREE.Vector3(Math.cos(t * Math.PI * 2) * 0.22, (t / turns) * 1.9 - 0.95, Math.sin(t * Math.PI * 2) * 0.22));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const spring = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.055, 8, false), materials.steel);
      spring.position.x = x;
      spring.castShadow = true;
      group.add(spring);
    }
  }
});

addComponent({
  id: 'aux', label: 'Contato auxiliar 13–14 (NO)', category: 'Comando',
  description: 'Contato normalmente aberto, mecanicamente acoplado ao conjunto principal.',
  functionText: 'Sinalização, selo e lógica de comando.',
  position: [2.35, 0.25, 0.75], explode: [4.8, -0.2, 1.0], energized: [0, -0.26, 0],
  build(group) {
    group.add(box(0.9, 2.55, 1.1, materials.white, 0, 0, 0));
    group.add(box(0.2, 1.35, 0.2, materials.copperBright, 0, 0.15, 0.35));
    group.add(box(0.5, 0.16, 0.35, materials.silver, 0, 0.72, 0.36));
    group.add(box(0.5, 0.16, 0.35, materials.silver, 0, -0.72, 0.36));
  }
});

const fieldGroup = new THREE.Group();
fieldGroup.visible = false;
for (const z of [-1.45, -0.25]) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.035, 8, 80), materials.field);
  ring.rotation.y = Math.PI / 2;
  ring.position.set(0, -2.1, z);
  fieldGroup.add(ring);
}
modelRoot.add(fieldGroup);

function captureDefaultTransforms() {
  componentMap.forEach((component) => {
    component.initialPosition.copy(component.group.position);
    component.initialRotation.copy(component.group.rotation);
    component.initialScale.copy(component.group.scale);
  });
}
captureDefaultTransforms();

function componentStateText(id) {
  if (id === 'coil') return isEnergized ? 'Energizada' : 'Desenergizada';
  if (id === 'armature') return isEnergized ? 'Atraída pelo núcleo' : 'Repouso';
  if (id === 'contacts') return isEnergized ? 'Fechados' : 'Abertos';
  if (id === 'aux') return isEnergized ? 'Fechado (13–14)' : 'Aberto (13–14)';
  return componentMap.get(id)?.group.visible ? 'Visível' : 'Oculto';
}

function buildComponentList() {
  componentList.innerHTML = '';
  componentMap.forEach((component) => {
    const row = document.createElement('div');
    row.className = 'component-row';
    row.dataset.id = component.id;

    const visibilityLabel = document.createElement('label');
    visibilityLabel.className = 'visibility-label';
    visibilityLabel.title = `Mostrar ou ocultar ${component.label}`;
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'visibility-toggle';
    checkbox.checked = component.group.visible;
    checkbox.addEventListener('change', () => {
      component.group.visible = checkbox.checked;
      if (!checkbox.checked && selectedId === component.id) clearSelection();
    });
    visibilityLabel.appendChild(checkbox);

    const selectButton = document.createElement('button');
    selectButton.type = 'button';
    selectButton.className = 'component-select';
    selectButton.innerHTML = `<strong>${component.label}</strong><small>${component.category}</small>`;
    selectButton.addEventListener('click', () => selectComponent(component.id));

    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'mini-reset';
    reset.title = `Resetar ${component.label}`;
    reset.textContent = '↺';
    reset.addEventListener('click', () => resetComponent(component.id, true));

    row.append(visibilityLabel, selectButton, reset);
    componentList.appendChild(row);
  });
}

function updateListSelection() {
  componentList.querySelectorAll('.component-row').forEach((row) => {
    row.classList.toggle('is-selected', row.dataset.id === selectedId);
    const component = componentMap.get(row.dataset.id);
    const checkbox = row.querySelector('.visibility-toggle');
    if (component && checkbox) checkbox.checked = component.group.visible;
  });
}

function updateInfo() {
  if (!selectedId) {
    selectedTitle.textContent = 'Nenhuma peça selecionada';
    infoTitle.textContent = 'Selecione uma peça';
    infoDescription.textContent = 'Explore o modelo para identificar a bobina, o núcleo, a armadura, os contatos e os terminais.';
    infoFunction.textContent = '—';
    infoState.textContent = '—';
    positionInputs.forEach((input) => { input.value = ''; input.disabled = true; });
    resetSelectedBtn.disabled = true;
    hideSelectedBtn.disabled = true;
    return;
  }
  const component = componentMap.get(selectedId);
  selectedTitle.textContent = component.label;
  infoTitle.textContent = component.label;
  infoDescription.textContent = component.description;
  infoFunction.textContent = component.functionText;
  infoState.textContent = componentStateText(selectedId);
  const values = component.group.position.toArray();
  positionInputs.forEach((input, index) => {
    input.disabled = false;
    input.value = values[index].toFixed(2);
  });
  resetSelectedBtn.disabled = false;
  hideSelectedBtn.disabled = false;
}

function selectComponent(id) {
  const component = componentMap.get(id);
  if (!component || !component.group.visible) return;
  selectedId = id;
  transform.attach(component.group);
  if (boxHelper) scene.remove(boxHelper);
  boxHelper = new THREE.BoxHelper(component.group, 0x59d0ff);
  scene.add(boxHelper);
  updateListSelection();
  updateInfo();
}

function clearSelection() {
  selectedId = null;
  transform.detach();
  if (boxHelper) {
    scene.remove(boxHelper);
    boxHelper = null;
  }
  updateListSelection();
  updateInfo();
}

function resetComponent(id, animate = false) {
  const component = componentMap.get(id);
  if (!component) return;
  const target = {
    position: component.initialPosition.clone(),
    rotation: component.initialRotation.clone(),
    scale: component.initialScale.clone()
  };
  component.group.visible = true;
  if (animate && !reducedMotion) {
    tweenTransforms(new Map([[id, target]]), 360);
  } else {
    component.group.position.copy(target.position);
    component.group.rotation.copy(target.rotation);
    component.group.scale.copy(target.scale);
    refreshAfterTransform();
  }
}

function computeTarget(component) {
  const position = component.initialPosition.clone();
  if (isExploded) position.add(component.explodeOffset);
  if (isEnergized) position.add(component.energizedOffset);
  return { position, rotation: component.initialRotation.clone(), scale: component.initialScale.clone() };
}

function applyMachineState(animated = true) {
  const targets = new Map();
  componentMap.forEach((component, id) => targets.set(id, computeTarget(component)));
  if (animated && !reducedMotion) tweenTransforms(targets, 620);
  else {
    targets.forEach((target, id) => {
      const component = componentMap.get(id);
      component.group.position.copy(target.position);
      component.group.rotation.copy(target.rotation);
      component.group.scale.copy(target.scale);
    });
    refreshAfterTransform();
  }
  fieldGroup.visible = isEnergized && !isExploded;
  materials.coil.emissive.setHex(isEnergized ? 0x5a2105 : 0x000000);
  materials.coil.emissiveIntensity = isEnergized ? 0.8 : 0;
  statusBadge.textContent = isEnergized ? 'Bobina energizada · contatos fechados' : 'Bobina desenergizada · contatos abertos';
  statusBadge.classList.toggle('is-on', isEnergized);
  energizeBtn.setAttribute('aria-pressed', String(isEnergized));
  energizeBtn.textContent = isEnergized ? 'Desenergizar bobina' : 'Energizar bobina';
  updateInfo();
}

function tweenTransforms(targets, duration = 500) {
  const token = ++animationToken;
  const start = performance.now();
  const starts = new Map();
  targets.forEach((target, id) => {
    const group = componentMap.get(id)?.group;
    if (!group) return;
    starts.set(id, {
      position: group.position.clone(),
      rotation: group.rotation.clone(),
      scale: group.scale.clone()
    });
  });

  function frame(now) {
    if (token !== animationToken) return;
    const raw = Math.min(1, (now - start) / duration);
    const t = 1 - Math.pow(1 - raw, 3);
    targets.forEach((target, id) => {
      const component = componentMap.get(id);
      const from = starts.get(id);
      if (!component || !from) return;
      component.group.position.lerpVectors(from.position, target.position, t);
      component.group.rotation.set(
        THREE.MathUtils.lerp(from.rotation.x, target.rotation.x, t),
        THREE.MathUtils.lerp(from.rotation.y, target.rotation.y, t),
        THREE.MathUtils.lerp(from.rotation.z, target.rotation.z, t)
      );
      component.group.scale.lerpVectors(from.scale, target.scale, t);
    });
    refreshAfterTransform();
    if (raw < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function refreshAfterTransform() {
  if (boxHelper) boxHelper.update();
  updateInfo();
}

transform.addEventListener('dragging-changed', (event) => {
  orbit.enabled = !event.value;
});
transform.addEventListener('change', refreshAfterTransform);

modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const mode = button.dataset.mode;
    transform.setMode(mode);
    modeButtons.forEach((item) => item.classList.toggle('is-active', item === button));
  });
});

positionInputs.forEach((input, index) => {
  input.addEventListener('change', () => {
    if (!selectedId) return;
    const value = Number(input.value);
    if (!Number.isFinite(value)) return updateInfo();
    componentMap.get(selectedId).group.position.setComponent(index, THREE.MathUtils.clamp(value, -20, 20));
    refreshAfterTransform();
  });
});

energizeBtn.addEventListener('click', () => {
  isEnergized = !isEnergized;
  applyMachineState(true);
});
explodeBtn.addEventListener('click', () => {
  isExploded = true;
  applyMachineState(true);
});
assembleBtn.addEventListener('click', () => {
  isExploded = false;
  applyMachineState(true);
});
showAllBtn.addEventListener('click', () => {
  componentMap.forEach((component) => { component.group.visible = true; });
  updateListSelection();
});
resetSelectedBtn.addEventListener('click', () => selectedId && resetComponent(selectedId, true));
hideSelectedBtn.addEventListener('click', () => {
  if (!selectedId) return;
  componentMap.get(selectedId).group.visible = false;
  clearSelection();
});

function serializeLayout() {
  const components = {};
  componentMap.forEach((component, id) => {
    components[id] = {
      position: component.group.position.toArray(),
      rotation: [component.group.rotation.x, component.group.rotation.y, component.group.rotation.z],
      scale: component.group.scale.toArray(),
      visible: component.group.visible
    };
  });
  return { version: 1, isExploded, isEnergized, components };
}

function applyLayout(payload) {
  if (!payload || payload.version !== 1 || !payload.components) throw new Error('Formato de layout inválido.');
  componentMap.forEach((component, id) => {
    const state = payload.components[id];
    if (!state) return;
    if (Array.isArray(state.position) && state.position.length === 3) component.group.position.fromArray(state.position.map(Number));
    if (Array.isArray(state.rotation) && state.rotation.length === 3) component.group.rotation.set(...state.rotation.map(Number));
    if (Array.isArray(state.scale) && state.scale.length === 3) component.group.scale.fromArray(state.scale.map(Number));
    if (typeof state.visible === 'boolean') component.group.visible = state.visible;
  });
  isExploded = Boolean(payload.isExploded);
  isEnergized = Boolean(payload.isEnergized);
  fieldGroup.visible = isEnergized && !isExploded;
  materials.coil.emissive.setHex(isEnergized ? 0x5a2105 : 0x000000);
  materials.coil.emissiveIntensity = isEnergized ? 0.8 : 0;
  statusBadge.textContent = isEnergized ? 'Bobina energizada · contatos fechados' : 'Bobina desenergizada · contatos abertos';
  statusBadge.classList.toggle('is-on', isEnergized);
  energizeBtn.setAttribute('aria-pressed', String(isEnergized));
  energizeBtn.textContent = isEnergized ? 'Desenergizar bobina' : 'Energizar bobina';
  if (selectedId && !componentMap.get(selectedId).group.visible) clearSelection();
  updateListSelection();
  refreshAfterTransform();
}

function toast(message) {
  loading.textContent = message;
  loading.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { loading.hidden = true; }, 1500);
}

saveBtn.addEventListener('click', () => {
  localStorage.setItem('contactor-layout-v1', JSON.stringify(serializeLayout()));
  toast('Layout salvo no navegador.');
});
restoreBtn.addEventListener('click', () => {
  const saved = localStorage.getItem('contactor-layout-v1');
  if (!saved) return toast('Nenhum layout salvo ainda.');
  try {
    applyLayout(JSON.parse(saved));
    toast('Layout restaurado.');
  } catch {
    toast('Não foi possível restaurar o layout.');
  }
});
exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(serializeLayout(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'contator-layout.json';
  link.click();
  URL.revokeObjectURL(url);
});
importInput.addEventListener('change', async () => {
  const file = importInput.files?.[0];
  if (!file) return;
  try {
    applyLayout(JSON.parse(await file.text()));
    toast('Layout importado.');
  } catch {
    toast('Arquivo JSON inválido.');
  } finally {
    importInput.value = '';
  }
});
resetAllBtn.addEventListener('click', () => {
  animationToken += 1;
  isExploded = false;
  isEnergized = false;
  componentMap.forEach((component) => {
    component.group.visible = true;
    component.group.position.copy(component.initialPosition);
    component.group.rotation.copy(component.initialRotation);
    component.group.scale.copy(component.initialScale);
  });
  clearSelection();
  applyMachineState(false);
  updateListSelection();
  toast('Cena restaurada.');
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDown = null;
let transformDragging = false;
transform.addEventListener('mouseDown', () => { transformDragging = true; });
transform.addEventListener('mouseUp', () => { setTimeout(() => { transformDragging = false; }, 0); });
renderer.domElement.addEventListener('pointerdown', (event) => {
  pointerDown = { x: event.clientX, y: event.clientY };
});
renderer.domElement.addEventListener('pointerup', (event) => {
  if (!pointerDown || transformDragging) return;
  const distance = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
  pointerDown = null;
  if (distance > 5) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const visibleMeshes = [];
  componentMap.forEach((component) => {
    if (component.group.visible) component.group.traverse((child) => child.isMesh && visibleMeshes.push(child));
  });
  const hit = raycaster.intersectObjects(visibleMeshes, false)[0];
  if (hit?.object?.userData?.componentId) selectComponent(hit.object.userData.componentId);
  else clearSelection();
});

window.addEventListener('keydown', (event) => {
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return;
  if (event.key === 'w' || event.key === 'W') transform.setMode('translate');
  if (event.key === 'e' || event.key === 'E') transform.setMode('rotate');
  if (event.key === 'r' || event.key === 'R') transform.setMode('scale');
  if (event.key === 'Escape') clearSelection();
  if (event.key === 'Delete' && selectedId) {
    componentMap.get(selectedId).group.visible = false;
    clearSelection();
  }
  const mode = transform.getMode();
  modeButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.mode === mode));
});

const resizeObserver = new ResizeObserver(() => {
  const rect = viewport.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});
resizeObserver.observe(viewport);

buildComponentList();
updateInfo();
applyMachineState(false);
loading.hidden = true;

function animate() {
  orbit.update();
  if (boxHelper) boxHelper.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
