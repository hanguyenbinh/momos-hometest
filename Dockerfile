FROM node:20@sha256:a4d1de4c7339eabcf78a90137dfd551b798829e3ef3e399e0036ac454afa1291 as builder


# Configure default locale (important for chrome-headless-shell). 
ENV LANG en_US.UTF-8

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chrome that Puppeteer
# installs, work.
RUN groupadd -r pptruser && useradd -rm -g pptruser -G audio,video pptruser
ENV NODE_ENV build

RUN mkdir -p /home/node/app
WORKDIR /home/node/app

COPY --chown=node:node . /home/node/app

RUN npm ci \
    && npm run build

USER pptruser

FROM node:20@sha256:a4d1de4c7339eabcf78a90137dfd551b798829e3ef3e399e0036ac454afa1291

ENV NODE_ENV development

# Configure default locale (important for chrome-headless-shell). 
ENV LANG en_US.UTF-8

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chrome that Puppeteer
# installs, work.
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
    && sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] https://dl-ssl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros fonts-kacst fonts-freefont-ttf libxss1 dbus dbus-x11 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r pptruser && useradd -rm -g pptruser -G audio,video pptruser


WORKDIR /home/node/app
COPY --from=builder /home/node/app/package*.json /home/node/app/
COPY --from=builder /home/node/app/dist/ /home/node/app/
COPY --from=builder /home/node/app/config.yaml /home/node/app/
COPY --from=builder /home/node/app/prisma/ /home/node/app/prisma/
COPY --from=builder /home/node/app/dbus/run.sh /etc/init/run.sh


RUN npm ci
USER pptruser
ENV DBUS_SESSION_BUS_ADDRESS autolaunch:
CMD ["node", "src/main.js"]