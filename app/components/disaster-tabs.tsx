// app/components/disaster-tabs.tsx
"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("./Map"), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center">Loading map...</div>
});

const disasterTabs = [
  {
    value: "latest-earthquake",
    label: "Earthquake Bulletin",
  },
  {
    value: "volcano-bulletin",
    label: "Volcano Bulletin",
  },
  {
    value: "tsunami-bulletin",
    label: "Tsunami Bulletin",
  },
  {
    value: "landslide",
    label: "Landslide",
  },
];

export function DisasterTabs() {
  const [currentTab, setCurrentTab] = React.useState("latest-earthquake");
  
  return (
    <Tabs defaultValue="latest-earthquake" value={currentTab} onValueChange={setCurrentTab} className="w-full h-full flex flex-col">
      {/* Header with title and tabs on the same line */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Philippines Disaster Monitoring</h1>
        
        <TabsList className="grid grid-cols-4 bg-white shadow-lg">
          {disasterTabs.map((tabItem) => (
            <TabsTrigger key={tabItem.value} value={tabItem.value}>
              {tabItem.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      
      {/* Content area */}
      {disasterTabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="flex-1 min-h-0 m-0 data-[state=inactive]:hidden">
          <Map tabId={tab.value} />
        </TabsContent>
      ))}
    </Tabs>
  );
}