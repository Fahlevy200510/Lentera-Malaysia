"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Lock,
  HelpCircle,
  AlertTriangle,
  Compass,
  Zap,
  ArrowRight,
  Hand,
  Lightbulb,
} from "lucide-react";
import {
  completeModule,
  getStudentProgress,
  getActiveStudent,
  PRESET_STUDENTS,
  DEFAULT_PROGRESS,
  type StudentProgress,
  type StudentProfile,
} from "@/utils/progress";
import { playEarcon } from "@/utils/soundEffects";
import { normalizeIndonesianPhonetics } from "@/utils/phonetics";

/* ---------------------------------------------------------------- Types */
type CellData = { component: string; rotation: number };
type StepDef = {
  instruction: string;
  voice: string;
  targetCells?: Record<string, string>; // cell -> expected component
  expectedComponent?: string; // Khusus kuis untuk verifikasi jawaban salah
  validator?: (cells: Record<string, any>, status: string, graphType?: string) => boolean;
  hint?: string;
  explanation?: string;
};

/* ---------------------------------------------------------------- Guide Data */
const RECOGNITION_STEPS: StepDef[] = [
  {
    instruction: "Raba dan cari balok Baterai (simbol + dan - timbul), letakkan di sel C3 tepat di tengah papan.",
    voice: "Mari berkenalan dengan komponen listrik! Komponen pertama adalah Baterai, sumber energi utama rangkaian. Raba balok di mejamu: cari balok yang memiliki simbol timbul tanda tambah plus untuk kutub positif, dan tanda minus mendatar untuk kutub negatif. Letakkan balok Baterai ini di sel C3 tepat di tengah papan.",
    targetCells: { "C3": "battery" },
    hint: "Raba kedua sisi balok: temukan tanda tambah (+) timbul untuk kutub positif dan tanda minus (-) garis mendatar untuk kutub negatif.",
    explanation: "Bagus sekali! Ini adalah balok Baterai, sumber energi utama rangkaian. Baterai menghasilkan tegangan untuk mendorong arus listrik dari kutub positif menuju kutub negatif melalui rangkaian tertutup.",
  },
  {
    instruction: "Raba dan cari balok Saklar (tuas mekanik timbul), letakkan di sel C3.",
    voice: "Komponen kedua adalah Saklar, pengendali aliran listrik. Raba balok yang memiliki tuas mekanik timbul di bagian atasnya yang bisa kamu klik atau geser dengan jari. Saklar berfungsi menyambung dan memutus arus. Letakkan balok Saklar ini di sel C3.",
    targetCells: { "C3": "switch" },
    hint: "Raba bagian atas balok: temukan tuas mekanik yang dapat diklik atau digeser untuk menyambung dan memutus aliran listrik.",
    explanation: "Tepat sekali! Ini adalah balok Saklar. Saklar berfungsi menghubungkan dan memutuskan aliran listrik. Saat tuas saklar ditutup, arus listrik mengalir. Saat tuas dibuka, aliran listrik terputus dan lampu akan padam.",
  },
  {
    instruction: "Raba dan cari balok Lampu LED (kubah bundar timbul & polaritas + / -), letakkan di sel C3.",
    voice: "Komponen ketiga adalah Lampu. Lampu pada Lentera menggunakan LED yang memiliki polaritas kutub positif dan negatif. Raba baloknya: di bagian atas terdapat kubah bundar timbul seperti bohlam kecil, dan di kedua sisinya terdapat simbol timbul plus untuk anoda dan minus untuk katoda. Letakkan balok Lampu ini di sel C3.",
    targetCells: { "C3": "lamp" },
    hint: "Raba kubah bundar dan simbol timbul di sisinya: tanda tambah (+) adalah anoda (kutub positif), dan tanda minus (-) adalah katoda (kutub negatif).",
    explanation: "Luar biasa! Ini adalah balok Lampu LED. Lampu memiliki sifat polaritas satu arah: arus dari kutub positif baterai harus masuk ke kutub positif lampu bertanda plus. Jika terbalik, lampu tidak akan menyala. Jika lampu belum menyala, cukup angkat balok lampu dan putar posisinya 180 derajat!",
  },
  {
    instruction: "Raba dan cari balok Kabel Lurus (alur garis timbul lurus), letakkan di sel C3.",
    voice: "Komponen keempat adalah Kabel Lurus, penghantar arus listrik. Raba permukaan balok: rasakan alur garis timbul lurus yang membentang dari satu sisi tembus ke sisi seberangnya. Letakkan balok Kabel Lurus ini di sel C3.",
    targetCells: { "C3": "straight_cable" },
    hint: "Raba alur timbul: garis lurus melintang berfungsi mengalirkan arus listrik lurus tanpa belokan.",
    explanation: "Bagus sekali! Ini adalah balok Kabel Lurus. Di dalamnya terdapat jalur konduktor tembaga untuk mengalirkan arus listrik secara mendatar atau tegak dalam satu garis lurus tanpa belokan.",
  },
  {
    instruction: "Raba dan cari balok Kabel Sudut L (garis timbul siku 90 derajat), letakkan di sel C3.",
    voice: "Komponen kelima adalah Kabel Sudut L, pemutar arah aliran listrik. Raba permukaannya: rasakan alur garis timbul yang berbelok siku membentuk huruf L. Balok ini dipasang di setiap sudut papan agar lintasan sirkuit bisa berputar kembali ke baterai. Letakkan di sel C3.",
    targetCells: { "C3": "l_cable" },
    hint: "Raba alur siku 90 derajat menyerupai huruf L: kabel ini menghubungkan sisi horizontal dan vertikal di setiap sudut papan.",
    explanation: "Hebat! Ini adalah balok Kabel Sudut L. Kabel ini membelokkan aliran listrik sebesar 90 derajat agar rangkaian dapat berputar kembali ke baterai dan membentuk lintasan tertutup.",
  },
  {
    instruction: "Raba dan cari balok Kabel Cabang T (garis timbul cabang tiga), letakkan di sel C3.",
    voice: "Terakhir, komponen keenam adalah Kabel Cabang T, pembagi arus pada rangkaian paralel. Raba permukaannya: rasakan alur garis timbul bercabang tiga menyerupai huruf T. Balok ini membagi arus listrik menjadi cabang-cabang terpisah untuk setiap lampu. Letakkan di sel C3.",
    targetCells: { "C3": "t_cable" },
    hint: "Raba alur timbul bercabang tiga menyerupai huruf T: kabel utama untuk merakit rangkaian bercabang paralel.",
    explanation: "Luar biasa! Ini adalah balok Kabel Cabang T. Kabel ini memiliki tiga percabangan koneksi untuk membagi aliran listrik menjadi beberapa cabang terpisah untuk masing-masing lampu pada rangkaian paralel.",
  },
];

const QUIZ_STEPS: StepDef[] = [
  {
    instruction: "Tebak di C3: Sumber Energi Listrik",
    voice: "Kuis Taktil dimulai! Pertanyaan pertama: Komponen manakah yang berfungsi sebagai penyimpan energi dan sumber tegangan listrik? Raba dan letakkan balok jawabanmu di kotak tengah C3 untuk menjawab.",
    targetCells: { "C3": "battery" },
    expectedComponent: "battery",
    validator: (cells) => Boolean(cells["C3"] && cells["C3"].component === "battery"),
    hint: "Cari balok yang memiliki simbol timbul plus dan minus di kedua ujungnya, lalu letakkan di kotak tengah C3.",
    explanation: "Hebat sekali! Jawabanmu tepat! Baterai adalah sumber energi listrik yang menghasilkan tegangan untuk mendorong arus.",
  },
  {
    instruction: "Tebak di C3: Pengubah Listrik Menjadi Cahaya",
    voice: "Pertanyaan kedua: Komponen manakah yang berfungsi mengubah energi listrik menjadi energi cahaya? Raba dan letakkan balok jawabanmu di kotak tengah C3 untuk menjawab.",
    targetCells: { "C3": "lamp" },
    expectedComponent: "lamp",
    validator: (cells) => Boolean(cells["C3"] && cells["C3"].component === "lamp"),
    hint: "Cari balok yang memiliki kubah bulat timbul di bagian atasnya, lalu letakkan di kotak tengah C3.",
    explanation: "Luar biasa! Benar sekali, itu adalah Lampu! Lampu berperan sebagai beban yang bersinar terang saat dialiri arus listrik.",
  },
  {
    instruction: "Tebak di C3: Pengendali Aliran Listrik",
    voice: "Pertanyaan ketiga: Komponen manakah yang berfungsi menghubungkan dan memutuskan aliran listrik? Raba dan letakkan balok jawabanmu di kotak tengah C3 untuk menjawab.",
    targetCells: { "C3": "switch" },
    expectedComponent: "switch",
    validator: (cells) => Boolean(cells["C3"] && cells["C3"].component === "switch"),
    hint: "Cari balok yang memiliki tuas mekanik timbul yang dapat diklik atau digeser, lalu letakkan di kotak tengah C3.",
    explanation: "Tepat sekali! Itu adalah Saklar. Saat saklar ditutup rangkaian terhubung, dan saat dibuka rangkaian terputus.",
  },
  {
    instruction: "Tebak di C3: Kabel Cabang T Rangkaian Paralel",
    voice: "Pertanyaan terakhir: Kabel manakah yang memiliki tiga percabangan untuk membagi aliran listrik pada rangkaian paralel? Raba dan letakkan balok jawabanmu di kotak tengah C3 untuk menjawab.",
    targetCells: { "C3": "t_cable" },
    expectedComponent: "t_cable",
    validator: (cells) => Boolean(cells["C3"] && cells["C3"].component === "t_cable"),
    hint: "Cari kabel yang memiliki alur timbul bercabang tiga seperti huruf T, lalu letakkan di kotak tengah C3.",
    explanation: "Sempurna! Itu adalah Kabel Cabang T. Kabel T membagi arus listrik menjadi cabang-cabang mandiri untuk setiap lampu.",
  },
];

