// Mirrors data.cob (DataProgram). Balances are stored as integer cents.
const INITIAL_BALANCE_CENTS = 100000; // 1000.00

function createDataProgram(initialBalance = INITIAL_BALANCE_CENTS) {
  let storageBalance = initialBalance;

  // READ returns the stored balance, WRITE replaces it; anything else is a no-op.
  function call(operation, balance) {
    if (operation === 'READ') return storageBalance;
    if (operation === 'WRITE') storageBalance = balance;
    return balance;
  }

  return { call };
}

module.exports = { createDataProgram, INITIAL_BALANCE_CENTS };
