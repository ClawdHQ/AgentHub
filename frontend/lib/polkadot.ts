// Polkadot Hub specific utilities

// XCM precompile address on Polkadot Hub
export const XCM_PRECOMPILE_ADDRESS =
  "0x0000000000000000000000000000000000000804" as const;

// ERC-4337 EntryPoint on Polkadot Hub Testnet
export const ENTRY_POINT_ADDRESS =
  "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789" as const;

// Chain ID for Polkadot Hub Testnet
export const CHAIN_ID = 420420421;

// Testnet faucet URL
export const FAUCET_URL = "https://faucet.polkadot.io";

// Block explorer
export const EXPLORER_URL =
  "https://blockscout-passet-hub.parity-testnet.parity.io";

/**
 * Format a DOT value from wei to human-readable
 */
export function formatDOT(wei: bigint): string {
  const dot = Number(wei) / 1e18;
  return dot.toFixed(4) + " DOT";
}

/**
 * Get explorer URL for a transaction
 */
export function getTxUrl(hash: string): string {
  return `${EXPLORER_URL}/tx/${hash}`;
}

/**
 * Get explorer URL for an address
 */
export function getAddressUrl(address: string): string {
  return `${EXPLORER_URL}/address/${address}`;
}
