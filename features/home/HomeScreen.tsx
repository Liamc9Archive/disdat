import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import {
  createGroup,
  createPoll,
  fetchGroups,
  fetchPollPage,
  getPollPercentages,
  type PollPage,
  votePoll
} from "../../lib/polls";
import { Button, Field } from "../../components/Primitives";
import { colors, spacing } from "../../lib/theme";
import type { Group, Poll, SortTab } from "../../types";

type HomeScreenProps = {
  onOpenSettings?: () => void;
  onOpenLogin?: () => void;
};

const tabs: SortTab[] = ["trending", "top", "recent"];

export function HomeScreen({ onOpenSettings, onOpenLogin }: HomeScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState<SortTab>("trending");
  const [groups, setGroups] = useState<Group[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [lastVisible, setLastVisible] = useState<PollPage["lastVisible"]>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [isComposerOpen, setComposerOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const categoryOptions = useMemo(() => [{ value: "all", label: "All" }, ...groups], [groups]);

  const loadGroups = useCallback(async () => {
    try {
      setGroups(await fetchGroups());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load groups.");
    }
  }, []);

  const loadPolls = useCallback(
    async (mode: "replace" | "append" = "replace") => {
      if (isLoading || (mode === "append" && !hasMore)) {
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const page = await fetchPollPage({
          category: selectedCategory,
          sortTab: activeTab,
          after: mode === "append" ? lastVisible : null
        });

        setPolls((previous) => {
          const nextPolls = mode === "append" ? [...previous, ...page.polls] : page.polls;
          return Array.from(new Map(nextPolls.map((poll) => [poll.id, poll])).values());
        });
        setLastVisible(page.lastVisible);
        setHasMore(page.hasMore);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load polls.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeTab, hasMore, isLoading, lastVisible, selectedCategory]
  );

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    setPolls([]);
    setLastVisible(null);
    setHasMore(true);
    loadPolls("replace");
  }, [activeTab, selectedCategory]);

  async function refresh() {
    setIsRefreshing(true);
    await Promise.all([loadGroups(), loadPolls("replace")]);
  }

  async function addGroup() {
    if (!newGroupName.trim()) {
      return;
    }

    try {
      const group = await createGroup(newGroupName);
      setGroups((current) => [...current.filter((item) => item.value !== group.value), group]);
      setSelectedCategory(group.value);
      setNewGroupName("");
    } catch (groupError) {
      setError(groupError instanceof Error ? groupError.message : "Could not add group.");
    }
  }

  async function submitPoll(input: { question: string; opt1: string; opt2: string }) {
    try {
      await createPoll({
        ...input,
        category: selectedCategory === "all" ? "general" : selectedCategory
      });
      setComposerOpen(false);
      await loadPolls("replace");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not create poll.");
    }
  }

  async function handleVote(pollId: string, option: "opt1" | "opt2") {
    setPolls((current) =>
      current.map((poll) =>
        poll.id === pollId
          ? {
              ...poll,
              votes: { ...poll.votes, [option]: poll.votes[option] + 1 },
              trendingScore: poll.trendingScore + 1
            }
          : poll
      )
    );

    try {
      await votePoll(pollId, option);
    } catch (voteError) {
      setError(voteError instanceof Error ? voteError.message : "Vote could not be saved.");
    }
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={polls}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topRow}>
              <View>
                <Text style={styles.appName}>Disdat</Text>
                <Text style={styles.heading}>What is everyone picking?</Text>
              </View>
              <View style={styles.headerActions}>
                <Button label="Login" variant="secondary" onPress={onOpenLogin} style={styles.smallButton} />
                <Button label="Settings" variant="secondary" onPress={onOpenSettings} style={styles.smallButton} />
              </View>
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categoryOptions}
              keyExtractor={(item) => item.value}
              contentContainerStyle={styles.categoryList}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setSelectedCategory(item.value)}
                  style={[styles.chip, selectedCategory === item.value && styles.activeChip]}
                >
                  <Text style={[styles.chipText, selectedCategory === item.value && styles.activeChipText]}>{item.label}</Text>
                </Pressable>
              )}
            />

            <View style={styles.addGroupRow}>
              <TextInput
                value={newGroupName}
                onChangeText={setNewGroupName}
                placeholder="New category"
                placeholderTextColor="#94A3B8"
                style={styles.groupInput}
              />
              <Button label="Add" variant="secondary" onPress={addGroup} style={styles.addButton} />
            </View>

            <View style={styles.tabs}>
              {tabs.map((tab) => (
                <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.activeTab]}>
                  <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                </Pressable>
              ))}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        renderItem={({ item }) => <PollCard poll={item} onVote={handleVote} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loading} />
          ) : (
            <Text style={styles.empty}>No polls yet. Start the first one.</Text>
          )
        }
        ListFooterComponent={
          polls.length && hasMore ? (
            <Button label={isLoading ? "Loading..." : "Load More"} variant="secondary" onPress={() => loadPolls("append")} />
          ) : null
        }
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
      />

      <Pressable accessibilityRole="button" style={styles.fab} onPress={() => setComposerOpen(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <PollComposer
        visible={isComposerOpen}
        category={selectedCategory === "all" ? "general" : selectedCategory}
        onClose={() => setComposerOpen(false)}
        onSubmit={submitPoll}
      />
    </View>
  );
}

