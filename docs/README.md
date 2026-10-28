# PUSAT DOKUMENTASI & PANDUAN LENTERA

Folder ini merangkum seluruh dokumen panduan teknis, spesifikasi produk, konsep pedagogi, dan catatan sesi pengerjaan proyek LENTERA agar mudah dicari dan dibaca kapan saja.

---

## Daftar Isi Dokumentasi

| No | Dokumen | Kategori | Keterangan Singkat |
|:---:|:---|:---:|:---|
| 0 | [MANUAL_BOOK_LENTERA.md](./MANUAL_BOOK_LENTERA.md) | **Manual Utama & Modul Lengkap** | **Buku Panduan Lengkap Resmi LENTERA**: Mencakup seluruh spesifikasi hardware 5×5, 7 balok taktil, kamera under-board, arsitektur software, navigasi mandiri, 5 modul kurikulum, panduan operasional guru, wiring teknis, dan troubleshooting. |
| 1 | [KONSEP_TUTOR_INTERAKTIF_TAKTIL.md](./KONSEP_TUTOR_INTERAKTIF_TAKTIL.md) | **Inovasi & Penjurian** | Konsep AI Tutor Sokratik: siswa menjawab pertanyaan suara cukup dengan menaruh blok di grid (solusi kemandirian 100% siswa tunanetra tanpa mic/layar). Lengkap dengan naskah dialog dan poin pembelaan di hadapan juri. |
| 2 | [LENTERA PRD GUIDE.md](./LENTERA%20PRD%20GUIDE.md) | **Spesifikasi Produk** | Product Requirement Document (PRD) inti: spesifikasi hardware Raspberry Pi, kamera CSI under-board, grid 5x5, ID ArUco, debounce, dan evaluasi graf rangkaian listrik. |
| 3 | [PANDUAN_POWER_BUTTON.md](./PANDUAN_POWER_BUTTON.md) | **Hardware & Wiring** | Skema pengkabelan tombol fisik push button 4-pin stainless (dengan LED indikator), konfigurasi wake-up / shutdown aman via GPIO 3, dan status LED via UART TXD. |
| 4 | [Lentera_Handover_Session.md](./Lentera_Handover_Session.md) | **Riwayat & Status** | Catatan handover status sistem, arsitektur yang sudah selesai dibangun, ringkasan perbaikan polaritas, dan checklist tindak lanjut. |
| 5 | [NEXT_PLAN.md](./NEXT_PLAN.md) | **Roadmap** | Rencana pengembangan fitur lanjutan untuk LENTERA (fase kurikulum, optimasi, dan fitur lanjutan). |
| 6 | [PANDUAN_CLOUDFLARE_TUNNEL.md](./PANDUAN_CLOUDFLARE_TUNNEL.md) | **Jaringan & Akses Remote** | Panduan setup Cloudflare Tunnel untuk mengakses web portal LENTERA dari jarak jauh secara aman. |
| 7 | [PANDUAN_NGROK_TUNNEL.md](./PANDUAN_NGROK_TUNNEL.md) | **Jaringan & Akses Remote** | Panduan alternatif tunneling menggunakan ngrok untuk ekspos port web dan WebSocket. |
| 8 | [PANDUAN_MULTI_STUDENT_DAN_AKSES_MANDIRI.md](./PANDUAN_MULTI_STUDENT_DAN_AKSES_MANDIRI.md) | **Fitur Kelas & Akses Mandiri** | Panduan sistem profil multi-siswa (1 laptop untuk banyak siswa SLB), sambutan suara otomatis di landing page, trigger auto-redirect balok baterai tanpa mouse, dan isolasi progres localStorage tanpa penambahan balok fisik baru. |

---

> [!TIP]
> Saat mempersiapkan presentasi atau menghadapi juri, dokumen nomor 1 ([KONSEP_TUTOR_INTERAKTIF_TAKTIL.md](./KONSEP_TUTOR_INTERAKTIF_TAKTIL.md)) dan nomor 2 ([LENTERA PRD GUIDE.md](./LENTERA%20PRD%20GUIDE.md)) adalah referensi paling penting untuk menjawab pertanyaan konsep dan spesifikasi teknis.
