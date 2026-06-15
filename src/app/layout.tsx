import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "AuditFlow",
  description: "Automate compliance audits. Ingest evidence, verify ISO 27001 and GDPR controls, and export auditor-ready packs in seconds.",
  metadataBase: new URL("https://auditflow.uk.com"),
  openGraph: {
    title: "AuditFlow",
    description: "Automate compliance audits. Ingest evidence, verify ISO 27001 and GDPR controls, and export auditor-ready packs in seconds.",
    url: "https://auditflow.uk.com",
    siteName: "AuditFlow",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AuditFlow Compliance Automation",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AuditFlow",
    description: "Automate compliance audits. Ingest evidence, verify ISO 27001 and GDPR controls, and export auditor-ready packs in seconds.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
