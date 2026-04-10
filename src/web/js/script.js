// script.js - Основной скрипт для 3D-приложения датчика (touch-first)

const state = {
    scene: null,
    camera: null,
    renderer: null,
    pmremGenerator: null,
    modelPivot: null,
    modelRoot: null,
    activeModelIndex: 0,
    topMesh: null,
    activeTextureIndex: 0,
    openTextureGroupId: null,
    textureCache: new Map(),
    fallbackTexture: null,
    dragging: false,
    pointerId: null,
    dragStartX: 0,
    dragStartY: 0,
    startYaw: 0,
    startPitch: 0,
    yaw: 0,
    pitch: 0,
    targetYaw: 0,
    targetPitch: 0,
    warnedMultiMaterial: false,
    textureLoader: null,
    rgbeLoader: null,
    gltfLoader: null,
    fileLoader: null,
    loadingTotal: 0,
    loadingDone: 0,
    loadingStages: {},
    loadingStageText: 'Подготовка...',
    shadowPlane: null,
    shadowLight: null,
    autoRotateOffset: 0,
    lastUserRotateAtMs: 0,
    prevFrameMs: 0,
    texturePressTimers: new WeakMap(),
    texturePressOverlays: new WeakMap(),
    sounds: {
        select: null,
        apply: null
    },
    pendingTextureApplyTimeout: null,
    pendingTextureApplyRequestId: 0,
    zoomMinZ: null,
    zoomMaxZ: null,
    ambientOcclusionTexture: null
};

const tempBox = new THREE.Box3();
const tempVec = new THREE.Vector3();
const tempSphere = new THREE.Sphere();
const eulerBase = new THREE.Euler();
const qPitch = new THREE.Quaternion();
const qYaw = new THREE.Quaternion();
const qAuto = new THREE.Quaternion();
const qBase = new THREE.Quaternion();
const qFinal = new THREE.Quaternion();
const WORLD_AXIS_X = new THREE.Vector3(1, 0, 0);
const WORLD_AXIS_Y = new THREE.Vector3(0, 1, 0);
const WORLD_AXIS_Z = new THREE.Vector3(0, 0, 1);
const ZOOM_ICON_PATHS = [
    'assets/bootstrap-icons-1.13.1/zoom-out.svg',
    'assets/bootstrap-icons-1.13.1/zoom-in.svg'
];
const MODEL_ITEMS = getModelItems();
const SOUND_PATHS = [
    { key: 'select', path: SOUND.selectPath },
    { key: 'apply', path: SOUND.applyPath }
];
const TEXTURE_ITEMS = getTextureItems();

init();

function init() {
    const now = performance.now();
    state.lastUserRotateAtMs = now;
    state.prevFrameMs = now;

    applyBodySizeFromConfig();
    applyThemeFromConfig();
    createScene();
    setupLights();
    setupTouchRotation();
    setupLoadingLine();
    startLoadingPipeline().catch((error) => {
        console.error('Ошибка инициализации загрузки:', error);
        finishLoadingLine();
    });

    window.addEventListener('resize', onWindowResize);
    animate();
}

function createScene() {
    state.scene = new THREE.Scene();
    const viewport = getCanvasViewportSize();

    state.camera = new THREE.PerspectiveCamera(
        CAMERA.fov,
        viewport.width / viewport.height,
        CAMERA.near,
        CAMERA.far
    );
    state.camera.position.set(CAMERA.position.x, CAMERA.position.y, CAMERA.position.z);
    state.camera.lookAt(0, 0, 0);

    state.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    state.renderer.setSize(viewport.width, viewport.height);
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    state.renderer.outputEncoding = THREE.sRGBEncoding;
    state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    state.renderer.toneMappingExposure = RENDERER.toneMappingExposure;
    state.renderer.setClearColor(RENDERER.clearColor, 0);
    state.renderer.shadowMap.enabled = Boolean(SHADOW.enabled);
    state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    state.pmremGenerator = new THREE.PMREMGenerator(state.renderer);
    state.pmremGenerator.compileEquirectangularShader();

    const container = document.getElementById('canvas-container');
    container.appendChild(state.renderer.domElement);
    if (RENDERER.useEnvironmentAsBackground && RENDERER.fitBackgroundToViewport) {
        applyFittedPageBackground(PATHS.hdriJpgFallback);
    } else {
        container.style.backgroundImage = 'none';
    }
}

function setupLights() {
    const ambient = new THREE.AmbientLight(LIGHTING.ambient.color, LIGHTING.ambient.intensity);
    state.scene.add(ambient);

    const key = new THREE.DirectionalLight(LIGHTING.key.color, LIGHTING.key.intensity);
    key.position.set(LIGHTING.key.position.x, LIGHTING.key.position.y, LIGHTING.key.position.z);
    state.scene.add(key);

    const fill = new THREE.DirectionalLight(LIGHTING.fill.color, LIGHTING.fill.intensity);
    fill.position.set(LIGHTING.fill.position.x, LIGHTING.fill.position.y, LIGHTING.fill.position.z);
    state.scene.add(fill);
}

function setupLoadingLine() {
    state.loadingTotal = 0;
    state.loadingDone = 0;
    state.loadingStages = {};
    updateLoadingLine(0);
    updateLoadingStatus('Подготовка...');
}

async function startLoadingPipeline() {
    updateLoadingStatus('Проверка библиотек...');
    const dependencies = ensureDependenciesLoaded();
    const loadingStages = {
        dependencies: { total: dependencies.length, text: 'Проверка библиотек...', priority: 100 },
        environment: { total: 1, text: 'Загрузка карты освещения...', priority: 80 },
        model: { total: 1, text: 'Загрузка модели...', priority: 90 },
        textures: { total: TEXTURE_ITEMS.length, text: 'Загрузка текстур...', priority: 95 },
        icons: { total: ZOOM_ICON_PATHS.length, text: 'Загрузка иконок...', priority: 10 }
    };

    if (SOUND.enabled) {
        loadingStages.sounds = { total: SOUND_PATHS.length, text: 'Загрузка звуков...', priority: 60 };
    }

    setupLoadingStages(loadingStages);

    dependencies.forEach(() => markLoadingStepDone('dependencies'));

    state.textureLoader = new THREE.TextureLoader();
    state.rgbeLoader = new THREE.RGBELoader();
    state.gltfLoader = new THREE.GLTFLoader();
    state.fileLoader = new THREE.FileLoader();

    const loadingTasks = [
        preloadEnvironment(),
        preloadModel(),
        preloadAllStickerTextures(),
        preloadZoomIcons()
    ];

    if (SOUND.enabled) {
        loadingTasks.push(preloadSounds());
    }

    const [environmentResult, modelResult] = await Promise.all(loadingTasks);

    if (environmentResult && environmentResult.envMap) {
        state.scene.environment = environmentResult.envMap;
        if (RENDERER.useEnvironmentAsBackground) {
            if (!RENDERER.fitBackgroundToViewport) {
                state.scene.background = environmentResult.backgroundTexture || environmentResult.envMap;
            }
        }
    }

    if (modelResult && modelResult.scene) {
        initializeLoadedModel(modelResult.scene);
    }

    setupUI();
    applyTexture(state.activeTextureIndex, false);
    updateLoadingStatus('Готово');
    finishLoadingLine();
}

