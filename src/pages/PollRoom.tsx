import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceVoterId, getFirebaseUid
  , hasVotedOn, markVoted } from "@/lib/voter";
import Layout from "@/components/Layout";

interface RoomOption {
  id: string;
  label: string;
}

function PollRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<RoomOption[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [voted, setVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    if (hasVotedOn(roomId)) {
      setVoted(true);
    }

    loadRoom();
    loadVotes();

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "votes", filter: `room_id=eq.${roomId}` },
        () => {
          loadVotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  async function loadRoom() {
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
    const { data: allVotes } = await supabase
      .from("votes")
      .select("option_id")
      .eq("room_id", roomId!);

    if (!allVotes) return;

    const counts: Record<string, number> = {};
    allVotes.forEach((v) => {
      counts[v.option_id] = (counts[v.option_id] || 0) + 1;
    });

    setVoteCounts(counts);
    setTotalVotes(allVotes.length);
  }

  async function castVote(optionId: string) {
  if (voted || submitting) return;

  setSubmitting(true);

  const deviceId = getDeviceVoterId();
  const firebaseUid = getFirebaseUid();

  const { error } = await supabase.from("votes").insert({
    room_id: roomId!,
    option_id: optionId,
    voter_id: deviceId,
    firebase_uid: firebaseUid,
  });

  if (error) {
    // unique constraint triggered
    if (error.code === "23505") {
      setVoted(true);
      markVoted(roomId!);
    }

    setSubmitting(false);
    return;
  }

  markVoted(roomId!);
  setVoted(true);
  setSubmitting(false);
}


  function shareLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <p className="text-muted-foreground">Loading poll...</p>
        </div>
      </Layout>
    );
  }

  if (notFound) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-4">
          <div className="text-center">
            <p className="text-foreground text-lg mb-3">Poll not found.</p>
            <Link to="/" className="text-sm text-primary hover:underline">
              Create a new poll
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-4">
        <div className="w-full max-w-lg">
          <div className="bg-card rounded-xl shadow-lg border border-border p-8">
            <h1 className="text-xl font-bold text-foreground mb-1">
              {question}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {totalVotes} vote{totalVotes !== 1 ? "s" : ""} so far
            </p>

            <div className="space-y-3 mb-6">
              {options.map((opt) => {
                const count = voteCounts[opt.id] || 0;
                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

                return (
                  <button
                    key={opt.id}
                    onClick={() => castVote(opt.id)}
                    disabled={voted || submitting}
                    className="w-full text-left border border-input rounded-lg p-3.5 relative overflow-hidden disabled:cursor-default hover:border-primary/50 transition-all hover:shadow-sm"
                  >
                    {voted && (
                      <div
                        className="absolute inset-y-0 left-0 bg-primary/15 transition-all duration-700 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    )}
                    <div className="relative flex justify-between items-center">
                      <span className="text-sm text-foreground font-medium">{opt.label}</span>
                      {voted && (
                        <span className="text-sm text-muted-foreground ml-2 tabular-nums">
                          {pct}% ({count})
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {voted && (
              <p className="text-xs text-primary font-medium mb-4">
                Your vote has been recorded.
              </p>
            )}

            <div className="flex gap-4 pt-2 border-t border-border">
              <button
                onClick={shareLink}
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {copied ? "Copied!" : "Copy share link"}
              </button>
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Create new poll
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default PollRoom;
