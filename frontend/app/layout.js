import "./globals.css";


export const metadata = {
  title: "TerraTrust",
  description: "Quick Climate Risk Check",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
