export default function StatCard({ label, value }) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-lg shadow-xl hover:border-pcb-green transition-colors duration-300">
      <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-1 font-mono">
        {label}
      </h3>
      <p className="text-2xl font-mono font-bold text-pcb-green truncate">
        {value}
      </p>
    </div>
  );
}