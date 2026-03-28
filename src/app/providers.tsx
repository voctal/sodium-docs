"use client";

import { Provider as JotaiProvider } from "jotai";
import type { PropsWithChildren } from "react";
import QueryClientProvider from "@/components/providers/QueryClientProvider";

export function Providers({ children }: PropsWithChildren) {
    return (
        <QueryClientProvider>
            <JotaiProvider>{children}</JotaiProvider>
        </QueryClientProvider>
    );
}
