import { TabsList, TabsTrigger } from "@/components/ui/tabs";

const TabsSelector = () => {
  return (
    <TabsList>
      <TabsTrigger value="playlists">Playlists</TabsTrigger>
      <TabsTrigger value="artists">Artists</TabsTrigger>
      <TabsTrigger value="albums">Albums</TabsTrigger>
      <TabsTrigger value="songs">Songs</TabsTrigger>
    </TabsList>
  );
};

export default TabsSelector;