function ensureDependenciesLoaded() {
    const checks = [
        { name: 'THREE', ok: typeof window.THREE !== 'undefined' },
        { name: 'GLTFLoader', ok: typeof THREE.GLTFLoader !== 'undefined' },
        { name: 'RGBELoader', ok: typeof THREE.RGBELoader !== 'undefined' }
    ];

    const missing = checks.filter((item) => !item.ok);
    if (missing.length > 0) {
        const names = missing.map((item) => item.name).join(', ');
        throw new Error(`Не загружены библиотеки: ${names}`);
    }
    return checks;
}

async function preloadEnvironment() {
    const source = getEnvironmentSource();

    if (source === 'hdr') {
        return loadHdrEnvironment();
    }

    if (source === 'jpg') {
        return loadJpgEnvironment();
    }

    try {
        return await loadHdrEnvironment(false);
    } catch (error) {
        console.warn('HDRI .hdr не загрузился, пробую jpg fallback');
        return loadJpgEnvironment();
    }
}

async function loadHdrEnvironment(markDoneOnFinish = true) {
    try {
        const hdrTexture = await loadRgbeTexture(PATHS.hdriHdr);
        hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
        const envMap = state.pmremGenerator.fromEquirectangular(hdrTexture).texture;
        if (markDoneOnFinish) {
            markLoadingStepDone('environment');
        }
        return { envMap, backgroundTexture: hdrTexture };
    } catch (error) {
        if (markDoneOnFinish) {
            markLoadingStepDone('environment');
        }
        throw error;
    }
}

async function loadJpgEnvironment() {
    try {
        const jpgTexture = await loadTexture(PATHS.hdriJpgFallback);
        jpgTexture.mapping = THREE.EquirectangularReflectionMapping;
        markLoadingStepDone('environment');
        return { envMap: jpgTexture, backgroundTexture: jpgTexture };
    } catch (error) {
        console.warn('Окружение не загружено. Останется только студийный свет.');
        markLoadingStepDone('environment');
        return null;
    }
}

async function preloadModel() {
    try {
        const gltf = await loadGltf(getActiveModelPath());
        markLoadingStepDone('model');
        return { scene: gltf.scene };
    } catch (error) {
        console.error('Ошибка загрузки модели:', error);
        markLoadingStepDone('model');
        return null;
    }
}

async function preloadAllStickerTextures() {
    for (let i = 0; i < TEXTURE_ITEMS.length; i += 1) {
        const entry = TEXTURE_ITEMS[i];
        try {
            const texture = await loadTexture(entry.url);
            prepareStickerTexture(texture);
            state.textureCache.set(entry.url, texture);
        } catch (error) {
            console.warn('Текстура не загрузилась, включен fallback:', entry.url);
            if (!state.fallbackTexture) {
                state.fallbackTexture = createFallbackTexture();
            }
            state.textureCache.set(entry.url, state.fallbackTexture);
        } finally {
            markLoadingStepDone('textures');
        }
    }
}

async function preloadZoomIcons() {
    for (let i = 0; i < ZOOM_ICON_PATHS.length; i += 1) {
        const iconUrl = ZOOM_ICON_PATHS[i];
        try {
            await loadFile(iconUrl);
        } catch (error) {
            console.warn('Иконка зума не загрузилась:', iconUrl);
        } finally {
            markLoadingStepDone('icons');
        }
    }
}

async function preloadSounds() {
    for (let i = 0; i < SOUND_PATHS.length; i += 1) {
        const entry = SOUND_PATHS[i];
        try {
            state.sounds[entry.key] = await loadAudio(entry.path);
        } catch (error) {
            console.warn('Звук не загрузился:', entry.path);
            state.sounds[entry.key] = null;
        } finally {
            markLoadingStepDone('sounds');
        }
    }
}

function loadTexture(url) {
    return new Promise((resolve, reject) => {
        state.textureLoader.load(url, resolve, undefined, reject);
    });
}

function loadRgbeTexture(url) {
    return new Promise((resolve, reject) => {
        state.rgbeLoader.load(url, resolve, undefined, reject);
    });
}

function loadGltf(url) {
    return new Promise((resolve, reject) => {
        state.gltfLoader.load(url, resolve, undefined, reject);
    });
}

function loadFile(url) {
    return new Promise((resolve, reject) => {
        state.fileLoader.load(url, resolve, undefined, reject);
    });
}

function loadAudio(url) {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        let done = false;

        const cleanup = () => {
            audio.removeEventListener('canplaythrough', onReady);
            audio.removeEventListener('loadeddata', onReady);
            audio.removeEventListener('error', onError);
        };

        const onReady = () => {
            if (done) return;
            done = true;
            cleanup();
            resolve(audio);
        };

        const onError = () => {
            if (done) return;
            done = true;
            cleanup();
            reject(new Error(`Audio load failed: ${url}`));
        };

        audio.preload = 'auto';
        audio.addEventListener('canplaythrough', onReady);
        audio.addEventListener('loadeddata', onReady);
        audio.addEventListener('error', onError);
        audio.src = url;
        audio.load();
    });
}

function updateLoadingLine(progress01) {
    const bar = document.getElementById('loading-line');
    if (!bar) return;
    const clamped = clamp(progress01, 0, 1);
    bar.style.width = `${(clamped * 100).toFixed(2)}%`;
}

function updateLoadingStatus(text) {
    state.loadingStageText = text;
    renderLoadingStatus();
}

function setupLoadingStages(stages) {
    state.loadingStages = stages;
    state.loadingDone = 0;
    state.loadingTotal = Object.values(stages).reduce((sum, stage) => sum + (stage.total || 0), 0);
    updateLoadingLine(0);
    renderLoadingStatus();
}

function getCurrentLoadingStageText() {
    const stages = Object.values(state.loadingStages || {});
    const activeStage = stages
        .filter((stage) => stage.done < stage.total)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];

    return activeStage ? activeStage.text : state.loadingStageText;
}

function renderLoadingStatus() {
    const label = document.getElementById('loading-status');
    if (!label) return;
    if (state.loadingTotal <= 0) {
        label.textContent = state.loadingStageText;
        return;
    }
    const percent = Math.round((state.loadingDone / state.loadingTotal) * 100);
    label.textContent = `${getCurrentLoadingStageText()} ${percent}%`;
}

function markLoadingStepDone(stageKey) {
    if (stageKey && state.loadingStages[stageKey]) {
        const stage = state.loadingStages[stageKey];
        stage.done = Math.min((stage.done || 0) + 1, stage.total);
    }
    state.loadingDone += 1;
    updateLoadingLine(state.loadingDone / Math.max(state.loadingTotal, 1));
    renderLoadingStatus();
}

function finishLoadingLine() {
    updateLoadingLine(1);
    const wrap = document.getElementById('loading-line-wrap');
    if (!wrap) return;
    setTimeout(() => {
        wrap.classList.add('hidden');
    }, 150);
}

