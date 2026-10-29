import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import type { Strings } from "@/i18n";
import type { Settings } from "@/settings";
import type { Car } from "@/data/cars";
import { policeCar } from "@/data/cars";
import { CheckIcon, CloseIcon, GlobeIcon, InfoIcon, MusicIcon, PoliceLightIcon, SpeakerIcon, VibrateIcon } from "@/icons";
import { GameButton, Modal, Segmented, Toggle } from "./ui";

/* ------------------------------------------------------------------ */
/* Options                                                             */
/* ------------------------------------------------------------------ */

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] border-[3px] border-ink bg-navy-950/60 px-[12px] py-[8px]">
      <div className="flex items-center gap-[10px]">
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-navy-700 text-mint-400">{icon}</span>
        <span className="font-body text-[15px] font-black text-white">{label}</span>
      </div>
      {children}
    </div>
  );
}

export function OptionsModal({
  t,
  settings,
  onChange,
  onClose,
  onSave,
}: {
  t: Strings;
  settings: Settings;
  onChange: (s: Settings) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => onChange({ ...settings, [k]: v });
  return (
    <Modal title={t.options} onClose={onClose}>
      <div className="space-y-[8px]">
        <Row icon={<SpeakerIcon width={22} height={22} muted={!settings.sound} />} label={t.sound}>
          <Toggle on={settings.sound} onChange={(v) => set("sound", v)} />
        </Row>
        <Row icon={<MusicIcon width={22} height={22} />} label={t.music}>
          <Toggle on={settings.music} onChange={(v) => set("music", v)} />
        </Row>
        <Row icon={<VibrateIcon width={22} height={22} />} label={t.vibration}>
          <Toggle on={settings.vibration} onChange={(v) => set("vibration", v)} />
        </Row>
        <Row icon={<GlobeIcon width={22} height={22} />} label={t.language}>
          <Segmented
            value={settings.lang}
            options={[
              { value: "en", label: "EN" },
              { value: "fa", label: "فارسی" },
            ]}
            onChange={(v) => set("lang", v)}
          />
        </Row>
        <Row icon={<PoliceLightIcon width={22} height={22} />} label={t.graphics}>
          <Segmented
            value={settings.graphics}
            options={[
              { value: "low", label: t.low },
              { value: "med", label: t.med },
              { value: "high", label: t.high },
            ]}
            onChange={(v) => set("graphics", v)}
          />
        </Row>
        <Row icon={<InfoIcon width={22} height={22} />} label={t.server}>
          <Segmented
            value={settings.server}
            options={[
              { value: "ASIA", label: "ASIA" },
              { value: "EU", label: "EU" },
              { value: "NA", label: "NA" },
            ]}
            onChange={(v) => set("server", v)}
          />
        </Row>
      </div>
      <div className="mt-[18px] flex justify-center">
        <GameButton variant="green" className="h-[60px] w-[200px]" onClick={onSave}>
          <span className="flex items-center gap-2 font-display text-[22px] text-white t-stroke sw-4">
            <CheckIcon width={24} height={24} className="text-white drop-shadow" />
            {t.save}
          </span>
        </GameButton>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Exit dialog                                                         */
/* ------------------------------------------------------------------ */

export function ExitDialog({ t, onYes, onNo }: { t: Strings; onYes: () => void; onNo: () => void }) {
  return (
    <Modal title={t.exitTitle} onClose={onNo} width={380}>
      <p className="mb-[18px] text-center font-body text-[16px] font-extrabold text-white/85">{t.exitBody}</p>
      <div className="flex justify-center gap-[14px]">
        <GameButton variant="red" className="h-[58px] w-[130px]" onClick={onYes}>
          <span className="font-display text-[22px] text-white t-stroke sw-4">{t.yes}</span>
        </GameButton>
        <GameButton variant="green" className="h-[58px] w-[130px]" onClick={onNo}>
          <span className="font-display text-[22px] text-white t-stroke sw-4">{t.no}</span>
        </GameButton>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Loading overlay — the police car chases your car                    */
/* ------------------------------------------------------------------ */

export function LoadingOverlay({ t, car, onDone }: { t: Strings; car: Car; onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const [tip] = useState(() => t.tips[Math.floor(Math.random() * t.tips.length)]);

  useEffect(() => {
    let p = 0;
    let finished = false;
    const id = window.setInterval(() => {
      p = Math.min(100, p + 1 + Math.random() * 3);
      setPct(p);
      if (p >= 100 && !finished) {
        finished = true;
        window.clearInterval(id);
        window.setTimeout(onDone, 450);
      }
    }, 55);
    return () => window.clearInterval(id);
  }, [onDone]);

  const stage = pct < 35 ? t.connecting : pct < 70 ? t.authenticating : pct < 95 ? t.loadingAssets : t.entering;

  return (
    <div className="absolute inset-0 z-50 flex animate-fade-in flex-col items-center justify-center bg-navy-950/85 backdrop-blur-[3px]">
      {/* chase scene */}
      <div className="relative mb-[6px] h-[230px] w-[430px]">
        <div className="absolute left-1/2 top-1/2 h-[190px] w-[190px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[6px] border-dashed border-skyg-400/40 animate-spin-slow" />
        <img
          src={policeCar.image}
          alt=""
          className="absolute bottom-[16px] left-0 w-[190px] animate-[slide-up_0.5s_ease-out] opacity-95 drop-shadow-[0_8px_10px_rgba(0,0,0,0.4)]"
        />
        <img
          src={car.image}
          alt=""
          className="absolute bottom-[30px] right-0 w-[220px] animate-bob drop-shadow-[0_10px_12px_rgba(0,0,0,0.45)]"
        />
        <span className="absolute right-[30px] top-[6px] font-display text-[26px] text-[#ff4f1f] t-stroke sw-5">SIREN!</span>
      </div>

      <div className="font-display text-[26px] text-white t-stroke sw-4">{stage}</div>
      <div className="mt-[12px] h-[26px] w-[360px] overflow-hidden rounded-full border-[3px] border-ink bg-navy-950 shadow-[inset_0_3px_0_rgba(0,0,0,0.5)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-lime-500 to-mint-400 shadow-[inset_0_3px_0_rgba(255,255,255,0.35)] transition-[width] duration-100"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-[6px] font-display text-[18px] text-mint-400 t-stroke sw-3">{Math.round(pct)}%</div>
      <div className="mt-[18px] max-w-[400px] rounded-[14px] border-[3px] border-ink bg-navy-900/80 px-[16px] py-[10px] text-center font-body text-[13px] font-bold text-white/80">
        <span className="me-2 rounded-full bg-amber-400 px-[8px] py-[1px] font-display text-[12px] text-ink">{t.tipTitle}</span>
        {tip}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toast                                                               */
/* ------------------------------------------------------------------ */

export type ToastType = "info" | "success" | "error";
export interface ToastData {
  id: number;
  message: string;
  type: ToastType;
}

export function Toast({ toast, className }: { toast: ToastData | null; className?: string }) {
  if (!toast) return null;
  const Icon = toast.type === "success" ? CheckIcon : toast.type === "error" ? CloseIcon : InfoIcon;
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-[20px] bottom-[112px] z-[60] flex justify-center",
        className,
      )}
    >
      <div
        key={toast.id}
        role="status"
        className="flex max-w-[480px] animate-toast-in items-center gap-[10px] rounded-full border-[3px] border-ink bg-navy-900/95 py-[8px] pe-[18px] ps-[8px] font-body text-[14px] font-extrabold text-white shadow-[0_6px_0_#060a28,0_12px_24px_rgba(0,0,0,0.4)]"
      >
        <span
          className={cn(
            "flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full text-ink",
            toast.type === "success" && "bg-mint-400",
            toast.type === "error" && "bg-[#ff4f1f] text-white",
            toast.type === "info" && "bg-amber-400",
          )}
        >
          <Icon width={16} height={16} />
        </span>
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
