# API target: runs the existing Fetch API handler under Node.js.
FROM node:24-alpine AS api
WORKDIR /app
ENV NODE_ENV=production API_RUNTIME=oracle-node PORT=8080 HOST=0.0.0.0
COPY functions/api/[[path]].js ./functions/api/[[path]].js
COPY server/oracle-api.mjs ./server/oracle-api.mjs
USER node
EXPOSE 8080
CMD ["node", "server/oracle-api.mjs"]

# Frontend target: build the current Vite application and serve static assets.
FROM node:24-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS frontend
COPY --from=frontend-build /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
