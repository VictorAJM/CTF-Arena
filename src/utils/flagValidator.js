export function validateFlag(input, correctFlag) {
  const normalize = (s) => s.trim().toUpperCase().replace(/\s/g, "");
  return normalize(input) === normalize(correctFlag);
}
