import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function Svg({ children, ...p }: P) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      {children}
    </svg>
  );
}

function Stroke({ children, ...p }: P) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...p}
    >
      {children}
    </svg>
  );
}

export const LockIcon = (p: P) => (
  <Svg {...p}>
    <path
      d="M8.2 10V7.6a3.8 3.8 0 0 1 7.6 0V10"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.8}
      strokeLinecap="round"
    />
    <rect x="4" y="10" width="16" height="11.5" rx="3" />
    <circle cx="12" cy="15" r="1.7" fill="#0f1535" />
    <path d="M12 16v2.6" stroke="#0f1535" strokeWidth={2.2} strokeLinecap="round" />
  </Svg>
);

export const PlusIcon = (p: P) => (
  <Stroke strokeWidth={4.6} {...p}>
    <path d="M12 4.5v15M4.5 12h15" />
  </Stroke>
);

export const BoltIcon = (p: P) => (
  <Svg {...p}>
    <path d="M13.5 2 4 14h7l-1.5 8L20 10h-7z" />
  </Svg>
);

export const HeartIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 21s-7.6-4.7-9.6-9.2A5.3 5.3 0 0 1 12 6.1a5.3 5.3 0 0 1 9.6 5.7C19.6 16.3 12 21 12 21z" />
  </Svg>
);

export const SwordIcon = (p: P) => (
  <Svg {...p}>
    <path d="M19.5 2.5 22 5l-9.8 11.3-2.1-2.1L19.5 2.5zM8.7 13.4l1.9 1.9-3.3 3.3-1.9-1.9 3.3-3.3zM2.5 21.5l2.4-2.4 1.1 1.1-2.4 2.4-1.1-1.1z" />
    <path d="M4.2 15.8l4 4" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" />
  </Svg>
);

export const ShieldIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 2 20 5v6.2c0 5-3.4 8.6-8 10.8-4.6-2.2-8-5.8-8-10.8V5z" />
    <path d="m8.5 12 2.4 2.4L15.8 9.5" fill="none" stroke="#0f1535" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const InfoIcon = (p: P) => (
  <Stroke strokeWidth={3.2} {...p}>
    <path d="M12 10.5V17M12 7.2v.1" />
  </Stroke>
);

export const StarIcon = (p: P) => (
  <Svg {...p}>
    <path d="m12 2 2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2l-6.1 3.4 1.4-6.8L2.2 9.1l6.9-.8z" />
  </Svg>
);

export const UndoIcon = (p: P) => (
  <Stroke strokeWidth={3.2} {...p}>
    <path d="M9.5 14 4.5 9l5-5" />
    <path d="M4.5 9H14a5.5 5.5 0 1 1 0 11h-3.5" />
  </Stroke>
);

export const GearIcon = (p: P) => {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const r = i % 2 === 0 ? 10.5 : 7.8;
    const a = (i * Math.PI) / 8 - Math.PI / 16;
    pts.push(`${(12 + r * Math.cos(a)).toFixed(2)},${(12 + r * Math.sin(a)).toFixed(2)}`);
  }
  return (
    <Svg {...p}>
      <polygon points={pts.join(" ")} />
      <circle cx="12" cy="12" r="3.3" fill="#0f1535" />
    </Svg>
  );
};

export const SpeakerIcon = ({ muted, ...p }: P & { muted?: boolean }) => (
  <Svg {...p}>
    <path d="M3 9v6h3.8L12 19V5L6.8 9z" />
    {muted ? (
      <path d="m15.5 9.5 5 5m0-5-5 5" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" />
    ) : (
      <path
        d="M15 9.5a3.5 3.5 0 0 1 0 5M17.5 7a7 7 0 0 1 0 10"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    )}
  </Svg>
);

export const MusicIcon = (p: P) => (
  <Svg {...p}>
    <path d="M9.5 18.5V6.2l10-2.4v12.4" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="6.5" cy="18.5" r="3" />
    <circle cx="16.5" cy="16.2" r="3" />
  </Svg>
);

