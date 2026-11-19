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
ENV FLOOD_WEBSITE_PROFILE=public
RUN npm run build && npm run site:bundle && mv .artifacts/website-runtime-* /opt/flood-site-runtime

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /opt/flood-site-runtime/apps/website ./apps/website
USER node
EXPOSE 4173
CMD ["node", "apps/website/server.mjs"]
