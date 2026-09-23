import React, { useState, useEffect, useMemo } from 'react';
import { 
  CloudSun, 
  Wind, 
  Thermometer, 
  Droplets, 
  Brain, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  Heart, 
  Activity, 
  ArrowDownRight, 
  CheckCircle2,
  RefreshCw,
  Sun,
  CloudRain
} from 'lucide-react';
import { PainCrisisLog } from './CareVault';

interface PredictivePainAnalysisProps {
  painCrises?: PainCrisisLog[];
}

interface WeatherData {
  tempC: number;
  tempF: number;
  humidity: number;
  pressureHpa: number;
  pressureTrend: 'dropping' | 'stable' | 'rising';
  condition: string;
  isColdSnap: boolean;
  city: string;
}

export const PredictivePainAnalysis: React.FC<PredictivePainAnalysisProps> = ({ painCrises = [] }) => {
  const [stressLevel, setStressLevel] = useState<number>(6); // 1-10
  const [hydrationLiters, setHydrationLiters] = useState<number>(1.5); // 0.5 - 4.0
  const [sleepHours, setSleepHours] = useState<number>(6); // 2 - 10
  const [userLocation, setUserLocation] = useState<string>('Lagos, NG');
  const [fetchingWeather, setFetchingWeather] = useState<boolean>(false);

  // Simulated live weather with option to refresh/fetch
  const [weather, setWeather] = useState<WeatherData>({
    tempC: 18,
    tempF: 64,
    humidity: 82,
    pressureHpa: 1008, // Low pressure drop
    pressureTrend: 'dropping',
    condition: 'Cold Front / Overcast',
    isColdSnap: true,
    city: 'Lagos, NG'
  });

  const fetchLiveWeather = async () => {
    setFetchingWeather(true);
    try {
      // Simulate real Open-Meteo / Weather API response
      await new Promise(r => setTimeout(r, 600));
      const mockTemps = [16, 21, 28, 14, 25];
      const selectedTemp = mockTemps[Math.floor(Math.random() * mockTemps.length)];
      setWeather({
        tempC: selectedTemp,
        tempF: Math.round(selectedTemp * 1.8 + 32),
        humidity: Math.floor(Math.random() * 30) + 60,
        pressureHpa: selectedTemp < 20 ? 1005 : 1014,
        pressureTrend: selectedTemp < 20 ? 'dropping' : 'stable',
        condition: selectedTemp < 20 ? 'Cold Front Approaching' : 'Mild & Clear',
        isColdSnap: selectedTemp < 20,
        city: userLocation
      });
    } catch (e) {
      console.warn("Weather API fallback");
    } finally {
      setFetchingWeather(false);
    }
  };

  // Calculate Pain Crisis Risk Score (0 - 100)
  const riskAnalysis = useMemo(() => {
    let score = 20; // baseline

    // Cold temperature trigger
    if (weather.tempC < 20) score += 25;
    else if (weather.tempC < 24) score += 10;

    // Barometric pressure drop
    if (weather.pressureHpa < 1010) score += 20;
    if (weather.pressureTrend === 'dropping') score += 10;

    // High stress level
    if (stressLevel >= 8) score += 25;
    else if (stressLevel >= 5) score += 15;

    // Low hydration
    if (hydrationLiters < 2.0) score += 15;

    // Low sleep
    if (sleepHours < 6) score += 10;

    // Cap score at 98
    const finalScore = Math.min(98, Math.max(12, score));

    let riskLabel: 'Low Risk' | 'Moderate Risk' | 'Elevated Risk' | 'HIGH RISK CRISIS WARNING' = 'Low Risk';
    let riskColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    let meterBar = 'from-emerald-500 to-teal-400';

    if (finalScore >= 75) {
      riskLabel = 'HIGH RISK CRISIS WARNING';
      riskColor = 'text-red-400 bg-red-500/10 border-red-500/30';
      meterBar = 'from-red-600 via-rose-500 to-amber-500';
    } else if (finalScore >= 50) {
      riskLabel = 'Elevated Risk';
      riskColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      meterBar = 'from-amber-500 to-yellow-400';
    } else if (finalScore >= 35) {
      riskLabel = 'Moderate Risk';
      riskColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      meterBar = 'from-blue-500 to-cyan-400';
    }

    // Proactive self-care recommendations
    const suggestions: Array<{ title: string; desc: string; icon: string }> = [];

    if (weather.isColdSnap || weather.tempC < 22) {
      suggestions.push({
        title: "Cold Front Defense Protocol",
        desc: "Temperature is below optimal threshold. Wear warm thermal layers, fleece socks, and avoid AC airflow.",
        icon: "Thermometer"
      });
    }

    if (hydrationLiters < 2.5) {
      suggestions.push({
        title: "Aggressive Pre-Hydration Target",
        desc: "Drink 2–3 warm electrolyte fluids before bedtime to prevent overnight blood viscosity increase.",
        icon: "Droplets"
      });
    }

    if (stressLevel >= 6) {
      suggestions.push({
        title: "Cortisol & Vasoconstriction Mitigation",
        desc: "Reported stress is elevated. Engage in 10-min diaphragmatic breathing or warm bath to dilate micro-capillaries.",
        icon: "Brain"
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        title: "Maintenance Routine",
        desc: "Current environmental factors and wellness scores are in safe ranges. Continue daily Hydroxyurea & fluids.",
        icon: "ShieldCheck"
      });
    }

    return {
      score: finalScore,
      riskLabel,
      riskColor,
      meterBar,
      suggestions
    };
  }, [weather, stressLevel, hydrationLiters, sleepHours]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 space-y-6 text-white shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20 text-amber-400">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-lg text-white">Predictive Pain Analysis & Weather Correlator</h3>
              <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                <Sparkles size={10} /> AI Proactive Guard
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Correlates barometric pressure drops, cold fronts, and stress scores to suggest preventive self-care before crises peak.
            </p>
          </div>
        </div>

        {/* Refresh Weather Button */}
        <button
          type="button"
          onClick={fetchLiveWeather}
          disabled={fetchingWeather}
          className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${fetchingWeather ? 'animate-spin' : ''}`} />
          <span>{fetchingWeather ? 'Syncing Weather...' : 'Sync Live Weather'}</span>
        </button>
      </div>

      {/* Main Risk Score Gauge Card */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Risk Score Dial */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-900/90 rounded-2xl border border-slate-800/80 space-y-3">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Predictive Crisis Risk Meter</span>
          
          <div className="relative flex items-center justify-center">
            <div className="text-4xl font-black text-white">{riskAnalysis.score}<span className="text-sm font-semibold text-slate-500">%</span></div>
          </div>

          <div className={`px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider ${riskAnalysis.riskColor}`}>
            {riskAnalysis.riskLabel}
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${riskAnalysis.meterBar} transition-all duration-700`} style={{ width: `${riskAnalysis.score}%` }} />
          </div>
        </div>

        {/* Live Weather Metrics Panel */}
        <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Temperature</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Thermometer className={`w-4 h-4 ${weather.tempC < 20 ? 'text-blue-400' : 'text-amber-400'}`} />
              <span className="text-sm font-black text-white">{weather.tempC}°C <span className="text-[10px] text-slate-400">({weather.tempF}°F)</span></span>
            </div>
            <span className="text-[9px] text-slate-500 font-medium block mt-0.5">{weather.isColdSnap ? '❄️ Cold Threshold' : 'Mild Ambient'}</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Barometric Pressure</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Wind className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-black text-white">{weather.pressureHpa} <span className="text-[10px] text-slate-400">hPa</span></span>
            </div>
            <span className="text-[9px] text-amber-400/90 font-medium block mt-0.5">📉 Pressure Dropping</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Humidity</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-black text-white">{weather.humidity}%</span>
            </div>
            <span className="text-[9px] text-slate-500 font-medium block mt-0.5">Air Moisture</span>
          </div>
        </div>
      </div>

      {/* Interactive Controls (Stress, Hydration, Sleep) */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" /> Adjust Personal Health Factors
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stress Level Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold">Reported Stress Level</span>
              <span className={`font-black ${stressLevel >= 7 ? 'text-rose-400' : 'text-slate-200'}`}>{stressLevel} / 10</span>
            </div>
            <input 
              type="range"
              min="1"
              max="10"
              value={stressLevel}
              onChange={(e) => setStressLevel(parseInt(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Hydration Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold">Daily Fluids Intaken</span>
              <span className={`font-black ${hydrationLiters < 2.0 ? 'text-amber-400' : 'text-emerald-400'}`}>{hydrationLiters} Liters</span>
            </div>
            <input 
              type="range"
              min="0.5"
              max="4.0"
              step="0.25"
              value={hydrationLiters}
              onChange={(e) => setHydrationLiters(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Sleep Hours Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold">Nightly Sleep</span>
              <span className="font-black text-indigo-300">{sleepHours} Hours</span>
            </div>
            <input 
              type="range"
              min="2"
              max="10"
              value={sleepHours}
              onChange={(e) => setSleepHours(parseInt(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Proactive Self-Care Action Suggestions */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Proactive Self-Care Action Protocol
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {riskAnalysis.suggestions.map((s, idx) => (
            <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-start gap-3">
              <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-400 shrink-0 mt-0.5">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h5 className="font-extrabold text-xs text-white">{s.title}</h5>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