const SERIES_STEPS: StepDef[] = [
  {
    instruction: "Langkah 1: Letakkan Baterai di posisi B4",
    voice: "Langkah 1: Ayo mulai membuat rangkaian seri! Ambil balok baterai, lalu letakkan di posisi B4. Pastikan kutub positif bertanda plus menghadap ke atas menuju baris 5.",
    targetCells: { "B4": "battery" },
    hint: "Raba simbol plus dan minus pada baterai. Letakkan di kolom B baris ke-4 dengan tanda plus di atas.",
  },
  {
    instruction: "Langkah 2: Pasang Kabel Sudut L di posisi B5",
    voice: "Langkah 2: Ambil balok kabel sudut L. Letakkan di posisi B5, tepat di atas baterai, untuk membelokkan arus ke arah kanan.",
    targetCells: { "B5": "l_cable" },
    hint: "Raba alur kabel L yang membelok 90 derajat. Pasang di B5 menghadap ke kanan dan ke bawah.",
  },
  {
    instruction: "Langkah 3: Pasang Saklar pertama di posisi C5",
    voice: "Langkah 3: Ambil balok saklar pertama. Letakkan mendatar di posisi C5, tepat di sebelah kanan kabel sudut B5.",
    targetCells: { "C5": "switch" },
    hint: "Raba tuas saklar di bagian atas balok. Letakkan mendatar di C5 di tengah baris atas.",
  },
  {
    instruction: "Langkah 4: Pasang Lampu pertama di posisi D5",
    voice: "Langkah 4: Ambil balok lampu pertama. Letakkan di posisi D5, di sebelah kanan saklar. Pastikan tanda kutub positif menghadap ke kiri ke arah saklar.",
    targetCells: { "D5": "lamp" },
    hint: "Raba kubah lampu LED di tengah balok. Pasang di D5 dengan tanda plus menghadap ke kiri.",
  },
  {
    instruction: "Langkah 5: Pasang Kabel Sudut L di posisi E5",
    voice: "Langkah 5: Ambil kabel sudut L kedua. Letakkan di sudut kanan atas pada posisi E5 untuk membelokkan arus ke bawah.",
    targetCells: { "E5": "l_cable" },
    hint: "Raba kabel sudut L. Pasang di sudut kanan atas E5 menghadap ke kiri dan ke bawah.",
  },
  {
    instruction: "Langkah 6: Pasang Saklar kedua di posisi E4",
    voice: "Langkah 6: Ambil balok saklar kedua. Letakkan di posisi E4 secara tegak, tepat di bawah sudut E5.",
    targetCells: { "E4": "switch" },
    hint: "Raba tuas saklar. Letakkan di E4 dalam posisi jalur tegak menyambung dari E5.",
  },
  {
    instruction: "Langkah 7: Pasang Lampu kedua di posisi E3",
    voice: "Langkah 7: Ambil balok lampu kedua. Letakkan di posisi E3 di bawah saklar kedua. Pastikan kutub positif menghadap ke atas menuju saklar.",
    targetCells: { "E3": "lamp" },
    hint: "Raba kubah lampu LED. Pasang di E3 secara tegak dengan tanda plus menghadap ke atas.",
  },
  {
    instruction: "Langkah 8: Pasang Kabel Sudut L di posisi E2",
    voice: "Langkah 8: Ambil kabel sudut L ketiga. Letakkan di sudut kanan bawah pada posisi E2 untuk membelokkan jalur ke arah kiri.",
    targetCells: { "E2": "l_cable" },
    hint: "Raba kabel sudut L. Pasang di E2 menghadap ke atas dan ke kiri.",
  },
  {
    instruction: "Langkah 9: Pasang Kabel Lurus di posisi D2",
    voice: "Langkah 9: Ambil balok kabel lurus. Letakkan mendatar di posisi D2 di sebelah kiri sudut E2.",
    targetCells: { "D2": "straight_cable" },
    hint: "Raba garis lurus timbul melintang. Pasang mendatar di posisi D2.",
  },
  {
    instruction: "Langkah 10: Pasang Kabel Lurus di posisi C2",
    voice: "Langkah 10: Ambil balok kabel lurus berikutnya. Letakkan mendatar di posisi C2 untuk meneruskan jalur ke kiri.",
    targetCells: { "C2": "straight_cable" },
    hint: "Raba kabel garis lurus. Pasang mendatar di posisi C2 di sebelah D2.",
  },
  {
    instruction: "Langkah 11: Pasang Kabel Sudut L di posisi B2",
    voice: "Langkah 11: Ambil kabel sudut L terakhir. Letakkan di sudut kiri bawah pada posisi B2 untuk membelokkan jalur ke atas menuju baterai.",
    targetCells: { "B2": "l_cable" },
    hint: "Raba kabel sudut L. Pasang di B2 menghadap ke kanan dan ke atas.",
  },
  {
    instruction: "Langkah 12: Pasang Kabel Lurus di posisi B3 untuk Menyambungkan Jalur",
    voice: "Langkah 12: Pasang balok kabel terakhir! Ambil kabel lurus, pasang tegak di posisi B3 di antara B2 dan baterai untuk menyatukan seluruh jalur rangkaian.",
    targetCells: { "B3": "straight_cable" },
    hint: "Pasang kabel lurus tegak di B3 di antara B2 dan baterai.",
    explanation: "Hebat! Semua balok sudah tersambung di papan. Tapi perhatikan, lampu belum menyala karena saklar masih terbuka atau mati.",
  },
  {
    instruction: "Langkah 13: Putar Saklar di C5 & E4 ke Posisi ON untuk Menyalakan Lampu",
    voice: "Langkah 13: Sekarang saklarnya masih NO atau mati. Raba tuas saklar di posisi C5 dan E4, lalu putar saklar tersebut ke posisi ON untuk menutup sirkuit dan menyalakan kedua lampu!",
    targetCells: { "C5": "switch", "E4": "switch" },
    validator: (cells, status) => status === "success",
    hint: "Raba tuas saklar di C5 dan E4. Putar tuasnya 90 derajat ke posisi ON hingga lampu menyala bersamaan.",
    explanation: "Sempurna! Kedua saklar sudah ON dan arus listrik mengalir lancar ke seluruh rangkaian seri. Kedua lampu menyala terang bersamaan! Selamat, kamu berhasil menyelesaikan misi rangkaian seri!",
  },
];

const PARALLEL_STEPS: StepDef[] = [
  {
    instruction: "Langkah 1: Letakkan Baterai di posisi C5",
    voice: "Langkah 1: Ayo buat rangkaian paralel yang hemat balok! Mulai dari baris paling atas, letakkan baterai di posisi C5. Pastikan kutub positif bertanda plus menghadap ke kiri ke arah B5.",
    targetCells: { "C5": "battery" },
    hint: "Raba tanda plus dan minus pada baterai. Letakkan mendatar di C5 di tengah baris atas dengan tanda plus di kiri.",
  },
  {
    instruction: "Langkah 2: Pasang Kabel Lurus di posisi D5",
    voice: "Langkah 2: Ambil balok kabel lurus. Letakkan mendatar di posisi D5, tepat di sebelah kanan baterai.",
    targetCells: { "D5": "straight_cable" },
    hint: "Raba alur garis lurus. Pasang mendatar di D5 menyambung dari kutub minus baterai.",
  },
  {
    instruction: "Langkah 3: Pasang Kabel Sudut L di posisi B5",
    voice: "Langkah 3: Ambil kabel sudut L. Letakkan di posisi B5, di sebelah kiri baterai, menghadap ke kanan dan ke bawah.",
    targetCells: { "B5": "l_cable" },
    hint: "Raba kabel sudut L. Pasang di B5 menyambung dari kutub plus baterai dan membelok ke bawah.",
  },
  {
    instruction: "Langkah 4: Pasang Kabel Sudut L di posisi E5",
    voice: "Langkah 4: Ambil kabel sudut L kedua. Letakkan di posisi E5, di sebelah kanan D5, menghadap ke kiri dan ke bawah.",
    targetCells: { "E5": "l_cable" },
    hint: "Raba kabel sudut L. Pasang di sudut kanan atas E5 membelok dari D5 ke arah bawah.",
  },
  {
    instruction: "Langkah 5: Pasang Kabel Cabang T di posisi B4",
    voice: "Langkah 5: Sekarang kita buat percabangan pertama di baris 4. Ambil balok kabel cabang T, pasang di posisi B4 untuk membagi aliran listrik ke dua cabang.",
    targetCells: { "B4": "t_cable" },
    hint: "Raba alur timbul bercabang tiga seperti huruf T. Pasang di B4 dengan cabang membuka ke atas, bawah, dan kanan.",
  },
  {
    instruction: "Langkah 6: Pasang Saklar pertama di posisi C4",
    voice: "Langkah 6: Ambil balok saklar pertama. Letakkan mendatar di posisi C4, di sebelah kanan kabel T.",
    targetCells: { "C4": "switch" },
    hint: "Raba tuas saklar di atas balok. Letakkan mendatar di C4 untuk mengendalikan cabang pertama.",
  },
  {
    instruction: "Langkah 7: Pasang Lampu pertama di posisi D4",
    voice: "Langkah 7: Ambil balok lampu pertama. Letakkan di posisi D4 di sebelah saklar. Pastikan tanda kutub positif menghadap ke kiri ke arah saklar.",
    targetCells: { "D4": "lamp" },
    hint: "Raba kubah lampu LED. Pasang di D4 dengan kutub positif bertanda plus menghadap ke kiri.",
  },
  {
    instruction: "Langkah 8: Pasang Kabel Cabang T di posisi E4",
    voice: "Langkah 8: Ambil kabel cabang T kedua. Pasang di posisi E4 di sebelah kanan lampu untuk menyatukan kembali aliran listrik.",
    targetCells: { "E4": "t_cable" },
    hint: "Raba kabel T bercabang tiga. Pasang di E4 dengan cabang membuka ke atas, bawah, dan kiri.",
  },
  {
    instruction: "Langkah 9: Pasang Kabel Sudut L di posisi B3",
    voice: "Langkah 9: Sekarang kita buat cabang kedua di baris 3. Ambil kabel sudut L, letakkan di posisi B3 menghadap ke atas dan ke kanan.",
    targetCells: { "B3": "l_cable" },
    hint: "Raba kabel sudut L. Pasang di B3 di bawah kabel T, membelokkan arus ke arah kanan.",
  },
  {
    instruction: "Langkah 10: Pasang Saklar kedua di posisi C3",
    voice: "Langkah 10: Ambil balok saklar kedua. Letakkan mendatar di posisi C3, tepat di bawah saklar pertama.",
    targetCells: { "C3": "switch" },
    hint: "Raba tuas saklar. Letakkan mendatar di C3 untuk mengendalikan lampu kedua secara terpisah.",
  },
  {
    instruction: "Langkah 11: Pasang Lampu kedua di posisi D3",
    voice: "Langkah 11: Ambil balok lampu kedua. Letakkan di posisi D3 di sebelah saklar kedua. Pastikan kutub positif menghadap ke kiri ke arah saklar.",
    targetCells: { "D3": "lamp" },
    hint: "Raba kubah lampu LED. Pasang di D3 dengan tanda plus menghadap ke kiri.",
  },
  {
    instruction: "Langkah 12: Pasang Kabel Sudut L di posisi E3 untuk Menyambungkan Cabang Kedua",
    voice: "Langkah 12: Pasang balok kabel terakhir! Ambil kabel sudut L, letakkan di posisi E3 menghadap ke kiri dan ke atas untuk menyambung dari D3 ke cabang T di E4.",
    targetCells: { "E3": "l_cable" },
    hint: "Pasang kabel sudut L di E3 menyambung dari D3 ke arah cabang T di E4.",
    explanation: "Hebat! Seluruh 12 balok rangkaian paralel telah terpasang di papan. Tapi lampu belum menyala karena kedua saklar masih terbuka atau mati.",
  },
  {
    instruction: "Langkah 13: Putar Saklar di C4 atau C3 ke Posisi ON untuk Menyalakan Lampu",
    voice: "Langkah 13: Sekarang saklarnya masih NO atau mati. Putar tuas saklar di posisi C4 atau C3 ke posisi ON untuk mengalirkan arus dan menyalakan lampu pada cabangnya!",
    targetCells: { "C4": "switch", "C3": "switch" },
    validator: (cells, status) => status === "success",
    hint: "Raba tuas saklar di C4 atau C3. Putar tuasnya 90 derajat ke posisi ON hingga lampu pada cabangnya menyala.",
    explanation: "Luar biasa! Lampu berhasil menyala! Di rangkaian paralel, tiap cabang bekerja secara mandiri sehingga lampu bisa dinyalakan dan dimatikan tanpa mempengaruhi cabang lain. Selamat, kamu berhasil menyelesaikan misi rangkaian paralel!",
  },
];


