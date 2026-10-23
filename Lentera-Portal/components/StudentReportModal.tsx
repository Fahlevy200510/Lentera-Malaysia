"use client";

import React from "react";
import { Printer, X, Award, CheckCircle2, AlertCircle, FileText, Sparkles, UserCheck } from "lucide-react";
import { getActiveStudent, getStudentProgress, type StudentProfile, type StudentProgress } from "@/utils/progress";

interface StudentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StudentReportModal({ isOpen, onClose }: StudentReportModalProps) {
  if (!isOpen) return null;

  const student: StudentProfile = getActiveStudent();
  const progress: StudentProgress = getStudentProgress();

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const modulesList = [
    {
      id: "component_recognition",
      name: "Tahap 1: Pengenalan Bentuk Taktil Komponen",
      desc: "Kemampuan membedakan 6 komponen fisik (baterai, saklar, lampu, kabel lurus, kabel L, kabel T) berbasis rabaan timbul.",
      done: progress.modules.component_recognition,
    },
    {
      id: "component_quiz",
      name: "Tahap 2: Kuis Taktil & Pemahaman Fungsi",
      desc: "Menjawab pertanyaan fungsi komponen listrik secara mandiri dengan meletakkan balok di papan fisik.",
      done: progress.modules.component_quiz ?? false,
    },
    {
      id: "series_circuit",
      name: "Tahap 3: Perakitan Rangkaian Listrik Seri",
      desc: "Menyusun loop sirkuit seri satu jalur tertutup hingga lampu menyala sempurna.",
      done: progress.modules.series_circuit,
    },
    {
      id: "parallel_circuit",
      name: "Tahap 4: Perakitan Rangkaian Listrik Paralel",
      desc: "Menyusun sirkuit bercabang dengan kabel T dan saklar mandiri untuk setiap lampu.",
      done: progress.modules.parallel_circuit,
    },
    {
      id: "circuit_troubleshoot",
      name: "Tahap 5: Tantangan Detektif Sirkuit (Tingkat Mahir)",
      desc: "Mendiagnosis, menguji saklar pemutus arus, dan memecahkan tantangan sirkuit tanpa panduan visual.",
      done: progress.modules.circuit_troubleshoot ?? false,
    },
  ];

  const completedCount = modulesList.filter((m) => m.done).length;
  const masteryPercentage = Math.round((completedCount / modulesList.length) * 100);

