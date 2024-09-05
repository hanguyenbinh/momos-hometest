FROM zenika/alpine-chrome:with-node as builder
USER root

ENV NODE_ENV build

# RUN mkdir -p /home/node/app
WORKDIR /home/node/app

COPY --chown=root:root . /home/node/app

RUN npm ci \
    && npm run build



FROM zenika/alpine-chrome:with-node
USER root
ENV NODE_ENV development

WORKDIR /home/node/app

COPY --from=builder /home/node/app/package*.json /home/node/app/
COPY --from=builder /home/node/app/dist/ /home/node/app/
COPY --from=builder /home/node/app/config.yaml /home/node/app/
COPY --from=builder /home/node/app/prisma/ /home/node/app/prisma/

RUN npm ci
# RUN npx @puppeteer/browsers install chrome@128.0.6613.119




CMD ["node", "src/main.js"]