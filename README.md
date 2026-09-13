# ТЯГА — диспетчерская спецтехники

Интерактивный макет гаража спецтехники: Next.js на фронте, NestJS на бэке, стили через CSS-модули без Tailwind.

## Стек

- `frontend` — Next.js, Feature-Sliced Design, CSS-модули, Lucide
- `backend` — NestJS, in-memory состояние смены
- пакетный менеджер — **npm**

Данные демонстрационные, на 12 сентября 2026, 10:45. Состояние живёт в памяти Nest-сервера и сбрасывается при его перезапуске.

## Запуск

Нужен Node.js 22.13 или новее.

```sh
npm install --prefix backend
npm install --prefix frontend
npm install
npm run dev
```

- UI: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:3001/api/garage](http://localhost:3001/api/garage)

Отдельно:

```sh
npm run dev:api
npm run dev:web
```

## Фронт (FSD)

Слои в `frontend/src`, импорт только снизу вверх:

- `app` — Next.js: провайдеры и точка входа
- `views` — сборка рабочего места диспетчера (слой pages в терминах FSD; так назван, чтобы не конфликтовать с Next)
- `widgets` — сайдбар, доски, карточки
- `features` — создать заявку, назначить технику, закрыть ТО
- `entities` — техника, заявка, снимок гаража
- `shared` — UI-кит, API-клиент, утилиты

## API

| Метод | Путь | Назначение |
|---|---|---|
| `GET` | `/api/health` | Проверка сервера |
| `GET` | `/api/garage` | Снимок парка, заявок, смены |
| `POST` | `/api/requests` | Новая заявка |
| `POST` | `/api/requests/:id/assign` | Назначение свободной техники |
| `POST` | `/api/fleet/:id/finish-service` | Возврат с ТО в парк |