function attachModelToPivot(model) {
    if (state.modelPivot) {
        state.scene.remove(state.modelPivot);
        state.modelPivot = null;
    }

    state.modelRoot = model;
    state.modelPivot = new THREE.Group();
    state.modelPivot.name = 'model-pivot';
    state.scene.add(state.modelPivot);
    state.modelPivot.add(state.modelRoot);
    centerModel(state.modelRoot);
}

function centerModel(model) {
    tempBox.setFromObject(model);
    const center = tempBox.getCenter(new THREE.Vector3());
    model.position.set(
        -center.x + MODEL_VIEW.centerOffset.x,
        -center.y + MODEL_VIEW.centerOffset.y,
        -center.z + MODEL_VIEW.centerOffset.z
    );
}

function fitCameraToModel(model) {
    if (!model) return;

    tempBox.setFromObject(model);
    if (tempBox.isEmpty()) return;

    tempBox.getBoundingSphere(tempSphere);

    const radius = Math.max(tempSphere.radius, 0.001);
    const viewport = getCanvasViewportSize();
    const aspect = Math.max(viewport.width / Math.max(viewport.height, 1), 0.001);
    const verticalFov = THREE.MathUtils.degToRad(state.camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
    const limitingHalfFov = Math.min(verticalFov, horizontalFov) / 2;
    const padding = Math.max(MODEL_VIEW.fitPadding || 1, 0.001);
    const targetDistance = (radius / Math.sin(Math.max(limitingHalfFov, 0.001))) * padding;

    const offsetX = CAMERA.position.x;
    const offsetY = CAMERA.position.y;
    const xyDistanceSq = (offsetX * offsetX) + (offsetY * offsetY);
    const safeDistance = Math.max(targetDistance, Math.sqrt(xyDistanceSq) + 0.001);
    const zSign = CAMERA.position.z < 0 ? -1 : 1;
    const fittedZ = Math.sqrt(Math.max((safeDistance * safeDistance) - xyDistanceSq, 0.001)) * zSign;

    state.camera.position.set(offsetX, offsetY, fittedZ);
    updateZoomBounds(fittedZ);
    state.camera.lookAt(0, 0, 0);
    state.camera.near = Math.max(safeDistance / 100, 0.01);
    state.camera.far = Math.max(safeDistance * 10, state.camera.near + 1);
    state.camera.updateProjectionMatrix();
}

function updateZoomBounds(referenceZ) {
    state.zoomMinZ = Math.min(INTERACTION.minZoomZ, INTERACTION.maxZoomZ, referenceZ);
    state.zoomMaxZ = Math.max(INTERACTION.minZoomZ, INTERACTION.maxZoomZ, referenceZ);
}

function setupModelShadow(model) {
    if (!SHADOW.enabled || !model) return;
    removeModelShadow();

    // Все меши модели отбрасывают тень.
    model.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = true;
    });

    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const height = Math.max(size.y, 0.001);
    const maxXZ = Math.max(size.x, size.z, 0.001);
    const dominantSize = Math.max(size.x, size.y, size.z, 0.001);
    const planeOffset = Math.max(height * SHADOW.planeOffsetRatio, SHADOW.planeOffsetMin);
    const planeSize = Math.max(maxXZ * (1 + (SHADOW.planePadding * 2)), 1);
    const planeY = bounds.min.y - planeOffset;
    const targetY = bounds.min.y + (height * SHADOW.targetHeightRatio);

    const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMaterial = new THREE.ShadowMaterial({
        color: SHADOW.color,
        opacity: SHADOW.intensity
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(center.x, planeY, center.z);
    plane.receiveShadow = true;
    state.scene.add(plane);
    state.shadowPlane = plane;

    const shadowLight = new THREE.DirectionalLight(0xffffff, SHADOW.lightIntensity);
    const lightOffsetX = Math.max(dominantSize * SHADOW.lightOffsetRatio.x, SHADOW.lightOffsetMin.x);
    const lightOffsetY = Math.max(dominantSize * SHADOW.lightOffsetRatio.y, SHADOW.lightOffsetMin.y);
    const lightOffsetZ = Math.max(dominantSize * SHADOW.lightOffsetRatio.z, SHADOW.lightOffsetMin.z);
    shadowLight.position.set(
        center.x + lightOffsetX,
        center.y + lightOffsetY,
        center.z + lightOffsetZ
    );
    shadowLight.target.position.set(center.x, targetY, center.z);
    shadowLight.castShadow = true;
    shadowLight.shadow.mapSize.set(SHADOW.mapSize, SHADOW.mapSize);
    shadowLight.shadow.radius = SHADOW.blur;
    shadowLight.shadow.bias = SHADOW.bias;
    shadowLight.shadow.normalBias = SHADOW.normalBias;

    const frustumHalf = Math.max((maxXZ * 0.5) * (1 + SHADOW.frustumPadding), 1);
    shadowLight.shadow.camera.left = -frustumHalf;
    shadowLight.shadow.camera.right = frustumHalf;
    shadowLight.shadow.camera.top = frustumHalf;
    shadowLight.shadow.camera.bottom = -frustumHalf;
    shadowLight.shadow.camera.near = SHADOW.cameraNear;
    shadowLight.shadow.camera.far = Math.max(dominantSize * SHADOW.cameraFarRatio, SHADOW.cameraNear + 1);

    state.scene.add(shadowLight);
    state.scene.add(shadowLight.target);
    state.shadowLight = shadowLight;
}

function removeModelShadow() {
    if (state.shadowPlane) {
        state.shadowPlane.geometry.dispose();
        state.shadowPlane.material.dispose();
        state.scene.remove(state.shadowPlane);
        state.shadowPlane = null;
    }
    if (state.shadowLight) {
        state.scene.remove(state.shadowLight.target);
        state.scene.remove(state.shadowLight);
        state.shadowLight = null;
    }
}

function findTopMesh(root) {
    let exactMatch = null;
    const candidates = [];

    root.traverse((child) => {
        if (!child.isMesh) return;
        candidates.push(child);

        if (MESH.topSurfaceNames.includes(child.name)) {
            exactMatch = child;
        }
    });

    if (exactMatch) {
        console.log('Верхний mesh найден по имени:', exactMatch.name);
        return exactMatch;
    }

    if (candidates.length === 0) return null;

    let bestCandidate = null;
    let bestScore = -Infinity;
    for (let i = 0; i < candidates.length; i += 1) {
        const mesh = candidates[i];
        tempBox.setFromObject(mesh);
        const centerY = tempBox.getCenter(tempVec).y;
        const size = tempBox.getSize(new THREE.Vector3());
        const score = centerY * 2 - size.y;
        if (score > bestScore) {
            bestScore = score;
            bestCandidate = mesh;
        }
    }

    if (bestCandidate) {
        console.warn('Точный mesh верхней поверхности не найден. Использован эвристический кандидат:', bestCandidate.name || '(без имени)');
    }
    return bestCandidate;
}

function ensureTopMeshTextureCoordinates(mesh) {
    if (!mesh || !mesh.geometry || !mesh.geometry.isBufferGeometry) return;
    if (!TEXTURE_PROJECTION.enabledForMissingUv) return;

    const geometry = mesh.geometry;
    const uv = geometry.getAttribute('uv');
    if (uv && uv.count > 0) return;

    const generatedUv = createAutoProjectedUvAttribute(geometry);
    if (!generatedUv) {
        console.warn('Не удалось сгенерировать UV для верхнего mesh:', mesh.name || '(без имени)');
        return;
    }

    geometry.setAttribute('uv', generatedUv);
    console.warn('Для верхнего mesh автоматически сгенерированы UV:', mesh.name || '(без имени)');
}

function createAutoProjectedUvAttribute(geometry) {
    const position = geometry.getAttribute('position');
    if (!position || position.count === 0) return null;

    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox;
    if (!bounds) return null;

    const mode = getTextureProjectionMode(geometry, bounds);
    if (mode === 'cylindrical') {
        return buildCylindricalUvAttribute(position, bounds);
    }
    return buildPlanarUvAttribute(position, bounds);
}

function ensureUv2Attribute(geometry) {
    if (!geometry || !geometry.isBufferGeometry) return false;

    const uv2 = geometry.getAttribute('uv2');
    if (uv2 && uv2.count > 0) return true;

    const uv = geometry.getAttribute('uv');
    if (uv && uv.count > 0) {
        geometry.setAttribute('uv2', uv.clone());
        return true;
    }

    const generatedUv = createAutoProjectedUvAttribute(geometry);
    if (!generatedUv) return false;
    geometry.setAttribute('uv', generatedUv);
    geometry.setAttribute('uv2', generatedUv.clone());
    return true;
}

function applyAmbientOcclusionToModel(root) {
    if (!AMBIENT_OCCLUSION.enabled || !root) return;

    root.traverse((child) => {
        if (!child.isMesh || !child.geometry) return;
        if (shouldSkipAmbientOcclusion(child)) return;
        if (!ensureUv2Attribute(child.geometry)) return;

        if (Array.isArray(child.material)) {
            for (let i = 0; i < child.material.length; i += 1) {
                child.material[i] = applyAmbientOcclusionToMaterial(child.material[i]);
            }
            return;
        }

        child.material = applyAmbientOcclusionToMaterial(child.material);
    });
}

function shouldSkipAmbientOcclusion(mesh) {
    const meshName = String(mesh.name || '').toLowerCase();
    const excludedNames = Array.isArray(AMBIENT_OCCLUSION.excludeMeshNames)
        ? AMBIENT_OCCLUSION.excludeMeshNames
        : [];

    for (let i = 0; i < excludedNames.length; i += 1) {
        if (meshName === String(excludedNames[i]).toLowerCase()) {
            return true;
        }
    }

    return false;
}

function applyAmbientOcclusionToMaterial(material) {
    if (!material || !material.isMaterial) return material;
    if (!('aoMap' in material)) return material;

    const nextMaterial = material.userData.__isClonedForAo
        ? material
        : material.clone();

    nextMaterial.userData.__isClonedForAo = true;
    nextMaterial.aoMap = getAmbientOcclusionTexture();
    nextMaterial.aoMapIntensity = AMBIENT_OCCLUSION.intensity;
    nextMaterial.needsUpdate = true;
    return nextMaterial;
}

function getAmbientOcclusionTexture() {
    if (state.ambientOcclusionTexture) {
        return state.ambientOcclusionTexture;
    }

    const size = Math.max(AMBIENT_OCCLUSION.textureSize || 256, 16);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    const centerBrightness = clamp(AMBIENT_OCCLUSION.centerBrightness, 0, 1);
    const edgeDarkness = clamp(AMBIENT_OCCLUSION.edgeDarkness, 0, 1);
    const power = Math.max(AMBIENT_OCCLUSION.power || 1, 0.01);

    for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
            const u = x / Math.max(size - 1, 1);
            const v = y / Math.max(size - 1, 1);
            const edge = Math.min(u, 1 - u, v, 1 - v) * 2;
            const edgeFactor = Math.pow(clamp(edge, 0, 1), power);
            const brightness = edgeDarkness + ((centerBrightness - edgeDarkness) * edgeFactor);
            const color = Math.round(brightness * 255);
            const offset = (y * size + x) * 4;
            data[offset + 0] = color;
            data[offset + 1] = color;
            data[offset + 2] = color;
            data[offset + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.flipY = false;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    state.ambientOcclusionTexture = texture;
    return texture;
}

function getTextureProjectionMode(geometry, bounds) {
    const configuredMode = String(TEXTURE_PROJECTION.mode || 'auto').toLowerCase();
    if (configuredMode === 'planar' || configuredMode === 'cylindrical') {
        return configuredMode;
    }

    const normal = geometry.getAttribute('normal');
    if (!normal || normal.count === 0) {
        return 'planar';
    }

    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;
    for (let i = 0; i < normal.count; i += 1) {
        sumX += Math.abs(normal.getX(i));
        sumY += Math.abs(normal.getY(i));
        sumZ += Math.abs(normal.getZ(i));
    }

    const avgX = sumX / normal.count;
    const avgY = sumY / normal.count;
    const avgZ = sumZ / normal.count;
    const dominantNormal = Math.max(avgX, avgY, avgZ);
    if (dominantNormal >= TEXTURE_PROJECTION.normalPlanarThreshold) {
        return 'planar';
    }

    const size = bounds.getSize(new THREE.Vector3());
    const minSize = Math.min(size.x, size.y, size.z);
    const maxSize = Math.max(size.x, size.y, size.z, 0.001);
    const flatness = minSize / maxSize;
    return flatness <= 0.08 ? 'planar' : 'cylindrical';
}

function buildPlanarUvAttribute(position, bounds) {
    const size = bounds.getSize(new THREE.Vector3());
    const min = bounds.min;
    const padding = clamp(TEXTURE_PROJECTION.padding, 0, 0.49);
    const uvArray = new Float32Array(position.count * 2);
    const projection = getPlanarProjectionAxes(size);
    const rangeU = Math.max(projection.sizeU, 0.000001);
    const rangeV = Math.max(projection.sizeV, 0.000001);
    const scale = 1 - (padding * 2);

    for (let i = 0; i < position.count; i += 1) {
        const uRaw = (getPositionAxisValue(position, i, projection.axisU) - min[projection.axisU]) / rangeU;
        const vRaw = (getPositionAxisValue(position, i, projection.axisV) - min[projection.axisV]) / rangeV;
        uvArray[(i * 2) + 0] = padding + (uRaw * scale);
        uvArray[(i * 2) + 1] = padding + (vRaw * scale);
    }

    return new THREE.Float32BufferAttribute(uvArray, 2);
}

function getPlanarProjectionAxes(size) {
    const axes = [
        { key: 'x', size: size.x },
        { key: 'y', size: size.y },
        { key: 'z', size: size.z }
    ].sort((a, b) => b.size - a.size);

    return {
        axisU: axes[0].key,
        axisV: axes[1].key,
        sizeU: axes[0].size,
        sizeV: axes[1].size
    };
}

function buildCylindricalUvAttribute(position, bounds) {
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const padding = clamp(TEXTURE_PROJECTION.padding, 0, 0.49);
    const uvArray = new Float32Array(position.count * 2);
    const axis = getCylindricalAxis(size);
    const scale = 1 - (padding * 2);
    const heightMin = bounds.min[axis];
    const heightRange = Math.max(size[axis], 0.000001);

    for (let i = 0; i < position.count; i += 1) {
        const x = position.getX(i);
        const y = position.getY(i);
        const z = position.getZ(i);

        let angle = 0;
        let heightValue = 0;
        if (axis === 'x') {
            angle = Math.atan2(z - center.z, y - center.y);
            heightValue = x;
        } else if (axis === 'y') {
            angle = Math.atan2(z - center.z, x - center.x);
            heightValue = y;
        } else {
            angle = Math.atan2(y - center.y, x - center.x);
            heightValue = z;
        }

        const uRaw = (angle + Math.PI) / (Math.PI * 2);
        const vRaw = (heightValue - heightMin) / heightRange;
        uvArray[(i * 2) + 0] = padding + (uRaw * scale);
        uvArray[(i * 2) + 1] = padding + (vRaw * scale);
    }

    return new THREE.Float32BufferAttribute(uvArray, 2);
}

function getCylindricalAxis(size) {
    if (size.x <= size.y && size.x <= size.z) return 'x';
    if (size.y <= size.x && size.y <= size.z) return 'y';
    return 'z';
}

function getPositionAxisValue(position, index, axis) {
    if (axis === 'x') return position.getX(index);
    if (axis === 'y') return position.getY(index);
    return position.getZ(index);
}

function setupUI() {
    const textureGroupsPanel = document.getElementById('texture-groups-panel');
    const modelPanel = document.getElementById('model-panel');
    const zoomPanel = document.getElementById('zoom-panel');

    textureGroupsPanel.innerHTML = '';
    modelPanel.innerHTML = '';
    zoomPanel.innerHTML = '';
    zoomPanel.hidden = !UI.showZoomPanel;

    if (UI.showZoomPanel) {
        zoomPanel.appendChild(createZoomButton(
            'assets/bootstrap-icons-1.13.1/zoom-out.svg',
            'Отдалить',
            INTERACTION.zoomStep
        ));
    }

    for (let i = 0; i < TEXTURES.length; i += 1) {
        textureGroupsPanel.appendChild(createTextureGroup(TEXTURES[i]));
    }
    syncTextureGroups(false);

    for (let i = 0; i < MODEL_ITEMS.length; i += 1) {
        modelPanel.appendChild(createModelButton(MODEL_ITEMS[i], i));
    }

    if (UI.showZoomPanel) {
        zoomPanel.appendChild(createZoomButton(
            'assets/bootstrap-icons-1.13.1/zoom-in.svg',
            'Приблизить',
            -INTERACTION.zoomStep
        ));
    }

    updateSelectedTextureButton(state.activeTextureIndex);
    updateSelectedModelButton(state.activeModelIndex);
}

function createTextureGroup(group) {
    const wrapper = document.createElement('section');
    wrapper.className = 'texture-group glass glass-strong';
    wrapper.dataset.groupId = group.id;

    const isOpen = group.id === state.openTextureGroupId;
    if (isOpen) {
        wrapper.classList.add('is-open');
    }

    const header = document.createElement('button');
    header.type = 'button';
    header.className = 'texture-group-header';
    header.setAttribute('aria-expanded', String(isOpen));

    const title = document.createElement('span');
    title.className = 'texture-group-title';
    title.textContent = group.name;
    header.appendChild(title);

    const arrow = document.createElement('span');
    arrow.className = 'texture-group-arrow';
    header.appendChild(arrow);

    header.addEventListener('click', () => {
        state.openTextureGroupId = state.openTextureGroupId === group.id ? null : group.id;
        syncTextureGroups(true);
    });

    wrapper.appendChild(header);

    const body = document.createElement('div');
    body.className = 'texture-group-body';

    const grid = document.createElement('div');
    grid.className = 'texture-grid';

    for (let i = 0; i < group.items.length; i += 1) {
        const texture = group.items[i];
        const flatIndex = findTextureIndexById(texture.id);
        if (flatIndex === -1) continue;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'texture-btn';
        button.title = texture.name;
        button.setAttribute('aria-label', texture.name);
        button.dataset.index = String(flatIndex);
        button.dataset.textureId = texture.id;

        const img = document.createElement('img');
        img.className = 'texture-preview';
        img.src = texture.url;
        img.alt = texture.name;
        img.draggable = false;

        button.appendChild(img);
        setupTexturePressAnimation(button, flatIndex);
        grid.appendChild(button);
    }

    body.appendChild(grid);
    wrapper.appendChild(body);
    return wrapper;
}

function renderTextureGroups() {
    const textureGroupsPanel = document.getElementById('texture-groups-panel');
    if (!textureGroupsPanel) return;
    textureGroupsPanel.innerHTML = '';
    for (let i = 0; i < TEXTURES.length; i += 1) {
        textureGroupsPanel.appendChild(createTextureGroup(TEXTURES[i]));
    }
    syncTextureGroups(false);
    updateSelectedTextureButton(state.activeTextureIndex);
}

function getTextureGroupBodyHeight(body) {
    const grid = body.querySelector('.texture-grid');
    if (!grid) return 0;
    return grid.offsetHeight + 4;
}

function setTextureGroupExpanded(wrapper, shouldOpen, animate = true) {
    if (!wrapper) return;

    const body = wrapper.querySelector('.texture-group-body');
    const header = wrapper.querySelector('.texture-group-header');
    if (!body || !header) return;

    wrapper.classList.toggle('is-open', shouldOpen);
    header.setAttribute('aria-expanded', String(shouldOpen));

    const targetHeight = shouldOpen ? getTextureGroupBodyHeight(body) : 0;

    if (!animate) {
        body.style.transition = 'none';
        body.style.height = `${targetHeight}px`;
        void body.offsetHeight;
        body.style.transition = '';
        return;
    }

    if (shouldOpen) {
        body.style.height = '0px';
        void body.offsetHeight;
        body.style.height = `${targetHeight}px`;
        return;
    }

    const currentHeight = getTextureGroupBodyHeight(body);
    body.style.height = `${currentHeight}px`;
    void body.offsetHeight;
    body.style.height = '0px';
}

function syncTextureGroups(animate = true) {
    const groups = document.querySelectorAll('.texture-group');
    for (let i = 0; i < groups.length; i += 1) {
        const group = groups[i];
        const shouldOpen = group.dataset.groupId === state.openTextureGroupId;
        setTextureGroupExpanded(group, shouldOpen, animate);
    }
}

function createModelButton(model, index) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'model-btn';
    button.textContent = model.name;
    button.dataset.index = String(index);
    button.style.setProperty('--swatch-color', model.color || 'rgba(255, 255, 255, 0.82)');
    if (isDarkColor(model.color)) {
        button.classList.add('is-dark');
    }

    button.addEventListener('click', () => {
        if (index === state.activeModelIndex) return;
        setActiveModel(index);
    });

    return button;
}

function createZoomButton(iconPath, ariaLabel, zoomDelta) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'zoom-btn glass glass-soft';
    button.setAttribute('aria-label', ariaLabel);
    button.title = ariaLabel;
    button.style.touchAction = 'none';

    const icon = document.createElement('img');
    icon.className = 'zoom-icon';
    icon.src = iconPath;
    icon.alt = '';
    button.appendChild(icon);

    let zoomInterval = null;
    let activePointerId = null;

    const stopRepeat = () => {
        if (zoomInterval !== null) {
            clearInterval(zoomInterval);
            zoomInterval = null;
        }
        activePointerId = null;
    };

    button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        stopRepeat();
        activePointerId = event.pointerId;
        button.setPointerCapture(event.pointerId);

        applyZoom(zoomDelta);
        zoomInterval = setInterval(() => {
            applyZoom(zoomDelta);
        }, INTERACTION.zoomRepeatIntervalMs);
    });

    button.addEventListener('pointerup', (event) => {
        if (activePointerId !== event.pointerId) return;
        button.releasePointerCapture(event.pointerId);
        stopRepeat();
    });

    button.addEventListener('pointercancel', stopRepeat);
    button.addEventListener('lostpointercapture', stopRepeat);

    return button;
}

