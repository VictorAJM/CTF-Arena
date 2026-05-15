const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;
const TRAILING_URL_PUNCTUATION = /[.,;:!?)}\]]+$/;

function trimTrailingPunctuation(value) {
  const trailing = value.match(TRAILING_URL_PUNCTUATION)?.[0] ?? "";
  if (!trailing) return { url: value, trailing };

  return {
    url: value.slice(0, -trailing.length),
    trailing,
  };
}

export function splitTextByUrls(text) {
  const content = String(text ?? "");
  const parts = [];
  let lastIndex = 0;

  for (const match of content.matchAll(URL_PATTERN)) {
    const matchIndex = match.index ?? 0;
    const rawUrl = match[0];

    if (matchIndex > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, matchIndex) });
    }

    const { url, trailing } = trimTrailingPunctuation(rawUrl);
    if (url) {
      parts.push({ type: "link", value: url, href: url });
    }
    if (trailing) {
      parts.push({ type: "text", value: trailing });
    }

    lastIndex = matchIndex + rawUrl.length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", value: "" }];
}
