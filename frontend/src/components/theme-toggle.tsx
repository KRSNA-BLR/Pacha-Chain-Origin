"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

/**
 * Dark / Light / System theme toggle button.
 * Cycles: light → dark → system → light…
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},  // subscribe: no-op (mount state doesn't change)
    () => true,       // getSnapshot: client is always mounted
    () => false       // getServerSnapshot: server is never mounted
  );

  if (!mounted) {
    // Prevent hydration mismatch — render placeholder
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Tema">
        <span className="text-base">🌙</span>
      </Button>
    );
  }

  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";

  const icons: Record<string, string> = {
    light: "☀️",
    dark: "🌙",
    system: "💻",
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={() => setTheme(next)}
      aria-label={`Cambiar a modo ${next}`}
      title={`Modo actual: ${theme} — click para ${next}`}
    >
      <span className="text-base">{icons[theme ?? "system"]}</span>
    </Button>
  );
}
