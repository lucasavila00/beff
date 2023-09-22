"use client";

import { ThemeProvider } from "next-themes";
import { FC } from "react";

export const Providers: FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return <ThemeProvider attribute="class">{children}</ThemeProvider>;
};
