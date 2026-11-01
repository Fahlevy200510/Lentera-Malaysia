"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Download,
  FileText,
  ChevronRight,
  CheckCircle2,
  ArrowLeft,
  LayoutDashboard,
  ScanEye,
  Sparkles,
  Volume2,
  VolumeX,
  ShieldCheck,
  HelpCircle,
  Layers,
  Cpu,
  Battery,
  Lightbulb,
  ToggleRight,
  Cable,
  User,
  Info,
  AlertCircle,
  ExternalLink,
  SlidersHorizontal,
  Bookmark,
  Check,
  Compass,
  Zap,
} from "lucide-react";
import { speakNarration, cancelSpeech } from "@/utils/audioCoordinator";

/* ---------------------------------------------------------------- Data Types */
type FeatureKey =
  | "learn"
  | "landing"
  | "recognition"
  | "quiz"
  | "series"
  | "parallel"
  | "explore";

interface CellDetail {
  cell: string;
  name: string;
  component: string;
  arucoId?: string;
  role: string;
  tactileCue: string;
  badge?: string;
  badgeColor?: string;
}

interface FeatureMapping {
  key: FeatureKey;
  title: string;
  tag: string;
  icon: typeof LayoutDashboard;
  color: string;
  accentSoft: string;
  summary: string;
  audioGuide: string;
  cells: Record<string, CellDetail>;
  steps?: { step: number; text: string; cell: string; note: string }[];
}

