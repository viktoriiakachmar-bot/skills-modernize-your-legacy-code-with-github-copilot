# Test Plan: COBOL Account Management System

This test plan covers the business logic of the COBOL app in `src/cobol` (`MainProgram`, `Operations`, `DataProgram`). It is intended for validation with business stakeholders and as the basis for Node.js unit and integration tests.

**Conventions**

- Initial balance on every program start is `1000.00` (the balance is in memory only and is not persisted between runs).
- Balances and amounts are unsigned with 6 integer digits and 2 decimals (max `999999.99`).
- "Actual Result" and "Status" are left blank to be completed during test execution.
- Test cases marked **(Observed behavior)** describe what the COBOL code does today but may not be an intended business rule. Stakeholders should confirm whether to keep, change, or reject the behavior in the Node.js version.

## 1. Menu and navigation (`MainProgram`)

| Test Case ID | Test Case Description | Pre-conditions | Test Steps | Expected Result | Actual Result | Status (Pass/Fail) | Comments |
|---|---|---|---|---|---|---|---|
| TC-001 | Menu is displayed on start | Application started | 1. Launch the app. | Menu shows "Account Management System" with options 1. View Balance, 2. Credit Account, 3. Debit Account, 4. Exit, and the prompt "Enter your choice (1-4):". | | | |
| TC-002 | Exit the application | Application started | 1. Enter `4`. | Message "Exiting the program. Goodbye!" is shown and the app terminates. | | | |
| TC-003 | Invalid numeric menu choice (0) | Application started | 1. Enter `0`. | Message "Invalid choice, please select 1-4." is shown and the menu is displayed again. | | | |
| TC-004 | Invalid numeric menu choice (5-9) | Application started | 1. Enter `5`. 2. Enter `9`. | For each entry, "Invalid choice, please select 1-4." is shown and the menu is displayed again. | | | |
| TC-005 | Menu repeats after each operation | Application started | 1. Enter `1`. 2. Observe the output. 3. Enter `4`. | After the balance is shown, the menu is displayed again; the app only ends on choice `4`. | | | |
| TC-006 | Non-numeric menu input **(Observed behavior)** | Application started | 1. Enter `a`. | COBOL has no explicit validation for this; the input is not a valid choice and should not crash the app or change the balance. Stakeholders to confirm expected message. | | | Behavior depends on the COBOL runtime; define explicit handling in Node.js. |
| TC-007 | Multi-digit menu input **(Observed behavior)** | Application started | 1. Enter `12`. | The menu choice field holds a single digit. Stakeholders to confirm expected handling (reject as invalid vs. truncate). | | | Define explicit handling in Node.js. |

## 2. View balance (`TOTAL`)

| Test Case ID | Test Case Description | Pre-conditions | Test Steps | Expected Result | Actual Result | Status (Pass/Fail) | Comments |
|---|---|---|---|---|---|---|---|
| TC-010 | View initial balance | Application freshly started (no transactions) | 1. Enter `1`. | "Current balance: 001000.00" is displayed. | | | The COBOL display shows the unedited numeric field (6 integer digits, 2 decimals, no decimal point shown by some compilers). Stakeholders to confirm display format. |
| TC-011 | View balance does not change balance | Application freshly started | 1. Enter `1`. 2. Enter `1` again. | Both displays show the same balance (`1000.00`). | | | |
| TC-012 | View balance after credit | Credit of 500.00 completed | 1. Enter `1`. | Balance displayed is `1500.00`. | | | |
| TC-013 | View balance after debit | Debit of 200.00 completed from 1000.00 | 1. Enter `1`. | Balance displayed is `800.00`. | | | |

## 3. Credit account (`CREDIT`)

