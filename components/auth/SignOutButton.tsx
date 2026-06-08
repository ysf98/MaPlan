"use client";

import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  return (
    <form action="/auth/signout" className="w-full" method="post">
      <Button fullWidth size="lg" type="submit" variant="secondary">
        Cerrar sesion
      </Button>
    </form>
  );
}
