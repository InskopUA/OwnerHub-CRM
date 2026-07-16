import "./globals.css";

export const metadata = {
  title: "OwnerHub HRM",
  description: "Recruiting CRM for Owner-Operator onboarding"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
