const { createDataProgram } = require('../dataProgram');
const { createOperations } = require('../operations');
const { runMain } = require('../main');

// Runs a scripted session through MainProgram and returns the output lines.
async function runSession(inputs, data = createDataProgram()) {
  const queue = [...inputs];
  const output = [];
  const io = {
    write: (line) => output.push(line),
    prompt: async (question) => {
      output.push(question);
      if (queue.length === 0) throw new Error('Script ran out of inputs');
      return queue.shift();
    },
  };
  await runMain({ io, data });
  return { output, data };
}

const lastBalanceLine = (output, label) =>
  [...output].reverse().find((l) => l.startsWith(label));

describe('Menu and navigation (MainProgram)', () => {
  test('TC-001 menu is displayed on start', async () => {
    const { output } = await runSession(['4']);
    expect(output).toEqual(
      expect.arrayContaining([
        'Account Management System',
        '1. View Balance',
        '2. Credit Account',
        '3. Debit Account',
        '4. Exit',
        'Enter your choice (1-4): ',
      ])
    );
  });

  test('TC-002 exit the application', async () => {
    const { output } = await runSession(['4']);
    expect(output[output.length - 1]).toBe('Exiting the program. Goodbye!');
  });

  test('TC-003 invalid choice 0', async () => {
    const { output } = await runSession(['0', '4']);
    expect(output.filter((l) => l === 'Invalid choice, please select 1-4.')).toHaveLength(1);
    expect(output.filter((l) => l === 'Account Management System')).toHaveLength(2);
  });

  test('TC-004 invalid choices 5 and 9', async () => {
    const { output } = await runSession(['5', '9', '4']);
    expect(output.filter((l) => l === 'Invalid choice, please select 1-4.')).toHaveLength(2);
    expect(output.filter((l) => l === 'Account Management System')).toHaveLength(3);
  });

  test('TC-005 menu repeats after each operation', async () => {
    const { output } = await runSession(['1', '4']);
    expect(output.filter((l) => l === 'Account Management System')).toHaveLength(2);
    expect(output[output.length - 1]).toBe('Exiting the program. Goodbye!');
  });

  test('TC-006 non-numeric menu input is rejected without changing the balance', async () => {
    const { output, data } = await runSession(['a', '4']);
    expect(output).toContain('Invalid choice, please select 1-4.');
    expect(data.call('READ')).toBe(100000);
  });

  test('TC-007 multi-digit menu input is rejected as invalid', async () => {
    const { output, data } = await runSession(['12', '4']);
    expect(output).toContain('Invalid choice, please select 1-4.');
    expect(data.call('READ')).toBe(100000);
  });
});

describe('View balance (TOTAL)', () => {
  test('TC-010 view initial balance', async () => {
    const { output } = await runSession(['1', '4']);
    expect(output).toContain('Current balance: 001000.00');
  });

  test('TC-011 view balance does not change the balance', async () => {
    const { output } = await runSession(['1', '1', '4']);
    const lines = output.filter((l) => l.startsWith('Current balance:'));
    expect(lines).toEqual(['Current balance: 001000.00', 'Current balance: 001000.00']);
  });

  test('TC-012 view balance after credit', async () => {
    const { output } = await runSession(['2', '500', '1', '4']);
    expect(output).toContain('Current balance: 001500.00');
  });

  test('TC-013 view balance after debit', async () => {
    const { output } = await runSession(['3', '200', '1', '4']);
    expect(output).toContain('Current balance: 000800.00');
  });
});

describe('Credit account (CREDIT)', () => {
  test('TC-020 credit a whole-number amount', async () => {
    const { output } = await runSession(['2', '500', '4']);
    expect(output).toContain('Enter credit amount: ');
    expect(output).toContain('Amount credited. New balance: 001500.00');
  });

  test('TC-021 credit a decimal amount', async () => {
    const { output } = await runSession(['2', '250.75', '4']);
    expect(output).toContain('Amount credited. New balance: 001250.75');
  });

  test('TC-022 credit of zero leaves balance unchanged', async () => {
    const { output } = await runSession(['2', '0', '4']);
    expect(output).toContain('Amount credited. New balance: 001000.00');
  });

  test('TC-023 credit is persisted for later operations', async () => {
    const { output } = await runSession(['2', '100', '1', '4']);
    expect(output).toContain('Current balance: 001100.00');
  });

  test('TC-024 multiple consecutive credits accumulate', async () => {
    const { output } = await runSession(['2', '100', '2', '200', '2', '300', '1', '4']);
    expect(output).toContain('Current balance: 001600.00');
  });

  test('TC-025 credit up to the maximum balance', async () => {
    const { output } = await runSession(['2', '998999.99', '4']);
    expect(output).toContain('Amount credited. New balance: 999999.99');
  });

  test('TC-026 credit exceeding the maximum balance is rejected', async () => {
    const data = createDataProgram(99999999);
    const { output } = await runSession(['2', '1', '1', '4'], data);
    expect(output).toContain('Credit would exceed the maximum balance.');
    expect(output).toContain('Current balance: 999999.99');
  });

  test('TC-027 negative credit amount is rejected', async () => {
    const { output, data } = await runSession(['2', '-100', '4']);
    expect(output).toContain('Invalid amount.');
    expect(data.call('READ')).toBe(100000);
  });

  test('TC-028 non-numeric credit amount is rejected', async () => {
    const { output, data } = await runSession(['2', 'abc', '4']);
    expect(output).toContain('Invalid amount.');
    expect(data.call('READ')).toBe(100000);
  });

  test('TC-029 credit with more than two decimals is truncated', async () => {
    const { output } = await runSession(['2', '10.999', '4']);
    expect(output).toContain('Amount credited. New balance: 001010.99');
  });
});

