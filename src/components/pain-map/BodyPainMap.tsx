// ============================================================
// ENDOPATH — Interactive Body Pain Map
// The PainFigure is now the single body visualization AND the
// tap target. Tapping a region opens the intensity modal; the
// figure mirrors the live intensity (posture + expression +
// glow). When nothing is being edited, the figure reflects
// either the strongest logged location or the top-level pain
// level slider, so the face responds as the user slides.
// ============================================================

import { useState, useCallback } from 'react';
import { Sparkles, X } from 'lucide-react';
import type { PainLocation, BodyZone } from '@/types';
import { PainFigure } from './PainFigure';

interface BodyPainMapProps {
  locations: PainLocation[];
  onLocationAdd: (loc: Omit<PainLocation, 'id'>) => void;
  onLocationRemove: (id: string) => void;
  onLocationUpdate: (id: string, updates: Partial<PainLocation>) => void;
  readonly?: boolean;
  height?: number;
  /** Top-level pain level (1-10) from LogEntry. Drives the figure when no
   *  zone is being edited and nothing is logged yet. */
  painLevel?: number;
}

// Zone centre positions (normalised) — used to seed PainLocation x/y on save.
const ZONE_CENTERS: Record<BodyZone, { x: number; y: number }> = {
  head: { x: 0.5, y: 0.06 },
  shoulders: { x: 0.5, y: 0.18 },
  chest: { x: 0.5, y: 0.22 },
  upper_abdomen: { x: 0.5, y: 0.32 },
  lower_abdomen: { x: 0.5, y: 0.42 },
  pelvis: { x: 0.5, y: 0.55 },
  lower_back: { x: 0.5, y: 0.48 },
  hips: { x: 0.5, y: 0.62 },
  thighs: { x: 0.5, y: 0.78 },
  knees: { x: 0.5, y: 0.95 },
  other: { x: 0.5, y: 0.5 },
};

// Tap targets overlaid on the PainFigure. Percentages of the figure
// container (the wrapper matches the figure aspect ratio 1536:3072).
const ZONE_HITAREAS: Record<
  BodyZone,
  { top: string; left: string; width: string; height: string }
> = {
  head:          { top: '3%',  left: '28%', width: '44%', height: '11%' },
  shoulders:     { top: '14%', left: '18%', width: '64%', height: '5%'  },
  chest:         { top: '19%', left: '24%', width: '52%', height: '6%'  },
  upper_abdomen: { top: '26%', left: '26%', width: '48%', height: '7%'  },
  lower_abdomen: { top: '34%', left: '26%', width: '48%', height: '8%'  },
  pelvis:        { top: '43%', left: '26%', width: '48%', height: '6%'  },
  lower_back:    { top: '33%', left: '80%', width: '16%', height: '14%' },
  hips:          { top: '49%', left: '24%', width: '52%', height: '6%'  },
  thighs:        { top: '56%', left: '24%', width: '52%', height: '17%' },
  knees:         { top: '75%', left: '26%', width: '48%', height: '9%'  },
  other:         { top: '40%', left: '32%', width: '36%', height: '8%'  },
};

const ZONE_LABEL: Record<BodyZone, string> = {
  head: 'Head',
  shoulders: 'Shoulders',
  chest: 'Chest',
  upper_abdomen: 'Upper Abdomen',
  lower_abdomen: 'Lower Abdomen',
  pelvis: 'Pelvis',
  lower_back: 'Lower Back',
  hips: 'Hips',
  thighs: 'Thighs',
  knees: 'Knees',
  other: 'Other',
};

