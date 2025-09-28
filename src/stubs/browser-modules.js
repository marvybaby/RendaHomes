// Stub for various browser-specific modules from @hashgraph/sdk

// Hex encoding/decoding
export const encode = (data) => {
  if (typeof data === 'string') return data;
  if (data instanceof Uint8Array) {
    return Array.from(data, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  return '';
};

export const decode = (hex) => {
  if (!hex || typeof hex !== 'string') return new Uint8Array();
  const matches = hex.match(/.{1,2}/g) || [];
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
};

// SHA384 hash function
export const sha384 = {
  hash: (data) => new Uint8Array(48), // 48 bytes for SHA384
  update: function(data) { return this; },
  digest: () => new Uint8Array(48),
};

// UTF8 encoding/decoding
export const utf8Encode = (str) => new TextEncoder().encode(str);
export const utf8Decode = (bytes) => new TextDecoder().decode(bytes);

// Default exports
export default {
  encode,
  decode,
  sha384,
  utf8Encode,
  utf8Decode,
};