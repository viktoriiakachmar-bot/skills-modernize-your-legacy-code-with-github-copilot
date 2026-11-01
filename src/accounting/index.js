const readline = require('readline');
const { runMain } = require('./main');

const rl = readline.createInterface({ input: process.stdin });
const lines = rl[Symbol.asyncIterator]();

// Reading via the async iterator keeps piped input from being lost between prompts.
const io = {
  write: (line) => console.log(line),
  prompt: async (question) => {
    process.stdout.write(question);
    const { value, done } = await lines.next();
    if (done) throw new Error('Input ended before the program exited.');
    if (!process.stdin.isTTY) process.stdout.write(`${value}\n`);
    return value;
  },
};

runMain({ io })
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => rl.close());

function credit(balance, amount) {
  return balance + amount;
}

function debit(balance, amount) {
  return balance - amount;
}
