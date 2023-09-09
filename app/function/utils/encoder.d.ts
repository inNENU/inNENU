/**
 * A stream represents an ordered sequence of tokens.
 *
 * @constructor
 * @param tokens Array of tokens that provide
 * the stream.
 */
declare class Stream {
  tokens: number[];
  constructor(tokens: number[] | Uint8Array);
  /**
   * @return True if end-of-stream has been hit.
   */
  endOfStream(): boolean;
  /**
   * When a token is read from a stream, the first token in the
   * stream must be returned and subsequently removed, and
   * end-of-stream must be returned otherwise.
   *
   * @return Get the next token from the stream, or
   * end_of_stream.
   */
  read(): number;
  /**
   * When one or more tokens are prepended to a stream, those tokens
   * must be inserted, in given order, before the first token in the
   * stream.
   *
   * @param token The token(s) to prepend to the
   * stream.
   */
  prepend(token: number | number[]): void;
  /**
   * When one or more tokens are pushed to a stream, those tokens
   * must be inserted, in given order, after the last token in the
   * stream.
   *
   * @param token The tokens(s) to push to the
   * stream.
   */
  push(token: number | number[]): void;
}

interface Encoding {
  name: string;
  labels: string[];
}

interface Decoder {
  /**
   * @param stream The stream of bytes being decoded.
   * @param bite The next byte read from the stream.
   * @return The next code point(s)
   *     decoded, or null if not enough data exists in the input
   *     stream to decode a complete code point, or |finished|.
   */
  handler: (stream: Stream, bite: number) => number | number[] | null;
}
declare const decoders: Record<
  string,
  (options: { fatal: boolean }) => Decoder
>;
/**
 * @constructor
 * A TextDecoder object has an associated encoding, decoder,
 * stream, ignore BOM flag (initially unset), BOM seen flag
 * (initially unset), error mode (initially replacement), and do
 * not flush flag (initially unset).
 * @param label The label of the encoding;
 *     defaults to 'utf-8'.
 * @param options
 */
declare class TextDecoder {
  _encoding: Encoding;
  _ignoreBOM: boolean;
  _decoder: Decoder | null;
  _BOMseen: boolean;
  _fatal: boolean;
  doNotFlush: boolean;
  constructor(
    label?: string,
    options?: {
      fatal?: boolean;
      ignoreBOM?: boolean;
    },
  );
  get encoding(): string;
  get fatal(): boolean;
  get ignoreBOM(): boolean;
  /**
   * @param input The buffer of bytes to decode.
   * @param options
   * @return The decoded string.
   */
  decode(
    input: ArrayBuffer | ArrayBufferView,
    options?: {
      stream?: boolean;
    },
  ): string;
  /**
   * @param stream
   */
  private serializeStream;
}

interface Encoder {
  /**
   * @param stream The stream of code points being encoded.
   * @param code_point Next code point read from the stream.
   * @return Byte(s) to emit, or |finished|.
   */
  handler: (stream: Stream, codePoint: number) => number | number[];
}
declare const encoders: Record<
  string,
  (options: { fatal: boolean }) => Encoder
>;
/**
 * @constructor
 *  A TextEncoder object has an associated encoding and encoder.
 * @param label The label of the encoding. NONSTANDARD.
 * @param options NONSTANDARD.
 */
declare class TextEncoder {
  _encoding: Encoding;
  _encoder: Encoder | null;
  doNotFlush: boolean;
  _fatal: boolean;
  constructor(
    label?: string,
    options?: {
      fatal?: boolean;
      NONSTANDARD_allowLegacyEncoding?: boolean;
    },
  );
  get encoding(): string;
  /**
   * @param content The string to encode.
   * @param options
   * @return Encoded bytes, as a Uint8Array.
   */
  encode(
    content?: string,
    options?: {
      stream?: boolean;
    },
  ): Uint8Array;
}

export { Decoder, Encoder, TextDecoder, TextEncoder, decoders, encoders };
