// ============================================================
// ENDOPATH — Medications & Surgery Log
// ============================================================

import { useState, useEffect } from 'react';
import { Pill, Stethoscope, Plus } from 'lucide-react';
import { getDB } from '@/lib/db';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type {
  MedicationLog,
  SurgeryLog,
  MedicationCategory,
  SurgeryType,
} from '@/types';

const MED_CATEGORIES: Array<{ id: MedicationCategory; label: string }> = [
  { id: 'nsaid', label: 'NSAID' },
  { id: 'hormonal', label: 'Hormonal' },
  { id: 'opioid', label: 'Opioid' },
  { id: 'muscle_relaxant', label: 'Muscle Relaxant' },
  { id: 'supplement', label: 'Supplement' },
  { id: 'other', label: 'Other' },
];

const SURGERY_TYPES: Array<{ id: SurgeryType; label: string }> = [
  { id: 'laparoscopy', label: 'Laparoscopy' },
  { id: 'laparotomy', label: 'Laparotomy' },
  { id: 'excision', label: 'Excision' },
  { id: 'ablation', label: 'Ablation' },
  { id: 'hysterectomy', label: 'Hysterectomy' },
  { id: 'oophorectomy', label: 'Oophorectomy' },
  { id: 'other', label: 'Other' },
];

