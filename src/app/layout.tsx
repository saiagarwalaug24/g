import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import "./globals.css";
import { ThemeProvider } from "@/app/providers/theme-provider";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "EchoLens — AI Meeting Intelligence",
  description: "Upload meeting recordings and get AI-powered transcription with speaker diarization, action items, smart chapters, and semantic Q&A.",
  keywords: ["meeting intelligence", "transcription", "action items", "AI", "whisper", "speaker diarization"],
  openGraph: {
    title: "EchoLens — AI Meeting Intelligence",
    description: "Turn meetings into actionable insights. AI transcription, speaker detection, action items, and semantic Q&A.",
    type: "website",
    siteName: "EchoLens",
  },
  twitter: {
    card: "summary_large_image",
    title: "EchoLens — AI Meeting Intelligence",
    description: "Turn meetings into actionable insights with AI-powered transcription and intelligence.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
