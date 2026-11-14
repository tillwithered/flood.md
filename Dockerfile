FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/website/package.json apps/website/
COPY examples/next/package.json examples/next/
COPY packages/agent/package.json packages/agent/
COPY packages/cli/package.json packages/cli/
COPY packages/react/package.json packages/react/
COPY packages/tokens/package.json packages/tokens/
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY . .
ARG RAILWAY_GIT_COMMIT_SHA
RUN npm run build

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/apps/website/dist ./apps/website/dist
COPY --from=build --chown=node:node /app/apps/website/dist-server ./apps/website/dist-server
COPY --from=build --chown=node:node /app/apps/website/server.mjs ./apps/website/server.mjs
COPY --from=build --chown=node:node /app/apps/website/visitors.mjs ./apps/website/visitors.mjs
COPY --from=build --chown=node:node /app/apps/website/routes.mjs ./apps/website/routes.mjs
COPY --from=build --chown=node:node /app/apps/website/src/component-catalog.json ./apps/website/src/component-catalog.json
USER node
EXPOSE 4173
CMD ["node", "apps/website/server.mjs"]
