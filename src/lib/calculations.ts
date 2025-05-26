
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

    if (amountToTransfer >= 0.01) { // Ensure transfer is significant
      settlements.push({
        from: debtor.attendeeName,
        to: creditor.attendeeName,
        amount: parseFloat(amountToTransfer.toFixed(2)), // Round here
      });

      debtor.amount = parseFloat((debtor.amount - amountToTransfer).toFixed(2));
      creditor.amount = parseFloat((creditor.amount - amountToTransfer).toFixed(2));
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
  // This map stores: payer -> (payee -> amount)
  const netFlows = new Map<string, Map<string, number>>();

  // Helper to set a flow, ensuring amounts are rounded and zero amounts are pruned
  function setFlow(from: string, to: string, amount: number) {
    if (!netFlows.has(from)) netFlows.set(from, new Map());
    const roundedAmount = parseFloat(amount.toFixed(2));

    if (roundedAmount < 0.01) { // If amount is negligible, remove the flow
      netFlows.get(from)!.delete(to);
      if (netFlows.get(from)!.size === 0) netFlows.delete(from);
    } else {
      netFlows.get(from)!.set(to, roundedAmount);
    }
  }

  // Helper to adjust flows, handling reversals (e.g., A->B $10, then B->A $5 => A->B $5)
  function adjustFlow(from: string, to: string, amount: number) {
    if (from === to) return; // No change if self-payment
    
    let currentAmount = parseFloat(amount.toFixed(2));
    if (currentAmount < 0.01 && amount !== 0) return; // Ignore negligible positive amounts, but allow explicit zeroing

    // Check if 'to' already owes 'from'
    const currentToFrom = netFlows.get(to)?.get(from) || 0;

    if (currentToFrom > 0) {
      if (currentToFrom >= currentAmount) { // Reverse payment cancels or exceeds new payment
        setFlow(to, from, currentToFrom - currentAmount);
        currentAmount = 0; // New payment is fully offset
      } else { // New payment exceeds reverse payment
        setFlow(to, from, 0); // Reverse payment is fully cancelled
        currentAmount = parseFloat((currentAmount - currentToFrom).toFixed(2)); // Reduce new payment
      }
    }
    
    // If there's still a payment to be made from 'from' to 'to'
    // or if we are explicitly setting a flow (even if currentAmount became 0 due to exact offset by currentToFrom)
    if (currentAmount >= 0.01 || (amount === 0 && currentToFrom === 0) ) { 
       const currentFromTo = netFlows.get(from)?.get(to) || 0;
       setFlow(from, to, currentFromTo + currentAmount);
    } else if (currentAmount === 0 && amount !== 0) { // Explicitly set to 0 if offset
       setFlow(from, to, 0);
    }
  }

  // Initialize netFlows with the optimized settlements
  initialSettlements.forEach(s => {
    adjustFlow(s.from, s.to, s.amount);
  });
  
  // Store original payments for each payer to identify who to consolidate
  const originalPaymentsFrom = new Map<string, { to: string, amount: number }[]>();
  initialSettlements.forEach(s => {
    if (s.amount < 0.01) return; // Ignore negligible settlements
    if (!originalPaymentsFrom.has(s.from)) originalPaymentsFrom.set(s.from, []);
    originalPaymentsFrom.get(s.from)!.push({ to: s.to, amount: s.amount });
  });


  // Find payers making more than one payment in the initial optimized list
  const payersToConsolidate = Array.from(originalPaymentsFrom.keys()).filter(payer => {
    const payments = originalPaymentsFrom.get(payer);
    return payments && payments.length > 1;
  });

  for (const payer of payersToConsolidate) {
    const payerOriginalPayments = originalPaymentsFrom.get(payer)!; 
    if (payerOriginalPayments.length <= 1) continue; // Should be caught by filter, but double check

    const intermediary = payerOriginalPayments[0].to; // Choose the first payee as the intermediary
    let totalPaidByPayer = 0;

    // Sum total and effectively remove original payments from this payer in netFlows
    // by setting them to 0.
    payerOriginalPayments.forEach(p => {
      totalPaidByPayer += p.amount;
      // Crucially, ensure these flows are *actually removed* from netFlows
      // before re-adding the consolidated flow. adjustFlow will handle this.
      adjustFlow(payer, p.to, -p.amount); // Effectively subtracts the original payment
    });
    totalPaidByPayer = parseFloat(totalPaidByPayer.toFixed(2));


    // Payer now pays the total sum to the chosen intermediary
    if (totalPaidByPayer >= 0.01) {
      adjustFlow(payer, intermediary, totalPaidByPayer);
    }

    // Intermediary now pays the other original recipients on behalf of the payer
    for (const payment of payerOriginalPayments) {
      if (payment.to !== intermediary && payment.amount >=0.01) { 
         adjustFlow(intermediary, payment.to, payment.amount);
      }
    }
  }

  // Convert the final netFlows map back to a list of settlements
  const finalSettlementsList: Settlement[] = [];
  netFlows.forEach((toMap, from) => {
    toMap.forEach((amount, to) => {
      if (amount >= 0.01) { // Ensure we only list significant payments
        finalSettlementsList.push({ from, to, amount });
      }
    });
  });
  return finalSettlementsList;
}

