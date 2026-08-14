import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Users, X, Plus, Sparkles, Check } from 'lucide-react';

export const NewGroupModal = () => {
  const { isNewGroupModalOpen, setIsNewGroupModalOpen, createGroup, members, currentUser, addToast } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Trip');
  const [currency, setCurrency] = useState('USD');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([currentUser.id]);

  if (!isNewGroupModalOpen) return null;

  const toggleMember = (memberId) => {
    if (selectedMemberIds.includes(memberId)) {
      if (selectedMemberIds.length > 1) {
        setSelectedMemberIds(selectedMemberIds.filter(id => id !== memberId));
      }
    } else {
      setSelectedMemberIds([...selectedMemberIds, memberId]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Please enter a group title', 'error');
      return;
    }

    const groupMembers = members.filter(m => selectedMemberIds.includes(m.id));

    const created = await createGroup({
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      currency,
      members: groupMembers,
      budgetLimit: budgetLimit ? parseFloat(budgetLimit) : undefined,
    });

    if (created) {
      setIsNewGroupModalOpen(false);
      setName('');
      setDescription('');
      setBudgetLimit('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
        <button
          onClick={() => setIsNewGroupModalOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Create New Shared Group</h3>
            <p className="text-xs text-slate-400">Collaborate on shared trips, apartments, or projects</p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Group Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Hawaii Summer Vacation 2026, Apartment 4B Bills"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white font-medium focus:outline-hidden focus:border-indigo-500"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
              >
                <option value="Trip">Trip & Travel</option>
                <option value="Home">Roommates & Home</option>
                <option value="Event">Event & Party</option>
                <option value="Couple">Couple & Dating</option>
                <option value="Project">Project & Team</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Currency</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="INR">INR (₹)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Budget Cap (Optional)</label>
            <input
              type="number"
              value={budgetLimit}
              onChange={e => setBudgetLimit(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Initial Members</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {members.map(m => {
                const isSelected = selectedMemberIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m.id)}
                    className={`p-2 rounded-xl border flex items-center gap-2 text-xs text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/80 border-indigo-500 text-white'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <img src={m.avatar} alt={m.name} className="w-5 h-5 rounded-full object-cover" />
                    <span className="truncate">{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Group</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
