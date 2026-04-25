"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getMe } from "@/lib/api";
import { roleStorage, tokenStorage } from "@/lib/auth";

export function useAdminAccess() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const accessToken = tokenStorage.get();

    if (!accessToken) {
      router.replace("/login");
      setIsChecking(false);
      return;
    }

    getMe()
      .then((me) => {
        roleStorage.set(me.role);
        if (me.role === "admin") {
          setIsAdmin(true);
        } else {
          router.replace("/agent/dashboard");
        }
      })
      .catch(() => {
        tokenStorage.clear();
        roleStorage.clear();
        router.replace("/login");
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, [router]);

  return { isChecking, isAdmin };
}
