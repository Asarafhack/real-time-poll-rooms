import { ReactNode } from "react";
import Navbar from "./Navbar";
import heroBg from "@/assets/hero-bg.jpg";

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen relative">
      <div
        className="fixed inset-0 bg-cover bg-center opacity-10 pointer-events-none"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <Navbar />
      <main className="relative pt-14">{children}</main>
      <footer className="relative border-t border-border py-6 text-center text-xs text-muted-foreground">
        Poll Rooms &mdash; real-time voting
      </footer>
    </div>
  );
}

export default Layout;
