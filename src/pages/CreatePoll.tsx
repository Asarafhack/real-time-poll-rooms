import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";

function CreatePoll() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState(["", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateChoice(index: number, value: string) {
    const next = [...choices];
    next[index] = value;
    setChoices(next);
  }

  function addChoice() {
    if (choices.length < 10) {
      setChoices([...choices, ""]);
    }
  }

  function removeChoice(index: number) {
    if (choices.length > 2) {
      setChoices(choices.filter((_, i) => i !== index));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedQuestion = question.trim();
    const validChoices = choices.map((c) => c.trim()).filter(Boolean);

    if (!trimmedQuestion) {
      setError("Please enter a question.");
      return;
    }

    if (validChoices.length < 2) {
      setError("Add at least 2 options.");
      return;
    }

    const uniqueChoices = [...new Set(validChoices)];
    if (uniqueChoices.length !== validChoices.length) {
      setError("Remove duplicate options.");
      return;
    }

    setLoading(true);

    const { data: room, error: roomErr } = await supabase
      .from("rooms")
      .insert({ question: trimmedQuestion })
      .select("id")
      .single();

    if (roomErr || !room) {
      setError("Failed to create poll. Try again.");
      setLoading(false);
      return;
    }

    const optionRows = validChoices.map((label) => ({
      room_id: room.id,
      label,
    }));

    const { error: optErr } = await supabase.from("options").insert(optionRows);

    if (optErr) {
      setError("Failed to save options. Try again.");
      setLoading(false);
      return;
    }

    navigate(`/poll/${room.id}`);
  }

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-4">
        <div className="w-full max-w-lg">
          <div className="bg-card rounded-xl shadow-lg border border-border p-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Create a Poll
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              Ask a question and let people vote in real time.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Question
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What do you want to ask?"
                  maxLength={200}
                  className="w-full border border-input rounded-lg px-3.5 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
              </div>

              <div className="space-y-2.5">
                <label className="block text-sm font-medium text-foreground">
                  Options
                </label>
                {choices.map((choice, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={choice}
                      onChange={(e) => updateChoice(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      maxLength={100}
                      className="flex-1 border border-input rounded-lg px-3.5 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                    />
                    {choices.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeChoice(i)}
                        className="text-muted-foreground hover:text-destructive text-sm px-2 transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                {choices.length < 10 && (
                  <button
                    type="button"
                    onClick={addChoice}
                    className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    + Add option
                  </button>
                )}
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? "Creating..." : "Create Poll"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default CreatePoll;
