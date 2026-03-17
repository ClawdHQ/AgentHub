"use client";

import { http, createConfig } from "wagmi";
import { injected, metaMask } from "wagmi/connectors";
import { QueryClient } from "@tanstack/react-query";
import { defineChain } from "viem";

export const polkadotHubTestnet = defineChain({
  id: 420420421,
  name: "Polkadot Hub Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "DOT",
    symbol: "DOT",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-passet-hub-eth-rpc.polkadot.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://blockscout-passet-hub.parity-testnet.parity.io",
    },
  },
});

export const wagmiConfig = createConfig({
  chains: [polkadotHubTestnet],
  connectors: [injected(), metaMask()],
  transports: {
    [polkadotHubTestnet.id]: http(),
  },
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
    },
  },
});

export const chains = [polkadotHubTestnet] as const;
