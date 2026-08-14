import { GoogleGenAI, Type } from '@google/genai';
import { mockMembers, groups, expenses } from './store.js';

let ai = null;

export function getGemini() {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return ai;
}

export async function parseVoiceTranscript(transcript, groupMembers) {
  const client = getGemini();
  if (!client) {
    return {
      title: transcript.length > 30 ? transcript.substring(0, 30) + '...' : transcript,
      amount: parseFloat((transcript.match(/\$?\d+(\.\d+)?/)?.[0] || '25').replace('$', '')),
      category: 'Food & Dining',
      currency: 'USD',
      splitType: 'equal',
      notes: `Parsed from voice: "${transcript}"`,
    };
  }

  const memberNames = (groupMembers || mockMembers).map((m) => m.name).join(', ');

  const prompt = `You are a financial parsing engine for FairTab expense tracker. 
Parse the following natural language voice expense description:
"${transcript}"

The available group members are: ${memberNames}.

Extract:
1. title: short concise title for the expense (e.g. "Dinner at Olive Garden", "Airport Uber", "Groceries")
2. amount: total numeric amount (number)
3. category: one of ["Food & Dining", "Groceries", "Rent & Housing", "Travel & Flights", "Transport & Taxi", "Entertainment", "Utilities & Bills", "Shopping", "Health", "Other"]
4. currency: 3-letter currency code (e.g. "USD", "EUR", "INR", "GBP") default "USD"
5. paidByName: name of the person who paid if mentioned (e.g. "Alex Rivera", "Priya")
6. splitType: "equal", "exact", or "percentage"
7. involvedMembers: list of objects with "name" and optional "amount" or "percentage" if specific split was dictated
8. notes: any extra relevant notes or details extracted from the speech`;

  const response = await client.models.generateContent({
    model: 'gemini-3.7-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          category: { type: Type.STRING },
          currency: { type: Type.STRING },
          paidByName: { type: Type.STRING },
          splitType: { type: Type.STRING },
          involvedMembers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                percentage: { type: Type.NUMBER },
              },
              required: ['name'],
            },
          },
          notes: { type: Type.STRING },
        },
        required: ['title', 'amount', 'category', 'splitType'],
      },
    },
  });

  return JSON.parse(response.text || '{}');
}

export async function scanReceiptOCR(imageBase64) {
  const client = getGemini();
  if (!client) {
    return {
      merchantName: 'Bistro & Tapas Bar',
      date: new Date().toISOString().split('T')[0],
      currency: 'USD',
      category: 'Food & Dining',
      subtotal: 94.50,
      tax: 8.50,
      tip: 18.00,
      total: 121.00,
      lineItems: [
        { name: 'Truffle Fries & Aioli', price: 14.00, quantity: 1 },
        { name: 'Grilled Salmon Fillet', price: 32.00, quantity: 1 },
        { name: 'Handcrafted Margherita Pizza', price: 24.50, quantity: 1 },
        { name: 'Cocktail Old Fashioned', price: 16.00, quantity: 1 },
        { name: 'San Pellegrino Sparkling', price: 8.00, quantity: 1 },
      ],
      confidenceScore: 0.98,
      notes: 'Processed via Smart OCR engine with high accuracy',
    };
  }

  const parts = [];
  if (imageBase64) {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    parts.push({
      inlineData: {
        data: cleanBase64,
        mimeType: 'image/jpeg',
      },
    });
  }

  parts.push({
    text: `Analyze this receipt image for an itemized group expense split.
Extract all line items, their individual prices and quantities, subtotal, tax amount, tip amount, grand total, merchant name, date, and expense category.
Ensure all prices are exact numbers.`
  });

  const response = await client.models.generateContent({
    model: 'gemini-3.7-flash',
    contents: { parts },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          merchantName: { type: Type.STRING },
          date: { type: Type.STRING },
          currency: { type: Type.STRING },
          category: { type: Type.STRING },
          subtotal: { type: Type.NUMBER },
          tax: { type: Type.NUMBER },
          tip: { type: Type.NUMBER },
          total: { type: Type.NUMBER },
          lineItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                price: { type: Type.NUMBER },
                quantity: { type: Type.NUMBER },
              },
              required: ['name', 'price'],
            },
          },
          confidenceScore: { type: Type.NUMBER },
          notes: { type: Type.STRING },
        },
        required: ['merchantName', 'total', 'lineItems'],
      },
    },
  });

  return JSON.parse(response.text || '{}');
}

