# Docker Development

The root `docker-compose.yml` starts the Phase 2 local scaffold:

```bash
docker compose up --build
```

MongoDB, Redis, and RabbitMQ run as containers. Management and Delivery file storage use separate Docker volumes.

The Management Frontend dev server proxies `/api` requests to the API Gateway. In Docker Compose, `MANAGEMENT_API_PROXY_TARGET` is set to `http://api-gateway:3000` so frontend container requests use service DNS instead of container-local `localhost`.

The Content Service stores authoring document binaries under `STATIC_FILE_STORAGE_ROOT`. When this variable is not set, the service uses its local `.ecmp-static-files` development directory. Filesystem uploads are staged in a private `.tmp` directory under the same root before being moved to their generated final path.

During the Phase 3 scaffold, document metadata is still in memory while binaries are stored on disk. Restarting the Content Service can therefore leave orphaned local files in the management storage volume until MongoDB-backed metadata persistence is introduced.
