/** Char/4 is the conservative estimate used by the token budget test. */
export const estimateTokens = (text: string) => Math.ceil(text.length / 4);

export const ON_DEVICE_CEILING = 4000;
