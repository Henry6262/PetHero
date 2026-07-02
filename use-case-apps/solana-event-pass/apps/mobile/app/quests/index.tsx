import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radii, spacing } from "../theme";

const xp = 1240;
const nextLevel = 1500;
const progress = xp / nextLevel;

const quests = [
	{ emoji: "✓", title: "First payment in BRK", status: "Completed", xp: 200, done: true },
	{ emoji: "📍", title: "Check in at 3 checkpoints", status: "2 / 3 done", xp: 300, done: false },
	{ emoji: "🎤", title: "Attend a main-stage talk", status: "Not started", xp: 250, done: false },
	{ emoji: "🎉", title: "RSVP a side event", status: "Not started", xp: 150, done: false },
];

export default function QuestsScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();

	return (
		<View style={[styles.container, { paddingTop: insets.top + 16 }]}>
			<View style={styles.header}>
				<View>
					<Text style={styles.title}>Quests</Text>
					<Text style={styles.subtitle}>Earn XP & badges all week</Text>
				</View>
				<View style={styles.xpBox}>
					<Text style={styles.xpValue}>{xp.toLocaleString()}</Text>
					<Text style={styles.xpLabel}>your XP</Text>
				</View>
			</View>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.scroll}
			>
				<View style={styles.progressCard}>
					<View style={styles.progressHeader}>
						<Text style={styles.progressLevel}>Level 4 · Explorer</Text>
						<Text style={styles.progressMeta}>
							{xp.toLocaleString()} / {nextLevel.toLocaleString()}
						</Text>
					</View>
					<View style={styles.progressTrack}>
						<View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
					</View>
					<Text style={styles.progressHint}>
						{nextLevel - xp} XP to unlock the next chest drop 🎁
					</Text>
				</View>

				<View style={styles.list}>
					{quests.map((q) => (
						<View
							key={q.title}
							style={[
								styles.quest,
								q.done && styles.questDone,
							]}
						>
							<View
								style={[
									styles.questIcon,
									q.done && styles.questIconDone,
								]}
							>
								<Text style={styles.questEmoji}>{q.emoji}</Text>
							</View>
							<View style={styles.questBody}>
								<Text style={styles.questTitle}>{q.title}</Text>
								<Text
									style={[
										styles.questStatus,
										q.done && styles.questStatusDone,
									]}
								>
									{q.status}
								</Text>
							</View>
							<Text
								style={[
									styles.questXp,
									q.done && styles.questXpDone,
								]}
							>
								+{q.xp}
							</Text>
						</View>
					))}
				</View>

				<TouchableOpacity
					style={styles.viewLeaderboard}
					onPress={() => router.push("/quests/leaderboard")}
				>
					<Text style={styles.viewLeaderboardText}>View leaderboard →</Text>
				</TouchableOpacity>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.bg,
		paddingHorizontal: 20,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 16,
	},
	title: {
		fontFamily: fonts.space,
		fontSize: 20,
		fontWeight: "700",
		color: colors.textPrimary,
		letterSpacing: -0.5,
	},
	subtitle: {
		fontFamily: fonts.inter,
		fontSize: 12,
		color: colors.textMuted,
		marginTop: 2,
	},
	xpBox: {
		alignItems: "flex-end",
	},
	xpValue: {
		fontFamily: fonts.space,
		fontSize: 20,
		fontWeight: "700",
		color: colors.green,
	},
	xpLabel: {
		fontFamily: fonts.inter,
		fontSize: 10,
		color: colors.textMuted,
		marginTop: 1,
	},
	scroll: {
		paddingBottom: 100,
	},
	progressCard: {
		borderRadius: radii.xl,
		padding: 14,
		backgroundColor: colors.card,
		borderWidth: 1,
		borderColor: colors.border,
		marginBottom: 16,
	},
	progressHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 9,
	},
	progressLevel: {
		fontFamily: fonts.inter,
		fontSize: 11,
		fontWeight: "600",
		color: colors.textSecondary,
	},
	progressMeta: {
		fontFamily: fonts.inter,
		fontSize: 11,
		color: colors.textMuted,
	},
	progressTrack: {
		height: 8,
		borderRadius: 5,
		backgroundColor: colors.bg,
		overflow: "hidden",
	},
	progressFill: {
		height: "100%",
		backgroundColor: colors.green,
	},
	progressHint: {
		fontFamily: fonts.inter,
		fontSize: 10,
		color: colors.textMuted,
		marginTop: 8,
	},
	list: {
		gap: 11,
	},
	quest: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.card,
		borderRadius: radii["2xl"],
		padding: 12,
	},
	questDone: {
		borderColor: "rgba(20,241,149,0.25)",
		backgroundColor: "rgba(20,241,149,0.05)",
	},
	questIcon: {
		width: 38,
		height: 38,
		borderRadius: radii.sm,
		backgroundColor: colors.cardSecondary,
		alignItems: "center",
		justifyContent: "center",
	},
	questIconDone: {
		backgroundColor: colors.green,
	},
	questEmoji: {
		fontSize: 15,
	},
	questBody: {
		flex: 1,
	},
	questTitle: {
		fontFamily: fonts.inter,
		fontSize: 13,
		fontWeight: "600",
		color: colors.textPrimary,
	},
	questStatus: {
		fontFamily: fonts.inter,
		fontSize: 10,
		color: colors.textMuted,
		marginTop: 2,
	},
	questStatusDone: {
		color: colors.green,
	},
	questXp: {
		fontFamily: fonts.space,
		fontSize: 12,
		fontWeight: "700",
		color: colors.textSecondary,
	},
	questXpDone: {
		color: colors.green,
	},
	viewLeaderboard: {
		marginTop: 20,
		alignSelf: "center",
		padding: 10,
	},
	viewLeaderboardText: {
		fontFamily: fonts.inter,
		fontSize: 13,
		fontWeight: "600",
		color: colors.purple,
	},
});
