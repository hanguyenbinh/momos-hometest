const fs = require('fs');
const https = require('https');
//const { Throttle } = require('stream-throttle');
const { argv } = require('node:process');
//var path = require('path');

//const _process = require('process');

async function downloadWithLimit(url, filename, byteRate = 100) {
  try {
    const time = Date.now();
    const writter = fs.createWriteStream(filename);

    const request = https.request(url, (res) => {
      // res.pipe(new Throttle({ rate: 2000 * 1024 })).pipe(writter);
      res.pipe(writter);
      res.on('end', () => {
        console.log('Done! Elapsed time: ' + (Date.now() - time) + 'ms');
      });
      writter.on('close', () => {
        console.log('stream close', filename, Date.now() - time + 'ms');
      });
      writter.on('finish', () => {
        console.log('on finish', filename);
      });
    });
    request.end();
    request.on('error', (err) => {
      process.send('error', { err });
      console.error(
        `Encountered an error trying to make a request: ${err.message}`,
      );
    });
  } catch (error) {
    process.send('error', { error });
  }
}
console.log(argv);
const url = argv[2];
const storage = argv[3];
downloadWithLimit(url, storage)
  .then((result) => {
    process.send({
      message: 'finished',
    });
  })
  .catch((error) => console.log(error));

process.on('message', (data) => {
  if (!data || !data.message) return;
  console.log('from parent', data);
  if (data.message === 'exit') {
    process.disconnect();
    process.exit(1);
  }
  process.send({ result: true });
});