/* ---------------------------------------------------------------- Feature Mappings */
const FEATURES: FeatureMapping[] = [
  {
    key: "learn",
    title: "LENTERA Learn (Dashboard)",
    tag: "Navigasi Cepat Tanpa Layar",
    icon: LayoutDashboard,
    color: "#7C3AED",
    accentSoft: "#EDE9FE",
    summary:
      "Gunakan papan 5×5 sebagai antarmuka kontrol fisik saat berada di Dashboard Pembelajaran. Siswa cukup meletakkan balok atau kartu identitas di sel navigasi.",
    audioGuide:
      "Pada halaman LENTERA Learn, Anda dapat bernavigasi tanpa layar komputer: Letakkan balok di sel A1 untuk mendengarkan capaian belajar lengkap. Letakkan balok di sel C5 untuk membuka rapor AI dan mencetak PDF. Letakkan kartu identitas di sel E5 untuk mengakhiri sesi. Meletakkan balok di rongga mana pun lainnya akan otomatis membuka LENTERA Lab.",
    cells: {
      A1: {
        cell: "A1",
        name: "Sudut Kiri Depan (Dekat Siswa)",
        component: "Balok Sirkuit Apa Saja (Baterai, Lampu, Kabel)",
        arucoId: "ID 1 – 7",
        role: "Memicu pembacaan suara audio lengkap mengenai capaian belajar, tingkatan XP, modul yang dikuasai, dan rekomendasi fokus belajar hari ini.",
        tactileCue: "Slot pojok kiri paling dekat dengan tubuh siswa.",
        badge: "Audio Capaian Belajar",
        badgeColor: "#7C3AED",
      },
      C5: {
        cell: "C5",
        name: "Tengah Belakang (Menjauhi Siswa)",
        component: "Balok Sirkuit Apa Saja (Baterai, Saklar, Lampu, dll.)",
        arucoId: "ID 1 – 7",
        role: "Membuka modal Rapor Hasil Belajar Siswa berbasis AI dengan ringkasan kompetensi, grafik radar, analisis guru, serta tombol cetak PDF.",
        tactileCue: "Slot kolom C (tengah) di baris 5 (paling atas/belakang).",
        badge: "Buka Rapor & PDF",
        badgeColor: "#059669",
      },
      E5: {
        cell: "E5",
        name: "Sudut Kanan Belakang",
        component: "Kartu Identitas Siswa",
        arucoId: "ID 35 (Via), 36 (Amira), 37 (Ajib)",
        role: "Mengakhiri sesi belajar siswa secara aman, menyimpan akumulasi progres ke sistem, dan kembali ke Beranda utama.",
        tactileCue: "Slot pojok kanan paling jauh dari tubuh siswa.",
        badge: "Selesai Sesi / Logout",
        badgeColor: "#E11D48",
      },
      OTHER: {
        cell: "B1..E4",
        name: "Semua Sel Lainnya",
        component: "Balok Rangkaian Apa Saja",
        arucoId: "ID 1 – 7",
        role: "Saat balok diletakkan di rongga selain A1 dan C5, sistem langsung beralih ke ruang eksperimen sirkuit LENTERA Lab (/aruco).",
        tactileCue: "Rongga grid umum di luar slot pintasan navigasi.",
        badge: "Buka LENTERA Lab",
        badgeColor: "#D97706",
      },
    },
    steps: [
      {
        step: 1,
        cell: "A1",
        text: "Dengarkan Capaian Belajar",
        note: "Letakkan balok sirkuit di sel A1 untuk mendengar ringkasan suara.",
      },
      {
        step: 2,
        cell: "C5",
        text: "Lihat & Cetak Rapor AI",
        note: "Letakkan balok di sel C5 untuk membuka modal rapor siswa dan ekspor PDF.",
      },
      {
        step: 3,
        cell: "B1..E4",
        text: "Lanjut Praktikum ke Lab",
        note: "Letakkan komponen sirkuit di sel mana saja untuk langsung pindah ke LENTERA Lab.",
      },
      {
        step: 4,
        cell: "E5",
        text: "Akhiri Sesi & Simpan",
        note: "Letakkan kartu siswa di E5 saat jam praktikum telah selesai.",
      },
    ],
  },
  {
    key: "landing",
    title: "Beranda Utama (Landing Page)",
    tag: "Login Taktil Otomatis",
    icon: Compass,
    color: "#D97706",
    accentSoft: "#FEF3C7",
    summary:
      "Siswa tunanetra tidak perlu mengetik username atau password. Cukup sentuh dan letakkan kartu identitas di atas papan LENTERA.",
    audioGuide:
      "Di Beranda utama LENTERA, Anda dapat masuk secara otomatis tanpa keyboard. Cukup letakkan kartu identitas siswa di sel mana saja di atas papan fisik. Sistem akan menyapa nama Anda melalui suara dan langsung membawa Anda ke ruang eksperimen LENTERA Lab.",
    cells: {
      ANY: {
        cell: "A1..E5",
        name: "Sel Mana Saja di Papan 5×5",
        component: "Kartu Identitas Siswa (Token Taktil)",
        arucoId: "ID 35, ID 36, ID 37",
        role: "Mendeteksi identitas siswa (Via, Amira, atau Ajib), memuat data pembelajaran mereka, menyapa via suara ramah, dan otomatis berpindah ke LENTERA Lab.",
        tactileCue: "Kartu berbentuk persegi dengan huruf Braille inisial nama siswa di permukaannya.",
        badge: "Auto-Login & Buka Lab",
        badgeColor: "#D97706",
      },
      CIRCUIT: {
        cell: "A1..E5",
        name: "Sel Komponen Sirkuit",
        component: "Balok Rangkaian (Baterai, Lampu, Saklar, Kabel)",
        arucoId: "ID 1 – 7",
        role: "Jika siswa langsung meletakkan komponen rangkaian sebelum kartu terpasang, sistem menyapa siswa aktif dan langsung membuka ruang praktikum.",
        tactileCue: "Balok komponen listrik dengan tekstur simbol timbul.",
        badge: "Buka LENTERA Lab",
        badgeColor: "#7C3AED",
      },
    },
    steps: [
      {
        step: 1,
        cell: "Bebas",
        text: "Ambil Kartu Identitas Siswa",
        note: "Raba inisial huruf Braille nama siswa pada kartu fisik.",
      },
      {
        step: 2,
        cell: "A1..E5",
        text: "Letakkan di Papan",
        note: "Letakkan di slot mana saja di papan LENTERA.",
      },
      {
        step: 3,
        cell: "Audio",
        text: "Sambutan Suara Otomatis",
        note: "Sistem menyapa nama siswa dan membuka halaman praktikum.",
      },
    ],
  },
  {
    key: "recognition",
    title: "LENTERA Lab: Pengenalan Komponen",
    tag: "Media Raba & Bentuk Taktil",
    icon: Layers,
    color: "#2563EB",
    accentSoft: "#DBEAFE",
    summary:
      "Mengenalkan ciri fisik taktil, simbol timbul, tanda Braille, dan fungsi kelistrikan 6 komponen utama pada sel titik fokus C3.",
    audioGuide:
      "Dalam mode pengenalan komponen, letakkan balok yang ingin Anda pelajari tepat di tengah papan pada sel C3. Sistem akan menjelaskan nama komponen, cara meraba tandanya, dan fungsinya dalam aliran listrik.",
    cells: {
      C3: {
        cell: "C3",
        name: "Titik Pusat Papan (Kolom C, Baris 3)",
        component: "Balok Bergantian (Baterai, Saklar, Lampu, Kabel)",
        arucoId: "ID 1, 2, 3, 4, 5, 6/7",
        role: "Sel sensorik utama. Kamera membaca marker ArUco di bawah sel C3, lalu sistem audio menuturkan detail taktil dan cara meraba komponen tersebut.",
        tactileCue: "Tepat di tengah-tengah grid 5×5 (2 kotak dari setiap sisi tepi papan).",
        badge: "Titik Fokus Raba",
        badgeColor: "#2563EB",
      },
    },
    steps: [
      {
        step: 1,
        cell: "C3",
        text: "Baterai (ID 1)",
        note: "Raba simbol (+) timbul dan (-) mendatar untuk membedakan kutub positif & negatif.",
      },
      {
        step: 2,
        cell: "C3",
        text: "Saklar (ID 6 & 7)",
        note: "Raba tuas putar/geser timbul di bagian atas untuk menyambung & memutus arus.",
      },
      {
        step: 3,
        cell: "C3",
        text: "Lampu LED (ID 5)",
        note: "Raba kubah bohlam bundar timbul serta tanda polaritas anoda/katoda.",
      },
      {
        step: 4,
        cell: "C3",
        text: "Kabel Lurus (ID 2)",
        note: "Raba alur garis timbul lurus yang membentang dari satu sisi ke sisi seberang.",
      },
      {
        step: 5,
        cell: "C3",
        text: "Kabel Sudut L (ID 3)",
        note: "Raba alur berbelok siku 90 derajat untuk mengalirkan arus di sudut papan.",
      },
      {
        step: 6,
        cell: "C3",
        text: "Kabel Cabang T (ID 4)",
        note: "Raba alur cabang tiga timbul pembagi arus pada rangkaian paralel.",
      },
    ],
  },
  {
    key: "quiz",
    title: "LENTERA Lab: Kuis Taktil Interaktif",
    tag: "Tebak Komponen Berbasis Suara",
    icon: HelpCircle,
    color: "#059669",
    accentSoft: "#DCFCE7",
    summary:
      "Menguji pemahaman siswa tunanetra lewat tantangan audio cerdas. Siswa meraba balok di meja dan menaruh jawabannya di sel yang diminta.",
    audioGuide:
      "Dalam Kuis Taktil, asisten suara LENTERA akan membacakan tebakan, misalnya: Manakah komponen yang mengubah energi listrik menjadi cahaya? Siswa meraba balok di meja dan meletakkan balok jawaban di sel C3 untuk dinilai seketika.",
    cells: {
      C3: {
        cell: "C3",
        name: "Sel Jawaban Kuis",
        component: "Balok Jawaban Siswa",
        arucoId: "ID 1 – 7",
        role: "Sistem mendeteksi marker ArUco balok jawaban. Jika benar, terdengar efek bunyi perayaan dan penjelasan positif. Jika salah, diberikan petunjuk rabaan tambahan.",
        tactileCue: "Sel tengah C3 (mudah dijangkau oleh kedua tangan siswa).",
        badge: "Slot Jawaban",
        badgeColor: "#059669",
      },
    },
    steps: [
      {
        step: 1,
        cell: "Audio",
        text: "Dengarkan Pertanyaan Kuis",
        note: "Suara AI membacakan soal karakteristik komponen.",
      },
      {
        step: 2,
        cell: "Meja",
        text: "Eksplorasi Raba di Meja",
        note: "Siswa meraba dan mengidentifikasi balok yang tepat di atas meja.",
      },
      {
        step: 3,
        cell: "C3",
        text: "Letakkan di Sel C3",
        note: "Letakkan balok di sel C3 untuk verifikasi otomatis oleh sistem kamera.",
      },
      {
        step: 4,
        cell: "Feedback",
        text: "Umpan Balik Instan",
        note: "Mendengar konfirmasi benar atau panduan korektif jika masih tertukar.",
      },
    ],
  },
  {
    key: "series",
    title: "LENTERA Lab: Rangkaian Seri",
    tag: "12 Langkah Loop Tertutup",
    icon: Zap,
    color: "#7C3AED",
    accentSoft: "#EDE9FE",
    summary:
      "Panduan langkah demi langkah menyusun sirkuit seri 1 loop tertutup: 1 Baterai, 2 Saklar, 2 Lampu LED, dan kabel penghubung di sekeliling papan.",
    audioGuide:
      "Rangkaian Seri disusun melingkari tepi papan: Baterai di B4, Kabel Sudut di B5, Saklar di C5, Lampu pertama di D5, Kabel Sudut di E5, Saklar kedua di E4, Lampu kedua di E3, Kabel Sudut di E2, Kabel Lurus di D2 dan C2, Kabel Sudut di B2, dan Kabel Lurus di B3. Terakhir, putar saklar untuk menyalakan lampu.",
    cells: {
      B4: {
        cell: "B4",
        name: "Posisi Baterai Seri",
        component: "Baterai (battery)",
        arucoId: "ID 1",
        role: "Sumber tegangan. Kutub positif (+) menghadap ke atas menuju B5.",
        tactileCue: "Kolom B baris 4 (sisi kiri sirkuit).",
        badge: "Baterai",
        badgeColor: "#2563EB",
      },
      B5: {
        cell: "B5",
        name: "Sudut Kiri Atas",
        component: "Kabel Sudut L",
        arucoId: "ID 3",
        role: "Membelokkan arus dari baterai ke arah kanan (C5).",
        tactileCue: "Kolom B baris 5.",
        badge: "Kabel Sudut L",
        badgeColor: "#64748B",
      },
      C5: {
        cell: "C5",
        name: "Kendali Saklar 1",
        component: "Saklar 1 (switch)",
        arucoId: "ID 6 & 7",
        role: "Saklar pertama (posisi mendatar). Diputar 90° saat penutupan sirkuit.",
        tactileCue: "Kolom C baris 5.",
        badge: "Saklar 1",
        badgeColor: "#D97706",
      },
      D5: {
        cell: "D5",
        name: "Beban Lampu LED 1",
        component: "Lampu LED 1 (lamp)",
        arucoId: "ID 5",
        role: "Lampu pertama. Kutub (+) menghadap ke kiri ke arah saklar.",
        tactileCue: "Kolom D baris 5.",
        badge: "Lampu 1",
        badgeColor: "#EAB308",
      },
      E5: {
        cell: "E5",
        name: "Sudut Kanan Atas",
        component: "Kabel Sudut L",
        arucoId: "ID 3",
        role: "Membelokkan arus dari D5 ke arah bawah (E4).",
        tactileCue: "Kolom E baris 5.",
        badge: "Kabel Sudut L",
        badgeColor: "#64748B",
      },
      E4: {
        cell: "E4",
        name: "Kendali Saklar 2",
        component: "Saklar 2 (switch)",
        arucoId: "ID 6 & 7",
        role: "Saklar kedua (posisi tegak).",
        tactileCue: "Kolom E baris 4.",
        badge: "Saklar 2",
        badgeColor: "#D97706",
      },
      E3: {
        cell: "E3",
        name: "Beban Lampu LED 2",
        component: "Lampu LED 2 (lamp)",
        arucoId: "ID 5",
        role: "Lampu kedua. Kutub (+) menghadap ke atas ke arah saklar E4.",
        tactileCue: "Kolom E baris 3.",
        badge: "Lampu 2",
        badgeColor: "#EAB308",
      },
      E2: {
        cell: "E2",
        name: "Sudut Kanan Bawah",
        component: "Kabel Sudut L",
        arucoId: "ID 3",
        role: "Membelokkan arus ke arah kiri (D2).",
        tactileCue: "Kolom E baris 2.",
        badge: "Kabel Sudut L",
        badgeColor: "#64748B",
      },
      D2: {
        cell: "D2",
        name: "Kabel Penghubung Bawah 1",
        component: "Kabel Lurus",
        arucoId: "ID 2",
        role: "Kabel mendatar meneruskan arus dari E2 ke C2.",
        tactileCue: "Kolom D baris 2.",
        badge: "Kabel Lurus",
        badgeColor: "#64748B",
      },
      C2: {
        cell: "C2",
        name: "Kabel Penghubung Bawah 2",
        component: "Kabel Lurus",
        arucoId: "ID 2",
        role: "Kabel mendatar meneruskan arus ke sudut B2.",
        tactileCue: "Kolom C baris 2.",
        badge: "Kabel Lurus",
        badgeColor: "#64748B",
      },
      B2: {
        cell: "B2",
        name: "Sudut Kiri Bawah",
        component: "Kabel Sudut L",
        arucoId: "ID 3",
        role: "Membelokkan arus ke arah atas menuju baterai.",
        tactileCue: "Kolom B baris 2.",
        badge: "Kabel Sudut L",
        badgeColor: "#64748B",
      },
      B3: {
        cell: "B3",
        name: "Kabel Penutup Loop",
        component: "Kabel Lurus",
        arucoId: "ID 2",
        role: "Kabel tegak menyambungkan B2 kembali ke kutub (-) Baterai B4.",
        tactileCue: "Kolom B baris 3.",
        badge: "Kabel Lurus",
        badgeColor: "#64748B",
      },
    },
    steps: [
      { step: 1, cell: "B4", text: "Baterai", note: "Kutub (+) menghadap ke atas ke B5." },
      { step: 2, cell: "B5", text: "Kabel Sudut L", note: "Membelokkan arus ke kanan." },
      { step: 3, cell: "C5", text: "Saklar 1", note: "Letakkan mendatar di C5." },
      { step: 4, cell: "D5", text: "Lampu LED 1", note: "Kutub (+) menghadap kiri ke arah saklar." },
      { step: 5, cell: "E5", text: "Kabel Sudut L", note: "Membelokkan jalur ke arah bawah." },
      { step: 6, cell: "E4", text: "Saklar 2", note: "Letakkan tegak di E4." },
      { step: 7, cell: "E3", text: "Lampu LED 2", note: "Kutub (+) menghadap atas." },
      { step: 8, cell: "E2", text: "Kabel Sudut L", note: "Membelokkan jalur ke arah kiri." },
      { step: 9, cell: "D2", text: "Kabel Lurus", note: "Letakkan mendatar." },
      { step: 10, cell: "C2", text: "Kabel Lurus", note: "Letakkan mendatar." },
      { step: 11, cell: "B2", text: "Kabel Sudut L", note: "Membelokkan jalur ke arah atas." },
      { step: 12, cell: "B3", text: "Kabel Lurus", note: "Kabel penutup loop ke kutub (-) baterai." },
      { step: 13, cell: "C5 & E4", text: "Putar Saklar 90°", note: "Nyalakan saklar untuk menerangi lampu!" },
    ],
  },
  {
    key: "parallel",
    title: "LENTERA Lab: Rangkaian Paralel",
    tag: "Model Hemat Balok Dua Cabang",
    icon: Sparkles,
    color: "#059669",
    accentSoft: "#DCFCE7",
    summary:
      "Menyusun sirkuit paralel 2 cabang mandiri menggunakan Kabel Simpang T di B4 dan E4, serta dua cabang lampu independen di baris 4 dan baris 3.",
    audioGuide:
      "Rangkaian Paralel menggunakan Kabel Simpang T untuk membagi arus. Baterai diletakkan di C5 didampingi kabel lurus di D5, dan dua kabel sudut di B5 dan E5. Di baris 4, kabel simpang T di B4 membagi arus ke cabang pertama (saklar C4 dan lampu D4) lalu disatukan kabel simpang E4. Di baris 3, terdapat cabang kedua dengan saklar C3 dan lampu D3.",
    cells: {
      C5: {
        cell: "C5",
        name: "Sumber Baterai Utama",
        component: "Baterai (battery)",
        arucoId: "ID 1",
        role: "Kutub (+) menghadap ke kiri ke arah B5.",
        tactileCue: "Kolom C baris 5.",
        badge: "Baterai",
        badgeColor: "#2563EB",
      },
      D5: {
        cell: "D5",
        name: "Kabel Atas Mendatar",
        component: "Kabel Lurus",
        arucoId: "ID 2",
        role: "Meneruskan kutub (-) baterai ke sudut E5.",
        tactileCue: "Kolom D baris 5.",
        badge: "Kabel Lurus",
        badgeColor: "#64748B",
      },
      B5: {
        cell: "B5",
        name: "Sudut Kiri Atas",
        component: "Kabel Sudut L",
        arucoId: "ID 3",
        role: "Menghubungkan baterai ke kabel simpang B4.",
        tactileCue: "Kolom B baris 5.",
        badge: "Kabel Sudut L",
        badgeColor: "#64748B",
      },
      E5: {
        cell: "E5",
        name: "Sudut Kanan Atas",
        component: "Kabel Sudut L",
        arucoId: "ID 3",
        role: "Menghubungkan D5 ke kabel simpang E4.",
        tactileCue: "Kolom E baris 5.",
        badge: "Kabel Sudut L",
        badgeColor: "#64748B",
      },
      B4: {
        cell: "B4",
        name: "Simpang Pembagi Arus",
        component: "Kabel Cabang T",
        arucoId: "ID 4",
        role: "Membagi aliran arus listrik menjadi dua cabang (baris 4 dan baris 3).",
        tactileCue: "Kolom B baris 4.",
        badge: "Kabel Simpang T",
        badgeColor: "#059669",
      },
      C4: {
        cell: "C4",
        name: "Kendali Cabang 1",
        component: "Saklar 1 (switch)",
        arucoId: "ID 6 & 7",
        role: "Mengendalikan lampu cabang atas secara independen.",
        tactileCue: "Kolom C baris 4.",
        badge: "Saklar Cabang 1",
        badgeColor: "#D97706",
      },
      D4: {
        cell: "D4",
        name: "Lampu Cabang 1",
        component: "Lampu LED 1",
        arucoId: "ID 5",
        role: "Lampu cabang atas. Kutub (+) menghadap ke saklar C4.",
        tactileCue: "Kolom D baris 4.",
        badge: "Lampu Cabang 1",
        badgeColor: "#EAB308",
      },
      E4: {
        cell: "E4",
        name: "Simpang Penyatuan Arus",
        component: "Kabel Cabang T",
        arucoId: "ID 4",
        role: "Menyatukan kembali arus dari cabang atas dan bawah menuju kutub baterai.",
        tactileCue: "Kolom E baris 4.",
        badge: "Kabel Simpang T",
        badgeColor: "#059669",
      },
      B3: {
        cell: "B3",
        name: "Sudut Cabang Bawah Kiri",
        component: "Kabel Sudut L",
        arucoId: "ID 3",
        role: "Membelokkan arus ke cabang kedua (C3).",
        tactileCue: "Kolom B baris 3.",
        badge: "Kabel Sudut L",
        badgeColor: "#64748B",
      },
      C3: {
        cell: "C3",
        name: "Kendali Cabang 2",
        component: "Saklar 2 (switch)",
        arucoId: "ID 6 & 7",
        role: "Mengendalikan lampu cabang bawah secara terpisah.",
        tactileCue: "Kolom C baris 3.",
        badge: "Saklar Cabang 2",
        badgeColor: "#D97706",
      },
      D3: {
        cell: "D3",
        name: "Lampu Cabang 2",
        component: "Lampu LED 2",
        arucoId: "ID 5",
        role: "Lampu cabang bawah. Menyala tanpa terpengaruh saklar cabang 1.",
        tactileCue: "Kolom D baris 3.",
        badge: "Lampu Cabang 2",
        badgeColor: "#EAB308",
      },
      E3: {
        cell: "E3",
        name: "Sudut Cabang Bawah Kanan",
        component: "Kabel Sudut L",
        arucoId: "ID 3",
        role: "Mengembalikan arus dari lampu D3 ke kabel simpang E4.",
        tactileCue: "Kolom E baris 3.",
        badge: "Kabel Sudut L",
        badgeColor: "#64748B",
      },
    },
    steps: [
      { step: 1, cell: "C5", text: "Baterai", note: "Kutub (+) menghadap kiri ke arah B5." },
      { step: 2, cell: "D5", text: "Kabel Lurus", note: "Mendatar di sebelah kanan baterai." },
      { step: 3, cell: "B5", text: "Kabel Sudut L", note: "Sudut kiri atas." },
      { step: 4, cell: "E5", text: "Kabel Sudut L", note: "Sudut kanan atas." },
      { step: 5, cell: "B4", text: "Kabel Cabang T", note: "Membagi arus ke 2 cabang." },
      { step: 6, cell: "C4 & D4", text: "Cabang 1: Saklar & Lampu", note: "Jalur rangkaian cabang atas." },
      { step: 7, cell: "E4", text: "Kabel Cabang T", note: "Penyatuan kembali arus listrik." },
      { step: 8, cell: "B3..E3", text: "Cabang 2: Saklar & Lampu", note: "Jalur rangkaian cabang bawah mandiri." },
    ],
  },
  {
    key: "explore",
    title: "Eksplorasi Bebas & Detektif Sirkuit",
    tag: "Analisis Real-time 25 Sel",
    icon: ScanEye,
    color: "#E11D48",
    accentSoft: "#FFE4E6",
    summary:
      "Bebas berkreasi menyusun rangkaian apa saja di seluruh grid 5×5 (A1..E5). Sistem kecerdasan buatan mengevaluasi graf konektivitas dan mendeteksi masalah secara otomatis.",
    audioGuide:
      "Dalam mode eksplorasi bebas, seluruh 25 sel aktif mendeteksi rangkaian listrik Anda. Sistem mengevaluasi loop tertutup, polaritas LED, status saklar, dan langsung memperingatkan suara jika terjadi korsleting atau jalur terputus.",
    cells: {
      ANY: {
        cell: "A1..E5",
        name: "Seluruh 25 Sel Papan",
        component: "Kombinasi Komponen Bebas",
        arucoId: "ID 1 – 7",
        role: "Evaluasi graf kelistrikan otomatis: deteksi loop tertutup, polaritas LED, saklar ON/OFF, serta peringatan instan korsleting (short circuit) bila baterai terhubung langsung tanpa hambatan.",
        tactileCue: "Bebas meletakkan komponen di slot mana pun.",
        badge: "Evaluasi Real-time",
        badgeColor: "#E11D48",
      },
    },
    steps: [
      {
        step: 1,
        cell: "A1..E5",
        text: "Rancang Lintasan",
        note: "Mulai dari baterai, hubungkan kabel dan komponen membentuk loop.",
      },
      {
        step: 2,
        cell: "AI Graph",
        text: "Analisis Kelistrikan Otomatis",
        note: "Kamera bawah menganalisis konektivitas setiap sisi balok.",
      },
      {
        step: 3,
        cell: "Audio",
        text: "Deteksi Korsleting / Open Loop",
        note: "Mendengar bimbingan suara jika jalur belum sempurna.",
      },
    ],
  },
];

