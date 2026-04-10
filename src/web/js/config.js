// config.js - Конфигурация приложения 3D-просмотра извещателя

// Набор текстур-наклеек для верхней поверхности датчика
const TEXTURES = [
    {
        id: 'stone',
        name: 'Под камень',
        items: [
            { id: 'stone-01', url: 'assets/textures/st01.png', name: 'Камень 1' },
            { id: 'stone-02', url: 'assets/textures/st02.png', name: 'Камень 2' },
            { id: 'stone-03', url: 'assets/textures/st03.png', name: 'Камень 3' },
            { id: 'stone-04', url: 'assets/textures/st04.png', name: 'Камень 4' },
            { id: 'stone-05', url: 'assets/textures/st05.png', name: 'Камень 5' },
            { id: 'stone-06', url: 'assets/textures/st06.png', name: 'Камень 6' },
            { id: 'stone-07', url: 'assets/textures/st07.png', name: 'Камень 7' },
            { id: 'stone-08', url: 'assets/textures/st08.png', name: 'Камень 8' },
            { id: 'stone-09', url: 'assets/textures/st09.png', name: 'Камень 9' },
            { id: 'stone-10', url: 'assets/textures/st10.png', name: 'Камень 10' },
            { id: 'stone-11', url: 'assets/textures/st11.png', name: 'Камень 11' },
            { id: 'stone-12', url: 'assets/textures/st12.png', name: 'Камень 12' },
            { id: 'stone-13', url: 'assets/textures/st13.png', name: 'Камень 13' },
            { id: 'stone-14', url: 'assets/textures/st14.png', name: 'Камень 14' }
        ]
    },
    {
        id: 'wood',
        name: 'Под дерево',
        items: [
            { id: 'wood-01', url: 'assets/textures/w01.png', name: 'Дерево 1' },
            { id: 'wood-02', url: 'assets/textures/w02.png', name: 'Дерево 2' },
            { id: 'wood-03', url: 'assets/textures/w03.png', name: 'Дерево 3' },
            //{ id: 'wood-04', url: 'assets/textures/w04.png', name: 'Дерево 4' },
            //{ id: 'wood-05', url: 'assets/textures/w05.png', name: 'Дерево 5' },
            //{ id: 'wood-06', url: 'assets/textures/w06.png', name: 'Дерево 6' },
            { id: 'wood-07', url: 'assets/textures/w07.png', name: 'Дерево 7' },
            { id: 'wood-08', url: 'assets/textures/w08.png', name: 'Дерево 8' },
            { id: 'wood-09', url: 'assets/textures/w09.png', name: 'Дерево 9' },
            //{ id: 'wood-13', url: 'assets/textures/w13.png', name: 'Дерево 13' },
            //{ id: 'wood-10', url: 'assets/textures/w10.png', name: 'Дерево 10' },
            //{ id: 'wood-12', url: 'assets/textures/w12.png', name: 'Дерево 12' },
            { id: 'wood-11', url: 'assets/textures/w11.png', name: 'Дерево 11' },
            { id: 'wood-14', url: 'assets/textures/w14.png', name: 'Дерево 14' }
        ]
    },
    {
        id: 'soft-touch',
        name: 'Soft-touch',
        items: [
            { id: 'soft-touch-01', url: 'assets/textures/s-t01.png', name: 'Soft-touch 1' },
            { id: 'soft-touch-02', url: 'assets/textures/s-t02.png', name: 'Soft-touch 2' },
            { id: 'soft-touch-03', url: 'assets/textures/s-t03.png', name: 'Soft-touch 3' },
            { id: 'soft-touch-04', url: 'assets/textures/s-t04.png', name: 'Soft-touch 4' },
            { id: 'soft-touch-05', url: 'assets/textures/s-t05.png', name: 'Soft-touch 5' },
            { id: 'soft-touch-06', url: 'assets/textures/s-t06.png', name: 'Soft-touch 6' },
            { id: 'soft-touch-07', url: 'assets/textures/s-t07.png', name: 'Soft-touch 7' },
            { id: 'soft-touch-08', url: 'assets/textures/s-t08.png', name: 'Soft-touch 8' },
            { id: 'soft-touch-09', url: 'assets/textures/s-t09.png', name: 'Soft-touch 9' },
            { id: 'soft-touch-10', url: 'assets/textures/s-t10.png', name: 'Soft-touch 10' },
            { id: 'soft-touch-11', url: 'assets/textures/s-t11.png', name: 'Soft-touch 11' },
            { id: 'soft-touch-12', url: 'assets/textures/s-t12.png', name: 'Soft-touch 12' },
            { id: 'soft-touch-13', url: 'assets/textures/s-t13.png', name: 'Soft-touch 13' },
            { id: 'soft-touch-14', url: 'assets/textures/s-t14.png', name: 'Soft-touch 14' },
            { id: 'soft-touch-15', url: 'assets/textures/s-t15.png', name: 'Soft-touch 15' },
            { id: 'soft-touch-16', url: 'assets/textures/s-t16.png', name: 'Soft-touch 16' }
        ]
    },
    {
        id: 'designer',
        name: 'Дизайнерские',
        items: [
            { id: 'designer-06', url: 'assets/textures/d06.png', name: 'Дизайнерская 6' },
            { id: 'designer-07', url: 'assets/textures/d07.png', name: 'Дизайнерская 7' },
            { id: 'designer-08', url: 'assets/textures/d08.png', name: 'Дизайнерская 8' },
            { id: 'designer-10', url: 'assets/textures/d10.png', name: 'Дизайнерская 10' },
            { id: 'designer-11', url: 'assets/textures/d11.png', name: 'Дизайнерская 11' },
            { id: 'designer-12', url: 'assets/textures/d12.png', name: 'Дизайнерская 12' },
            { id: 'designer-13', url: 'assets/textures/d13.png', name: 'Дизайнерская 13' },
            { id: 'designer-15', url: 'assets/textures/d15.png', name: 'Дизайнерская 15' },
            { id: 'designer-01', url: 'assets/textures/d01.png', name: 'Дизайнерская 1' },
            { id: 'designer-02', url: 'assets/textures/d02.png', name: 'Дизайнерская 2' },
            { id: 'designer-03', url: 'assets/textures/d03.png', name: 'Дизайнерская 3' },
            { id: 'designer-09', url: 'assets/textures/d09.png', name: 'Дизайнерская 9' },
            { id: 'designer-14', url: 'assets/textures/d14.png', name: 'Дизайнерская 14' },
            { id: 'designer-16', url: 'assets/textures/d16.png', name: 'Дизайнерская 16' },
            { id: 'designer-17', url: 'assets/textures/d17.png', name: 'Дизайнерская 17' },
            { id: 'designer-18', url: 'assets/textures/d18.png', name: 'Дизайнерская 18' },
            { id: 'designer-19', url: 'assets/textures/d19.png', name: 'Дизайнерская 19' },
            { id: 'designer-20', url: 'assets/textures/d20.png', name: 'Дизайнерская 20' },
            { id: 'designer-04', url: 'assets/textures/d04.png', name: 'Дизайнерская 4' },
            { id: 'designer-05', url: 'assets/textures/d05.png', name: 'Дизайнерская 5' }
        ]
    }
];

