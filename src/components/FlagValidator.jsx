import { useState } from "react";
import { validateFlag } from "../utils/flagValidator";

export default function FlagValidator({ correctFlag, onSuccess }) {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState(null); // "correct" | "wrong" | null

  function handleSubmit(e) {
    e.preventDefault();
    if (validateFlag(input, correctFlag)) {
      setStatus("correct");
      onSuccess();
    } else {
      setStatus("wrong");
      setTimeout(() => setStatus(null), 1500);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="FLAG{...}"
        className={`flex-1 bg-[#1a1a1a] border px-3 py-2 text-sm font-mono focus:outline-none ${
          status === "correct"
            ? "border-green-500 text-green-400"
            : status === "wrong"
            ? "border-red-500 text-red-400"
            : "border-gray-600 text-gray-200 focus:border-[#00ff41]"
        }`}
      />
      <button
        type="submit"
        className="bg-[#00ff41] text-black px-4 py-2 text-sm font-bold hover:bg-[#00cc33] transition-colors"
      >
        ENVIAR
      </button>
    </form>
  );
}