describe('Debit account (DEBIT)', () => {
  test('TC-030 debit less than the balance', async () => {
    const { output } = await runSession(['3', '300', '4']);
    expect(output).toContain('Enter debit amount: ');
    expect(output).toContain('Amount debited. New balance: 000700.00');
  });

  test('TC-031 debit a decimal amount', async () => {
    const { output } = await runSession(['3', '99.99', '4']);
    expect(output).toContain('Amount debited. New balance: 000900.01');
  });

  test('TC-032 debit equal to the balance', async () => {
    const { output } = await runSession(['3', '1000', '4']);
    expect(output).toContain('Amount debited. New balance: 000000.00');
  });

  test('TC-033 debit greater than the balance is rejected', async () => {
    const { output, data } = await runSession(['3', '1000.01', '4']);
    expect(output).toContain('Insufficient funds for this debit.');
    expect(data.call('READ')).toBe(100000);
  });

  test('TC-034 balance unchanged after rejected debit', async () => {
    const { output } = await runSession(['3', '1000.01', '1', '4']);
    expect(output).toContain('Current balance: 001000.00');
  });

  test('TC-035 debit when balance is zero', async () => {
    const data = createDataProgram(0);
    const { output } = await runSession(['3', '0.01', '1', '4'], data);
    expect(output).toContain('Insufficient funds for this debit.');
    expect(output).toContain('Current balance: 000000.00');
  });

  test('TC-036 debit of zero leaves balance unchanged', async () => {
    const { output } = await runSession(['3', '0', '4']);
    expect(output).toContain('Amount debited. New balance: 001000.00');
  });

  test('TC-037 multiple consecutive debits', async () => {
    const { output } = await runSession(['3', '100', '3', '200', '1', '4']);
    expect(output).toContain('Current balance: 000700.00');
  });

  test('TC-038 negative debit amount is rejected', async () => {
    const { output, data } = await runSession(['3', '-100', '4']);
    expect(output).toContain('Invalid amount.');
    expect(data.call('READ')).toBe(100000);
  });

  test('TC-039 non-numeric debit amount is rejected', async () => {
    const { output, data } = await runSession(['3', 'abc', '4']);
    expect(output).toContain('Invalid amount.');
    expect(data.call('READ')).toBe(100000);
  });
});

describe('Combined scenarios and persistence', () => {
  test('TC-040 credit then debit', async () => {
    const { output } = await runSession(['2', '500', '3', '200', '1', '4']);
    expect(output).toContain('Current balance: 001300.00');
  });

  test('TC-041 debit enabled by a prior credit', async () => {
    const { output } = await runSession(['3', '1500', '2', '1000', '3', '1500', '1', '4']);
    expect(output).toContain('Insufficient funds for this debit.');
    expect(lastBalanceLine(output, 'Current balance:')).toBe('Current balance: 000500.00');
  });

  test('TC-042 rejected debit does not block later operations', async () => {
    const { output } = await runSession(['3', '2000', '3', '100', '4']);
    expect(output).toContain('Insufficient funds for this debit.');
    expect(output).toContain('Amount debited. New balance: 000900.00');
  });

  test('TC-043 balance resets on each application start', async () => {
    await runSession(['2', '500', '4']);
    const { output } = await runSession(['1', '4']);
    expect(output).toContain('Current balance: 001000.00');
  });

  test('TC-044 full session flow', async () => {
    const { output } = await runSession(['1', '2', '250.50', '3', '100.25', '1', '7', '4']);
    const balances = output.filter((l) => l.startsWith('Current balance:'));
    expect(balances).toEqual(['Current balance: 001000.00', 'Current balance: 001150.25']);
    expect(output).toContain('Amount credited. New balance: 001250.50');
    expect(output).toContain('Amount debited. New balance: 001150.25');
    expect(output).toContain('Invalid choice, please select 1-4.');
    expect(output[output.length - 1]).toBe('Exiting the program. Goodbye!');
  });
});

describe('Data layer interface (DataProgram)', () => {
  test('TC-050 READ returns the stored balance', () => {
    expect(createDataProgram().call('READ')).toBe(100000);
  });

  test('TC-051 WRITE replaces the stored balance', () => {
    const data = createDataProgram();
    data.call('WRITE', 123456);
    expect(data.call('READ')).toBe(123456);
  });

  test('TC-052 unknown operation leaves balance unchanged', () => {
    const data = createDataProgram();
    data.call('OTHER', 5);
    expect(data.call('READ')).toBe(100000);
  });

  test('TC-053 Operations ignores an unknown operation type', async () => {
    const data = createDataProgram();
    const output = [];
    const io = { write: (l) => output.push(l), prompt: async () => '1' };
    await createOperations({ data, io }).run('OTHER ');
    expect(output).toEqual([]);
    expect(data.call('READ')).toBe(100000);
  });
});