/* ---------------------------------------------------------------- ArUco Marker Tokens */
const ARUCO_MARKERS = [
  {
    id: "ID 1",
    name: "Baterai (battery)",
    category: "Sumber Daya",
    tactile: "Simbol plus (+) timbul dan simbol minus (-) mendatar.",
    rotation: "2 State Polaritas (0°/180° vs 90°/270°).",
    note: "Sumber energi utama rangkaian. Wajib dipasang searah aliran polaritas LED.",
    color: "#2563EB",
    bg: "#EFF6FF",
    Icon: Battery,
  },
  {
    id: "ID 2",
    name: "Kabel Lurus (straight_cable)",
    category: "Penghantar",
    tactile: "Alur garis timbul lurus tembus dari satu sisi ke sisi seberang.",
    rotation: "2 Orientasi: Mendatar (Horizontal) atau Tegak (Vertikal).",
    note: "Menghubungkan komponen pada satu garis lurus tanpa memutar arah.",
    color: "#64748B",
    bg: "#F8FAFC",
    Icon: Cable,
  },
  {
    id: "ID 3",
    name: "Kabel Sudut L (l_cable)",
    category: "Penghantar Sudut",
    tactile: "Alur garis timbul siku 90 derajat menyerupai huruf L.",
    rotation: "4 Arah: Menghubungkan 2 sisi tegak lurus sesuai arah belokan.",
    note: "Komponen kunci untuk membelokkan lintasan sirkuit di setiap sudut papan.",
    color: "#64748B",
    bg: "#F8FAFC",
    Icon: Cable,
  },
  {
    id: "ID 4",
    name: "Kabel Simpang T (t_cable)",
    category: "Percabangan",
    tactile: "Alur garis timbul cabang tiga menyerupai huruf T.",
    rotation: "4 Arah: Menghubungkan 3 sisi dan mengecualikan 1 sisi.",
    note: "Kunci utama rangkaian paralel untuk membagi arus ke cabang-cabang mandiri.",
    color: "#059669",
    bg: "#ECFDF5",
    Icon: Cable,
  },
  {
    id: "ID 5",
    name: "Lampu LED (lamp)",
    category: "Beban Indikator",
    tactile: "Kubah bohlam bundar timbul serta tanda anoda (+) & katoda (-).",
    rotation: "Orientasi polaritas (+/-).",
    note: "Mengubah energi listrik menjadi cahaya. Hanya menyala bila polaritas arus searah.",
    color: "#D97706",
    bg: "#FFFBEB",
    Icon: Lightbulb,
  },
  {
    id: "ID 6 & 7",
    name: "Saklar (switch)",
    category: "Kendali Arus",
    tactile: "Tuas geser/rotasi timbul di bagian atas balok.",
    rotation: "Toggle 90°: Posisi Terputus (OFF) atau Terhubung (ON).",
    note: "Tuas diputar 90 derajat dari posisi semula untuk menyalakan/mematikan lampu.",
    color: "#7C3AED",
    bg: "#F5F3FF",
    Icon: ToggleRight,
  },
  {
    id: "ID 35",
    name: "Kartu Siswa: Via",
    category: "Token Identitas",
    tactile: "Kartu datar dengan inisial Braille 'V' + label Kelas 11 SMA.",
    rotation: "Bebas rotasi.",
    note: "Memicu login otomatis dan menyajikan jalur belajar adaptif untuk Via.",
    color: "#DB2777",
    bg: "#FDF2F8",
    Icon: User,
  },
  {
    id: "ID 36",
    name: "Kartu Siswa: Amira",
    category: "Token Identitas",
    tactile: "Kartu datar dengan inisial Braille 'A' + label Kelas 11 SMA.",
    rotation: "Bebas rotasi.",
    note: "Memicu login otomatis dan menyajikan profil eksplorasi sains untuk Amira.",
    color: "#9333EA",
    bg: "#FAF5FF",
    Icon: User,
  },
  {
    id: "ID 37",
    name: "Kartu Siswa: Ajib",
    category: "Token Identitas",
    tactile: "Kartu datar dengan inisial Braille 'J' + label Kelas 11 SMA.",
    rotation: "Bebas rotasi.",
    note: "Memicu login otomatis dan rekam jejak keterampilan taktil untuk Ajib.",
    color: "#2563EB",
    bg: "#EFF6FF",
    Icon: User,
  },
];

