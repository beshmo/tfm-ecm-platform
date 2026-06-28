# Docker Development

The root `docker-compose.yml` starts the Phase 2 local scaffold:

```bash
docker compose up --build
```

MongoDB, Redis, and RabbitMQ run as containers. Management and Delivery file storage use separate Docker volumes.
