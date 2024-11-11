/** A growable byte buffer with LEB128 varints — the share codec's writer. */
export class ByteWriter {
  private bytes: number[] = [];

  u8(value: number): this {
    this.bytes.push(value & 0xff);
    return this;
  }

  /** LEB128 unsigned varint. */
  varint(value: number): this {
    let remaining = Math.max(0, Math.trunc(value));
    do {
      let byte = remaining & 0x7f;
      remaining = Math.floor(remaining / 128);
      if (remaining > 0) byte |= 0x80;
      this.bytes.push(byte);
    } while (remaining > 0);
    return this;
  }

  /** Zigzag-encoded signed varint, so small negatives stay one byte. */
  svarint(value: number): this {
    const n = Math.trunc(value);
    return this.varint(n < 0 ? -2 * n - 1 : 2 * n);
  }

  /** Length-prefixed UTF-8 string. */
  string(value: string): this {
    const encoded = new TextEncoder().encode(value);
    this.varint(encoded.length);
    for (const byte of encoded) this.bytes.push(byte);
    return this;
  }

  finish(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

/** The matching reader. Every read is bounds-checked. */
export class ByteReader {
  private offset = 0;

  constructor(private readonly bytes: Uint8Array) {}

  get done(): boolean {
    return this.offset >= this.bytes.length;
  }

  u8(): number {
    if (this.offset >= this.bytes.length) {
      throw new RangeError("Unexpected end of payload");
    }
    return this.bytes[this.offset++]!;
  }

  varint(): number {
    let result = 0;
    let shift = 1;

    for (let i = 0; i < 8; i++) {
      const byte = this.u8();
      result += (byte & 0x7f) * shift;
      if ((byte & 0x80) === 0) return result;
      shift *= 128;
    }

    throw new RangeError("Varint is too long");
  }

  svarint(): number {
    const value = this.varint();
    return value % 2 === 0 ? value / 2 : -(value + 1) / 2;
  }

  string(): string {
    const length = this.varint();
    if (this.offset + length > this.bytes.length) {
      throw new RangeError("String runs past the end of the payload");
    }
    const slice = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    return new TextDecoder().decode(slice);
  }
}
