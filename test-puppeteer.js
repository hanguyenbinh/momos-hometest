const puppeteer = require('puppeteer');
const fs = require('fs');
const { response } = require('express');

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await browser.newPage();
  // await page.setViewport({ width: 1200, height: 1200 });
  await page.setRequestInterception(true);
  const urls = [];
  page.on('request', (request) => {
    urls.push(request.url());
    console.log(urls);
    request.continue();
  });
  await page.goto(
    'https://www.pexels.com/video/drops-of-liquid-on-a-tray-to-be-use-as-samples-3195394/',
    {
      timeout: 0,
      waitUntil: 'load',
    },
  );

  // const IMAGE_SELECTOR = 'img';

  // const result = await page.evaluate((sel) => {
  //   const urls = [];
  //   const imageObjs = document.querySelectorAll(sel);
  //   imageObjs.forEach((item) => urls.push(item.src));
  //   // const videoObjs = document.querySelectorAll('video');
  //   // videoObjs.forEach((item) => urls.push(item.src));
  //   return { urls };
  // }, IMAGE_SELECTOR);

  // console.log(result);
  // result.urls &&
  //   result.urls.length > 0 &&
  //   result.urls.forEach(async (url) => {
  //     if (!url || url.length == 0) return;
  //     console.log('url', url);
  //     const newPage = await browser.newPage(url);
  //     newPage.on('response', async (response) => {
  //       response.buffer().then((file) => {
  //         const fileName = url.split('/').pop();
  //         const filePath = path.resolve(__dirname + '/test-download', fileName);
  //         const writeStream = fs.createWriteStream(filePath);
  //         writeStream.write(file);
  //       });
  //     });
  //   });
  browser.close();
}

run();
