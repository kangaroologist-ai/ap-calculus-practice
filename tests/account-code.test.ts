import { describe, expect, it } from "vitest";
import {
  CODE_ALPHABET,
  MAX_BODY_CHARS,
  PROGRESS_CODE_PATTERN,
  formatLoginCode,
  formatTeacherCode,
  isValidPrefix,
  newLoginCode,
  newTeacherCode,
  normalizeLoginCode,
  normalizeTeacherCode,
  randomCodePart,
  sha256Hex,
} from "../src/account-code";

describe("login code alphabet and generation", () => {
  it("uses Crockford Base32 without I, L, O, and U", () => {
    expect(CODE_ALPHABET).toBe("0123456789ABCDEFGHJKMNPQRSTVWXYZ");
    expect(CODE_ALPHABET).toHaveLength(32);
    expect(CODE_ALPHABET).not.toMatch(/[ILOU]/);
  });

  it("generates a 10-character random part behind the class prefix", () => {
    for (let index = 0; index < 50; index += 1) {
      const code = newLoginCode("CALC");
      expect(code).toHaveLength(14);
      expect(code.startsWith("CALC")).toBe(true);
      expect([...code.slice(4)].every((char) => CODE_ALPHABET.includes(char))).toBe(
        true,
      );
    }
  });

  it("generates a 16-character teacher code", () => {
    for (let index = 0; index < 50; index += 1) {
      const code = newTeacherCode();
      expect(code).toHaveLength(16);
      expect([...code].every((char) => CODE_ALPHABET.includes(char))).toBe(true);
    }
  });

  it("rejects a prefix that is not 2 to 8 upper-case letters", () => {
    expect(() => newLoginCode("CALC")).not.toThrow();
    expect(() => newLoginCode("calc")).toThrow();
    expect(() => newLoginCode("C")).toThrow();
    expect(() => newLoginCode("TOOLONGAB")).toThrow();
  });

  it("takes one byte per character and uses byte & 31 as the index", () => {
    const bytes = Uint8Array.from([0, 1, 30, 31, 32, 33, 63, 64, 128, 255]);
    let received: Uint8Array | undefined;
    const code = randomCodePart(bytes.length, (output) => {
      received = output;
      output.set(bytes);
    });
    expect(received).toBeInstanceOf(Uint8Array);
    expect(received).toHaveLength(bytes.length);
    const expected = [...bytes]
      .map((byte) => CODE_ALPHABET[byte & 31])
      .join("");
    expect(code).toBe(expected);
  });
});

describe("login code normalization", () => {
  it("ignores case, whitespace, and hyphens", () => {
    expect(normalizeLoginCode("calc-k7qm-4zx9-b2")).toBe("CALCK7QM4ZX9B2");
    expect(normalizeLoginCode("  CALC K7QM 4ZX9 B2 ")).toBe("CALCK7QM4ZX9B2");
    expect(normalizeLoginCode("CALCK7QM4ZX9B2")).toBe("CALCK7QM4ZX9B2");
  });

  it("reads O, I, and L in the random part as 0 and 1", () => {
    expect(normalizeLoginCode("TEST-OIL2-3456-78")).toBe("TEST0112345678");
  });

  it("keeps O and I in the class prefix as typed", () => {
    expect(normalizeLoginCode("BOIL-K7QM-4ZX9-B2")).toBe("BOILK7QM4ZX9B2");
  });

  it("rejects a prefix outside 2 to 8 letters and a random part outside the alphabet", () => {
    expect(normalizeLoginCode("")).toBeNull();
    expect(normalizeLoginCode("TESTK7QM4Z")).toBeNull();
    expect(normalizeLoginCode("TESTK7QM4ZX")).toBeNull();
    expect(normalizeLoginCode("TESTK7QM4ZX9B2ABCDE")).toBeNull();
    expect(normalizeLoginCode("TESTK7QM4ZX9BU")).toBeNull();
    expect(normalizeLoginCode("12STK7QM4ZX9B2")).toBeNull();
  });
});

describe("teacher code normalization", () => {
  it("ignores case, whitespace, and hyphens", () => {
    expect(normalizeTeacherCode("rj7k-2m4x-9qwd-5t8n")).toBe("RJ7K2M4X9QWD5T8N");
  });

  it("reads O, I, and L as 0 and 1", () => {
    expect(normalizeTeacherCode(" OIL2 3456 789A BCDE ")).toBe(
      "01123456789ABCDE",
    );
  });

  it("rejects a wrong length or a character outside the alphabet", () => {
    expect(normalizeTeacherCode("RJ7K2M4X9QWD5T8")).toBeNull();
    expect(normalizeTeacherCode("RJ7K2M4X9QWD5T8NN")).toBeNull();
    expect(normalizeTeacherCode("RJ7K2M4X9QWD5T8U")).toBeNull();
  });
});

describe("formatting and prefixes", () => {
  it("formats a login code as PREFIX-XXXX-XXXX-XX", () => {
    expect(formatLoginCode("TESTK7QM4ZX9B2")).toBe("TEST-K7QM-4ZX9-B2");
    expect(formatLoginCode("CALCK7QM4ZX9B2")).toBe("CALC-K7QM-4ZX9-B2");
  });

  it("formats a teacher code in groups of four", () => {
    expect(formatTeacherCode("RJ7K2M4X9QWD5T8N")).toBe("RJ7K-2M4X-9QWD-5T8N");
  });

  it("accepts only 2 to 8 upper-case letters as a prefix", () => {
    expect(isValidPrefix("AB")).toBe(true);
    expect(isValidPrefix("CALC")).toBe(true);
    expect(isValidPrefix("ABCDEFGH")).toBe(true);
    expect(isValidPrefix("A")).toBe(false);
    expect(isValidPrefix("ABCDEFGHI")).toBe(false);
    expect(isValidPrefix("calc")).toBe(false);
    expect(isValidPrefix("CA1C")).toBe(false);
  });
});

describe("hashing and progress code form", () => {
  it("hashes known vectors with SHA-256", async () => {
    await expect(sha256Hex("")).resolves.toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
    await expect(sha256Hex("abc")).resolves.toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("accepts only the DSP2 code form that encodeProgress makes", () => {
    expect(PROGRESS_CODE_PATTERN.test("DSP2.12345678.AAAA")).toBe(true);
    expect(PROGRESS_CODE_PATTERN.test("DSP2.12345678.a-b_c")).toBe(true);
    expect(PROGRESS_CODE_PATTERN.test("DSP2.1234567.AAAA")).toBe(false);
    expect(PROGRESS_CODE_PATTERN.test("DSP1.12345678.AAAA")).toBe(false);
    expect(PROGRESS_CODE_PATTERN.test("DSP2.12345678.")).toBe(false);
    expect(PROGRESS_CODE_PATTERN.test("DSP2.12345678.AAAA=")).toBe(false);
  });

  it("limits request bodies to 16 KB", () => {
    expect(MAX_BODY_CHARS).toBe(16384);
  });
});
