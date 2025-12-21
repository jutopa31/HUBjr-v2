interface CostSnapshot {
  daily: number;
  monthly: number;
  lastReset: string;
}

const COST_KEY = 'evolucionador_ocr_costs';

const todayKey = () => new Date().toISOString().split('T')[0];

const loadSnapshot = (): CostSnapshot => {
  if (typeof localStorage === 'undefined') {
    return { daily: 0, monthly: 0, lastReset: todayKey() };
  }
  const saved = localStorage.getItem(COST_KEY);
  if (!saved) {
    return { daily: 0, monthly: 0, lastReset: todayKey() };
  }
  return JSON.parse(saved) as CostSnapshot;
};

const saveSnapshot = (snapshot: CostSnapshot): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(COST_KEY, JSON.stringify(snapshot));
};

const resetIfNeeded = (snapshot: CostSnapshot): CostSnapshot => {
  const today = todayKey();
  if (snapshot.lastReset !== today) {
    return { daily: 0, monthly: snapshot.monthly, lastReset: today };
  }
  return snapshot;
};

export class OCRCostCalculator {
  private snapshot: CostSnapshot;

  constructor() {
    this.snapshot = resetIfNeeded(loadSnapshot());
  }

  track(cost: number): void {
    this.snapshot = resetIfNeeded(this.snapshot);
    this.snapshot.daily += cost;
    this.snapshot.monthly += cost;
    saveSnapshot(this.snapshot);
  }

  getCosts(): { daily: number; monthly: number } {
    this.snapshot = resetIfNeeded(this.snapshot);
    return { daily: this.snapshot.daily, monthly: this.snapshot.monthly };
  }
}
