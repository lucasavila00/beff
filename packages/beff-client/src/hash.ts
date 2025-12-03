export function generateHashFromNumbers(numbers: number[]): number {
  let hash = 0;
  // A common prime multiplier used in hashing algorithms
  const multiplier = 31;

  for (let i = 0; i < numbers.length; i++) {
    const value = numbers[i];

    // Ensure the value is treated as an integer
    // We incorporate the number directly into the hash calculation
    hash = hash * multiplier + value;

    // Constrain result to a 32-bit signed integer using bitwise OR 0
    hash |= 0;
  }
  return hash;
}

export function generateHashFromString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    // Equivalent to 'hash * 31 + char' but uses bitwise shifts for speed
    hash = (hash << 5) - hash + char;
    // Constrain to a 32-bit integer
    hash |= 0;
  }
  return hash;
}

export const unknownHash = generateHashFromString("unknown");
export const stringHash = generateHashFromString("string");
export const numberHash = generateHashFromString("number");
export const booleanHash = generateHashFromString("boolean");
export const nullishHash = generateHashFromString("null");
export const undefinedHash = generateHashFromString("undefined");
export const arrayHash = generateHashFromString("array");
export const objectHash = generateHashFromString("object");
export const dateHash = generateHashFromString("date");
export const bigintHash = generateHashFromString("bigint");
