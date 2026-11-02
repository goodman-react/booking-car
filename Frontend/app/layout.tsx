import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workshop bookings",
  description: "Service bay bookings for the caravan workshop",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      {/* Browser extensions and automation tools inject attributes on <body> before hydration. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
