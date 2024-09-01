const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');

const { spawn } = require('child_process');
const os = require('os-utils');

let canContinue = true;
const cpuUsage = 80;

const childs = [];
const tempUrl =
  'https://scontent.fsgn5-13.fna.fbcdn.net/v/t39.30808-6/457186686_1214425139699388_6094356578630138151_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=aa7b47&_nc_ohc=stY6elvJ6YsQ7kNvgHQYFDR&_nc_ht=scontent.fsgn5-13.fna&cb_e2o_trans=q&oh=00_AYAMRdctU3CZ_tHwXfEReEy8HW2A2R958M8oP5BhmUd4ug&oe=66D2A12B';
function sleep(ms) {
  return new Promise((resolve) => {
    console.log('sleep');
    setTimeout(resolve, ms);
  });
}
async function checkCPUUsage() {
  return new Promise((resolve, reject) => {
    os.cpuUsage((percentage) => {
      console.log('cpu usage %', percentage);
      if (percentage > 0.8) {
        resolve(false);
      } else resolve(true);
    });
  });
}
async function main() {
  for (let i = 0; i < 5000; i++) {
    const fileUrl = tempUrl.substring(0, tempUrl.lastIndexOf('?'));
    const filename = uuidv4() + fileUrl.substring(fileUrl.lastIndexOf('.'));
    const child = spawn(
      'node',
      [
        'child-spawn.js',
        'https://scontent.fsgn5-13.fna.fbcdn.net/v/t39.30808-6/457186686_1214425139699388_6094356578630138151_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=aa7b47&_nc_ohc=stY6elvJ6YsQ7kNvgHQYFDR&_nc_ht=scontent.fsgn5-13.fna&cb_e2o_trans=q&oh=00_AYAMRdctU3CZ_tHwXfEReEy8HW2A2R958M8oP5BhmUd4ug&oe=66D2A12B',
        './download/' + filename,
      ],
      {
        cwd: __dirname,
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
      },
    );
    // const child = spawn('curl', ['-L', '-o ' + filename, tempUrl], {
    //   cwd: __dirname + '/download',
    //   stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    // });
    child.on('message', (data) => {
      if (!data || !data.message) return;
      messageHandler(child, data.message);
    });
    childs.push(child);
    if (i % 50 == 0) {
      const flag = await checkCPUUsage();
      if (!flag) {
        sleep(5000);
      }
    }
  }
}

function messageHandler(child, message) {
  switch (message) {
    case 'finished':
      child.send({ message: 'exit' });
      break;
  }
}

main();
// process.on('exit', (code) => {
//   console.log('process exit', code);
//   childs.forEach((child) => {
//     child.send({ message: 'exit' });
//   });
// });

// let stop = false;
// const f = function () {
//   if (!stop) process.nextTick(f);
// };
// f();
// childs.forEach((child, i) => {
//   child.send(
//     {
//       message: 'download-file',
//       host: 'scontent.fsgn5-13.fna.fbcdn.net',
//       path: '/v/t39.30808-6/457186686_1214425139699388_6094356578630138151_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=aa7b47&_nc_ohc=stY6elvJ6YsQ7kNvgHQYFDR&_nc_ht=scontent.fsgn5-13.fna&cb_e2o_trans=q&oh=00_AYAMRdctU3CZ_tHwXfEReEy8HW2A2R958M8oP5BhmUd4ug&oe=66D2A12B',
//       input:
//         'https://scontent.fsgn5-13.fna.fbcdn.net/v/t39.30808-6/457186686_1214425139699388_6094356578630138151_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=aa7b47&_nc_ohc=stY6elvJ6YsQ7kNvgHQYFDR&_nc_ht=scontent.fsgn5-13.fna&cb_e2o_trans=q&oh=00_AYAMRdctU3CZ_tHwXfEReEy8HW2A2R958M8oP5BhmUd4ug&oe=66D2A12B',
//       output: './download/' + i + '.jpg',
//     },
//     (error) => {
//       // console.log('send error', error);
//     },
//   );
// });
