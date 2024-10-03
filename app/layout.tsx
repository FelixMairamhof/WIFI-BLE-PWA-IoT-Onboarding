import { ToastProvider } from "@/components/ui/toast"; // Adjust import path
import { Toaster } from "@/components/ui/toaster"; // Ensure you have the Toaster component
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <html lang="en">
        <head />
        <body>
          {children}
          <Toaster />
        </body>
      </html>
    </ToastProvider>
  );
}
