import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceVoterId, hasVotedOn, markVoted } from "@/lib/voter";
import { motion, AnimatePresence } from "framer-motion";

interface RoomOption {
  id: string;
  label: string;
}

export default function PollRoom() {
  const { roomId } = useParams<{ roomId: string }>();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<RoomOption[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pulse, setPulse] = useState(false);

  const prevVotes = useRef(0);

  useEffect(() => {
    if (!roomId) return;

    if (hasVotedOn(roomId)) setVoted(true);

    loadPoll();
    loadVotes();

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "votes", filter: `room_id=eq.${roomId}` },
        () => {
          loadVotes();
          setPulse(true);
          setTimeout(() => setPulse(false), 300);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  async function loadPoll() {
    const { data: room } = await supabase.from("rooms").select("question").eq("id", roomId!).single();

    if (!room) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setQuestion(room.question);

    const { data: opts } = await supabase
      .from("options")
      .select("id, label")
      .eq("room_id", roomId!)
      .order("created_at");

    setOptions(opts || []);
    setLoading(false);
  }

  async function loadVotes() {
    const { data } = await supabase.from("votes").select("option_id").eq("room_id", roomId!);
    if (!data) return;

    const counts: Record<string, number> = {};
    data.forEach(v => (counts[v.option_id] = (counts[v.option_id] || 0) + 1));

    prevVotes.current = totalVotes;
    setVoteCounts(counts);
    setTotalVotes(data.length);
  }

  async function castVote(optionId: string) {
    if (voted) return;

    await supabase.from("votes").insert({
      room_id: roomId!,
      option_id: optionId,
      voter_id: getDeviceVoterId(),
    });

    markVoted(roomId!);
    setVoted(true);
  }

  if (loading) return <div className="p-10 text-center">Loading poll…</div>;

  if (notFound)
    return (
      <div className="p-10 text-center">
        Poll not found<br />
        <Link to="/" className="text-blue-600">Create new poll</Link>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`w-full max-w-lg bg-white rounded-2xl p-8 border shadow-xl ${pulse ? "ring-2 ring-blue-400" : ""}`}
      >

        <h1 className="text-xl font-bold mb-1">{question}</h1>

        <motion.p
          key={totalVotes}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-gray-500 mb-6"
        >
          {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
        </motion.p>

        <div className="space-y-3">
          {options.map(opt => {
            const count = voteCounts[opt.id] || 0;
            const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;

            return (
              <motion.button
                whileHover={{ scale: 1.01 }}
                key={opt.id}
                onClick={() => castVote(opt.id)}
                disabled={voted}
                className="relative w-full text-left border rounded-xl p-3 overflow-hidden disabled:cursor-default hover:shadow-md transition"
              >

                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-y-0 left-0 bg-blue-100"
                />

                <div className="relative flex justify-between">
                  <span className="font-medium">{opt.label}</span>

                  <AnimatePresence>
                    {totalVotes > 0 && (
                      <motion.span
                        key={pct}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-gray-600"
                      >
                        {pct}% ({count})
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

              </motion.button>
            );
          })}
        </div>

        {voted && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-sm text-blue-600">
            Your vote has been recorded.
          </motion.p>
        )}

        <div className="flex justify-between mt-6 border-t pt-4 text-sm">
          <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="text-blue-600 hover:underline">
            Copy share link
          </button>
          <Link to="/" className="text-gray-500 hover:text-black">
            Create new poll
          </Link>
        </div>

      </motion.div>
    </div>
  );
}
