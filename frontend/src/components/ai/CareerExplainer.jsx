/**
 * CareerExplainer.jsx
 *
 * Self-contained component that fetches and renders the AI explanation
 * for why a career is (or isn't) a good match for this student.
 *
 * Props
 * ─────
 * careerId    {string}  — career id from careers.js
 * result      {object}  — AssessResult from /ai/assess (or the mock scoring shape)
 * match       {object}  — CareerMatch from /ai/recommendations for this career (optional)
 * topPicks    {string[]}— topPicks ids from /ai/recommendations (optional)
 * profile     {object}  — student profile (optional)
 * language    {'en'|'hi'} — default 'en'
 * onClose     {function}— called when the user dismisses the panel (optional)
 */

import React, { useEffect, useState, useCallback } from 'react';
import { explainCareer } from '../../services/aiApi';

// ─── Status-badge colour map ──────────────────────────────────────────────────
const CONFIDENCE_STYLES = {
  high:   'bg-emerald-100 text-emerald-800',
  medium: 'bg-blue-100 text-blue-800',
  low:    'bg-amber-100 text-amber-800',
};

// ─── Icons (inline SVG, no extra dependency) ─────────────────────────────────
const CheckIcon = () => (
  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const WarningIcon = () => (
  <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
  </svg>
);

const ArrowIcon = () => (
  <svg className="w-5 h-5 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function CareerExplainer({
  careerId,
  result,
  match = null,
  topPicks = null,
  profile = null,
  language = 'en',
  onClose = null,
}) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExplanation = useCallback(async () => {
    if (!careerId || !result) return;
    setLoading(true);
    setError(null);
    try {
      const data = await explainCareer({ careerId, result, match, topPicks, profile, language });
      setExplanation(data);
    } catch (err) {
      setError(language === 'hi'
        ? 'AI विश्लेषण अभी उपलब्ध नहीं है। कृपया पुनः प्रयास करें।'
        : 'AI explanation unavailable right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [careerId, result, match, topPicks, profile, language]);

  useEffect(() => { fetchExplanation(); }, [fetchExplanation]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-500">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        <p className="text-sm">{language === 'hi' ? 'AI विश्लेषण तैयार हो रहा है…' : 'Generating AI analysis…'}</p>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p>{error}</p>
        <button onClick={fetchExplanation} className="mt-2 text-indigo-600 underline text-xs">
          {language === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}
        </button>
      </div>
    );
  }

  if (!explanation) return null;

  const { headline, whyItFits = [], watchOuts = [], whatWouldChange = [], confidence, source } = explanation;
  const confidenceStyle = CONFIDENCE_STYLES[confidence] ?? CONFIDENCE_STYLES.medium;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-base font-semibold text-slate-800 leading-snug">{headline}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${confidenceStyle}`}>
              {language === 'hi' ? 'आत्मविश्वास:' : 'Confidence:'} {confidence}
            </span>
            {source === 'llm' && (
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                AI enhanced
              </span>
            )}
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none flex-shrink-0" aria-label="Close">
            ×
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-100">
        {/* Why It Fits */}
        {whyItFits.length > 0 && (
          <section className="px-6 py-5">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
              {language === 'hi' ? '✅ यह आपके लिए क्यों उपयुक्त है' : '✅ Why It Fits You'}
            </h3>
            <ul className="space-y-2">
              {whyItFits.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckIcon />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Watch Outs */}
        {watchOuts.length > 0 && (
          <section className="px-6 py-5">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
              {language === 'hi' ? '⚠️ ध्यान देने वाली बातें' : '⚠️ Things to Watch Out For'}
            </h3>
            <ul className="space-y-2">
              {watchOuts.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
                  <WarningIcon />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* What Would Change */}
        {whatWouldChange.length > 0 && (
          <section className="px-6 py-5">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
              {language === 'hi' ? '🚀 यदि आप सुधार करें तो…' : '🚀 What Would Improve Your Match'}
            </h3>
            <ul className="space-y-2">
              {whatWouldChange.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-indigo-800 bg-indigo-50 rounded-lg px-3 py-2">
                  <ArrowIcon />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

