"use client";

import { useEffect, useRef } from "react";
import {
  getSocket,
  type CaseChangedEvent,
  type UserChangedEvent,
} from "@/lib/socket";

export function useCaseRealtime(
  onChanged: (event: CaseChangedEvent) => void,
  enabled = true,
): void {
  const handlerRef = useRef(onChanged);

  useEffect(() => {
    handlerRef.current = onChanged;
  }, [onChanged]);

  useEffect(() => {
    if (!enabled) return;
    const socket = getSocket();
    if (!socket) return;

    const listener = (event: CaseChangedEvent) => {
      handlerRef.current(event);
    };

    socket.on("donor-cases:changed", listener);
    return () => {
      socket.off("donor-cases:changed", listener);
    };
  }, [enabled]);
}

export function useUserRealtime(
  onChanged: (event: UserChangedEvent) => void,
  enabled = true,
): void {
  const handlerRef = useRef(onChanged);

  useEffect(() => {
    handlerRef.current = onChanged;
  }, [onChanged]);

  useEffect(() => {
    if (!enabled) return;
    const socket = getSocket();
    if (!socket) return;

    const listener = (event: UserChangedEvent) => {
      handlerRef.current(event);
    };

    socket.on("users:changed", listener);
    return () => {
      socket.off("users:changed", listener);
    };
  }, [enabled]);
}

export function useRoleRealtime(
  providerId: string | null | undefined,
  onRoleUpdated: (event: UserChangedEvent) => void,
  enabled = true,
): void {
  const handlerRef = useRef(onRoleUpdated);

  useEffect(() => {
    handlerRef.current = onRoleUpdated;
  }, [onRoleUpdated]);

  useEffect(() => {
    if (!enabled || !providerId) return;
    const cleanId = providerId.trim();
    if (!cleanId || cleanId === "unknown") return;

    const socket = getSocket();
    if (!socket) return;

    const joinRoom = () => {
      socket.emit("auth:join", cleanId);
    };

    const listener = (event: UserChangedEvent) => {
      handlerRef.current(event);
    };

    if (socket.connected) {
      joinRoom();
    }
    socket.on("connect", joinRoom);
    socket.on("user:role-updated", listener);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("user:role-updated", listener);
    };
  }, [enabled, providerId]);
}