export const GlobeIcon = (p: P) => (
  <Stroke strokeWidth={2.2} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" />
  </Stroke>
);

export const VibrateIcon = (p: P) => (
  <Stroke strokeWidth={2.4} {...p}>
    <rect x="8" y="3" width="8" height="18" rx="2" />
    <path d="M4.5 8v8M19.5 8v8M2 10v4M22 10v4" />
  </Stroke>
);

export const EyeIcon = ({ off, ...p }: P & { off?: boolean }) => (
  <Stroke strokeWidth={2.4} {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 20 20 4" />}
  </Stroke>
);

export const UserIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4.5" />
    <path d="M3.5 21c0-4.4 3.8-7.2 8.5-7.2s8.5 2.8 8.5 7.2z" />
  </Svg>
);

export const MailIcon = (p: P) => (
  <Stroke strokeWidth={2.4} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m3.5 7 8.5 6.5L20.5 7" />
  </Stroke>
);

export const CheckIcon = (p: P) => (
  <Stroke strokeWidth={4} {...p}>
    <path d="m4.5 12.5 4.8 4.8L19.5 7" />
  </Stroke>
);

export const CloseIcon = (p: P) => (
  <Stroke strokeWidth={3.6} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Stroke>
);

export const PlayIcon = (p: P) => (
  <Svg {...p}>
    <path d="M7 4.5v15c0 .9 1 1.4 1.7.9l11-7.5a1.1 1.1 0 0 0 0-1.8l-11-7.5C8 3.1 7 3.6 7 4.5z" />
  </Svg>
);

export const PistolIcon = (p: P) => (
  <Svg {...p}>
    <path d="M1.5 4.5h3.5v2.5H1.5z" />
    <path d="M2.5 6h18.5a1.5 1.5 0 0 1 1.5 1.5v2.2a1.5 1.5 0 0 1-1.5 1.5H10.4l-2.2 9.3H2l2.1-9.3H2.5z" />
    <path
      d="M10.8 11.2v2.6a1.6 1.6 0 0 0 1.6 1.6h1.6a1.6 1.6 0 0 0 1.6-1.6v-2.6"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
    />
    <path d="M12.6 11.2v2.2" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
  </Svg>
);

export const CrosshairIcon = (p: P) => (
  <Stroke strokeWidth={2.4} {...p}>
    <circle cx="12" cy="12" r="7" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" />
  </Stroke>
);

export const ShotgunIcon = (p: P) => (
  <Svg {...p}>
    <path d="M1 8h22v3.6H12.5l-.8 2.6H8.5l.6-2.6H7.3l-1.6 7.2H2.2l1.6-7.2H1z" />
  </Svg>
);

export const MegaphoneIcon = (p: P) => (
  <Svg {...p}>
    <path d="M3 10v4a1.5 1.5 0 0 0 1.5 1.5H6l3.5 4.5H12v-5l8 3V5l-8 3H4.5A1.5 1.5 0 0 0 3 9.5z" />
  </Svg>
);

export const ArrowRightIcon = (p: P) => (
  <Stroke strokeWidth={3} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Stroke>
);

export const FullscreenIcon = ({ exit, ...p }: P & { exit?: boolean }) => (
  <Stroke strokeWidth={2.8} {...p}>
    {exit ? (
      <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
    ) : (
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    )}
  </Stroke>
);

/* ---------------- car / garage icons ---------------- */

export const CoinIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.5" fill="#ffcf3a" stroke="#8a4a00" strokeWidth="2" />
    <circle cx="12" cy="12" r="6" fill="none" stroke="#c98a10" strokeWidth="1.6" />
    <path
      d="M12 7.2v9.6M9.4 9.6h4.2a1.9 1.9 0 0 1 0 3.8H9.4h4.4a1.9 1.9 0 0 1 0 3.8"
      fill="none"
      stroke="#8a4a00"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </Svg>
);

