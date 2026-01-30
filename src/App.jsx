import { useState, useEffect } from 'react';
import { getParts, addPart, deletePart, updatePart } from './lib/storage';

export default function App() {
  const [parts, setParts] = useState([]);
  const [formData, setFormData] = useState({ name: '', type: 'GPU', price: '', notes: '' });
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'available', 'sold'
  const [sellModal, setSellModal] = useState(null); // ID of item being sold
  const [sellPrice, setSellPrice] = useState('');

  useEffect(() => {
    const loadData = () => setParts(getParts());
    loadData();
    
    // Listen for storage events to sync stats across tabs immediately
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  // Stats Calculation
  const stats = parts.reduce((acc, part) => {
    if (part.status === 'sold') {
      acc.revenue += part.soldPrice || 0;
      acc.profit += (part.soldPrice || 0) - part.price;
      acc.soldCount++;
    } else {
      acc.invested += part.price || 0;
      acc.activeCount++;
    }
    return acc;
  }, { invested: 0, revenue: 0, profit: 0, activeCount: 0, soldCount: 0 });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;
    
    if (editingId) {
      const updated = updatePart(editingId, {
        name: formData.name,
        type: formData.type,
        price: parseFloat(formData.price),
        notes: formData.notes
      });
      setParts(updated);
      setEditingId(null);
    } else {
      const updated = addPart({
        name: formData.name,
        type: formData.type,
        price: parseFloat(formData.price),
        notes: formData.notes,
        status: 'available', // Default status
        soldPrice: null,
        dateSold: null
      });
      setParts(updated);
    }
    
    setFormData({ name: '', type: 'GPU', price: '', notes: '' });
  };

  const startEdit = (part) => {
    setFormData({
      name: part.name,
      type: part.type,
      price: part.price,
      notes: part.notes || ''
    });
    setEditingId(part.id);
  };

  const cancelEdit = () => {
    setFormData({ name: '', type: 'GPU', price: '', notes: '' });
    setEditingId(null);
  };

  const exportCSV = () => {
    const headers = ['Name', 'Type', 'Status', 'Buy Price', 'Sold Price', 'Date Added', 'Notes'];
    const rows = parts.map(p => [
      `"${p.name}"`, p.type, p.status, p.price, p.soldPrice || 0, p.dateAdded, `"${p.notes || ''}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "inventory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSell = (e) => {
    e.preventDefault();
    if (!sellPrice) return;

    const updated = updatePart(sellModal, {
      status: 'sold',
      soldPrice: parseFloat(sellPrice),
      dateSold: new Date().toISOString()
    });

    setParts(updated);
    setSellModal(null);
    setSellPrice('');
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this record?')) {
      const updated = deletePart(id);
      setParts(updated);
    }
  };

  const filteredParts = parts.filter(p => {
    if (filter === 'available') return p.status !== 'sold';
    if (filter === 'sold') return p.status === 'sold';
    return true;
  });

  return (
    <div className="min-h-screen bg-surface-dark text-slate-400 font-sans selection:bg-accent-primary selection:text-white">
      {/* Navbar */}
      <nav className="border-b border-surface-border bg-surface-dark/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-accent-primary/20">R</div>
            <h1 className="text-xl font-bold tracking-tight text-white">RigFlipper</h1>
          </div>
          <div className="flex gap-6 text-sm font-medium">
            <button onClick={exportCSV} className="text-slate-500 hover:text-white transition-colors text-xs uppercase font-bold tracking-wider self-center">Export CSV</button>
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Net Profit</span>
              <span className={`${stats.profit >= 0 ? 'text-emerald-400' : 'text-red-400'} font-mono`}>
                {stats.profit >= 0 ? '+' : ''}${stats.profit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface-card border border-surface-border p-4 rounded-xl">
            <p className="text-xs text-slate-500 uppercase font-bold">Active Inventory</p>
            <p className="text-2xl text-white font-mono mt-1">${stats.invested.toLocaleString()}</p>
          </div>
          <div className="bg-surface-card border border-surface-border p-4 rounded-xl">
            <p className="text-xs text-slate-500 uppercase font-bold">Total Sales</p>
            <p className="text-2xl text-white font-mono mt-1">${stats.revenue.toLocaleString()}</p>
          </div>
          <div className="bg-surface-card border border-surface-border p-4 rounded-xl">
            <p className="text-xs text-slate-500 uppercase font-bold">Items Sold</p>
            <p className="text-2xl text-white font-mono mt-1">{stats.soldCount}</p>
          </div>
          <div className="bg-surface-card border border-surface-border p-4 rounded-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10" />
            <p className="text-xs text-accent-primary uppercase font-bold relative z-10">ROI</p>
            <p className="text-2xl text-white font-mono mt-1 relative z-10">
              {stats.invested > 0 ? ((stats.revenue - (stats.revenue - stats.profit)) / (stats.revenue - stats.profit) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-surface-card border border-surface-border rounded-xl p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-white mb-5">{editingId ? 'Edit Part' : 'Add New Part'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Component Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-surface-dark border border-surface-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-slate-700"
                    placeholder="e.g. RTX 3080"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Type</label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                      className="w-full bg-surface-dark border border-surface-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all appearance-none"
                    >
                      {['GPU', 'CPU', 'Motherboard', 'RAM', 'PSU', 'Case', 'Other'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Buy Price ($)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                      className="w-full bg-surface-dark border border-surface-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-slate-700"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    className="w-full bg-surface-dark border border-surface-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-slate-700 h-20 resize-none"
                    placeholder="Condition, serial number, etc."
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-white hover:bg-slate-200 text-black font-bold py-3 rounded-lg transition-all active:scale-[0.98] mt-2"
                  >
                    {editingId ? 'Update Part' : 'Add to Inventory'}
                  </button>
                  {editingId && (
                    <button type="button" onClick={cancelEdit} className="bg-surface-dark border border-surface-border text-white font-bold px-4 rounded-lg hover:bg-surface-border transition-all mt-2">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* List Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1 bg-surface-card p-1 rounded-lg border border-surface-border">
                {['all', 'available', 'sold'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${filter === f ? 'bg-surface-border text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <span className="text-xs font-mono text-slate-500">{filteredParts.length} ITEMS</span>
            </div>

            {filteredParts.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-surface-border rounded-xl bg-surface-card/30">
                <p className="text-slate-500">No items found.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredParts.map(part => (
                  <div key={part.id} className={`group bg-surface-card border ${part.status === 'sold' ? 'border-surface-border opacity-75' : 'border-surface-border hover:border-accent-primary/50'} rounded-lg p-4 flex items-center justify-between transition-all`}>
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold shadow-inner ${part.status === 'sold' ? 'bg-surface-dark text-slate-600' : 'bg-surface-dark text-accent-primary'}`}>
                        {part.type.substring(0, 3)}
                      </div>
                      <div>
                        <h3 className={`font-medium ${part.status === 'sold' ? 'text-slate-400 line-through' : 'text-white'}`}>{part.name}</h3>
                        <p className="text-xs text-slate-600 font-mono">
                          {part.status === 'sold' ? `Sold: ${new Date(part.dateSold).toLocaleDateString()}` : `Added: ${new Date(part.dateAdded).toLocaleDateString()}`}
                        </p>
                        {part.notes && <p className="text-xs text-slate-500 mt-1 italic">"{part.notes}"</p>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {part.status === 'sold' ? (
                          <>
                            <span className="block font-mono text-emerald-400 font-medium">+${(part.soldPrice - part.price).toFixed(2)}</span>
                            <span className="block text-xs text-slate-600">Sold for ${part.soldPrice}</span>
                          </>
                        ) : (
                          <>
                            <span className="block font-mono text-white font-medium">${part.price?.toFixed(2)}</span>
                            <span className="block text-xs text-slate-600">Cost</span>
                          </>
                        )}
                      </div>

                      {part.status !== 'sold' && (
                        <button
                          onClick={() => setSellModal(part.id)}
                          className="bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary text-xs font-bold px-3 py-1.5 rounded border border-accent-primary/20 transition-colors"
                        >
                          SELL
                        </button>
                      )}

                      <div className="flex gap-1">
                        <button onClick={() => startEdit(part)} className="text-slate-600 hover:text-accent-primary transition-colors p-2 hover:bg-accent-primary/10 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100" title="Edit">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                        </button>
                        <button
                          onClick={() => handleDelete(part.id)}
                          className="text-slate-600 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </div>

                    {/* Inline Sell Modal */}
                    {sellModal === part.id && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-surface-dark border border-surface-border shadow-2xl shadow-black rounded-lg p-2 z-20 animate-in fade-in slide-in-from-right-4 duration-200">
                        <form onSubmit={handleSell} className="flex items-center gap-2">
                          <span className="text-xs font-bold text-accent-primary whitespace-nowrap pl-2">SOLD FOR $</span>
                          <input 
                            autoFocus
                            type="number" 
                            className="bg-surface-card border border-surface-border rounded px-2 py-1 text-white w-24 text-sm focus:outline-none focus:border-accent-primary"
                            value={sellPrice}
                            onChange={e => setSellPrice(e.target.value)}
                          />
                          <button type="submit" className="bg-accent-primary hover:bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors">✓</button>
                          <button type="button" onClick={() => setSellModal(null)} className="text-slate-500 hover:text-white text-xs font-bold px-2 py-1.5">✕</button>
                        </form>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}