import React, { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Club, ManagerProfile } from '../types/universe';

interface ManagerSetupStageProps {
  club: Club;
  initialManager: ManagerProfile;
  onBack: () => void;
  onComplete: (manager: Partial<ManagerProfile>) => void;
}

const FORMATIONS = ['4-3-3', '4-2-3-1', '3-5-2', '4-4-2', '3-4-2-1', '4-1-2-1-2'];

const COACHING_STYLES = [
  'Tactical Innovator & Youth Developer',
  'Disciplined Pragmatist & Defensive Architect',
  'High-Tempo Pressing Specialist',
  'Man-Manager & Cup Specialist',
];

export const ManagerSetupStage: React.FC<ManagerSetupStageProps> = ({
  club,
  initialManager,
  onBack,
  onComplete,
}) => {
  const [name, setName] = useState(initialManager.name || '');
  const [nationality, setNationality] = useState(initialManager.nationality || '');
  const [age, setAge] = useState(initialManager.age ? String(initialManager.age) : '');
  const [preferredFormation, setPreferredFormation] = useState(initialManager.preferredFormation || '4-3-3');
  const [playingPhilosophy, setPlayingPhilosophy] = useState(initialManager.playingPhilosophy);
  const [coachingStyle, setCoachingStyle] = useState(initialManager.coachingStyle);
  const [careerObjectives, setCareerObjectives] = useState(initialManager.careerObjectives);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nationality.trim()) return;
    onComplete({
      name: name.trim(),
      nationality: nationality.trim(),
      age: age ? Number(age) : undefined,
      preferredFormation,
      playingPhilosophy,
      coachingStyle,
      careerObjectives,
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100">
      <div className="max-w-5xl mx-auto px-6 py-8 md:py-12">
        <header className="flex items-center justify-between gap-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Club</span>
            </button>
            <h1 className="text-2xl md:text-3xl font-bold font-display uppercase tracking-tight text-white">
              Stage 3 · Manager Profile
            </h1>
          </div>
          <div className="text-xs text-slate-400">
            Appointed Club: <span className="text-white font-semibold">{club.name}</span>
          </div>
        </header>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-5 rounded-xl bg-[#121824] border border-white/10 overflow-hidden flex flex-col">
            <div className="relative h-72 lg:h-80">
              <img
                src="/src/assets/images/manager_silhouette_1795179831317.jpg"
                alt="Football manager standing on the touchline"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121824] via-transparent to-transparent" />
            </div>
            <div className="p-6 space-y-4 flex-1">
              <div>
                <div className="text-xs text-emerald-400 font-medium">Touchline Appointment</div>
                <h2 className="text-2xl font-bold font-display text-white mt-0.5">
                  {name.trim() || 'Your Manager Name'}
                </h2>
                <div className="text-xs text-slate-400 mt-1">
                  {nationality.trim() || 'Nationality'} · {club.name} · {preferredFormation}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-slate-400">Starting Reputation</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-white mt-0.5">
                    {initialManager.reputation} / 100
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Board Confidence</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-emerald-400 mt-0.5">
                    {initialManager.boardConfidence}%
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Next step: Establish your Pre-Season camp, review squad depth & tactics, and contest your warm-up fixtures before League Matchday 1.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="lg:col-span-7 p-6 md:p-8 rounded-xl bg-[#121824] border border-white/10 space-y-5"
          >
            <div>
              <h2 className="text-xl font-bold font-display text-white">Register Your Credentials</h2>
              <p className="text-sm text-slate-400 mt-1">
                Complete your coaching dossier before stepping into Pre-Season at {club.stadium}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Manager Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Coach Kamau"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0B0F17] border border-white/15 rounded-lg text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Nationality *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kenya / England"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0B0F17] border border-white/15 rounded-lg text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Age (Optional)</label>
                <input
                  type="number"
                  min={24}
                  max={80}
                  placeholder="38"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0B0F17] border border-white/15 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Preferred Formation</label>
                <select
                  value={preferredFormation}
                  onChange={(e) => setPreferredFormation(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0B0F17] border border-white/15 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-400"
                >
                  {FORMATIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Coaching Style</label>
                <select
                  value={coachingStyle}
                  onChange={(e) => setCoachingStyle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0B0F17] border border-white/15 rounded-lg text-white focus:outline-none focus:border-emerald-400"
                >
                  {COACHING_STYLES.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Playing Philosophy</label>
              <input
                type="text"
                required
                value={playingPhilosophy}
                onChange={(e) => setPlayingPhilosophy(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#0B0F17] border border-white/15 rounded-lg text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Long-Term Career Objectives</label>
              <textarea
                rows={3}
                required
                value={careerObjectives}
                onChange={(e) => setCareerObjectives(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#0B0F17] border border-white/15 rounded-lg text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors whitespace-nowrap shrink-0"
              >
                <span>Enter Pre-Season Camp</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
