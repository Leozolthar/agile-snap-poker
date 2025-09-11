import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PokerValue = string;

export interface RealtimePlayer {
  id: string;
  name: string;
  isModerator: boolean;
  vote?: PokerValue | null;
}

interface UsePokerRoomOptions {
  roomCode: string;
  playerName: string;
  isModerator: boolean;
}

interface UsePokerRoomReturn {
  players: RealtimePlayer[];
  selectedVote: PokerValue | null;
  votesRevealed: boolean;
  vote: (value: PokerValue) => void;
  toggleReveal: () => void;
  newRound: () => void;
}

// Build a stable, anonymous player id per browser
function getOrCreatePlayerId() {
  const key = "planning-poker:playerId";
  let id = localStorage.getItem(key);
  if (!id) {
    id = (crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`);
    localStorage.setItem(key, id);
  }
  return id;
}

export function usePokerRoom({ roomCode, playerName, isModerator }: UsePokerRoomOptions): UsePokerRoomReturn {
  const playerIdRef = useRef<string>(getOrCreatePlayerId());
  const [players, setPlayers] = useState<RealtimePlayer[]>([]);
  const [selectedVote, setSelectedVote] = useState<PokerValue | null>(null);
  const [votesRevealed, setVotesRevealed] = useState(false);

  // Create a channel per room (normalized to avoid case/whitespace mismatches)
  const normalizedRoomCode = (roomCode || "").trim().toLowerCase();
  const channel = useMemo(() => {
    if (!normalizedRoomCode) return null;
    const topic = `pp_room_${normalizedRoomCode}`;
    console.debug('[PokerRoom] Creating channel', topic);
    return supabase.channel(topic, {
      config: {
        broadcast: { ack: true },
        presence: { key: playerIdRef.current },
      },
    });
  }, [normalizedRoomCode]);

  // Helpers to rebuild players from presence state
  const rebuildPlayersFromPresence = () => {
    if (!channel) return;
    const state = channel.presenceState() as Record<string, Array<RealtimePlayer & { online_at?: string }>>;
    const list: RealtimePlayer[] = [];
    Object.values(state).forEach((entries) => {
      // Use the latest tracked presence item
      const last = entries[entries.length - 1];
      if (last) {
        list.push({ id: last.id, name: last.name, isModerator: !!last.isModerator, vote: last.vote ?? undefined });
      }
    });
    setPlayers(list);

    // Sync own selected vote from presence (in case of refresh)
    const me = list.find((p) => p.id === playerIdRef.current);
    setSelectedVote((prev) => (me ? (me.vote ?? null) : prev));
  };

  useEffect(() => {
    if (!channel) return;

    console.debug('[PokerRoom] Subscribing to channel', (channel as any).topic);

    channel
      .on("presence", { event: "sync" }, () => {
        console.debug('[PokerRoom] presence sync', channel.presenceState());
        rebuildPlayersFromPresence();
      })
      .on("presence", { event: "join" }, () => {
        console.debug('[PokerRoom] presence join', channel.presenceState());
        rebuildPlayersFromPresence();
      })
      .on("presence", { event: "leave" }, () => {
        console.debug('[PokerRoom] presence leave', channel.presenceState());
        rebuildPlayersFromPresence();
      })
      .on("broadcast", { event: "vote" }, ({ payload }: any) => {
        console.debug('[PokerRoom] vote broadcast', payload);
        const { playerId, value } = payload as { playerId: string; value: PokerValue | null };
        setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, vote: value ?? undefined } : p)));
        if (playerId === playerIdRef.current) {
          setSelectedVote(value ?? null);
        }
      })
      .on("broadcast", { event: "reveal" }, ({ payload }: any) => {
        const { revealed } = payload as { revealed: boolean };
        console.debug('[PokerRoom] reveal broadcast', revealed);
        setVotesRevealed(!!revealed);
      })
      .on("broadcast", { event: "new_round" }, () => {
        console.debug('[PokerRoom] new_round broadcast');
        setSelectedVote(null);
        setVotesRevealed(false);
        setPlayers((prev) => prev.map((p) => ({ ...p, vote: undefined })));
      });

    const sub = channel.subscribe(async (status) => {
      console.debug('[PokerRoom] channel status', status);
      if (status !== "SUBSCRIBED") return;
      // Track (or update) presence for this user
      const trackPayload = {
        id: playerIdRef.current,
        name: playerName || "Anonymous",
        isModerator: !!isModerator,
        vote: selectedVote,
        online_at: new Date().toISOString(),
      };
      const res = await channel.track(trackPayload);
      console.debug('[PokerRoom] presence tracked', res, trackPayload);
    });

    return () => {
      try {
        console.debug('[PokerRoom] Unsubscribing channel', (channel as any).topic);
        sub.unsubscribe?.();
      } catch {}
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  // If name/moderator changes in URL, update presence
  useEffect(() => {
    if (!channel) return;
    (async () => {
      try {
        await channel.track({
          id: playerIdRef.current,
          name: playerName || "Anonymous",
          isModerator: !!isModerator,
          vote: selectedVote,
          online_at: new Date().toISOString(),
        });
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerName, isModerator, selectedVote]);

  const vote = (value: PokerValue) => {
    setSelectedVote((prev) => {
      const next = prev === value ? null : value;
      channel?.send({ type: "broadcast", event: "vote", payload: { playerId: playerIdRef.current, value: next } });
      // Optimistic update self
      setPlayers((prevPlayers) => prevPlayers.map((p) => (p.id === playerIdRef.current ? { ...p, vote: next ?? undefined } : p)));
      return next;
    });
  };

  const toggleReveal = () => {
    setVotesRevealed((prev) => {
      const revealed = !prev;
      channel?.send({ type: "broadcast", event: "reveal", payload: { revealed } });
      return revealed;
    });
  };

  const newRound = () => {
    setSelectedVote(null);
    setVotesRevealed(false);
    setPlayers((prev) => prev.map((p) => ({ ...p, vote: undefined })));
    channel?.send({ type: "broadcast", event: "new_round", payload: {} });
  };

  return { players, selectedVote, votesRevealed, vote, toggleReveal, newRound };
}
