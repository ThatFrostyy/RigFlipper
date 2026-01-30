import { useState } from 'react';

export default function AddPartForm({ onAdd }) {
  const [formData, setFormData] = useState({ name: '', price: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;
    
    // Pass data up to parent
    onAdd({
      name: formData.name,
      buyPrice: parseFloat(formData.price)
    });

    // Reset form
    setFormData({ name: '', price: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 flex flex-col md:flex-row gap-2">
      <input 
        type="text" 
        placeholder="Part Name (e.g. GTX 1070)" 
        className="bg-zinc-900 border border-zinc-700 p-3 rounded w-full text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-pcb-green font-mono"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
      />
      <div className="flex gap-2">
        <input 
          type="number" 
          placeholder="Price" 
          className="bg-zinc-900 border border-zinc-700 p-3 rounded w-32 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-pcb-green font-mono"
          value={formData.price}
          onChange={(e) => setFormData({...formData, price: e.target.value})}
        />
        <button 
          type="submit" 
          className="bg-pcb-green text-black font-bold px-6 rounded hover:bg-green-400 active:scale-95 transition-transform font-mono"
        >
          ADD
        </button>
      </div>
    </form>
  );
}