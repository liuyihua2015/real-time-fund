import Script from "next/script";
import "./globals.css";
import AnalyticsGate from "./components/AnalyticsGate";
import AppShell from "./components/layout/AppShell";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import { getThemeInitScript } from "./components/theme/themeInitScript";

export const metadata = {
  title: "估值罗盘",
  description: "实时基金估值与持仓管理，一眼看仓位与重仓股",
};

export default function RootLayout({ children }) {
  const GA_ID = "G-PD2JWJHVEM"; // 请在此处替换您的 Google Analytics ID

  return (
    <html lang="zh-CN" data-theme="light" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <Script id="theme-init" strategy="beforeInteractive">
          {getThemeInitScript()}
        </Script>
      </head>
      <body>
        <AnalyticsGate GA_ID={GA_ID} />
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
