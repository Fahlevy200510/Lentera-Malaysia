"use client";

export interface StudentProgress {
  modules: {
    component_recognition: boolean;
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

export const DEFAULT_PROGRESS: StudentProgress = {
  modules: {
    component_recognition: false,
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
  xp: 250,
  achievements: ["Percikan Terang", "Tanpa Petunjuk"],
};

const STORAGE_KEY = "lentera_student_progress";

export function getStudentProgress(): StudentProgress {
  if (typeof window === "undefined") {
    return DEFAULT_PROGRESS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      modules: { ...DEFAULT_PROGRESS.modules, ...(parsed.modules || {}) },
      skills: { ...DEFAULT_PROGRESS.skills, ...(parsed.skills || {}) },
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : DEFAULT_PROGRESS.achievements,
    };
  } catch (err) {
    console.error("Gagal membaca progress siswa:", err);
    return DEFAULT_PROGRESS;
  }
}

export function saveStudentProgress(progress: StudentProgress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent("lentera-progress-update", { detail: progress }));
  } catch (err) {
    console.error("Gagal menyimpan progress siswa:", err);
  }
}

export function completeModule(
  moduleKey: "component_recognition" | "series_circuit" | "parallel_circuit"
): StudentProgress {
  const current = getStudentProgress();
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

  saveStudentProgress(updated);
  return updated;
}
