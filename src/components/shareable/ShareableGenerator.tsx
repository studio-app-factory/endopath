// ============================================================
// ENDOPATH — Shareable Card Generator UI
// Generates Instagram/Reddit/Twitter-ready infographics
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import {
  Image as ImageIcon,
  Loader2,
  Share2,
  Save,
  Copy,
  Smartphone,
  Square,
  MessageSquare,
  Sparkles,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SHARE_TEMPLATES, TEMPLATE_CONFIGS } from '@/lib/templates';
import { generateShareCard, prepareShareData } from '@/lib/shareable-generator';
import type { ShareData } from '@/lib/shareable-generator';
import { getFlareStats, getDB } from '@/lib/db';
import { useStore, useIsEffectivePro } from '@/lib/store';
import { track } from '@/lib/analytics';
import type { ShareSize } from '@/types';

export function ShareableGenerator() {
  const selectedTemplate = useStore((s) => s.selectedTemplate);
  const setTemplate = useStore((s) => s.setTemplate);
  // Effective Pro = paid OR trial. Share-card export is a Pro feature.
  const isPremium = useIsEffectivePro();
  const [selectedSize, setSelectedSize] = useState<ShareSize>('instagram_stories');
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [timeRange, setTimeRange] = useState(12);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      const stats = await getFlareStats(timeRange);
      const db = getDB();
      const now = new Date();
      const start = new Date(now);
      start.setMonth(start.getMonth() - timeRange);
      const entries = await db.symptomEntries
        .where('date')
        .between(start.toISOString().split('T')[0], now.toISOString().split('T')[0], true, true)
        .toArray();

      const data = prepareShareData(
        entries,
        stats.monthlyFlareCount,
        stats.symptomFreq,
        stats.painLocationFreq,
      );
      setShareData(data);
    } catch (e) {
      setError('Could not load your data. Try logging some entries first.');
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!shareData || shareData.entriesCount === 0) {
      setError('Log some entries first to generate your flare pattern card.');
      return;
    }

    setGenerating(true);
    setError(null);
    track('shareable_generated', { template_used: selectedTemplate });

    try {
      const blob = await generateShareCard(shareData, selectedTemplate, selectedSize, isPremium);
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    } catch (e) {
      setError('Failed to generate card. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [shareData, selectedTemplate, selectedSize, isPremium]);

  const handleShare = useCallback(
    async (destination: string) => {
      if (!imageUrl) return;
      track('shareable_shared', { destination });

      try {
        const blob = await fetch(imageUrl).then((r) => r.blob());
        const file = new File([blob], `endopath-flare-pattern-${Date.now()}.png`, {
          type: 'image/png',
        });

        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: 'My Endometriosis Flare Pattern',
            text: `My ${timeRange}-month endometriosis flare pattern — tracked with Endopath. #endowarrior #endosisters #1in10`,
            files: [file],
          });
        } else {
          const a = document.createElement('a');
          a.href = imageUrl;
          a.download = `endopath-flare-pattern-${Date.now()}.png`;
          a.click();
        }
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          const a = document.createElement('a');
          a.href = imageUrl;
          a.download = `endopath-flare-pattern-${Date.now()}.png`;
          a.click();
        }
      }
    },
    [imageUrl, timeRange],
  );

  const sizes: Array<{ id: ShareSize; label: string; icon: typeof Smartphone }> = [
    { id: 'instagram_stories', label: 'Story', icon: Smartphone },
    { id: 'instagram_post', label: 'Post', icon: Square },
    { id: 'reddit_twitter', label: 'Card', icon: MessageSquare },
  ];

  const shareDestinations: Array<{ id: string; label: string; icon: typeof Share2 }> = [
    { id: 'system_share', label: 'Share', icon: Share2 },
    { id: 'save_to_photos', label: 'Save', icon: Save },
    { id: 'copy_link', label: 'Copy', icon: Copy },
  ];

  if (!shareData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#C97D7D]/20 to-[#8B3D52]/20 border border-[#D89BA8]/15 flex items-center justify-center mb-4">
          <Loader2 className="w-7 h-7 text-[#8B3D52] animate-spin" strokeWidth={1.8} />
        </div>
        <p className="text-[#7A5560]/85">Loading your flare data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-3xl font-semibold text-[#3D1A24] font-['Cormorant_Garamond'] tracking-tight">
          Your Flare Pattern
        </h2>
        <p className="text-sm text-[#7A5560]/85">
          {shareData.entriesCount === 0
            ? 'Start logging to generate your shareable infographic'
            : `${shareData.daysTracked} days tracked · ${shareData.totalFlares} flares`}
        </p>
      </div>

      {/* Time range selector */}
      <div className="flex justify-center gap-2">
        {[1, 3, 6, 12].map((m) => (
          <button
            key={m}
            onClick={() => setTimeRange(m)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
              timeRange === m
                ? 'bg-gradient-to-br from-[#C97D7D] to-[#8B3D52] text-[#FFFAF5] shadow-md shadow-[#C97D7D]/20'
                : 'bg-[#3D1A24]/5 text-[#7A5560] border border-[#E8D5CC]/70 hover:bg-[#3D1A24]/7'
            }`}
          >
            {m === 1 ? '1mo' : `${m}mo`}
          </button>
        ))}
      </div>

      {/* Template picker */}
      <div>
        <p className="text-[10px] font-medium text-[#8B6B78] uppercase tracking-[0.18em] mb-3 text-center">
          Template
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          {SHARE_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => {
                if (tpl.isPremium && !isPremium) {
                  useStore.getState().triggerPaywall('share_export');
                  return;
                }
                setTemplate(tpl.id);
              }}
              className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                selectedTemplate === tpl.id
                  ? 'border-[#C97D7D] bg-[#FFFAF5] shadow-md shadow-[#C97D7D]/12'
                  : 'border-[#E8D5CC]/70 bg-[#FFFAF5] hover:border-[#E8D5CC]'
              }`}
            >
              <div
                className="w-20 h-28 rounded-lg flex items-center justify-center text-xs font-medium"
                style={{
                  background: TEMPLATE_CONFIGS[tpl.id].backgroundColor,
                  color: TEMPLATE_CONFIGS[tpl.id].textColor,
                  fontFamily: TEMPLATE_CONFIGS[tpl.id].fontFamily,
                }}
              >
                {tpl.name.split(' ')[0]}
              </div>
              <p className="text-[10px] text-[#7A5560]/85 mt-1.5 text-center max-w-[80px] truncate">
                {tpl.name}
              </p>
              {tpl.isPremium && !isPremium && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-[#C97D7D] to-[#8B3D52] rounded-full flex items-center justify-center shadow-md shadow-[#C97D7D]/25">
                  <Lock className="w-2.5 h-2.5 text-[#FFFAF5]" strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Size picker */}
      <div className="flex justify-center gap-2">
        {sizes.map((sz) => {
          const SzIcon = sz.icon;
          return (
            <button
              key={sz.id}
              onClick={() => setSelectedSize(sz.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                selectedSize === sz.id
                  ? 'bg-[#3D1A24]/6 text-[#3D1A24] border border-[#C97D7D]'
                  : 'bg-[#FFFAF5] text-[#7A5560]/85 border border-[#E8D5CC]/70 hover:border-[#E8D5CC]'
              }`}
            >
              <SzIcon className="w-4 h-4" strokeWidth={1.8} />
              {sz.label}
            </button>
          );
        })}
      </div>

      {/* Generate button */}
      <div className="flex justify-center">
        <Button
          onClick={handleGenerate}
          disabled={generating || shareData.entriesCount === 0}
          size="lg"
          className="min-w-[220px]"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Card
            </>
          )}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-[#C97D7D]/10 border border-[#C97D7D]/30 rounded-2xl text-sm text-[#8B3D52] text-center inline-flex items-center justify-center gap-2 w-full">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Preview */}
      {imageUrl && (
        <div className="space-y-4 animate-in fade-in zoom-in-95">
          <div className="rounded-3xl overflow-hidden shadow-2xl shadow-[#C97D7D]/12 border border-[#E8D5CC] max-w-sm mx-auto">
            <img src={imageUrl} alt="Flare Pattern Card" className="w-full" />
          </div>

          <div className="flex justify-center gap-3">
            {shareDestinations.map((dest) => {
              const DIcon = dest.icon;
              return (
                <button
                  key={dest.id}
                  onClick={() => handleShare(dest.id)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[#FFFAF5] border border-[#E8D5CC]/70 hover:bg-[#3D1A24]/6 transition-colors cursor-pointer min-w-[72px]"
                >
                  <DIcon className="w-5 h-5 text-[#8B3D52]" strokeWidth={1.8} />
                  <span className="text-[10px] text-[#7A5560] font-medium">{dest.label}</span>
                </button>
              );
            })}
          </div>

          {!isPremium && (
            <p className="text-center text-xs text-[#8B6B78]">
              Free version includes Endopath watermark.{' '}
              <button
                onClick={() => useStore.getState().triggerPaywall('share_export')}
                className="bg-gradient-to-br from-[#C97D7D] to-[#8B3D52] bg-clip-text text-transparent underline font-medium cursor-pointer"
              >
                Upgrade for clean exports
              </button>
            </p>
          )}
        </div>
      )}

      {/* Empty state CTA */}
      {shareData.entriesCount === 0 && !error && (
        <div className="text-center p-8 bg-[#FFFAF5] rounded-3xl border border-[#E8D5CC]/70">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C97D7D]/20 to-[#8B3D52]/20 border border-[#D89BA8]/15 flex items-center justify-center mx-auto mb-3">
            <ImageIcon className="w-6 h-6 text-[#8B3D52]" strokeWidth={1.6} />
          </div>
          <h3 className="text-xl font-semibold text-[#3D1A24] font-['Cormorant_Garamond'] mb-2">
            No data yet
          </h3>
          <p className="text-sm text-[#7A5560]/85 mb-4 max-w-xs mx-auto">
            Log your first symptom entry to start building your flare pattern visualization.
          </p>
          <Button onClick={() => useStore.getState().setScreen('log_entry')} variant="secondary">
            Log Your First Entry
          </Button>
        </div>
      )}
    </div>
  );
}
