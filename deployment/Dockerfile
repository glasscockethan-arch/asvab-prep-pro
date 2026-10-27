# Preparation only. No CI job builds/pushes/deploys this image automatically.
FROM node:24.19.0-bookworm AS build
WORKDIR /app
COPY . .
# Optional public CA bundle for environments with a managed HTTPS proxy. Never bake it into a layer.
RUN --mount=type=secret,id=build_ca \
    if [ -f /run/secrets/build_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/build_ca; fi; \
    npm ci --ignore-scripts && npm run build && npm test

FROM node:24.19.0-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production BEACON_RELEASE_STAGE=closed PORT=10000 BEACON_STORAGE_ROOT=/var/data BEACON_DB_PATH=/var/data/launch.sqlite
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/src/storage.js ./src/storage.js
RUN chmod -R a+rX /app && mkdir -p /var/data && chown node:node /var/data && chmod 700 /var/data
USER node
EXPOSE 10000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node","server/hosted.js"]
