// ============================================================
// ENDOPATH — Doctor Export PDF Generator
// 4-week summary for medical appointments
// ============================================================

import { jsPDF } from 'jspdf';
import type { SymptomEntry, CycleRecord, MedicationLog, SurgeryLog, ExportConfig } from '@/types';

export interface ExportData {
  entries: SymptomEntry[];
  cycles: CycleRecord[];
  medications: MedicationLog[];
  surgeries: SurgeryLog[];
  config: ExportConfig;
}

export async function generateDoctorPDF(data: ExportData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const margin = 20;
  const pageWidth = 210;
  let y = margin;

  // --- Header ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(201, 125, 125); // Dusty rose
  doc.text('Endopath — Medical Summary', margin, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  const dateRange = `${data.config.startDate} – ${data.config.endDate}`;
  doc.text(`Period: ${dateRange}`, margin, y);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin - 40, y);
  y += 12;

  // Divider
  doc.setDrawColor(220, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  const sections = data.config.includeSections;

  // --- Summary ---
  if (sections.includes('summary')) {
    y = addSectionHeader(doc, 'Overview Summary', y, margin);
    const flareEntries = data.entries.filter((e) => e.isFlare);
    const avgPain = data.entries.length > 0
      ? (data.entries.reduce((s, e) => s + e.painLevel, 0) / data.entries.length).toFixed(1)
      : 'N/A';

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    const summaryLines = [
      `Total entries: ${data.entries.length}`,
      `Flare episodes: ${flareEntries.length}`,
      `Average pain level: ${avgPain}/10`,
      `Days tracked: ${new Set(data.entries.map((e) => e.date)).size}`,
      `Cycle records: ${data.cycles.length}`,
      `Active medications: ${data.medications.filter((m) => m.isActive).length}`,
      `Surgeries recorded: ${data.surgeries.length}`,
    ];
    for (const line of summaryLines) {
      doc.text(`• ${line}`, margin + 4, y);
      y += 7;
    }
    y += 4;
  }

  // --- Pain Log ---
  if (sections.includes('pain_log') && data.entries.length > 0) {
    y = addSectionHeader(doc, 'Pain Log', y, margin);

    // Table header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const cols = [margin, margin + 30, margin + 60, margin + 100, margin + 145];
    doc.text('Date', cols[0], y);
    doc.text('Pain (1-10)', cols[1], y);
    doc.text('Phase', cols[2], y);
    doc.text('Symptoms', cols[3], y);
    doc.text('Flare?', cols[4], y);
    y += 6;

    doc.setDrawColor(200, 190, 190);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    for (const entry of data.entries.slice(0, 30)) {
      if (y > 260) {
        doc.addPage();
        y = margin;
      }
      doc.setTextColor(60, 60, 60);
      doc.text(entry.date, cols[0], y);
      doc.text(String(entry.painLevel), cols[1], y);
      doc.text(entry.cyclePhase || '-', cols[2], y);
      doc.text(entry.symptoms.slice(0, 3).map(formatSym).join(', '), cols[3], y);
      doc.text(entry.isFlare ? 'YES' : 'no', cols[4], y);
      y += 5;
    }
    y += 4;
  }

  // --- Medications ---
  if (sections.includes('medications') && data.medications.length > 0) {
    y = addSectionHeader(doc, 'Medications', y, margin);
    for (const med of data.medications) {
      if (y > 260) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`${med.name} (${med.dosage})`, margin + 4, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Frequency: ${med.frequency} | Started: ${med.startDate} | Active: ${med.isActive ? 'Yes' : 'No'}`, margin + 4, y);
      y += 7;
    }
    y += 2;
  }

  // --- Surgeries ---
  if (sections.includes('surgeries') && data.surgeries.length > 0) {
    y = addSectionHeader(doc, 'Surgical History', y, margin);
    for (const surg of data.surgeries) {
      if (y > 260) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`${surg.procedure} — ${surg.date}`, margin + 4, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const details = [
        surg.surgeon ? `Surgeon: ${surg.surgeon}` : '',
        surg.hospital ? `Hospital: ${surg.hospital}` : '',
        `Type: ${surg.type}`,
      ].filter(Boolean).join(' | ');
      doc.text(details, margin + 4, y);
      y += 7;
    }
    y += 2;
  }

  // --- Cycle Data ---
  if (sections.includes('cycle_data') && data.cycles.length > 0) {
    y = addSectionHeader(doc, 'Cycle History', y, margin);
    for (const cycle of data.cycles.slice(0, 12)) {
      if (y > 260) { doc.addPage(); y = margin; }
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(
        `Start: ${cycle.startDate} | Length: ${cycle.cycleLength}d | Period: ${cycle.periodLength}d | Predicted: ${cycle.isPredicted ? 'Yes' : 'No'}`,
        margin + 4,
        y,
      );
      y += 6;
    }
    y += 2;
  }

  // --- Flare Analysis ---
  if (sections.includes('flare_analysis')) {
    y = addSectionHeader(doc, 'Flare Pattern Analysis', y, margin);
    const flares = data.entries.filter((e) => e.isFlare);

    // Pain by phase
    const phaseMap: Record<string, number[]> = {};
    for (const e of flares) {
      const phase = e.cyclePhase || 'unknown';
      if (!phaseMap[phase]) phaseMap[phase] = [];
      phaseMap[phase].push(e.painLevel);
    }

    doc.setFontSize(9);
    for (const [phase, pains] of Object.entries(phaseMap)) {
      if (y > 260) { doc.addPage(); y = margin; }
      const avg = (pains.reduce((a, b) => a + b, 0) / pains.length).toFixed(1);
      doc.text(`• ${phase}: ${pains.length} flares, avg pain ${avg}/10`, margin + 4, y);
      y += 6;
    }
    y += 2;
  }

  // --- Intercourse Pain ---
  if (sections.includes('intercourse_pain')) {
    y = addSectionHeader(doc, 'Intercourse Pain Tracking', y, margin);
    const ipEntries = data.entries.filter((e) => e.intercoursePain === true);
    if (ipEntries.length === 0) {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('No intercourse pain entries recorded in this period.', margin + 4, y);
      y += 6;
    } else {
      const avgIPP = (ipEntries.reduce((s, e) => s + (e.intercoursePainLevel || 0), 0) / ipEntries.length).toFixed(1);
      doc.setFontSize(9);
      doc.text(`Entries with intercourse pain: ${ipEntries.length}`, margin + 4, y);
      y += 6;
      doc.text(`Average intercourse pain level: ${avgIPP}/10`, margin + 4, y);
      y += 6;
    }
    y += 2;
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text('Generated by Endopath — Privacy-first endometriosis tracker', margin, 285);
  doc.text('endopath.app', pageWidth - margin - 25, 285);

  const arrayBuffer = doc.output('arraybuffer');
  return new Blob([arrayBuffer], { type: 'application/pdf' });
}

function addSectionHeader(doc: jsPDF, title: string, y: number, margin: number): number {
  if (y > 260) {
    doc.addPage();
    y = 20;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(201, 125, 125);
  doc.text(title, margin, y);
  y += 8;
  doc.setDrawColor(230, 215, 215);
  doc.line(margin, y, 190, y);
  y += 6;
  return y;
}

function formatSym(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
