"use client";

import React, { ReactNode, useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { botchainMainnet, localhostChain } from "../lib/contracts";

export const wagmiConfig = createConfig({
  chains: [botchainMainnet, localhostChain],
  connectors: [injected()],
  transports: {
    [botchainMainnet.id]: http(process.env.NEXT_PUBLIC_BOTCHAIN_RPC_URL || "https://rpc.botchain.ai"),
    [localhostChain.id]: http("http://127.0.0.1:8545"),
  },
});

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
