// ============================================================
// ENDOPATH — Symptom & Flare Logging Form
// ============================================================

import { useState, useCallback } from 'react';
import {
  Flame,
  Zap,
  Frown,
  Wind,
  AlertCircle,
  Moon,
  Brain,
  ArrowDown,
  Footprints,
  Toilet,
  Droplet,
  Cloud,
  HeartCrack,
  CloudRain,
  Eye,
  Sun,
  MapPin,
  Heart,
  Smile,
  Meh,
  Loader2,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BodyPainMap } from '@/components/pain-map/BodyPainMap';
import { useStore } from '@/lib/store';
import { getDB } from '@/lib/db';
import { track } from '@/lib/analytics';
import type { SymptomType, FlowLevel, CyclePhase, PainLocation } from '@/types';

const SYMPTOMS: Array<{ id: SymptomType; label: string; icon: LucideIcon }> = [
  { id: 'cramping', label: 'Cramping', icon: Zap },
  { id: 'sharp_pain', label: 'Sharp Pain', icon: AlertCircle },
  { id: 'dull_ache', label: 'Dull Ache', icon: Frown },
  { id: 'bloating', label: 'Bloating', icon: Wind },
  { id: 'nausea', label: 'Nausea', icon: CloudRain },
  { id: 'fatigue', label: 'Fatigue', icon: Moon },
  { id: 'headache', label: 'Headache', icon: Brain },
  { id: 'backache', label: 'Backache', icon: ArrowDown },
  { id: 'leg_pain', label: 'Leg Pain', icon: Footprints },
  { id: 'painful_bm', label: 'Painful BM', icon: Toilet },
  { id: 'painful_urination', label: 'Painful Urination', icon: Droplet },
  { id: 'brain_fog', label: 'Brain Fog', icon: Cloud },
  { id: 'anxiety', label: 'Anxiety', icon: HeartCrack },
  { id: 'depression', label: 'Depression', icon: CloudRain },
  { id: 'insomnia', label: 'Insomnia', icon: Eye },
  { id: 'hot_flashes', label: 'Hot Flashes', icon: Sun },
];

const FLOW_LEVELS: Array<{ id: FlowLevel; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'spotting', label: 'Spotting' },
  { id: 'light', label: 'Light' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'heavy', label: 'Heavy' },
  { id: 'very_heavy', label: 'Very Heavy' },
];

const CYCLE_PHASES: Array<{ id: CyclePhase; label: string }> = [
  { id: 'menstrual', label: 'Menstrual' },
  { id: 'follicular', label: 'Follicular' },
  { id: 'ovulation', label: 'Ovulation' },
  { id: 'luteal', label: 'Luteal' },
  { id: 'unknown', label: 'Unknown' },
];

