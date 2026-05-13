"use client";

import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <Button size="sm" type="submit" variant="ghost">
        Cerrar sesion
      </Button>
    </form>
  );
}
