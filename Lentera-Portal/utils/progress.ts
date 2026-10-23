"use client";

export interface StudentProgress {
  modules: {
    component_recognition: boolean;
    component_quiz?: boolean;
    series_circuit: boolean;
    parallel_circuit: boolean;
  };
  skills: {
    battery: number;
    cable: number;
    switch: number;
    flow: number;
    series: number;
    parallel: number;
  };
  xp: number;
  achievements: string[];
}

export interface StudentProfile {
  id: string;
  name: string;
  grade: string;
  avatar: string;
}

export const DEFAULT_PROGRESS: StudentProgress = {
  modules: {
    component_recognition: false,
    component_quiz: false,
    series_circuit: false,
    parallel_circuit: false,
  },
  skills: {
    battery: 1,
    cable: 1,
    switch: 1,
    flow: 1,
    series: 1,
    parallel: 0,
  },
  xp: 150,
  achievements: ["Percikan Terang"],
};

export const PRESET_STUDENTS: StudentProfile[] = [
  { id: "ahmad", name: "Ahmad Fadhil", grade: "Kelas 8B", avatar: "👦" },
  { id: "siti", name: "Siti Rahma", grade: "Kelas 8B", avatar: "👧" },
  { id: "dimas", name: "Dimas Putra", grade: "Kelas 8B", avatar: "🧑" },
  { id: "guest", name: "Tamu / Juri Eksplorasi", grade: "Pengamat", avatar: "👤" },
];

const PRESET_INITIAL_PROGRESS: Record<string, StudentProgress> = {
  ahmad: {
    modules: { component_recognition: true, series_circuit: true, parallel_circuit: false },
    skills: { battery: 5, cable: 5, switch: 4, flow: 4, series: 5, parallel: 1 },
    xp: 750,
    achievements: ["Cahaya Pertama", "Ahli Seri", "Percikan Terang"],
  },
  siti: {
    modules: { component_recognition: false, series_circuit: false, parallel_circuit: false },
    skills: { battery: 2, cable: 1, switch: 1, flow: 1, series: 1, parallel: 0 },
    xp: 150,
    achievements: ["Percikan Terang"],
  },
  dimas: {
    modules: { component_recognition: true, series_circuit: false, parallel_circuit: false },
    skills: { battery: 5, cable: 4, switch: 4, flow: 2, series: 2, parallel: 0 },
    xp: 450,
    achievements: ["Cahaya Pertama", "Percikan Terang"],
  },
  guest: {
    modules: { component_recognition: false, series_circuit: false, parallel_circuit: false },
    skills: { battery: 1, cable: 1, switch: 1, flow: 1, series: 0, parallel: 0 },
    xp: 50,
    achievements: [],
  },
};

const STUDENTS_LIST_KEY = "lentera_student_profiles";
const ACTIVE_STUDENT_KEY = "lentera_active_student";

export function getStudentProfiles(): StudentProfile[] {
  if (typeof window === "undefined") return PRESET_STUDENTS;
  try {
    const raw = localStorage.getItem(STUDENTS_LIST_KEY);
    if (!raw) {
      localStorage.setItem(STUDENTS_LIST_KEY, JSON.stringify(PRESET_STUDENTS));
      return PRESET_STUDENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : PRESET_STUDENTS;
  } catch {
    return PRESET_STUDENTS;
  }
}

export function getActiveStudent(): StudentProfile {
  if (typeof window === "undefined") return PRESET_STUDENTS[0];
  try {
    const raw = localStorage.getItem(ACTIVE_STUDENT_KEY);
    if (!raw) {
      localStorage.setItem(ACTIVE_STUDENT_KEY, JSON.stringify(PRESET_STUDENTS[0]));
      return PRESET_STUDENTS[0];
    }
    const parsed = JSON.parse(raw);
    return parsed?.id ? parsed : PRESET_STUDENTS[0];
  } catch {
    return PRESET_STUDENTS[0];
  }
}

export function setActiveStudent(student: StudentProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_STUDENT_KEY, JSON.stringify(student));
    // Simpan juga ke session auth untuk konsistensi login
    const currentSession = localStorage.getItem("lentera-session");
    let sessionObj: any = { role: "student" };
    try {
      if (currentSession) sessionObj = JSON.parse(currentSession);
    } catch {}
    sessionObj.name = student.name;
    sessionObj.grade = student.grade;
    localStorage.setItem("lentera-session", JSON.stringify(sessionObj));

    window.dispatchEvent(new CustomEvent("lentera-active-student-update", { detail: student }));
    window.dispatchEvent(new CustomEvent("lentera-auth-update", { detail: sessionObj }));
    window.dispatchEvent(new CustomEvent("lentera-progress-update", { detail: getStudentProgress(student.id) }));
    window.dispatchEvent(new Event("storage"));
  } catch (err) {
    console.error("Gagal mengganti siswa aktif:", err);
  }
}

