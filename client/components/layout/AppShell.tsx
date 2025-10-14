import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { BadgeCheck, Info, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GradientLines } from "../visuals/GradientLines";
import { CrystalBackground } from "../visuals/CrystalBackground";
import { FASHBOT_LOGO_URL } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FashBotNotification {
  id: string;
  title: string;
  description: string;
  status?: "info" | "success" | "alert";
}

interface AppShellProps {
  children: ReactNode;
  model: string;
  onModelChange: (next: string) => void;
  onMoreActions: () => void;
  onOpenPolicy: () => void;
  onOpenTerms: () => void;
  notifications: FashBotNotification[];
}

export function AppShell({
  children,
  model,
  onModelChange,
  onMoreActions,
  onOpenPolicy,
  onOpenTerms,
  notifications,
}: AppShellProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <CrystalBackground />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col">
        <GradientLines />
        <header className="px-4 pb-4 pt-6 sm:px-8 lg:px-14">
          <div className="glass-panel glow-border flex flex-col gap-4 rounded-3xl px-6 py-5 shadow-crystal backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
              <div className="flex items-center gap-3">
                <motion.div
                  className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-halo"
                  animate={{ rotate: [0, 6, -4, 0], scale: [1, 1.04, 0.98, 1] }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <img
                    src={FASHBOT_LOGO_URL}
                    alt="FashBot logo"
                    className="h-full w-full object-cover"
                  />
                </motion.div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-xl tracking-wide text-foreground sm:text-2xl">
                      FashBot
                    </p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="group h-8 w-8 rounded-full border border-white/30 bg-white/70 text-foreground/70 shadow-soft transition hover:-translate-y-0.5 hover:border-white/50 hover:bg-primary/20 hover:text-foreground dark:border-white/10 dark:bg-white/10"
                          aria-label="About FashBot"
                        >
                          <Info className="h-4 w-4 transition group-hover:scale-105" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg space-y-5 rounded-3xl border border-white/30 bg-white/85 p-8 text-left shadow-soft backdrop-blur-3xl dark:border-white/10 dark:bg-slate-900/85">
                        <div className="flex flex-col items-center gap-4 text-center">
                          <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-halo">
                            <img
                              src={FASHBOT_LOGO_URL}
                              alt="FashBot logo"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <DialogHeader className="items-center space-y-2 text-center sm:text-center">
                            <DialogTitle className="font-display text-2xl text-foreground text-center">
                              About FashBot
                            </DialogTitle>
                          </DialogHeader>
                        </div>
                        <div className="grid gap-3 text-sm text-foreground/80">
                          <div className="flex items-center justify-between rounded-2xl border border-white/40 bg-white/60 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                            <span className="font-medium text-foreground/70">
                              Mulai dikembangkan
                            </span>
                            <span className="font-semibold text-foreground">
                              5 Oktober 2025
                            </span>
                          </div>
                          <div className="flex items-center justify-between rounded-2xl border border-white/40 bg-white/60 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                            <span className="font-medium text-foreground/70">
                              Versi terkini
                            </span>
                            <span className="font-semibold text-foreground">
                              1.0.2
                            </span>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <p className="text-sm text-foreground/70">
                    Gemini-powered versatile developer intelligence · 2025
                    Release
                  </p>
                </div>
                <div className="hidden sm:block">
                  <ThemeToggle />
                </div>
              </div>
              <ModelSwitcher model={model} onModelChange={onModelChange} />
            </div>
            <div className="flex items-center gap-3">
              <div className="sm:hidden">
                <ThemeToggle />
              </div>
              <Button
                className="group relative overflow-hidden rounded-full border border-white/20 bg-gradient-to-br from-primary/80 via-primary/60 to-glow-blue/60 px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-crystal transition duration-500 ease-outglow hover:-translate-y-0.5 hover:shadow-halo"
                onClick={onMoreActions}
              >
                <span className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <span className="absolute inset-0 bg-white/15 blur-2xl" />
                </span>
                More Actions
              </Button>
            </div>
          </div>
          <NotificationPanel notifications={notifications} />
        </header>
        <main className="relative flex-1 px-4 pb-10 sm:px-8 lg:px-14">
          <div className="glass-panel relative flex h-full min-h-[calc(100vh-15rem)] flex-col overflow-hidden border border-white/20 p-0 shadow-soft">
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/20 to-white/10 dark:from-white/5 dark:via-white/5 dark:to-transparent" />
            <div className="relative flex-1 overflow-hidden rounded-3xl">
              {children}
            </div>
          </div>
        </main>
        <footer className="px-4 pb-6 sm:px-8 lg:px-14">
          <div className="glass-panel flex flex-col items-center justify-between gap-3 rounded-3xl px-6 py-4 text-sm text-foreground/80 shadow-soft backdrop-blur-2xl sm:flex-row">
            <p className="text-center text-xs text-foreground/60 sm:text-left">
              © {currentYear} FashBot. Semua hak cipta dilindungi.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="outline"
                className="rounded-full border-white/30 bg-white/60 px-4 py-2 text-xs font-semibold text-foreground/80 shadow-soft transition hover:-translate-y-0.5 hover:bg-primary/20 hover:text-foreground"
                onClick={onOpenPolicy}
              >
                privacy policy
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-white/30 bg-white/60 px-4 py-2 text-xs font-semibold text-foreground/80 shadow-soft transition hover:-translate-y-0.5 hover:bg-primary/20 hover:text-foreground"
                onClick={onOpenTerms}
              >
                Terms & Conditions
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ModelSwitcher({
  model,
  onModelChange,
}: {
  model: string;
  onModelChange: (next: string) => void;
}) {
  return (
    <div className="w-full max-w-xs">
      <Select value={model} onValueChange={onModelChange}>
        <SelectTrigger className="h-12 w-full rounded-2xl border border-white/40 bg-white/50 text-left text-sm text-foreground/90 shadow-soft transition dark:border-white/10 dark:bg-white/10">
          <SelectValue placeholder="Choose model" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl border border-white/30 bg-white/80 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/80">
          <SelectGroup>
            <SelectLabel className="text-xs uppercase tracking-[0.2em] text-foreground/60">
              Active Models
            </SelectLabel>
            <SelectItem
              value="FashBot-TM-VPS-25F-disabled"
              className="rounded-xl text-foreground/40 dark:text-foreground/50"
              onPointerDown={(e) => {
                e.preventDefault();
                toast("FashBot-TM-VPS-25F belum tersedia (coming soon)");
              }}
            >
              FashBot-TM-VPS-25F · T-shaped Model-powered versatile professional
              intelligence
            </SelectItem>

            <SelectItem
              value="FashBot-GM-VRS-25F"
              className="rounded-xl bg-white/40 text-foreground transition hover:bg-primary/20 dark:bg-white/10 dark:text-white"
            >
              FashBot-GM-VRS-25F · Gemini-based versatile intelligence
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

function NotificationPanel({
  notifications,
}: {
  notifications: FashBotNotification[];
}) {
  if (notifications.length === 0) {
    return null;
  }
  return (
    <ScrollArea className="mt-4 max-h-36 overflow-hidden">
      <div className="flex gap-4">
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn(
              "glass-panel relative flex w-full min-w-[260px] flex-1 items-start gap-3 rounded-2xl border border-white/30 px-5 py-4 text-sm shadow-soft",
              {
                "bg-primary/10": notif.status === "success",
                "bg-white/45": notif.status === "info",
                "bg-destructive/10": notif.status === "alert",
              },
            )}
          >
            <div className="mt-0.5 rounded-full bg-primary/15 p-2 text-primary">
              {notif.status === "success" ? (
                <BadgeCheck className="h-4 w-4" />
              ) : (
                <Workflow className="h-4 w-4" />
              )}
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground/90">{notif.title}</p>
              <p className="text-xs leading-relaxed text-foreground/70">
                {notif.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </ScrollArea>
  );
}
