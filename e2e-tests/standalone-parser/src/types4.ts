export const a = "a" as const;
export const b = "b" as const;

export const AllTs = [a, b] as const;
export type AllTs = (typeof AllTs)[number];
