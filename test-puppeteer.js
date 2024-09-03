const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const url = require('url');

const downloadPath = './test-download';
const sourceUrl = 'https://www.airbnb.com/';
async function run() {
  const browser = await puppeteer.launch({
    dumpio: true,

    args: ['--disable-gpu', sourceUrl],
  });

  const pages = await browser.pages();
  const page = pages[0];
  // console.log('page url', page.url());

  // await page.goto(sourceUrl, {
  //   timeout: 0,
  //   waitUntil: 'networkidle2',
  // });
  await page.waitForNetworkIdle();
  const IMAGE_SELECTOR = 'img, video';

  const result = await page.evaluate((sel) => {
    const urls = [];
    const imageObjs = document.querySelectorAll(sel);
    console.log(imageObjs);
    imageObjs.forEach((item) => {
      urls.push({
        tagName: item.tagName,
        src: item.src,
      });
    });
    // const videoObjs = document.querySelectorAll('video');
    // videoObjs.forEach((item) => urls.push(item.src));
    return { urls };
  }, IMAGE_SELECTOR);

  console.log(result);
  browser.close();
  // setTimeout(() => {
  //   browser.close();
  // }, 100000);
}

run();
