import { SIGNS, normalize } from './ephemeris';

// Веса объектов для баланса стихий и крестов. Сумма ядра — 13.5 балла.
export const DEFAULT_WEIGHTS = {
  sun: 2,
  moon: 2,
  ascendant: 2,
  mercury: 1,
  venus: 1,
  mars: 1,
  jupiter: 1,
  saturn: 1,
  mc: 1,
  uranus: 0.5,
  neptune: 0.5,
  pluto: 0.5,
  node: 0,
  lilith: 0,
};

// Стихия с суммой ниже порога считается дефицитной.
export const DEFICIT_THRESHOLD = 1.5;

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

function tally(points, weights, key, groups) {
  const scores = Object.fromEntries(groups.map((g) => [g.id, 0]));
  let total = 0;
  for (const point of points) {
    const weight = weights[point.id] ?? 0;
    scores[point.sign[key]] += weight;
    total += weight;
  }
  return groups.map((g) => ({
    ...g,
    score: scores[g.id],
    percent: total ? (scores[g.id] / total) * 100 : 0,
  }));
}

const dominantOf = (items) => items.reduce((a, b) => (b.score > a.score ? b : a));

export function calculateBalance(chartData, weights = DEFAULT_WEIGHTS) {
  const points = scoringPoints(chartData);
  const elements = tally(points, weights, 'element', ELEMENTS);
  const modalities = tally(points, weights, 'modality', MODALITIES);
  const dominantElement = dominantOf(elements);
  const dominantModality = dominantOf(modalities);

  return {
    elements,
    modalities,
    dominantElement,
    dominantModality,
    // Ничья за первое место делает синтетический знак неоднозначным.
    elementTie: elements.filter((e) => e.score === dominantElement.score).length > 1,
    modalityTie: modalities.filter((m) => m.score === dominantModality.score).length > 1,
    deficientElements: elements.filter((e) => e.score < DEFICIT_THRESHOLD),
    syntheticSign: SIGNS.find(
      (s) => s.element === dominantElement.id && s.modality === dominantModality.id
    ),
  };
}