// Пути к ресурсам
const PATHS = {
    model: [
            {
                name: 'Белый',
                path: 'assets/models/avrora_7_white.glb', //
                color: 'rgb(250, 250, 247)'
            },
            {
                name: 'Бежевый',
                path: 'assets/models/avrora_7_beige.glb',
                color: 'rgb(209, 193, 165)'
            },
            {
                name: 'Серый',
                path: 'assets/models/avrora_7_gray.glb',
                color: 'rgb(152, 158, 168)'
            },
            {
                name: 'Черный',
                path: 'assets/models/avrora_7_black.glb',
                color: 'rgb(28, 28, 32)'
            }
        ],
    hdriHdr: 'assets/hdri/06.hdr', //07
    hdriJpgFallback: 'assets/hdri/hdri.jpg'
};

// Поворот наклейки в градусах: положительное значение = по часовой стрелке, отрицательное = против часовой.
const TEXTURE_ROTATION_DEG = 0;//165;
// Отражение наклейки по осям текстуры.
const TEXTURE_FLIP_HORIZONTAL = false;
const TEXTURE_FLIP_VERTICAL = false;

// Устанавливает размеры рабочей области экрана
const BODY_SET_SIZE = {
    enabled: true,
    width: 1920,
    height: 1080,
    setRedBorder: false
};

// Поиск верхнего меша: сначала пытаемся точные имена, затем эвристики
const MESH = {
    topSurfaceNames: ['наклейка #3','sticker', 'наклейка', 'TopSurface', 'Cylinder_Top', 'CylinderTop']
};

