import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [model, setModel] = useState("FashBot-GM-VRS-25F");

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  const notifications = useMemo(
    () => [
      {
        id: "xai",
        title: "Explainable AI aktif",
        description:
          "FashBot tetap memberikan transparansi bahkan saat halaman tidak ditemukan.",
        status: "info" as const,
      },
    ],
    [],
  );

  return (
    <AppShell
      model={model}
      onModelChange={setModel}
      onMoreActions={() => navigate("/")}
      onOpenPolicy={() => navigate("/")}
      onOpenTerms={() => navigate("/")}
      notifications={notifications}
    >
      <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="glass-panel max-w-xl space-y-4 px-8 py-10 shadow-crystal">
          <p className="text-sm tracking-[0.4em] text-primary">Kode: 404</p>
          <h1 className="font-display text-3xl text-foreground">
            Destinasi tidak ditemukan
          </h1>
          <p className="text-sm text-foreground/70">
            FashBot tidak mendeteksi halaman yang Anda cari. Kembali ke beranda
            untuk melanjutkan kolaborasi pembangunan solusi futuristik.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              className="rounded-full bg-gradient-to-r from-primary to-glow-blue px-8 text-primary-foreground shadow-crystal"
              onClick={() => navigate("/")}
            >
              Kembali ke Beranda
            </Button>
            <Button
              variant="ghost"
              className="rounded-full border border-white/40 bg-white/40 text-foreground shadow-soft dark:border-white/10 dark:bg-white/10"
              onClick={() => navigate(-1)}
            >
              Halaman Sebelumnya
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default NotFound;
