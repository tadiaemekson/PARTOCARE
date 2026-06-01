import React from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceArea, ReferenceLine 
} from 'recharts';
import type { PartogramEntry, Alert } from '../services/db';
import { ShieldAlert, Info } from 'lucide-react';

interface PartogramChartProps {
  entries: PartogramEntry[];
  alerts: Alert[];
  startedAt: string;
}

export const PartogramChart: React.FC<PartogramChartProps> = ({ entries, alerts, startedAt }) => {
  
  // 1. Process data for Recharts
  const processChartData = () => {
    if (entries.length === 0) return [];
    
    const startTimeMs = new Date(startedAt).getTime();
    
    return entries.map(entry => {
      const entryTimeMs = new Date(entry.observation_time).getTime();
      const elapsedHours = (entryTimeMs - startTimeMs) / (1000 * 60 * 60);
      
      // Calculate WHO Alert Line values (starts at 4cm at T=0, progresses at 1cm/hour)
      const alertLineValue = Math.min(10, 4 + elapsedHours);
      
      // Calculate WHO Action Line values (parallel to Alert Line, shifted 4 hours to the right)
      let actionLineValue: number | null = null;
      if (elapsedHours >= 4) {
        actionLineValue = Math.min(10, 4 + (elapsedHours - 4));
      }

      // Format time label for the X axis (hours elapsed since starting)
      const label = `T+${elapsedHours.toFixed(1)}h`;

      return {
        ...entry,
        elapsedHours,
        label,
        // Dilation & Descent values
        dilation: entry.cervical_dilation,
        descent: entry.fetal_station, // 5 to 0 presentation
        // WHO Reference curves
        alertLine: alertLineValue,
        actionLine: actionLineValue,
        // Fetal Heart Rate
        fhr: entry.fetal_heart_rate,
        // Contractions
        contractions: entry.contractions_per_10min,
        duration: entry.contraction_duration_secs,
        // Vitals
        temp: entry.maternal_temperature,
        pulse: entry.maternal_pulse,
        bpSys: entry.systolic_bp,
        bpDia: entry.diastolic_bp,
      };
    });
  };

  const chartData = processChartData();

  const activeRedAlerts = alerts.filter(a => a.alert_level === 'RED' && !a.resolved_at);
  const activeOrangeAlerts = alerts.filter(a => a.alert_level === 'ORANGE' && !a.resolved_at);

  // Helper to color-code contraction duration bars
  const getContractionColor = (duration: number) => {
    if (duration < 20) return '#fde047';      // Yellow - Weak (<20s)
    if (duration <= 40) return '#f97316';     // Orange - Moderate (20-40s)
    return '#ef4444';                         // Red - Strong (>40s)
  };

  // Custom tooltips to render medical readings nicely
  const FhrTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-panel border border-brand-border/60 p-3 rounded-lg text-xs">
          <p className="font-bold text-slate-400">{data.label}</p>
          <p className="mt-1 text-white font-semibold">FCF : <span className="text-status-green font-mono">{data.fhr} bpm</span></p>
          <p className="text-[10px] text-brand-muted mt-0.5">Obs. enregistrée à {new Date(data.observation_time).toLocaleTimeString('fr-FR')}</p>
        </div>
      );
    }
    return null;
  };

  const PartogramTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-panel border border-brand-border/60 p-3 rounded-lg text-xs space-y-1">
          <p className="font-bold text-slate-400">{data.label}</p>
          <p className="text-white font-semibold">Dilatation : <span className="text-status-red font-mono">{data.dilation} cm</span></p>
          <p className="text-white font-semibold">Descente : <span className="text-sky-400 font-mono">{data.descent}/5 (Axe Y Inversé)</span></p>
          {data.alertLine !== undefined && <p className="text-yellow-400 text-[10px]">OMS Alerte : {data.alertLine.toFixed(1)} cm</p>}
          {data.actionLine !== null && <p className="text-orange-500 text-[10px]">OMS Action : {data.actionLine.toFixed(1)} cm</p>}
        </div>
      );
    }
    return null;
  };

  const ContractionTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-panel border border-brand-border/60 p-3 rounded-lg text-xs space-y-1">
          <p className="font-bold text-slate-400">{data.label}</p>
          <p className="text-white font-semibold">Contractions : <span className="text-status-orange font-mono">{data.contractions} en 10 min</span></p>
          <p className="text-white font-semibold">Durée moyenne : <span className="font-mono text-white">{data.duration} sec</span></p>
          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold text-black mt-1`} style={{ backgroundColor: getContractionColor(data.duration) }}>
            {data.duration < 20 ? 'FAIBLE (<20s)' : data.duration <= 40 ? 'MODÉRÉE (20-40s)' : 'FORTE (>40s)'}
          </span>
        </div>
      );
    }
    return null;
  };

  if (entries.length === 0) {
    return (
      <div className="glass-panel border border-brand-border/30 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3 h-96">
        <Info className="h-10 w-10 text-brand-muted" />
        <h4 className="text-sm font-bold text-white">Aucune donnée clinique saisie</h4>
        <p className="text-xs text-brand-muted max-w-sm">Utilisez le panneau de saisie clinique pour enregistrer le premier toucher vaginal (dilatation, rythme cardiaque fœtal) et tracer le partogramme.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Active Alerts Banner */}
      {(activeRedAlerts.length > 0 || activeOrangeAlerts.length > 0) && (
        <div className="space-y-2">
          {activeRedAlerts.map(alert => (
            <div key={alert.id} className="p-3.5 bg-status-red/10 border border-status-red/30 text-status-red rounded-xl flex items-start space-x-3 glow-red animate-alert-pulse">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Alerte Clinique Critique (ROUGE)</h4>
                <p className="text-xs text-red-200 mt-1 leading-normal">{alert.alert_message}</p>
              </div>
            </div>
          ))}
          {activeOrangeAlerts.map(alert => (
            <div key={alert.id} className="p-3.5 bg-status-orange/10 border border-status-orange/30 text-status-orange rounded-xl flex items-start space-x-3 glow-orange">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Surveillance Renforcée (ORANGE)</h4>
                <p className="text-xs text-orange-200 mt-1 leading-normal">{alert.alert_message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SYNCED CHART 1: Fetal Heart Rate (FCF) */}
      <div className="glass-panel border border-brand-border/40 rounded-2xl p-5 space-y-3">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Fréquence Cardiaque Fœtale (bpm)</h3>
          <span className="text-[10px] text-status-green bg-status-green/10 border border-status-green/30 px-2 py-0.5 rounded font-bold">Zone Normale: 110 - 160 bpm</span>
        </div>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} syncId="partogram" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis domain={[80, 200]} stroke="#94a3b8" fontSize={10} tickLine={false} ticks={[80, 100, 110, 120, 140, 160, 180, 200]} />
              <Tooltip content={<FhrTooltip />} />
              
              {/* Highlight safe zone 110-160 bpm */}
              <ReferenceArea y1={110} y2={160} fill="#10b981" fillOpacity={0.06} />
              <ReferenceLine y={110} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.3} />
              <ReferenceLine y={160} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.3} />

              <Area type="monotone" dataKey="fhr" stroke="#10b981" strokeWidth={2} fill="rgba(16, 185, 129, 0.05)" activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SYNCED CHART 2: Dilatation & Descente (OMS Curves) */}
      <div className="glass-panel border border-brand-border/40 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 px-2">Dilatation Cervicale & Descente Cervicale</h3>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} syncId="partogram" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} />
              {/* Left Y-axis: Dilatation (4 to 10 cm) */}
              <YAxis yAxisId="left" domain={[4, 10]} stroke="#ef4444" fontSize={10} tickLine={false} label={{ value: 'Dilatation (cm)', angle: -90, position: 'insideLeft', fill: '#ef4444', style: { textAnchor: 'middle', fontSize: 10, fontWeight: 'bold' } }} />
              {/* Right Y-axis: Descente de la présentation (5/5 to 0/5) - Inverted for bassin simulator */}
              <YAxis yAxisId="right" orientation="right" domain={[0, 5]} reversed={true} stroke="#38bdf8" fontSize={10} tickLine={false} label={{ value: 'Descente (/5)', angle: 90, position: 'insideRight', fill: '#38bdf8', style: { textAnchor: 'middle', fontSize: 10, fontWeight: 'bold' } }} />
              
              <Tooltip content={<PartogramTooltip />} />
              <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{ fontSize: 10 }} />
              
              {/* WHO Reference curves */}
              <Line yAxisId="left" type="linear" dataKey="alertLine" name="Ligne d'Alerte OMS" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 5" dot={false} connectNulls />
              <Line yAxisId="left" type="linear" dataKey="actionLine" name="Ligne d'Action OMS" stroke="#ea580c" strokeWidth={1.5} strokeDasharray="5 5" dot={false} connectNulls />

              {/* Dilatation (X) - Left axis */}
              <Line yAxisId="left" type="monotone" dataKey="dilation" name="Dilatation Cervicale (X)" stroke="#ef4444" strokeWidth={2.5} dot={{ stroke: '#ef4444', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              
              {/* Descent (O) - Right axis */}
              <Line yAxisId="right" type="monotone" dataKey="descent" name="Descente Tête (O)" stroke="#38bdf8" strokeWidth={2} strokeDasharray="3 3" dot={{ stroke: '#38bdf8', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SYNCED CHART 3: Contractions & Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Contractions */}
        <div className="glass-panel border border-brand-border/40 rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Contractions (en 10 min)</h3>
            <div className="flex space-x-2 text-[8px] font-bold">
              <span className="flex items-center"><span className="w-2 h-2 rounded-sm bg-yellow-300 mr-1" /> &lt;20s</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-sm bg-orange-500 mr-1" /> 20-40s</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-sm bg-red-500 mr-1" /> &gt;40s</span>
            </div>
          </div>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} syncId="partogram" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 5]} stroke="#94a3b8" fontSize={10} tickLine={false} ticks={[0, 1, 2, 3, 4, 5]} />
                <Tooltip content={<ContractionTooltip />} />
                <Bar dataKey="contractions" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getContractionColor(entry.duration)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Maternal Vitals (Temp & Pulse) */}
        <div className="glass-panel border border-brand-border/40 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 px-2">Constantes Maternelles</h3>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} syncId="partogram" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis yAxisId="temp" domain={[36, 40]} stroke="#f59e0b" fontSize={10} tickLine={false} />
                <YAxis yAxisId="pulse" orientation="right" domain={[60, 120]} stroke="#a855f7" fontSize={10} tickLine={false} />
                <Tooltip />
                <Legend verticalAlign="top" height={28} iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                
                <Line yAxisId="temp" type="monotone" dataKey="temp" name="Température (°C)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="pulse" type="monotone" dataKey="pulse" name="Pouls (bpm)" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
