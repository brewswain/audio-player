import { ScrollArea } from "@/components/ui/scroll-area";
import { TabsContent } from "@/components/ui/tabs";

const PlaylistTab = () => {
  return (
    <TabsContent value="playlists">
      <ScrollArea className="h-[calc(100vh-250px)]">
        <div className="grid grid-cols-5 gap-4">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-lg p-4 flex flex-col items-center"
            >
              <img
                src={`/placeholder.svg?height=150&width=150`}
                alt="Playlist cover"
                className="w-full aspect-square object-cover rounded-md mb-2"
              />
              <h3 className="font-semibold">Playlist {i + 1}</h3>
              <p className="text-sm text-muted-foreground">25 songs</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </TabsContent>
  );
};

export default PlaylistTab;