function setupTexturePressAnimation(button, textureIndex) {
    button.style.touchAction = 'none';

    const beginPress = (event) => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        button.dataset.pressed = '1';
        button.classList.add('is-pressing');
        const overlay = createTexturePressOverlay(button);
        state.texturePressOverlays.set(button, overlay);

        clearTexturePressTimer(button);
        animateOverlayScale(overlay, UI_ANIMATION.tapScale, 'cubic-bezier(0.16, 0.9, 0.25, 1.35)');

        const timerId = window.setTimeout(() => {
            if (button.dataset.pressed !== '1') return;
            const currentOverlay = state.texturePressOverlays.get(button);
            if (!currentOverlay) return;
            animateOverlayScale(currentOverlay, UI_ANIMATION.holdScale, 'cubic-bezier(0.2, 0.8, 0.2, 1)');
        }, UI_ANIMATION.speedMs);

        state.texturePressTimers.set(button, timerId);
    };

    const endPress = (event, shouldSelect) => {
        if (button.dataset.pressed !== '1') return;
        button.dataset.pressed = '0';

        if (button.hasPointerCapture(event.pointerId)) {
            button.releasePointerCapture(event.pointerId);
        }

        clearTexturePressTimer(button);
        const overlay = state.texturePressOverlays.get(button);
        removeTexturePressOverlay(button, overlay);
        button.classList.remove('is-pressing');

        if (shouldSelect) {
            selectTexture(textureIndex);
        }
    };

    button.addEventListener('pointerdown', beginPress);
    button.addEventListener('pointerup', (event) => endPress(event, true));
    button.addEventListener('pointercancel', (event) => endPress(event, false));
    button.addEventListener('lostpointercapture', () => {
        clearTexturePressTimer(button);
        const overlay = state.texturePressOverlays.get(button);
        removeTexturePressOverlay(button, overlay);
        button.dataset.pressed = '0';
        button.classList.remove('is-pressing');
    });
}

