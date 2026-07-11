import { Outlet, Navigate } from 'react-router-dom';
import { Header } from './header';
import { Footer } from './footer';

export function AppShell() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-16">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export function ProtectedShell() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-16 pb-8">
        <Outlet />
      </main>
    </>
  );
}