  return (
    <div
      id="student-report-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm print:p-0 print:bg-white print:static print:z-auto print:inset-auto"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
          }
          body > *:not(main) {
            display: none !important;
          }
          body > main {
            display: block !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          body > main > *:not(#student-report-modal-backdrop) {
            display: none !important;
          }
          #student-report-modal-backdrop {
            display: block !important;
            position: static !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            inset: auto !important;
            z-index: 1 !important;
          }
          #student-report-card {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            border-radius: 0 !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
            padding: 4mm 6mm !important;
            margin: 0 !important;
            max-height: none !important;
            background: #ffffff !important;
          }
          #student-report-body {
            display: block !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            max-height: none !important;
          }
          .print-section {
            display: block !important;
            width: 100% !important;
            margin-bottom: 11px !important;
            clear: both !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-hidden,
          .print\\:hidden,
          button {
            display: none !important;
          }
        }
      ` }} />

      <div
        id="student-report-card"
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl print:shadow-none print:max-h-none print:w-full print:rounded-none overflow-hidden"
      >
        
        {/* Modal Top Bar (Hidden on Print) */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-3.5 print:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <FileText className="h-4 w-4" />
            </div>
            <span className="font-heading text-xs font-bold text-slate-800">
              Lembar Capaian Siswa • LENTERA SLB
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Cetak / PDF
            </button>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/80 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div id="student-report-body" className="flex-1 overflow-y-auto p-7 print:p-0 print:overflow-visible text-slate-800 space-y-4 print:space-y-0">
          
          {/* Header Lembaga / Alat */}
          <div className="print-section border-b-2 border-indigo-600 pb-3 text-center">
            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-extrabold uppercase tracking-widest mb-1.5">
              <Sparkles className="h-3 w-3" /> LENTERA • Inklusi Pendidikan Fisika
            </div>
            <h1 className="font-heading text-xl font-black text-slate-900 tracking-tight leading-tight">
              LEMBAR LAPORAN CAPAIAN BELAJAR SISWA
            </h1>
            <p className="text-[11px] text-slate-500 mt-1 max-w-lg mx-auto leading-normal">
              Media Pembelajaran Fisika Kelistrikan Berbasis Tangible User Interface & Panduan Suara Mandiri untuk Siswa Tunanetra
            </p>
          </div>

          {/* Biodata Siswa */}
          <div className="print-section rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs">
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="w-1/2 pb-1.5 pr-2 align-top">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Nama Siswa:</span>
                    <p className="font-heading text-sm font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5">
                      <span>{student.avatar}</span> {student.name}
                    </p>
                  </td>
                  <td className="w-1/2 pb-1.5 pl-2 align-top">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Kelas / Kelompok:</span>
                    <p className="font-heading text-sm font-extrabold text-slate-900 mt-0.5">
                      {student.grade}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td className="w-1/2 pt-1 pr-2 align-top">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tanggal Asesmen:</span>
                    <p className="font-semibold text-slate-700 mt-0.5">{today}</p>
                  </td>
                  <td className="w-1/2 pt-1 pl-2 align-top">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Indeks Kemandirian Belajar:</span>
                    <p className="font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5" /> 100% Mandiri Taktil (Bebas Layar)
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Ringkasan Skor Kemahiran */}
          <div className="print-section rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-3.5 text-white shadow-sm">
            <table className="w-full border-collapse text-white">
              <tbody>
                <tr>
                  <td className="align-middle text-left">
                    <span className="text-[10px] uppercase font-bold text-indigo-100 block">Tingkat Penguasaan Materi</span>
                    <div className="text-2xl font-black leading-tight text-white">{masteryPercentage}% Kuasai</div>
                    <p className="text-[11px] text-indigo-100/95 mt-0.5">
                      {completedCount} dari {modulesList.length} modul kurikulum telah diselesaikan mandiri
                    </p>
                  </td>
                  <td className="align-middle text-right whitespace-nowrap">
                    <span className="text-[10px] uppercase font-bold text-indigo-100 block">Total XP Capaian</span>
                    <div className="text-xl font-black leading-tight text-white">{progress.xp} XP</div>
                    <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold mt-1 text-white">
                      {progress.achievements.length} Lencana Prestasi
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Matriks Capaian Modul */}
          <div className="print-section">
            <h3 className="font-heading text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
              Evaluasi Capaian Modul Pembelajaran
            </h3>
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
              <table className="w-full border-collapse">
                <tbody>
                  {modulesList.map((mod, idx) => (
                    <tr
                      key={mod.id}
                      className={`border-b border-slate-100 last:border-b-0 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                    >
                      <td className="p-2.5 pl-3 align-middle">
                        <div className="font-bold text-slate-800 text-xs">{mod.name}</div>
                        <div className="text-[10.5px] text-slate-500 leading-snug mt-0.5">{mod.desc}</div>
                      </td>
                      <td className="p-2.5 pr-3 align-middle text-right shrink-0 whitespace-nowrap w-28">
                        {mod.done ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" /> Dikuasai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                            <AlertCircle className="h-3 w-3" /> Dalam Proses
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Catatan Keterampilan Taktil & Safety */}
          <div className="print-section rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
              <Award className="h-3.5 w-3.5 text-indigo-600" /> Catatan Perkembangan Motorik & Keamanan Listrik
            </h4>
            <ul className="text-[10.5px] text-slate-600 list-disc pl-4 space-y-0.5 leading-relaxed">
              <li>Siswa menunjukkan respon taktil cepat dalam mengenali simbol timbul (+, −, kubah beban, tuas saklar).</li>
              <li>Mampu merespon peringatan darurat korsleting arus pendek dengan memutus loop sirkuit secara aman.</li>
              <li>Mampu mengambil keputusan checkpoint (A1 = Lanjut, E1 = Selesai) secara mandiri melalui papan fisik.</li>
            </ul>
          </div>

          {/* Area Tanda Tangan Guru / Pembimbing */}
          <div className="print-section pt-3">
            <table className="w-full text-center text-xs border-collapse">
              <tbody>
                <tr>
                  <td className="w-1/2 align-top px-4">
                    <p className="text-slate-500 text-[11px]">Siswa Pembelajar,</p>
                    <div className="h-10" />
                    <div className="font-bold text-slate-900 border-b border-slate-400 pb-1 w-44 mx-auto">
                      ( {student.name} )
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Siswa LENTERA SLB</p>
                  </td>
                  <td className="w-1/2 align-top px-4">
                    <p className="text-slate-500 text-[11px]">Guru Pendamping Khusus (GPK),</p>
                    <div className="h-10" />
                    <div className="font-bold text-slate-900 border-b border-slate-400 pb-1 w-44 mx-auto">
                      (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">NIP / NUPTK.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  );
}