export function BodyPainMap({
  locations,
  onLocationAdd,
  onLocationRemove,
  readonly = false,
  height = 420,
  painLevel = 0,
}: BodyPainMapProps) {
  const [selectedZone, setSelectedZone] = useState<BodyZone | null>(null);
  const [intensity, setIntensity] = useState(5);

  const handleZoneClick = useCallback(
    (zone: BodyZone) => {
      if (readonly) return;
      // Seed the modal slider from the top pain level (clamped to 1-10)
      // so the figure starts where the user already said the pain is.
      const seed = Math.max(1, Math.min(10, Math.round(painLevel || 5)));
      setSelectedZone(zone);
      setIntensity(seed);
    },
    [readonly, painLevel],
  );

  const handleConfirm = useCallback(() => {
    if (!selectedZone) return;
    const center = ZONE_CENTERS[selectedZone];
    onLocationAdd({
      x: center.x,
      y: center.y,
      side: 'center',
      zone: selectedZone,
      intensity,
    });
    setSelectedZone(null);
  }, [selectedZone, intensity, onLocationAdd]);

  // Colour used by the modal's intensity badge and the logged-zone dots.
  const getPainColor = (level: number): string => {
    if (level >= 8) return '#e11d48';
    if (level >= 6) return '#fb7185';
    if (level >= 4) return '#fbbf24';
    if (level >= 2) return '#fcd34d';
    return '#fde68a';
  };

  // Resolve what to show on the figure.
  // Priority: modal selection > strongest logged location > top pain level.
  const dominant = locations.reduce<PainLocation | null>(
    (a, b) => (!a || b.intensity > a.intensity ? b : a),
    null,
  );

  const figureZone: BodyZone | null =
    selectedZone ?? dominant?.zone ?? (painLevel > 0 ? 'other' : null);
  const figureIntensity: number = selectedZone
    ? intensity
    : dominant?.intensity ?? painLevel ?? 0;

  return (
    <div className="relative">
      {/* Figure + tap zones. Wrapper aspect ratio matches the PainFigure SVG
          so percentage-based hit zones line up with body parts. */}
      <div
        className="relative mx-auto"
        style={{ aspectRatio: '1536 / 3072', height }}
      >
        <PainFigure
          zone={figureZone}
          intensity={figureIntensity}
          height={height}
          className="pointer-events-none"
        />

        {/* Tap-to-log overlays */}
        {!readonly &&
          (Object.keys(ZONE_HITAREAS) as BodyZone[]).map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => handleZoneClick(z)}
              aria-label={`Log pain in ${ZONE_LABEL[z]}`}
              className={`absolute rounded-md transition-colors cursor-pointer ${
                selectedZone === z
                  ? 'bg-[#C97D7D]/25 ring-1 ring-[#D89BA8]/60'
                  : 'hover:bg-[#C97D7D]/15 active:bg-[#C97D7D]/25'
              }`}
              style={ZONE_HITAREAS[z]}
            />
          ))}

        {/* Logged-zone badges (tap to remove) */}
        {locations.map((loc) => {
          const area = ZONE_HITAREAS[loc.zone];
          if (!area) return null;
          const top = `calc(${area.top} + ${area.height} / 2)`;
          const left = `calc(${area.left} + ${area.width} / 2)`;
          return (
            <button
              key={loc.id}
              type="button"
              onClick={() => !readonly && onLocationRemove(loc.id)}
              aria-label={`Remove ${ZONE_LABEL[loc.zone]} pain (level ${loc.intensity})`}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full text-[11px] font-bold text-[#FFFAF5] shadow-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
              style={{ top, left, background: getPainColor(loc.intensity) }}
            >
              {loc.intensity}
            </button>
          );
        })}
      </div>

      {/* Zone selector modal */}
      {selectedZone && (
        <div className="mt-4 p-5 bg-[#FFFAF5] rounded-3xl border border-[#C97D7D]/25 shadow-xl shadow-[#C97D7D]/12 animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-base font-medium text-[#3D1A24] font-['Cormorant_Garamond']">
              Pain in:{' '}
              <span className="bg-gradient-to-br from-[#C97D7D] to-[#8B3D52] bg-clip-text text-transparent font-semibold">
                {ZONE_LABEL[selectedZone]}
              </span>
            </p>
            <button
              onClick={() => setSelectedZone(null)}
              className="w-7 h-7 rounded-full bg-[#3D1A24]/5 hover:bg-[#3D1A24]/7 flex items-center justify-center cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-[#7A5560]" />
            </button>
          </div>

          {/* Intensity slider */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-[10px] text-[#7A5560]/85 uppercase tracking-wider px-1">
              <span>Mild</span>
              <span>Moderate</span>
              <span>Severe</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-center">
              <span
                className="inline-flex items-center justify-center w-11 h-11 rounded-full text-[#FFFAF5] font-bold text-base shadow-lg shadow-[#C97D7D]/25"
                style={{ background: getPainColor(intensity) }}
              >
                {intensity}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setSelectedZone(null)}
              className="flex-1 py-2.5 rounded-2xl border border-[#E8D5CC] text-[#7A5560] text-sm font-medium hover:bg-[#3D1A24]/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-2.5 rounded-2xl bg-gradient-to-br from-[#C97D7D] to-[#8B3D52] text-[#FFFAF5] text-sm font-semibold shadow-lg shadow-[#C97D7D]/20 hover:shadow-xl transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              Log Pain
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-[#7A5560]/85">
        {[
          { level: '1-3', color: '#fde68a' },
          { level: '4-5', color: '#fbbf24' },
          { level: '6-7', color: '#fb7185' },
          { level: '8-10', color: '#e11d48' },
        ].map(({ level, color }) => (
          <div key={level} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
            <span>{level}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