| Test Case ID | Test Case Description | Pre-conditions | Test Steps | Expected Result | Actual Result | Status (Pass/Fail) | Comments |
|---|---|---|---|---|---|---|---|
| TC-020 | Credit a whole-number amount | Balance is 1000.00 | 1. Enter `2`. 2. Enter amount `500`. | Prompt "Enter credit amount:" is shown; message "Amount credited. New balance:" shows `1500.00`. | | | |
| TC-021 | Credit a decimal amount | Balance is 1000.00 | 1. Enter `2`. 2. Enter amount `250.75`. | New balance is `1250.75`. | | | |
| TC-022 | Credit of zero | Balance is 1000.00 | 1. Enter `2`. 2. Enter amount `0`. | Balance remains `1000.00`; success message is shown. | | | No business rule rejects zero. Stakeholders to confirm. |
| TC-023 | Credit is persisted for later operations | Balance is 1000.00 | 1. Credit `100`. 2. Select View Balance. | Balance is `1100.00`. | | | Validates the `DataProgram` WRITE then READ flow. |
| TC-024 | Multiple consecutive credits accumulate | Balance is 1000.00 | 1. Credit `100`. 2. Credit `200`. 3. Credit `300`. 4. View balance. | Balance is `1600.00`. | | | |
| TC-025 | Credit up to the maximum balance | Balance is 1000.00 | 1. Credit `998999.99`. | New balance is `999999.99`. | | | Boundary of the 6-digit field. |
| TC-026 | Credit that exceeds the maximum balance **(Observed behavior)** | Balance is 999999.99 | 1. Credit `1`. | COBOL `ADD` has no size-error handling, so the high-order digit is lost and the balance is not `1000000.00`. Stakeholders to confirm the intended rule (e.g., reject credits that exceed the maximum). | | | Likely a defect to avoid in Node.js. |
| TC-027 | Credit with a negative amount **(Observed behavior)** | Balance is 1000.00 | 1. Enter `2`. 2. Enter `-100`. | The amount field is unsigned, so the sign is not retained. Stakeholders to confirm expected handling (reject as invalid). | | | No validation exists in COBOL. |
| TC-028 | Credit with non-numeric amount **(Observed behavior)** | Balance is 1000.00 | 1. Enter `2`. 2. Enter `abc`. | No explicit validation exists. The balance should not be corrupted. Stakeholders to confirm expected message. | | | Define explicit validation in Node.js. |
| TC-029 | Credit with more than two decimals **(Observed behavior)** | Balance is 1000.00 | 1. Enter `2`. 2. Enter `10.999`. | The amount field holds two decimals, so extra digits are truncated (not rounded). Stakeholders to confirm. | | | |

## 4. Debit account (`DEBIT`)

| Test Case ID | Test Case Description | Pre-conditions | Test Steps | Expected Result | Actual Result | Status (Pass/Fail) | Comments |
|---|---|---|---|---|---|---|---|
| TC-030 | Debit less than the balance | Balance is 1000.00 | 1. Enter `3`. 2. Enter amount `300`. | Prompt "Enter debit amount:" is shown; "Amount debited. New balance:" shows `700.00`. | | | |
| TC-031 | Debit a decimal amount | Balance is 1000.00 | 1. Enter `3`. 2. Enter amount `99.99`. | New balance is `900.01`. | | | |
| TC-032 | Debit equal to the balance | Balance is 1000.00 | 1. Enter `3`. 2. Enter amount `1000`. | Debit is allowed; new balance is `0.00`. | | | Business rule: balance >= amount. |
| TC-033 | Debit greater than the balance | Balance is 1000.00 | 1. Enter `3`. 2. Enter amount `1000.01`. | "Insufficient funds for this debit." is shown; balance remains `1000.00`. | | | |
| TC-034 | Balance unchanged after rejected debit | TC-033 completed | 1. Select View Balance. | Balance is `1000.00`. | | | Confirms no WRITE occurs on failure. |
| TC-035 | Debit when balance is zero | Balance is 0.00 | 1. Enter `3`. 2. Enter amount `0.01`. | "Insufficient funds for this debit." is shown; balance remains `0.00`. | | | |
| TC-036 | Debit of zero | Balance is 1000.00 | 1. Enter `3`. 2. Enter amount `0`. | Debit is accepted; balance remains `1000.00`. | | | No business rule rejects zero. Stakeholders to confirm. |
| TC-037 | Multiple consecutive debits | Balance is 1000.00 | 1. Debit `100`. 2. Debit `200`. 3. View balance. | Balance is `700.00`. | | | |
| TC-038 | Debit with a negative amount **(Observed behavior)** | Balance is 1000.00 | 1. Enter `3`. 2. Enter `-100`. | The amount field is unsigned, so the sign is not retained. Stakeholders to confirm expected handling (reject as invalid). | | | No validation exists in COBOL. |
| TC-039 | Debit with non-numeric amount **(Observed behavior)** | Balance is 1000.00 | 1. Enter `3`. 2. Enter `abc`. | No explicit validation exists. The balance should not be corrupted. Stakeholders to confirm expected message. | | | Define explicit validation in Node.js. |

