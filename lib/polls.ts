import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  type DocumentSnapshot,
  type QueryConstraint
} from "firebase/firestore";
import { db } from "./firebase";
import type { CreatePollInput, Group, Poll, SortTab } from "../types";

export const PAGE_SIZE = 10;

export type PollPage = {
  polls: Poll[];
  lastVisible: DocumentSnapshot | null;
  hasMore: boolean;
};

export async function fetchGroups(): Promise<Group[]> {
  const snapshot = await getDocs(query(collection(db, "groups"), orderBy("label", "asc")));
  return snapshot.docs.map((groupDoc) => ({
    value: groupDoc.id,
    label: groupDoc.data().label ?? groupDoc.id,
    trending: Boolean(groupDoc.data().trending)
  }));
}

export async function createGroup(label: string): Promise<Group> {
  const normalizedGroupName = label.trim().toLowerCase().replace(/\s+/g, "_");

  if (!normalizedGroupName) {
    throw new Error("Group name cannot be empty.");
  }

  await setDoc(doc(db, "groups", normalizedGroupName), {
    label: label.trim(),
    createdAt: serverTimestamp()
  });

  return {
    value: normalizedGroupName,
    label: label.trim()
  };
}

export async function fetchPollPage({
  category,
  sortTab,
  after
}: {
  category: string;
  sortTab: SortTab;
  after?: DocumentSnapshot | null;
}): Promise<PollPage> {
  const constraints: QueryConstraint[] = [];

  if (category !== "all") {
    constraints.push(where("category", "==", category));
  }

  if (sortTab === "top") {
    constraints.push(orderBy("votes.opt1", "desc"), orderBy("votes.opt2", "desc"));
  } else if (sortTab === "recent") {
    constraints.push(orderBy("createdAt", "desc"));
  } else {
    constraints.push(orderBy("trendingScore", "desc"));
  }

  constraints.push(orderBy("__name__", "asc"), limit(PAGE_SIZE));

  if (after) {
    constraints.push(startAfter(after));
  }

  const snapshot = await getDocs(query(collection(db, "polls"), ...constraints));
  const polls = snapshot.docs.map((pollDoc) => {
    const data = pollDoc.data();
    return {
      id: pollDoc.id,
      question: data.question ?? "",
      category: data.category ?? "all",
      opt1: data.opt1 ?? "",
      opt2: data.opt2 ?? "",
      votes: {
        opt1: data.votes?.opt1 ?? 0,
        opt2: data.votes?.opt2 ?? 0
      },
      trendingScore: data.trendingScore ?? 0,
      createdAt: data.createdAt
    };
  });

  return {
    polls,
    lastVisible: snapshot.docs.at(-1) ?? null,
    hasMore: snapshot.docs.length === PAGE_SIZE
  };
}

export async function createPoll(input: CreatePollInput) {
  if (!input.question.trim() || !input.opt1.trim() || !input.opt2.trim()) {
    throw new Error("Question and both options are required.");
  }

  await addDoc(collection(db, "polls"), {
    ...input,
    votes: { opt1: 0, opt2: 0 },
    createdAt: serverTimestamp(),
    trendingScore: 0
  });
}

export async function votePoll(pollId: string, chosenOption: "opt1" | "opt2") {
  await updateDoc(doc(db, "polls", pollId), {
    [`votes.${chosenOption}`]: increment(1),
    trendingScore: increment(1)
  });
}

export function getPollPercentages(poll: Poll) {
  const total = poll.votes.opt1 + poll.votes.opt2;
  return {
    opt1: total > 0 ? Math.round((poll.votes.opt1 / total) * 100) : 0,
    opt2: total > 0 ? Math.round((poll.votes.opt2 / total) * 100) : 0
  };
}
