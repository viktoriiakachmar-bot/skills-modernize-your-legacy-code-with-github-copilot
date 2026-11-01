// Mirrors operations.cob (Operations).
const MAX_BALANCE_CENTS = 99999999; // 999999.99 (PIC 9(6)V99)

function formatBalance(cents) {
  const whole = String(Math.floor(cents / 100)).padStart(6, '0');
  const frac = String(cents % 100).padStart(2, '0');
  return `${whole}.${frac}`;
}

// Returns cents, or null when the input is not a valid non-negative amount.
// Extra decimals are truncated, as the COBOL field would.
function parseAmount(text) {
  const match = /^(\d+)(?:\.(\d*))?$/.exec(String(text).trim());
  if (!match) return null;
  const cents = Number(match[1]) * 100 + Number(((match[2] || '') + '00').slice(0, 2));
  return cents > MAX_BALANCE_CENTS ? null : cents;
}

function createOperations({ data, io }) {
  async function readAmount(prompt) {
    const cents = parseAmount(await io.prompt(prompt));
    if (cents === null) io.write('Invalid amount.');
    return cents;
  }

  async function run(operation) {
    switch (operation.trim()) {
      case 'TOTAL': {
        io.write(`Current balance: ${formatBalance(data.call('READ'))}`);
        break;
      }
      case 'CREDIT': {
        const amount = await readAmount('Enter credit amount: ');
        if (amount === null) break;
        const balance = data.call('READ') + amount;
        if (balance > MAX_BALANCE_CENTS) {
          io.write('Credit would exceed the maximum balance.');
          break;
        }
        data.call('WRITE', balance);
        io.write(`Amount credited. New balance: ${formatBalance(balance)}`);
        break;
      }
      case 'DEBIT': {
        const amount = await readAmount('Enter debit amount: ');
        if (amount === null) break;
        const balance = data.call('READ');
        if (balance >= amount) {
          data.call('WRITE', balance - amount);
          io.write(`Amount debited. New balance: ${formatBalance(balance - amount)}`);
        } else {
          io.write('Insufficient funds for this debit.');
        }
        break;
      }
      default:
        break;
    }
  }

  return { run };
}

module.exports = { createOperations, formatBalance, parseAmount, MAX_BALANCE_CENTS };
