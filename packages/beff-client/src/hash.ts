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
export const stringWithFormatHash = generateHashFromString("StringWithFormat");
export const numberWithFormatHash = generateHashFromString("NumberWithFormat");
export const anyOfConstsHash = generateHashFromString("AnyOfConsts");
export const tupleHash = generateHashFromString("Tuple");
export const allOfHash = generateHashFromString("AllOf");
export const anyOfHash = generateHashFromString("AnyOf");
export const optionalFieldHash = generateHashFromString("OptionalField");
export const mapHash = generateHashFromString("Map");
export const setHash = generateHashFromString("Set");

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98,
  0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8,
  0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
  0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
  0xc67178f2,
]);

const HEX = "0123456789abcdef";
const textEncoder = new TextEncoder();

function rotateRight(value: number, bits: number): number {
  return (value >>> bits) | (value << (32 - bits));
}

function canonicalNumber(value: number): string {
  if (Number.isNaN(value)) return "NaN";
  if (Object.is(value, -0)) return "-0";
  return String(value);
}

export class Hash256Writer {
  private h0 = 0x6a09e667;
  private h1 = 0xbb67ae85;
  private h2 = 0x3c6ef372;
  private h3 = 0xa54ff53a;
  private h4 = 0x510e527f;
  private h5 = 0x9b05688c;
  private h6 = 0x1f83d9ab;
  private h7 = 0x5be0cd19;
  private buffer = new Uint8Array(64);
  private bufferLength = 0;
  private bytesHashed = 0;
  private finished = false;

  updateTag(value: string): void {
    this.updateByte(1);
    this.updateUtf8WithLength(value);
  }

  updateString(value: string): void {
    this.updateByte(2);
    this.updateUtf8WithLength(value);
  }

  updateNumber(value: number): void {
    this.updateByte(3);
    this.updateUtf8WithLength(canonicalNumber(value));
  }

  updateBoolean(value: boolean): void {
    this.updateByte(value ? 4 : 5);
  }

  updateNull(): void {
    this.updateByte(6);
  }

  private updateByte(value: number): void {
    this.updateBytes(Uint8Array.of(value));
  }

  private updateUtf8WithLength(value: string): void {
    const bytes = textEncoder.encode(value);
    this.updateUint32(bytes.length);
    this.updateBytes(bytes);
  }

  private updateUint32(value: number): void {
    this.updateBytes(
      Uint8Array.of((value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255),
    );
  }

  private updateBytes(data: Uint8Array): void {
    if (this.finished) {
      throw new Error("Hash256Writer: digest already called");
    }

    let position = 0;
    this.bytesHashed += data.length;
    while (position < data.length) {
      const space = 64 - this.bufferLength;
      const inputPart = data.subarray(position, position + space);
      this.buffer.set(inputPart, this.bufferLength);
      this.bufferLength += inputPart.length;
      position += inputPart.length;

      if (this.bufferLength === 64) {
        this.processChunk(this.buffer);
        this.bufferLength = 0;
      }
    }
  }

  private processChunk(chunk: Uint8Array): void {
    const words = new Uint32Array(64);
    for (let i = 0; i < 16; i++) {
      const j = i * 4;
      words[i] = ((chunk[j] << 24) | (chunk[j + 1] << 16) | (chunk[j + 2] << 8) | chunk[j + 3]) >>> 0;
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotateRight(words[i - 15], 7) ^ rotateRight(words[i - 15], 18) ^ (words[i - 15] >>> 3);
      const s1 = rotateRight(words[i - 2], 17) ^ rotateRight(words[i - 2], 19) ^ (words[i - 2] >>> 10);
      words[i] = (words[i - 16] + s0 + words[i - 7] + s1) >>> 0;
    }

    let a = this.h0;
    let b = this.h1;
    let c = this.h2;
    let d = this.h3;
    let e = this.h4;
    let f = this.h5;
    let g = this.h6;
    let h = this.h7;

    for (let i = 0; i < 64; i++) {
      const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + SHA256_K[i] + words[i]) >>> 0;
      const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    this.h0 = (this.h0 + a) >>> 0;
    this.h1 = (this.h1 + b) >>> 0;
    this.h2 = (this.h2 + c) >>> 0;
    this.h3 = (this.h3 + d) >>> 0;
    this.h4 = (this.h4 + e) >>> 0;
    this.h5 = (this.h5 + f) >>> 0;
    this.h6 = (this.h6 + g) >>> 0;
    this.h7 = (this.h7 + h) >>> 0;
  }

  digestHex(): string {
    if (this.finished) {
      throw new Error("Hash256Writer: digest already called");
    }
    this.finished = true;

    const bitLengthHigh = Math.floor((this.bytesHashed * 8) / 0x100000000);
    const bitLengthLow = (this.bytesHashed * 8) >>> 0;

    this.buffer[this.bufferLength++] = 0x80;
    if (this.bufferLength > 56) {
      this.buffer.fill(0, this.bufferLength, 64);
      this.processChunk(this.buffer);
      this.bufferLength = 0;
    }

    this.buffer.fill(0, this.bufferLength, 56);
    this.buffer[56] = (bitLengthHigh >>> 24) & 255;
    this.buffer[57] = (bitLengthHigh >>> 16) & 255;
    this.buffer[58] = (bitLengthHigh >>> 8) & 255;
    this.buffer[59] = bitLengthHigh & 255;
    this.buffer[60] = (bitLengthLow >>> 24) & 255;
    this.buffer[61] = (bitLengthLow >>> 16) & 255;
    this.buffer[62] = (bitLengthLow >>> 8) & 255;
    this.buffer[63] = bitLengthLow & 255;
    this.processChunk(this.buffer);

    const words = [this.h0, this.h1, this.h2, this.h3, this.h4, this.h5, this.h6, this.h7];
    let out = "";
    for (const word of words) {
      for (let shift = 28; shift >= 0; shift -= 4) {
        out += HEX[(word >>> shift) & 15];
      }
    }
    return out;
  }
}
