FROM node:20-alpine

WORKDIR /app

COPY package*.json yarn.lock* .npmrc* ./

RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; else npm ci --no-audit --no-fund; fi

COPY tsconfig.json ./
COPY src ./src
COPY proto ./proto

RUN npm run build || yarn build

ENV NODE_ENV=production

EXPOSE 4001 50051

CMD [ "sh", "-c", "node dist/server.js" ]


