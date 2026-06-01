import React from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { BarChart2, TrendingUp, ShieldCheck, HeartPulse, Clock } from 'lucide-react';

export const StatsPage: React.FC = () => {

  // Mock static aggregates matching Cameroun's clinical indicators
  const monthlyData = [
    { name: 'Jan', accouchements: 24, cesariennes: 3, transferts: 2 },
    { name: 'Fév', accouchements: 28, cesariennes: 4, transferts: 1 },
    { name: 'Mar', accouchements: 35, cesariennes: 5, transferts: 3 },
    { name: 'Avr', accouchements: 32, cesariennes: 3, transferts: 2 },
    { name: 'Mai', accouchements: 41, cesariennes: 6, transferts: 4 },
    { name: 'Juin', accouchements: 45, cesariennes: 5, transferts: 3 }
  ];

  const reasonData = [
    { name: 'Détresse Fœtale', value: 45, color: '#ef4444' }, // Red
    { name: 'Stagnation / Dystocie', value: 25, color: '#f97316' }, // Orange
    { name: 'Tension (Pré-éclampsie)', value: 20, color: '#f59e0b' }, // Yellow
    { name: 'Fièvre / Infection', value: 10, color: '#38bdf8' } // Blue
  ];

  const durationData = [
    { month: 'Jan', avgMin: 42 },
    { month: 'Fév', avgMin: 38 },
    { month: 'Mar', avgMin: 35 },
    { month: 'Avr', avgMin: 32 },
    { month: 'Mai', avgMin: 29 },
    { month: 'Juin', avgMin: 27 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center">
          <BarChart2 className="h-7 w-7 mr-2.5 text-status-orange" />
          Rapports Analytiques du District
        </h1>
        <p className="text-sm text-brand-muted mt-1">Évaluation des indicateurs cliniques et performance logistique</p>
      </div>

      {/* Grid: Indicators Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel border border-brand-border/40 rounded-2xl p-5 flex items-center space-x-4">
          <div className="p-3.5 bg-status-green/10 text-status-green rounded-xl"><ShieldCheck className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-bold text-brand-muted uppercase tracking-wider">Accouchements Assistés</p>
            <h4 className="text-2xl font-black text-white mt-1">208</h4>
            <span className="text-[10px] text-status-green flex items-center font-bold mt-1"><TrendingUp className="h-3 w-3 mr-0.5" /> +15% ce trimestre</span>
          </div>
        </div>

        <div className="glass-panel border border-brand-border/40 rounded-2xl p-5 flex items-center space-x-4">
          <div className="p-3.5 bg-status-orange/10 text-status-orange rounded-xl"><HeartPulse className="h-6 w-6 animate-pulse" /></div>
          <div>
            <p className="text-xs font-bold text-brand-muted uppercase tracking-wider">Mortalité Maternelle</p>
            <h4 className="text-2xl font-black text-white mt-1">0 <span className="text-xs font-medium text-brand-muted">décès</span></h4>
            <span className="text-[10px] text-status-green font-bold mt-1">Objectif OMM0 Atteint</span>
          </div>
        </div>

        <div className="glass-panel border border-brand-border/40 rounded-2xl p-5 flex items-center space-x-4">
          <div className="p-3.5 bg-rose-500/10 text-rose-400 rounded-xl"><BarChart2 className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-bold text-brand-muted uppercase tracking-wider">Taux de Césarienne</p>
            <h4 className="text-2xl font-black text-white mt-1">11.5 %</h4>
            <span className="text-[10px] text-brand-muted block mt-1">Moyenne OMS recommandée: 10-15%</span>
          </div>
        </div>

        <div className="glass-panel border border-brand-border/40 rounded-2xl p-5 flex items-center space-x-4">
          <div className="p-3.5 bg-indigo-500/10 text-indigo-400 rounded-xl"><Clock className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-bold text-brand-muted uppercase tracking-wider">Temps Moyen d'Évacuation</p>
            <h4 className="text-2xl font-black text-white mt-1">34 min</h4>
            <span className="text-[10px] text-status-green flex items-center font-bold mt-1"><TrendingUp className="h-3 w-3 mr-0.5" /> -22% vs l'an dernier</span>
          </div>
        </div>
      </div>

      {/* Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Volume Monthly Accouchements */}
        <div className="glass-panel border border-brand-border/40 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white px-2">Évolution des Naissances &amp; Actes Obstétricaux</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #20293a', borderRadius: '8px' }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="accouchements" name="Voie Basse" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cesariennes" name="Césariennes" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="transferts" name="Transferts" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Reasons Pie chart */}
        <div className="glass-panel border border-brand-border/40 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white px-2">Distribution Clinique des Causes de Transfert</h3>
          <div className="h-64 w-full flex flex-col sm:flex-row items-center justify-center">
            <div className="h-full w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reasonData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {reasonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legends */}
            <div className="w-full sm:w-1/2 space-y-2.5 px-4">
              {reasonData.map(entry => (
                <div key={entry.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center">
                    <span className="w-2.5 h-2.5 rounded-sm mr-2" style={{ backgroundColor: entry.color }} />
                    <span className="text-brand-muted">{entry.name}</span>
                  </span>
                  <span className="font-bold text-white font-mono">{entry.value} %</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 3: Duration trend Area */}
        <div className="glass-panel border border-brand-border/40 rounded-2xl p-5 space-y-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-white px-2">Tendance Logistique: Temps de Transit Moyen (minutes)</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={durationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #20293a', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="avgMin" name="Minutes" stroke="#38bdf8" strokeWidth={2} fill="rgba(56, 189, 248, 0.05)" activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
