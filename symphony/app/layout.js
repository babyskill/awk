import "./globals.css";

export const metadata = {
  title: "AWKit Symphony",
  description: "Bảng điều khiển đa Agent",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" data-theme="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
