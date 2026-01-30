export default function InventoryList({ inventory, onDelete }) {
  if (inventory.length === 0) {
    return (
      <div className="text-center text-zinc-600 py-12 border-2 border-dashed border-zinc-800 rounded font-mono">
        NO HARDWARE DETECTED
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {inventory.map((part) => (
        <div 
          key={part.id} 
          className="flex justify-between items-center bg-zinc-900 p-4 border-l-4 border-zinc-700 hover:border-pcb-green hover:bg-zinc-800 transition-all group"
        >
          <div>
            <p className="font-bold text-lg text-zinc-200 font-mono">{part.name}</p>
            <p className="text-xs text-zinc-500 font-mono">
              {new Date(part.dateAdded).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-pcb-green font-mono">
              ${part.buyPrice.toFixed(2)}
            </span>
            <button 
              onClick={() => onDelete(part.id)}
              className="text-zinc-600 hover:text-red-500 text-sm font-mono uppercase tracking-wider transition-colors"
            >
              [DEL]
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}