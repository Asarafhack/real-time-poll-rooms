import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceVoterId, hasVotedOn, markVoted } from "@/lib/voter";

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

  useEffect(() => {
    if (!roomId) return;

    if (hasVotedOn(roomId)) {
      setVoted(true);
    }

    loadPoll();
    loadVotes();

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "votes",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadVotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  async function loadPoll() {
    const { data: room } = await supabase
      .from("rooms")
      .select("question")
      .eq("id", roomId!)
      .single();

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
      .order("created_at", { ascending: true });

    setOptions(opts || []);
    setLoading(false);
  }

  async function loadVotes() {
    const { data } = await supabase
      .from("votes")
      .select("option_id")
      .eq("room_id", roomId!);

    if (!data) return;

    const counts: Record<string, number> = {};
    data.forEach((v) => {
      counts[v.option_id] = (counts[v.option_id] || 0) + 1;
    });

    setVoteCounts(counts);
    setTotalVotes(data.length);
  }

  async function castVote(optionId: string) {
    if (voted) return;

    const voterId = getDeviceVoterId();

    const { error } = await supabase.from("votes").insert({
      room_id: roomId!,
      option_id: optionId,
      voter_id: voterId,
    });

    if (!error) {
      markVoted(roomId!);
      setVoted(true);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
  }

  if (loading) return <div className="p-10 text-center">Loading poll...</div>;

  if (notFound)
    return (
      <div className="p-10 text-center">
        Poll not found.
        <br />
        <Link to="/">Create new poll</Link>
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-xl font-bold mb-2">{question}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
        </p>

        <div className="space-y-3">
          {options.map((opt) => {
            const count = voteCounts[opt.id] || 0;
            const percentage =
              totalVotes > 0
                ? Math.round((count / totalVotes) * 100)
                : 0;

            return (
              <button
                key={opt.id}
                onClick={() => castVote(opt.id)}
                disabled={voted}
                className="relative w-full text-left border rounded-lg p-3 overflow-hidden transition hover:border-blue-400 disabled:cursor-default"
              >
                {totalVotes > 0 && (
                  <div
                    className="absolute inset-y-0 left-0 bg-blue-100 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                )}

                <div className="relative flex justify-between">
                  <span className="font-medium">{opt.label}</span>
                  {totalVotes > 0 && (
                    <span className="text-sm text-gray-600">
                      {percentage}% ({count})
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {voted && (
          <p className="mt-4 text-sm text-blue-600">
            Your vote has been recorded.
          </p>
        )}

        <div className="flex justify-between mt-6 border-t pt-4 text-sm">
          <button onClick={copyLink} className="text-blue-600">
            Copy share link
          </button>
          <Link to="/" className="text-gray-500">
            Create new poll
          </Link>
        </div>
      </div>
    </div>
  );
}
