import { createServer } from "http";
import { Server } from "socket.io";

const PORT = 3030;

const httpServer = createServer();
const io = new Server(httpServer, {
  path: "/",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Estructura de rooms de watch party
// roomCode -> { hostId, contentId, contentTitle, participants: Map<socketId, {name, avatar, isHost, isReady}> }
interface Participant {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  joinedAt: number;
}
interface PartyRoom {
  code: string;
  hostId: string;
  contentId: string;
  contentTitle: string;
  contentType: string;
  contentUrl: string;
  participants: Map<string, Participant>;
  createdAt: number;
}

const rooms = new Map<string, PartyRoom>();

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

io.on("connection", (socket) => {
  console.log(`[WatchParty] Usuario conectado: ${socket.id}`);

  // Crear sala de watch party
  socket.on("party:create", (data: { name: string; avatar: string; contentId: string; contentTitle: string; contentType: string; contentUrl: string }) => {
    const roomCode = generateRoomCode();
    const participant: Participant = {
      id: socket.id,
      name: data.name || "Anónimo",
      avatar: data.avatar || "🦊",
      isHost: true,
      isReady: true,
      joinedAt: Date.now(),
    };

    const room: PartyRoom = {
      code: roomCode,
      hostId: socket.id,
      contentId: data.contentId,
      contentTitle: data.contentTitle,
      contentType: data.contentType,
      contentUrl: data.contentUrl,
      participants: new Map([[socket.id, participant]]),
      createdAt: Date.now(),
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);

    socket.emit("party:created", {
      code: roomCode,
      room: serializeRoom(room),
    });

    console.log(`[WatchParty] Sala ${roomCode} creada por ${data.name} (${data.contentTitle})`);
  });

  // Unirse a sala existente
  socket.on("party:join", (data: { code: string; name: string; avatar: string }) => {
    const code = data.code.toUpperCase().trim();
    const room = rooms.get(code);

    if (!room) {
      socket.emit("party:error", { message: "Sala no encontrada. Verificá el código." });
      return;
    }

    if (room.participants.size >= 10) {
      socket.emit("party:error", { message: "La sala está llena (máx 10)." });
      return;
    }

    const participant: Participant = {
      id: socket.id,
      name: data.name || "Anónimo",
      avatar: data.avatar || "🦊",
      isHost: false,
      isReady: false,
      joinedAt: Date.now(),
    };

    room.participants.set(socket.id, participant);
    socket.join(code);

    // Notificar a todos en la sala
    io.to(code).emit("party:participant-joined", {
      participant,
      room: serializeRoom(room),
    });

    // Enviar info de la sala al nuevo participante
    socket.emit("party:joined", {
      code,
      room: serializeRoom(room),
    });

    console.log(`[WatchParty] ${data.name} se unió a sala ${code}`);
  });

  // Salir de sala
  socket.on("party:leave", (data: { code: string }) => {
    const code = data.code?.toUpperCase().trim();
    handleLeave(socket, code);
  });

  // Sincronizar play/pause/seek
  socket.on("party:sync", (data: { code: string; action: "play" | "pause" | "seek"; currentTime: number; isPlaying: boolean }) => {
    const code = data.code?.toUpperCase().trim();
    const room = rooms.get(code);

    if (!room) return;

    // Solo el host puede sincronizar
    if (socket.id !== room.hostId) {
      socket.emit("party:error", { message: "Solo el host puede controlar la reproducción." });
      return;
    }

    // Broadcast a todos excepto al host
    socket.to(code).emit("party:sync-update", {
      action: data.action,
      currentTime: data.currentTime,
      isPlaying: data.isPlaying,
      timestamp: Date.now(),
    });
  });

  // Chat message
  socket.on("party:chat", (data: { code: string; message: string }) => {
    const code = data.code?.toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) return;

    const participant = room.participants.get(socket.id);
    if (!participant) return;

    io.to(code).emit("party:chat-message", {
      id: socket.id + Date.now(),
      participantId: socket.id,
      name: participant.name,
      avatar: participant.avatar,
      message: data.message.slice(0, 500),
      timestamp: Date.now(),
    });
  });

  // Toggle ready
  socket.on("party:ready", (data: { code: string; isReady: boolean }) => {
    const code = data.code?.toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) return;

    const participant = room.participants.get(socket.id);
    if (!participant) return;

    participant.isReady = data.isReady;
    io.to(code).emit("party:participant-update", {
      participant,
      room: serializeRoom(room),
    });
  });

  // Desconexión
  socket.on("disconnect", () => {
    // Buscar y salir de todas las salas
    for (const [code, room] of rooms.entries()) {
      if (room.participants.has(socket.id)) {
        handleLeave(socket, code);
      }
    }
    console.log(`[WatchParty] Usuario desconectado: ${socket.id}`);
  });
});

function handleLeave(socket: any, code: string | undefined) {
  if (!code) return;
  const room = rooms.get(code);
  if (!room) return;

  const participant = room.participants.get(socket.id);
  if (!participant) return;

  room.participants.delete(socket.id);
  socket.leave(code);

  // Si era el host, transferir host o eliminar sala
  if (socket.id === room.hostId) {
    const remaining = Array.from(room.participants.values());
    if (remaining.length > 0) {
      // Transferir host al primer participante
      const newHost = remaining[0];
      newHost.isHost = true;
      room.hostId = newHost.id;
      io.to(code).emit("party:host-changed", {
        newHostId: newHost.id,
        room: serializeRoom(room),
      });
    } else {
      // Eliminar sala vacía
      rooms.delete(code);
      console.log(`[WatchParty] Sala ${code} eliminada (vacía)`);
      return;
    }
  }

  // Notificar salida
  io.to(code).emit("party:participant-left", {
    participantId: socket.id,
    name: participant.name,
    room: serializeRoom(room),
  });

  console.log(`[WatchParty] ${participant.name} salió de sala ${code}`);
}

function serializeRoom(room: PartyRoom) {
  return {
    code: room.code,
    hostId: room.hostId,
    contentId: room.contentId,
    contentTitle: room.contentTitle,
    contentType: room.contentType,
    contentUrl: room.contentUrl,
    participants: Array.from(room.participants.values()),
    createdAt: room.createdAt,
  };
}

httpServer.listen(PORT, () => {
  console.log(`[WatchParty] Servidor escuchando en puerto ${PORT}`);
});
