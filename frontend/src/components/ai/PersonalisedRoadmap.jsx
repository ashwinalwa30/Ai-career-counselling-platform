/**
 * PersonalisedRoadmap.jsx
 *
 * Self-contained component that fetches and renders the AI-personalised
 * career roadmap for one student. Wraps the ai-service /ai/roadmap endpoint.
 *
 * Props
 * ─────
 * careerId    {string}  — career id from careers.js
 * profile     {object}  — { class, board, state, subjectMarks } (required)
 * result      {object}  — AssessResult from /ai/assess or mock scoring
 * language    {'en'|'hi'} — default 'en'
 * polish      {boolean} — request LLM reword (default false)
 */

import React, { useEffect, useState, useCallback } from 'react';
import { getPersonalisedRoadmap } from '../../services/aiApi';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  done:  { label: 'Done',  labelHi: 'पूर्ण',    bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', dot: 'bg-emerald-500' },
  now:   { label: 'Now',   labelHi: 'अभी',     bg: 'bg-indigo-100',  text: 'text-indigo-700',  border: 'border-indigo-300',  dot: 'bg-indigo-500'  },
  next:  { label: 'Next',  labelHi: 'अगला',    bg: 'bg-violet-100',  text: 'text-violet-700',  border: 'border-violet-300',  dot: 'bg-violet-500'  },
  later: { label: 'Later', labelHi: 'बाद में', bg: 'bg-slate-100',   text: 'text-slate-600',   border: 'border-slate-300',   dot: 'bg-slate-400'   },
};

function StatusBadge({ status, language }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.later;
  const label = language === 'hi' ? cfg.labelHi : cfg.label;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      {label}
    </span>
  );
}

// ─── Single step card ─────────────────────────────────────────────────────────
function RoadmapStep({ step, language }) {
  const cfg = STATUS_CONFIG[step.status] ?? STATUS_CONFIG.later;
  return (
    <div className={`relative flex gap-4`}>
      {/* Timeline dot */}
      <div className="flex flex-col items-center">
        <div className={`w-4 h-4 rounded-full border-2 ${cfg.border} ${cfg.dot} flex-shrink-0 mt-1`} />
        <div className="flex-1 w-px bg-slate-200 mt-1" />
      </div>

      {/* Content */}
      <div className="pb-6 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
            {language === 'hi' ? `चरण ${step.step}` : `Step ${step.step}`}
          </span>
          <StatusBadge status={step.status} language={language} />
          {step.timing && (
            <span className="text-xs text-slate-500 italic">{step.timing}</span>
          )}
        </div>

        <h4 className="text-sm font-semibold text-slate-800 mb-1">{step.title}</h4>
        <p className="text-sm text-slate-600 leading-relaxed mb-2">{step.desc}</p>

        {step.actions && step.actions.length > 0 && (
          <ul className="space-y-1">
            {step.actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                <span className="text-indigo-400 font-bold mt-0.5">›</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PersonalisedRoadmap({
  careerId,
  profile,
  result,
  language = 'en',
  polish = false,
}) {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRoadmap = useCallback(async () => {
    if (!careerId || !profile || !result) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPersonalisedRoadmap({ careerId, profile, result, language, polish });
      setRoadmap(data);
    } catch (err) {
      setError(language === 'hi'
        ? 'रोडमैप लोड नहीं हो सका। कृपया पुनः प्रयास करें।'
        : 'Could not load personalised roadmap. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [careerId, profile, result, language, polish]);

  useEffect(() => { fetchRoadmap(); }, [fetchRoadmap]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-500">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        <p className="text-sm">{language === 'hi' ? 'आपका रोडमैप तैयार हो रहा है…' : 'Building your personalised roadmap…'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p>{error}</p>
        <button onClick={fetchRoadmap} className="mt-2 text-indigo-600 underline text-xs">
          {language === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}
        </button>
      </div>
    );
  }

  if (!roadmap) return null;

  const { steps = [], focusAreas = [], streamAdvice, examPlan = [], backupPaths = [], source } = roadmap;

  return (
    <div className="space-y-6">
      {/* Source badge */}
      {source === 'llm' && (
        <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-2">
          <span>✨</span>
          <span>{language === 'hi' ? 'AI द्वारा व्यक्तिगत रूप से तैयार' : 'Personalised with AI'}</span>
        </div>
      )}

      {/* Stream Advice (Class 8–10 only) */}
      {streamAdvice && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-1">
            {language === 'hi' ? '📚 स्ट्रीम सलाह' : '📚 Stream Advice'}
          </h3>
          <p className="text-sm text-amber-800">{streamAdvice}</p>
        </div>
      )}

      {/* Steps timeline */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
          {language === 'hi' ? 'आपका रोडमैप' : 'Your Roadmap'}
        </h3>
        <div>
          {steps.map((step) => (
            <RoadmapStep key={step.step} step={step} language={language} />
          ))}
        </div>
      </div>

      {/* Exam Plan */}
      {examPlan.length > 0 && (
        <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-indigo-800 mb-3">
            {language === 'hi' ? '📝 परीक्षा योजना' : '📝 Exam Plan'}
          </h3>
          <ul className="space-y-2">
            {examPlan.map((exam, i) => (
              <li key={i} className="flex items-start justify-between gap-4 text-sm text-indigo-800">
                <span className="font-medium">{exam.name ?? exam.exam}</span>
                <span className="text-xs text-indigo-600 flex-shrink-0">
                  {language === 'hi' ? 'कक्षा' : 'Class'} {exam.startPreparingBy ?? exam.start_preparing_by}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Focus Areas */}
      {focusAreas.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
            {language === 'hi' ? '🎯 फोकस क्षेत्र' : '🎯 Focus Areas'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {focusAreas.map((area, i) => (
              <span key={i} className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Backup Paths */}
      {backupPaths.length > 0 && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            {language === 'hi' ? '🔄 वैकल्पिक करियर' : '🔄 Backup Paths'}
          </h3>
          <ul className="space-y-2">
            {backupPaths.map((path, i) => (
              <li key={i} className="flex items-center justify-between text-sm text-slate-700">
                <span>{path.title ?? path.id}</span>
                {path.matchPct != null && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {path.matchPct}% {language === 'hi' ? 'मेल' : 'match'}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

