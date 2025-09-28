// Stub for node-forge and forge-light/lib/pem to prevent import errors
const mockForge = {
  pem: {
    encode: () => '',
    decode: () => ({}),
  },
  asn1: {
    create: () => ({}),
    fromDer: () => ({}),
    toDer: () => '',
  },
  pkcs8: {
    privateKeyFromAsn1: () => ({}),
    privateKeyToAsn1: () => ({}),
  },
  rsa: {
    generateKeyPair: () => ({ privateKey: {}, publicKey: {} }),
  },
  util: {
    encode64: () => '',
    decode64: () => '',
    bytesToHex: () => '',
    hexToBytes: () => new Uint8Array(),
  },
};

export default mockForge;
export const encode = () => '';
export const decode = () => ({});
export const pem = mockForge.pem;
export const asn1 = mockForge.asn1;
export const pkcs8 = mockForge.pkcs8;
export const rsa = mockForge.rsa;
export const util = mockForge.util;