import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radii, spacing } from "../theme";

const podium = [
	{ rank: 2, name: "mara.sol", xp: 2980, color: colors.purpleDeeper, border: colors.silver, text: colors.silver },
	{ rank: 1, name: "d.eth", xp: 3410, color: colors.green, border: colors.gold, text: colors.gold, crown: true },
	{ rank: 3, name: "yuki.sol", xp: 2640, color: colors.orange, border: colors.bronze, text: colors.bronze },
];

const rows = [
	{ rank: 4, name: "leo.sol", xp: 2210, color: colors.usdc },
	{ rank: 5, name: "anya.eth", xp: 1870, color: colors.purpleDark },
];

export default function LeaderboardScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();

	return (
		<View style={[styles.container, { paddingTop: insets.top + 16 }]}>
			<View style={styles.header}>
				<Text style={styles.title}>Leaderboard</Text>
				<Text style={styles.subtitle}>Breakpoint 2026 · top explorers</Text>
			</View>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.scroll}
			>
				<View style={styles.podium}>
					{podium.map((p) => (
						<View key={p.rank} style={styles.podiumItem}>
							{p.crown && <Text style={styles.crown}>👑</Text>}
							<View
								style={[
									styles.avatar,
									{ backgroundColor: p.color, borderColor: p.border },
									p.crown ? styles.avatarCrown : styles.avatarNoCrown,
								]}
							/>
							<Text style={styles.podiumName}>{p.name}</Text>
							<Text style={[styles.podiumXp, { color: p.rank === 1 ? colors.green : colors.textMuted }]}>
								{p.xp.toLocaleString()}
							</Text>
							<View
								style={[
									styles.podiumBar,
									{ height: p.rank === 1 ? 70 : p.rank === 2 ? 52 : 40 },
									{ backgroundColor: p.rank === 1 ? "#3a2f1a" : "#2a2435" },
								]}
							>
								<Text style={[styles.podiumRank, { color: p.text }]}>{p.rank}</Text>
							</View>
						</View>
					))}
				</View>

				<View style={styles.rows}>
					{rows.map((r) => (
						<View key={r.rank} style={styles.row}>
							<Text style={styles.rowRank}>{r.rank}</Text>
							<View style={[styles.rowAvatar, { backgroundColor: r.color }]} />
							<Text style={styles.rowName}>{r.name}</Text>
							<Text style={styles.rowXp}>{r.xp.toLocaleString()}</Text>
						</View>
					))}
				</View>

			</ScrollView>

			<TouchableOpacity
				style={[styles.rewardButton, { bottom: insets.bottom + 20 }]}
				onPress={() => router.push("/quests/reward-pool")}
			>
				<Text style={styles.rewardRank}>12</Text>
				<View style={styles.rewardAvatar} />
				<View style={styles.rewardBody}>
					<Text style={styles.rewardName}>You · 7xKn…3pQ</Text>
					<Text style={styles.rewardHint}>Climb 2 spots to reach the reward tier</Text>
				</View>
				<Text style={styles.rewardXp}>1,240</Text>
			</TouchableOpacity>
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
		marginBottom: 20,
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
	scroll: {
		paddingBottom: 100,
	},
	podium: {
		flexDirection: "row",
		alignItems: "flex-end",
		justifyContent: "center",
		gap: 10,
		paddingHorizontal: 20,
	},
	podiumItem: {
		flex: 1,
		alignItems: "center",
	},
	crown: {
		fontSize: 16,
		marginBottom: 2,
	},
	avatar: {
		width: 50,
		height: 50,
		borderRadius: 25,
		borderWidth: 2,
	},
	avatarCrown: {
		marginTop: 0,
	},
	avatarNoCrown: {
		marginTop: 8,
	},
	podiumName: {
		fontFamily: fonts.inter,
		fontSize: 11,
		fontWeight: "600",
		color: colors.textPrimary,
		marginTop: 6,
	},
	podiumXp: {
		fontFamily: fonts.inter,
		fontSize: 9,
		color: colors.textMuted,
		marginTop: 2,
	},
	podiumBar: {
		width: "100%",
		borderTopLeftRadius: 10,
		borderTopRightRadius: 10,
		marginTop: 7,
		alignItems: "center",
		paddingTop: 7,
	},
	podiumRank: {
		fontFamily: fonts.space,
		fontSize: 16,
		fontWeight: "700",
	},
	rows: {
		paddingTop: 14,
		gap: 9,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 9,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(255,255,255,0.05)",
	},
	rowRank: {
		fontFamily: fonts.space,
		fontSize: 12,
		fontWeight: "700",
		color: colors.textMuted,
		width: 20,
	},
	rowAvatar: {
		width: 32,
		height: 32,
		borderRadius: 16,
	},
	rowName: {
		flex: 1,
		fontFamily: fonts.inter,
		fontSize: 12,
		fontWeight: "600",
		color: colors.textPrimary,
	},
	rowXp: {
		fontFamily: fonts.space,
		fontSize: 12,
		fontWeight: "600",
		color: colors.textSecondary,
	},
	rewardButton: {
		position: "absolute",
		left: 20,
		right: 20,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		borderRadius: radii.xl,
		padding: 12,
		backgroundColor: colors.purple,
		shadowColor: colors.purple,
		shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 0.35,
		shadowRadius: 30,
		elevation: 10,
	},
	rewardRank: {
		fontFamily: fonts.space,
		fontSize: 13,
		fontWeight: "700",
		color: colors.textPrimary,
		width: 20,
	},
	rewardAvatar: {
		width: 34,
		height: 34,
		borderRadius: 17,
		backgroundColor: colors.green,
		borderWidth: 2,
		borderColor: "rgba(255,255,255,0.4)",
	},
	rewardBody: {
		flex: 1,
	},
	rewardName: {
		fontFamily: fonts.inter,
		fontSize: 13,
		fontWeight: "700",
		color: colors.textPrimary,
	},
	rewardHint: {
		fontFamily: fonts.inter,
		fontSize: 10,
		color: "rgba(255,255,255,0.75)",
		marginTop: 2,
	},
	rewardXp: {
		fontFamily: fonts.space,
		fontSize: 14,
		fontWeight: "700",
		color: colors.textPrimary,
	},
});
