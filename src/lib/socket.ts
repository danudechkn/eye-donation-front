import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/auth";
import { getInMemoryToken } from "@/lib/cookies";

export interface CaseChangedEvent {
  action: "created" | "updated" | "deleted" | "moph_sent" | "moph_reset";
  id?: number;
  hn?: string;
  status?: number;
  actor?: string;
  timestamp: string;
}

export interface UserChangedEvent {
  action: "created" | "updated" | "deleted";
  id?: number;
  provider_id?: string;
  app_role?: "eye" | "organ" | "both" | "admin";
  status?: "pending" | "active" | "suspended";
  is_active?: boolean;
  name?: string;
  timestamp: string;
}

let socketInstance: Socket | null = null;

export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;

  const baseUrl =
    API_BASE_URL ||
    `${window.location.protocol}//${window.location.hostname}:3002`;

  if (!socketInstance) {
    socketInstance = io(baseUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 10000,
      auth: (cb) => {
        cb({ token: getInMemoryToken() || undefined });
      },
    });
  }

  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
