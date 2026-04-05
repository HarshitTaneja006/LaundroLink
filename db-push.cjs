#!/usr/bin/env node
require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');

const drizzleKit = path.join(__dirname, 'node_modules', '.bin', 'drizzle-kit.cmd');
const args = process.argv.slice(2);

const child = spawn(drizzleKit, args, {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

child.on('exit', (code) => {
  process.exit(code);
});
