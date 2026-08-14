import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ReceiptScanResult, ExpenseItem, ExpenseCategory } from '../types';
import { formatCurrency } from '../utils/debtSimplification';
import { 
  Receipt, Upload, Sparkles, Check, X, RefreshCw, Plus, 
  Trash2, DollarSign, Users, ArrowRight, ShieldCheck, Tag 
} from 'lucide-react';

export const ReceiptScannerModal: React.FC = () => {
  const { 
    isReceiptModalOpen, 
    setIsReceiptModalOpen, 
    activeGroup, 
    members, 
    currentUser, 
    addExpense, 
    addToast 
  } = useApp();

  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ReceiptScanResult | null>(null);
  
  // Interactive assignment state
  const [payerId, setPayerId] = useState(currentUser.id);
  const [merchant, setMerchant] = useState('');
  const [tax, setTax] = useState<number>(0);
  const [tip, setTip] = useState<number>(0);
  const [items, setItems] = useState<{ id: string; name: string; price: number; assignedMemberIds: string[] }[]>([]);

  if (!activeGroup || !isReceiptModalOpen) return null;

  const currency = activeGroup.currency || 'USD';

  // Sample receipts for instant testing
  const sampleReceipts = [
    {
      label: '🍽️ Italian Bistro Dinner ($121.00)',
      image: 'https://images.unsplash.com/photo-1554415707-9e4c0197af57?w=400&auto=format&fit=crop&q=80',
      data: {
        merchantName: 'Trattoria Bella Vista',
        date: new Date().toISOString().split('T')[0],
        currency: 'USD',
        category: 'Food & Dining' as ExpenseCategory,
        subtotal: 94.50,
        tax: 8.50,
        tip: 18.00,
        total: 121.00,
        lineItems: [
          { name: 'Wood-fired Truffle Pizza', price: 28.00 },
          { name: 'House Chianti Wine (Bottle)', price: 34.00 },
          { name: 'Handmade Tagliatelle Ragu', price: 24.50 },
          { name: 'Tiramisu Tradizionale', price: 8.00 },
        ]
      }
    },
    {
      label: '🛒 Whole Foods Groceries ($168.40)',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80',
      data: {
        merchantName: 'Whole Foods Market',
        date: new Date().toISOString().split('T')[0],
        currency: 'USD',
        category: 'Groceries' as ExpenseCategory,
        subtotal: 154.00,
        tax: 14.40,
        tip: 0.00,
        total: 168.40,
        lineItems: [
          { name: 'Organic Ribeye Steaks (2pk)', price: 46.00 },
          { name: 'Organic Almond Milk & Coffee', price: 22.00 },
          { name: 'Fresh Organic Berries & Produce', price: 38.00 },
          { name: 'Artisan Cheeses & Crackers', price: 48.00 },
        ]
      }
    }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setReceiptImage(base64);
        processReceipt(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const processReceipt = async (imageBase64?: string, preloadedData?: any) => {
    setIsScanning(true);
    try {
      if (preloadedData) {
        // Instant simulated load for rich preloaded samples
        setTimeout(() => {
          applyScanData(preloadedData);
          setIsScanning(false);
        }, 600);
        return;
      }

      const res = await fetch('/api/ai/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });
      const data = await res.json();
      if (data.receipt) {
        applyScanData(data.receipt);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to analyze receipt', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const applyScanData = (data: ReceiptScanResult) => {
    setScanResult(data);
    setMerchant(data.merchantName || 'Receipt Expense');
    setTax(data.tax || 0);
    setTip(data.tip || 0);
    
    // Assign all group members by default to all items, or leave open
    const initialItems = data.lineItems.map((item, idx) => ({
      id: `itm_${idx}_${Date.now()}`,
      name: item.name,
      price: item.price,
      assignedMemberIds: activeGroup.members.map(m => m.id), // default split equally across everyone
    }));
    setItems(initialItems);
  };

  const toggleItemMember = (itemId: string, memberId: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const isAssigned = item.assignedMemberIds.includes(memberId);
      const newAssignments = isAssigned
        ? item.assignedMemberIds.filter(id => id !== memberId)
        : [...item.assignedMemberIds, memberId];
      
      // Ensure at least one member is selected
      return {
        ...item,
        assignedMemberIds: newAssignments.length > 0 ? newAssignments : [memberId],
      };
    }));
  };

  // Compute calculated itemized shares including proportional tax and tip
  const calculateFinalSplits = () => {
    const rawItemTotals: Record<string, number> = {};
    activeGroup.members.forEach(m => {
      rawItemTotals[m.id] = 0;
    });

    let itemsSubtotal = 0;
    items.forEach(item => {
      itemsSubtotal += item.price;
      const sharePerPerson = item.price / item.assignedMemberIds.length;
      item.assignedMemberIds.forEach(mid => {
        rawItemTotals[mid] = (rawItemTotals[mid] || 0) + sharePerPerson;
      });
    });

    const totalTaxTip = (tax || 0) + (tip || 0);
    const grandTotal = itemsSubtotal + totalTaxTip;

    const splits = activeGroup.members.map(m => {
      const memberItemShare = rawItemTotals[m.id] || 0;
      const proportionalRatio = itemsSubtotal > 0 ? memberItemShare / itemsSubtotal : (1 / activeGroup.members.length);
      const memberTaxTip = proportionalRatio * totalTaxTip;
      const finalShare = Math.round((memberItemShare + memberTaxTip) * 100) / 100;
      return {
        memberId: m.id,
        amount: finalShare,
      };
    });

    return { splits, grandTotal, itemsSubtotal };
  };

  const handleSaveItemizedExpense = async () => {
    const { splits, grandTotal } = calculateFinalSplits();

    const created = await addExpense({
      title: merchant || 'Scanned Receipt Expense',
      amount: grandTotal,
      currency,
      category: scanResult?.category || 'Food & Dining',
      paidById: payerId,
      date: scanResult?.date || new Date().toISOString().split('T')[0],
      splitType: 'itemized',
      items: items.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        assignedMemberIds: i.assignedMemberIds,
      })),
      tax,
      tip,
      receiptUrl: receiptImage || undefined,
      notes: `Itemized OCR scan with proportional tax ($${tax.toFixed(2)}) and tip ($${tip.toFixed(2)})`,
    });

    if (created) {
      setIsReceiptModalOpen(false);
      setScanResult(null);
      setReceiptImage(null);
    }
  };

  const { splits, grandTotal } = calculateFinalSplits();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={() => setIsReceiptModalOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Receipt OCR & Itemized Splitting
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Gemini Vision
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Extract line items automatically, assign who ordered what, and calculate proportional tax/tip.
            </p>
          </div>
        </div>

        {/* Upload / Preload Selector */}
        {!scanResult && (
          <div className="space-y-4">
            
            {/* Dropzone */}
            <label className="border-2 border-dashed border-slate-700 hover:border-purple-500/60 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-950/40 hover:bg-purple-950/10 transition cursor-pointer">
              <Upload className="w-10 h-10 text-purple-400 mb-2 animate-pulse" />
              <p className="text-sm font-semibold text-white">Upload or drop receipt photograph</p>
              <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, WEBP receipts</p>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            {/* Sample Receipts */}
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-2">Or test with high-res sample receipts:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sampleReceipts.map((samp, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setReceiptImage(samp.image);
                      processReceipt(undefined, samp.data);
                    }}
                    className="p-3 rounded-xl bg-slate-800/80 hover:bg-purple-950/40 border border-slate-700 hover:border-purple-500/40 text-left transition flex items-center gap-3 cursor-pointer"
                  >
                    <img src={samp.image} alt={samp.label} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <p className="text-xs font-bold text-white">{samp.label}</p>
                      <p className="text-[10px] text-purple-300">Click to run AI extraction</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {isScanning && (
              <div className="p-6 rounded-2xl bg-purple-950/30 border border-purple-500/40 text-center animate-pulse">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-2" />
                <p className="text-sm font-bold text-white">Extracting receipt line items & totals...</p>
                <p className="text-xs text-purple-300 mt-1">Processing item names, quantities, and sales tax with Gemini Vision</p>
              </div>
            )}

          </div>
        )}

        {/* Interactive Item Assignment Grid (After OCR Scan) */}
        {scanResult && (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            {/* Header info: Merchant, Payer, Tax, Tip */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Merchant</label>
                <input
                  type="text"
                  value={merchant}
                  onChange={e => setMerchant(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Paid By</label>
                <select
                  value={payerId}
                  onChange={e => setPayerId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  {activeGroup.members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Sales Tax ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={tax}
                  onChange={e => setTax(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tip ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={tip}
                  onChange={e => setTip(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            {/* Line Items List with Member Assignment Avatars */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Assign Line Items to Members
                </span>
                <span className="text-xs text-purple-400">
                  Tap member avatars to toggle who shared each item
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {items.map(item => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between sm:justify-start gap-2">
                        <span className="font-semibold text-sm text-white">{item.name}</span>
                        <span className="font-extrabold text-sm text-purple-300">
                          {formatCurrency(item.price, currency)}
                        </span>
                      </div>
                    </div>

                    {/* Member Selection Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {activeGroup.members.map(m => {
                        const isAssigned = item.assignedMemberIds.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => toggleItemMember(item.id, m.id)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                              isAssigned
                                ? 'bg-purple-600 text-white font-bold ring-2 ring-purple-400/40'
                                : 'bg-slate-900 text-slate-500 opacity-50 hover:opacity-80'
                            }`}
                            title={`Toggle ${m.name}`}
                          >
                            <img src={m.avatar} alt={m.name} className="w-4 h-4 rounded-full object-cover" />
                            <span>{m.name.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculated Individual Shares Preview */}
            <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Proportional Final Shares (Tax & Tip Included)
                </span>
                <span className="text-sm font-extrabold text-white">
                  Grand Total: {formatCurrency(grandTotal, currency)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {splits.map(split => {
                  const m = activeGroup.members.find(mem => mem.id === split.memberId);
                  return (
                    <div key={split.memberId} className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <img src={m?.avatar} alt={m?.name} className="w-5 h-5 rounded-full object-cover" />
                        <span className="font-semibold text-slate-200 truncate">{m?.name.split(' ')[0]}</span>
                      </div>
                      <span className="font-extrabold text-white">
                        {formatCurrency(split.amount, currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setScanResult(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition"
              >
                Scan Another Receipt
              </button>
              <button
                type="button"
                onClick={handleSaveItemizedExpense}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md flex items-center gap-2 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Itemized Expense to Group</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
