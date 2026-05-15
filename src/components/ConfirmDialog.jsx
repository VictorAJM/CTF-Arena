/**
 * @param {{
 *   open: boolean,
 *   title: string,
 *   message: string,
 *   confirmDisabled?: boolean,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 * }} props
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmDisabled = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="w-full max-w-sm border border-[#00ff4133] bg-[#0d0d0d] p-5 shadow-2xl shadow-black">
        <div className="space-y-2 text-center">
          <p className="text-sm font-bold tracking-widest text-[#00ff41]">{title}</p>
          <p className="text-xs leading-relaxed text-gray-400">{message}</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            onClick={onCancel}
            disabled={confirmDisabled}
            className="border border-gray-700 px-3 py-2 text-xs font-bold tracking-widest text-gray-300 transition-colors hover:border-gray-500 hover:text-white disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="bg-[#00ff41] px-3 py-2 text-xs font-bold tracking-widest text-black transition-colors hover:bg-[#00cc33] disabled:opacity-50"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
