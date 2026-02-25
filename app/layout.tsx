import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DeporteIA - Elite Training Coach',
  description:
    'Entrenador de élite con periodización científica (Zona 2, Lactate Shuttle, Nutrición)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
