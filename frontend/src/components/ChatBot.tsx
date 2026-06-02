import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { 
  MessageSquare, X, Send, Bot, User, Sparkles, 
  HelpCircle, BarChart2, UserCheck, ShieldAlert 
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Bonjour ! Je suis PartoAssist, votre assistant clinique de maternité. Comment puis-je vous aider à surveiller vos patientes aujourd'hui ?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate clinical cognitive parsing latency
    setTimeout(async () => {
      const responseText = await parseClinicalQuery(text);
      const botMsg: Message = {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'bot',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 800);
  };

  const parseClinicalQuery = async (query: string): Promise<string> => {
    const cleanQuery = query.toLowerCase().trim();

    // 1. Greet check
    if (cleanQuery.match(/^(bonjour|salut|hello|hi|hey|bonsoir)/)) {
      return "Bonjour ! Comment se passe votre garde ? Vous pouvez me demander d'analyser une patiente active (ex: \"Florence Ebanda\" ou \"Marie Ngo\"), de vous donner les statistiques actuelles de la maternité, ou de lister les seuils cliniques d'alerte du partogramme.";
    }

    // 2. Stats check
    if (cleanQuery.match(/(stat|chiffre|rapport|cas|maternité|garde)/)) {
      try {
        const activeLabours = await db.labours.where('labour_status').equals('ACTIVE').toArray();
        const pendingRefs = await db.referrals.where('referral_status').equals('PENDING').toArray();
        const transitRefs = await db.referrals.where('referral_status').equals('IN_TRANSIT').toArray();
        const alerts = await db.alerts.filter(a => !a.resolved_at).toArray();
        
        const redAlerts = alerts.filter(a => a.alert_level === 'RED').length;
        const orangeAlerts = alerts.filter(a => a.alert_level === 'ORANGE').length;

        return `📊 **Rapport de Situation Actuel :**\n\n` +
               `• **Travails actifs :** ${activeLabours.length} patientes en cours de surveillance.\n` +
               `• **Alertes non résolues :** ${alerts.length} au total (${redAlerts} critiques 🔴, ${orangeAlerts} modérées 🟠).\n` +
               `• **Transferts / Références :** ${pendingRefs.length} en attente, ${transitRefs.length} en cours de transport.\n\n` +
               `*Détail des cas critiques :* demandez-moi d'analyser une patiente en particulier pour afficher ses constantes cliniques.`;
      } catch (err) {
        return "Désolé, je n'ai pas pu accéder aux dossiers locaux pour calculer les statistiques.";
      }
    }

    // 3. Clinical Guidelines / Alerts check
    if (cleanQuery.match(/(seuil|régle|alerte|critère|limite|norme|fcf|stagnation|temp|tension|bp)/)) {
      return `🔴 **Seuils d'Alerte Clinique (Recommandations OMS/PartoCare) :**\n\n` +
             `1. **Fréquence Cardiaque Fœtale (FCF) :**\n` +
             `   • Normal : 110 à 160 bpm.\n` +
             `   • Critique : < 110 bpm (bradycardie) ou > 160 bpm (tachycardie) 🔴.\n` +
             `2. **Dilation Cervicale (Stagnation) :**\n` +
             `   • Phase active : Progression minimale attendue de 1 cm / heure.\n` +
             `   • Alerte : Dilatation inchangée sur 2 examens espacés de 2 heures 🔴.\n` +
             `3. **Température Maternelle :**\n` +
             `   • Alerte : > 38.0 °C (suspecter chorioamnionite/infection) 🟠.\n` +
             `4. **Tension Artérielle Maternelle :**\n` +
             `   • Hypertension : TA >= 140/90 mmHg (risque de pré-éclampsie) 🟠.`;
    }

    // 4. Patient Specific Check (Florence Ebanda)
    if (cleanQuery.includes('florence') || cleanQuery.includes('ebanda')) {
      try {
        const patient = await db.patients.where('first_name').equalsIgnoreCase('florence').first();
        if (!patient) return "Je n'ai pas trouvé de patiente nommée Florence Ebanda dans la base locale.";
        
        const pregnancy = await db.pregnancies.where('patient_id').equals(patient.id).first();
        const labour = await db.labours.where('pregnancy_id').equals(pregnancy?.id || '').first();
        
        if (!labour || labour.labour_status !== 'ACTIVE') {
          return `Florence Ebanda (${patient.patient_code}) est enregistrée, mais sa session de travail est actuellement terminée ou inactive.`;
        }

        const partogram = await db.partograms.where('labour_id').equals(labour.id).first();
        let statusText = "Aucune observation clinique saisie pour le moment.";
        
        if (partogram) {
          const entries = await db.partogram_entries
            .where('partogram_id')
            .equals(partogram.id)
            .sortBy('observation_time');
            
          if (entries.length > 0) {
            const last = entries[entries.length - 1];
            statusText = `Dernier examen à ${new Date(last.observation_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} :\n` +
                         `• **Dilatation :** ${last.cervical_dilation} cm\n` +
                         `• **FCF :** ${last.fetal_heart_rate} bpm (Normal)\n` +
                         `• **Vives contractions :** ${last.contractions_per_10min} contractions par 10min (durée ${last.contraction_duration_secs}s)\n` +
                         `• **Tension :** ${last.systolic_bp}/${last.diastolic_bp} mmHg\n` +
                         `• **Présentation (station) :** ${last.fetal_station}/5 (Hauteur)\n` +
                         `• **Liquide amniotique :** ${last.membrane_status === 'RUPTURED' ? `Rompue (liquide ${last.amniotic_fluid_status})` : 'Intacte'}\n\n` +
                         `🟢 **Évaluation :** Progression fœto-maternelle normale et régulière. Poursuivre la surveillance horaire.`;
          }
        }
        return `👩‍⚕️ **Analyse Clinique - Florence Ebanda :**\n` +
               `• **Code :** ${patient.patient_code} | Âge Gestationnel : 39 SA (Bas risque)\n` +
               `• **Admission :** ${new Date(labour.admission_datetime).toLocaleDateString()} à ${new Date(labour.admission_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\n\n` +
               `${statusText}`;
      } catch (err) {
        return "Une erreur s'est produite lors de l'accès au dossier de Florence Ebanda.";
      }
    }

    // 5. Patient Specific Check (Marie Ngo)
    if (cleanQuery.includes('marie') || cleanQuery.includes('ngo')) {
      try {
        const patient = await db.patients.where('first_name').equalsIgnoreCase('marie').first();
        if (!patient) return "Je n'ai pas trouvé de patiente nommée Marie Ngo dans la base locale.";
        
        const pregnancy = await db.pregnancies.where('patient_id').equals(patient.id).first();
        const labour = await db.labours.where('pregnancy_id').equals(pregnancy?.id || '').first();
        
        if (!labour) return `Marie Ngo est enregistrée dans le système mais n'a pas de session de travail active.`;

        const partogram = await db.partograms.where('labour_id').equals(labour.id).first();
        let statusText = "Aucune constante enregistrée.";
        
        const alerts = await db.alerts
          .where('labour_id')
          .equals(labour.id)
          .and(a => !a.resolved_at)
          .toArray();

        const alertSummary = alerts.length > 0
          ? alerts.map(a => `   • **[${a.alert_level}] ${a.alert_type}** : ${a.alert_message}`).join('\n')
          : '   • Aucun signal d\'alerte actif.';

        const referral = await db.referrals.where('labour_id').equals(labour.id).first();

        if (partogram) {
          const entries = await db.partogram_entries
            .where('partogram_id')
            .equals(partogram.id)
            .sortBy('observation_time');
            
          if (entries.length > 0) {
            const last = entries[entries.length - 1];
            statusText = `Dernier examen clinique :\n` +
                         `• **Dilatation :** ${last.cervical_dilation} cm (Stagnante à 5.0 cm depuis 2h)\n` +
                         `• **FCF :** ${last.fetal_heart_rate} bpm (🔴 Bradycardie fœtale)\n` +
                         `• **Température :** ${last.maternal_temperature} °C (🟠 Fièvre suspecte d'infection)\n` +
                         `• **Tension :** ${last.systolic_bp}/${last.diastolic_bp} mmHg (🟠 Risque pré-éclampsie)\n` +
                         `• **Liquide amniotique :** Méconium épais 🔴\n\n`;
          }
        }

        let evalText = `🔴 **ÉVALUATION : Détresse fœtale aiguë avec stagnation de la dilatation.**\n\n`;
        if (referral) {
          const dest = await db.facilities.get(referral.destination_facility_id);
          evalText += `📢 **Statut Transfert :** Un dossier de référence d'urgence vers **${dest?.name || 'l\'Hôpital de Bafia'}** a été initié.\n` +
                      `• État de la demande : **${referral.referral_status}**\n` +
                      `${referral.ambulance_id ? `• Ambulance assignée : ${referral.ambulance_id}` : '• En attente de l\'assignation d\'une ambulance'}`;
        } else {
          evalText += `⚠️ **Alerte :** Aucune demande de transfert n'a été émise. Préparez immédiatement une référence vers un hôpital de district.`;
        }

        return `👩‍⚕️ **Analyse Clinique - Marie Ngo (Risque Élevé) :**\n` +
               `• **Code :** ${patient.patient_code} | Gestité : G4P3 | Statut Labor : ${labour.labour_status}\n\n` +
               `${statusText}` +
               `🚨 **Alertes Actives (${alerts.length}) :**\n${alertSummary}\n\n` +
               `${evalText}`;
      } catch (err) {
        return "Une erreur s'est produite lors de l'accès au dossier de Marie Ngo.";
      }
    }

    // 6. Default fallback
    return "Je ne suis pas sûr de comprendre votre question. Je peux :\n" +
           "1. Calculer les statistiques en cours de la garde (tapez \"stats\").\n" +
           "2. Analyser une patiente active (tapez \"Marie Ngo\" ou \"Florence Ebanda\").\n" +
           "3. Vous rappeler les critères d'alertes cliniques (tapez \"seuils\").\n\n" +
           "Utilisez également les boutons de raccourcis ci-dessous !";
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* 1. Chat Dialog Box */}
      {isOpen && (
        <div className="w-88 sm:w-96 h-[500px] rounded-2xl glass-panel shadow-2xl flex flex-col border border-brand-border/40 overflow-hidden mb-4 transition-all duration-300 animate-slide-in">
          {/* Chat Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-brand-border/30 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-gradient-to-tr from-status-red to-status-orange rounded-lg shadow-md animate-pulse">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center">
                  PartoAssist
                  <Sparkles className="h-3 w-3 text-status-orange ml-1" />
                </h3>
                <span className="text-[10px] text-status-green flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-green mr-1 inline-block animate-ping"></span>
                  Assistant Clinique Actif
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-brand-muted hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex items-start space-x-2.5 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                {/* Avatar Icon */}
                <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center border text-xs font-bold ${
                  msg.sender === 'user' 
                    ? 'bg-slate-900 border-status-orange/30 text-status-orange' 
                    : 'bg-slate-950 border-brand-border/30 text-white'
                }`}>
                  {msg.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                {/* Bubble content */}
                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-status-red/10 to-status-orange/15 border border-status-orange/20 text-slate-100 rounded-tr-none'
                    : 'bg-slate-900/90 border border-brand-border/20 text-slate-200 rounded-tl-none whitespace-pre-wrap'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start space-x-2.5">
                <div className="h-8 w-8 rounded-full bg-slate-950 border border-brand-border/30 flex items-center justify-center text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-slate-900/90 border border-brand-border/20 rounded-2xl rounded-tl-none px-4 py-3 flex items-center space-x-1.5">
                  <div className="h-1.5 w-1.5 bg-brand-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-1.5 w-1.5 bg-brand-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="h-1.5 w-1.5 bg-brand-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions list */}
          <div className="px-4 py-2 border-t border-brand-border/20 bg-slate-900/30 flex flex-wrap gap-1.5">
            {[
              { label: 'Stats Garde', text: 'Rapport de garde', icon: BarChart2 },
              { label: 'Analyse Florence', text: 'Florence Ebanda', icon: UserCheck },
              { label: 'Analyse Marie', text: 'Marie Ngo', icon: ShieldAlert },
              { label: 'Seuils OMS', text: 'Seuils alerte clinique', icon: HelpCircle }
            ].map(suggest => {
              const Icon = suggest.icon;
              return (
                <button
                  key={suggest.label}
                  onClick={() => handleSend(suggest.text)}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800/80 text-[10px] font-semibold text-slate-300 hover:text-white rounded-lg border border-brand-border/30 transition duration-150"
                >
                  <Icon className="h-3 w-3 text-status-orange" />
                  <span>{suggest.label}</span>
                </button>
              );
            })}
          </div>

          {/* Message Input Form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }}
            className="p-3 bg-slate-900/80 border-t border-brand-border/30 flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Poser une question clinique..."
              className="flex-1 bg-slate-950 border border-brand-border/30 rounded-xl px-3 py-2 text-xs text-white placeholder-brand-muted focus:outline-none focus:border-status-orange/60"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="p-2 bg-gradient-to-tr from-status-red to-status-orange hover:brightness-110 text-white rounded-xl shadow-lg disabled:opacity-40 disabled:pointer-events-none transition"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* 2. Floating Action Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-gradient-to-tr from-status-red to-status-orange text-white shadow-2xl flex items-center justify-center hover:brightness-110 transition-transform duration-200 active:scale-95 group relative"
        title="Ouvrir PartoAssist"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageSquare className="h-6 w-6 animate-pulse" />
            {/* Micro notification badge */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-orange opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-status-orange"></span>
            </span>
          </>
        )}
      </button>
    </div>
  );
};
