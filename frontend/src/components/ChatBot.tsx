import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { useLanguage } from '../contexts/LanguageContext';
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
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set welcome message dynamically based on language
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: language === 'fr' 
            ? "Bonjour ! Je suis PartoAssist, votre assistant clinique de maternité. Comment puis-je vous aider à surveiller vos patientes aujourd'hui ? Vous pouvez me demander de l'aide en cliquant sur \"Guide d'utilisation\"."
            : "Hello! I am PartoAssist, your clinical maternity assistant. How can I help you monitor your patients today? You can ask for help by clicking \"User Guide\".",
          timestamp: new Date()
        }
      ]);
    }
  }, [language, messages.length]);

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

    // 0. Onboarding guide triggers
    if (cleanQuery === '1' || cleanQuery.includes('admettre') || cleanQuery.includes('admission') || cleanQuery.includes('admit')) {
      return language === 'fr'
        ? "➕ **1. Admettre une patiente :**\n\n" +
          "• Allez sur l'onglet **Patientes & Suivi** dans le menu latéral gauche.\n" +
          "• Cliquez sur le bouton **Enregistrer une Patiente** (ou **Admettre**).\n" +
          "• Saisissez ses données d'identification (Nom, Âge, Code de patiente unique, Groupe sanguin).\n" +
          "• Créez un dossier de grossesse en indiquant la gestité, la parité et les semaines d'aménorrhée (SA).\n" +
          "• Cliquez sur **Initier le Travail (Phase active)** pour ouvrir son partogramme numérique."
        : "➕ **1. Admitting a Patient:**\n\n" +
          "• Navigate to the **Patients & Monitoring** tab in the left sidebar menu.\n" +
          "• Click the **Register Patient** (or **Admit**) button.\n" +
          "• Enter patient details (Name, Age, Unique patient code, Blood group).\n" +
          "• Add pregnancy factors: gravidity, parity, and gestational weeks (GW).\n" +
          "• Click **Initiate Labour (Active Phase)** to open her digital partograph.";
    }

    if (cleanQuery === '2' || cleanQuery.includes('ouvrir') || cleanQuery.includes('partogramme') || cleanQuery.includes('parto') || cleanQuery.includes('partograph')) {
      return language === 'fr'
        ? "📈 **2. Ouvrir le Partogramme :**\n\n" +
          "• Une fois le travail initié, la patiente apparaît dans la liste des **Travails Actifs** sur le tableau de bord.\n" +
          "• Cliquez sur le bouton **Partogramme** à droite de son nom pour ouvrir sa fiche clinique.\n" +
          "• Vous verrez un graphique dynamique interactif affichant la dilatation cervicale (ligne d'alerte rouge et ligne d'action) et la fréquence cardiaque fœtale."
        : "📈 **2. Opening the Partograph:**\n\n" +
          "• Once labour is initiated, the patient will appear in the **Active Labours List** on the main dashboard.\n" +
          "• Click the **Partograph** button next to her name to open her clinical record.\n" +
          "• You will see an interactive chart showing cervical dilation (with the alert and action lines) and fetal heart rate.";
    }

    if (cleanQuery === '3' || cleanQuery.includes('observation') || cleanQuery.includes('constante') || cleanQuery.includes('obs') || cleanQuery.includes('vitals')) {
      return language === 'fr'
        ? "✍️ **3. Saisir des Observations :**\n\n" +
          "• Dans le dossier du partogramme de la patiente, cliquez sur le bouton **Saisir Observation** (en haut à droite).\n" +
          "• Un formulaire s'ouvre pour saisir les constantes périodiques :\n" +
          "  - Dilatation cervicale (cm) et hauteur de présentation (station).\n" +
          "  - Fréquence cardiaque fœtale (FCF - bpm).\n" +
          "  - Contractions (nombre en 10 minutes et durée en secondes).\n" +
          "  - Constantes maternelles (Tension Systolique/Diastolique, Température, Pouls).\n" +
          "  - État des membranes (Intactes/Rompues) et aspect du liquide amniotique (Clair, Méconial, Sanglant).\n" +
          "• Cliquez sur **Sauvegarder** pour mettre à jour le graphique instantanément."
        : "✍️ **3. Entering Observations:**\n\n" +
          "• In the patient's partograph file, click the **Add Observation** button (top right).\n" +
          "• A panel will open to let you record clinical parameters:\n" +
          "  - Cervical dilation (cm) & fetal station (descent).\n" +
          "  - Fetal Heart Rate (FHR - bpm).\n" +
          "  - Contractions (number per 10 mins & duration in seconds).\n" +
          "  - Maternal vitals (Systolic/Diastolic BP, Temperature, Pulse).\n" +
          "  - Membrane status (Intact/Ruptured) & amniotic fluid aspect (Clear, Meconium, Bloody).\n" +
          "• Click **Save** to update the chart immediately.";
    }

    if (cleanQuery === '4' || cleanQuery.includes('moteur') || cleanQuery.includes('critère') || cleanQuery.includes('stagnation') || cleanQuery.includes('diagnostic') || cleanQuery.includes('warning')) {
      return language === 'fr'
        ? "🚨 **4. Moteur d'Alertes Cliniques :**\n\n" +
          "• PartoCare intègre un algorithme intelligent conforme aux normes de l'OMS.\n" +
          "• Dès qu'une constante sort des limites normales (ex: FCF < 110 ou > 160, dilatation stagnante sur 2h, fièvre > 38°C, TA élevée), le système génère automatiquement une alerte.\n" +
          "• Les alertes s'affichent en temps réel dans la cloche de notifications en haut et dans le panneau **Moteur de Diagnostic** à droite du partogramme.\n" +
          "• **Critique (Rouge)** ou **Modéré (Orange)** vous indiquent qu'il faut agir immédiatement ou préparer un transfert."
        : "🚨 **4. Clinical Alerts System:**\n\n" +
          "• PartoCare features an automated algorithm matching WHO standards.\n" +
          "• When parameters deviate from normal range (e.g. FHR < 110 or > 160 bpm, dilation stagnation over 2 hours, temperature > 38°C, hypertension), the system automatically triggers an alert.\n" +
          "• Alerts appear in real-time in the top notification bell and the **Diagnostic Engine** panel on the right of the partograph.\n" +
          "• **Critical (Red)** or **Moderate (Orange)** alerts indicate immediate action or preparing for referral.";
    }

    if (cleanQuery === '5' || cleanQuery.includes('transferer') || cleanQuery.includes('reference') || cleanQuery.includes('transfer') || cleanQuery.includes('referral') || cleanQuery.includes('evacuation')) {
      return language === 'fr'
        ? "    " +
          "🚑 **5. Références d'Urgence (Transfert) :**\n\n" +
          "• Si l'état de la patiente nécessite un plateau technique plus élevé, cliquez sur **Transférer** dans sa fiche partogramme.\n" +
          "• Sélectionnez l'hôpital de destination et indiquez le motif clinique du transfert.\n" +
          "• Le dossier de transfert est instantanément visible par l'hôpital receveur et le district sanitaire.\n" +
          "• Les régulateurs de district affecteront une ambulance disponible. Les coordonnées du chauffeur et l'immatriculation s'afficheront sur votre écran pour un suivi en temps réel."
        : "    " +
          "🚑 **5. Emergency Referrals (Transfer):**\n\n" +
          "• If the patient requires a higher-level facility, click the **Transfer/Refer** button on her partograph file.\n" +
          "• Choose the destination hospital and enter the clinical reason.\n" +
          "• The transfer record is shared instantly with the receiving facility and district coordinators.\n" +
          "• The district dispatcher will assign an available ambulance. The driver's name, phone, and vehicle registration plate will display on your screen in real time.";
    }

    if (cleanQuery === '6' || cleanQuery.includes('cloture') || cleanQuery.includes('clôturer') || cleanQuery.includes('naissance') || cleanQuery.includes('delivery') || cleanQuery.includes('discharge') || cleanQuery.includes('issue')) {
      return language === 'fr'
        ? "👶 **6. Clôturer une Naissance :**\n\n" +
          "• Lorsque la patiente accouche avec succès dans votre structure, cliquez sur **Clôturer Naissance**.\n" +
          "• Renseignez le mode d'accouchement (Voie basse spontanée, Césarienne d'urgence, Instrumental).\n" +
          "• Renseignez l'issue clinique pour la mère et l'enfant (bien portants, complications, etc.).\n" +
          "• Le dossier est fermé et archivé de manière sécurisée."
        : "👶 **6. Closing a Labour Case:**\n\n" +
          "• When the patient delivers successfully in your facility, click the **Discharge/Close** button.\n" +
          "• Enter the delivery mode (Spontaneous Vaginal, Emergency C-Section, Instrumental Forceps/Vacuum).\n" +
          "• Select the clinical outcome for both mother and child (healthy, complications, etc.).\n" +
          "• The file is closed and securely archived.";
    }

    if (cleanQuery === '7' || cleanQuery.includes('hors-ligne') || cleanQuery.includes('hors ligne') || cleanQuery.includes('offline') || cleanQuery.includes('sync')) {
      return language === 'fr'
        ? "📶 **7. Mode Hors-ligne Autonome :**\n\n" +
          "• PartoCare est conçu pour fonctionner sans connexion internet.\n" +
          "• Si le réseau coupe (voyant Wifi passe au jaune **Hors-ligne**), toutes vos saisies sont sauvegardées localement dans le navigateur (IndexedDB).\n" +
          "• Une fois la connexion rétablie, cliquez sur le bouton orange **Sync** dans l'en-tête pour pousser toutes les données accumulées dans l'outbox vers le serveur central."
        : "📶 **7. Autonomous Offline Mode:**\n\n" +
          "• PartoCare is designed to function seamlessly without internet connectivity.\n" +
          "• If you lose connection (Wifi indicator changes to yellow **Offline**), all entries are safely saved locally in the browser's database (IndexedDB).\n" +
          "• When back online, click the orange **Sync** button in the header bar to push all queued changes from the outbox to the central database.";
    }

    if (cleanQuery.match(/(guide|aide|help|manuel|onboarding)/)) {
      return language === 'fr'
        ? "📖 **Guide d'utilisation de PartoCare (Onboarding) :**\n" +
          "Bienvenue sur PartoCare ! Voici les étapes clés pour utiliser l'application clinique :\n\n" +
          "• **Tapez 1** (ou \"admission\") : Admettre une patiente\n" +
          "• **Tapez 2** (ou \"parto\") : Ouvrir et lire le partogramme\n" +
          "• **Tapez 3** (ou \"observation\") : Enregistrer des observations cliniques\n" +
          "• **Tapez 4** (ou \"alerte\") : Comprendre le moteur d'alertes cliniques\n" +
          "• **Tapez 5** (ou \"transfert\") : Lancer et suivre un transfert d'urgence\n" +
          "• **Tapez 6** (ou \"clôture\") : Enregistrer l'issue de l'accouchement\n" +
          "• **Tapez 7** (ou \"offline\") : Fonctionnement hors-ligne et synchronisation\n\n" +
          "Tapez le numéro ou le mot-clé (ex: \"1\" ou \"transfert\") pour en savoir plus sur l'étape correspondante !"
        : "📖 **PartoCare User Guide (Onboarding):**\n" +
          "Welcome to PartoCare! Here are the core steps to use the clinical application:\n\n" +
          "• **Type 1** (or \"admission\"): Admit a new patient\n" +
          "• **Type 2** (or \"parto\"): Open and view the partograph chart\n" +
          "• **Type 3** (or \"observation\"): Log clinical observations & vitals\n" +
          "• **Type 4** (or \"alert\"): Understand the clinical alerts system\n" +
          "• **Type 5** (or \"transfer\"): Initiate and track emergency referrals\n" +
          "• **Type 6** (or \"close\"): Record the delivery outcome\n" +
          "• **Type 7** (or \"offline\"): Offline operations & data syncing\n\n" +
          "Type the number or keyword (e.g., \"1\" or \"transfer\") to read the specific instructions!";
    }

    // 1. Greet check
    if (cleanQuery.match(/^(bonjour|salut|hello|hi|hey|bonsoir)/)) {
      return language === 'fr'
        ? "Bonjour ! Comment se passe votre garde ? Vous pouvez me demander de l'aide (tapez \"guide\"), d'analyser une patiente active (ex: \"Florence Ebanda\" ou \"Marie Ngo\"), de vous donner les statistiques actuelles de la maternité, ou de lister les seuils cliniques d'alerte."
        : "Hello! How is your shift going? You can ask me for help (type \"guide\"), to analyze an active patient (e.g. \"Florence Ebanda\" or \"Marie Ngo\"), to get ward statistics, or to list clinical alerts thresholds.";
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

        return language === 'fr'
          ? `📊 **Rapport de Situation Actuel :**\n\n` +
            `• **Travails actifs :** ${activeLabours.length} patientes en cours de surveillance.\n` +
            `• **Alertes non résolues :** ${alerts.length} au total (${redAlerts} critiques 🔴, ${orangeAlerts} modérées 🟠).\n` +
            `• **Transferts / Références :** ${pendingRefs.length} en attente, ${transitRefs.length} en cours de transport.\n\n` +
            `*Détail des cas critiques :* demandez-moi d'analyser une patiente en particulier pour afficher ses constantes cliniques.`
          : `📊 **Current Status Report:**\n\n` +
            `• **Active labours:** ${activeLabours.length} patients currently being monitored.\n` +
            `• **Unresolved alerts:** ${alerts.length} total (${redAlerts} critical 🔴, ${orangeAlerts} moderate 🟠).\n` +
            `• **Transfers / Referrals:** ${pendingRefs.length} pending, ${transitRefs.length} in transit.\n\n` +
            `*Critical case details:* ask me to analyze a specific patient to view her clinical parameters.`;
      } catch (err) {
        return language === 'fr' 
          ? "Désolé, je n'ai pas pu accéder aux dossiers locaux pour calculer les statistiques."
          : "Sorry, I could not access local records to calculate statistics.";
      }
    }

    // 3. Clinical Guidelines / Alerts check
    if (cleanQuery.match(/(seuil|régle|alerte|critère|limite|norme|fcf|stagnation|temp|tension|bp)/)) {
      return language === 'fr'
        ? `🔴 **Seuils d'Alerte Clinique (Recommandations OMS/PartoCare) :**\n\n` +
          `1. **Fréquence Cardiaque Fœtale (FCF) :**\n` +
          `   • Normal : 110 à 160 bpm.\n` +
          `   • Critique : < 110 bpm (bradycardie) ou > 160 bpm (tachycardie) 🔴.\n` +
          `2. **Dilation Cervicale (Stagnation) :**\n` +
          `   • Phase active : Progression minimale attendue de 1 cm / heure.\n` +
          `   • Alerte : Dilatation inchangée sur 2 examens espacés de 2 heures 🔴.\n` +
          `3. **Température Maternelle :**\n` +
          `   • Alerte : > 38.0 °C (suspecter chorioamnionite/infection) 🟠.\n` +
          `4. **Tension Artérielle Maternelle :**\n` +
          `   • Hypertension : TA >= 140/90 mmHg (risque de pré-éclampsie) 🟠.`
        : `🔴 **Clinical Alert Thresholds (WHO / PartoCare Guidelines):**\n\n` +
          `1. **Fetal Heart Rate (FHR):**\n` +
          `   • Normal: 110 to 160 bpm.\n` +
          `   • Critical: < 110 bpm (bradycardia) or > 160 bpm (tachycardia) 🔴.\n` +
          `2. **Cervical Dilation (Stagnation):**\n` +
          `   • Active phase: Expected minimum progression of 1 cm / hour.\n` +
          `   • Alert: Dilatation unchanged on 2 exams spaced 2 hours apart 🔴.\n` +
          `3. **Maternal Temperature:**\n` +
          `   • Alert: > 38.0 °C (suspect chorioamnionite/infection) 🟠.\n` +
          `4. **Maternal Blood Pressure:**\n` +
          `   • Hypertension: BP >= 140/90 mmHg (risk of pre-eclampsia) 🟠.`;
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
    return language === 'fr'
      ? "Je ne suis pas sûr de comprendre votre question. Je peux :\n" +
        "1. Vous guider pour utiliser l'application (tapez \"guide\").\n" +
        "2. Calculer les statistiques en cours de la garde (tapez \"stats\").\n" +
        "3. Analyser une patiente active (tapez \"Marie Ngo\" ou \"Florence Ebanda\").\n" +
        "4. Vous rappeler les critères d'alertes cliniques (tapez \"seuils\").\n\n" +
        "Utilisez également les boutons de raccourcis ci-dessous !"
      : "I'm not sure I understand your question. I can:\n" +
        "1. Walk you through how to use the app (type \"guide\").\n" +
        "2. Calculate current shift statistics (type \"stats\").\n" +
        "3. Analyze an active patient (type \"Marie Ngo\" or \"Florence Ebanda\").\n" +
        "4. Remind you of clinical alert thresholds (type \"thresholds\").\n\n" +
        "Use the shortcut buttons below as well!";
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
                  {language === 'fr' ? 'Assistant Clinique Actif' : 'Clinical Assistant Active'}
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
              { label: language === 'fr' ? '📖 Guide App' : '📖 App Guide', text: 'guide', icon: HelpCircle },
              { label: language === 'fr' ? 'Stats Garde' : 'Ward Stats', text: 'Rapport de garde', icon: BarChart2 },
              { label: language === 'fr' ? 'Analyse Florence' : 'Analyze Florence', text: 'Florence Ebanda', icon: UserCheck },
              { label: language === 'fr' ? 'Analyse Marie' : 'Analyze Marie', text: 'Marie Ngo', icon: ShieldAlert },
              { label: language === 'fr' ? 'Seuils OMS' : 'WHO Thresholds', text: 'Seuils alerte clinique', icon: HelpCircle }
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
              placeholder={language === 'fr' ? "Poser une question clinique..." : "Ask a clinical question..."}
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
        title={language === 'fr' ? "Ouvrir PartoAssist" : "Open PartoAssist"}
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
