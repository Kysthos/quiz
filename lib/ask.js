const Question = require('./Question');
const readline = require('readline');
const store = require('./store');
const chalk = require('chalk');
const charm = require('charm')();

module.exports = async function ask(path, backToMenu, nextQuestions) {
  // create and run current question code
  const q = new Question(path);
  await q.run();
  console.log(
    `
What will be the output of the code below? 
If you think it's gonna throw an error, write the name of the error (case sensitive).
Write "\\n" if line-break is required.
`
  );
  q.print();
  console.log();

  const { correctAnswer } = q;

  // create new readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // question
  rl.question('', (answer) => {
    console.log();
    // good answer
    if (compare(answer, correctAnswer)) {
      console.log(chalk.green('CORRECT! You got it right!'));
      store.set(path, 'CORRECT');
    }
    // incorrect answer
    else {
      console.log(
        `${chalk.red('INCORRECT!')} The correct answer is: ${chalk.green(
          JSON.stringify(correctAnswer)
        )}.`
      );
      store.set(path, 'INCORRECT');
    }
    console.log();
    console.log(`Here's the full output of the code:`);
    q.printResult();

    if (nextQuestions.length)
      console.log(
        `
Type "m" and hit enter to return to the menu.
Click enter to go to the next unanswered question.
Ctrl + c to exit.
`
      );
    else
      console.log(
        'No more questions left in this section!\nClick enter to go back to the menu.'
      );

    // what to do next
    rl.on('line', (line) => {
      rl.close();
      if (line.trim().toLowerCase() === 'm' || !nextQuestions.length)
        return backToMenu();
      clearTerminal();
      ask(nextQuestions[0], backToMenu, nextQuestions.slice(1));
    });
  });
};

const compare = (userInput, expected) => {
  return userInput.replace(/\\n/g, '\n').trim() === expected;
};

const clearTerminal = () => {
  charm.pipe(process.stdout);
  charm.reset();
  charm.destroy();
};
