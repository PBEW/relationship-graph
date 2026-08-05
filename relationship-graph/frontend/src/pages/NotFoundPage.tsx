import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">ไม่พบหน้านี้</p>
      <Button asChild>
        <Link to="/">กลับไปหน้าแดชบอร์ด</Link>
      </Button>
    </div>
  );
}
