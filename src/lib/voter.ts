import { auth } from "../firebase";

const VOTER_KEY = "poll_voter_id";

export function getDeviceVoterId(): string {
  let stored = localStorage.getItem(VOTER_KEY);

  if (!stored) {
    stored = crypto.randomUUID();
    localStorage.setItem(VOTER_KEY, stored);
  }

  return stored;
}

export function getFirebaseUid(): string | null {
  return auth.currentUser?.uid || null;
}

export function hasVotedOn(roomId: string): boolean {
  return localStorage.getItem(`voted_${roomId}`) === "true";
}

export function markVoted(roomId: string): void {
  localStorage.setItem(`voted_${roomId}`, "true");
}
