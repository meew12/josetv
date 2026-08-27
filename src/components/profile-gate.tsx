"use client";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useProfile, Profile } from "@/lib/profile-store";
import { useAuth } from "@/lib/auth-store";
import { useNav } from "@/lib/nav-store";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const AVATAR_OPTIONS = ["🦊", "🐻", "🦁", "🐼", "🐨", "🐯", "🐸", "🐵", "🦄", "🐲"];
const COLOR_OPTIONS = ["#E50914", "#2563eb", "#16a34a", "#ca8a04", "#9333ea", "#0891b2", "#db2777", "#ea580c"];

export function ProfileGate() {
  const { user } = useAuth();
  const { activeProfile, showProfileGate, setActive, hideGate } = useProfile();
  const { navigate } = useNav();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [manageMode, setManageMode] = useState(false);

  const profilesQ = useQuery({
    queryKey: ["profiles"],
    queryFn: () => api.get<{ items: Profile[] }>("/profiles"),
    enabled: !!user,
  });

  const profiles = profilesQ.data?.items ?? [];

  const createMut = useMutation({
    mutationFn: (data: { name: string; avatar: string; color: string; isKids: boolean }) =>
      api.post("/profiles", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profiles"] });
      setShowAdd(false);
      toast({ title: "Perfil creado ✓" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/profiles/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profiles"] });
      setEditingId(null);
      toast({ title: "Perfil actualizado ✓" });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/profiles/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profiles"] });
      toast({ title: "Perfil eliminado" });
    },
  });

  // Auto-crear perfil por defecto si no hay ninguno
  useEffect(() => {
    if (!user || profilesQ.isLoading) return;
    if (profiles.length === 0 && !showAdd) {
      // Crear perfil principal automáticamente
      createMut.mutate({ name: user.name || "Principal", avatar: "🦊", color: "#E50914", isKids: false });
    }
  }, [user, profiles, profilesQ.isLoading, showAdd]);

  if (!user || (!showProfileGate && activeProfile)) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <h1 className="mb-8 text-center text-3xl font-black text-white sm:text-4xl md:text-5xl">
          {manageMode ? "Administrar perfiles" : "¿Quién está mirando?"}
        </h1>

        <div className="mb-8 flex flex-wrap justify-center gap-4 sm:gap-8">
          {profiles.map((p, i) => (
            <ProfileCard
              key={p.id}
              profile={p}
              index={i}
              manageMode={manageMode}
              onEdit={() => setEditingId(p.id)}
              onDelete={() => deleteMut.mutate(p.id)}
              onSelect={() => {
                setActive(p);
                navigate("browse");
              }}
            />
          ))}

          {/* Add profile button */}
          {profiles.length < 4 && !manageMode && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: profiles.length * 0.1 }}
              onClick={() => setShowAdd(true)}
              className="group flex flex-col items-center gap-2"
            >
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-border bg-card/40 text-muted-foreground transition group-hover:border-primary group-hover:text-primary sm:h-32 sm:w-32">
                <Plus className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                Agregar perfil
              </span>
            </motion.button>
          )}
        </div>

        {profiles.length > 0 && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setManageMode((v) => !v)}
              className="min-w-[200px]"
            >
              {manageMode ? "Listo" : "Administrar perfiles"}
            </Button>
          </div>
        )}
      </motion.div>

      {/* Add/Edit Dialog */}
      <ProfileFormDialog
        open={showAdd || editingId !== null}
        onOpenChange={(v) => {
          if (!v) {
            setShowAdd(false);
            setEditingId(null);
          }
        }}
        profile={editingId ? profiles.find((p) => p.id === editingId) ?? null : null}
        onSubmit={(data) => {
          if (editingId) {
            updateMut.mutate({ id: editingId, data });
          } else {
            createMut.mutate(data);
          }
        }}
        loading={createMut.isPending || updateMut.isPending}
      />
    </div>
  );
}

function ProfileCard({
  profile,
  index,
  manageMode,
  onEdit,
  onDelete,
  onSelect,
}: {
  profile: Profile;
  index: number;
  manageMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSelect: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className="group flex flex-col items-center gap-2"
    >
      <div className="relative">
        <button
          onClick={manageMode ? onEdit : onSelect}
          className={cn(
            "relative flex h-24 w-24 items-center justify-center rounded-lg text-5xl transition-all sm:h-32 sm:w-32",
            "ring-2 ring-transparent group-hover:ring-2"
          )}
          style={{ backgroundColor: profile.color + "30" }}
        >
          <span className="drop-shadow-lg">{profile.avatar}</span>
          <div
            className="absolute inset-0 rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
            style={{
              boxShadow: `0 0 0 4px ${profile.color}`,
              borderRadius: "0.5rem",
            }}
          />
          {manageMode && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60 opacity-100">
              <Pencil className="h-6 w-6 text-white" />
            </div>
          )}
        </button>
        {manageMode && !profile.isDefault && (
          <button
            onClick={onDelete}
            className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-white shadow-lg transition hover:scale-110"
            aria-label="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-foreground sm:text-base">
          {profile.name}
        </span>
        {profile.isKids && (
          <span className="rounded bg-blue-600/20 px-1 text-[10px] font-bold text-blue-400">
            NIÑOS
          </span>
        )}
      </div>
    </motion.div>
  );
}

function ProfileFormDialog({
  open,
  onOpenChange,
  profile,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: Profile | null;
  onSubmit: (data: { name: string; avatar: string; color: string; isKids: boolean }) => void;
  loading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <ProfileFormContent
          key={profile?.id || "new"}
          profile={profile}
          onSubmit={onSubmit}
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  );
}

function ProfileFormContent({
  profile,
  onSubmit,
  loading,
}: {
  profile: Profile | null;
  onSubmit: (data: { name: string; avatar: string; color: string; isKids: boolean }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState(profile?.name || "");
  const [avatar, setAvatar] = useState(profile?.avatar || "🦊");
  const [color, setColor] = useState(profile?.color || "#E50914");
  const [isKids, setIsKids] = useState(profile?.isKids || false);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{profile ? "Editar perfil" : "Nuevo perfil"}</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim().length < 2) return;
          onSubmit({ name: name.trim(), avatar, color, isKids });
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label>Avatar</Label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_OPTIONS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatar(a)}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-lg text-2xl transition",
                  avatar === a ? "bg-primary/20 ring-2 ring-primary" : "bg-muted hover:bg-accent"
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "h-8 w-8 rounded-full transition",
                  color === c && "ring-2 ring-white ring-offset-2 ring-offset-background"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-name">Nombre</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del perfil"
            maxLength={30}
            required
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={isKids}
            onChange={(e) => setIsKids(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <span className="text-sm text-muted-foreground">
            Perfil infantil (solo contenido apto para niños)
          </span>
        </label>

        <Button type="submit" disabled={loading || name.trim().length < 2} className="w-full">
          {loading ? "Guardando..." : profile ? "Guardar cambios" : "Crear perfil"}
        </Button>
      </form>
    </>
  );
}