// Автогенерация UV для моделей, у которых поверхность под наклейку экспортирована без TEXCOORD_0.
// mode:
// 'auto' - выбрать planar или cylindrical автоматически,
// 'planar' - всегда использовать planar-проекцию,
// 'cylindrical' - всегда использовать cylindrical-проекцию.
// padding - внутренний отступ UV от краев текстуры.
// normalPlanarThreshold - если нормали поверхности достаточно сонаправлены, будет выбран planar.
const TEXTURE_PROJECTION = {
    enabledForMissingUv: true,
    mode: 'planar',
    padding: 0.02,
    normalPlanarThreshold: 0.86
};

// Параметры камеры:
// fov - угол обзора (меньше значение = сильнее "зум").
// near - ближняя плоскость отсечения.
// far - дальняя плоскость отсечения.
// position - стартовая позиция камеры в сцене (x - влево/вправо, y - вверх/вниз, z - расстояние до модели).
const CAMERA = {
    fov: 35, // 42
    near: 0.05,
    far: 100,
    position: { x: 0, y: -2.5, z: 35 } //{ x: 0, y: 0.3, z: 30 }
};

// Параметры автопозиционирования модели и стартовой камеры:
// fitPadding - запас вокруг модели при авто-вписывании в экран.
// centerOffset - ручная коррекция центра модели после автоцентрирования:
// x - влево/вправо, y - вверх/вниз, z - вперед/назад.
// initialRotationDeg - стартовый наклон модели в градусах после импорта.
// Помогает задать более объемный ракурс для моделей, у которых локальные оси экспортированы без наклона.
// autoFitOnLoad - автоматически вписывать модель в окно при первой загрузке.
// autoFitOnResize - повторно вписывать модель при изменении размера окна.
const MODEL_VIEW = {
    fitPadding: 0.0018,
    centerOffset: { x: 0, y: 0, z: 0 },
    initialRotationDeg: { x: -18, y: -160, z: 52 },
    autoFitOnLoad: true,
    autoFitOnResize: false
};


// Экспериментальный ambient occlusion для моделей без готовой aoMap.
// Код генерирует простую AO-карту и uv2 автоматически.
const AMBIENT_OCCLUSION = {
    enabled: true,
    intensity: 0.75,
    textureSize: 256,
    edgeDarkness: 0.78,
    centerBrightness: 0.98,
    power: 1.55,
    excludeMeshNames: ['sticker', 'наклейка', 'наклейка #3']
};

// Параметры освещения:
// ambient - равномерный фоновый свет без направления и теней (подсвечивает всю сцену целиком).
// ambient.intensity - яркость фонового света: больше = меньше глубоких теней, меньше = контрастнее сцена.
// key - основной направленный свет, формирует объем, блики и "главное" направление освещения.
// key.intensity - яркость ключевого света: больше = ярче блики/контраст, меньше = более мягкая картинка.
// fill - дополнительный направленный свет с другой стороны, смягчает тени от key.
// fill.intensity - яркость заполняющего света: больше = мягче тени, меньше = выраженнее объем и контраст.
// intensity обычно задают от 0 и выше: 0 = света нет, ~0..1 - мягкий/умеренный свет, >1 - очень яркий свет.
// Жесткого верхнего ограничения в three.js нет, но слишком большие значения могут давать "пересвет" материала.
const LIGHTING = {
    ambient: { color: 0xffffff, intensity: 0.25 },
    key: { color: 0xffffff, intensity: 0.125, position: { x: 2, y: 3, z: 2 } },
    fill: { color: 0xffffff, intensity: 0.145, position: { x: -2, y: 1.5, z: -2 } }
};

// Параметры рендера:
// toneMappingExposure - экспозиция итоговой картинки (меньше = темнее, больше = ярче).
// clearColor - базовый цвет очистки кадра (и общий цвет темы фона через CSS-переменную).
// environmentSource - источник окружения и освещения:
// 'auto' - сначала HDR, затем JPG fallback,
// 'hdr' - только .hdr,
// 'jpg' - только .jpg.
// useEnvironmentAsBackground - использовать ли HDRI/JPG окружение как видимый фон сцены.
// fitBackgroundToViewport - режим подгонки фоновой JPG-картинки под экран (актуально при useEnvironmentAsBackground: true):
// true  - фон масштабируется как экранный фон (cover),
// false - фон рисуется непосредственно three.js как 3D equirectangular background.
const RENDERER = {
    toneMappingExposure: 1.0,
    clearColor: 0xf5f7fc, //0xececec
    environmentSource: 'auto',
    useEnvironmentAsBackground: false,
    fitBackgroundToViewport: false
};

