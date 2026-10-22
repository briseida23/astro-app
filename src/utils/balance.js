import { SIGNS, normalize } from './ephemeris';

// Веса объектов для баланса стихий и крестов: светила по 5, личные планеты по 3,
// социальные по 2, высшие по 1. Углы и точки не учитываются. Сумма — 26 баллов.
export const DEFAULT_WEIGHTS = {
  sun: 5,
  moon: 5,
  ascendant: 0,
  mercury: 3,
  venus: 3,
  mars: 3,
  jupiter: 2,
  saturn: 2,
  mc: 0,
  uranus: 1,
  neptune: 1,
  pluto: 1,
  node: 0,
  lilith: 0,
};

// Прежние значения по умолчанию (сумма 13.5): сохранённые без изменений заменяются новыми.
export const PREVIOUS_DEFAULT_WEIGHTS = {
  sun: 2, moon: 2, ascendant: 2, mercury: 1, venus: 1, mars: 1, jupiter: 1, saturn: 1, mc: 1,
  uranus: 0.5, neptune: 0.5, pluto: 0.5, node: 0, lilith: 0,
};

// Пороги уровней при сумме 26 баллов (при других весах масштабируются пропорционально).
// Стихии (норма ~6.5): 0–1 — нет, до 3 — дефицит, 5–8 — норма, от 9 — избыток.
// Кресты (норма ~8.6): до 5 — дефицит, 6–10 — норма, от 11 — избыток.
// Между дефицитом и нормой — «ниже нормы».
export const BASE_TOTAL = 26;
export const ELEMENT_LEVELS = { absent: 1, deficit: 3, normFrom: 5, excessFrom: 9 };
export const MODALITY_LEVELS = { absent: null, deficit: 5, normFrom: 6, excessFrom: 11 };

/** 'absent' | 'deficit' | 'low' | 'norm' | 'excess' for a score; `scale` = total / BASE_TOTAL. */
function levelOf(score, levels, scale) {
  if (levels.absent != null && score <= levels.absent * scale) return 'absent';
  if (score <= levels.deficit * scale) return 'deficit';
  if (score < levels.normFrom * scale) return 'low';
  if (score >= levels.excessFrom * scale) return 'excess';
  return 'norm';
}

export const ELEMENTS = [
  { id: 'fire' },
  { id: 'earth' },
  { id: 'air' },
  { id: 'water' },
];

export const MODALITIES = [
  { id: 'cardinal' },
  { id: 'fixed' },
  { id: 'mutable' },
];

function scoringPoints(chartData) {
  const angles = [
    { id: 'ascendant', longitude: chartData.ascendant },
    { id: 'mc', longitude: chartData.mc },
  ];
  return [...chartData.planets, ...angles].map((p) => ({
    id: p.id,
    sign: SIGNS[Math.floor(normalize(p.longitude) / 30)],
  }));
}

function tally(points, weights, key, groups, levels) {
  const scores = Object.fromEntries(groups.map((g) => [g.id, 0]));
  let total = 0;
  for (const point of points) {
    const weight = weights[point.id] ?? 0;
    scores[point.sign[key]] += weight;
    total += weight;
  }
  const scale = total / BASE_TOTAL;
  return groups.map((g) => ({
    ...g,
    score: scores[g.id],
    percent: total ? (scores[g.id] / total) * 100 : 0,
    level: levelOf(scores[g.id], levels, scale),
  }));
}

/** Всё, что делит первое место (при ничьей — несколько). */
const leadersOf = (items) => {
  const top = Math.max(...items.map((i) => i.score));
  return items.filter((i) => i.score === top);
};

export function calculateBalance(chartData, weights = DEFAULT_WEIGHTS) {
  const points = scoringPoints(chartData);
  const elements = tally(points, weights, 'element', ELEMENTS, ELEMENT_LEVELS);
  const modalities = tally(points, weights, 'modality', MODALITIES, MODALITY_LEVELS);
  const dominantElements = leadersOf(elements);
  const dominantModalities = leadersOf(modalities);

  // Светила — главный ориентир при ничьей: их стихия и крест ощущаются сильнее всего.
  const luminaries = points.filter((p) => ['sun', 'moon', 'ascendant'].includes(p.id));
  // При ничьей синтетических знаков несколько: каждая стихия-лидер с каждым крестом-лидером.
  const syntheticSigns = SIGNS.filter(
    (s) => dominantElements.some((e) => e.id === s.element) && dominantModalities.some((m) => m.id === s.modality)
  ).map((sign) => ({
    sign,
    // Сколько совпадений со светилами по стихии и кресту.
    support: luminaries.reduce(
      (n, l) => n + (l.sign.element === sign.element) + (l.sign.modality === sign.modality),
      0
    ),
  }));
  const best = Math.max(...syntheticSigns.map((s) => s.support));
  const closest = syntheticSigns.filter((s) => s.support === best);

  return {
    elements,
    modalities,
    dominantElements,
    dominantModalities,

    syntheticSigns,
    // Знак, ближе всех к светилам, — только если такой один.
    closestSign: syntheticSigns.length > 1 && closest.length === 1 ? closest[0].sign : null,
    luminaries,
  };
}
