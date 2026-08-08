import { useEffect, useState } from "react";

import { SLOW_REQUEST_EVENT } from "@/api/client";

/**
 * True while an API request has been running long enough that the free-tier
 * backend is most likely still booting (see the slow-request tracking in
 * api/client.ts).
 */
export function useServerWaking(): boolean {
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    const handleSlow = (event: Event) => {
      setWaking((event as CustomEvent<boolean>).detail);
    };
    window.addEventListener(SLOW_REQUEST_EVENT, handleSlow);
    return () => window.removeEventListener(SLOW_REQUEST_EVENT, handleSlow);
  }, []);

  return waking;
}