const ADAPTIVE_SERIES_STEPS: StepDef[] = [
  {
    instruction: "Letakkan Baterai di mana saja",
    voice: "Ayo buat rangkaian seri bebas! Mulai dengan meletakkan baterai di mana saja di papan.",
    validator: (cells) => Object.values(cells).some((c: any) => c && c.component === "battery"),
    hint: "Letakkan balok baterai di mana pun kamu suka.",
  },
  {
    instruction: "Letakkan Lampu di mana saja",
    voice: "Bagus! Sekarang letakkan balok lampu di posisi lain di papan.",
    validator: (cells) => Object.values(cells).filter((c: any) => c && c.component === "lamp").length >= 1,
    hint: "Letakkan balok lampu di mana saja.",
  },
  {
    instruction: "Sambungkan dalam satu jalur seri",
    voice: "Sekarang, gunakan kabel dan saklar untuk menyambungkan baterai dan lampu sehingga membentuk satu lintasan loop tertutup. Pastikan tidak ada jalur yang bercabang!",
    validator: (cells, status, graphType) => status === "success" && graphType === "series",
    hint: "Sambungkan baterai ke lampu hingga membentuk loop tertutup.",
  },
];

const ADAPTIVE_PARALLEL_STEPS: StepDef[] = [
  {
    instruction: "Letakkan Baterai di mana saja",
    voice: "Ayo buat rangkaian paralel bebas! Mulai dengan meletakkan baterai di mana saja di papan.",
    validator: (cells) => Object.values(cells).some((c: any) => c && c.component === "battery"),
    hint: "Letakkan balok baterai di mana pun kamu suka.",
  },
  {
    instruction: "Letakkan dua Lampu di mana saja",
    voice: "Bagus! Sekarang letakkan dua lampu di tempat lain di papan.",
    validator: (cells) => Object.values(cells).filter((c: any) => c && c.component === "lamp").length >= 2,
    hint: "Letakkan dua lampu di mana saja.",
  },
  {
    instruction: "Sambungkan dengan beberapa jalur",
    voice: "Sekarang, gunakan kabel untuk menyambungkan baterai dan kedua lampu sehingga setiap lampu memiliki jalurnya sendiri. Kamu akan membutuhkan kabel T untuk membagi aliran listrik!",
    validator: (cells, status, graphType) => status === "success" && graphType === "parallel",
    hint: "Sambungkan sehingga rangkaian bercabang menjadi beberapa jalur.",
  },
];

const TROUBLESHOOT_STEPS: StepDef[] = [
  {
    instruction: "Tantangan 1: Rangkai Sirkuit Kendali Saklar",
    voice: "Tantangan Detektif Sirkuit dimulai! Misi pertama: Buatlah rangkaian satu lampu dengan saklar di posisi mana saja di papan. Pastikan seluruh jalur tersambung hingga lampu berhasil menyala!",
    validator: (cells, status) => {
      const hasBattery = Object.values(cells).some((c: any) => c && c.component === "battery");
      const hasLamp = Object.values(cells).some((c: any) => c && c.component === "lamp");
      const hasSwitch = Object.values(cells).some((c: any) => c && c.component === "switch");
      return status === "success" && hasBattery && hasLamp && hasSwitch;
    },
    hint: "Gunakan baterai, saklar, lampu, dan kabel hingga lampu menyala sempurna.",
    explanation: "Hebat sekali, detektif! Sirkuit kendali saklar berhasil menyala!",
  },
  {
    instruction: "Tantangan 2: Uji Pemutus Aliran Arus",
    voice: "Misi kedua! Tanpa melepas balok komponen dari papan, putar tuas saklar ke posisi terbuka atau mati untuk memutus aliran listrik!",
    validator: (cells, status) => {
      const placedCount = Object.values(cells).filter(Boolean).length;
      return placedCount >= 4 && status !== "success" && status !== "short_circuit";
    },
    hint: "Raba tuas timbul di atas saklar, lalu putar untuk mematikan sirkuit.",
    explanation: "Sempurna! Kamu telah membuktikan saklar dapat memutuskan aliran listrik secara aman tanpa harus membongkar rangkaian.",
  },
  {
    instruction: "Tantangan 3: Rancang Sirkuit Paralel Mandiri",
    voice: "Misi ketiga: Buatlah rangkaian bercabang paralel dengan minimal dua lampu menggunakan kabel cabang T. Pastikan kedua lampu menyala bersamaan!",
    validator: (cells, status, graphType) => {
      const lamps = Object.values(cells).filter((c: any) => c && c.component === "lamp").length;
      return status === "success" && graphType === "parallel" && lamps >= 2;
    },
    hint: "Gunakan kabel cabang T untuk membagi aliran arus ke dua lampu terpisah.",
    explanation: "Luar biasa! Kamu resmi menjadi Master Sirkuit Taktil Lentera! Kemampuan analisismu setara ilmuwan cilik sejati.",
  },
];

const COMPONENT_LABEL: Record<string, string> = {
  battery: "baterai", straight_cable: "kabel lurus", l_cable: "kabel L", t_cable: "kabel T",
  lamp: "lampu", resistor: "resistor", switch: "saklar",
};

const COMPONENT_TACTILE_HINT: Record<string, string> = {
  battery: "memiliki simbol plus dan minus timbul di kedua ujungnya",
  switch: "memiliki tuas mekanik timbul yang dapat diklik atau digeser di atasnya",
  lamp: "memiliki kubah bundar timbul serta tanda plus (+) dan minus (-) timbul untuk kutub polaritasnya",
  straight_cable: "memiliki alur garis lurus timbul melintang",
  l_cable: "memiliki alur timbul siku-siku seperti huruf L",
  t_cable: "memiliki alur timbul bercabang tiga seperti huruf T",
};

const NEXT_GUIDE_MAP: Record<string, { mode: "recognition" | "quiz" | "series" | "parallel" | "troubleshoot"; title: string }> = {
  recognition: { mode: "quiz", title: "Kuis Taktil" },
  quiz: { mode: "series", title: "Rangkaian Seri" },
  series: { mode: "parallel", title: "Rangkaian Paralel" },
  adaptive_series: { mode: "parallel", title: "Rangkaian Paralel" },
  parallel: { mode: "troubleshoot", title: "Tantangan Detektif Sirkuit" },
  adaptive_parallel: { mode: "troubleshoot", title: "Tantangan Detektif Sirkuit" },
};

type GuideMode =
  | "idle"
  | "recognition"
  | "quiz"
  | "series"
  | "parallel"
  | "adaptive_series"
  | "adaptive_parallel"
  | "troubleshoot";