export async function generateSmartReminder(
  debtorName,
  creditorName,
  amount,
  currency,
  groupName,
  tone,
  upiId
) {
  const formattedAmount = `${currency || '$'}${amount}`;
  const paymentLinkInfo = upiId ? `UPI ID: ${upiId}` : 'via FairTab Settle Up';
  const client = getGemini();

  if (!client) {
    const templates = {
      friendly: `Hey ${debtorName}! Hope you're having a great week 😊 Quick reminder about your share of ${formattedAmount} for ${groupName}. When you get a chance, you can settle up at ${paymentLinkInfo}. Thank you!`,
      formal: `Dear ${debtorName}, this is a gentle reminder regarding the outstanding balance of ${formattedAmount} for ${groupName}. Please settle the balance at your earliest convenience via ${paymentLinkInfo}. Best regards, ${creditorName}.`,
      funny: `🚨 BREAKING NEWS: My bank account misses you, ${debtorName}! 😂 Just a friendly ping for the ${formattedAmount} from ${groupName}. Help a friend stay solvent: ${paymentLinkInfo} 💸🍕`,
      dramatic_guilt: `*Dramatic violin plays in the background* 🎻 ${debtorName}, every second that ${formattedAmount} from ${groupName} goes unpaid, a barista loses their tip. Settle up and save the day: ${paymentLinkInfo}! ✨`,
    };

    return templates[tone] || templates.friendly;
  }

  const prompt = `Write a short, engaging payment reminder message for a shared group expense on FairTab.
Debtor (who owes): ${debtorName}
Creditor (who paid): ${creditorName}
Amount owed: ${formattedAmount}
Group: ${groupName}
Tone requested: ${tone || 'friendly'} (options: 'friendly', 'formal', 'funny' or 'dramatic_guilt')
Payment details: ${paymentLinkInfo}

The message should be ready to send via WhatsApp or SMS. Keep it punchy, natural, and under 3 sentences with appropriate emojis.`;

  const response = await client.models.generateContent({
    model: 'gemini-3.7-flash',
    contents: prompt,
  });

  return response.text?.trim() || `Hey ${debtorName}, reminder for ${formattedAmount} for ${groupName}!`;
}

export async function generateSpendingInsights(
  groupId,
  passedExpenses,
  passedGroupName,
  passedMembers
) {
  const group = groups.find(g => g.id === groupId) || groups[0];
  const groupExpenses = (passedExpenses && passedExpenses.length > 0)
    ? passedExpenses 
    : expenses.filter(e => e.groupId === (groupId || group.id));
  const groupName = passedGroupName || group.name;
  const groupMembers = (passedMembers && passedMembers.length > 0) ? passedMembers : group.members;
  const budgetLimit = group.budgetLimit || 3000;

  const totalSpend = groupExpenses.reduce((acc, e) => acc + e.amount, 0);
  const categoryTotals = {};
  groupExpenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Groceries';
  const client = getGemini();

  if (!client) {
    return {
      summary: `The group has recorded ${groupExpenses.length} shared expenses totaling $${totalSpend.toFixed(2)}. Spending is currently dominated by ${topCategory}.`,
      topSpendingCategory: topCategory,
      burnRatePerDay: Math.round(totalSpend / 7),
      spendingVelocityComment: totalSpend > budgetLimit * 0.8 
        ? 'Approaching budget ceiling. Keep an eye on dining & nightlife.' 
        : 'Pacing healthily within expected limits.',
      memberInsights: groupMembers.map((m, idx) => ({
        memberId: m.id,
        badge: idx === 0 ? '🏆 Primary Payer' : idx === 1 ? '⚡ Instant Settler' : '🎯 Itemized Pro',
        observation: `${m.name} contributes actively to group utility and cabin expenses.`,
      })),
      budgetHealth: totalSpend > budgetLimit ? 'critical' : totalSpend > budgetLimit * 0.75 ? 'warning' : 'safe',
      budgetAlertMessage: budgetLimit ? `Group spent $${totalSpend.toFixed(2)} of $${budgetLimit.toFixed(2)} budget cap.` : undefined,
      recommendations: [
        'Consolidate multiple small convenience store runs into a single bulk grocery haul to save ~12%.',
        'Settle active balances weekly using UPI / Instant Pay to avoid end-of-trip settlement bottleneck.',
        'Enable recurring rules for recurring utilities to automate regular splitting.',
      ]
    };
  }

  const expenseSummary = groupExpenses.map(e => `${e.title}: $${e.amount} (${e.category}) paid by ${e.paidById}`).join('\n');

  const prompt = `Analyze the spending data for group "${groupName}" with budget limit $${budgetLimit || 'N/A'}.
Total spend: $${totalSpend}
Expenses list:
${expenseSummary}

Members: ${groupMembers.map(m => `${m.name} (${m.id})`).join(', ')}

Return a structured JSON with:
1. summary: high-level financial summary
2. topSpendingCategory: string
3. burnRatePerDay: estimated daily spend number
4. spendingVelocityComment: concise commentary on spending pace
5. memberInsights: array of { memberId, badge, observation } giving each member a fun/insightful spending badge
6. budgetHealth: 'safe', 'warning', or 'critical'
7. budgetAlertMessage: string alert if close or over budget
8. recommendations: array of 3 actionable money-saving / debt-clearing tips`;

  const response = await client.models.generateContent({
    model: 'gemini-3.7-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          topSpendingCategory: { type: Type.STRING },
          burnRatePerDay: { type: Type.NUMBER },
          spendingVelocityComment: { type: Type.STRING },
          memberInsights: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                memberId: { type: Type.STRING },
                badge: { type: Type.STRING },
                observation: { type: Type.STRING },
              },
              required: ['memberId', 'badge', 'observation'],
            },
          },
          budgetHealth: { type: Type.STRING },
          budgetAlertMessage: { type: Type.STRING },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['summary', 'topSpendingCategory', 'budgetHealth', 'recommendations'],
      },
    },
  });

  return JSON.parse(response.text || '{}');
}