function clearTexturePressTimer(button) {
    const timerId = state.texturePressTimers.get(button);
    if (!timerId) return;
    window.clearTimeout(timerId);
    state.texturePressTimers.delete(button);
}

function createTexturePressOverlay(button) {
    const rect = button.getBoundingClientRect();
    const img = button.querySelector('img');

    const overlay = document.createElement('div');
    overlay.className = 'texture-press-overlay';
    overlay.style.left = `${rect.left + rect.width / 2}px`;
    overlay.style.top = `${rect.top + rect.height / 2}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;

    const overlayImg = document.createElement('img');
    overlayImg.src = img ? img.src : '';
    overlayImg.alt = '';
    overlay.appendChild(overlayImg);

    document.body.appendChild(overlay);
    return overlay;
}

function animateOverlayScale(overlay, scale, easing) {
    if (!overlay) return;
    overlay.style.transition = `transform ${UI_ANIMATION.speedMs}ms ${easing}`;
    overlay.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

function removeTexturePressOverlay(button, overlay) {
    state.texturePressOverlays.delete(button);
    if (!overlay || !overlay.parentNode) return;

    animateOverlayScale(overlay, 1, 'cubic-bezier(0.25, 0.8, 0.25, 1)');
    window.setTimeout(() => {
        if (!overlay.parentNode) return;
        overlay.parentNode.removeChild(overlay);
    }, UI_ANIMATION.speedMs);
}

function applyZoom(deltaZ) {
    const zoomMin = state.zoomMinZ !== null
        ? state.zoomMinZ
        : Math.min(INTERACTION.minZoomZ, INTERACTION.maxZoomZ);
    const zoomMax = state.zoomMaxZ !== null
        ? state.zoomMaxZ
        : Math.max(INTERACTION.minZoomZ, INTERACTION.maxZoomZ);
    const nextZ = clamp(
        state.camera.position.z + deltaZ,
        zoomMin,
        zoomMax
    );
    state.camera.position.z = nextZ;
    state.camera.lookAt(0, 0, 0);
    console.log(`[Zoom] camera.position.z = ${state.camera.position.z.toFixed(2)}`);
}

function selectTexture(index) {
    state.activeTextureIndex = index;
    const item = TEXTURE_ITEMS[index];
    if (item && item.groupId) {
        state.openTextureGroupId = item.groupId;
        syncTextureGroups(true);
    }
    updateSelectedTextureButton(index);
    playUiSound('select');
    scheduleTextureApply(index);
}

function updateSelectedTextureButton(index) {
    const buttons = document.querySelectorAll('.texture-btn');
    for (let i = 0; i < buttons.length; i += 1) {
        buttons[i].classList.toggle('selected', i === index);
    }
}

function updateSelectedModelButton(index) {
    const buttons = document.querySelectorAll('.model-btn');
    for (let i = 0; i < buttons.length; i += 1) {
        buttons[i].classList.toggle('selected', i === index);
    }
}

function setActiveModel(index) {
    state.activeModelIndex = index;
    updateSelectedModelButton(index);
    loadActiveModel().catch((error) => {
        console.error('Ошибка переключения модели:', error);
    });
}

async function loadActiveModel() {
    const gltf = await loadGltf(getActiveModelPath());
    initializeLoadedModel(gltf.scene);
    applyTexture(state.activeTextureIndex, false);
}

function initializeLoadedModel(scene) {
    attachModelToPivot(scene);
    if (MODEL_VIEW.autoFitOnLoad) {
        fitCameraToModel(state.modelPivot);
    } else {
        updateZoomBounds(state.camera.position.z);
        state.camera.lookAt(0, 0, 0);
    }

    state.topMesh = findTopMesh(state.modelRoot);
    ensureTopMeshTextureCoordinates(state.topMesh);
    applyAmbientOcclusionToModel(state.modelRoot);
    setupModelShadow(state.modelPivot);

    if (!state.topMesh) {
        console.warn('Верхний mesh не найден: смена текстуры отключена.');
    }
}

function scheduleTextureApply(index) {
    state.pendingTextureApplyRequestId += 1;
    const requestId = state.pendingTextureApplyRequestId;
    if (state.pendingTextureApplyTimeout) {
        clearTimeout(state.pendingTextureApplyTimeout);
        state.pendingTextureApplyTimeout = null;
    }

    state.pendingTextureApplyTimeout = window.setTimeout(() => {
        if (requestId !== state.pendingTextureApplyRequestId) return;
        applyTexture(index, true);
        state.pendingTextureApplyTimeout = null;
    }, SOUND.applyDelayMs);
}

function getTopMaterial() {
    if (!state.topMesh) return null;

    if (Array.isArray(state.topMesh.material)) {
        if (!state.warnedMultiMaterial) {
            console.warn('У верхнего mesh несколько материалов. Используется первый материал массива.');
            state.warnedMultiMaterial = true;
        }
        if (!state.topMesh.material[0]) return null;
        if (!state.topMesh.material[0].isMaterial) return null;
        if (!state.topMesh.material[0].userData.__isClonedForTextureSwap) {
            state.topMesh.material[0] = state.topMesh.material[0].clone();
            state.topMesh.material[0].userData.__isClonedForTextureSwap = true;
        }
        return state.topMesh.material[0];
    }

    if (!state.topMesh.material || !state.topMesh.material.isMaterial) return null;
    if (!state.topMesh.material.userData.__isClonedForTextureSwap) {
        state.topMesh.material = state.topMesh.material.clone();
        state.topMesh.material.userData.__isClonedForTextureSwap = true;
    }
    return state.topMesh.material;
}

function applyTexture(index, playApplySound) {
    if (!state.topMesh) return;
    if (index === null || index < 0 || index >= TEXTURE_ITEMS.length) return;

    const material = getTopMaterial();
    if (!material) {
        console.warn('Не удалось получить материал верхнего mesh.');
        return;
    }

    const config = TEXTURE_ITEMS[index];
    const cachedTexture = state.textureCache.get(config.url);
    if (cachedTexture) {
        if (playApplySound) playUiSound('apply');
        setMaterialTexture(material, cachedTexture);
        return;
    }

    const textureLoader = state.textureLoader || new THREE.TextureLoader();
    textureLoader.load(
        config.url,
        (texture) => {
            prepareStickerTexture(texture);
            state.textureCache.set(config.url, texture);
            if (playApplySound) playUiSound('apply');
            setMaterialTexture(material, texture);
        },
        undefined,
        () => {
            console.warn('Текстура не загрузилась, включен fallback:', config.url);
            if (!state.fallbackTexture) {
                state.fallbackTexture = createFallbackTexture();
            }
            if (playApplySound) playUiSound('apply');
            setMaterialTexture(material, state.fallbackTexture);
        }
    );
}

function playUiSound(kind) {
    if (!SOUND.enabled) return;

    const source = kind === 'apply' ? state.sounds.apply : state.sounds.select;
    const fallbackPath = kind === 'apply' ? SOUND.applyPath : SOUND.selectPath;
    const volume = kind === 'apply' ? SOUND.applyVolume : SOUND.selectVolume;

    const audio = source ? source.cloneNode() : new Audio(fallbackPath);
    audio.volume = clamp(volume, 0, 1);
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
    }
}

function setMaterialTexture(material, texture) {
    material.map = texture;
    material.needsUpdate = true;
}

function prepareStickerTexture(texture) {
    texture.encoding = THREE.sRGBEncoding;
    texture.flipY = false;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.x = TEXTURE_FLIP_HORIZONTAL ? -1 : 1;
    texture.repeat.y = TEXTURE_FLIP_VERTICAL ? -1 : 1;
    texture.offset.x = TEXTURE_FLIP_HORIZONTAL ? 1 : 0;
    texture.offset.y = TEXTURE_FLIP_VERTICAL ? 1 : 0;
    texture.center.set(0.5, 0.5);
    texture.rotation = -THREE.MathUtils.degToRad(TEXTURE_ROTATION_DEG);
}

function createFallbackTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff5a4d';
    ctx.beginPath();
    ctx.arc(128, 128, 106, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NO IMG', 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.flipY = false;
    return texture;
}

function setupTouchRotation() {
    const canvas = state.renderer.domElement;

    canvas.addEventListener('pointerdown', (event) => {
        if (event.target.closest('#texture-groups-panel, #model-panel, #zoom-panel, #top-bar')) return;
        state.dragging = true;
        state.lastUserRotateAtMs = performance.now();
        state.pointerId = event.pointerId;
        state.dragStartX = event.clientX;
        state.dragStartY = event.clientY;
        state.startYaw = state.targetYaw;
        state.startPitch = state.targetPitch;
        canvas.setPointerCapture(event.pointerId);
    });

    canvas.addEventListener('pointermove', (event) => {
        if (!state.dragging || state.pointerId !== event.pointerId) return;
        event.preventDefault();
        state.lastUserRotateAtMs = performance.now();

        const deltaX = event.clientX - state.dragStartX;
        const deltaY = event.clientY - state.dragStartY;

        const unclampedYaw = state.startYaw + deltaX * INTERACTION.dragSensitivity;
        state.targetYaw = INTERACTION.limitXaw
            ? clamp(unclampedYaw, INTERACTION.minXaw, INTERACTION.maxXaw)
            : unclampedYaw;

        const unclampedPitch = state.startPitch + deltaY * INTERACTION.dragSensitivity;
        state.targetPitch = INTERACTION.limitYaw
            ? clamp(unclampedPitch, INTERACTION.minYPitch, INTERACTION.maxYPitch)
            : unclampedPitch;
    }, { passive: false });

    const releasePointer = (event) => {
        if (!state.dragging || state.pointerId !== event.pointerId) return;
        state.lastUserRotateAtMs = performance.now();
        state.dragging = false;
        canvas.releasePointerCapture(event.pointerId);
        state.pointerId = null;
    };

    canvas.addEventListener('pointerup', releasePointer);
    canvas.addEventListener('pointercancel', releasePointer);
}

function animate(timeMs) {
    requestAnimationFrame(animate);

    const deltaSec = Math.min((timeMs - state.prevFrameMs) / 1000, 0.05);
    state.prevFrameMs = timeMs;

    if (state.modelPivot) {
        state.yaw = damp(state.yaw, state.targetYaw, INTERACTION.damping);
        state.pitch = damp(state.pitch, state.targetPitch, INTERACTION.damping);

        const idleForMs = timeMs - state.lastUserRotateAtMs;
        const shouldAutoRotate = AUTO_ROTATE.enabled && !state.dragging && idleForMs >= AUTO_ROTATE.idleDelayMs;
        if (shouldAutoRotate) {
            state.autoRotateOffset += AUTO_ROTATE.speed * deltaSec;
        }

        const axis = getAutoRotateAxis();
        const autoAngle = state.autoRotateOffset;
        const rotationSpace = getAutoRotateSpace();
        qBase.copy(getModelBaseQuaternion());
        if (rotationSpace === 'local') {
            const baseEuler = getModelBaseEuler();
            state.modelPivot.rotation.x = baseEuler.x + (axis === 'x' ? state.pitch + autoAngle : state.pitch);
            state.modelPivot.rotation.y = baseEuler.y + (axis === 'y' ? state.yaw + autoAngle : state.yaw);
            state.modelPivot.rotation.z = baseEuler.z + (axis === 'z' ? autoAngle : 0);
        } else {
            // Углы применяем относительно мировых осей сцены.
            qPitch.setFromAxisAngle(WORLD_AXIS_X, state.pitch);
            qYaw.setFromAxisAngle(WORLD_AXIS_Y, state.yaw);
            qAuto.setFromAxisAngle(getWorldAxisByName(axis), autoAngle);

            qFinal.identity();
            qFinal.multiply(qAuto);
            qFinal.multiply(qYaw);
            qFinal.multiply(qPitch);
            qFinal.multiply(qBase);
            state.modelPivot.quaternion.copy(qFinal);
        }
    }

    state.renderer.render(state.scene, state.camera);
}

function onWindowResize() {
    const viewport = getCanvasViewportSize();
    state.camera.aspect = viewport.width / viewport.height;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(viewport.width, viewport.height);
    if (state.modelPivot && MODEL_VIEW.autoFitOnResize) {
        fitCameraToModel(state.modelPivot);
    } else {
        state.camera.lookAt(0, 0, 0);
    }
}

function damp(current, target, dampingFactor) {
    return current + (target - current) * dampingFactor;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function getCanvasViewportSize() {
    const container = document.getElementById('canvas-container');
    if (!container) {
        return {
            width: Math.max(window.innerWidth, 1),
            height: Math.max(window.innerHeight, 1)
        };
    }

    return {
        width: Math.max(container.clientWidth, 1),
        height: Math.max(container.clientHeight, 1)
    };
}

function applyBodySizeFromConfig() {
    if (typeof BODY_SET_SIZE === 'undefined') {
        return;
    }

    const body = document.body;
    const root = document.documentElement;
    if (!body || !root) {
        return;
    }

    if (!BODY_SET_SIZE.enabled) {
        root.style.removeProperty('width');
        root.style.removeProperty('height');
        body.style.removeProperty('width');
        body.style.removeProperty('height');
        body.style.removeProperty('border');
        return;
    }

    const width = Math.max(Number(BODY_SET_SIZE.width) || 0, 1);
    const height = Math.max(Number(BODY_SET_SIZE.height) || 0, 1);

    root.style.width = `${width}px`;
    root.style.height = `${height}px`;
    body.style.width = `${width}px`;
    body.style.height = `${height}px`;
    body.style.border = BODY_SET_SIZE.setRedBorder ? '1px solid #f00' : 'none';
}

function applyThemeFromConfig() {
    const cssHex = `#${RENDERER.clearColor.toString(16).padStart(6, '0')}`;
    document.documentElement.style.setProperty('--app-bg-color', cssHex);
}

