# ТЯГА — как запустить

Проект разделён на два приложения: интерфейс на Next.js и API на NestJS. Tailwind больше не используется, стили лежат в CSS-модулях рядом с компонентами.

## Запуск

1. Установите Node.js 22.13.0 или новее.
2. Откройте терминал в папке `tyaga-garage`.
3. Установите зависимости и запустите оба сервиса:

```sh
npm install --prefix backend
npm install --prefix frontend
npm install
npm run dev
```

4. Откройте [http://localhost:3000](http://localhost:3000). API отвечает на [http://localhost:3001](http://localhost:3001).
5. Чтобы остановить серверы, нажмите Ctrl+C.

## Что внутри

- `frontend/app` — Next.js: провайдеры и точка входа
- `frontend/src` — слои Feature-Sliced Design (`views` … `shared`)
- `backend/src/garage` — заявки, парк, назначение и обслуживание
- Данные техники и диспетчеров демонстрационные. Общей базы данных, GPS и отправки сообщений нет.