export const GaugeIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.2a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 2.2a6.8 6.8 0 1 1-6.8 6.8A6.8 6.8 0 0 1 12 5.4z" opacity=".25" />
    <path d="M12 4.4a7.6 7.6 0 0 1 7.6 7.6h-2.2A5.4 5.4 0 0 0 12 6.6z" />
    <path d="M11 12.6 16.4 7l1.5 1.5-6.2 5.2z" fill="#ff4f1f" />
    <circle cx="12" cy="12.6" r="1.7" fill="#0f1535" />
  </Svg>
);

export const EngineIcon = (p: P) => (
  <Svg {...p}>
    <path d="M6 8h2V6.5h4V8h2.4l2.6 2.4V15h-2.2v2.4H8.2V15H6z" />
    <path d="M8.2 15h7.6v2.4H8.2z" opacity=".7" />
    <path d="M3 10.2h3M18 10.2h3" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M11 17.4v2.4M13 17.4v2.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

export const BumperIcon = (p: P) => (
  <Svg {...p}>
    <path d="M3.4 7.6h17.2a1.6 1.6 0 0 1 1.6 1.6v5.6a1.6 1.6 0 0 1-1.6 1.6H3.4A1.6 1.6 0 0 1 1.8 14.8V9.2a1.6 1.6 0 0 1 1.6-1.6z" />
    <path d="M6.4 10.2h11.2" stroke="#0f1535" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M6.4 13.2h11.2" stroke="#0f1535" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

export const TireIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4.4" fill="#0f1535" />
    <path
      d="M12 3v4.2M12 16.8V21M3 12h4.2M16.8 12H21M5.6 5.6l3 3M15.4 15.4l3 3M18.4 5.6l-3 3M8.6 15.4l-3 3"
      stroke="#0f1535"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </Svg>
);

export const NitroIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 1.6c3.4 3 5.2 6 5.2 8.8a5.2 5.2 0 0 1-10.4 0C6.8 7.6 8.6 4.6 12 1.6z" />
    <path d="M12 8.4c1.6 1.6 2.4 2.9 2.4 4.1a2.4 2.4 0 0 1-4.8 0c0-1.2.8-2.5 2.4-4.1z" fill="#ffe45a" />
    <path d="M4.6 18.6h14.8l-1.6 3H6.2z" opacity=".8" />
  </Svg>
);

export const PowerIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12.9 2 4 14h6.2l-1.1 8L20 9.6h-6.4z" />
  </Svg>
);

export const CarIcon = (p: P) => (
  <Svg {...p}>
    <path d="M1.6 13.4v-2.2l2.2-4.4A2.6 2.6 0 0 1 6.1 5.4h11.8a2.6 2.6 0 0 1 2.3 1.4l2.2 4.4v2.2a1.4 1.4 0 0 1-1.4 1.4h-1.2a2.6 2.6 0 0 0-5.2 0H9.4a2.6 2.6 0 0 0-5.2 0H3a1.4 1.4 0 0 1-1.4-1.4z" />
    <path d="M5.4 9.4h13.2" stroke="#0f1535" strokeWidth="1.5" />
    <circle cx="6.8" cy="14.8" r="1.5" fill="#0f1535" />
    <circle cx="17.2" cy="14.8" r="1.5" fill="#0f1535" />
  </Svg>
);

export const PoliceLightIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 4.6h16l-1.6 4.2H5.6z" />
    <path d="M6.6 8.8h10.8l-1 4.4H7.6z" opacity=".75" />
    <path d="M2.4 13.2h19.2l-1.4 6H3.8z" opacity=".55" />
    <path d="M6 16.2h3M15 16.2h3" stroke="#0f1535" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