function applyFittedPageBackground(imagePath) {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    container.style.backgroundImage = `url("${imagePath}")`;
    container.style.backgroundPosition = 'center center';
    container.style.backgroundRepeat = 'no-repeat';
    container.style.backgroundSize = 'cover';
}

function getAutoRotateAxis() {
    const axis = String(AUTO_ROTATE.axis || 'y').toLowerCase();
    if (axis === 'x' || axis === 'y' || axis === 'z') return axis;
    return 'y';
}

function getAutoRotateSpace() {
    const space = String(AUTO_ROTATE.rotationSpace || 'world').toLowerCase();
    if (space === 'local' || space === 'world') return space;
    return 'world';
}

function getEnvironmentSource() {
    const source = String(RENDERER.environmentSource || 'auto').toLowerCase();
    if (source === 'hdr' || source === 'jpg' || source === 'auto') {
        return source;
    }
    return 'auto';
}

function getTextureItems() {
    if (!Array.isArray(TEXTURES)) {
        throw new Error('TEXTURES должен быть массивом');
    }

    const items = [];
    for (let i = 0; i < TEXTURES.length; i += 1) {
        const group = TEXTURES[i];
        if (!group || !Array.isArray(group.items)) continue;

        for (let j = 0; j < group.items.length; j += 1) {
            const item = group.items[j];
            if (!item || typeof item.url !== 'string') continue;
            items.push({
                ...item,
                groupId: group.id,
                groupName: group.name
            });
        }
    }

    if (items.length === 0) {
        throw new Error('В TEXTURES не найдено ни одной текстуры');
    }

    return items;
}

