# Image multi-etapes : "dev" (nodemon, hot reload) et "prod" (minimale)
FROM node:22-alpine AS base
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

FROM base AS dev
RUN npm install --include=dev
COPY . .
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS prod
COPY server.js ./
ENV NODE_ENV=production
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s CMD wget -qO- http://localhost:3000/healthz || exit 1
CMD ["node", "server.js"]
