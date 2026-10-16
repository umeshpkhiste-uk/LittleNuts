import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// Expo Router renders this once on the server to produce the root HTML
// document for web. Sets the page background to match the app's navy
// theme so the area outside the phone-width frame (see AppShell in
// _layout.tsx) doesn't flash white before hydration / on wide screens.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" style={{ backgroundColor: '#05070C' }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
      </head>
      <body style={{ backgroundColor: '#05070C' }}>{children}</body>
    </html>
  );
}