export const ClipboardIcon = (p: P) => (
  <Stroke strokeWidth={2.3} {...p}>
    <path d="M9 4.5H7a2 2 0 0 0-2 2V20a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6.5a2 2 0 0 0-2-2h-2" />
    <rect x="8.5" y="2.5" width="7" height="4" rx="1.4" fill="currentColor" />
    <path d="m8.5 12 1.8 1.8 3.4-3.4M8.5 17.5h7" />
  </Stroke>
);

export const GiftIcon = (p: P) => (
  <Svg {...p}>
    <path d="M2.5 8.5h19v3.2h-19zM4 12.6h16v7.4a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 20z" />
    <path d="M11 8.5h2v13h-2z" fill="#0f1535" opacity=".3" />
    <path d="M12 8.5C11 5.5 9.6 3 7.2 3a2.7 2.7 0 0 0 0 5.5zM12 8.5C13 5.5 14.4 3 16.8 3a2.7 2.7 0 0 1 0 5.5z" />
  </Svg>
);

export const CartIcon = (p: P) => (
  <Svg {...p}>
    <path
      d="M2 3.5h3l2.2 10.2a1.6 1.6 0 0 0 1.6 1.3h9a1.6 1.6 0 0 0 1.5-1.1L21.6 7H6.1"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="9.5" cy="19.5" r="1.9" />
    <circle cx="17" cy="19.5" r="1.9" />
  </Svg>
);

export const FlagIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 2.5a1.2 1.2 0 0 1 1.2 1.2V21.5H2.8V3.7A1.2 1.2 0 0 1 4 2.5z" />
    <path d="M6.2 4h14.3l-3.1 4.6 3.1 4.6H6.2z" />
    <path d="M9 4h3v3H9zM12 7h3v3h-3zM15 4h3v3h-3zM9 10.2h3v3H9z" fill="#0f1535" opacity=".55" />
  </Svg>
);

export const SkullIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 2.5a8 8 0 0 0-8 8c0 2.6 1.3 4.9 3.2 6.3V20a1.5 1.5 0 0 0 1.5 1.5h6.6A1.5 1.5 0 0 0 16.8 20v-3.2A8 8 0 0 0 12 2.5z" />
    <circle cx="9" cy="11" r="2.1" fill="#0f1535" />
    <circle cx="15" cy="11" r="2.1" fill="#0f1535" />
    <path d="M10.6 15.2h2.8l-1.4 2.4z" fill="#0f1535" />
    <path d="M9.6 19.2v2.3M12 19.2v2.3M14.4 19.2v2.3" stroke="#0f1535" strokeWidth="1.3" />
  </Svg>
);

export const StarBurstIcon = (p: P) => (
  <Svg {...p}>
    <path d="m12 1.8 2.2 4.6 5-.8-3.5 3.7 1.3 4.9-4.6-2.2-4 3 .7-5-4.4-2.5 5-.6z" />
    <path d="m14.8 13.4 1.4 3 3.2-.5-2.2 2.4.8 3.1-2.9-1.4-2.6 1.9.5-3.2-2.8-1.6 3.2-.4z" opacity=".7" />
  </Svg>
);

export const TimerIcon = (p: P) => (
  <Svg {...p}>
    <path d="M9.5 1.8h5v2.2h-5z" />
    <path d="M12 4.6a8.4 8.4 0 1 0 8.4 8.4A8.4 8.4 0 0 0 12 4.6zm0 2.2a6.2 6.2 0 1 1-6.2 6.2A6.2 6.2 0 0 1 12 6.8z" />
    <path d="M11 8.2h2V13l3 1.8-1 1.7-4-2.4z" />
    <path d="m18.2 4.4 1.6 1.6-1.6 1.6-1.6-1.6z" />
  </Svg>
);

export const DriftIcon = (p: P) => (
  <Stroke strokeWidth={2.6} {...p}>
    <path d="M3 18c4-1 5-8 9-8s4 5 8 5" />
    <path d="M3 13.5c3.5-.5 4.5-5 8-5" opacity=".5" />
    <path d="M16.5 12.5 20 15l-3.5 2.6" />
  </Stroke>
);

