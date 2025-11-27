export const predictNextPeriod = (cycles) => {
  if (cycles.length === 0) return null;

  const lastCycle = cycles[0];
  const avgCycleLength = cycles.reduce((sum, cycle) => sum + cycle.cycleLength, 0) / cycles.length;

  const nextPeriod = new Date(lastCycle.startDate);
  nextPeriod.setDate(nextPeriod.getDate() + avgCycleLength);

  return nextPeriod;
};

export const predictOvulation = (nextPeriod) => {
  if (!nextPeriod) return null;

  const ovulation = new Date(nextPeriod);
  ovulation.setDate(ovulation.getDate() - 14);

  return ovulation;
};

export const predictFertileWindow = (ovulation) => {
  if (!ovulation) return null;

  const start = new Date(ovulation);
  start.setDate(start.getDate() - 5);

  const end = new Date(ovulation);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

export const calculateCycleStats = (cycles) => {
  if (cycles.length === 0) return null;

  const cycleLengths = cycles.map(cycle => cycle.cycleLength);
  const periodLengths = cycles.map(cycle => cycle.periodLength);

  return {
    avgCycleLength: cycleLengths.reduce((a, b) => a + b) / cycleLengths.length,
    avgPeriodLength: periodLengths.reduce((a, b) => a + b) / periodLengths.length,
    cycleVariability: Math.max(...cycleLengths) - Math.min(...cycleLengths),
    isRegular: Math.max(...cycleLengths) - Math.min(...cycleLengths) <= 7
  };
};