export function MedicationsScreen() {
  const [meds, setMeds] = useState<MedicationLog[]>([]);
  const [surgeries, setSurgeries] = useState<SurgeryLog[]>([]);
  const [activeTab, setActiveTab] = useState<'meds' | 'surgeries'>('meds');
  const [showAddMed, setShowAddMed] = useState(false);
  const [showAddSurgery, setShowAddSurgery] = useState(false);

  // Med form
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFreq, setMedFreq] = useState('');
  const [medCat, setMedCat] = useState<MedicationCategory>('nsaid');

  // Surgery form
  const [surgProcedure, setSurgProcedure] = useState('');
  const [surgDate, setSurgDate] = useState('');
  const [surgSurgeon, setSurgSurgeon] = useState('');
  const [surgHospital, setSurgHospital] = useState('');
  const [surgType, setSurgType] = useState<SurgeryType>('laparoscopy');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const db = getDB();
    setMeds(await db.medicationLogs.orderBy('startDate').reverse().toArray());
    setSurgeries(await db.surgeryLogs.orderBy('date').reverse().toArray());
  };

  const addMedication = async () => {
    if (!medName.trim()) return;
    const db = getDB();
    await db.medicationLogs.put({
      id: crypto.randomUUID(),
      name: medName,
      dosage: medDosage,
      frequency: medFreq,
      startDate: new Date().toISOString().split('T')[0],
      isActive: true,
      category: medCat,
    });
    setMedName('');
    setMedDosage('');
    setMedFreq('');
    setShowAddMed(false);
    loadData();
  };

  const addSurgery = async () => {
    if (!surgProcedure.trim() || !surgDate) return;
    const db = getDB();
    await db.surgeryLogs.put({
      id: crypto.randomUUID(),
      procedure: surgProcedure,
      date: surgDate,
      surgeon: surgSurgeon || undefined,
      hospital: surgHospital || undefined,
      type: surgType,
    });
    setSurgProcedure('');
    setSurgDate('');
    setSurgSurgeon('');
    setSurgHospital('');
    setShowAddSurgery(false);
    loadData();
  };

  const toggleMedActive = async (med: MedicationLog) => {
    const db = getDB();
    await db.medicationLogs.update(med.id, { isActive: !med.isActive });
    loadData();
  };

  return (
    <div className="space-y-6 pb-8">
      <h2 className="text-3xl font-semibold text-white font-['Cormorant_Garamond'] tracking-tight">
        Treatment Log
      </h2>

      {/* Tabs */}
      <div className="flex bg-white/4 border border-white/8 rounded-2xl p-1">
        <button
          onClick={() => setActiveTab('meds')}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'meds'
              ? 'bg-gradient-to-br from-rose-400 to-amber-400 text-[#1A0E13] shadow-md shadow-rose-400/30'
              : 'text-white/55 hover:text-white/85'
          }`}
        >
          <Pill className="w-4 h-4" strokeWidth={2} /> Medications
        </button>
        <button
          onClick={() => setActiveTab('surgeries')}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'surgeries'
              ? 'bg-gradient-to-br from-rose-400 to-amber-400 text-[#1A0E13] shadow-md shadow-rose-400/30'
              : 'text-white/55 hover:text-white/85'
          }`}
        >
          <Stethoscope className="w-4 h-4" strokeWidth={2} /> Surgeries
        </button>
      </div>

      {/* Medications */}
      {activeTab === 'meds' && (
        <div className="space-y-3">
          <Button
            onClick={() => setShowAddMed(true)}
            variant="secondary"
            size="sm"
            className="w-full"
          >
            <Plus className="w-4 h-4" /> Add Medication
          </Button>

          {meds.length === 0 ? (
            <div className="text-center py-16 bg-white/4 rounded-3xl border border-white/8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400/20 to-fuchsia-400/20 border border-violet-300/15 flex items-center justify-center mx-auto mb-3">
                <Pill className="w-6 h-6 text-violet-300" strokeWidth={1.6} />
              </div>
              <p className="text-white/55 text-sm">No medications logged yet.</p>
            </div>
          ) : (
            meds.map((med) => (
              <div
                key={med.id}
                className="p-4 rounded-2xl bg-white/4 border border-white/8"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-sm">{med.name}</h4>
                    <p className="text-xs text-white/55 mt-0.5">
                      {med.dosage} · {med.frequency}
                    </p>
                    <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider">
                      Started {med.startDate} · {med.category}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleMedActive(med)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer flex-shrink-0 ${
                      med.isActive
                        ? 'bg-gradient-to-br from-rose-400 to-amber-400 text-[#1A0E13]'
                        : 'bg-white/8 text-white/55 border border-white/10'
                    }`}
                  >
                    {med.isActive ? 'Active' : 'Stopped'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Surgeries */}
      {activeTab === 'surgeries' && (
        <div className="space-y-3">
          <Button
            onClick={() => setShowAddSurgery(true)}
            variant="secondary"
            size="sm"
            className="w-full"
          >
            <Plus className="w-4 h-4" /> Add Surgery
          </Button>

          {surgeries.length === 0 ? (
            <div className="text-center py-16 bg-white/4 rounded-3xl border border-white/8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400/20 to-amber-400/20 border border-rose-300/15 flex items-center justify-center mx-auto mb-3">
                <Stethoscope className="w-6 h-6 text-rose-300" strokeWidth={1.6} />
              </div>
              <p className="text-white/55 text-sm">No surgeries logged yet.</p>
            </div>
          ) : (
            surgeries.map((surg) => (
              <div
                key={surg.id}
                className="p-4 rounded-2xl bg-white/4 border border-white/8"
              >
                <h4 className="font-semibold text-white text-sm">{surg.procedure}</h4>
                <p className="text-xs text-white/55 mt-0.5">
                  {surg.date} · {surg.type}
                </p>
                {(surg.surgeon || surg.hospital) && (
                  <p className="text-[10px] text-white/40 mt-1">
                    {[surg.surgeon, surg.hospital].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Med Modal */}
      <Modal open={showAddMed} onClose={() => setShowAddMed(false)} title="Add Medication">
        <div className="space-y-4">
          <input
            value={medName}
            onChange={(e) => setMedName(e.target.value)}
            placeholder="Medication name"
            className="w-full px-4 py-3 rounded-xl border border-white/10 text-sm bg-white/6 text-white placeholder:text-white/35 focus:outline-none focus:border-rose-400/50"
          />
          <input
            value={medDosage}
            onChange={(e) => setMedDosage(e.target.value)}
            placeholder="Dosage (e.g., 400mg)"
            className="w-full px-4 py-3 rounded-xl border border-white/10 text-sm bg-white/6 text-white placeholder:text-white/35 focus:outline-none focus:border-rose-400/50"
          />
          <input
            value={medFreq}
            onChange={(e) => setMedFreq(e.target.value)}
            placeholder="Frequency (e.g., Twice daily)"
            className="w-full px-4 py-3 rounded-xl border border-white/10 text-sm bg-white/6 text-white placeholder:text-white/35 focus:outline-none focus:border-rose-400/50"
          />
          <div className="flex flex-wrap gap-2">
            {MED_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setMedCat(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer ${
                  medCat === c.id
                    ? 'bg-gradient-to-br from-rose-400 to-amber-400 text-[#1A0E13]'
                    : 'bg-white/6 text-white/65 border border-white/8'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <Button onClick={addMedication} className="w-full">
            Save Medication
          </Button>
        </div>
      </Modal>

      {/* Add Surgery Modal */}
      <Modal open={showAddSurgery} onClose={() => setShowAddSurgery(false)} title="Add Surgery">
        <div className="space-y-4">
          <input
            value={surgProcedure}
            onChange={(e) => setSurgProcedure(e.target.value)}
            placeholder="Procedure name"
            className="w-full px-4 py-3 rounded-xl border border-white/10 text-sm bg-white/6 text-white placeholder:text-white/35 focus:outline-none focus:border-rose-400/50"
          />
          <input
            type="date"
            value={surgDate}
            onChange={(e) => setSurgDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-white/10 text-sm bg-white/6 text-white placeholder:text-white/35 focus:outline-none focus:border-rose-400/50"
          />
          <input
            value={surgSurgeon}
            onChange={(e) => setSurgSurgeon(e.target.value)}
            placeholder="Surgeon (optional)"
            className="w-full px-4 py-3 rounded-xl border border-white/10 text-sm bg-white/6 text-white placeholder:text-white/35 focus:outline-none focus:border-rose-400/50"
          />
          <input
            value={surgHospital}
            onChange={(e) => setSurgHospital(e.target.value)}
            placeholder="Hospital (optional)"
            className="w-full px-4 py-3 rounded-xl border border-white/10 text-sm bg-white/6 text-white placeholder:text-white/35 focus:outline-none focus:border-rose-400/50"
          />
          <div className="flex flex-wrap gap-2">
            {SURGERY_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSurgType(t.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer ${
                  surgType === t.id
                    ? 'bg-gradient-to-br from-rose-400 to-amber-400 text-[#1A0E13]'
                    : 'bg-white/6 text-white/65 border border-white/8'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Button onClick={addSurgery} className="w-full">
            Save Surgery
          </Button>
        </div>
      </Modal>
    </div>
  );
}
