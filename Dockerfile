FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY index.html vite.config.js ./
COPY app ./app
COPY public ./public
RUN npm run build

FROM python:3.13-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8080 CATALOG_DB=/app/storage/catalog.sqlite3
COPY server ./server
COPY data/seed.json ./data/seed.json
COPY --from=build /app/dist ./dist
RUN useradd -u 10001 -M courtside && mkdir /app/storage && chown courtside:courtside /app/storage
USER courtside
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/api/health',timeout=4)"
CMD ["python", "server/main.py"]
