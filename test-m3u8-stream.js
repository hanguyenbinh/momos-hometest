const fs = require('fs');
const m3u8stream = require('m3u8stream');

m3u8stream(
  'https://hd1080.opstream2.com/20231006/43619_01b63816/3000k/hls/mixed.m3u8',
).pipe(fs.createWriteStream('videofile.mp4'));