function PollCard({ poll, onVote }: { poll: Poll; onVote: (id: string, option: "opt1" | "opt2") => void }) {
  const [chosenOption, setChosenOption] = useState<"opt1" | "opt2" | null>(null);
  const percentages = getPollPercentages(poll);

  function choose(option: "opt1" | "opt2") {
    setChosenOption(option);
    onVote(poll.id, option);
  }

  return (
    <View style={styles.pollCard}>
      <View style={styles.pollHeader}>
        <Text style={styles.question}>{poll.question}</Text>
        <Text style={styles.badge}>{poll.category}</Text>
      </View>

      {chosenOption ? (
        <View style={styles.results}>
          <ResultBar label={poll.opt1} percentage={percentages.opt1} active={chosenOption === "opt1"} />
          <ResultBar label={poll.opt2} percentage={percentages.opt2} active={chosenOption === "opt2"} />
        </View>
      ) : (
        <View style={styles.options}>
          <Button label={poll.opt1} onPress={() => choose("opt1")} style={styles.optionButton} />
          <Button label={poll.opt2} onPress={() => choose("opt2")} style={styles.optionButton} />
        </View>
      )}
    </View>
  );
}

function ResultBar({ label, percentage, active }: { label: string; percentage: number; active: boolean }) {
  return (
    <View style={styles.resultRow}>
      <View style={[styles.resultFill, { width: `${Math.max(percentage, 8)}%` }, active && styles.activeResult]} />
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={styles.resultPercent}>{percentage}%</Text>
    </View>
  );
}

function PollComposer({
  visible,
  category,
  onClose,
  onSubmit
}: {
  visible: boolean;
  category: string;
  onClose: () => void;
  onSubmit: (input: { question: string; opt1: string; opt2: string }) => Promise<void>;
}) {
  const [question, setQuestion] = useState("");
  const [opt1, setOpt1] = useState("");
  const [opt2, setOpt2] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    setIsSubmitting(true);
    await onSubmit({ question, opt1, opt2 });
    setQuestion("");
    setOpt1("");
    setOpt2("");
    setIsSubmitting(false);
  }

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalPanel}>
          <Text style={styles.modalTitle}>New poll in {category}</Text>
          <View style={styles.formGap}>
            <Field label="Question" value={question} onChangeText={setQuestion} />
            <Field label="Option 1" value={opt1} onChangeText={setOpt1} />
            <Field label="Option 2" value={opt2} onChangeText={setOpt2} />
            <Button label="Post Poll" onPress={submit} loading={isSubmitting} />
            <Button label="Cancel" variant="ghost" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 110,
    width: "100%",
    maxWidth: 820,
    alignSelf: "center",
    gap: spacing.lg
  },
  header: {
    gap: spacing.lg
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
    alignItems: "flex-start"
  },
  appName: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: spacing.xs
  },
  heading: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
    justifyContent: "flex-end"
  },
  smallButton: {
    minHeight: 40,
    paddingHorizontal: 12
  },
  categoryList: {
    gap: spacing.sm
  },
  chip: {
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  chipText: {
    color: colors.muted,
    fontWeight: "700"
  },
  activeChipText: {
    color: "#FFFFFF"
  },
  addGroupRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  groupInput: {
    flex: 1,
    minHeight: 44,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: 12
  },
  addButton: {
    minHeight: 44
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 8,
    padding: 4
  },
  tab: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center"
  },
  activeTab: {
    backgroundColor: colors.surface
  },
  tabText: {
    color: colors.muted,
    fontWeight: "800",
    textTransform: "capitalize"
  },
  activeTabText: {
    color: colors.text
  },
  error: {
    color: colors.danger,
    lineHeight: 20
  },
  loading: {
    padding: spacing.xl
  },
  empty: {
    color: colors.muted,
    padding: spacing.xl,
    textAlign: "center"
  },
  pollCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.lg
  },
  pollHeader: {
    gap: spacing.sm
  },
  question: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#ECFEFF",
    borderColor: "#99F6E4",
    borderRadius: 999,
    borderWidth: 1,
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  options: {
    flexDirection: "row",
    gap: spacing.md
  },
  optionButton: {
    flex: 1,
    minHeight: 72
  },
  results: {
    gap: spacing.md
  },
  resultRow: {
    height: 52,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    justifyContent: "center"
  },
  resultFill: {
    ...StyleSheet.absoluteFillObject,
    right: undefined,
    backgroundColor: "#334155"
  },
  activeResult: {
    backgroundColor: colors.primary
  },
  resultLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    paddingHorizontal: 14
  },
  resultPercent: {
    position: "absolute",
    right: 14,
    color: "#FFFFFF",
    fontWeight: "900"
  },
  fab: {
    position: "absolute",
    bottom: 28,
    right: 28,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "rgba(15, 23, 42, 0.18)",
    borderWidth: 1
  },
  fabText: {
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "700"
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end"
  },
  modalPanel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    padding: spacing.xl,
    gap: spacing.lg
  },
  modalTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  },
  formGap: {
    gap: spacing.lg
  }
});
