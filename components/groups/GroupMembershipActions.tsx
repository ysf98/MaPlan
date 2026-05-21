"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { deleteGroupAction, leaveGroupAction } from "@/app/groups/[groupId]/actions";
import type { DeleteGroupActionState, LeaveGroupActionState } from "@/app/groups/[groupId]/actions";

type GroupMembershipActionsProps = {
  groupId: string;
  groupName: string;
  role: "owner" | "member";
};

const leaveInitialState: LeaveGroupActionState = {
  error: null,
  success: false
};

const deleteInitialState: DeleteGroupActionState = {
  error: null,
  success: false
};

export function GroupMembershipActions({ groupId, groupName, role }: GroupMembershipActionsProps) {
  const [leaveState, leaveAction, isLeaving] = useActionState(leaveGroupAction, leaveInitialState);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteGroupAction, deleteInitialState);
  const [confirmMode, setConfirmMode] = useState<"leave" | "delete" | null>(null);

  return (
    <Card className="rounded-3xl">
      <h2 className="text-lg font-semibold text-zinc-950">Gestion del grupo</h2>
      {role === "owner" ? (
        <>
          <p className="mt-2 text-sm text-zinc-500">Como propietario puedes eliminar el grupo para todos sus miembros.</p>
          {confirmMode !== "delete" ? (
            <div className="mt-4">
              <Button onClick={() => setConfirmMode("delete")} type="button" variant="secondary">
                Eliminar grupo
              </Button>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm text-rose-800">¿Estas seguro que quieres eliminar este grupo ({groupName})?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={deleteAction}>
                  <input name="groupId" type="hidden" value={groupId} />
                  <Button disabled={isDeleting} type="submit" variant="danger">
                    {isDeleting ? "Eliminando..." : "Si, eliminar grupo"}
                  </Button>
                </form>
                <Button onClick={() => setConfirmMode(null)} type="button" variant="ghost">
                  Cancelar
                </Button>
              </div>
            </div>
          )}
          {deleteState.error ? <p className="mt-2 text-sm text-rose-600">{deleteState.error}</p> : null}
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-zinc-500">Si sales del grupo, dejaras de ver sus lugares y actualizaciones.</p>
          {confirmMode !== "leave" ? (
            <div className="mt-4">
              <Button onClick={() => setConfirmMode("leave")} type="button" variant="secondary">
                Salir del grupo
              </Button>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">¿Estas seguro que quieres salir de este grupo ({groupName})?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={leaveAction}>
                  <input name="groupId" type="hidden" value={groupId} />
                  <Button disabled={isLeaving} type="submit" variant="secondary">
                    {isLeaving ? "Saliendo..." : "Si, salir del grupo"}
                  </Button>
                </form>
                <Button onClick={() => setConfirmMode(null)} type="button" variant="ghost">
                  Cancelar
                </Button>
              </div>
            </div>
          )}
          {leaveState.error ? <p className="mt-2 text-sm text-rose-600">{leaveState.error}</p> : null}
        </>
      )}
    </Card>
  );
}