export const TrophyIcon = (p: P) => (
  <Svg {...p}>
    <path d="M7 3h10v2h3v3c0 2.6-2 4.7-4.6 5-.7 1.4-2 2.4-3.4 2.8V18h3v2.5H9V18h3v-2.2c-1.4-.4-2.7-1.4-3.4-2.8C6 12.7 4 10.6 4 8V5h3zm0 4H6v1c0 1.2.8 2.3 2 2.7zm10 0v3.7c1.2-.4 2-1.5 2-2.7V7z" />
  </Svg>
);

/* ---------------- Solana & Web3 Wallet Icons ---------------- */

export const SolanaIcon = (p: P) => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
    <path
      d="M3.8 6.2a1 1 0 0 1 .7-.3h15a.7.7 0 0 1 .5 1.2l-3.3 3.3a1 1 0 0 1-.7.3h-15a.7.7 0 0 1-.5-1.2l3.3-3.3z"
      fill="url(#solGrad1)"
    />
    <path
      d="M3.8 13.8a1 1 0 0 1 .7-.3h15a.7.7 0 0 1 .5 1.2l-3.3 3.3a1 1 0 0 1-.7.3h-15a.7.7 0 0 1-.5-1.2l3.3-3.3z"
      fill="url(#solGrad2)"
    />
    <path
      d="M20.2 10a1 1 0 0 1-.7.3h-15a.7.7 0 0 1-.5-1.2l3.3-3.3a1 1 0 0 1 .7-.3h15a.7.7 0 0 1 .5 1.2L20.2 10z"
      fill="url(#solGrad3)"
    />
    <defs>
      <linearGradient id="solGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9945FF" />
        <stop offset="100%" stopColor="#14F195" />
      </linearGradient>
      <linearGradient id="solGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9945FF" />
        <stop offset="100%" stopColor="#14F195" />
      </linearGradient>
      <linearGradient id="solGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#14F195" />
        <stop offset="100%" stopColor="#9945FF" />
      </linearGradient>
    </defs>
  </svg>
);

export const PhantomIcon = (p: P) => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
    <rect width="24" height="24" rx="6" fill="#AB9FF2" />
    <path
      d="M6 13.5C6 9.36 9.36 6 13.5 6S21 9.36 21 13.5c0 3.2-2.1 5.9-5 6.8v-2.1c1.8-.8 3-2.6 3-4.7 0-2.8-2.2-5-5-5s-5 2.2-5 5c0 1.2.4 2.3 1.2 3.1l-1.5 1.5C7.1 16.9 6 15.3 6 13.5z"
      fill="#2A2440"
    />
    <circle cx="11.5" cy="12.5" r="1.3" fill="#FFF" />
    <circle cx="15.5" cy="12.5" r="1.3" fill="#FFF" />
  </svg>
);

export const SolflareIcon = (p: P) => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
    <rect width="24" height="24" rx="6" fill="#141416" />
    <path
      d="M12 4l2.5 5 5.5 1-4 4 1 5.5-5-2.7-5 2.7 1-5.5-4-4 5.5-1z"
      fill="url(#solflareGrad)"
    />
    <defs>
      <linearGradient id="solflareGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FC9965" />
        <stop offset="100%" stopColor="#FF6838" />
      </linearGradient>
    </defs>
  </svg>
);

export const BackpackIcon = (p: P) => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
    <rect width="24" height="24" rx="6" fill="#E33E38" />
    <path
      d="M8 8a4 4 0 0 1 8 0v2h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h1V8zm2 2h4V8a2 2 0 1 0-4 0v2zm-2 4v2h8v-2H8z"
      fill="#FFFFFF"
    />
  </svg>
);

export const WalletIcon = (p: P) => (
  <Stroke strokeWidth={2.4} {...p}>
    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3v4a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V6" />
    <circle cx="18" cy="14" r="1" fill="currentColor" />
  </Stroke>
);

