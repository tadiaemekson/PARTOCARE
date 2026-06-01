<?php
 
namespace App\Services;
 
use App\Models\PartogramEntry;
use App\Models\Alert;
use Carbon\Carbon;
 
class AlertEngineService
{
    /**
     * Evaluates clinical rules for a newly created PartogramEntry.
     * Returns a collection of Alert data structures that should be generated.
     *
     * @param PartogramEntry $currentEntry
     * @return array
     */
    public function evaluate(PartogramEntry $currentEntry): array
    {
        $alerts = [];
        $partogram = $currentEntry->partogram;
        if (!$partogram) {
            return [];
        }
 
        $labourId = $partogram->labour_id;
        $currentTime = Carbon::parse($currentEntry->observation_time);
 
        // 1. Fetch historical entries for the same partogram, ordered by observation time
        $history = PartogramEntry::where('partogram_id', $currentEntry->partogram_id)
            ->where('id', '!=', $currentEntry->id)
            ->orderBy('observation_time', 'asc')
            ->get();
 
        // --- R1: Fetal Heart Rate (FCF) ---
        $fhr = $currentEntry->fetal_heart_rate;
        if ($fhr > 0) {
            if ($fhr < 110 || $fhr > 160) {
                $alerts[] = [
                    'labour_id' => $labourId,
                    'partogram_entry_id' => $currentEntry->id,
                    'alert_level' => 'RED',
                    'alert_type' => 'FCF',
                    'alert_message' => "Fréquence Cardiaque Fœtale critique à {$fhr} bpm (Normale: 110-160 bpm). Risque de souffrance fœtale aiguë.",
                    'generated_at' => Carbon::now()->toDateTimeString(),
                    'resolved_at' => null,
                ];
            }
        }
 
        // --- R2: Maternal Temperature ---
        $temp = $currentEntry->maternal_temperature;
        if ($temp > 0) {
            if ($temp > 38.0) {
                $alerts[] = [
                    'labour_id' => $labourId,
                    'partogram_entry_id' => $currentEntry->id,
                    'alert_level' => 'ORANGE',
                    'alert_type' => 'TEMPERATURE',
                    'alert_message' => "Température maternelle élevée à " . number_format($temp, 1) . "°C (Fièvre > 38°C). Risque d'infection amniotique.",
                    'generated_at' => Carbon::now()->toDateTimeString(),
                    'resolved_at' => null,
                ];
            }
        }
 
        // --- R3: Maternal Blood Pressure ---
        $sys = $currentEntry->systolic_bp;
        $dia = $currentEntry->diastolic_bp;
        if ($sys > 0 && $dia > 0) {
            if ($sys >= 140 || $dia >= 90) {
                $alerts[] = [
                    'labour_id' => $labourId,
                    'partogram_entry_id' => $currentEntry->id,
                    'alert_level' => 'ORANGE',
                    'alert_type' => 'BP',
                    'alert_message' => "Tension artérielle élevée à {$sys}/{$dia} mmHg (Seuil: 140/90 mmHg). Risque cardiovasculaire ou de pré-éclampsie.",
                    'generated_at' => Carbon::now()->toDateTimeString(),
                    'resolved_at' => null,
                ];
            }
        }
 
        // --- R4: Cervical Dilation Progress ---
        $dilCurrent = (float) $currentEntry->cervical_dilation;
 
        if ($dilCurrent >= 4.0 && $history->count() > 0) {
            // A. Dilation Stagnation (no progress over 2+ hours)
            $twoHoursAgo = $currentTime->copy()->subHours(2);
            
            // Find entries that are at least 2 hours older than the current entry
            $entries2HoursOrMoreAgo = $history->filter(function ($h) use ($twoHoursAgo) {
                return Carbon::parse($h->observation_time)->lte($twoHoursAgo);
            });
 
            $hasRedStagnation = false;
 
            if ($entries2HoursOrMoreAgo->count() > 0) {
                // Get the most recent entry among those that are >= 2 hours older
                $referenceEntry = $entries2HoursOrMoreAgo->last();
                $refTime = Carbon::parse($referenceEntry->observation_time);
                $timeDiffHours = $currentTime->diffInMinutes($refTime) / 60.0;
 
                if ($dilCurrent <= (float) $referenceEntry->cervical_dilation) {
                    $alerts[] = [
                        'labour_id' => $labourId,
                        'partogram_entry_id' => $currentEntry->id,
                        'alert_level' => 'RED',
                        'alert_type' => 'STAGNATION',
                        'alert_message' => "Stagnation de la dilatation cervicale (" . number_format($dilCurrent, 1) . " cm) depuis " . number_format($timeDiffHours, 1) . " heures. Risque de dystocie.",
                        'generated_at' => Carbon::now()->toDateTimeString(),
                        'resolved_at' => null,
                    ];
                    $hasRedStagnation = true;
                }
            }
 
            // B. Slow Progress (average rate < 1 cm/hour since partogram start)
            $firstEntry = $history->first();
            $firstTime = Carbon::parse($firstEntry->observation_time);
            $totalTimeHours = $currentTime->diffInMinutes($firstTime) / 60.0;
 
            if ($totalTimeHours >= 1.0) {
                $totalDilationGain = $dilCurrent - (float) $firstEntry->cervical_dilation;
                $rate = $totalDilationGain / $totalTimeHours;
 
                // If progression is < 1 cm/h, col is not fully dilated, and we do not already have a RED stagnation alert
                if ($rate < 1.0 && $dilCurrent < 10.0 && !$hasRedStagnation) {
                    $alerts[] = [
                        'labour_id' => $labourId,
                        'partogram_entry_id' => $currentEntry->id,
                        'alert_level' => 'YELLOW',
                        'alert_type' => 'SLOW_PROGRESS',
                        'alert_message' => "Progression lente de la dilatation cervicale (" . number_format($rate, 2) . " cm/h, recommandé: >= 1.0 cm/h).",
                        'generated_at' => Carbon::now()->toDateTimeString(),
                        'resolved_at' => null,
                    ];
                }
            }
        }
 
        return $alerts;
    }
}
