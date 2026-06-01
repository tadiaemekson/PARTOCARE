import type { PartogramEntry, Alert } from './db';

interface EvaluatedAlerts {
  alerts: Omit<Alert, 'id' | 'labour_id' | 'generated_at'>[];
  highestLevel: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
}

/**
 * Evaluates clinical rules based on the latest observation entry and historical context.
 * 
 * Rules:
 * - R1: Fetal Heart Rate (FCF): < 110 or > 160 bpm -> RED Alert
 * - R2: Maternal Temperature: > 38.0 °C -> ORANGE Alert
 * - R3: Maternal Blood Pressure: Systolic >= 140 or Diastolic >= 90 mmHg -> ORANGE Alert
 * - R4: Cervical Dilation:
 *   - No progress (dil_current <= dil_prev) over 2+ hours -> RED Alert (Stagnation)
 *   - Average progression speed since start (dil_start) is < 1 cm/h -> YELLOW Alert (Slow progress)
 */
export function evaluateClinicalRules(
  currentEntry: Omit<PartogramEntry, 'id'>,
  history: PartogramEntry[] // Sorted by observation_time ascending
): EvaluatedAlerts {
  const alerts: Omit<Alert, 'id' | 'labour_id' | 'generated_at'>[] = [];

  const timeCurrent = new Date(currentEntry.observation_time).getTime();

  // --- R1: Fetal Heart Rate (FCF) ---
  const fcf = currentEntry.fetal_heart_rate;
  if (fcf > 0) { // Check if recorded
    if (fcf < 110 || fcf > 160) {
      alerts.push({
        alert_level: 'RED',
        alert_type: 'FCF',
        alert_message: `Fréquence Cardiaque Fœtale critique à ${fcf} bpm (Normale: 110-160 bpm). Risque de souffrance fœtale aiguë.`,
      });
    }
  }

  // --- R2: Maternal Temperature ---
  const temp = currentEntry.maternal_temperature;
  if (temp > 0) {
    if (temp > 38.0) {
      alerts.push({
        alert_level: 'ORANGE',
        alert_type: 'TEMPERATURE',
        alert_message: `Température maternelle élevée à ${temp.toFixed(1)}°C (Fièvre > 38°C). Risque d'infection amniotique.`,
      });
    }
  }

  // --- R3: Maternal Blood Pressure ---
  const sys = currentEntry.systolic_bp;
  const dia = currentEntry.diastolic_bp;
  if (sys > 0 && dia > 0) {
    if (sys >= 140 || dia >= 90) {
      alerts.push({
        alert_level: 'ORANGE',
        alert_type: 'BP',
        alert_message: `Tension artérielle élevée à ${sys}/${dia} mmHg (Seuil: 140/90 mmHg). Risque cardiovasculaire ou de pré-éclampsie.`,
      });
    }
  }

  // --- R4: Cervical Dilation Progress ---
  const dilCurrent = currentEntry.cervical_dilation;
  
  if (dilCurrent >= 4.0 && history.length > 0) {
    // 1. Dilation Stagnation (Check 2+ hours ago)
    // Find the entry closest to 2 hours ago, but at least 2 hours ago.
    const twoHoursInMs = 2 * 60 * 60 * 1000;
    const entries2HoursOrMoreAgo = history.filter(h => {
      const timeH = new Date(h.observation_time).getTime();
      return (timeCurrent - timeH) >= twoHoursInMs;
    });

    if (entries2HoursOrMoreAgo.length > 0) {
      // Get the most recent one among those that are at least 2 hours old
      const referenceEntry = entries2HoursOrMoreAgo[entries2HoursOrMoreAgo.length - 1];
      const timeRef = new Date(referenceEntry.observation_time).getTime();
      const timeDiffHours = (timeCurrent - timeRef) / (60 * 60 * 1000);
      
      if (dilCurrent <= referenceEntry.cervical_dilation) {
        alerts.push({
          alert_level: 'RED',
          alert_type: 'STAGNATION',
          alert_message: `Stagnation de la dilatation cervicale (${dilCurrent.toFixed(0)} cm) depuis ${timeDiffHours.toFixed(1)} heures. Risque de dystocie.`,
        });
      }
    }

    // 2. Slow Progression (Average rate < 1 cm/hour since partogram start)
    const firstEntry = history[0];
    const timeFirst = new Date(firstEntry.observation_time).getTime();
    const totalTimeHours = (timeCurrent - timeFirst) / (60 * 60 * 1000);
    
    // Evaluate only if at least 1 hour has elapsed since start
    if (totalTimeHours >= 1.0) {
      const totalDilationGain = dilCurrent - firstEntry.cervical_dilation;
      const rate = totalDilationGain / totalTimeHours;
      
      // If speed is < 1 cm/h and we haven't already hit a RED stagnation alert
      if (rate < 1.0 && dilCurrent < 10.0) {
        const hasRedStagnation = alerts.some(a => a.alert_level === 'RED' && a.alert_type === 'STAGNATION');
        if (!hasRedStagnation) {
          alerts.push({
            alert_level: 'YELLOW',
            alert_type: 'SLOW_PROGRESS',
            alert_message: `Progression lente de la dilatation cervicale (${rate.toFixed(2)} cm/h, recommandé: >= 1.0 cm/h).`,
          });
        }
      }
    }
  }

  // --- Highest Alert Level Determination ---
  let highestLevel: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' = 'GREEN';
  if (alerts.some(a => a.alert_level === 'RED')) {
    highestLevel = 'RED';
  } else if (alerts.some(a => a.alert_level === 'ORANGE')) {
    highestLevel = 'ORANGE';
  } else if (alerts.some(a => a.alert_level === 'YELLOW')) {
    highestLevel = 'YELLOW';
  }

  return {
    alerts,
    highestLevel,
  };
}
