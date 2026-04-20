import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>RP Game Room</title>
      </Head>
      <body style={{ background: '#0a0a1a', margin: 0, overflow: 'hidden' }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
