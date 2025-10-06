import { useEffect, useState } from "react";
import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = theme === "system" ? resolvedTheme : theme;

  return (
    <Button
      size="icon"
      variant="ghost"
      className="relative h-11 w-11 rounded-full border border-white/40 bg-white/30 shadow-crystal transition duration-500 ease-outglow hover:-translate-y-0.5 hover:shadow-halo dark:border-white/10 dark:bg-white/10"
      onClick={() => setTheme(activeTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <span
        className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 dark:from-primary/40"
        aria-hidden
      />
      {mounted && activeTheme === "dark" ? (
        <SunMedium className="h-5 w-5 text-foreground" />
      ) : (
        <MoonStar className="h-5 w-5 text-foreground" />
      )}
    </Button>
  );
}
