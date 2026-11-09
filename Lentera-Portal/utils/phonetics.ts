/**
 * Normalisasi teks bahasa Indonesia untuk Web Speech API (TTS).
 * 1. Memastikan huruf kapital tunggal seperti "L" dan "T" dilafalkan dengan
 *    nama abjad Indonesia yang benar ("El" dan "Te").
 * 2. Menghilangkan pelafalan canggung istilah teknis & serapan Inggris
 *    seperti ON ("menyala"), OFF ("mati"), AI ("A-I"), LED ("el-e-de"),
 *    XP ("ekspe"), Dashboard ("Dasbor"), Live ("Laif"), dsb.
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
    .replace(/\b(kabel|huruf|berbentuk|menyerupai|sudut|cabang)\s+[tT]\b/gi, "$1 Te")
    // Pengucapan alami istilah saklar & sirkuit
    .replace(/\bke posisi ON\b/gi, "ke posisi menyala")
    .replace(/\bke posisi OFF\b/gi, "ke posisi mati")
    .replace(/\bposisi ON\b/gi, "posisi menyala")
    .replace(/\bposisi OFF\b/gi, "posisi mati")
    .replace(/\bhingga ON\b/gi, "hingga menyala")
    .replace(/\bkembali ke OFF\b/gi, "kembali ke mati")
    .replace(/\bsaklar ON\b/gi, "saklar menyala")
    .replace(/\bsaklar OFF\b/gi, "saklar mati")
    .replace(/\bON\b/g, "menyala")
    .replace(/\bOFF\b/g, "mati")
    // Istilah Inggris & Singkatan ke Fonetik Indonesia Alami untuk TTS
    .replace(/\bAI\b/g, "A-I")
    .replace(/\bA\.I\.\b/g, "A-I")
    .replace(/\bLED\b/g, "el-e-de")
    .replace(/\bXP\b/g, "ekspe")
    .replace(/\bWiFi\b/gi, "Wai-Fai")
    .replace(/\bDashboard\b/gi, "Dasbor")
    .replace(/\bLive\b/g, "Laif")
    .replace(/\bArUco\b/gi, "A-ru-ko")
    .replace(/\bROI\b/g, "R-O-I")
    .replace(/\bCSI\b/g, "C-S-I")
    .replace(/\bTroubleshoot(ing)?\b/gi, "Pemecahan Masalah")
    .replace(/\bFeedback\b/gi, "Umpan balik")
    .replace(/\bLuthfi\b/gi, "Lutfi");
}
