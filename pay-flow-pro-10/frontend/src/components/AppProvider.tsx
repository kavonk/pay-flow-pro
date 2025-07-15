import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "utils/queryClient";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "../internal-components/ThemeProvider";

interface Props {
  children: ReactNode;
}

export const AppProvider = ({ children }: Props) => {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
};
