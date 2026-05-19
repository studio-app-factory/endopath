// ============================================================
// ENDOPATH — Share Card Template Definitions
// 3 templates at launch, expandable as paid pack
// ============================================================

import type { ShareTemplate, ShareTemplateId } from '@/types';

export const SHARE_TEMPLATES: ShareTemplate[] = [
  {
    id: 'watercolor_rose',
    name: 'Watercolor Rose',
    description: 'Soft watercolor uterus silhouette, dusty rose on cream. Feminine, editorial.',
    isPremium: false,
    previewThumb: '',
  },
  {
    id: 'night_bloom',
    name: 'Night Bloom',
    description: 'Deep indigo background with luminous floral accent. Bold and shareable.',
    isPremium: false,
    previewThumb: '',
  },
  {
    id: 'minimal_clean',
    name: 'Minimal Clean',
    description: 'Crisp white with subtle grid, typography-forward. Modern and clinical.',
    isPremium: true,
    previewThumb: '',
  },
];

// Template rendering configurations
export interface TemplateRenderConfig {
  id: ShareTemplateId;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  secondaryTextColor: string;
  fontFamily: string;
  headerStyle: 'serif' | 'sans';
  bodyStyle: 'light' | 'regular';
  cornerDecoration: 'floral' | 'geometric' | 'none';
  watermarkOpacity: number;
}

export const TEMPLATE_CONFIGS: Record<ShareTemplateId, TemplateRenderConfig> = {
  watercolor_rose: {
    id: 'watercolor_rose',
    backgroundColor: '#faf5f0',
    accentColor: '#c97d7d',
    textColor: '#4a3030',
    secondaryTextColor: '#8c6b6b',
    fontFamily: "'Playfair Display', Georgia, serif",
    headerStyle: 'serif',
    bodyStyle: 'regular',
    cornerDecoration: 'floral',
    watermarkOpacity: 0.12,
  },
  night_bloom: {
    id: 'night_bloom',
    backgroundColor: '#1a1a2e',
    accentColor: '#e8a0bf',
    textColor: '#f0e6ef',
    secondaryTextColor: '#b8a0b8',
    fontFamily: "'Inter', system-ui, sans-serif",
    headerStyle: 'sans',
    bodyStyle: 'light',
    cornerDecoration: 'floral',
    watermarkOpacity: 0.10,
  },
  minimal_clean: {
    id: 'minimal_clean',
    backgroundColor: '#ffffff',
    accentColor: '#d4786e',
    textColor: '#2d2d2d',
    secondaryTextColor: '#888888',
    fontFamily: "'Inter', system-ui, sans-serif",
    headerStyle: 'sans',
    bodyStyle: 'light',
    cornerDecoration: 'geometric',
    watermarkOpacity: 0.08,
  },
};

// Hashtag templates for different platforms
export const HASHTAG_SETS: Record<string, string[]> = {
  default: ['#endowarrior', '#endosisters', '#1in10', '#endometriosisawareness'],
  reddit: ['#endowarrior', '#endosisters', '#1in10'],
  tiktok: ['#endowarrior', '#endosisters', '#1in10', '#endotok', '#chronicillness'],
  instagram: ['#endowarrior', '#endosisters', '#1in10', '#endomama', '#chronicpainwarrior'],
};

// Attribution text
export const ATTRIBUTION_TEXT = 'made with Endopath';
