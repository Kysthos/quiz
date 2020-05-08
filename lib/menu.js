const createMenu = require("simple-terminal-menu");
const { promises: fs } = require("fs");
const { join, sep, dirname } = require("path");
const { promisify } = require("util");
const glob = promisify(require("glob"));
const { CODE_FOLDER, RUN } = require("../config");
const MAIN_FOLDER = join(require.main.path, CODE_FOLDER);
const ask = require("./ask");
const store = require("./store");
const extensions = Object.keys(RUN);

module.exports = async function buildMenu(path = MAIN_FOLDER) {
  const dirContent = await fs.readdir(path, { withFileTypes: true });
  const allFiles = await glob(`${path}/**/*@(${extensions.join("|")})`);
  const stats = count(allFiles);
  const unanswered = getUnanswered(allFiles);

  const menu = createMenu({
    bg: "black",
    fg: "green",
    width: Math.floor(process.stdout.columns * 0.9),
    x: 0,
    y: 0,
    padding: {
      left: 3,
      right: 3,
      top: 1,
      bottom: 1,
    },
  });

  menu.writeTitle("Questions");
  menu.writeSubtitle(
    path
      .replace(MAIN_FOLDER, "")
      .split(sep)
      .filter((el) => el)
      .join(" • ")
  );
  menu.writeSeparator();

  const correctPerc = Math.round((stats.correct / stats.total) * 100);
  const incorrectPerc = Math.round((stats.incorrect / stats.total) * 100);
  menu.writeLine(
    `In this section: ${stats.total}; correct: ${stats.correct} (${correctPerc}%); incorrect: ${stats.incorrect} (${incorrectPerc}%)`
  );

  menu.writeSeparator();

  let questionIndex = 1;
  for (const el of dirContent) {
    if (el.isFile()) {
      const filePath = join(path, el.name);
      menu.add(`Question ${questionIndex++}`, store.get(filePath), () =>
        ask(
          filePath,
          () => buildMenu(path),
          unanswered.filter((p) => p !== filePath)
        )
      );
    } else if (el.isDirectory()) {
      menu.add(el.name + " >", () => buildMenu(join(path, el.name)));
    }
  }

  menu.writeSeparator();

  menu.add("RESET PROGRESS", () => {
    store.reset();
    buildMenu(path);
  });
  if (path !== MAIN_FOLDER) menu.add("BACK", () => buildMenu(dirname(path)));
  menu.add("EXIT", menu.close);
};

const count = (files) => {
  const results = {
    total: files.length,
    correct: 0,
    incorrect: 0,
  };
  for (const file of files) {
    switch (store.get(file)) {
      case "CORRECT":
        results.correct++;
        break;
      case "INCORRECT":
        results.incorrect++;
        break;
      default:
        break;
    }
  }
  return results;
};

const getUnanswered = (files) => {
  return files.filter((file) => {
    const status = store.get(file);
    return !status || status === "INCORRECT" ? true : false;
  });
};
