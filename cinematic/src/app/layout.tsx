import type { Metadata, Viewport } from 'next';
import { Anton, Hanken_Grotesk, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';

// Distinctive pairing: monumental condensed display (Anton) + editorial italic serif
// (Instrument Serif), a quiet grotesk for reading, and mono for labels.
const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton', display: 'swap' });
const instrument = Instrument_Serif({ weight: '400', style: ['normal', 'italic'], subsets: ['latin'], variable: '--font-instrument', display: 'swap' });
const hanken = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-hanken', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono-face', display: 'swap' });

export const metadata: Metadata = {
  title: 'RANJITH P — Software Engineer',
  description: 'A cinematic portfolio: a miniature developer, a scroll-driven short film. (Placeholder content.)',
};

export const viewport: Viewport = {
  themeColor: '#09090B',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-intro="pending"
      className={`${anton.variable} ${instrument.variable} ${hanken.variable} ${mono.variable}`}
    >
      <head>
        {/* Safety net: whatever happens to the 3D/JS pipeline, content is revealed after 30s. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "setTimeout(function(){document.documentElement.setAttribute('data-intro','done')},30000)",
          }}
        />
        <noscript>
          <style>{`html[data-intro='pending'] .rest, html[data-intro='pending'] .site-chrome{visibility:visible!important;opacity:1!important}`}</style>
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
