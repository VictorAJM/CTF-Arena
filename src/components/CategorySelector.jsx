const CATEGORIES = [
  {
    id: "web",
    label: "Web Exploitation",
    icon: "🌐",
    desc: "SQL Injection, XSS, IDOR, Path Traversal",
  },
  {
    id: "crypto",
    label: "Cryptography",
    icon: "🔐",
    desc: "Caesar, Base64, XOR, Vigenère, Hash cracking",
  },
  {
    id: "reversing",
    label: "Reverse Engineering",
    icon: "⚙️",
    desc: "Muy pronto... ¡prepárate para romper binarios!",
    disabled: true,
  },
];

export default function CategorySelector({ selected, onSelect }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-2 tracking-widest">// SELECCIONA CATEGORÍA</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              if (!cat.disabled) onSelect(cat.id);
            }}
            disabled={cat.disabled}
            aria-disabled={cat.disabled}
            className={`border p-4 text-left transition-all ${
              cat.disabled
                ? "border-gray-800 text-gray-600 opacity-70 cursor-not-allowed"
                : selected === cat.id
                ? "border-[#00ff41] bg-[#00ff4110] text-[#00ff41]"
                : "border-gray-700 hover:border-[#00ff4166] text-gray-300"
            }`}
          >
            <div className="text-2xl mb-1">{cat.icon}</div>
            <div className="font-bold text-sm">{cat.label}</div>
            <div className={`text-xs mt-1 ${cat.disabled ? "text-[#00ff41]/60" : "text-gray-500"}`}>
              {cat.desc}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
