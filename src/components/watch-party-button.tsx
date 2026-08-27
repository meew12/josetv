"use client";
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/lib/auth-store";
import { useProfile } from "@/lib/profile-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Copy, Check, X, Send, Crown, Play, Pause, RotateCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Participant {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
}

interface PartyRoom {
  code: string;
  hostId: string;
  contentId: string;
  contentTitle: string;
  contentType: string;
  contentUrl: string;
  participants: Participant[];
}

interface ChatMessage {
  id: string;
  participantId: string;
  name: string;
  avatar: string;
  message: string;
  timestamp: number;
}

interface Props {
  contentId: string;
  contentTitle: string;
  contentType: string;
  contentUrl: string;
  onSync?: (action: "play" | "pause" | "seek", currentTime: number, isPlaying: boolean) => void;
}

export function WatchPartyButton({ contentId, contentTitle, contentType, contentUrl, onSync }: Props) {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<PartyRoom | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Conectar socket cuando se abre el dialog
  useEffect(() => {
    if (!open || !socket) return;

    const handler = (data: any) => {
      if (onSync) onSync(data.action, data.currentTime, data.isPlaying);
    };
    socket.on("party:sync-update", handler);
    return () => {
      socket.off("party:sync-update", handler);
    };
  }, [open, socket, onSync]);

  // Auto-scroll chat
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [chatMessages]);

  const connect = () => {
    const s = io("/?XTransformPort=3030", {
      transports: ["websocket"],
      reconnection: true,
    });
    setSocket(s);

    s.on("party:created", (data: { code: string; room: PartyRoom }) => {
      setRoom(data.room);
      setIsHost(true);
      toast({ title: `Sala creada: ${data.code}` });
    });

    s.on("party:joined", (data: { code: string; room: PartyRoom }) => {
      setRoom(data.room);
      setIsHost(false);
      toast({ title: `Te uniste a la sala` });
    });

    s.on("party:participant-joined", (data: { participant: Participant; room: PartyRoom }) => {
      setRoom(data.room);
      toast({ title: `${data.participant.name} se unió` });
    });

    s.on("party:participant-left", (data: { participantId: string; room: PartyRoom }) => {
      setRoom(data.room);
    });

    s.on("party:participant-update", (data: { participant: Participant; room: PartyRoom }) => {
      setRoom(data.room);
    });

    s.on("party:host-changed", (data: { newHostId: string; room: PartyRoom }) => {
      setRoom(data.room);
      setIsHost(data.newHostId === s.id);
      toast({ title: data.newHostId === s.id ? "Ahora sos el host" : "Nuevo host asignado" });
    });

    s.on("party:chat-message", (data: ChatMessage) => {
      setChatMessages((prev) => [...prev, data].slice(-50));
    });

    s.on("party:error", (data: { message: string }) => {
      toast({ title: "Error", description: data.message, variant: "destructive" });
    });

    return s;
  };

  const createRoom = () => {
    if (!user) return;
    const s = connect();
    s?.emit("party:create", {
      name: activeProfile?.name || user.name,
      avatar: activeProfile?.avatar || "🦊",
      contentId,
      contentTitle,
      contentType,
      contentUrl,
    });
  };

  const joinRoom = () => {
    if (!user || !joinCode.trim()) return;
    const s = socket || connect();
    s.emit("party:join", {
      code: joinCode.trim().toUpperCase(),
      name: activeProfile?.name || user.name,
      avatar: activeProfile?.avatar || "🦊",
    });
  };

  const leaveRoom = () => {
    if (!socket || !room) return;
    socket.emit("party:leave", { code: room.code });
    socket.disconnect();
    setSocket(null);
    setRoom(null);
    setChatMessages([]);
    setOpen(false);
    toast({ title: "Saliste de la sala" });
  };

  const sendSync = (action: "play" | "pause" | "seek", currentTime: number, isPlaying: boolean) => {
    if (!socket || !room || !isHost) return;
    socket.emit("party:sync", { code: room.code, action, currentTime, isPlaying });
  };

  const sendChat = () => {
    if (!socket || !room || !chatInput.trim()) return;
    socket.emit("party:chat", { code: room.code, message: chatInput.trim() });
    setChatInput("");
  };

  const copyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <Users className="h-4 w-4" />
        Watch Party
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v && room) leaveRoom(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Watch Party
            </DialogTitle>
          </DialogHeader>

          {!room ? (
            // Crear o unirse
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card/40 p-4">
                <h3 className="mb-2 font-semibold text-foreground">Crear sala nueva</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  Creá una sala y compartí el código con tus amigos para ver "{contentTitle}" juntos.
                </p>
                <Button onClick={createRoom} className="w-full">
                  <Users className="mr-2 h-4 w-4" />
                  Crear sala
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">O</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="rounded-lg border border-border bg-card/40 p-4">
                <h3 className="mb-2 font-semibold text-foreground">Unirse con código</h3>
                <div className="flex gap-2">
                  <Input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    className="font-mono uppercase"
                    onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                  />
                  <Button onClick={joinRoom} disabled={!joinCode.trim()}>
                    Unirse
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Sala activa
            <div className="space-y-4">
              {/* Código de sala */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-card/40 p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Código de sala</p>
                  <p className="font-mono text-2xl font-black tracking-widest text-primary">
                    {room.code}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyCode}
                  className="gap-1.5"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copiado" : "Copiar"}
                </Button>
              </div>

              {/* Contenido */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Viendo</p>
                <p className="font-semibold text-foreground">{room.contentTitle}</p>
              </div>

              {/* Participantes */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Participantes ({room.participants.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {room.participants.map((p) => (
                    <div
                      key={p.id}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2 py-1",
                        p.isHost ? "border-primary/50 bg-primary/10" : "border-border bg-muted/30"
                      )}
                    >
                      <span className="text-lg">{p.avatar}</span>
                      <span className="text-xs font-medium">{p.name}</span>
                      {p.isHost && <Crown className="h-3 w-3 text-yellow-500" />}
                      {p.isReady ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Controles de host */}
              {isHost && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendSync("play", 0, true)}
                    className="flex-1"
                  >
                    <Play className="mr-1 h-4 w-4" /> Sync Play
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendSync("pause", 0, false)}
                    className="flex-1"
                  >
                    <Pause className="mr-1 h-4 w-4" /> Sync Pause
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendSync("seek", 0, false)}
                    className="flex-1"
                  >
                    <RotateCw className="mr-1 h-4 w-4" /> Sync Seek
                  </Button>
                </div>
              )}

              {/* Chat */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Chat
                </p>
                <div
                  ref={chatRef}
                  className="max-h-40 min-h-[60px] space-y-1.5 overflow-y-auto rounded-lg border border-border bg-muted/20 p-2"
                >
                  {chatMessages.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      No hay mensajes aún. ¡Escribí algo!
                    </p>
                  ) : (
                    chatMessages.map((m) => (
                      <div key={m.id} className="flex items-start gap-1.5">
                        <span className="text-sm">{m.avatar}</span>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-semibold text-foreground">
                            {m.name}:
                          </span>
                          <span className="ml-1 text-xs text-foreground/80">
                            {m.message}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-2 flex gap-1.5">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Escribí un mensaje..."
                    maxLength={500}
                    onKeyDown={(e) => e.key === "Enter" && sendChat()}
                    className="h-9"
                  />
                  <Button size="sm" onClick={sendChat} disabled={!chatInput.trim()} className="h-9">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Salir */}
              <Button variant="destructive" size="sm" onClick={leaveRoom} className="w-full">
                <X className="mr-2 h-4 w-4" /> Salir de la sala
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
