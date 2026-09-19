import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import NavBar from "./NavBar";

export const metadata = {
  title: "Soil Deficiency Report",
  description: "Upload a soil lab report, pay, and get a deficiency report with product recommendations.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0d1210",
};

export default async function RootLayout({ children }) {
  const user = await getSessionUser();

  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <NavBar user={user} />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
