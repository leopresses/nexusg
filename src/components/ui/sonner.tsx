"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      expand
      richColors
      toastOptions={{
        className: `
          !bg-gradient-to-r
          !from-blue-600
          !to-blue-700
          !text-white
          !border-0
          shadow-2xl
        `,
        style: {
          borderRadius: "14px",
          padding: "16px 18px",
        },
      }}
    />
  );
}