/* ---------------------------------------------------------------- Component */
export default function VoiceGuide() {
  const [mode, setMode] = useState<GuideMode>("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [completedCells, setCompletedCells] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);
  const [stepCompleted, setStepCompleted] = useState(false);
  const [checkpointPhase, setCheckpointPhase] = useState<"idle" | "waiting_clear" | "waiting_choice" | "confirmed">("idle");
  const [boardBlockCount, setBoardBlockCount] = useState<number>(0);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const latestCellsRef = useRef<Record<string, any>>({});
  const lastRemindRef = useRef<number>(0);
  const lastClueRef = useRef<number>(0);
  const lastShortCircuitRef = useRef<number>(0);
  const lastPolarityAlertRef = useRef<number>(0);
  const lastMenuSelectRef = useRef<number>(0);
  const hasTriggeredSuccessEarconRef = useRef<boolean>(false);
  const recognitionExplainedRef = useRef<boolean>(false);
  const recognitionRotationRef = useRef<number | null>(null);
  const lastRecognitionReplayRef = useRef<number>(0);
  const lastQuizWrongRef = useRef<number>(0);
  const lastQuizWrongCompRef = useRef<string | null>(null);
  const quizWaitingForClearRef = useRef<boolean>(false);
  const quizClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quizLiftGraceStartRef = useRef<number>(0);
  const lastQuizRemindRef = useRef<number>(0);
  const checkpointClearSpokenRef = useRef<boolean>(false);
  const checkpointHandledRef = useRef<boolean>(false);
  const ignoreIdleMenuUntilLiftRef = useRef<boolean>(true);
  const clearBoardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountTimeRef = useRef<number>(Date.now());
  const idleMenuHandledRef = useRef<boolean>(false);
  const recognitionLiftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionExplainedStepRef = useRef<number>(-1);
  const isSpeakingRef = useRef<boolean>(false);
  const recognitionPromptReadyRef = useRef<boolean>(false);
  const lastSpokenTextRef = useRef<string>("");
  const lastSpokenTimeRef = useRef<number>(0);
  const [studentProgress, setStudentProgress] = useState<StudentProgress>(DEFAULT_PROGRESS);
  const [activeStudentState, setActiveStudentState] = useState<StudentProfile>(PRESET_STUDENTS[0]);
  const [mounted, setMounted] = useState<boolean>(false);

  const nextGuide = NEXT_GUIDE_MAP[mode];

  useEffect(() => {
    setMounted(true);
    setStudentProgress(getStudentProgress());
    setActiveStudentState(getActiveStudent());
    const handleProg = () => {
      setStudentProgress(getStudentProgress());
      setActiveStudentState(getActiveStudent());
    };
    const handleStudent = (e: any) => {
      if (e?.detail) setActiveStudentState(e.detail);
      setStudentProgress(getStudentProgress());
    };
    window.addEventListener("lentera-progress-update", handleProg);
    window.addEventListener("lentera-active-student-update", handleStudent);
    window.addEventListener("storage", handleProg);
    return () => {
      window.removeEventListener("lentera-progress-update", handleProg);
      window.removeEventListener("lentera-active-student-update", handleStudent);
      window.removeEventListener("storage", handleProg);
    };
  }, []);

  const handleGuideFinish = useCallback((targetMode: string) => {
    let updated: StudentProgress | null = null;
    if (targetMode === "recognition") {
      updated = completeModule("component_recognition");
    } else if (targetMode === "quiz") {
      updated = completeModule("component_quiz");
    } else if (targetMode === "series" || targetMode === "adaptive_series") {
      updated = completeModule("series_circuit");
    } else if (targetMode === "parallel" || targetMode === "adaptive_parallel") {
      updated = completeModule("parallel_circuit");
    } else if (targetMode === "troubleshoot") {
      updated = completeModule("circuit_troubleshoot");
    }
    if (updated) {
      setStudentProgress(updated);
    }
  }, []);

  const steps =
    mode === "recognition"
      ? RECOGNITION_STEPS
      : mode === "quiz"
      ? QUIZ_STEPS
      : mode === "series"
      ? SERIES_STEPS
      : mode === "parallel"
      ? PARALLEL_STEPS
      : mode === "adaptive_series"
      ? ADAPTIVE_SERIES_STEPS
      : mode === "adaptive_parallel"
      ? ADAPTIVE_PARALLEL_STEPS
      : mode === "troubleshoot"
      ? TROUBLESHOOT_STEPS
      : [];
  const step = steps[currentStep];
  const totalSteps = steps.length;
  const isFinished = totalSteps > 0 && currentStep >= totalSteps;

  useEffect(() => {
    if (isFinished && mode !== "idle") {
      handleGuideFinish(mode);
    }
  }, [isFinished, mode, handleGuideFinish]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (quizClearTimerRef.current) clearTimeout(quizClearTimerRef.current);
      if (recognitionLiftTimerRef.current) clearTimeout(recognitionLiftTimerRef.current);
      if (clearBoardTimerRef.current) clearTimeout(clearBoardTimerRef.current);
      if (typeof window !== "undefined") {
        (window as any).__lenteraGuideMode = "idle";
        (window as any).__lenteraSpeaking = false;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__lenteraGuideMode = mode;
    }
  }, [mode]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!synthRef.current || isMuted) {
      if (onEnd) onEnd();
      return;
    }
    const cleanText = text.trim();
    const now = Date.now();
    // Anti-looping: Cegah memutar ulang kalimat persis sama saat sedang berbicara atau dalam jeda 5 detik
    if (cleanText === lastSpokenTextRef.current && (isSpeakingRef.current || now - lastSpokenTimeRef.current < 5000)) {
      if (onEnd && !isSpeakingRef.current) onEnd();
      return;
    }
    lastSpokenTextRef.current = cleanText;
    lastSpokenTimeRef.current = now;

    try {
      if (synthRef.current.paused) {
        synthRef.current.resume();
      }
      synthRef.current.cancel();
    } catch {}
    const spokenText = normalizeIndonesianPhonetics(cleanText);
    const utterance = new SpeechSynthesisUtterance(spokenText);
    const voices = synthRef.current.getVoices();
    const idVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith("id") || v.name.toLowerCase().includes("indonesia")
    );
    if (idVoice) utterance.voice = idVoice;
    utterance.lang = idVoice ? idVoice.lang : "id-ID";
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      if (typeof window !== "undefined") (window as any).__lenteraSpeaking = true;
    };
    utterance.onend = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      if (typeof window !== "undefined") {
        (window as any).__lenteraSpeaking = false;
        (window as any).__lenteraActiveUtterance = null;
      }
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      if (typeof window !== "undefined") {
        (window as any).__lenteraSpeaking = false;
        (window as any).__lenteraActiveUtterance = null;
      }
      // PENTING: Selalu panggil onEnd saat error agar alur langkah tidak pernah terblokir / freeze
      if (onEnd) onEnd();
    };
    utteranceRef.current = utterance;
    if (typeof window !== "undefined") (window as any).__lenteraActiveUtterance = utterance;
    synthRef.current.speak(utterance);
  }, [isMuted]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      if (typeof window !== "undefined") (window as any).__lenteraSpeaking = false;
    }
  }, []);

  // Checkpoint Handler: saat panduan selesai, pandu pembersihan papan dan pilihan taktil A1 - E1
  useEffect(() => {
    if (!isFinished || mode === "idle" || checkpointPhase !== "idle") return;

    checkpointHandledRef.current = false;
    checkpointClearSpokenRef.current = false;

    // Bunyikan fanfare kemenangan ceria saat modul selesai
    playEarcon("victory");

    const currentCells = latestCellsRef.current || {};
    const placed = Object.values(currentCells).filter(Boolean).length;
    setBoardBlockCount(placed);

    const targetNext = NEXT_GUIDE_MAP[mode];

    if (placed > 0) {
      setCheckpointPhase("waiting_clear");
      if (mode === "recognition") {
        speak(
          "Selamat! Kamu telah menyelesaikan pengenalan seluruh balok komponen Lentera. Kerja yang luar biasa! Sebelum kita lanjut ke panduan berikutnya, silakan angkat terlebih dahulu semua balok yang ada di papan."
        );
      } else if (mode === "quiz") {
        speak(
          "Hebat sekali! Kamu berhasil menyelesaikan Kuis Taktil dengan sangat baik! Sebelum kita lanjut ke Rangkaian Seri, silakan angkat terlebih dahulu semua balok dari papan."
        );
      } else if (mode === "series" || mode === "adaptive_series") {
        speak(
          "Hebat sekali! Kamu berhasil menyelesaikan Rangkaian Seri dan lampu menyala! Sebelum kita lanjut ke Rangkaian Paralel, silakan angkat terlebih dahulu semua balok dari papan."
        );
      } else {
        speak(
          "Selamat! Kamu telah menyelesaikan seluruh rangkaian! Kerja yang luar biasa! Silakan angkat semua balok dari papan jika ingin merangkai bebas."
        );
      }
    } else {
      if (targetNext) {
        setCheckpointPhase("waiting_choice");
        speak(
          `Selamat! Papan sudah bersih. Apakah kamu ingin lanjut ke panduan ${targetNext.title}? Letakkan balok di A1 untuk Lanjut, atau di E1 untuk Istirahat.`
        );
      } else {
        setCheckpointPhase("confirmed");
        speak(
          "Selamat! Kamu telah menyelesaikan seluruh materi rangkaian dasar Lentera! Papan sudah bersih dan siap untuk eksplorasi bebas."
        );
      }
    }
  }, [isFinished, mode, checkpointPhase, speak]);

  // Listen to circuit-update events to track progress and tangible menu
  useEffect(() => {
    const handleCircuitUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const cells = detail?.cells || {};
      latestCellsRef.current = cells;

      const placedCount = Object.values(cells).filter(Boolean).length;
      setBoardBlockCount(placedCount);

      // KETIKA SEDANG MODE IDLE (TANGIBLE GRID MENU A1 - E1)
      if (mode === "idle") {
        if (idleMenuHandledRef.current) return;
        // Tahan deteksi menu 2.5s awal saat baru masuk lab agar tidak memotong intro dan tidak salah baca balok lama
        if (Date.now() - mountTimeRef.current < 2500) return;

        if (ignoreIdleMenuUntilLiftRef.current) {
          if (placedCount === 0) {
            if (!clearBoardTimerRef.current) {
              clearBoardTimerRef.current = setTimeout(() => {
                ignoreIdleMenuUntilLiftRef.current = false;
                clearBoardTimerRef.current = null;
              }, 800);
            }
          } else {
            if (clearBoardTimerRef.current) {
              clearTimeout(clearBoardTimerRef.current);
              clearBoardTimerRef.current = null;
            }
          }
          return;
        }

        if (placedCount === 1) {
          const now = Date.now();
          if (now - lastMenuSelectRef.current > 3500) {
            const currentProgress = getStudentProgress();
            const isRecognitionDone = Boolean(currentProgress.modules.component_recognition);

            if (cells["A1"]) {
              idleMenuHandledRef.current = true;
              lastMenuSelectRef.current = now;
              playEarcon("click");
              const timer = setTimeout(() => startGuide("recognition"), 8000);
              speak("Pilihan diterima: Tahap 1, Pengenalan Komponen! Angkat balok dari A1 untuk mulai meraba balok di sel C3.", () => {
                clearTimeout(timer);
                startGuide("recognition");
              });
            } else if (cells["B1"]) {
              if (!isRecognitionDone) {
                lastMenuSelectRef.current = now;
                playEarcon("wrong");
                speak("Tahap ini masih terkunci. Silakan selesaikan terlebih dahulu Tahap 1 Pengenalan Komponen di A1.");
              } else {
                idleMenuHandledRef.current = true;
                lastMenuSelectRef.current = now;
                playEarcon("click");
                const timer = setTimeout(() => startGuide("quiz"), 8000);
                speak("Pilihan diterima: Tahap 2, Kuis Taktil! Angkat balok dari B1 untuk mulai menjawab kuis.", () => {
                  clearTimeout(timer);
                  startGuide("quiz");
                });
              }
            } else if (cells["C1"]) {
              if (!isRecognitionDone) {
                lastMenuSelectRef.current = now;
                playEarcon("wrong");
                speak("Tahap ini masih terkunci. Silakan selesaikan terlebih dahulu Tahap 1 Pengenalan Komponen di A1.");
              } else {
                idleMenuHandledRef.current = true;
                lastMenuSelectRef.current = now;
                playEarcon("click");
                const timer = setTimeout(() => startGuide("series"), 8000);
                speak("Pilihan diterima: Tahap 3, Rangkaian Seri! Angkat balok dari C1 untuk mulai merakit sirkuit satu loop.", () => {
                  clearTimeout(timer);
                  startGuide("series");
                });
              }
            } else if (cells["D1"]) {
              if (!isRecognitionDone) {
                lastMenuSelectRef.current = now;
                playEarcon("wrong");
                speak("Tahap ini masih terkunci. Silakan selesaikan terlebih dahulu Tahap 1 Pengenalan Komponen di A1.");
              } else {
                idleMenuHandledRef.current = true;
                lastMenuSelectRef.current = now;
                playEarcon("click");
                const timer = setTimeout(() => startGuide("parallel"), 8000);
                speak("Pilihan diterima: Tahap 4, Rangkaian Paralel! Angkat balok dari D1 untuk mulai merakit sirkuit percabangan kabel T.", () => {
                  clearTimeout(timer);
                  startGuide("parallel");
                });
              }
            } else if (cells["E1"]) {
              if (!isRecognitionDone) {
                lastMenuSelectRef.current = now;
                playEarcon("wrong");
                speak("Tahap ini masih terkunci. Silakan selesaikan terlebih dahulu Tahap 1 Pengenalan Komponen di A1.");
              } else {
                idleMenuHandledRef.current = true;
                lastMenuSelectRef.current = now;
                playEarcon("click");
                const timer = setTimeout(() => startGuide("troubleshoot"), 8000);
                speak("Pilihan diterima: Tahap 5, Tantangan Detektif Sirkuit Mahir! Angkat balok dari E1 untuk memulai misi analisis.", () => {
                  clearTimeout(timer);
                  startGuide("troubleshoot");
                });
              }
            }
          }
        }
        return;
      }

      // Evaluasi Darurat Korsleting Fisika (Hanya aktif saat merangkai sirkuit, dan tidak sedang berbicara narasi utama)
      if (
        detail?.status === "short_circuit" &&
        !isFinished &&
        !stepCompleted &&
        !isSpeakingRef.current &&
        !["idle", "recognition", "quiz"].includes(mode)
      ) {
        const now = Date.now();
        if (now - lastShortCircuitRef.current > 9000) {
          lastShortCircuitRef.current = now;
          playEarcon("warning");
          speak("Peringatan korsleting arus pendek! Arus listrik mengalir tanpa hambatan beban. Segera lepaskan salah satu kabel atau pasang balok lampu agar baterai aman!");
        }
      }

      // Evaluasi Polaritas Terbalik pada Lampu LED (Hanya aktif saat merangkai sirkuit, dan tidak sedang berbicara narasi utama)
      if (
        detail?.status === "polarity_reversed" &&
        !isFinished &&
        !stepCompleted &&
        !isSpeakingRef.current &&
        !["idle", "recognition", "quiz"].includes(mode)
      ) {
        const now = Date.now();
        if (now - lastPolarityAlertRef.current > 9000) {
          lastPolarityAlertRef.current = now;
          playEarcon("clue");
          const cellsStr = detail?.cells?.join(", ") || "lampu";
          speak(`Rangkaian sudah membentuk lintasan tertutup, tetapi lampu di ${cellsStr} belum menyala karena kutub polaritasnya terbalik. Angkat balok lampu tersebut dan putar posisinya 180 derajat agar kutub positifnya tersambung ke arah arus baterai.`);
        }
      }

      // Earcon Sirkuit Berhasil Menyala
      if (detail?.isComplete && !hasTriggeredSuccessEarconRef.current) {
        hasTriggeredSuccessEarconRef.current = true;
        playEarcon("success");
      } else if (!detail?.isComplete) {
        hasTriggeredSuccessEarconRef.current = false;
      }

      // KETIKA MODUL TELAH SELESAI (CHECKPOINT TAKTIL A1 - E1)
      if (isFinished) {
        const targetNext = NEXT_GUIDE_MAP[mode];

        if (checkpointPhase === "waiting_clear") {
          if (placedCount === 0 && !checkpointClearSpokenRef.current) {
            checkpointClearSpokenRef.current = true;
            playEarcon("clear");
            setCheckpointPhase("waiting_choice");
            if (targetNext) {
              speak(
                `Papan sudah bersih. Apakah kamu ingin lanjut ke panduan ${targetNext.title}? Letakkan balok di A1 untuk Lanjut, atau di E1 untuk Istirahat.`
              );
            } else {
              setCheckpointPhase("confirmed");
              speak(
                "Papan sudah bersih. Selamat bereksplorasi bebas merangkai apa saja di papan fisik!"
              );
            }
          }
          return;
        }

        if (checkpointPhase === "waiting_choice") {
          if (checkpointHandledRef.current) return;

          if (cells["A1"] && targetNext) {
            checkpointHandledRef.current = true;
            setCheckpointPhase("confirmed");
            playEarcon("click");
            const timer = setTimeout(() => startGuide(targetNext.mode), 8000);
            speak(
              `Pilihan IYA diterima! Silakan angkat kembali balok dari A1, kita mulai panduan ${targetNext?.title}.`,
              () => {
                clearTimeout(timer);
                startGuide(targetNext.mode);
              }
            );
          } else if (cells["C1"]) {
            checkpointHandledRef.current = true;
            setCheckpointPhase("confirmed");
            playEarcon("click");
            const timer = setTimeout(() => startGuide("series"), 8000);
            speak(
              "Pilihan diterima: Tahap 3, Rangkaian Seri! Silakan angkat kembali balok dari C1 untuk mulai merakit.",
              () => {
                clearTimeout(timer);
                startGuide("series");
              }
            );
          } else if (cells["B1"]) {
            checkpointHandledRef.current = true;
            setCheckpointPhase("confirmed");
            playEarcon("click");
            const timer = setTimeout(() => startGuide("quiz"), 8000);
            speak(
              "Pilihan diterima: Tahap 2, Kuis Taktil! Silakan angkat kembali balok dari B1 untuk mulai kuis.",
              () => {
                clearTimeout(timer);
                startGuide("quiz");
              }
            );
          } else if (cells["D1"]) {
            checkpointHandledRef.current = true;
            setCheckpointPhase("confirmed");
            playEarcon("click");
            const timer = setTimeout(() => startGuide("parallel"), 8000);
            speak(
              "Pilihan diterima: Tahap 4, Rangkaian Paralel! Silakan angkat kembali balok dari D1 untuk mulai.",
              () => {
                clearTimeout(timer);
                startGuide("parallel");
              }
            );
          } else if (cells["E1"]) {
            checkpointHandledRef.current = true;
            setCheckpointPhase("confirmed");
            playEarcon("click");
            ignoreIdleMenuUntilLiftRef.current = true;
            const timer = setTimeout(() => resetGuide(), 8000);
            speak(
              "Pilihan istirahat diterima. Silakan angkat kembali balok dari papan untuk bereksplorasi bebas.",
              () => {
                clearTimeout(timer);
                resetGuide();
              }
            );
          }
          return;
        }
        return;
      }

      // KETIKA MASIH DALAM PROSES LANGKAH PANDUAN
      if (!step) return;

      // =========================================================================
      // KHUSUS MODE 1: PENGENALAN KOMPONEN (INTERAKTIF PUTAR ULANG & ANGKAT LANJUT)
      // =========================================================================
      if (mode === "recognition") {
        const targetExpected = step.targetCells?.["C3"];
        const placedC3 = cells["C3"];
        const isTargetMatched = Boolean(placedC3 && targetExpected && placedC3.component === targetExpected);

        // 1. Balok baru diletakkan di C3 -> Jelaskan & tanyakan kejelasan (HANYA SEKALI PER LANGKAH)
        if (isTargetMatched && recognitionExplainedStepRef.current !== currentStep) {
          if (recognitionLiftTimerRef.current) {
            clearTimeout(recognitionLiftTimerRef.current);
            recognitionLiftTimerRef.current = null;
          }
          recognitionExplainedStepRef.current = currentStep;
          recognitionExplainedRef.current = true;
          recognitionPromptReadyRef.current = false;
          recognitionRotationRef.current = placedC3.rotation ?? 0;
          setCompletedCells(new Set(["C3"]));
          playEarcon("step");
          const praises = ["Hebat!", "Bagus sekali!", "Pintar!", "Tepat sekali!", "Keren!"];
          const praise = praises[currentStep % praises.length];
          const questionPrompt = `${praise} ${step.explanation} Apakah kamu sudah jelas? Jika ingin mendengar penjelasan ulang, cukup putar balok ini di sel C3. Jika sudah paham dan ingin lanjut, silakan angkat baloknya dari sel C3.`;
          speak(questionPrompt, () => {
            recognitionPromptReadyRef.current = true;
          });
          return;
        }

        // 2. Balok langkah ini sudah dijelaskan
        if (recognitionExplainedStepRef.current === currentStep) {
          // A. Balok diletakkan kembali / masih berada di C3
          if (isTargetMatched) {
            // Jika ada lift timer yang sedang berjalan, batalkan!
            if (recognitionLiftTimerRef.current) {
              clearTimeout(recognitionLiftTimerRef.current);
              recognitionLiftTimerRef.current = null;
            }

            // Putar ulang hanya jika audio penjelasan selesai, tidak sedang berbicara, dan diputar sengaja >= 75 derajat
            if (recognitionPromptReadyRef.current && !isSpeakingRef.current) {
              const curRot = placedC3.rotation ?? 0;
              const lastRot = recognitionRotationRef.current ?? 0;
              const rawDiff = Math.abs(curRot - lastRot);
              const diff = Math.min(rawDiff, 360 - rawDiff);
              const isRotated = diff >= 75; // 75 derajat mencegah jari rabaan memicu replay
              const now = Date.now();
              if (isRotated && now - lastRecognitionReplayRef.current > 12000 && now - lastSpokenTimeRef.current > 8000) {
                lastRecognitionReplayRef.current = now;
                recognitionRotationRef.current = curRot;
                playEarcon("clue");
                speak(
                  `Memutar balok terdeteksi. Mengulang penjelasan: ${step.explanation} Jika kamu sudah jelas dan ingin lanjut, silakan angkat baloknya dari sel C3.`
                );
                return;
              }
            }
            return;
          }

          // B. Deteksi jika balok diangkat oleh siswa
          // Catatan penting: Siswa mungkin mengangkat balok sejenak untuk memutarnya di tangan, atau mengangkatnya untuk lanjut ke komponen berikutnya.
          // Hanya aktifkan timer angkat jika penjelasan awal sudah selesai diperdengarkan
          if (!placedC3 || placedC3.component !== targetExpected) {
            if (!recognitionLiftTimerRef.current && recognitionPromptReadyRef.current) {
              recognitionLiftTimerRef.current = setTimeout(() => {
                recognitionLiftTimerRef.current = null;
                playEarcon("step");
                recognitionPromptReadyRef.current = false;
                recognitionRotationRef.current = null;
                setCompletedCells(new Set());
                if (currentStep < totalSteps - 1) {
                  playEarcon("step");
                  const advancePraises = [
                    "Bagus sekali! Balok sudah diangkat. Mari lanjut ke komponen berikutnya.",
                    "Hebat! Balok berhasil kamu kenali. Ayo lanjut ke komponen berikutnya.",
                    "Pintar! Satu komponen telah tuntas. Sekarang lanjut ke komponen berikutnya.",
                  ];
                  const advanceText = advancePraises[currentStep % advancePraises.length];
                  // Segera majukan currentStep ke langkah berikutnya agar frame kamera
                  // berikutnya tidak pernah memicu ulang penjelasan balok yang baru saja diangkat
                  setCurrentStep((prev) => prev + 1);
                  speak(advanceText);
                } else {
                  playEarcon("victory");
                  setCurrentStep(totalSteps);
                  speak("Luar biasa! Seluruh balok komponen dasar telah berhasil kamu kenali dengan sempurna.");
                }
              }, 3000);
            }
            return;
          }
        }

        // C. Siswa meletakkan balok yang salah di C3
        if (placedC3 && targetExpected && placedC3.component !== targetExpected && recognitionExplainedStepRef.current !== currentStep) {
          if (recognitionLiftTimerRef.current) {
            clearTimeout(recognitionLiftTimerRef.current);
            recognitionLiftTimerRef.current = null;
          }
          const now = Date.now();
          if (now - lastClueRef.current > 5000) {
            lastClueRef.current = now;
            playEarcon("wrong");
            const placedName = COMPONENT_LABEL[placedC3.component] || placedC3.component;
            const expectedName = COMPONENT_LABEL[targetExpected] || targetExpected;
            const clue = COMPONENT_TACTILE_HINT[targetExpected] || "ciri taktilnya";
            speak(`Kamu meletakkan balok ${placedName} di C3. Untuk langkah ini kita mencari ${expectedName}. Coba raba balok yang ${clue}.`);
          }
        }
        return;
      }

      // =========================================================================
      // KHUSUS MODE 2: KUIS TAKTIL (TERPANDU DI KOTAK C3)
      // =========================================================================
      if (mode === "quiz") {
        const placedEntries = Object.entries(cells).filter(([_, c]) => Boolean(c));

        // 1. Setelah menjawab benar, tunggu siswa mengangkat balok hingga papan bersih
        if (quizWaitingForClearRef.current) {
          if (placedEntries.length > 0) {
            // Balok masih berada di papan atau sedang diraba/diangkat
            if (quizClearTimerRef.current) {
              clearTimeout(quizClearTimerRef.current);
              quizClearTimerRef.current = null;
            }

            // Pengingat ramah jika siswa belum mengangkat balok setelah 12 detik
            const now = Date.now();
            if (
              now - quizLiftGraceStartRef.current > 12000 &&
              now - lastQuizRemindRef.current > 10000 &&
              !isSpeakingRef.current
            ) {
              lastQuizRemindRef.current = now;
              playEarcon("clue");
              const compLabel = step.expectedComponent
                ? COMPONENT_LABEL[step.expectedComponent] || step.expectedComponent
                : "balok";
              speak(`Silakan angkat balok ${compLabel} dari kotak C3 agar kita bisa lanjut ke pertanyaan berikutnya.`);
            }
          } else {
            // Papan terdeteksi bersih: pastikan sudah ada jeda minimal setelah pengumuman jawaban benar
            const elapsed = Date.now() - quizLiftGraceStartRef.current;
            if (elapsed >= 1000 && !quizClearTimerRef.current) {
              quizClearTimerRef.current = setTimeout(() => {
                quizClearTimerRef.current = null;
                quizWaitingForClearRef.current = false;
                setStepCompleted(false);
                setCompletedCells(new Set());
                lastQuizWrongRef.current = 0;
                lastQuizWrongCompRef.current = null;

                if (currentStep < totalSteps - 1) {
                  playEarcon("step");
                  setCurrentStep((prev) => prev + 1);
                } else {
                  playEarcon("victory");
                  setCurrentStep(totalSteps);
                }
              }, 500);
            }
          }
          return;
        }

        // 2. Evaluasi jawaban jika langkah ini belum selesai
        if (!stepCompleted) {
          let isQuizCorrect = false;
          if (step.validator) {
            isQuizCorrect = step.validator(cells, detail?.status, detail?.graph_type);
          }

          if (isQuizCorrect) {
            setStepCompleted(true);
            setCompletedCells(new Set(["C3"]));
            lastQuizWrongCompRef.current = null;
            playEarcon("step");
            if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);

            const quizPraises = [
              "Luar biasa!",
              "Tepat sekali!",
              "Hebat!",
              "Keren!",
              "Pintar!",
            ];
            const praisePrefix = quizPraises[currentStep % quizPraises.length];
            const explanationText = step.explanation ? `${praisePrefix} ${step.explanation}` : `${praisePrefix} Jawabanmu tepat sekali!`;

            if (currentStep < totalSteps - 1) {
              quizWaitingForClearRef.current = true;
              quizLiftGraceStartRef.current = Date.now();
              lastQuizRemindRef.current = Date.now();
              const compLabel = step.expectedComponent
                ? COMPONENT_LABEL[step.expectedComponent] || step.expectedComponent
                : "balok";
              speak(`${explanationText} Sekarang, silakan angkat balok ${compLabel} dari kotak C3 untuk lanjut ke pertanyaan berikutnya.`);
            } else {
              // Soal terakhir: langsung majukan ke totalSteps setelah penjelasan selesai
              let finishedQuiz = false;
              const doFinishQuiz = () => {
                if (finishedQuiz) return;
                finishedQuiz = true;
                if (advanceTimerRef.current) {
                  clearTimeout(advanceTimerRef.current);
                  advanceTimerRef.current = null;
                }
                setCurrentStep(totalSteps);
              };
              advanceTimerRef.current = setTimeout(doFinishQuiz, 7000);
              speak(explanationText, () => {
                setTimeout(doFinishQuiz, 300);
              });
            }
            return;
          }

          // Respons cerdas jika meletakkan komponen di luar kotak C3 atau balok yang salah
          const expectedComp = step.expectedComponent;
          if (placedEntries.length > 0 && expectedComp) {

            // Kasus A: Komponen yang dicari SUDAH BENAR, tapi diletakkan di kotak selain C3
            const correctCompEntry = placedEntries.find(([_, d]) => (d as any)?.component === expectedComp);
            if (correctCompEntry) {
              const [cell] = correctCompEntry;
              const now = Date.now();
              const isNewWrong = lastQuizWrongCompRef.current !== `${expectedComp}_${cell}`;
              const cooldownOver = now - lastQuizWrongRef.current > 4000;

              if (isNewWrong || cooldownOver) {
                lastQuizWrongRef.current = now;
                lastQuizWrongCompRef.current = `${expectedComp}_${cell}`;
                playEarcon("clue");
                const compName = COMPONENT_LABEL[expectedComp] || expectedComp;
                speak(`Pilihan balok ${compName} sudah benar! Tapi kamu meletakkannya di kotak ${cell}. Geser balok tersebut ke kotak tengah C3.`);
              }
              return;
            }

            // Kasus B: Balok salah diletakkan tepat di kotak C3
            const placedC3 = cells["C3"];
            if (placedC3 && placedC3.component !== expectedComp) {
              const wrongComp = placedC3.component;
              const now = Date.now();
              const isNewWrong = lastQuizWrongCompRef.current !== wrongComp;
              const cooldownOver = now - lastQuizWrongRef.current > 4000;

              if (isNewWrong || cooldownOver) {
                lastQuizWrongRef.current = now;
                lastQuizWrongCompRef.current = wrongComp;
                playEarcon("wrong");
                const wrongName = COMPONENT_LABEL[wrongComp] || wrongComp;
                const hintText = step.hint || "raba ciri fisiknya";
                speak(`Kurang tepat. Kamu meletakkan balok ${wrongName} di kotak C3. Ingat petunjuknya: ${hintText}. Angkat balok tersebut dan coba cari balok yang benar.`);
              }
              return;
            }

            // Kasus C: Balok salah diletakkan di kotak selain C3
            const [cell, placedData] = placedEntries[0];
            const placedComp = (placedData as any)?.component;
            if (placedComp && placedComp !== expectedComp) {
              const now = Date.now();
              const isNewWrong = lastQuizWrongCompRef.current !== `${placedComp}_${cell}`;
              const cooldownOver = now - lastQuizWrongRef.current > 4000;

              if (isNewWrong || cooldownOver) {
                lastQuizWrongRef.current = now;
                lastQuizWrongCompRef.current = `${placedComp}_${cell}`;
                playEarcon("wrong");
                const wrongName = COMPONENT_LABEL[placedComp] || placedComp;
                const hintText = step.hint || "raba ciri fisiknya";
                speak(`Kamu meletakkan balok ${wrongName} di kotak ${cell}. Untuk kuis ini, cari balok yang tepat dan letakkan di kotak tengah C3.`);
              }
              return;
            }
          } else {
            // Reset saat papan diangkat/dikosongkan agar balok berikutnya dapat dideteksi instan
            lastQuizWrongCompRef.current = null;
          }
          return;
        }
        return;
      }

      // =========================================================================
      // MODE LAINNYA: RANGKAIAN SERI, PARALEL, TROUBLESHOOT
      // =========================================================================
      const newCompleted = new Set<string>();
      let allFound = true;
      if (step.targetCells) {
        for (const [cell, expectedComponent] of Object.entries(step.targetCells)) {
          const placed = cells[cell];
          if (placed && placed.component === expectedComponent) {
            newCompleted.add(cell);
          } else {
            allFound = false;
          }
        }
      }
      
      if (step.validator) {
        allFound = step.validator(cells, detail?.status, detail?.graph_type);
      }

      // Socratic Clue Feedback saat komponen yang diletakkan salah di sel target
      if (step.targetCells && !allFound && !stepCompleted && !isFinished) {
        for (const [cell, expectedComponent] of Object.entries(step.targetCells)) {
          const placed = cells[cell];
          if (placed && placed.component !== expectedComponent) {
            const now = Date.now();
            if (now - lastClueRef.current > 4500) {
              lastClueRef.current = now;
              const placedName = COMPONENT_LABEL[placed.component] || placed.component;
              const expectedName = COMPONENT_LABEL[expectedComponent] || expectedComponent;
              const clue = COMPONENT_TACTILE_HINT[expectedComponent] || "bentuk yang sesuai";
              playEarcon("wrong");
              speak(`Kamu meletakkan balok ${placedName} di ${cell}. Untuk langkah ini kita membutuhkan ${expectedName}. Coba raba balok yang ${clue}.`);
            }
            break;
          }
        }
      }
      
      // Reminder bila saklar masih posisi OFF/NO saat rangkaian sudah terpasang
      if (detail?.status === "switch_off" && !allFound && !stepCompleted && !isFinished && !isSpeakingRef.current) {
        const now = Date.now();
        if (now - lastClueRef.current > 14000) {
          lastClueRef.current = now;
          playEarcon("warning");
          if (mode === "series") {
            speak("Rangkaian seri belum menyala karena saklar masih terbuka atau mati. Putar saklar di C5 dan E4 ke posisi ON.");
          } else {
            speak("Putar saklar di C4 atau C3 ke posisi ON agar lampu pada cabang menyala.");
          }
        }
      }

      // Jika langkah belum selesai, perbarui completed cells
      if (!stepCompleted) {
        setCompletedCells(newCompleted);
      }

      if (allFound && !stepCompleted) {
        setStepCompleted(true);
        setCompletedCells(newCompleted);

        const isLastStep = currentStep >= totalSteps - 1;
        if (isLastStep) {
          playEarcon("victory");
        } else {
          playEarcon("step");
        }

        let hasAdvanced = false;
        const doAdvance = () => {
          if (hasAdvanced) return;
          hasAdvanced = true;
          if (advanceTimerRef.current) {
            clearTimeout(advanceTimerRef.current);
            advanceTimerRef.current = null;
          }
          if (currentStep < totalSteps - 1) {
            setCurrentStep((prev) => prev + 1);
            setStepCompleted(false);
            setCompletedCells(new Set());
          } else {
            setCurrentStep(totalSteps);
          }
        };

        if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);

        if (isLastStep) {
          const finalSpeech = step.explanation || "Luar biasa! Saklar sudah ON dan sirkuit tertutup. Lampu berhasil menyala terang!";
          advanceTimerRef.current = setTimeout(doAdvance, 5000);
          speak(finalSpeech, () => {
            setTimeout(doAdvance, 500);
          });
        } else if (step.explanation) {
          // Fallback safety timer 4.5s
          advanceTimerRef.current = setTimeout(doAdvance, 4500);
          speak(step.explanation, () => {
            setTimeout(doAdvance, 500);
          });
        } else {
          const praises = [
            "Bagus sekali! Lanjut ke langkah berikutnya.",
            "Hebat! Satu balok terpasang sempurna.",
            "Keren! Posisi balok sangat tepat.",
            "Tepat sekali! Ayo pasang balok berikutnya.",
            "Pintar! Rangkaianmu semakin lengkap.",
          ];
          const praise = praises[currentStep % praises.length];

          // FALLBACK TIMER: Garansi 100% langkah MAJU dalam 2.8s walaupun speech engine browser macet/pause
          advanceTimerRef.current = setTimeout(doAdvance, 2800);

          speak(praise, () => {
            setTimeout(doAdvance, 300);
          });
        }
      }
    };

    window.addEventListener("circuit-update", handleCircuitUpdate);
    return () => window.removeEventListener("circuit-update", handleCircuitUpdate);
  }, [mode, step, stepCompleted, currentStep, totalSteps, isFinished, checkpointPhase, speak]);

  // Speak current step instruction when step changes
  useEffect(() => {
    if (mode !== "idle" && step && !isMuted) {
      speak(step.voice);
    }
  }, [currentStep, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const startGuide = (guideMode: GuideMode) => {
    if (guideMode === "idle") return;
    const currentProgress = getStudentProgress();
    if (!currentProgress.modules.component_recognition && guideMode !== "recognition") {
      playEarcon("warning");
      speak("Tahap ini masih terkunci. Selesaikan terlebih dahulu Tahap 1 Pengenalan Bentuk Taktil agar materi berikutnya terbuka.");
      return;
    }
    stopSpeaking();
    playEarcon("click");
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (quizClearTimerRef.current) {
      clearTimeout(quizClearTimerRef.current);
      quizClearTimerRef.current = null;
    }
    quizWaitingForClearRef.current = false;
    quizLiftGraceStartRef.current = 0;
    if (recognitionLiftTimerRef.current) {
      clearTimeout(recognitionLiftTimerRef.current);
      recognitionLiftTimerRef.current = null;
    }
    recognitionExplainedRef.current = false;
    recognitionExplainedStepRef.current = -1;
    recognitionPromptReadyRef.current = false;
    recognitionRotationRef.current = null;
    lastRecognitionReplayRef.current = 0;
    lastQuizWrongRef.current = 0;
    lastQuizWrongCompRef.current = null;
    checkpointClearSpokenRef.current = false;
    checkpointHandledRef.current = false;
    idleMenuHandledRef.current = false;
    ignoreIdleMenuUntilLiftRef.current = false;
    setMode(guideMode);
    setCurrentStep(0);
    setStepCompleted(false);
    setCompletedCells(new Set());
    setCheckpointPhase("idle");
    setBoardBlockCount(0);
    setIsExpanded(true);
  };

  useEffect(() => {
    const handleStartGuide = (e: Event) => {
      const targetMode = (e as CustomEvent).detail;
      if (
        targetMode &&
        ["recognition", "quiz", "series", "parallel", "adaptive_series", "adaptive_parallel", "troubleshoot"].includes(targetMode)
      ) {
        startGuide(targetMode);
      }
    };
    window.addEventListener("lentera-start-guide", handleStartGuide);
    return () => window.removeEventListener("lentera-start-guide", handleStartGuide);
  }, []);

  const resetGuide = () => {
    stopSpeaking();
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (quizClearTimerRef.current) {
      clearTimeout(quizClearTimerRef.current);
      quizClearTimerRef.current = null;
    }
    quizWaitingForClearRef.current = false;
    quizLiftGraceStartRef.current = 0;
    if (recognitionLiftTimerRef.current) {
      clearTimeout(recognitionLiftTimerRef.current);
      recognitionLiftTimerRef.current = null;
    }
    recognitionExplainedRef.current = false;
    recognitionPromptReadyRef.current = false;
    recognitionRotationRef.current = null;
    lastRecognitionReplayRef.current = 0;
    lastQuizWrongRef.current = 0;
    lastQuizWrongCompRef.current = null;
    checkpointClearSpokenRef.current = false;
    checkpointHandledRef.current = false;
    idleMenuHandledRef.current = false;
    setMode("idle");
    setCurrentStep(0);
    setStepCompleted(false);
    setCompletedCells(new Set());
    setCheckpointPhase("idle");
    setBoardBlockCount(0);
    if (typeof window !== "undefined") {
      (window as any).__lenteraGuideMode = "idle";
      (window as any).__lenteraSpeaking = false;
    }
  };

  const skipStep = () => {
    stopSpeaking();
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (quizClearTimerRef.current) {
      clearTimeout(quizClearTimerRef.current);
      quizClearTimerRef.current = null;
    }
    quizWaitingForClearRef.current = false;
    quizLiftGraceStartRef.current = 0;
    if (recognitionLiftTimerRef.current) {
      clearTimeout(recognitionLiftTimerRef.current);
      recognitionLiftTimerRef.current = null;
    }
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
      setStepCompleted(false);
      setCompletedCells(new Set());
    } else {
      setCurrentStep(totalSteps);
    }
  };

  const toggleMute = () => {
    if (!isMuted) stopSpeaking();
    setIsMuted((prev) => !prev);
  };

  const replayVoice = () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (mode === "quiz") {
      if (stepCompleted && quizWaitingForClearRef.current) {
        const compLabel = step?.expectedComponent
          ? COMPONENT_LABEL[step.expectedComponent] || step.expectedComponent
          : "balok";
        speak(`${step?.explanation || "Jawabanmu tepat!"} Silakan angkat balok ${compLabel} dari papan untuk lanjut ke pertanyaan berikutnya.`);
      } else if (step) {
        speak(step.voice);
      }
      return;
    }
    if (stepCompleted && step?.explanation) {
      speak(step.explanation, () => {
        advanceTimerRef.current = setTimeout(() => {
          if (currentStep < totalSteps - 1) {
            setCurrentStep((prev) => prev + 1);
            setStepCompleted(false);
            setCompletedCells(new Set());
          } else {
            setCurrentStep(totalSteps);
          }
        }, 3500);
      });
    } else if (step) {
      speak(step.voice);
    }
  };

  /* ---------------------------------------------------------------- Idle Mode */
  if (mode === "idle") {
    const activeStudent = mounted ? activeStudentState : PRESET_STUDENTS[0];
    const currentProgress = mounted ? studentProgress : DEFAULT_PROGRESS;
    const completedCount = [
      currentProgress.modules.component_recognition,
      currentProgress.modules.component_quiz,
      currentProgress.modules.series_circuit,
      currentProgress.modules.parallel_circuit,
      currentProgress.modules.circuit_troubleshoot,
    ].filter(Boolean).length;

    const isRecognitionDone = Boolean(currentProgress.modules.component_recognition);

    // Menentukan tahapan rekomendasi berikutnya (tahap pertama yang belum diselesaikan)
    let recommendedMode: GuideMode = "recognition";
    if (!currentProgress.modules.component_recognition) recommendedMode = "recognition";
    else if (!currentProgress.modules.component_quiz) recommendedMode = "quiz";
    else if (!currentProgress.modules.series_circuit) recommendedMode = "series";
    else if (!currentProgress.modules.parallel_circuit) recommendedMode = "parallel";
    else if (!currentProgress.modules.circuit_troubleshoot) recommendedMode = "troubleshoot";
    else recommendedMode = "recognition";

    const speakMenuGuidance = () => {
      playEarcon("click");
      if (!isRecognitionDone) {
        speak(
          "Selamat datang di Panduan Suara LENTERA. Kamu berada di tahap awal. Silakan selesaikan Tahap 1 Pengenalan Bentuk Taktil terlebih dahulu dengan meletakkan satu balok di kotak A1 agar materi berikutnya terbuka."
        );
      } else {
        speak(
          "Selamat datang di Panduan Suara LENTERA. Ada lima tahapan belajar yang bisa kamu pilih: Tahap satu di kotak A1, Tahap dua Kuis Taktil di kotak B1, Tahap tiga Rangkaian Seri di kotak C1, Tahap empat Rangkaian Paralel di kotak D1, dan Tahap lima Tantangan Detektif di kotak E1. Letakkan satu balok di baris atas papan fisik untuk mulai belajar secara mandiri."
        );
      }
    };

    const MODULES = [
      {
        id: "recognition",
        mode: "recognition" as GuideMode,
        cell: "A1",
        stage: 1,
        title: "Pengenalan Bentuk Taktil",
        desc: "Raba & kenali 6 balok komponen sirkuit dasar di sel C3 tengah papan",
        xp: 50,
        isCompleted: currentProgress.modules.component_recognition,
        isLocked: false,
        hasSubModes: false,
      },
      {
        id: "quiz",
        mode: "quiz" as GuideMode,
        cell: "B1",
        stage: 2,
        title: "Kuis Tebak Komponen",
        desc: "Tebak fungsi komponen listrik secara mandiri dengan menaruh balok di papan",
        xp: 50,
        isCompleted: currentProgress.modules.component_quiz,
        isLocked: !isRecognitionDone,
        hasSubModes: false,
      },
      {
        id: "series",
        mode: "series" as GuideMode,
        cell: "C1",
        stage: 3,
        title: "Rangkaian Listrik Seri",
        desc: "Rakit 1 jalur loop tertutup dari baterai, saklar, dan lampu hingga menyala",
        xp: 100,
        isCompleted: currentProgress.modules.series_circuit,
        isLocked: !isRecognitionDone,
        hasSubModes: true,
      },
      {
        id: "parallel",
        mode: "parallel" as GuideMode,
        cell: "D1",
        stage: 4,
        title: "Rangkaian Listrik Paralel",
        desc: "Rakit sirkuit percabangan kabel T dengan kendali saklar mandiri tiap lampu",
        xp: 100,
        isCompleted: currentProgress.modules.parallel_circuit,
        isLocked: !isRecognitionDone,
        hasSubModes: true,
      },
      {
        id: "troubleshoot",
        mode: "troubleshoot" as GuideMode,
        cell: "E1",
        stage: 5,
        title: "Tantangan Detektif Sirkuit",
        desc: "Misi troubleshooting kendali saklar & pengujian sirkuit tingkat mahir",
        xp: 150,
        isCompleted: currentProgress.modules.circuit_troubleshoot,
        isLocked: !isRecognitionDone,
        hasSubModes: false,
      },
    ];

    return (
      <div className="card rounded-3xl border border-cs-text/10 bg-white/95 p-4 sm:p-5 shadow-[0_12px_32px_rgba(46,42,94,0.07)] backdrop-blur-xl space-y-3.5">
        {/* Header Komponen & Progres Siswa */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm shadow-indigo-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-heading text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                Panduan Modul Belajar
              </h3>
              <p className="text-[11px] text-slate-500">
                Kurikulum 5 tahap terintegrasi dengan sensor papan fisik
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Indikator Progres 5 Segmen */}
            <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-xs">
              <span className="text-[11px] font-bold text-slate-600">
                Progres {completedCount}/5
              </span>
              <div className="flex items-center gap-1" title={`${completedCount} dari 5 modul selesai`}>
                {[
                  currentProgress.modules.component_recognition,
                  currentProgress.modules.component_quiz,
                  currentProgress.modules.series_circuit,
                  currentProgress.modules.parallel_circuit,
                  currentProgress.modules.circuit_troubleshoot,
                ].map((done, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 w-3 rounded-full transition-all ${
                      done ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Badge Profil Siswa */}
            <div
              suppressHydrationWarning
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50/80 border border-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-900"
            >
              <span suppressHydrationWarning>{activeStudent.avatar}</span>
              <span suppressHydrationWarning className="truncate max-w-[90px]">{activeStudent.name.split(" ")[0]}</span>
              <span suppressHydrationWarning className="text-[10px] text-indigo-600 font-extrabold">({currentProgress.xp} XP)</span>
            </div>
          </div>
        </div>

        {/* Tip Pintasan Taktil Mandiri (Zero-Screen TUI) Ringkas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-purple-50/30 to-blue-50/40 px-3.5 py-2 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-2xs shrink-0">
              <Zap className="h-3 w-3" />
            </span>
            <p className="text-[11.5px] text-slate-700 leading-snug">
              <strong className="font-extrabold text-indigo-950">Pintasan Fisik:</strong> Letakkan 1 balok di kotak baris atas papan (<span className="font-mono font-bold text-indigo-700">A1 – E1</span>) untuk langsung memulai materi tanpa layar.
            </p>
          </div>
          <button
            onClick={speakMenuGuidance}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-50 active:scale-95 transition-all shadow-2xs self-start sm:self-auto shrink-0"
            title="Dengarkan panduan suara cara memilih materi"
          >
            <Volume2 className="h-3.5 w-3.5 text-indigo-600" />
            <span>Dengarkan Menu</span>
          </button>
        </div>

        {/* Daftar 5 Modul Pembelajaran */}
        <div className="space-y-2">
          {MODULES.map((item) => {
            const isRecommended = item.mode === recommendedMode && !item.isCompleted && !item.isLocked;

            return (
              <div
                key={item.id}
                className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl transition-all ${
                  item.isLocked
                    ? "bg-slate-50/70 border border-slate-200/70 opacity-75"
                    : isRecommended
                    ? "bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/30 border-2 border-indigo-400/90 shadow-sm shadow-indigo-500/5 ring-1 ring-indigo-200/50"
                    : item.isCompleted
                    ? "bg-emerald-50/20 border border-emerald-200/70 hover:border-emerald-300"
                    : "bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                {/* Info Kiri: Badge Sel + Judul + Deskripsi */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div
                    className={`flex flex-col items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl font-mono shrink-0 transition-all ${
                      item.isLocked
                        ? "bg-slate-100 text-slate-400 border border-slate-200/60"
                        : item.isCompleted
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : isRecommended
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    <span className="text-xs font-black">{item.cell}</span>
                    <span className="text-[8.5px] font-bold opacity-80 leading-none">Tahap {item.stage}</span>
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className={`font-heading text-xs sm:text-sm font-extrabold ${item.isLocked ? "text-slate-600" : "text-slate-900"}`}>
                        {item.title}
                      </h4>
                      {item.isLocked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                          <Lock className="h-2.5 w-2.5 text-slate-400" />
                          <span>Terkunci</span>
                        </span>
                      ) : item.isCompleted ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>Dikuasai</span>
                        </span>
                      ) : isRecommended ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-700">
                          <Sparkles className="h-2.5 w-2.5 text-indigo-600" />
                          <span>Rekomendasi</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                          +{item.xp} XP
                        </span>
                      )}
                    </div>
                    <p className={`text-[11.5px] leading-snug ${item.isLocked ? "text-slate-400" : "text-slate-500"}`}>
                      {item.desc}
                    </p>
                  </div>
                </div>

                {/* Tombol Aksi Kanan */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                  {item.isLocked ? (
                    <button
                      onClick={() => {
                        playEarcon("warning");
                        speak("Tahap ini masih terkunci. Selesaikan terlebih dahulu Tahap 1 Pengenalan Bentuk Taktil agar materi berikutnya terbuka.");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100/90 px-3 py-1.5 text-xs font-bold text-slate-400 hover:bg-slate-200/70 hover:text-slate-600 transition-all active:scale-95"
                      title="Selesaikan Tahap 1 terlebih dahulu"
                    >
                      <Lock className="h-3 w-3 text-slate-400" />
                      <span>Terkunci</span>
                    </button>
                  ) : item.hasSubModes ? (
                    <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 shadow-2xs">
                      <button
                        onClick={() => startGuide(item.mode)}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                          isRecommended
                            ? "bg-indigo-600 text-white shadow-xs hover:bg-indigo-700"
                            : "bg-white text-slate-800 shadow-2xs hover:text-indigo-600"
                        }`}
                        title="Mode Terpandu: Langkah per sel koordinat"
                      >
                        <Play className={`h-2.5 w-2.5 ${isRecommended ? "fill-white text-white" : "fill-current"}`} />
                        <span>Panduan</span>
                      </button>
                      <button
                        onClick={() =>
                          startGuide(item.mode === "series" ? "adaptive_series" : "adaptive_parallel")
                        }
                        className="inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-all active:scale-95"
                        title="Mode Bebas: Rakit mandiri adaptif tanpa urutan koordinat"
                      >
                        <span>Bebas</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startGuide(item.mode)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-xs ${
                        isRecommended
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25"
                          : item.isCompleted
                          ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                          : "bg-slate-900 hover:bg-indigo-600 text-white"
                      }`}
                    >
                      <Play className={`h-3 w-3 ${item.isCompleted ? "text-slate-600 fill-slate-600" : "fill-white text-white"}`} />
                      <span>{item.isCompleted ? "Ulangi" : "Mulai"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- Active Guide */
  const progressPercent = isFinished ? 100 : (currentStep / totalSteps) * 100;
  const headerBg =
    mode === "recognition"
      ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600"
      : mode === "quiz"
      ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600"
      : mode === "troubleshoot"
      ? "bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600"
      : mode === "series" || mode === "adaptive_series"
      ? "bg-gradient-to-r from-violet-500 to-purple-600"
      : "bg-gradient-to-r from-sky-500 to-cyan-600";

  const progressBg =
    mode === "recognition"
      ? "bg-amber-500"
      : mode === "quiz"
      ? "bg-indigo-500"
      : mode === "troubleshoot"
      ? "bg-rose-500"
      : mode === "series" || mode === "adaptive_series"
      ? "bg-violet-500"
      : "bg-sky-500";

  const guideTitle =
    mode === "recognition"
      ? "Pengenalan Blok Komponen"
      : mode === "quiz"
      ? "Kuis Tebak Komponen Taktil"
      : mode === "troubleshoot"
      ? "Tantangan Detektif Sirkuit"
      : `${mode.includes("adaptive") ? "Rangkaian Bebas" : "Panduan"} ${
          mode.includes("series") ? "Seri" : "Paralel"
        }`;

  const stepSubtitle = isFinished
    ? "Selesai!"
    : mode === "recognition"
    ? `Komponen ${currentStep + 1} dari ${totalSteps}`
    : mode === "quiz"
    ? `Soal ${currentStep + 1} dari ${totalSteps}`
    : mode === "troubleshoot"
    ? `Misi ${currentStep + 1} dari ${totalSteps}`
    : `Langkah ${currentStep + 1} dari ${totalSteps}`;

  return (
    <div className="card rounded-2xl border border-cs-text/10 bg-white/80 shadow-[0_8px_24px_rgba(46,42,94,0.06)] backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 cursor-pointer ${headerBg}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
            {isSpeaking ? (
              <Volume2 className="h-3.5 w-3.5 text-white animate-pulse" />
            ) : mode === "recognition" ? (
              <BookOpen className="h-3.5 w-3.5 text-white" />
            ) : mode === "quiz" ? (
              <HelpCircle className="h-3.5 w-3.5 text-white" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-white">{guideTitle}</h3>
            <p className="text-[10px] text-white/80">{stepSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-white/80" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/80" />
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-100">
        <div
          className={`h-full transition-all duration-700 ease-out ${progressBg}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Body */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {isFinished ? (
            /* Completion & Tactile Checkpoint Screen */
            <div className="text-center py-3 space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-lg shadow-emerald-200">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-heading text-base font-extrabold text-cs-text">
                  {mode === "recognition"
                    ? "Pengenalan Selesai!"
                    : mode === "quiz"
                    ? "Kuis Taktil Tuntas!"
                    : mode === "troubleshoot"
                    ? "Misi Detektif Selesai!"
                    : "Rangkaian Selesai!"}
                </h3>
                <p className="text-xs text-cs-text/60 mt-0.5 leading-relaxed max-w-xs mx-auto">
                  {mode === "recognition"
                    ? "Hebat sekali! Kamu telah mengenal bentuk taktil dan fungsi seluruh komponen Lentera."
                    : mode === "quiz"
                    ? "Luar biasa! Kamu berhasil menjawab semua tebakan fungsi komponen secara mandiri di papan fisik."
                    : mode === "troubleshoot"
                    ? "Hebat sekali, detektif! Kamu membuktikan pemahaman mendalam tentang kendali saklar dan sirkuit listrik."
                    : mode === "series" || mode === "adaptive_series"
                    ? "Kamu telah membuat rangkaian seri! Semua komponen berbagi satu jalur."
                    : "Kamu telah membuat rangkaian paralel! Setiap cabang bekerja sendiri-sendiri."}
                </p>
              </div>

              {/* KARTU CHECKPOINT TAKTIL & INTERAKTIF */}
              {nextGuide ? (
                <div className="mt-2 text-left rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white p-3.5 shadow-sm space-y-2.5">
                  {checkpointPhase === "waiting_clear" ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                        </span>
                        <span>Tahap 1: Kosongkan Papan Fisik</span>
                      </div>
                      <p className="text-[11px] text-cs-text/70 leading-relaxed">
                        Silakan angkat semua balok yang ada di papan fisik agar grid bersih sebelum lanjut ke modul berikutnya.
                      </p>
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100/80 px-2.5 py-1 text-[11px] font-semibold text-amber-900">
                        <span>{boardBlockCount > 0 ? `${boardBlockCount} balok masih di papan` : "Papan sudah bersih..."}</span>
                      </div>
                    </div>
                  ) : checkpointPhase === "waiting_choice" ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                          Tahap 2: Pilihan di Papan Fisik
                        </span>
                        <span className="text-[10px] text-cs-text/50">Taktil / Layar</span>
                      </div>
                      <p className="text-xs font-bold text-cs-text leading-tight">
                        Lanjut ke {nextGuide.title}?
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {/* Pilihan A1 = IYA */}
                        <button
                          onClick={() => startGuide(nextGuide.mode)}
                          className="group relative flex flex-col items-start rounded-xl border-2 border-emerald-300 bg-emerald-50/80 p-2.5 text-left transition-all hover:border-emerald-500 hover:shadow-md hover:bg-emerald-100/70 active:scale-[0.98]"
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="rounded bg-emerald-200 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-800">
                              A1 (Sudut Kiri)
                            </span>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          </div>
                          <div className="text-xs font-extrabold text-emerald-950">
                            IYA, Lanjut
                          </div>
                          <div className="text-[10px] text-emerald-700/80 mt-0.5 leading-tight">
                            Mulai {nextGuide.title}
                          </div>
                        </button>

                        {/* Pilihan E1 = TIDAK */}
                        <button
                          onClick={resetGuide}
                          className="group relative flex flex-col items-start rounded-xl border-2 border-slate-200 bg-white p-2.5 text-left transition-all hover:border-slate-400 hover:shadow-md hover:bg-slate-50 active:scale-[0.98]"
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-extrabold text-slate-600">
                              E1 (Sudut Kanan)
                            </span>
                            <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                          </div>
                          <div className="text-xs font-extrabold text-slate-800">
                            TIDAK, Istirahat
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                            Ke Menu Eksplorasi
                          </div>
                        </button>
                      </div>
                      
                      <p className="text-[10px] text-cs-text/50 italic text-center pt-0.5 flex items-center justify-center gap-1.5">
                        <Lightbulb className="h-3 w-3 text-amber-500 shrink-0 inline" />
                        <span>Letakkan balok di sudut kiri bawah (A1) atau sudut kanan bawah (E1).</span>
                      </p>
                    </div>
                  ) : (
                    <div className="py-2 text-center text-xs font-bold text-emerald-700 flex items-center justify-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>Pilihan diterima! Membuka panduan...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-2">
                  <button
                    onClick={resetGuide}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-cs-text hover:bg-slate-200 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Menu Utama
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Current Instruction */}
              <div
                className={`rounded-xl border-2 p-3.5 transition-all ${
                  stepCompleted
                    ? "border-emerald-300 bg-emerald-50/70"
                    : mode === "recognition"
                    ? "border-amber-200 bg-amber-50/40"
                    : mode === "quiz"
                    ? "border-indigo-200 bg-indigo-50/40"
                    : mode === "troubleshoot"
                    ? "border-rose-200 bg-rose-50/40"
                    : mode === "series" || mode === "adaptive_series"
                    ? "border-violet-200 bg-violet-50/50"
                    : "border-sky-200 bg-sky-50/50"
                }`}
              >
                <div className="flex items-start gap-2">
                  {stepCompleted && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-1" />
                  )}
                  <div>
                    <p className="text-sm font-bold text-cs-text leading-6">
                      {step?.instruction}
                    </p>
                  </div>
                </div>

                {/* Target cells visual */}
                {step && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {step.targetCells &&
                      Object.entries(step.targetCells).map(([cell, comp]) => {
                        const done = completedCells.has(cell);
                        return (
                          <span
                            key={cell}
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold transition-all ${
                              done
                                ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300"
                                : "bg-white text-cs-text/60 ring-1 ring-slate-200"
                            }`}
                          >
                            {done ? <CheckCircle2 className="h-3 w-3" /> : null}
                            {cell}: {COMPONENT_LABEL[comp] ?? comp}
                          </span>
                        );
                      })}
                  </div>
                )}

                {/* Penjelasan Komponen saat terdeteksi */}
                {stepCompleted && step?.explanation && (
                  <div className="mt-3 rounded-lg border border-amber-200/90 bg-amber-50/90 p-3 text-xs text-amber-950">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                      <span>Penjelasan Komponen:</span>
                    </div>
                    <p className="leading-relaxed text-amber-900/90">{step.explanation}</p>
                    <button
                      onClick={skipStep}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.99]"
                    >
                      {currentStep < totalSteps - 1 ? (
                        <>
                          Lanjut ke Komponen Berikutnya <SkipForward className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        <>
                          Selesaikan Pengenalan <CheckCircle2 className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Panduan Rabaan Bentuk Taktil / Hint */}
              {step?.hint && (
                <div className="rounded-xl border border-amber-200/90 bg-amber-50/80 p-3 text-xs text-amber-950 flex items-start gap-2.5 shadow-2xs">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-200/80 text-amber-800 shrink-0 mt-0.5 select-none">
                    <Hand className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-amber-900 block text-[11px] uppercase tracking-wide">
                      Panduan Rabaan Bentuk Taktil:
                    </span>
                    <p className="text-xs leading-relaxed text-amber-900/90 mt-0.5">{step.hint}</p>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={toggleMute}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      isMuted ? "bg-rose-100 text-rose-500" : "bg-slate-100 text-cs-text/50 hover:text-cs-text"
                    }`}
                    title={isMuted ? "Nyalakan suara" : "Matikan suara"}
                  >
                    {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={replayVoice}
                    disabled={isMuted}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-cs-text/50 hover:text-cs-text disabled:opacity-30 transition-colors"
                    title={stepCompleted && step?.explanation ? "Putar ulang penjelasan" : "Putar ulang suara"}
                  >
                    <Play className="h-3.5 w-3.5" />
                  </button>
                  {isSpeaking && (
                    <button
                      onClick={stopSpeaking}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-cs-text/50 hover:text-cs-text transition-colors"
                      title="Hentikan suara"
                    >
                      <Pause className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={skipStep}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-cs-text/60 hover:text-cs-text hover:bg-slate-200 transition-colors"
                  >
                    Lewati <SkipForward className="h-3 w-3" />
                  </button>
                  <button
                    onClick={resetGuide}
                    className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-400 hover:bg-rose-100 hover:text-rose-500 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" /> Berhenti
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