export function LogEntry() {
  const { setScreen, isPremium, incrementTrialEntries, trialEntriesRemaining, triggerPaywall } =
    useStore();

  const [painLevel, setPainLevel] = useState(5);
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<SymptomType>>(new Set());
  const [painLocations, setPainLocations] = useState<PainLocation[]>([]);
  const [flowLevel, setFlowLevel] = useState<FlowLevel>('none');
  const [isBleeding, setIsBleeding] = useState(false);
  const [cyclePhase, setCyclePhase] = useState<CyclePhase>('unknown');
  const [sleepHours, setSleepHours] = useState<number | undefined>();
  const [sleepQuality, setSleepQuality] = useState<1 | 2 | 3 | 4 | 5 | undefined>();
  const [intercoursePain, setIntercoursePain] = useState(false);
  const [intercoursePainLevel, setIntercoursePainLevel] = useState<number | undefined>();
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleSymptom = (id: SymptomType) => {
    setSelectedSymptoms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddLocation = (loc: Omit<PainLocation, 'id'>) => {
    const newLoc: PainLocation = { ...loc, id: crypto.randomUUID() };
    setPainLocations((prev) => [...prev, newLoc]);
  };

  const handleRemoveLocation = (id: string) => {
    setPainLocations((prev) => prev.filter((l) => l.id !== id));
  };

  const handleSave = useCallback(async () => {
    if (!isPremium) {
      const canLog = incrementTrialEntries();
      if (!canLog) {
        triggerPaywall('feature_limit_reached');
        return;
      }
    }

    setSaving(true);
    const now = new Date();
    const isFlare = painLevel >= 7 || (painLevel >= 5 && painLocations.length >= 2);

    const entry = {
      id: crypto.randomUUID(),
      timestamp: now.toISOString(),
      date: now.toISOString().split('T')[0],
      painLevel,
      painLocations,
      symptoms: Array.from(selectedSymptoms),
      flowLevel: isBleeding ? flowLevel : 'none' as FlowLevel,
      isBleeding,
      intercoursePain,
      intercoursePainLevel: intercoursePain ? intercoursePainLevel : undefined,
      notes: notes || undefined,
      cyclePhase,
      sleepHours,
      sleepQuality,
      isFlare,
      flareType: isFlare
        ? painLevel >= 8
          ? ('severe' as const)
          : painLevel >= 6
            ? ('moderate' as const)
            : ('mild' as const)
        : undefined,
    };

    try {
      const db = getDB();
      await db.symptomEntries.put(entry);
      track('flare_logged', {
        pain_level: painLevel,
        is_flare: isFlare,
        symptom_count: selectedSymptoms.size,
        location_count: painLocations.length,
      });
      setSaved(true);
      setTimeout(() => {
        setScreen('home');
      }, 1200);
    } catch (e) {
      // Handle error
    } finally {
      setSaving(false);
    }
  }, [
    painLevel,
    selectedSymptoms,
    painLocations,
    flowLevel,
    isBleeding,
    cyclePhase,
    sleepHours,
    sleepQuality,
    intercoursePain,
    intercoursePainLevel,
    notes,
    isPremium,
    incrementTrialEntries,
    triggerPaywall,
    setScreen,
  ]);

  const PainFaceIcon = (level: number): LucideIcon => {
    if (level <= 3) return Smile;
    if (level <= 5) return Meh;
    if (level <= 7) return Frown;
    return Flame;
  };

  if (saved) {
    const Face = PainFaceIcon(painLevel);
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8">
        <div className="relative mb-6">
          <div className="absolute top-1/2 left-1/2 w-40 h-40 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl bg-gradient-to-br from-rose-400/55 to-amber-400/40 animate-halo" />
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center shadow-2xl shadow-rose-400/45">
            <Heart className="w-9 h-9 text-[#1A0E13]" fill="currentColor" strokeWidth={0} />
          </div>
        </div>
        <h2 className="text-3xl font-semibold text-white font-['Cormorant_Garamond'] mb-2">
          Entry Saved
        </h2>
        <p className="text-white/55">
          <Face className="inline w-4 h-4 mr-1.5 text-rose-300 align-text-bottom" />
          Held safely. Only on your device.
        </p>
      </div>
    );
  }

  const Face = PainFaceIcon(painLevel);

  return (
    <div className="space-y-5 pb-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-semibold text-white font-['Cormorant_Garamond'] tracking-tight">
          Log Your Symptoms
        </h2>
        {!isPremium && (
          <p className="text-xs text-white/45">
            {trialEntriesRemaining} free{' '}
            {trialEntriesRemaining === 1 ? 'entry' : 'entries'} remaining
          </p>
        )}
      </div>

      {/* Pain Level */}
      <div className="bg-white/4 rounded-3xl p-5 border border-white/8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-white/85">Pain Level</p>
          <span className="text-[10px] font-mono text-white/45 uppercase tracking-wider">
            0–10 scale
          </span>
        </div>
        <div className="flex items-center gap-4 mb-2">
          <Face className="w-7 h-7 text-rose-300" strokeWidth={1.7} />
          <input
            type="range"
            min="1"
            max="10"
            value={painLevel}
            onChange={(e) => setPainLevel(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-2xl font-bold bg-gradient-to-br from-rose-400 to-amber-400 bg-clip-text text-transparent w-8 text-center font-['Cormorant_Garamond']">
            {painLevel}
          </span>
        </div>
        <div className="flex justify-between text-[10px] text-white/40 px-1 uppercase tracking-wider">
          <span>Mild</span>
          <span>Moderate</span>
          <span>Severe</span>
        </div>
      </div>

      {/* Body Pain Map */}
      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <MapPin className="w-4 h-4 text-rose-300" strokeWidth={1.8} />
          <p className="text-sm font-medium text-white/85">Pain Locations</p>
        </div>
        <BodyPainMap
          locations={painLocations}
          onLocationAdd={handleAddLocation}
          onLocationRemove={handleRemoveLocation}
          onLocationUpdate={() => {}}
          painLevel={painLevel}
          height={400}
        />
        {painLocations.length > 0 && (
          <p className="text-xs text-white/55 text-center mt-2">
            {painLocations.length} location{painLocations.length > 1 ? 's' : ''} logged
          </p>
        )}
      </div>

      {/* Symptoms */}
      <div className="bg-white/4 rounded-3xl p-5 border border-white/8">
        <p className="text-sm font-medium text-white/85 mb-3">Symptoms</p>
        <div className="flex flex-wrap gap-2">
          {SYMPTOMS.map((sym) => {
            const SymIcon = sym.icon;
            const active = selectedSymptoms.has(sym.id);
            return (
              <button
                key={sym.id}
                onClick={() => toggleSymptom(sym.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-gradient-to-br from-rose-400 to-amber-400 text-[#1A0E13] shadow-md shadow-rose-400/30'
                    : 'bg-white/6 text-white/65 border border-white/8 hover:bg-white/10'
                }`}
              >
                <SymIcon className="w-3.5 h-3.5" strokeWidth={2} />
                {sym.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bleeding & Cycle */}
      <div className="bg-white/4 rounded-3xl p-5 border border-white/8 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-white/85">Currently Bleeding</p>
          <button
            onClick={() => setIsBleeding(!isBleeding)}
            className={`w-12 h-7 rounded-full transition-colors cursor-pointer relative ${
              isBleeding
                ? 'bg-gradient-to-r from-rose-400 to-amber-400 shadow-md shadow-rose-400/30'
                : 'bg-white/10'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-all ${
                isBleeding ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        {isBleeding && (
          <div className="flex gap-2 flex-wrap">
            {FLOW_LEVELS.map((fl) => (
              <button
                key={fl.id}
                onClick={() => setFlowLevel(fl.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  flowLevel === fl.id
                    ? 'bg-gradient-to-br from-rose-400 to-amber-400 text-[#1A0E13]'
                    : 'bg-white/6 text-white/65 border border-white/8 hover:bg-white/10'
                }`}
              >
                {fl.label}
              </button>
            ))}
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-white/85 mb-2">Cycle Phase</p>
          <div className="flex gap-2 flex-wrap">
            {CYCLE_PHASES.map((ph) => (
              <button
                key={ph.id}
                onClick={() => setCyclePhase(ph.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  cyclePhase === ph.id
                    ? 'bg-gradient-to-br from-violet-400 to-fuchsia-400 text-[#1A0E13]'
                    : 'bg-white/6 text-white/65 border border-white/8 hover:bg-white/10'
                }`}
              >
                {ph.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sleep */}
      <div className="bg-white/4 rounded-3xl p-5 border border-white/8 space-y-3">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-violet-300" strokeWidth={1.8} />
          <p className="text-sm font-medium text-white/85">Sleep</p>
        </div>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-xs text-white/50 mb-1 block">Hours</label>
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={sleepHours ?? ''}
              onChange={(e) =>
                setSleepHours(e.target.value ? Number(e.target.value) : undefined)
              }
              placeholder="7.5"
              className="w-full px-3 py-2.5 rounded-xl border border-white/10 text-sm text-white bg-white/6 placeholder:text-white/30 focus:outline-none focus:border-rose-400/50"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-white/50 mb-1 block">Quality (1–5)</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((q) => (
                <button
                  key={q}
                  onClick={() => setSleepQuality(q as 1 | 2 | 3 | 4 | 5)}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    sleepQuality === q
                      ? 'bg-gradient-to-br from-rose-400 to-amber-400 text-[#1A0E13]'
                      : 'bg-white/6 text-white/55 border border-white/8 hover:bg-white/10'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Intercourse Pain */}
      <div className="bg-white/4 rounded-3xl p-5 border border-white/8 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-white/85">Intercourse Pain</p>
          <button
            onClick={() => setIntercoursePain(!intercoursePain)}
            className={`w-12 h-7 rounded-full transition-colors cursor-pointer relative ${
              intercoursePain
                ? 'bg-gradient-to-r from-rose-400 to-amber-400 shadow-md shadow-rose-400/30'
                : 'bg-white/10'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-all ${
                intercoursePain ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>
        {intercoursePain && (
          <div>
            <label className="text-xs text-white/55 mb-1 block">Pain Level (1–10)</label>
            <input
              type="range"
              min="1"
              max="10"
              value={intercoursePainLevel ?? 5}
              onChange={(e) => setIntercoursePainLevel(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-lg font-bold text-rose-300 mt-1 font-['Cormorant_Garamond']">
              {intercoursePainLevel ?? 5}
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white/4 rounded-3xl p-5 border border-white/8">
        <p className="text-sm font-medium text-white/85 mb-2">Notes</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything else? Diet, weather, triggers..."
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl border border-white/10 text-sm text-white bg-white/6 placeholder:text-white/30 focus:outline-none focus:border-rose-400/50 resize-none"
        />
      </div>

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={saving || selectedSymptoms.size === 0}
        size="lg"
        className="w-full"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Save Entry
          </>
        )}
      </Button>
    </div>
  );
}
