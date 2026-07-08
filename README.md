# Comprime videos en línea

Sistema web para cargar videos, seleccionar un nivel de compresión y descargar el resultado en MP4 o WebM usando FFmpeg.

## Funciones incluidas

- Carga por botón o arrastrar y soltar.
- Validación de tipo de archivo, extensión, peso máximo y archivo vacío.
- Formatos de entrada: MP4, MOV, AVI, MKV, WEBM y M4V.
- Formatos de salida: MP4 con H.264/AAC y WebM con VP9/Opus.
- Niveles Alto, Medio y Bajo con estimación de tamaño final.
- Progreso en tiempo real con Server-Sent Events.
- Descarga del archivo comprimido sin exponer rutas internas.
- Limpieza automática de archivos temporales después de descargar o al cumplir el TTL.
- Rate limiting, Helmet, CORS configurable y nombres únicos para archivos.
- Dockerfile para frontend/backend y `docker-compose.yml`.

## Requisitos locales

- Node.js 22 o superior.
- npm 11 o superior.
- FFmpeg instalado y disponible en el `PATH`.

En Windows, si FFmpeg no está en el `PATH`, define `FFMPEG_PATH` y opcionalmente `FFPROBE_PATH` en `backend/.env`.

## Instalación

```bash
cd video-compressor-web
npm run build
```

O de forma separada:

```bash
cd video-compressor-web/backend
copy .env.example .env
npm install
```

```bash
cd ../frontend
copy .env.example .env
npm install
```

## Ejecutar en desarrollo

Terminal 1:

```bash
cd video-compressor-web/backend
npm run dev
```

Terminal 2:

```bash
cd video-compressor-web/frontend
npm run dev
```

Abre `http://localhost:5173`.

## Variables de entorno

Backend:

- `PORT`: puerto de la API.
- `CORS_ORIGIN`: origen permitido para el frontend.
- `MAX_FILE_SIZE_MB`: peso máximo del video.
- `UPLOAD_DIR`: carpeta temporal de archivos originales.
- `COMPRESSED_DIR`: carpeta temporal de archivos comprimidos.
- `FRONTEND_DIST_DIR`: ruta al frontend compilado. Por defecto `../frontend/dist` desde la carpeta `backend`.
- `FILE_TTL_MINUTES`: minutos antes de limpieza automática.
- `RATE_LIMIT_WINDOW_MINUTES`: ventana de rate limit.
- `RATE_LIMIT_MAX`: solicitudes máximas por ventana.
- `FFMPEG_PATH`: ruta opcional al binario de FFmpeg.
- `FFPROBE_PATH`: ruta opcional al binario de FFprobe.

Frontend:

- `VITE_API_URL`: URL base de la API, por ejemplo `http://localhost:4000/api`.

## Docker

```bash
cd video-compressor-web
docker compose up --build
```

Frontend: `http://localhost:3000`

Backend: `http://localhost:4000`

El contenedor del backend instala FFmpeg automáticamente.

## Docker en un solo servicio

Si tu hosting solo expone un contenedor o un servicio Node, usa el `Dockerfile` de la raíz. Ese build compila el frontend, copia `frontend/dist` y arranca el backend sirviendo la app desde `/`.

```bash
cd video-compressor-web
docker build -t video-compressor-web .
docker run -p 4000:4000 --env-file backend/.env video-compressor-web
```

Luego apunta el dominio al puerto del contenedor. La página debe cargar desde `/` y la API desde `/api`.

## Despliegue sin Docker

Si subes los archivos a un VPS o hosting Node, debes construir el frontend antes de iniciar el backend:

```bash
cd video-compressor-web
npm run build
npm start
```

El backend busca la app compilada en `frontend/dist/index.html`. Si esa carpeta no existe en producción, verás el mensaje `Frontend build not found`.

## Producción

- Usa HTTPS delante de los servicios, por ejemplo con Nginx, Traefik o un balanceador cloud.
- Configura `CORS_ORIGIN` con el dominio real del frontend.
- Ajusta `RATE_LIMIT_MAX` y `MAX_FILE_SIZE_MB` según capacidad del servidor.
- Usa almacenamiento temporal con suficiente espacio libre.
- Ejecuta los contenedores con límites de CPU/memoria si el servicio será público.
