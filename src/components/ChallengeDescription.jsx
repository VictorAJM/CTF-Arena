import { splitTextByUrls } from "../utils/linkifyText";

/**
 * Renderiza el enunciado escapado por React y convierte URLs absolutas en enlaces.
 * @param {{ description?: string }} props
 */
export default function ChallengeDescription({ description }) {
  return (
    <p className="text-sm text-gray-300 leading-relaxed border-l-2 border-gray-700 pl-3 whitespace-pre-wrap break-words">
      {splitTextByUrls(description).map((part, index) => {
        if (part.type === "link") {
          return (
            <a
              key={`${part.href}-${index}`}
              href={part.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00ff41] underline decoration-[#00ff41]/60 underline-offset-2 hover:text-white hover:decoration-white transition-colors break-all"
            >
              {part.value}
            </a>
          );
        }

        return <span key={`text-${index}`}>{part.value}</span>;
      })}
    </p>
  );
}
