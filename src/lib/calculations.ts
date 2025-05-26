import type { Expense, Settlement, Balance } from './types';

export function calculateBalances(attendees: string[], expenses: Expense[]): Balance[] {
  const balancesMap = new Map<string, number>();

  attendees.forEach(attendee => {
    balancesMap.set(attendee, 0);
  });

  expenses.forEach(expense => {
    const paidByAmount = balancesMap.get(expense.paidBy) || 0;
    balancesMap.set(expense.paidBy, paidByAmount + expense.amount);

    if (expense.participants.length > 0) {
      const share = expense.amount / expense.participants.length;
      expense.participants.forEach(participant => {
        const participantAmount = balancesMap.get(participant) || 0;
        balancesMap.set(participant, participantAmount - share);
      });
    }
  });

  const balances: Balance[] = [];
  balancesMap.forEach((amount, attendeeName) => {
    balances.push({ attendeeName, amount });
  });

  return balances;
}

export function optimizeTransactions(balances: Balance[]): Settlement[] {
  const settlements: Settlement[] = [];
  
  // Filter out dust amounts before processing
  const significantBalances = balances
    .map(b => ({ ...b, amount: parseFloat(b.amount.toFixed(2))}))
    .filter(b => Math.abs(b.amount) >= 0.01);

  let debtors = significantBalances.filter(b => b.amount < 0).map(b => ({ ...b, amount: -b.amount })).sort((a, b) => b.amount - a.amount);
  let creditors = significantBalances.filter(b => b.amount > 0).sort((a, b) => b.amount - a.amount);

  let debtorIdx = 0;
  let creditorIdx = 0;

  while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
    const debtor = debtors[debtorIdx];
    const creditor = creditors[creditorIdx];
    const amountToTransfer = Math.min(debtor.amount, creditor.amount);

    if (amountToTransfer > 0) {
      settlements.push({
        from: debtor.attendeeName,
        to: creditor.attendeeName,
        amount: amountToTransfer,
      });

      debtor.amount -= amountToTransfer;
      creditor.amount -= amountToTransfer;
    }

    if (debtor.amount < 0.01) {
      debtorIdx++;
    }
    if (creditor.amount < 0.01) {
      creditorIdx++;
    }
  }

  return settlements;
}