export function addStudentProfile(name: string, grade: string = "Kelas 8B"): StudentProfile {
  const cleanName = name.trim();
  const id = `student_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now().toString().slice(-4)}`;
  const newProfile: StudentProfile = {
    id,
    name: cleanName,
    grade,
    avatar: "👤",
  };

  if (typeof window !== "undefined") {
    const profiles = getStudentProfiles();
    const updated = [...profiles, newProfile];
    localStorage.setItem(STUDENTS_LIST_KEY, JSON.stringify(updated));
    setActiveStudent(newProfile);
  }

  return newProfile;
}

export function getStudentProgress(studentId?: string): StudentProgress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;

  const targetId = studentId || getActiveStudent().id;
  const storageKey = `lentera_progress_${targetId}`;

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      // Inisialisasi dari preset awal jika ada
      const initial = PRESET_INITIAL_PROGRESS[targetId] || DEFAULT_PROGRESS;
      localStorage.setItem(storageKey, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      modules: { ...DEFAULT_PROGRESS.modules, ...(parsed.modules || {}) },
      skills: { ...DEFAULT_PROGRESS.skills, ...(parsed.skills || {}) },
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : DEFAULT_PROGRESS.achievements,
    };
  } catch (err) {
    console.error(`Gagal membaca progress siswa (${targetId}):`, err);
    return DEFAULT_PROGRESS;
  }
}

export function saveStudentProgress(progress: StudentProgress, studentId?: string): void {
  if (typeof window === "undefined") return;
  const targetId = studentId || getActiveStudent().id;
  const storageKey = `lentera_progress_${targetId}`;

  try {
    localStorage.setItem(storageKey, JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent("lentera-progress-update", { detail: progress }));
  } catch (err) {
    console.error(`Gagal menyimpan progress siswa (${targetId}):`, err);
  }
}

export function resetStudentProgress(studentId?: string): StudentProgress {
  const targetId = studentId || getActiveStudent().id;
  const freshProgress: StudentProgress = {
    modules: { component_recognition: false, series_circuit: false, parallel_circuit: false },
    skills: { battery: 1, cable: 1, switch: 1, flow: 1, series: 0, parallel: 0 },
    xp: 50,
    achievements: [],
  };
  saveStudentProgress(freshProgress, targetId);
  return freshProgress;
}

export function completeModule(
  moduleKey: "component_recognition" | "component_quiz" | "series_circuit" | "parallel_circuit",
  studentId?: string
): StudentProgress {
  const current = getStudentProgress(studentId);
  const updated: StudentProgress = {
    ...current,
    modules: {
      ...current.modules,
      [moduleKey]: true,
    },
    skills: { ...current.skills },
    achievements: [...current.achievements],
  };

  if (moduleKey === "component_recognition") {
    // Pengenalan komponen tuntas: Kuasai baterai, kabel, saklar
    updated.skills.battery = 5;
    updated.skills.cable = 5;
    updated.skills.switch = 4;
    updated.skills.series = Math.max(updated.skills.series, 2);
    if (!updated.achievements.includes("Cahaya Pertama")) {
      updated.achievements.push("Cahaya Pertama");
    }
    updated.xp = Math.max(updated.xp, 500);
  } else if (moduleKey === "component_quiz") {
    // Kuis taktil tuntas: Detektif Taktil
    updated.skills.battery = 5;
    updated.skills.cable = 5;
    updated.skills.switch = 5;
    if (!updated.achievements.includes("Detektif Taktil")) {
      updated.achievements.push("Detektif Taktil");
    }
    updated.xp = Math.max(updated.xp, 650);
  } else if (moduleKey === "series_circuit") {
    // Rangkaian seri tuntas
    updated.skills.series = 5;
    updated.skills.flow = 4;
    updated.skills.parallel = Math.max(updated.skills.parallel, 1);
    if (!updated.achievements.includes("Ahli Seri")) {
      updated.achievements.push("Ahli Seri");
    }
    updated.xp = Math.max(updated.xp, 750);
  } else if (moduleKey === "parallel_circuit") {
    // Rangkaian paralel tuntas: Master Rangkaian
    updated.skills.parallel = 5;
    updated.skills.flow = 5;
    if (!updated.achievements.includes("Penjelajah Tegangan")) {
      updated.achievements.push("Penjelajah Tegangan");
    }
    if (!updated.achievements.includes("Master Rangkaian")) {
      updated.achievements.push("Master Rangkaian");
    }
    updated.xp = 1000;
  }

  saveStudentProgress(updated, studentId);
  return updated;
}
