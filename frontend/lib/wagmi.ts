"use client";

import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { QueryClient } from "@tanstack/react-query";
import { polkadotHubTestnet } from "@/lib/chain";

export const wagmiConfig = createConfig({
  chains: [polkadotHubTestnet],
  connectors: [injected()],
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
