#!/usr/bin/env node

'use strict';

require('draftlog').into(console);

const inquirer = require('inquirer');
const { spawn } = require('child_process');

let workerLog = console.draft('Starting worker');
let child = spawn('node', ['worker.js'], {});
child.stdout.on('data', data => {
  // workerLog(data.toString());
});

// inquirer.prompt([{
//   'type': 'input',
//   'name': 'action',
//   'message': 'What would you like to do?'
// }]).then(answers => {
//   switch(answers.action) {
//     case 'close':
//       isMenuOpen = false;
//       break;
//     default:
//       openMenu();
//   }
//   // console.log(answers);
// });
