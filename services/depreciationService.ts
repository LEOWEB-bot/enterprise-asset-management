// Helper Kalkulasi Depresiasi Garis Lurus (Straight-Line Depreciation)

export interface DepreciationScheduleItem {
  yearNumber: number;
  yearLabel: string;
  beginningValue: number;
  depreciationAmount: number;
  accumulatedDepreciation: number;
  endingBookValue: number;
}

export function calculateStraightLineDepreciation(
  purchaseCost: number,
  residualValue: number,
  usefulLifeYears: number,
  purchaseDateStr: string
): {
  annualDepreciation: number;
  monthlyDepreciation: number;
  currentBookValue: number;
  accumulatedDepreciation: number;
  ageYears: number;
  isFullyDepreciated: boolean;
  schedule: DepreciationScheduleItem[];
} {
  const depreciableAmount = Math.max(0, purchaseCost - residualValue);
  const years = Math.max(1, usefulLifeYears);
  const annualDepreciation = depreciableAmount / years;
  const monthlyDepreciation = annualDepreciation / 12;

  const purchaseDate = new Date(purchaseDateStr || Date.now());
  const now = new Date();
  
  const diffTime = Math.max(0, now.getTime() - purchaseDate.getTime());
  const ageYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);

  const accumulatedDepreciation = Math.min(
    depreciableAmount,
    annualDepreciation * ageYears
  );

  const currentBookValue = Math.max(
    residualValue,
    purchaseCost - accumulatedDepreciation
  );

  const isFullyDepreciated = ageYears >= years;

  // Jadwal Depresiasi per Tahun
  const schedule: DepreciationScheduleItem[] = [];
  let prevEnding = purchaseCost;
  let runningAccum = 0;
  const startYear = purchaseDate.getFullYear();

  for (let i = 1; i <= years; i++) {
    const dep = Math.min(prevEnding - residualValue, annualDepreciation);
    runningAccum += dep;
    const ending = Math.max(residualValue, prevEnding - dep);

    schedule.push({
      yearNumber: i,
      yearLabel: `Tahun ke-${i} (${startYear + i - 1})`,
      beginningValue: prevEnding,
      depreciationAmount: dep,
      accumulatedDepreciation: runningAccum,
      endingBookValue: ending,
    });

    prevEnding = ending;
  }

  return {
    annualDepreciation,
    monthlyDepreciation,
    currentBookValue,
    accumulatedDepreciation,
    ageYears,
    isFullyDepreciated,
    schedule,
  };
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
