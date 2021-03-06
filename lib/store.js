// not ideal solution, but will do for now
const fs = require('fs');
const { STORE } = require('../config');
const { join, dirname } = require('path');
const STORE_PATH = join(require.main.path, STORE);
let ANSWERS;

try {
  const data = fs.readFileSync(STORE_PATH, 'utf8');
  ANSWERS = JSON.parse(data);
} catch (err) {
  ANSWERS = {};
}

try {
  fs.mkdirSync(dirname(STORE_PATH), { recursive: true });
} catch (err) {}

const save = () => fs.writeFileSync(STORE_PATH, JSON.stringify(ANSWERS));

module.exports = {
  set(prop, status) {
    ANSWERS[prop] = status;
    save();
  },
  get(prop) {
    return ANSWERS[prop];
  },
  reset() {
    ANSWERS = {};
    save();
  },
};
