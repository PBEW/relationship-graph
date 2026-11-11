import { Compass } from "lucide-react";
import { Link } from "react-router-dom";

import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <EmptyState
        icon={Compass}
        title="ไม่พบหน้านี้"
        description="ลิงก์นี้อาจผิดหรือถูกย้ายไปแล้ว กลับไปค้นหาคนที่อยากรู้ได้เลย"
        action={
          <Button asChild>
            <Link to="/">กลับไปหน้าค้นหา</Link>
          </Button>
        }
      />
    </div>
  );
}
