const fs = require('fs');
const https = require('https');
const stream = require('stream');
const util = require('util');
const axios = require('axios');
const net = require('net');
const { Throttle } = require('stream-throttle');
console.log('child created')


async function downloadFile(fileUrl, output) {
  const writter = fs.createWriteStream(output);
  return axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
    timeout: 60000,
  })
    .then((response) => {
      response.data.pipe(new Throttle({ rate: 256 })).pipe(writter);

      return new Promise((resolve, reject) => {
        writter.on('close', (data) => {
          resolve({
            fileUrl,
            path: writter.path,
          });
        });
        writter.on('finish', (data) => {
          console.log('finished', output);
        });
      });
    })
    .catch((error) => {
      console.log('error', output);
      return null;
    });
}

async function downloadWithLimit(host, path, filename, byteRate = 100) {
  try {
    const options = {
      createConnection(options) {
        const socket = new net.Socket();
        socket.setKeepAlive(true, 60000);
        return socket.connect({ host: options.host, port: 443 });
      },
      hostname: host,
      path: path,
    };

    const time = Date.now();
    const writter = fs.createWriteStream(filename);
    writter.on('close', () => {
      console.log('stream close', filename);
    });
    writter.on('finish', () => {
      console.log('on finish', filename);
    });
    const request = https.request(`https://${host}${path}`, (res) => {
      res.pipe(new Throttle({ rate: byteRate * 1024 })).pipe(writter);
      // res.pipe(writter);
      // res.on('data', (chunk) => {
      //   console.log('write');
      //   writter.write(chunk);
      // });

      res.on('end', () => {
        console.log('Done! Elapsed time: ' + (Date.now() - time) + 'ms');
      });
    });
    request.end();
    request.on('error', (err) => {
      console.error(
        `Encountered an error trying to make a request: ${err.message}`,
      );
    });
  } catch (error) {
    console.log(filename + ' error', error);
  }
}

process.on('message', function (input) {
  console.log('[child] received message from server:', input.output);
  if (!input || !input.message) return;
  switch (input.message) {
    case 'download-file':
      console.log(input)
      // downloadFile(input.input, input.output).then((result) => {
      //   process.send({
      //     message: 'download-file',
      //     result: result,
      //   });
      //   // process.disconnect();
      // });
      // downloadWithLimit(input.host, input.path, input.output, 10000);
      break;
    case 'close':
      process.disconnect();
      break;
  }
  //   downloadFile(input.input, input.output).then(() => {
  //     process.disconnect();
  //   });
});
