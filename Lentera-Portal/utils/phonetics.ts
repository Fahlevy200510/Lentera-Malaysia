/**
 * Normalisasi teks bahasa Indonesia untuk Web Speech API (TTS).
 * Memastikan huruf kapital tunggal seperti "L" dan "T" dilafalkan dengan
 * nama abjad Indonesia yang benar ("El" dan "Te"), bukan sebagai satuan
 * metrik (liter, ton) atau konsonan yang tertelan/rusak oleh synthesizer.
 */
export function normalizeIndonesianPhonetics(text: string): string {
  if (!text) return "";
  return text
    // Huruf kapital mandiri L -> El (contoh: "Kabel L", "huruf L", "sudut L")
    .replace(/\bL\b/g, "El")
    // Huruf kapital mandiri T -> Te (contoh: "Kabel T", "huruf T", "cabang T")
    .replace(/\bT\b/g, "Te")
    // Kasus huruf kecil kontekstual (contoh: "kabel l", "kabel t", "bentuk l")
    .replace(/\b(kabel|huruf|berbentuk|menyerupai|sudut|cabang)\s+[lL]\b/gi, "$1 El")
    .replace(/\b(kabel|huruf|berbentuk|menyerupai|sudut|cabang)\s+[tT]\b/gi, "$1 Te");
}
