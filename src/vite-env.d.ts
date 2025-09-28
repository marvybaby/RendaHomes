/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID: string
  readonly VITE_HRM_TOKEN_TESTNET: string
  readonly VITE_HRM_TOKEN_HTS_TESTNET: string
  readonly VITE_WRAPPED_HRM_TESTNET: string
  readonly VITE_WRAPPED_HRM_HTS_TESTNET: string
  readonly VITE_PROPERTY_TOKEN_TESTNET: string
  readonly VITE_DISASTER_MANAGEMENT_TESTNET: string
  readonly VITE_GOVERNANCE_TESTNET: string
  readonly VITE_HEDERA_MIRROR_NODE_URL: string
  readonly VITE_HEDERA_RPC_URL: string
  readonly VITE_PINATA_JWT: string
  readonly VITE_PINATA_GATEWAY: string
  readonly VITE_IPFS_INFURA_AUTH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}