function getModelItems() {
    if (Array.isArray(PATHS.model)) {
        const items = PATHS.model.filter((item) => item && typeof item.path === 'string');
        if (items.length === 0) {
            throw new Error('В PATHS.model не найдено ни одной модели');
        }
        return items;
    }

    if (typeof PATHS.model === 'string') {
        return [{ id: 'model-01', name: 'Модель 1', path: PATHS.model, color: 'rgb(255, 255, 255)' }];
    }

    throw new Error('PATHS.model должен быть строкой или массивом моделей');
}

function getActiveModelPath() {
    const model = MODEL_ITEMS[state.activeModelIndex] || MODEL_ITEMS[0];
    if (!model || typeof model.path !== 'string') {
        throw new Error('Путь активной модели не задан');
    }
    return model.path;
}

function findTextureIndexById(textureId) {
    for (let i = 0; i < TEXTURE_ITEMS.length; i += 1) {
        if (TEXTURE_ITEMS[i].id === textureId) return i;
    }
    return -1;
}

function isDarkColor(color) {
    if (typeof color !== 'string') return false;
    const match = color.match(/rgb\s*\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)\s*\)/i);
    if (!match) return false;

    const r = Number(match[1]);
    const g = Number(match[2]);
    const b = Number(match[3]);
    const luminance = ((0.2126 * r) + (0.7152 * g) + (0.0722 * b)) / 255;
    return luminance < 0.45;
}

function getWorldAxisByName(axis) {
    if (axis === 'x') return WORLD_AXIS_X;
    if (axis === 'z') return WORLD_AXIS_Z;
    return WORLD_AXIS_Y;
}

function getModelBaseEuler() {
    const rotation = MODEL_VIEW.initialRotationDeg || {};
    eulerBase.set(
        THREE.MathUtils.degToRad(rotation.x || 0),
        THREE.MathUtils.degToRad(rotation.y || 0),
        THREE.MathUtils.degToRad(rotation.z || 0),
        'XYZ'
    );
    return eulerBase;
}

function getModelBaseQuaternion() {
    qBase.setFromEuler(getModelBaseEuler());
    return qBase;
}
