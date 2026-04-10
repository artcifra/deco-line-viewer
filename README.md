# Deco Line Viewer

Проект теперь поддерживает два режима:

- web-версия для повседневной разработки
- Electron desktop-версия для сборки установщиков

## Текущая структура

```text
htdocs/
├── src/
│   ├── web/
│   │   ├── index.html
│   │   ├── js/
│   │   └── assets/
│   └── electron/
│       ├── main.js
│       ├── preload.js
│       └── app/        # сюда автоматически копируется src/web перед запуском Electron
├── scripts/
│   ├── prepare-electron-app.js
│   └── dev-web-server.js
├── release/            # сюда попадают результаты сборки Electron
├── package.json
└── package-lock.json
```

## Как работать

Все правки интерфейса, логики и ассетов делаются только в:

- [src/web/index.html](/Users/artcifra/Devilbox-data/www/3d/htdocs/src/web/index.html)
- [src/web/js/config.js](/Users/artcifra/Devilbox-data/www/3d/htdocs/src/web/js/config.js)
- [src/web/js/script.js](/Users/artcifra/Devilbox-data/www/3d/htdocs/src/web/js/script.js)
- [src/web/assets/styles.css](/Users/artcifra/Devilbox-data/www/3d/htdocs/src/web/assets/styles.css)
- [src/web/assets](/Users/artcifra/Devilbox-data/www/3d/htdocs/src/web/assets)

Electron-приложение не редактируется вручную внутри `src/electron/app`:

- эта папка пересобирается автоматически из `src/web`

## Команды

Установить зависимости:

```bash
npm install
```

Запустить web-версию для разработки:

```bash
npm run dev:web
```

Подготовить Electron app из текущего `src/web`:

```bash
npm run prepare:electron
```

Запустить Electron локально:

```bash
npm run dev:electron
```

Собрать desktop-приложение:

```bash
npm run build:electron
```

Собрать Windows installer:

```bash
npm run build:win
```

Собрать macOS installer:

```bash
npm run build:mac
```

## Что важно про сборку

- итоговое Electron-приложение не требует установки Node.js или Electron на целевой машине
- установщик содержит всё нужное внутри
- для самой надёжной сборки Windows-установщик лучше собирать на Windows
- macOS-сборку лучше собирать на macOS
- в `release/` уже проверена локальная упаковка desktop-версии через `electron-builder --dir`
- Windows-версия запускается в kiosk-режиме: во весь экран, без рамки и кнопок окна, выход через `Alt+F4`

## Что уже настроено

- `src/web` автоматически копируется в `src/electron/app`
- Electron открывает локальную копию web-приложения без внешнего сервера
- подготовлены команды для web-разработки, Electron-запуска и сборки

## Примечание

Единственный актуальный источник web-версии теперь находится в `src/web`.
