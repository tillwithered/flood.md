FROM node:24-alpine AS build
WORKDIR /app
ARG RAILWAY_GIT_COMMIT_SHA
COPY . .
RUN npm ci --ignore-scripts && npm run build

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/apps/website/dist ./apps/website/dist
COPY --from=build --chown=node:node /app/apps/website/server.mjs ./apps/website/server.mjs
COPY --from=build --chown=node:node /app/apps/website/visitors.mjs ./apps/website/visitors.mjs
COPY --from=build --chown=node:node /app/apps/website/routes.mjs ./apps/website/routes.mjs
COPY --from=build --chown=node:node /app/apps/website/src/component-catalog.json ./apps/website/src/component-catalog.json
USER node
EXPOSE 4173
CMD ["node", "apps/website/server.mjs"]
