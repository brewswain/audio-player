import { ScrollArea } from "@/components/ui/scroll-area";
import { TabsContent } from "@/components/ui/tabs";
import React from "react";

const SongsTab = ({ children }: { children: React.ReactNode }) => {
  return (
    <TabsContent value="songs">
      <ScrollArea className="h-[calc(100vh-250px)]">{children}</ScrollArea>
    </TabsContent>
  );
};

export default SongsTab;