export const CopyIcon = (p: P) => (
  <Stroke strokeWidth={2.4} {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Stroke>
);

/* ---------------- dealership icons ---------------- */

export const StoreIcon = (p: P) => (
  <Svg {...p}>
    <path d="M3 9.2 4.6 3.5h14.8L21 9.2a2.6 2.6 0 0 1-4.5 1.8 2.6 2.6 0 0 1-4.5 0 2.6 2.6 0 0 1-4.5 0A2.6 2.6 0 0 1 3 9.2z" />
    <path d="M4.6 12.4V20a1.5 1.5 0 0 0 1.5 1.5h11.8a1.5 1.5 0 0 0 1.5-1.5v-7.6a4.2 4.2 0 0 1-2.9.4 4.1 4.1 0 0 1-4.5.1 4.1 4.1 0 0 1-4.5-.1 4.2 4.2 0 0 1-2.9-.4z" opacity=".85" />
    <path d="M9.5 21.5v-5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5z" fill="#0f1535" opacity=".45" />
  </Svg>
);

export const SearchIcon = (p: P) => (
  <Stroke strokeWidth={2.8} {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 5 5" />
  </Stroke>
);

export const SortIcon = (p: P) => (
  <Stroke strokeWidth={2.6} {...p}>
    <path d="M4 6h16M4 12h11M4 18h6" />
  </Stroke>
);

export const FilterIcon = (p: P) => (
  <Svg {...p}>
    <path d="M3 4.5h18l-7 8.2v6.6l-4 2.2v-8.8z" />
  </Svg>
);

export const KeyIcon = (p: P) => (
  <Svg {...p}>
    <path d="M14.5 2.5a6.5 6.5 0 0 0-6.2 8.5L2.5 16.8V21h4.2v-2.3H9v-2.3h2.3l1.9-1.9A6.5 6.5 0 1 0 14.5 2.5zm1.8 3.4a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6z" />
  </Svg>
);

export const TagIcon = (p: P) => (
  <Svg {...p}>
    <path d="M2.5 11.6V4a1.5 1.5 0 0 1 1.5-1.5h7.6a1.5 1.5 0 0 1 1.1.4l8.4 8.4a1.5 1.5 0 0 1 0 2.1l-7.6 7.6a1.5 1.5 0 0 1-2.1 0L3 12.7a1.5 1.5 0 0 1-.5-1.1z" />
    <circle cx="7.5" cy="7.5" r="1.8" fill="#0f1535" />
  </Svg>
);

export const SprayIcon = (p: P) => (
  <Svg {...p}>
    <rect x="7" y="8" width="6.4" height="13" rx="2.2" />
    <rect x="8.6" y="5.4" width="3.2" height="2.6" rx="0.8" />
    <rect x="8" y="2.6" width="4.4" height="2.2" rx="1" />
    <circle cx="16.4" cy="3.6" r="1.15" />
    <circle cx="19.6" cy="6.4" r="1.05" />
    <circle cx="16.6" cy="8.2" r="0.95" />
    <circle cx="20.2" cy="10.6" r="1.15" />
  </Svg>
);

/** Two arrows pointing at each other — compare. */
export const CompareIcon = (p: P) => (
  <Svg {...p}>
    <path d="M3.2 7.4h11.2l-2.6-2.6a1.25 1.25 0 0 1 1.8-1.8l4.6 4.6a1.25 1.25 0 0 1 0 1.8l-4.6 4.6a1.25 1.25 0 0 1-1.8-1.8l2.6-2.5H3.2a1.3 1.3 0 0 1 0-2.6z" />
    <path d="M20.8 16.6H9.6l2.6-2.6a1.25 1.25 0 0 0-1.8-1.8l-4.6 4.6a1.25 1.25 0 0 0 0 1.8l4.6 4.6a1.25 1.25 0 0 0 1.8-1.8l-2.6-2.5h11.2a1.3 1.3 0 0 0 0-2.6z" />
  </Svg>
);

