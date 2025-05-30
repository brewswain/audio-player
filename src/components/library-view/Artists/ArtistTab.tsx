import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TabsContent } from "@/components/ui/tabs";

const ArtistTab = () => {
  return (
    <TabsContent value="artists">
      <ScrollArea className="h-[calc(100vh-250px)]">
        <div className="grid grid-cols-6 gap-4">
          {[...Array(18)].map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <Avatar className="w-24 h-24 mb-2">
                <AvatarImage
                  src={`/placeholder.svg?height=96&width=96`}
                  alt={`Artist ${i + 1}`}
                />
                <AvatarFallback>A{i + 1}</AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-center">Artist {i + 1}</h3>
            </div>
          ))}
        </div>
      </ScrollArea>
    </TabsContent>
  );
};

export default ArtistTab;
