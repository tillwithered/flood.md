FROM node:24-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci --ignore-scripts && npm run build

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/apps/website/dist ./apps/website/dist
COPY --from=build --chown=node:node /app/apps/website/server.mjs ./apps/website/server.mjs
USER node
EXPOSE 4173
CMD ["node", "apps/website/server.mjs"]
