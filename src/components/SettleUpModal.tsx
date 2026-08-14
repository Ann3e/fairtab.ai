import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/debtSimplification';
import confetti from 'canvas-confetti';
import { 
  Wallet, QrCode, ExternalLink, Check, X, 
  Smartphone, CreditCard, Banknote, ShieldCheck, Sparkles 
} from 'lucide-react';

export const SettleUpModal: React.FC = () => {
  const { 
    isSettleModalOpen, 
    setIsSettleModalOpen, 
    settleTarget, 
    activeGroup, 
    members, 
    currentUser, 
    addSettlement, 
    addToast 
  } = useApp();

  const [toMemberId, setToMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'paypal' | 'cash' | 'bank_transfer'>('upi');
  const [notes, setNotes] = useState('');
  const [referenceId, setReferenceId] = useState('');

  useEffect(() => {
    if (settleTarget) {
      if (settleTarget.toMemberId) setToMemberId(settleTarget.toMemberId);
      if (settleTarget.amount) setAmount(settleTarget.amount.toString());
    } else if (activeGroup?.members) {
      const other = activeGroup.members.find(m => m.id !== currentUser.id);
      if (other) setToMemberId(other.id);
    }
  }, [settleTarget, activeGroup, currentUser.id]);

  if (!isSettleModalOpen || !activeGroup) return null;

  const currency = activeGroup.currency || 'USD';
  const receiver = members.find(m => m.id === toMemberId) || activeGroup.members.find(m => m.id !== currentUser.id);

  // Generate UPI Deep Link
  const upiId = receiver?.upiId || 'payment@upi';
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(receiver?.name || 'Receiver')}&am=${amount || '0'}&cu=${currency === 'INR' ? 'INR' : 'USD'}&tn=${encodeURIComponent(`FairTab settlement for ${activeGroup.name}`)}`;

  // Generate PayPal Link
  const paypalUrl = receiver?.paypalHandle 
    ? `https://paypal.me/${receiver.paypalHandle}/${amount}`
    : `https://paypal.me`;

  const handleRecordSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toMemberId || !amount || parseFloat(amount) <= 0) {
      addToast('Please enter a valid receiver and amount', 'error');
      return;
    }

    const created = await addSettlement({
      fromMemberId: currentUser.id,
      toMemberId,
      amount: parseFloat(amount),
      currency,
      paymentMethod,
      notes: notes || `Settled via ${paymentMethod.toUpperCase()}`,
      referenceId: referenceId || `${paymentMethod.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'completed',
    });

    if (created) {
      // Trigger festive celebration confetti!
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#6366F1', '#F59E0B', '#EC4899'],
        });
      } catch (e) {
        // ignore if not supported
      }

      setIsSettleModalOpen(false);
      setAmount('');
      setNotes('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={() => setIsSettleModalOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Settle Balance & Record Payment
            </h3>
            <p className="text-xs text-slate-400">
              Pay using UPI, PayPal, or mark cash repayment.
            </p>
          </div>
        </div>

        <form onSubmit={handleRecordSettlement} className="space-y-4">
          
          {/* Payer and Receiver Selection */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Paying Member</label>
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                <img src={currentUser.avatar} alt={currentUser.name} className="w-6 h-6 rounded-full object-cover" />
                <span className="text-xs font-bold text-white truncate">{currentUser.name}</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Receiving Member</label>
              <select
                value={toMemberId}
                onChange={e => setToMemberId(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bold"
                required
              >
                {activeGroup.members.filter(m => m.id !== currentUser.id).map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Settlement Amount ({currency}) *</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xl font-extrabold text-emerald-400 focus:outline-hidden focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Payment Channel</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                  paymentMethod === 'upi'
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('paypal')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                  paymentMethod === 'paypal'
                    ? 'bg-blue-950/60 border-blue-500/50 text-blue-300'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>PayPal</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Cash / Offline</span>
              </button>
            </div>
          </div>

          {/* Real-time Payment Deep Links & QR Preview */}
          {paymentMethod === 'upi' && receiver?.upiId && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Recipient UPI ID:</span>
                <span className="font-mono text-emerald-400 font-bold">{receiver.upiId}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={upiDeepLink}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Open UPI App (GPay / PhonePe)</span>
                </a>
              </div>
            </div>
          )}

          {paymentMethod === 'paypal' && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">PayPal Handle:</span>
                <span className="text-blue-400 font-bold">{receiver?.paypalHandle || 'Direct'}</span>
              </div>
              <a
                href={paypalUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open PayPal.me Transfer</span>
              </a>
            </div>
          )}

          {/* Optional Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Payment Reference / Notes</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Paid via Google Pay #Ref88921"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Record Settlement of {formatCurrency(parseFloat(amount) || 0, currency)}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
