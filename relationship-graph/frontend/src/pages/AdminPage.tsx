import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminPeopleSection } from "@/pages/admin/AdminPeopleSection";
import { AdminRelationshipsSection } from "@/pages/admin/AdminRelationshipsSection";
import { AdminRelationshipTypesSection } from "@/pages/admin/AdminRelationshipTypesSection";

export function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Admin</h1>

      <Tabs defaultValue="people">
        <TabsList>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
          <TabsTrigger value="types">Relationship Types</TabsTrigger>
        </TabsList>
        <TabsContent value="people">
          <AdminPeopleSection />
        </TabsContent>
        <TabsContent value="relationships">
          <AdminRelationshipsSection />
        </TabsContent>
        <TabsContent value="types">
          <AdminRelationshipTypesSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
