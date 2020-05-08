const { promises: fs } = require('fs');
const { spawn } = require('child_process');
const { highlight } = require('cli-highlight');
const stripAnsi = require('strip-ansi');
const { extname } = require('path');
const { RUN } = require('../config');

module.exports = class Question {
  constructor(path) {
    this.path = path;
  }

  async run() {
    this.string = await fs.readFile(this.path, 'utf8');
    this.stderr = '';
    this.stdout = '';
    this.output = '';
    const ext = extname(this.path);
    const command = RUN[ext];
    if (!command) throw new Error(`Unknown extension: ${ext}`);
    await new Promise((resolve) => {
      const p = spawn(command[0], [...(command.slice[1] || []), this.path]);
      p.stdout.on('data', (data) => {
        this.stdout += data.toString();
        this.output += data.toString();
      });
      p.stderr.on('data', (data) => {
        this.stderr += data.toString();
        this.output += data.toString();
      });
      p.on('close', (code) => {
        this.exitCode = code;
        resolve();
      });
    });
    this.stderr = this.trimBottomAndTop(this.stderr);
    this.stdout = this.trimBottomAndTop(this.stdout);
    this.output = this.trimBottomAndTop(this.output);
    return this;
  }

  get result() {
    return this.output;
  }

  // trims empty lines on top and bottom
  trimBottomAndTop(str) {
    if (!str) return str;
    const lines = str.split('\n');
    this.trimArray(lines);
    return lines.join('\n');
  }

  trimArray(arr) {
    while (!arr[arr.length - 1]) arr.pop();
    while (!arr[0]) arr.shift();
    return arr;
  }

  getHighlighted() {
    return highlight(this.string, {
      language: 'js',
      ignoreIllegals: true,
    });
  }

  getNumbered() {
    const lines = this.getHighlighted().split('\n');

    const numWidth = String(lines.length).length;
    const alignNum = (n) => {
      n = String(n);
      return ' '.repeat(numWidth - n.length) + n;
    };

    for (let i = 0; i < lines.length; i++)
      lines[i] = alignNum(i + 1) + '   ' + lines[i];

    return lines.join('\n');
  }

  addFrame(str, { horizontalPadding = 3, verticalPadding = 1 } = {}) {
    // for windows
    str = str.replace(/\r\n/g, '\n').replace(/\r/g, '');
    const leftRightBorder = '│';
    const topBottomBorder = '─';
    const lines = str.split('\n');

    const widest = Math.max(...lines.map((l) => stripAnsi(l).length));

    const leftRightPadding = ' '.repeat(horizontalPadding);

    for (let i = 0; i < lines.length; i++)
      lines[i] =
        leftRightBorder +
        leftRightPadding +
        lines[i] +
        ' '.repeat(widest - stripAnsi(lines[i]).length) +
        leftRightPadding +
        leftRightBorder;

    // we're adding two because of the frame borders
    const width = widest + horizontalPadding * 2 + 2;

    const topFrame = '┌' + topBottomBorder.repeat(width - 2) + '┐';
    const bottomFrame = '└' + topBottomBorder.repeat(width - 2) + '┘';
    const topBottomPadding =
      leftRightBorder + ' '.repeat(width - 2) + leftRightBorder;

    for (let i = 0; i < verticalPadding; i++) {
      lines.push(topBottomPadding);
      lines.unshift(topBottomPadding);
    }

    lines.push(bottomFrame);
    lines.unshift(topFrame);

    return lines.join('\n');
  }

  print() {
    console.log(this.addFrame(this.getNumbered()));
  }

  printsStdout() {
    console.log(this.addFrame(this.stdout));
  }

  printsStderr() {
    console.log(this.addFrame(this.stderr));
  }

  printResult() {
    console.log(this.addFrame(this.result));
  }

  getErrorDetails() {
    if (!this.stderr) return undefined;
    const match = this.stderr.match(/^([a-zA-Z]*error):(.+)$/im);
    return {
      name: match[1].trim(),
      message: match[2].trim(),
    };
  }

  get correctAnswer() {
    if (this.stderr) return this.getErrorDetails().name;
    return this.stdout.trim();
  }
};
