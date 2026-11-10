export const CONDITIONS = [
  "Hypertension",
  "Diabetes",
  "Asthma",
  "Coronary Artery Disease",
  "Migraine",
  "Osteoarthritis",
  "Hypothyroidism",
  "Chronic Kidney Disease",
] as const;

export type Condition = (typeof CONDITIONS)[number];
