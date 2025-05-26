
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
        // Ensure participant exists in balancesMap (e.g. if added after expense)
        if (!balancesMap.has(participant)) {
          balancesMap.set(participant, 0);
        }
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


export function consolidateIndividualPayments(initialSettlements: Settlement[]): Settlement[] {
  const netFlows = new Map<string, Map<string, number>>();

  function setFlow(from: string, to: string, amount: number) {
    if (!netFlows.has(from)) netFlows.set(from, new Map());
    const roundedAmount = parseFloat(amount.toFixed(2));
    if (roundedAmount < 0.01) {
      netFlows.get(from)!.delete(to);
      if (netFlows.get(from)!.size === 0) netFlows.delete(from);
    } else {
      netFlows.get(from)!.set(to, roundedAmount);
    }
  }

  function adjustFlow(from: string, to: string, amount: number) {
    if (from === to || amount === 0) return;
    let currentAmount = parseFloat(amount.toFixed(2));

    const currentToFrom = netFlows.get(to)?.get(from) || 0;

    if (currentToFrom > 0) {
      if (currentToFrom >= currentAmount) {
        setFlow(to, from, currentToFrom - currentAmount);
        currentAmount = 0;
      } else {
        setFlow(to, from, 0);
        currentAmount -= currentToFrom;
      }
    }
    
    if (currentAmount > 0) {
       const currentFromTo = netFlows.get(from)?.get(to) || 0;
       setFlow(from, to, currentFromTo + currentAmount);
    }
  }

  initialSettlements.forEach(s => {
    adjustFlow(s.from, s.to, s.amount);
  });
  
  const originalPaymentsFrom = new Map<string, { to: string, amount: number }[]>();
  initialSettlements.forEach(s => {
    if (!originalPaymentsFrom.has(s.from)) originalPaymentsFrom.set(s.from, []);
    originalPaymentsFrom.get(s.from)!.push({ to: s.to, amount: s.amount });
  });


  const payersToConsolidate = Array.from(originalPaymentsFrom.keys()).filter(payer => {
    const payments = originalPaymentsFrom.get(payer);
    return payments && payments.length > 1;
  });

  for (const payer of payersToConsolidate) {
    const payerOriginalPayments = originalPaymentsFrom.get(payer)!; 
    // At this point, payerOriginalPayments.length > 1 is guaranteed

    const intermediary = payerOriginalPayments[0].to; // First payee as intermediary
    let totalPaidByPayer = 0;

    // Remove all current payments from this payer in netFlows
    // and sum their total
    payerOriginalPayments.forEach(p => {
      totalPaidByPayer += p.amount;
      setFlow(payer, p.to, 0); 
    });
    totalPaidByPayer = parseFloat(totalPaidByPayer.toFixed(2));


    // Payer pays total to intermediary
    adjustFlow(payer, intermediary, totalPaidByPayer);

    // Intermediary pays others (skipping the first payment which was to intermediary itself)
    for (let i = 0; i < payerOriginalPayments.length; i++) {
      const payment = payerOriginalPayments[i];
      if (payment.to !== intermediary) { // If this part of debt was not originally to intermediary
         adjustFlow(intermediary, payment.to, payment.amount);
      }
    }
  }

  const finalSettlementsList: Settlement[] = [];
  netFlows.forEach((toMap, from) => {
    toMap.forEach((amount, to) => {
      if (amount >= 0.01) {
        finalSettlementsList.push({ from, to, amount });
      }
    });
  });
  return finalSettlementsList;
}
