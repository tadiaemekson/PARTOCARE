import React, { useState } from 'react';
import { Plus, Minus, FilePlus2, CheckCircle2 } from 'lucide-react';
import type { PartogramEntry } from '../services/db';

interface ObservationFormProps {
  onSave: (entry: Omit<PartogramEntry, 'id' | 'partogram_id'>) => Promise<void>;
  onCancel: () => void;
}

export const ObservationForm: React.FC<ObservationFormProps> = ({ onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Tactical parameters
  const [dilation, setDilation] = useState(5); // 4 to 10
  const [fhr, setFhr] = useState(140); // 80 to 200
  const [contractions, setContractions] = useState(3); // 1 to 5
  const [duration, setDuration] = useState(30); // 10 to 60 sec
  const [temp, setTemp] = useState(37.0); // 36 to 40
  const [pulse, setPulse] = useState(80); // 60 to 140
  const [bpSys, setBpSys] = useState(120); // 80 to 180
  const [bpDia, setBpDia] = useState(80); // 50 to 120
  const [station, setStation] = useState(3); // 5 to 0 (5/5 to 0/5 presentation)
  const [membranes, setMembranes] = useState<'INTACT' | 'RUPTURED'>('INTACT');
  const [fluid, setFluid] = useState<'CLEAR' | 'MECONIUM' | 'BLOOD' | 'NONE'>('NONE');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        observation_time: new Date().toISOString(),
        cervical_dilation: dilation,
        fetal_heart_rate: fhr,
        contractions_per_10min: contractions,
        contraction_duration_secs: duration,
        maternal_temperature: temp,
        maternal_pulse: pulse,
        systolic_bp: bpSys,
        diastolic_bp: bpDia,
        fetal_station: station,
        membrane_status: membranes,
        amniotic_fluid_status: membranes === 'RUPTURED' ? fluid : 'NONE',
        notes
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onCancel();
      }, 1000);
    } catch (err) {
      console.error('Failed to log entry:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {success ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
          <div className="h-16 w-16 bg-status-green/10 rounded-full flex items-center justify-center text-status-green border border-status-green/30 animate-pulse">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h3 className="text-base font-bold text-white">Observation Enregistrée</h3>
          <p className="text-xs text-brand-muted">Le tracé graphique a été recalculé et actualisé.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* LEFT COLUMN: Clinical settings */}
            <div className="space-y-5">
              
              {/* 1. Cervical Dilation */}
              <div className="p-4 bg-[#0a0f19] border border-brand-border/40 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Dilatation Cervicale</label>
                  <span className="text-lg font-black text-status-red font-mono">{dilation} cm</span>
                </div>
                <div className="flex justify-between items-center space-x-3">
                  <button type="button" onClick={() => setDilation(d => Math.max(4, d - 1))} className="h-12 w-12 rounded-xl bg-slate-900 border border-brand-border/30 flex items-center justify-center hover:bg-slate-800 text-white font-bold transition">
                    <Minus className="h-5 w-5" />
                  </button>
                  <input type="range" min="4" max="10" step="1" value={dilation} onChange={e => setDilation(Number(e.target.value))} className="flex-1 accent-status-red h-1 bg-slate-950 rounded-lg cursor-pointer" />
                  <button type="button" onClick={() => setDilation(d => Math.min(10, d + 1))} className="h-12 w-12 rounded-xl bg-slate-900 border border-brand-border/30 flex items-center justify-center hover:bg-slate-800 text-white font-bold transition">
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* 2. Fetal Heart Rate (FCF) */}
              <div className="p-4 bg-[#0a0f19] border border-brand-border/40 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Fréquence Cardiaque Fœtale</label>
                  <span className="text-lg font-black text-status-green font-mono">{fhr} bpm</span>
                </div>
                <div className="flex justify-between items-center space-x-3">
                  <button type="button" onClick={() => setFhr(f => Math.max(80, f - 5))} className="h-12 w-12 rounded-xl bg-slate-900 border border-brand-border/30 flex items-center justify-center hover:bg-slate-800 text-white font-bold transition">
                    <Minus className="h-5 w-5" />
                  </button>
                  <input type="range" min="80" max="200" step="5" value={fhr} onChange={e => setFhr(Number(e.target.value))} className="flex-1 accent-status-green h-1 bg-slate-950 rounded-lg cursor-pointer" />
                  <button type="button" onClick={() => setFhr(f => Math.min(200, f + 5))} className="h-12 w-12 rounded-xl bg-slate-900 border border-brand-border/30 flex items-center justify-center hover:bg-slate-800 text-white font-bold transition">
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* 3. Contractions per 10min */}
              <div className="p-4 bg-[#0a0f19] border border-brand-border/40 rounded-xl space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">Contractions / 10 min</label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setContractions(num)}
                      className={`h-12 rounded-xl border text-sm font-bold transition ${contractions === num ? 'bg-status-orange text-white border-status-orange' : 'bg-slate-900 border-brand-border/20 text-brand-muted hover:bg-slate-800'}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Contractions Duration */}
              <div className="p-4 bg-[#0a0f19] border border-brand-border/40 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Durée Moyenne des Contractions</label>
                  <span className="text-sm font-bold text-white font-mono">{duration} secondes</span>
                </div>
                <div className="flex items-center space-x-3">
                  <input type="range" min="10" max="60" step="5" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full accent-status-orange h-1 bg-slate-950 rounded-lg cursor-pointer" />
                </div>
                <div className="flex justify-between text-[10px] text-brand-muted font-bold pt-1">
                  <span className="text-yellow-300">Faible (&lt;20s)</span>
                  <span className="text-orange-500">Moyenne (20-40s)</span>
                  <span className="text-red-500">Forte (&gt;40s)</span>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Presentation, fluids, and maternal constants */}
            <div className="space-y-5">
              
              {/* 5. Presentation Height (Station) */}
              <div className="p-4 bg-[#0a0f19] border border-brand-border/40 rounded-xl space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">Hauteur de la Présentation (Descente)</label>
                <div className="grid grid-cols-6 gap-1">
                  {[5, 4, 3, 2, 1, 0].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStation(s)}
                      className={`h-11 rounded-lg border text-xs font-bold transition flex flex-col items-center justify-center ${station === s ? 'bg-sky-500 text-white border-sky-500' : 'bg-slate-900 border-brand-border/20 text-brand-muted hover:bg-slate-800'}`}
                    >
                      <span>{s}/5</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Membranes & Fluids */}
              <div className="p-4 bg-[#0a0f19] border border-brand-border/40 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-brand-muted mb-2">État des Membranes</label>
                    <div className="flex space-x-1.5 bg-slate-950 p-1 rounded-lg">
                      {['INTACT', 'RUPTURED'].map(status => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setMembranes(status as any)}
                          className={`flex-1 py-2 text-[10px] font-bold rounded-md transition ${membranes === status ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                          {status === 'INTACT' ? 'Intactes' : 'Rompues'}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {membranes === 'RUPTURED' && (
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-brand-muted mb-2">Liquide Amniotique</label>
                      <select value={fluid} onChange={e => setFluid(e.target.value as any)} className="w-full px-2.5 py-1.5 bg-slate-900 border border-brand-border/40 rounded-lg text-white text-[10px] focus:outline-none focus:border-status-orange">
                        <option value="CLEAR">Clair</option>
                        <option value="MECONIUM">Méconium (Épais)</option>
                        <option value="BLOOD">Sanglant</option>
                        <option value="NONE">Aucun / Sec</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* 7. Maternal Vitals */}
              <div className="p-4 bg-[#0a0f19] border border-brand-border/40 rounded-xl space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-brand-border/10 pb-1.5">Constantes Maternelles</label>
                
                {/* Temp & Pulse */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-brand-muted flex justify-between">
                      <span>Température</span>
                      <span className="text-white font-mono">{temp.toFixed(1)} °C</span>
                    </span>
                    <div className="flex items-center space-x-1">
                      <button type="button" onClick={() => setTemp(t => Math.max(35, t - 0.1))} className="p-1 bg-slate-900 border border-brand-border/20 rounded text-white">-</button>
                      <input type="range" min="35" max="41" step="0.1" value={temp} onChange={e => setTemp(Number(e.target.value))} className="flex-1 accent-amber-500 h-1 bg-slate-950 rounded-lg" />
                      <button type="button" onClick={() => setTemp(t => Math.min(41, t + 0.1))} className="p-1 bg-slate-900 border border-brand-border/20 rounded text-white">+</button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-brand-muted flex justify-between">
                      <span>Pouls Maternel</span>
                      <span className="text-white font-mono">{pulse} bpm</span>
                    </span>
                    <div className="flex items-center space-x-1">
                      <button type="button" onClick={() => setPulse(p => Math.max(50, p - 2))} className="p-1 bg-slate-900 border border-brand-border/20 rounded text-white">-</button>
                      <input type="range" min="50" max="150" step="2" value={pulse} onChange={e => setPulse(Number(e.target.value))} className="flex-1 accent-purple-500 h-1 bg-slate-950 rounded-lg" />
                      <button type="button" onClick={() => setPulse(p => Math.min(150, p + 2))} className="p-1 bg-slate-900 border border-brand-border/20 rounded text-white">+</button>
                    </div>
                  </div>
                </div>

                {/* Blood pressure */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-brand-muted flex justify-between">
                    <span>Tension Artérielle</span>
                    <span className="text-white font-mono font-bold text-xs">{bpSys} / {bpDia} mmHg</span>
                  </span>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] font-bold text-slate-500">Sys</span>
                      <input type="range" min="70" max="200" step="5" value={bpSys} onChange={e => setBpSys(Number(e.target.value))} className="flex-1 accent-emerald-500 h-1 bg-slate-950 rounded-lg cursor-pointer" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] font-bold text-slate-500">Dia</span>
                      <input type="range" min="40" max="130" step="5" value={bpDia} onChange={e => setBpDia(Number(e.target.value))} className="flex-1 accent-emerald-500 h-1 bg-slate-950 rounded-lg cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Notes & Submissions */}
          <div className="space-y-3 pt-3 border-t border-brand-border/20">
            <div>
              <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Observations Cliniques / Notes complémentaires</label>
              <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Saisir des traitements administrés ou commentaires cliniques..." className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white text-xs placeholder-slate-700 focus:outline-none focus:border-status-orange" />
            </div>
            
            <div className="flex items-center space-x-4 pt-1.5">
              <button type="button" onClick={onCancel} className="flex-1 py-3 border border-brand-border/40 hover:bg-slate-800 text-brand-muted hover:text-white rounded-xl text-xs font-bold transition uppercase tracking-wider">
                Annuler
              </button>
              
              <button type="submit" disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-status-orange to-[#f43f5e] hover:brightness-110 active:scale-95 text-white font-bold rounded-xl text-xs transition shadow-lg flex items-center justify-center uppercase tracking-wider">
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FilePlus2 className="mr-1.5 h-4.5 w-4.5" />
                    Enregistrer Constants
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </form>
  );
};