/* ---------------------------------------------------------------- Syllabus Chapters */
const SYLLABUS_CHAPTERS = [
  {
    num: "01",
    title: "Mengenal LENTERA & Keselamatan Praktik",
    desc: "Pengantar filosofi belajar taktil, orientasi posisi papan 5×5 (A1–E5), dan panduan keselamatan sirkuit tegangan rendah.",
    badge: "Orientasi Awal",
  },
  {
    num: "02",
    title: "Anatomi Balok Taktil & Simbol Braille",
    desc: "Panduan cara meraba tekstur timbul baterai, saklar, lampu LED, kabel lurus, kabel siku L, dan kabel cabang T.",
    badge: "Sensori Taktil",
  },
  {
    num: "03",
    title: "Modul Pengenalan & Kuis Sensorik Mandiri",
    desc: "SOP pelaksanaan kuis audio interaktif di sel C3 untuk menguji kemandirian identifikasi komponen siswa.",
    badge: "Praktik Terpandu",
  },
  {
    num: "04",
    title: "Hukum Sirkuit Seri: Satu Lintasan Aliran",
    desc: "Teori dan praktikum 12 langkah sirkuit seri. Konsep pembagian tegangan dan pengaruh mematikan salah satu saklar.",
    badge: "Sirkuit Seri",
  },
  {
    num: "05",
    title: "Hukum Sirkuit Paralel: Percabangan Mandiri",
    desc: "Teori dan praktikum kabel simpang T. Pemahaman arus bercabang dan independensi beban lampu di masing-masing cabang.",
    badge: "Sirkuit Paralel",
  },
  {
    num: "06",
    title: "Detektif Sirkuit, Rapor AI & Evaluasi Guru",
    desc: "Lembar asesmen keterampilan raba, cara membaca grafik radar penguasaan siswa, dan petunjuk pencetakan Rapor PDF.",
    badge: "Evaluasi & Asesmen",
  },
];

