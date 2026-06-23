import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Аналитика подключения НП",
  description: "Пробный дашборд для оценки населённых пунктов",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <header className="border-b border-[var(--border)] bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <div>
              <Link href="/" className="text-lg font-bold text-[var(--primary)]">
                Аналитика подключения НП
              </Link>
              <p className="text-sm text-[var(--muted)]">
                Волгоградская область · пробная версия для менеджера
              </p>
            </div>
            <nav className="flex gap-2">
              <Link href="/" className="btn btn-secondary">
                Населённые пункты
              </Link>
              <Link href="/priority" className="btn btn-secondary">
                Сравнение
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        <footer className="border-t border-[var(--border)] bg-white py-2 text-center text-xs text-[var(--muted)]">
          Версия: 2.1
          {process.env.RAILWAY_GIT_COMMIT_SHA
            ? ` · сборка ${process.env.RAILWAY_GIT_COMMIT_SHA.slice(0, 7)}`
            : " · локальный запуск"}
        </footer>
      </body>
    </html>
  );
}
