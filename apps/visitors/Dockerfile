FROM node:24-alpine
WORKDIR /app
COPY apps/visitors/store.mjs apps/visitors/server.mjs ./
ENV NODE_ENV=production
EXPOSE 4174
# Start as root only to prepare the dedicated volume; server drops to UID1000
# before database access or listen. No public domain is needed for this service.
CMD ["node", "server.mjs"]
