/**
 * Calculates net balances, raw pairwise debts, and simplified minimum-cash-flow debts.
 */
export function calculateGroupDebts(
  members = [],
  expenses = [],
  settlements = []
) {
  if (!members || members.length === 0) {
    return {
      rawDebts: [],
      simplifiedDebts: [],
      memberBalances: {},
      totalGroupSpend: 0,
    };
  }

  const memberBalances = {};
  const memberIds = members.map(m => m.id);

  // Initialize balances for each member
  memberIds.forEach(id => {
    memberBalances[id] = {
      memberId: id,
      paidTotal: 0,
      owedTotal: 0,
      netBalance: 0,
    };
  });

  let totalGroupSpend = 0;

  // Pairwise debt ledger: pairwiseMatrix[debtorId][creditorId] = amount owed
  const pairwiseMatrix = {};
  memberIds.forEach(i => {
    pairwiseMatrix[i] = {};
    memberIds.forEach(j => {
      pairwiseMatrix[i][j] = 0;
    });
  });

  // Process all expenses
  expenses.forEach(exp => {
    totalGroupSpend += exp.amount;
    const payerId = exp.paidById;

    if (memberBalances[payerId]) {
      memberBalances[payerId].paidTotal += exp.amount;
    }

    // Process splits
    if (exp.splits && exp.splits.length > 0) {
      exp.splits.forEach(split => {
        const borrowerId = split.memberId;
        const share = split.amount;

        if (memberBalances[borrowerId]) {
          memberBalances[borrowerId].owedTotal += share;
        }

        // If someone else paid for this share, borrower owes payer
        if (borrowerId !== payerId && pairwiseMatrix[borrowerId] && pairwiseMatrix[borrowerId][payerId] !== undefined) {
          pairwiseMatrix[borrowerId][payerId] += share;
        }
      });
    } else {
      // Equal split fallback if splits array is empty
      const splitAmount = exp.amount / members.length;
      members.forEach(m => {
        if (memberBalances[m.id]) {
          memberBalances[m.id].owedTotal += splitAmount;
        }
        if (m.id !== payerId && pairwiseMatrix[m.id] && pairwiseMatrix[m.id][payerId] !== undefined) {
          pairwiseMatrix[m.id][payerId] += splitAmount;
        }
      });
    }
  });

  // Process completed settlements
  settlements
    .filter(s => s.status === 'completed')
    .forEach(set => {
      const from = set.fromMemberId;
      const to = set.toMemberId;
      const amount = set.amount;

      // Settlement reduces from's debt to 'to'
      if (pairwiseMatrix[from] && pairwiseMatrix[from][to] !== undefined) {
        pairwiseMatrix[from][to] -= amount;
      }

      // Net balance adjustment: from paid off debt (+), to received money (-)
      if (memberBalances[from]) {
        memberBalances[from].paidTotal += amount;
      }
      if (memberBalances[to]) {
        memberBalances[to].owedTotal += amount;
      }
    });

  // Calculate net balances: Net = Paid - Owed
  memberIds.forEach(id => {
    const mb = memberBalances[id];
    mb.netBalance = Math.round((mb.paidTotal - mb.owedTotal) * 100) / 100;
  });

  // Build raw pairwise debts from pairwise matrix after simplifying bilateral debts (A owes B $50 & B owes A $20 -> A owes B $30)
  const rawDebts = [];
  for (let i = 0; i < memberIds.length; i++) {
    for (let j = i + 1; j < memberIds.length; j++) {
      const u = memberIds[i];
      const v = memberIds[j];
      const uOwesV = pairwiseMatrix[u][v] || 0;
      const vOwesU = pairwiseMatrix[v][u] || 0;
      const diff = Math.round((uOwesV - vOwesU) * 100) / 100;

      if (diff > 0.01) {
        rawDebts.push({ from: u, to: v, amount: diff });
      } else if (diff < -0.01) {
        rawDebts.push({ from: v, to: u, amount: Math.abs(diff) });
      }
    }
  }

  // Minimum Cash Flow Algorithm (Greedy Max Debtor / Max Creditor)
  // Operates on the net balance array of each member to minimize number of transactions
  const simplifiedDebts = [];

  if (memberIds.length < 2) {
    return {
      rawDebts,
      simplifiedDebts: [],
      memberBalances,
      totalGroupSpend: Math.round(totalGroupSpend * 100) / 100,
    };
  }

  // Work with a mutable copy of net balances
  const netList = memberIds.map(id => ({
    memberId: id,
    balance: Math.round((memberBalances[id]?.netBalance || 0) * 100) / 100,
  }));

  // Iterate until all balances are resolved (within floating epsilon)
  let maxIterations = 200;
  while (netList.length >= 2 && maxIterations-- > 0) {
    // Sort descending: highest positive balance (biggest creditor) at index 0,
    // lowest negative balance (biggest debtor) at the end.
    netList.sort((a, b) => b.balance - a.balance);

    const maxCreditor = netList[0];
    const maxDebtor = netList[netList.length - 1];

    if (!maxCreditor || !maxDebtor) {
      break;
    }

    // If largest credit or debt is negligible, we are done
    if (Math.abs(maxCreditor.balance) < 0.01 && Math.abs(maxDebtor.balance) < 0.01) {
      break;
    }

    if (maxCreditor.balance <= 0.009 || maxDebtor.balance >= -0.009) {
      break;
    }

    // Amount to transfer is min(creditor balance, abs(debtor balance))
    const settleAmount = Math.round(Math.min(maxCreditor.balance, Math.abs(maxDebtor.balance)) * 100) / 100;

    if (settleAmount > 0.01 && maxDebtor.memberId !== maxCreditor.memberId) {
      simplifiedDebts.push({
        from: maxDebtor.memberId,
        to: maxCreditor.memberId,
        amount: settleAmount,
      });

      maxCreditor.balance = Math.round((maxCreditor.balance - settleAmount) * 100) / 100;
      maxDebtor.balance = Math.round((maxDebtor.balance + settleAmount) * 100) / 100;
    } else {
      break;
    }
  }

  return {
    rawDebts,
    simplifiedDebts,
    memberBalances,
    totalGroupSpend: Math.round(totalGroupSpend * 100) / 100,
  };
}

export function formatCurrency(amount, currency = 'USD') {
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
    CAD: 'CA$',
    AUD: 'A$',
  };
  const sym = symbols[currency] || `${currency} `;
  return `${sym}${Math.abs(amount).toFixed(2)}`;
}