## 5. Combined scenarios and data persistence (`Operations` and `DataProgram`)

| Test Case ID | Test Case Description | Pre-conditions | Test Steps | Expected Result | Actual Result | Status (Pass/Fail) | Comments |
|---|---|---|---|---|---|---|---|
| TC-040 | Credit then debit | Balance is 1000.00 | 1. Credit `500`. 2. Debit `200`. 3. View balance. | Balance is `1300.00`. | | | |
| TC-041 | Debit enabled by a prior credit | Balance is 1000.00 | 1. Debit `1500` (rejected). 2. Credit `1000`. 3. Debit `1500`. 4. View balance. | Step 1 shows insufficient funds; after step 3 the balance is `500.00`. | | | |
| TC-042 | Rejected debit does not block later operations | Balance is 1000.00 | 1. Debit `2000` (rejected). 2. Debit `100`. | Second debit succeeds; balance is `900.00`. | | | |
| TC-043 | Balance resets on each application start | Balance changed during a previous run | 1. Exit the app. 2. Start it again. 3. View balance. | Balance is `1000.00`. | | | No persistent storage exists in the COBOL app. Stakeholders to confirm whether persistence is required in Node.js. |
| TC-044 | Full session flow | Application freshly started | 1. View balance. 2. Credit `250.50`. 3. Debit `100.25`. 4. View balance. 5. Enter an invalid choice `7`. 6. Exit. | Balances shown: `1000.00`, `1250.50`, then `1150.25`; invalid choice message is shown; goodbye message on exit. | | | End-to-end integration scenario. |

## 6. Data layer interface (`DataProgram`), for unit tests

| Test Case ID | Test Case Description | Pre-conditions | Test Steps | Expected Result | Actual Result | Status (Pass/Fail) | Comments |
|---|---|---|---|---|---|---|---|
| TC-050 | READ returns the stored balance | Stored balance is 1000.00 | 1. Call the data layer with operation `READ`. | Returns `1000.00`. | | | |
| TC-051 | WRITE replaces the stored balance | Stored balance is 1000.00 | 1. Call with `WRITE` and value `1234.56`. 2. Call with `READ`. | `READ` returns `1234.56`. | | | |
| TC-052 | Unknown operation leaves balance unchanged | Stored balance is 1000.00 | 1. Call with an operation other than `READ` or `WRITE`. 2. Call with `READ`. | Stored balance is unchanged (`1000.00`). | | | |
| TC-053 | Operations dispatch: unknown operation type | Application started | 1. Call `Operations` with a value other than `TOTAL`, `CREDIT` or `DEBIT`. | No action is performed and the balance is unchanged. | | | Not reachable through the menu; for unit tests only. |

## Summary of business rules covered

| Rule | Test Cases |
|---|---|
| Initial balance is 1000.00 | TC-010, TC-043 |
| View balance is read-only | TC-011, TC-012, TC-013 |
| Credits add to the balance | TC-020 to TC-025, TC-040 |
| Debits are allowed only if balance >= amount | TC-030 to TC-036, TC-041 |
| Rejected debits leave the balance unchanged | TC-033, TC-034, TC-035, TC-042 |
| Balance persists across operations within a session | TC-023, TC-024, TC-037, TC-044, TC-051 |
| Menu loop, exit, and invalid choice handling | TC-001 to TC-005 |
| Field limits and input validation gaps (to be decided by stakeholders) | TC-006, TC-007, TC-026 to TC-029, TC-038, TC-039 |
