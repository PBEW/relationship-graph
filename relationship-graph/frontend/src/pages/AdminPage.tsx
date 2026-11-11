import { HeartHandshake, History, Tag, UserCog, UsersRound, type LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { AdminActivitySection } from "@/pages/admin/AdminActivitySection";
import { AdminPeopleSection } from "@/pages/admin/AdminPeopleSection";
import { AdminRelationshipsSection } from "@/pages/admin/AdminRelationshipsSection";
import { AdminRelationshipTypesSection } from "@/pages/admin/AdminRelationshipTypesSection";
import { AdminUsersSection } from "@/pages/admin/AdminUsersSection";

interface AdminSection {
  value: string;
  icon: LucideIcon;
  name: string;
  purpose: string;
  superAdminOnly?: boolean;
  content: React.ReactNode;
}

const SECTIONS: AdminSection[] = [
  {
    value: "people",
    icon: UsersRound,
    name: "คน",
    purpose: "เพิ่มหรือแก้ไขข้อมูลคน",
    content: <AdminPeopleSection />,
  },
  {
    value: "relationships",
    icon: HeartHandshake,
    name: "ความสัมพันธ์",
    purpose: "ดูและแก้ความสัมพันธ์ทั้งหมด",
    content: <AdminRelationshipsSection />,
  },
  {
    value: "types",
    icon: Tag,
    name: "ประเภทความสัมพันธ์",
    purpose: "ตั้งชื่อและสีของเส้น",
    content: <AdminRelationshipTypesSection />,
  },
  {
    value: "users",
    icon: UserCog,
    name: "ผู้ใช้งาน",
    purpose: "เพิ่มบัญชีหรือระงับการเข้าใช้",
    superAdminOnly: true,
    content: <AdminUsersSection />,
  },
  {
    value: "activity",
    icon: History,
    name: "ประวัติการใช้งาน",
    purpose: "ดูว่าใครทำอะไรเมื่อไหร่",
    superAdminOnly: true,
    content: <AdminActivitySection />,
  },
];

export function AdminPage() {
  const { isSuperAdmin } = useAuth();
  const sections = SECTIONS.filter((section) => isSuperAdmin || !section.superAdminOnly);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <PageHeader title="จัดการข้อมูล" description="เพิ่ม แก้ไข และดูแลข้อมูลของกลุ่ม" />

      <Tabs defaultValue="people" className="gap-6">
        {/* Radix tabs keep the semantics and arrow keys; they just look like a
            set of cards saying what each one is for. */}
        <TabsList
          variant="line"
          className={cn(
            // The list's own justify-center would shrink an auto column to its content.
            "grid w-full grid-cols-2 items-stretch justify-normal gap-2 rounded-none p-0 group-data-[orientation=horizontal]/tabs:h-auto sm:gap-3 max-lg:[&>:last-child:nth-child(odd)]:col-span-2",
            isSuperAdmin ? "lg:grid-cols-5" : "lg:grid-cols-3",
          )}
        >
          {sections.map(({ value, icon: Icon, name, purpose }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="group/chooser h-auto flex-col items-start justify-start gap-0.5 rounded-2xl bg-card p-3 text-left whitespace-normal text-foreground shadow-soft after:hidden data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:hover:bg-muted sm:p-4"
            >
              <span className="flex items-center gap-2 font-semibold">
                <Icon className="size-5" />
                {name}
              </span>
              <span className="block text-xs font-normal group-data-[state=inactive]/chooser:text-muted-foreground">
                {purpose}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {sections.map(({ value, content }) => (
          <TabsContent key={value} value={value}>
            {content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
