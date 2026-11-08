// src/utils/iddaaHelper.ts
// Generates or retrieves deterministic 5-digit İddaa match codes

export function getMatchIddaaCode(match: { id?: string; iddaaCode?: string }): string {
  if (match.iddaaCode) return match.iddaaCode;
  const idStr = String(match.id || '');
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = ((hash << 5) - hash + idStr.charCodeAt(i)) | 0;
  }
  const code = 10000 + (Math.abs(hash) % 89900);
  return String(code);
}