// Параметры динамической тени под моделью
const SHADOW = {
    enabled: true,
    // Насыщенность/видимость тени (0..1)
    intensity: 0.28,
    // Цвет тени
    color: 0x000000,
    // Размытие края тени
    blur: 1,
    // Разрешение карты теней (чем выше, тем четче и тяжелее)
    mapSize: 2048,
    // Тонкая настройка артефактов shadow acne
    bias: -0.0002,
    normalBias: 0.02,

    // Плоскость-приемник тени ставится чуть ниже модели.
    // Итоговый отступ = max(height * planeOffsetRatio, planeOffsetMin).
    planeOffsetRatio: 0.025,
    planeOffsetMin: 0.03,

    // Запас плоскости вокруг модели по X/Z.
    // Итоговый размер = maxXZ * (1 + planePadding * 2).
    planePadding: 0.4,

    // Положение источника тени рассчитывается от размера модели.
    // Итоговый сдвиг = max(dominantSize * lightOffsetRatio.axis, lightOffsetMin.axis).
    lightIntensity: 0.22,
    lightOffsetRatio: { x: 0.22, y: 0.95, z: 0.28 },
    lightOffsetMin: { x: 0.5, y: 2.4, z: 0.8 },

    // Во сколько раз расширять ортографический фрустум источника
    // относительно половины максимального размера модели.
    frustumPadding: 0.9,

    // Положение цели света по высоте внутри модели:
    // 0 = нижняя граница, 0.5 = центр, 1 = верхняя граница.
    targetHeightRatio: 0.2,

    // Дальность shadow camera относительно размера модели.
    cameraNear: 0.1,
    cameraFarRatio: 6
};

// Параметры touch-вращения
const INTERACTION = {
    // Чувствительность drag/swipe: больше значение = быстрее вращение при том же движении пальца
    dragSensitivity: 0.0555,

    // Плавность "догона" к целевому углу: меньше = более инерционно, больше = более резко
    damping: 0.12,

    // Ограничение наклона модели по вертикали (pitch).
    // При limitYaw: false вертикальный наклон свободный, без ограничений.
    // minYPitch / maxYPitch задаются в радианах:
    // отрицательные значения - наклон вверх, положительные - наклон вниз.
    limitYaw: true,
    minYPitch: -Math.PI/3.5,
    maxYPitch: Math.PI/3.5,

    // Ограничение поворота модели по горизонтали (yaw).
    // Название limitXaw сохранено как есть для совместимости с текущим кодом.
    // При limitXaw: false вращение по горизонтали свободное, без ограничений.
    limitXaw: true,
    minXaw: -Math.PI/4,
    maxXaw: Math.PI/4,

    // Шаг изменения зума на одно срабатывание кнопки
    zoomStep: 0.25,

    // Интервал автоповтора зума при удержании кнопки (в миллисекундах)
    zoomRepeatIntervalMs: 10,

    // Ограничения зума по оси Z камеры.
    // Значения могут идти в любом порядке: в коде они нормализуются через min/max.
    // Если стартовый auto-fit ставит камеру дальше этих значений, он тоже учитывается как допустимая граница.
    minZoomZ: 150.5,
    maxZoomZ: -5.5
};

// Параметры авто-вращения модели в режиме простоя
const AUTO_ROTATE = {
    enabled: false,
    // Скорость в радианах в секунду (чем больше, тем быстрее вращение)
    speed: 0.45,
    // Ось вращения: 'x' | 'y' | 'z' (сейчас вертикальная ось)
    axis: 'z',
    // Пространство вращения:
    // 'world' - вращение относительно осей сцены (мировые оси),
    // 'local' - вращение относительно локальных осей самой модели.
    rotationSpace: 'world',
    // Задержка перед стартом после последнего взаимодействия пользователя (мс)
    idleDelayMs: 1200
};

// Параметры анимации UI для кнопок текстур
const UI_ANIMATION = {
    // Скорость анимации (мс)
    speedMs: 520,
    // Увеличение в момент "пика" тапа
    tapScale: 1.5,
    // Размер при удержании после пика
    holdScale: 1.1
};

// Параметры звуковых эффектов интерфейса
const SOUND = {
    enabled: false,
    // Звук при выборе текстуры в панели
    selectPath: 'assets/sfx/texture_select-2.wav',
    // Звук в момент фактического применения текстуры к модели
    applyPath: 'assets/sfx/texture_apply-4.wav',
    // Задержка перед применением выбранной текстуры к модели (мс)
    applyDelayMs: 180,
    // Громкость звука выбора (0..1)
    selectVolume: 0.02,
    // Громкость звука применения (0..1)
    applyVolume: 0.21
};


// Параметры интерфейса.
// showZoomPanel - показывать или скрывать панель кнопок зума.
const UI = {
    showZoomPanel: false
};
