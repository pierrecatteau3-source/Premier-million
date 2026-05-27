"use client";

import { useEffect, useState } from "react";
import { AchievementToast } from "./AchievementToast";
import type { AchievementDef } from "@/types";

const SESSION_KEY = "pm_achievements_checked";

export function AchievementChecker() {
  const [unlocked, setUnlocked] = useState<AchievementDef[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    fetch("/api/achievements", { method: "POST" })
      .then((res) => res.json())
      .then((json: { data?: { newlyUnlocked?: AchievementDef[] } }) => {
        const list = json.data?.newlyUnlocked ?? [];
        if (list.length > 0) {
          setUnlocked(list);
          setShow(true);
        }
      })
      .catch(() => {
        // Silencieux — le checker ne doit pas bloquer l'UI
      })
      .finally(() => {
        sessionStorage.setItem(SESSION_KEY, "1");
      });
  }, []);

  if (!show || unlocked.length === 0) return null;

  return (
    <AchievementToast achievements={unlocked} onDismiss={() => setShow(false)} />
  );
}
