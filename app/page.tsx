"use client";

import { DisasterTabs } from "./components/disaster-tabs";

export default function Home() {
  return (
    <main className="container mx-auto p-4 h-screen flex flex-col">
      <DisasterTabs />
    </main>
  );
}