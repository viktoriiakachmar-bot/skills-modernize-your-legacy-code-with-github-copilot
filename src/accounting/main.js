// Mirrors main.cob (MainProgram).
const { createDataProgram } = require('./dataProgram');
const { createOperations } = require('./operations');

async function runMain({ io, data = createDataProgram() }) {
  const operations = createOperations({ data, io });
  let running = true;

  while (running) {
    io.write('--------------------------------');
    io.write('Account Management System');
    io.write('1. View Balance');
    io.write('2. Credit Account');
    io.write('3. Debit Account');
    io.write('4. Exit');
    io.write('--------------------------------');
    const choice = (await io.prompt('Enter your choice (1-4): ')).trim();

    switch (choice) {
      case '1':
        await operations.run('TOTAL ');
        break;
      case '2':
        await operations.run('CREDIT');
        break;
      case '3':
        await operations.run('DEBIT ');
        break;
      case '4':
        running = false;
        break;
      default:
        io.write('Invalid choice, please select 1-4.');
    }
  }
  io.write('Exiting the program. Goodbye!');
}

module.exports = { runMain };
