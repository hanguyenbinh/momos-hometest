FROM node:20.9.0-alpine as builder

ENV NODE_ENV build

RUN mkdir -p /home/node/app
WORKDIR /home/node/app

COPY --chown=node:node . /home/node/app

RUN npm ci \
    && npm run build

USER node

FROM node:20.9.0-alpine

ENV NODE_ENV development


WORKDIR /home/node/app

COPY --from=builder /home/node/app/package*.json /home/node/app/
COPY --from=builder /home/node/app/dist/ /home/node/app/dist/
COPY --from=builder /home/node/app/config.yaml /home/node/app/

RUN npm ci

USER node

CMD ["node", "dist/main.js"]