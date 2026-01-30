import { useState, useEffect } from 'react';
import { getParts, addPart, deletePart, updatePart, importData } from './lib/storage';

const TYPE_ICONS = {
  'GPU': (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"/><path d="M6 12v-4a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v4"/><path d="M6 12v4a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-4"/><path d="M9 16h6"/></svg>,
  'CPU': (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3"/><path d="M15 1v3"/><path d="M9 20v3"/><path d="M15 20v3"/><path d="M20 9h3"/><path d="M20 14h3"/><path d="M1 9h3"/><path d="M1 14h3"/></svg>,
  'Motherboard': (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M6 18h12"/></svg>,
  'RAM': (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"/><path d="M2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6"/><path d="M2 12V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6"/><path d="M6 15v3"/><path d="M10 15v3"/><path d="M14 15v3"/><path d="M18 15v3"/></svg>,
  'PSU': (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h.01"/><path d="M10 12h.01"/><path d="M18 12h-2"/></svg>,
  'Case': (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M12 2v20"/><path d="M16 6h2"/><path d="M16 10h2"/></svg>,
  'Other': (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
};

export default function App() {
  const [parts, setParts] = useState([]);
  const [formData, setFormData] = useState({ name: '', type: 'GPU', price: '', notes: '' });
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [selectedPart, setSelectedPart] = useState(null);
  const [isSelling, setIsSelling] = useState(false);
  const [sellPrice, setSellPrice] = useState('');

  useEffect(() => {
    const loadData = () => setParts(getParts());
    loadData();
    
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

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
        status: 'available',
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
    setSelectedPart(null);
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

  const exportJSON = () => {
    const dataStr = JSON.stringify(parts, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const link = document.createElement("a");
    link.setAttribute("href", dataUri);
    link.setAttribute("download", "rigflipper_backup.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (Array.isArray(data) && confirm('Overwrite inventory with backup?')) {
          setParts(importData(data));
        }
      } catch (err) { alert('Invalid file'); }
    };
    reader.readAsText(file);
  };

  const handleSell = (e) => {
    e.preventDefault();
    if (!sellPrice || !selectedPart) return;

    const updated = updatePart(selectedPart.id, {
      status: 'sold',
      soldPrice: parseFloat(sellPrice),
      dateSold: new Date().toISOString()
    });

    setParts(updated);
    setSelectedPart(null);
    setIsSelling(false);
    setSellPrice('');
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this record?')) {
      const updated = deletePart(id);
      setParts(updated);
      setSelectedPart(null);
    }
  };

  const filteredParts = parts
    .filter(p => {
      if (filter === 'available' && p.status === 'sold') return false;
      if (filter === 'sold' && p.status !== 'sold') return false;
      return p.name.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      if (sort === 'oldest') return new Date(a.dateAdded) - new Date(b.dateAdded);
      if (sort === 'price-high') return b.price - a.price;
      if (sort === 'price-low') return a.price - b.price;
      return new Date(b.dateAdded) - new Date(a.dateAdded);
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
            <div className="flex gap-4 self-center">
              <button onClick={exportCSV} className="text-slate-500 hover:text-white transition-colors text-xs uppercase font-bold tracking-wider">CSV</button>
              <button onClick={exportJSON} className="text-slate-500 hover:text-white transition-colors text-xs uppercase font-bold tracking-wider">Backup</button>
              <label className="text-slate-500 hover:text-white transition-colors text-xs uppercase font-bold tracking-wider cursor-pointer">
                Restore <input type="file" className="hidden" accept=".json" onChange={handleImport} />
              </label>
            </div>
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

          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
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
              <div className="flex gap-2 w-full sm:w-auto">
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="bg-surface-dark border border-surface-border rounded-lg px-3 py-1.5 text-sm text-white focus:border-accent-primary focus:outline-none w-full sm:w-40"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <select 
                  value={sort} 
                  onChange={e => setSort(e.target.value)}
                  className="bg-surface-dark border border-surface-border rounded-lg px-3 py-1.5 text-sm text-white focus:border-accent-primary focus:outline-none appearance-none"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="price-high">Price: High</option>
                  <option value="price-low">Price: Low</option>
                </select>
              </div>
            </div>

            {filteredParts.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-surface-border rounded-xl bg-surface-card/30">
                <p className="text-slate-500">No items found.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredParts.map(part => (
                  <div 
                    key={part.id} 
                    onClick={() => { setSelectedPart(part); setIsSelling(false); }}
                    className={`group bg-surface-card border ${part.status === 'sold' ? 'border-surface-border opacity-60' : 'border-surface-border hover:border-accent-primary/50'} rounded-lg p-3 flex items-center justify-between transition-all cursor-pointer hover:bg-surface-border/30`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shadow-inner ${part.status === 'sold' ? 'bg-surface-dark text-slate-600' : 'bg-surface-dark text-accent-primary'}`}>
                        {(TYPE_ICONS[part.type] || TYPE_ICONS['Other'])({ className: "w-6 h-6" })}
                      </div>
                      <div>
                        <h3 className={`font-medium text-sm ${part.status === 'sold' ? 'text-slate-500 line-through' : 'text-white'}`}>{part.name}</h3>
                        <p className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">{part.type}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {part.status === 'sold' ? (
                        <span className="font-mono text-emerald-500/80 text-sm font-bold">SOLD</span>
                      ) : (
                        <span className="font-mono text-white text-sm font-medium">${part.price?.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedPart && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedPart(null)}>
            <div className="bg-surface-card border border-surface-border rounded-xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden" onClick={e => e.stopPropagation()}>
              
              <div className="p-6 border-b border-surface-border flex items-start justify-between bg-surface-dark/50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-surface-dark border border-surface-border flex items-center justify-center text-accent-primary">
                    {(TYPE_ICONS[selectedPart.type] || TYPE_ICONS['Other'])({ className: "w-8 h-8" })}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedPart.name}</h2>
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">{selectedPart.type}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedPart(null)} className="text-slate-500 hover:text-white">✕</button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-dark p-3 rounded-lg border border-surface-border">
                    <p className="text-xs text-slate-500 uppercase font-bold">Buy Price</p>
                    <p className="text-lg font-mono text-white">${selectedPart.price.toFixed(2)}</p>
                  </div>
                  <div className="bg-surface-dark p-3 rounded-lg border border-surface-border">
                    <p className="text-xs text-slate-500 uppercase font-bold">Status</p>
                    <p className={`text-lg font-mono font-bold ${selectedPart.status === 'sold' ? 'text-emerald-400' : 'text-accent-primary'}`}>
                      {selectedPart.status.toUpperCase()}
                    </p>
                  </div>
                </div>

                {selectedPart.status === 'sold' && (
                  <div className="bg-emerald-500/10 p-4 rounded-lg border border-emerald-500/20">
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-400 font-bold">Sold For</span>
                      <span className="text-xl font-mono text-white">${selectedPart.soldPrice?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-emerald-500/20">
                      <span className="text-xs text-emerald-400/70 uppercase font-bold">Profit</span>
                      <span className="font-mono text-emerald-400">+${(selectedPart.soldPrice - selectedPart.price).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-2">Notes</p>
                  <div className="bg-surface-dark p-3 rounded-lg border border-surface-border min-h-[80px] text-sm text-slate-300">
                    {selectedPart.notes || <span className="text-slate-600 italic">No notes added.</span>}
                  </div>
                </div>

                <div className="text-xs text-slate-600 font-mono flex justify-between">
                  <span>Added: {new Date(selectedPart.dateAdded).toLocaleDateString()}</span>
                  {selectedPart.dateSold && <span>Sold: {new Date(selectedPart.dateSold).toLocaleDateString()}</span>}
                </div>
              </div>

              <div className="p-4 bg-surface-dark/50 border-t border-surface-border flex gap-3">
                {selectedPart.status !== 'sold' && !isSelling && (
                  <button onClick={() => setIsSelling(true)} className="flex-1 bg-accent-primary hover:bg-blue-600 text-white font-bold py-2.5 rounded-lg transition-colors">
                    Sell Item
                  </button>
                )}

                {isSelling && (
                  <form onSubmit={handleSell} className="flex-1 flex gap-2 animate-in slide-in-from-bottom-2">
                    <input 
                      autoFocus
                      type="number" 
                      placeholder="Sale Price ($)"
                      className="flex-1 bg-surface-dark border border-surface-border rounded-lg px-3 text-white focus:border-accent-primary focus:outline-none"
                      value={sellPrice}
                      onChange={e => setSellPrice(e.target.value)}
                    />
                    <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 rounded-lg">Confirm</button>
                    <button type="button" onClick={() => setIsSelling(false)} className="bg-surface-border hover:bg-zinc-700 text-white font-bold px-3 rounded-lg">✕</button>
                  </form>
                )}

                {!isSelling && (
                  <>
                    <button onClick={() => startEdit(selectedPart)} className="px-4 py-2.5 bg-surface-dark border border-surface-border hover:bg-surface-border text-white rounded-lg font-bold transition-colors">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(selectedPart.id)} className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-lg font-bold transition-colors">
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}