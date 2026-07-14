import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>AKUR - Integrasi Spreadsheet Akur Optic 55</title>
        <meta name="description" content="Sistem Manajemen Transaksi Terpusat Akur Optic 55" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-violet-500 selection:text-white">
        <Component {...pageProps} />
      </div>
    </>
  );
}
