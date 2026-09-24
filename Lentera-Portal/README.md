# CircuitSense AI — Dashboard

> Touch. Think. Understand. — an inclusive STEM learning platform for visually impaired students.

Frontend built with **Next.js 15 (App Router) · TypeScript · Tailwind CSS · Recharts · Lucide**.

## Run it locally (VS Code)

You need **Node.js 18.18+** (20+ recommended). Check with `node -v`.

1. Unzip this folder and open it in VS Code (`File → Open Folder…`).
2. Open the integrated terminal (`` Ctrl + ` ``) and install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open **http://localhost:3000** in your browser.

That's it. Edit any file and the page hot-reloads.

## What's inside

- **Student dashboard** — level & XP ring, skill map (star ratings per concept = the *Cognitive Diagnosis* idea), AI-chosen lesson (*adaptive path*), streak, achievement badges.
- **Teacher dashboard** — class mastery trend, skill-profile radar, student list, and the **AI Insights** panel (error-pattern detection, misconception spotting, ready-to-advance flags).
- **AI Tutor** — an *Explain-Before-Answer* chat with a live typing indicator; type a message or tap a quick-reply.

Switch between them with the **"Viewing as" (Student / Teacher)** toggle and the **AI Tutor** menu item.

## Project structure

```
circuitsense-ai/
├── app/
│   ├── globals.css      # fonts, keyframes, responsive grid helpers, a11y focus
│   ├── layout.tsx       # root layout + metadata
│   └── page.tsx         # root route "/" → renders the dashboard
├── components/
│   └── CircuitSenseDashboard.tsx   # the whole UI (Student + Teacher + AI Tutor)
├── package.json
├── tailwind.config.ts   # palette exposed as text-cs-primary, bg-cs-pink, etc.
├── tsconfig.json
├── next.config.mjs
└── postcss.config.mjs
```

## Customising

- **Colors** live in the `C` object at the top of `CircuitSenseDashboard.tsx` (and mirrored in `tailwind.config.ts`).
- **Fonts** are Poppins (headings) + Plus Jakarta Sans (body), loaded in `app/globals.css`.
- **Demo data** (students, skills, achievements, insights) are plain arrays near the top of each section — swap in your own to see the charts update.

## Deploying to Vercel later

This project already has `app/page.tsx`, so the root URL `/` has a route — **that is what prevents the `404: NOT_FOUND` error** you saw. Two things to remember when you deploy:

1. **Root Directory** — if you push this as a *subfolder* of a larger repo, set Vercel → *Settings → Build and Deployment → Root Directory* to `circuitsense-ai`. If this folder is the repo root, leave it blank.
2. Vercel auto-detects Next.js — no extra config needed. Just connect the repo and deploy.

---

## Backend (LENTERA API)

Backend LENTERA sekarang menggunakan **Next.js Route Handlers**, jadi tidak membutuhkan server backend terpisah untuk fitur aplikasi utama.

Endpoint yang tersedia:
- `GET /api/health` — mengecek status API.
- `POST /api/auth/login` — validasi login mode demo dan membuat session client.
- `GET /api/tutor` — mengecek status AI Tutor.
- `POST /api/tutor` — Context-Aware Learning Engine (CLE) untuk AI Tutor.

`/api/tutor` tetap menjadi backend utama AI Tutor dan memiliki **dual engine**:
1. Groq LLaMA jika `GROQ_API_KEY` tersedia.
2. CLE rule-based lokal sebagai fallback jika key kosong, API gagal, atau koneksi tidak tersedia.

Session login demo disimpan di browser agar refresh halaman tidak langsung mengeluarkan pengguna. Untuk produksi, endpoint login dapat diganti dengan database/auth provider tanpa mengubah struktur UI.

**Endpoint:** `POST /api/tutor`

| Field request | Tipe | Keterangan |
|---|---|---|
| `message` | string | Pesan siswa/orang tua |
| `mode` | string (opsional) | `exploration` (default), `troubleshooting`, `reflection`, `evaluation` |
| `circuitState` | object (opsional) | Data sensor: `circuit_closed`, `polarity_correct`, `switch_state` (juga menerima `isLampReversed` / `isSwitchOpen`) |
| `history` | `{role: "ai"\|"user", text}[]` (opsional) | Riwayat percakapan (6 terakhir dipakai) |

**Respons:** `{ text, note, mode, engine }`

**Arsitektur dual-engine:**
1. Jika `GROQ_API_KEY` diset → memakai Groq LLaMA 3.3 70B dengan prinsip *Explain-Before-Answer* dan kosakata taktil.
2. Jika key kosong, atau Groq gagal/timeout → otomatis beralih ke **mesin CLE offline** (rule-based), sehingga aplikasi tetap berfungsi dan demo juri tidak pernah gagal.

### Environment
```bash
cp .env.example .env.local   # isi GROQ_API_KEY (opsional)
```

### Cek backend
Setelah `npm run dev`, buka:
- `http://localhost:3000/api/health`
- `http://localhost:3000/api/tutor`

### LENTERA Lab / hardware
Deteksi ArUco dan stream ESP32-CAM tetap menggunakan relay lokal karena koneksi hardware berada di jaringan/perangkat fisik. UI akan menampilkan status **Tersambung/Terputus** dan tombol kalibrasi hanya mengirim command ketika WebSocket hardware tersedia.

Key gratis: https://console.groq.com/keys. Key hanya dipakai di server, tidak pernah dikirim ke browser.

### Deploy ke Netlify
`netlify.toml` sudah disertakan. Tambahkan `GROQ_API_KEY` di *Site settings → Environment variables* (opsional).