export default function PanduanPage() {
  const [activeFeature, setActiveFeature] = useState<FeatureKey>("learn");
  const [selectedCell, setSelectedCell] = useState<string>("A1");
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [showSyllabus, setShowSyllabus] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const feature = FEATURES.find((f) => f.key === activeFeature) || FEATURES[0];

  // Set default selected cell when feature tab changes
  useEffect(() => {
    const keys = Object.keys(feature.cells);
    if (!keys.includes(selectedCell)) {
      setSelectedCell(keys[0] || "A1");
    }
  }, [activeFeature, feature.cells, selectedCell]);

  // Scroll reveal animation observer for smooth popups
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal-scroll").forEach((el) => {
        el.classList.add("is-revealed");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    const elements = document.querySelectorAll(".reveal-scroll");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [activeFeature, showSyllabus]);

  // Audio narration toggle
  const toggleAudioGuide = () => {
    if (speaking) {
      cancelSpeech();
      setSpeaking(false);
      return;
    }

    setSpeaking(true);
    speakNarration(feature.audioGuide, {
      rate: 0.94,
      pitch: 1.0,
      tag: `panduan-${feature.key}`,
      onEnd: () => setSpeaking(false),
    });
  };

  const handleDownloadClick = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  const cellDetail: CellDetail =
    feature.cells[selectedCell] ||
    feature.cells["OTHER"] ||
    feature.cells["ANY"] || {
      cell: selectedCell,
      name: `Sel ${selectedCell}`,
      component: "Komponen Sirkuit",
      role: "Slot pendukung rangkaian pada mode ini.",
      tactileCue: `Posisi baris dan kolom ${selectedCell}.`,
      badge: "Slot Aktif",
      badgeColor: "#64748B",
    };

  const isCellMapped = (c: string) => {
    if (feature.cells[c]) return true;
    if (feature.cells["ANY"] || feature.cells["OTHER"]) return true;
    return false;
  };

  const getCellHighlightColor = (c: string) => {
    if (feature.cells[c]) {
      return feature.cells[c].badgeColor || feature.color;
    }
    if (selectedCell === c) {
      return feature.color;
    }
    return "transparent";
  };

  return (
    <div className="min-h-screen bg-[#F6F4FD] font-body text-[#1E1938]">
      {/* Smooth Pop-up Animation on Scroll */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .reveal-scroll {
          opacity: 0;
          transform: translateY(28px) scale(0.97);
          transition: opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.75s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }
        .reveal-scroll.is-revealed {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        @media (prefers-reduced-motion: reduce) {
          .reveal-scroll {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
        }
      `,
        }}
      />

      {/* Top Ambient Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div
          className="absolute -top-32 left-1/4 h-[500px] w-[600px] rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(115, 92, 221, 0.28) 0%, rgba(245, 184, 65, 0.18) 50%, transparent 75%)",
          }}
        />
        <div
          className="absolute top-1/2 -right-40 h-[600px] w-[600px] rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(245, 184, 65, 0.25) 0%, rgba(115, 92, 221, 0.15) 55%, transparent 75%)",
          }}
        />
      </div>

      {/* Navigation Header */}
      <header className="relative z-20 border-b border-[#735CDD]/15 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="group flex items-center gap-2 rounded-xl p-1.5 text-xs font-bold text-[#5B43C6] transition hover:bg-[#EDE9FE]"
              aria-label="Kembali ke Beranda"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline">Beranda</span>
            </Link>

            <div className="h-5 w-px bg-slate-200" />

            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 overflow-hidden rounded-xl border border-[#5B43C6] bg-[#735CDD]">
                <img
                  src="/logo-lentera.png"
                  alt="Logo LENTERA"
                  width={36}
                  height={36}
                  className="h-full w-full object-cover scale-[1.3]"
                />
              </div>
              <div>
                <div className="font-heading text-base font-extrabold tracking-tight text-[#1E1938]">
                  LENTERA
                </div>
                <div className="text-[10px] font-bold tracking-wider text-[#735CDD]">
                  PANDUAN & MODUL AJAR
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#735CDD]/20 bg-white px-3 py-2 text-xs font-bold text-[#1E1938] shadow-xs transition hover:border-[#735CDD] hover:bg-[#FAF8FF]"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-[#735CDD]" />
              <span className="hidden md:inline">Buka</span> LENTERA Learn
            </Link>
            <Link
              href="/aruco"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#735CDD] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#5B43C6]"
            >
              <ScanEye className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Buka</span> LENTERA Lab
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <div className="mb-10 text-center sm:text-left reveal-scroll">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#735CDD]/20 bg-white/90 px-3.5 py-1.5 text-xs font-bold text-[#5B43C6] shadow-xs backdrop-blur-sm">
            <Bookmark className="h-3.5 w-3.5 text-[#F5B841]" />
            <span>Dokumentasi Resmi & Panduan Papan Fisik</span>
          </div>

          <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#1E1938]">
                Buku Panduan & Pemetaan Blok LENTERA
              </h1>
              <p className="mt-2 max-w-3xl text-sm sm:text-base leading-relaxed text-[#463E66]">
                Referensi terpadu tata letak balok taktil 5×5 untuk setiap fitur pembelajaran,
                kamus kode marker ArUco kamera bawah, dan pusat unduh Modul Ajar resmi untuk guru & siswa.
              </p>
            </div>

            <div className="flex shrink-0 items-center justify-center gap-2.5">
              <button
                onClick={toggleAudioGuide}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs ${
                  speaking
                    ? "bg-[#FEF3C7] text-[#B45309] border-2 border-[#F5B841]"
                    : "bg-white text-[#1E1938] border border-[#735CDD]/20 hover:border-[#735CDD]"
                }`}
                aria-label={speaking ? "Hentikan suara panduan" : "Dengarkan suara panduan"}
              >
                {speaking ? (
                  <>
                    <VolumeX className="h-4 w-4 text-[#B45309]" />
                    <span>Hentikan Suara</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4 text-[#735CDD]" />
                    <span>Dengar Ringkasan Suara</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================== DOWNLOAD HUB CARD */}
        <section className="mb-12 reveal-scroll">
          <div className="relative overflow-hidden rounded-3xl border-2 border-[#735CDD]/25 bg-gradient-to-br from-white via-[#FAF8FF] to-[#FFF9EE] p-6 shadow-xl sm:p-8">
            {/* Background Emblem Watermark */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-12 -right-10 h-72 w-72 rounded-full opacity-10"
              style={{
                background: "radial-gradient(circle, #735CDD 0%, #F5B841 80%, transparent 100%)",
              }}
            />

            <div className="relative z-10 grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#EDE9FE] px-3 py-1 text-[11px] font-extrabold text-[#7C3AED]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>DOKUMEN RESMI PENDIDIKAN INKLUSIF</span>
                </div>

                <h2 className="mt-3 font-heading text-xl sm:text-2xl font-extrabold text-[#1E1938]">
                  Modul Ajar & Buku Manual LENTERA (PDF)
                </h2>

                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#463E66]">
                  Panduan komprehensif bagi Guru Fasilitator SLB, Orang Tua, dan Siswa Tunanetra.
                  Memuat 6 silabus materi praktikum listrik dasar, transkrip taktil Braille, tata tertib
                  keamanan sirkuit, serta lembar evaluasi observasi belajar.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 text-[11px]">
                  <div className="flex items-center gap-2 rounded-xl bg-white/90 p-2 border border-[#735CDD]/15">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-700">6 Bab Silabus Lengkap</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-white/90 p-2 border border-[#735CDD]/15">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-700">Siap Cetak & Embosser</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-white/90 p-2 border border-[#735CDD]/15 col-span-2 sm:col-span-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-700">Standar Kurikulum Merdeka</span>
                  </div>
                </div>
              </div>

              {/* Action Box */}
              <div className="rounded-2xl border border-[#735CDD]/20 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#735CDD]" />
                    <div>
                      <div className="text-xs font-extrabold text-[#1E1938]">
                        modul-ajar-lentera.pdf
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Dokumen Panduan Pelaksanaan Praktikum
                      </div>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    Tersedia
                  </span>
                </div>

                <div className="mt-4 space-y-2.5">
                  <a
                    href="/docs/modul-ajar-lentera.pdf"
                    download="Modul-Ajar-LENTERA.pdf"
                    onClick={handleDownloadClick}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7862E2] to-[#5B43C6] px-4 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-[#735CDD]/25 transition hover:from-[#6B53DE] hover:to-[#4D35B8] active:scale-98"
                  >
                    <Download className="h-4 w-4" />
                    <span>Unduh Modul Ajar Sekarang (PDF)</span>
                  </a>

                  <button
                    onClick={() => setShowSyllabus(!showSyllabus)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#735CDD]/25 bg-slate-50/70 px-4 py-2 text-xs font-bold text-[#5B43C6] hover:bg-slate-100 transition"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>{showSyllabus ? "Tutup Pratinjau Silabus" : "Lihat Pratinjau Bab Silabus"}</span>
                  </button>
                </div>

                {downloadSuccess && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-2.5 text-[11px] font-bold text-emerald-800 border border-emerald-200 animate-fadeIn">
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Unduhan dimulai! File tersimpan ke perangkat Anda.</span>
                  </div>
                )}

                {/* Practical Upload Note for Teachers */}
                <div className="mt-4 rounded-xl bg-[#FFF9EE] p-3 text-[11px] leading-relaxed text-[#854D0E] border border-[#F5B841]/30">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <Info className="h-3.5 w-3.5 text-[#D97706]" />
                    <span>Catatan Pengunggahan Manual oleh Guru:</span>
                  </div>
                  Jika Bapak/Ibu Guru ingin memperbarui file modul ajar ini dengan naskah terbaru, cukup simpan file PDF Anda dengan nama{" "}
                  <code className="rounded bg-amber-100 px-1 py-0.5 font-mono font-bold text-amber-900">
                    modul-ajar-lentera.pdf
                  </code>{" "}
                  di dalam folder <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-amber-900">public/docs/</code>. Tombol unduh di atas akan langsung otomatis menyajikan file terbaru Anda.
                </div>
              </div>
            </div>

            {/* Collapsible Syllabus Chapters Preview */}
            {showSyllabus && (
              <div className="mt-6 border-t border-[#735CDD]/15 pt-6 animate-fadeIn">
                <h3 className="font-heading text-sm font-extrabold uppercase tracking-wider text-[#735CDD] mb-4">
                  Daftar Isi & Silabus Bab Modul Ajar
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {SYLLABUS_CHAPTERS.map((ch, idx) => (
                    <div
                      key={ch.num}
                      className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-[#735CDD]/40 transition reveal-scroll"
                      style={{ transitionDelay: `${idx * 60}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black text-[#735CDD]">
                          BAB {ch.num}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {ch.badge}
                        </span>
                      </div>
                      <div className="mt-2 text-xs font-bold text-[#1E1938]">
                        {ch.title}
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                        {ch.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================== FEATURE BLOCK MAPPING EXPLORER */}
        <section className="mb-14 reveal-scroll">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-[#735CDD]" />
              <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-[#1E1938]">
                Pemetaan Blok per Fitur (Grid 5×5)
              </h2>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-[#5A5376]">
              Pilih fitur di bawah ini untuk melihat penempatan balok fisik, peran sel, dan alur perakitannya:
            </p>
          </div>

          {/* Feature Tab Switcher */}
          <div className="mb-6 flex flex-wrap gap-2 reveal-scroll">
            {FEATURES.map((f) => {
              const active = f.key === activeFeature;
              const Icon = f.icon;
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFeature(f.key)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-extrabold transition-all ${
                    active
                      ? "bg-[#735CDD] text-white shadow-md shadow-[#735CDD]/30 -translate-y-0.5"
                      : "bg-white text-[#463E66] border border-[#735CDD]/20 hover:border-[#735CDD] hover:bg-[#FAF8FF]"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-white" : "text-[#735CDD]"}`} />
                  <span>{f.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Feature Display Card */}
          <div className="rounded-3xl border border-[#735CDD]/20 bg-white p-5 sm:p-7 shadow-lg reveal-scroll">
            {/* Feature Header */}
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-extrabold" style={{ backgroundColor: feature.accentSoft, color: feature.color }}>
                  <span>{feature.tag}</span>
                </div>
                <h3 className="mt-2 font-heading text-lg sm:text-xl font-extrabold text-[#1E1938]">
                  {feature.title}
                </h3>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-[#463E66]">
                  {feature.summary}
                </p>
              </div>

              <button
                onClick={toggleAudioGuide}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#735CDD]/25 bg-[#FAF8FF] px-3.5 py-2 text-xs font-bold text-[#5B43C6] hover:bg-[#EDE9FE] transition"
              >
                <Volume2 className="h-4 w-4 text-[#735CDD]" />
                <span>{speaking ? "Hentikan Suara" : "Dengarkan Panduan Fitur Ini"}</span>
              </button>
            </div>

            {/* Main Interactive Grid Layout */}
            <div className="mt-6 grid gap-8 lg:grid-cols-[1.05fr_1.15fr] lg:items-start">
              
              {/* Left Column: Interactive 5x5 Grid Board */}
              <div className="rounded-2xl border border-slate-200/90 bg-[#FAF9FF] p-5 shadow-inner reveal-scroll" style={{ transitionDelay: "100ms" }}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-xs font-extrabold text-[#1E1938]">
                    Peta Papan Taktil LENTERA 5×5
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Klik sel untuk melihat detail
                  </span>
                </div>

                {/* 5x5 Grid Visual */}
                <div className="relative mx-auto max-w-[340px] rounded-2xl bg-white p-3.5 border-2 border-[#735CDD]/20 shadow-md">
                  {/* Column Headers (A - E) */}
                  <div className="mb-1.5 grid grid-cols-5 text-center text-[11px] font-extrabold text-slate-400">
                    <span>A</span>
                    <span>B</span>
                    <span>C</span>
                    <span>D</span>
                    <span>E</span>
                  </div>

                  {/* 5 Rows (1 at bottom, 5 at top - matches physical board coordinates) */}
                  <div className="space-y-1.5">
                    {[5, 4, 3, 2, 1].map((row) => (
                      <div key={row} className="grid grid-cols-5 gap-1.5">
                        {["A", "B", "C", "D", "E"].map((col) => {
                          const cellId = `${col}${row}`;
                          const isSelected = selectedCell === cellId;
                          const hasCustomCell = Boolean(feature.cells[cellId]);
                          const isSpecial = isCellMapped(cellId);

                          let bgClass = "bg-slate-50 text-slate-600 border-slate-200 hover:border-[#735CDD]/40";
                          if (isSelected) {
                            bgClass = "bg-[#735CDD] text-white border-[#5B43C6] shadow-sm font-extrabold scale-102";
                          } else if (hasCustomCell) {
                            bgClass = "bg-[#EDE9FE] text-[#5B43C6] border-[#735CDD]/50 font-bold";
                          } else if (isSpecial) {
                            bgClass = "bg-white text-slate-700 border-slate-300";
                          }

                          return (
                            <button
                              key={cellId}
                              onClick={() => setSelectedCell(cellId)}
                              className={`relative flex h-12 flex-col items-center justify-center rounded-xl border text-[11px] transition-all ${bgClass}`}
                              title={`Sel ${cellId}`}
                              aria-label={`Sel ${cellId}`}
                            >
                              <span className="font-mono font-bold leading-none">{cellId}</span>
                              {hasCustomCell && (
                                <span
                                  className={`mt-1 h-1.5 w-1.5 rounded-full ${
                                    isSelected ? "bg-amber-300" : "bg-[#735CDD]"
                                  }`}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Physical Orientation Helper */}
                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 font-semibold px-1">
                    <span>Baris 1 (Paling Dekat Siswa)</span>
                    <span>Baris 5 (Menjauhi Siswa)</span>
                  </div>
                </div>

                {/* Legend Chips */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-md bg-[#735CDD]" />
                    <span className="font-semibold text-slate-700">Sel Terpilih</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-md bg-[#EDE9FE] border border-[#735CDD]/50" />
                    <span className="font-semibold text-slate-700">Titik Kunci Fitur Ini</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-md bg-slate-100 border border-slate-200" />
                    <span className="font-semibold text-slate-500">Sel Umum</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Selected Cell Inspector + Step Guide */}
              <div className="space-y-5 reveal-scroll" style={{ transitionDelay: "180ms" }}>
                
                {/* Cell Inspector Card */}
                <div className="rounded-2xl border-2 border-[#735CDD]/20 bg-gradient-to-br from-white to-[#FAF8FF] p-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#735CDD] font-mono text-base font-extrabold text-white shadow-xs">
                        {cellDetail.cell}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-[#1E1938]">
                          {cellDetail.name}
                        </div>
                        <div className="text-[11px] font-semibold text-[#735CDD]">
                          {cellDetail.component}
                        </div>
                      </div>
                    </div>

                    {cellDetail.badge && (
                      <span
                        className="rounded-full px-2.5 py-1 text-[10px] font-extrabold text-white"
                        style={{ backgroundColor: cellDetail.badgeColor || feature.color }}
                      >
                        {cellDetail.badge}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-3 text-xs leading-relaxed">
                    <div>
                      <div className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                        Fungsi & Perilaku Sistem
                      </div>
                      <p className="mt-1 text-[#1E1938] font-medium">
                        {cellDetail.role}
                      </p>
                    </div>

                    <div>
                      <div className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                        Panduan Raba Siswa (Tactile Cue)
                      </div>
                      <p className="mt-1 text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80">
                        {cellDetail.tactileCue}
                      </p>
                    </div>

                    {cellDetail.arucoId && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] font-bold text-slate-500">Kode Marker:</span>
                        <code className="rounded-md bg-[#EDE9FE] px-2 py-0.5 font-mono text-[11px] font-extrabold text-[#7C3AED]">
                          {cellDetail.arucoId}
                        </code>
                      </div>
                    )}
                  </div>
                </div>

                {/* Steps List (if applicable) */}
                {feature.steps && feature.steps.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-extrabold text-[#1E1938]">
                        Urutan Langkah Praktikum
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        {feature.steps.length} Langkah
                      </span>
                    </div>

                    <div className="max-h-64 overflow-y-auto pr-1 space-y-2 cs-scroll">
                      {feature.steps.map((st) => (
                        <div
                          key={st.step}
                          onClick={() => {
                            if (st.cell && st.cell.length === 2) {
                              setSelectedCell(st.cell);
                            }
                          }}
                          className={`flex items-start gap-3 rounded-xl p-2.5 text-xs transition cursor-pointer ${
                            selectedCell === st.cell
                              ? "bg-[#EDE9FE] border border-[#735CDD]/30"
                              : "bg-slate-50 hover:bg-slate-100 border border-slate-100"
                          }`}
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#735CDD] text-[10px] font-bold text-white mt-0.5">
                            {st.step}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#1E1938]">{st.text}</span>
                              <span className="font-mono text-[10px] font-extrabold text-[#735CDD] bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                {st.cell}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">
                              {st.note}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== ARUCO MARKER & TOKEN LEGEND */}
        <section className="mb-14 reveal-scroll">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-[#735CDD]" />
              <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-[#1E1938]">
                Kamus Marker ArUco & Identitas Balok
              </h2>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-[#5A5376]">
              Standar kamus ArUco <code className="rounded bg-slate-200 px-1 py-0.5 font-mono text-xs">cv2.aruco.DICT_4X4_50</code> yang terbaca oleh kamera bawah papan:
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ARUCO_MARKERS.map((m, idx) => {
              const Icon = m.Icon;
              return (
                <div
                  key={m.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-[#735CDD]/40 hover:shadow-md transition-all reveal-scroll"
                  style={{ transitionDelay: `${(idx % 3) * 80 + Math.floor(idx / 3) * 40}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="rounded-lg px-2.5 py-1 font-mono text-xs font-extrabold text-white"
                      style={{ backgroundColor: m.color }}
                    >
                      {m.id}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      {m.category}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-xl"
                      style={{ backgroundColor: m.bg, color: m.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="font-heading text-sm font-extrabold text-[#1E1938]">
                      {m.name}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-xs">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Ciri Raba & Braille
                      </div>
                      <div className="mt-0.5 text-slate-700 font-medium">
                        {m.tactile}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Orientasi Rotasi
                      </div>
                      <div className="mt-0.5 text-slate-600 text-[11px]">
                        {m.rotation}
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-2 text-[11px] text-slate-500 leading-snug">
                      {m.note}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================== FOOTER NAVIGATION */}
        <footer className="border-t border-[#735CDD]/15 pt-8 text-center text-xs text-slate-500 reveal-scroll">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/" className="font-bold text-[#5B43C6] hover:underline">
              Beranda LENTERA
            </Link>
            <span>•</span>
            <Link href="/dashboard" className="font-bold text-[#5B43C6] hover:underline">
              LENTERA Learn (Dashboard)
            </Link>
            <span>•</span>
            <Link href="/aruco" className="font-bold text-[#5B43C6] hover:underline">
              LENTERA Lab (Deteksi Real-time)
            </Link>
            <span>•</span>
            <a
              href="/docs/modul-ajar-lentera.pdf"
              download="Modul-Ajar-LENTERA.pdf"
              className="font-bold text-amber-600 hover:underline"
            >
              Unduh Modul Ajar (PDF)
            </a>
          </div>
          <p className="mt-3 text-[11px]">
            LENTERA — Media Pembelajaran Sains Rangkaian Listrik Taktil dan Suara untuk Siswa Tunanetra.
          </p>
        </footer>
      </main>
    </div>
  );
}

