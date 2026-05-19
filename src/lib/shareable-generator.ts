// ============================================================
// ENDOPATH — Shareable Card Generator
// Pre-rendered template + composited user data
// Render target: <500ms
// Output: PNG at multiple sizes
// ============================================================

import html2canvas from 'html2canvas';
import { SHARE_DIMENSIONS } from '@/types';
import type { ShareTemplateId, ShareSize, ShareDimensions, SymptomEntry } from '@/types';
import { TEMPLATE_CONFIGS, ATTRIBUTION_TEXT } from './templates';
import type { TemplateRenderConfig } from './templates';

export interface ShareData {
  totalFlares: number;
  averagePain: number;
  worstMonth: { month: string; count: number };
  topSymptoms: Array<{ name: string; count: number }>;
  topPainZones: Array<{ zone: string; count: number }>;
  monthlyFlareCount: Record<string, number>;
  flareTrend: 'improving' | 'stable' | 'worsening';
  daysTracked: number;
  entriesCount: number;
}

// --- Main generation function ---
export async function generateShareCard(
  data: ShareData,
  templateId: ShareTemplateId,
  size: ShareSize,
  isPremium: boolean,
): Promise<Blob> {
  const config = TEMPLATE_CONFIGS[templateId];
  const dims = SHARE_DIMENSIONS[size];

  // Create off-screen container
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: ${dims.width}px;
    height: ${dims.height}px;
    font-family: ${config.fontFamily};
    background: ${config.backgroundColor};
    color: ${config.textColor};
    overflow: hidden;
  `;

  container.innerHTML = buildCardHTML(data, config, dims, isPremium, size);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      width: dims.width,
      height: dims.height,
      scale: 2, // Retina quality
      useCORS: true,
      backgroundColor: config.backgroundColor,
      logging: false,
    });

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
        'image/png',
        1.0,
      );
    });

    return blob;
  } finally {
    document.body.removeChild(container);
  }
}

// --- HTML Builder ---
function buildCardHTML(
  data: ShareData,
  config: TemplateRenderConfig,
  dims: ShareDimensions,
  isPremium: boolean,
  size: ShareSize,
): string {
  const isStory = size === 'instagram_stories';
  const isWide = size === 'reddit_twitter';

  const months = Object.keys(data.monthlyFlareCount).sort();
  const maxFlareCount = Math.max(1, ...Object.values(data.monthlyFlareCount));

  // Build mini bar chart
  const barChartHTML = months
    .map((m) => {
      const count = data.monthlyFlareCount[m];
      const height = (count / maxFlareCount) * 100;
      const label = new Date(m + '-01').toLocaleString('en', { month: 'short' });
      return `
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;">
          <span style="font-size:10px;color:${config.secondaryTextColor};">${count}</span>
          <div style="width:100%;max-width:24px;height:${height}px;background:${config.accentColor};border-radius:4px 4px 2px 2px;opacity:0.8;"></div>
          <span style="font-size:9px;color:${config.secondaryTextColor};">${label}</span>
        </div>`;
    })
    .join('');

  // Build symptom tags
  const symptomTags = data.topSymptoms
    .slice(0, 5)
    .map(
      (s) =>
        `<span style="display:inline-block;padding:4px 10px;border:1px solid ${config.accentColor};border-radius:12px;font-size:11px;margin:3px;color:${config.accentColor};opacity:0.85;">${formatSymptomName(s.name)}</span>`,
    )
    .join('');

  // Corner decoration
  const cornerSVG =
    config.cornerDecoration === 'floral'
      ? `<svg width="80" height="80" viewBox="0 0 80 80" style="opacity:0.15;"><circle cx="40" cy="40" r="30" fill="none" stroke="${config.accentColor}" stroke-width="1"/><circle cx="40" cy="40" r="20" fill="none" stroke="${config.accentColor}" stroke-width="0.5"/><circle cx="40" cy="40" r="8" fill="${config.accentColor}" opacity="0.5"/></svg>`
      : config.cornerDecoration === 'geometric'
        ? `<svg width="80" height="80" viewBox="0 0 80 80" style="opacity:0.15;"><rect x="15" y="15" width="50" height="50" fill="none" stroke="${config.accentColor}" stroke-width="1" transform="rotate(15,40,40)"/><line x1="20" y1="40" x2="60" y2="40" stroke="${config.accentColor}" stroke-width="0.5"/></svg>`
        : '';

  // Watermark for free users
  const watermarkHTML = !isPremium
    ? `<div style="position:absolute;bottom:${isStory ? '60px' : '20px'};left:0;right:0;text-align:center;font-size:10px;opacity:${config.watermarkOpacity};color:${config.textColor};letter-spacing:1px;text-transform:uppercase;">${ATTRIBUTION_TEXT}</div>`
    : `<div style="position:absolute;bottom:${isStory ? '60px' : '20px'};left:0;right:0;text-align:center;font-size:9px;opacity:0.25;color:${config.textColor};letter-spacing:0.5px;text-transform:uppercase;">${ATTRIBUTION_TEXT}</div>`;

  return `
    <div style="width:${dims.width}px;height:${dims.height}px;display:flex;flex-direction:column;position:relative;font-family:${config.fontFamily};">
      <!-- Corner decorations -->
      <div style="position:absolute;top:16px;left:16px;">${cornerSVG}</div>
      <div style="position:absolute;top:16px;right:16px;transform:scaleX(-1);">${cornerSVG}</div>

      <!-- Header -->
      <div style="padding:${isStory ? '60px 40px 20px' : '32px 32px 16px'};text-align:center;">
        <h1 style="font-size:${isStory ? '36px' : isWide ? '28px' : '28px'};font-weight:${config.headerStyle === 'serif' ? '500' : '600'};margin:0;letter-spacing:-0.5px;line-height:1.2;">
          ${isStory ? 'My Endo<br/>Year in Review' : 'My Endometriosis Year'}
        </h1>
        <p style="font-size:${isStory ? '16px' : '13px'};color:${config.secondaryTextColor};margin:8px 0 0;font-weight:300;">
          ${data.daysTracked} days tracked · ${data.entriesCount} entries
        </p>
      </div>

      <!-- Stats grid -->
      <div style="display:flex;justify-content:center;gap:${isStory ? '32px' : '24px'};padding:${isStory ? '20px 40px' : '12px 32px'};">
        <div style="text-align:center;">
          <div style="font-size:${isStory ? '48px' : '36px'};font-weight:700;color:${config.accentColor};line-height:1;">${data.totalFlares}</div>
          <div style="font-size:${isStory ? '13px' : '11px'};color:${config.secondaryTextColor};margin-top:4px;">Total Flares</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:${isStory ? '48px' : '36px'};font-weight:700;color:${config.accentColor};line-height:1;">${data.averagePain}</div>
          <div style="font-size:${isStory ? '13px' : '11px'};color:${config.secondaryTextColor};margin-top:4px;">Avg Pain /10</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:${isStory ? '48px' : '36px'};font-weight:700;color:${config.accentColor};line-height:1;">${data.worstMonth.count}</div>
          <div style="font-size:${isStory ? '13px' : '11px'};color:${config.secondaryTextColor};margin-top:4px;">Worst Month</div>
        </div>
      </div>

      <!-- Mini bar chart -->
      ${months.length > 0 ? `
      <div style="padding:${isStory ? '20px 32px' : '10px 32px'};">
        <p style="font-size:${isStory ? '14px' : '11px'};color:${config.secondaryTextColor};margin:0 0 10px;text-align:center;text-transform:uppercase;letter-spacing:1px;">Monthly Flare Count</p>
        <div style="display:flex;align-items:flex-end;gap:6px;height:${isStory ? '120px' : '80px'};padding:0 8px;">
          ${barChartHTML}
        </div>
      </div>
      ` : ''}

      <!-- Symptoms -->
      <div style="padding:${isStory ? '16px 32px' : '8px 32px'};text-align:center;">
        <p style="font-size:${isStory ? '14px' : '11px'};color:${config.secondaryTextColor};margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Top Symptoms</p>
        <div>${symptomTags}</div>
      </div>

      <!-- Flare trend -->
      <div style="padding:${isStory ? '16px 32px' : '8px 32px'};text-align:center;">
        <p style="font-size:${isStory ? '14px' : '12px'};color:${config.textColor};margin:0;">
          Trend: <strong style="color:${config.accentColor};">
            ${data.flareTrend === 'improving' ? '✨ Improving' : data.flareTrend === 'worsening' ? '📈 Flaring More' : '→ Stable'}
          </strong>
        </p>
      </div>

      <!-- Hashtags (Instagram Stories gets prominent placement) -->
      ${isStory ? `
      <div style="padding:10px 32px;text-align:center;margin-top:auto;">
        <p style="font-size:11px;color:${config.secondaryTextColor};line-height:1.6;opacity:0.7;">
          #endowarrior #endosisters #1in10
        </p>
      </div>
      ` : ''}

      ${watermarkHTML}
    </div>`;

  // For non-story sizes, add hashtags at bottom
}

function formatSymptomName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// --- Helper to prepare share data from entries ---
export function prepareShareData(
  entries: SymptomEntry[],
  monthlyFlareCount: Record<string, number>,
  symptomFreq: Record<string, number>,
  painLocationFreq: Record<string, number>,
): ShareData {
  const months = Object.keys(monthlyFlareCount).sort();
  const worstMonthEntry = months.length > 0
    ? months.reduce((a, b) => (monthlyFlareCount[a] > monthlyFlareCount[b] ? a : b))
    : '';

  // Compute trend
  let flareTrend: ShareData['flareTrend'] = 'stable';
  if (months.length >= 3) {
    const recent = months.slice(-3);
    const counts = recent.map((m) => monthlyFlareCount[m] || 0);
    if (counts[2] < counts[0]) flareTrend = 'improving';
    else if (counts[2] > counts[0]) flareTrend = 'worsening';
  }

  const topSymptoms = Object.entries(symptomFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const topPainZones = Object.entries(painLocationFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([zone, count]) => ({ zone, count }));

  return {
    totalFlares: entries.filter((e) => e.isFlare).length,
    averagePain: entries.length > 0
      ? Math.round((entries.reduce((s, e) => s + e.painLevel, 0) / entries.length) * 10) / 10
      : 0,
    worstMonth: { month: worstMonthEntry, count: monthlyFlareCount[worstMonthEntry] || 0 },
    topSymptoms,
    topPainZones,
    monthlyFlareCount,
    flareTrend,
    daysTracked: new Set(entries.map((e) => e.date)).size,
    entriesCount: entries.length,
  };
}
