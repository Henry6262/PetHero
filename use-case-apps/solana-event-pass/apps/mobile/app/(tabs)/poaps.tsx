import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWallet } from "../../lib/wallet";
import { useTabBarOffset } from "../../components/useTabBarOffset";
import { colors, fonts, radii, spacing } from "../theme";

function poapStyle(gradient?: string) {
	switch (gradient) {
		case "green":
			return styles.poapGreen;
		case "orange":
			return styles.poapOrange;
		case "usdc":
			return styles.poapUsdc;
		default:
			return styles.poapPurple;
	}
}

const poaps = [
	{ id: "1", unlocked: true, gradient: "purple" },
	{ id: "2", unlocked: true, gradient: "green" },
	{ id: "3", unlocked: true, gradient: "orange" },
	{ id: "4", unlocked: true, gradient: "usdc" },
	{ id: "5", unlocked: false },
	{ id: "6", unlocked: false },
	{ id: "7", unlocked: false },
	{ id: "8", unlocked: false },
	{ id: "9", unlocked: false },
];

export default function PoapsScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const tabBarOffset = useTabBarOffset();
	const { user } = useWallet();
	const unlocked = poaps.filter((p) => p.unlocked).length;

	return (
		<View style={[styles.container, { paddingTop: insets.top + 16 }]}>
			<View style={styles.header}>
				<View>
					<Text style={styles.title}>Your POAPs</Text>
					<Text style={styles.subtitle}>{unlocked} of {poaps.length} collected at Breakpoint</Text>
				</View>
			</View>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={[styles.scroll, { paddingBottom: tabBarOffset + 20 }]}
			>
				<View style={styles.grid}>
					{poaps.map((poap) => (
						<View
							key={poap.id}
							style={[
								styles.poap,
								poap.unlocked ? poapStyle(poap.gradient) : styles.poapLocked,
							]}
						>
							{!poap.unlocked && <Text style={styles.lock}>🔒</Text>}
						</View>
					))}
				</View>

				<TouchableOpacity style={styles.banner} onPress={() => router.push("/quests")}>
					<View style={styles.bannerIcon} />
					<Text style={styles.bannerText}>
						Pay or check in to earn your next badge
					</Text>
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
		alignItems: "flex-start",
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
		marginTop: 3,
	},
	scroll: {
		paddingBottom: 0,
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 14,
	},
	poap: {
		width: "30%",
		aspectRatio: 1,
		borderRadius: radii["4xl"],
	},
	poapPurple: {
		backgroundColor: colors.purple,
		shadowColor: colors.purple,
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.35,
		shadowRadius: 20,
	},
	poapGreen: {
		backgroundColor: colors.green,
		shadowColor: colors.green,
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.3,
		shadowRadius: 20,
	},
	poapOrange: {
		backgroundColor: colors.orange,
		shadowColor: colors.orange,
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.3,
		shadowRadius: 20,
	},
	poapUsdc: {
		backgroundColor: colors.usdc,
	},
	poapLocked: {
		borderWidth: 1.5,
		borderStyle: "dashed",
		borderColor: "rgba(255,255,255,0.14)",
		alignItems: "center",
		justifyContent: "center",
	},
	lock: {
		fontSize: 18,
		opacity: 0.5,
	},
	banner: {
		flexDirection: "row",
		alignItems: "center",
		gap: 11,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.card,
		borderRadius: radii.xl,
		padding: 13,
		marginTop: 20,
	},
	bannerIcon: {
		width: 38,
		height: 38,
		borderRadius: radii.sm,
		backgroundColor: colors.purple,
	},
	bannerText: {
		flex: 1,
		fontFamily: fonts.inter,
		fontSize: 12,
		color: colors.textSecondary,
		lineHeight: 18,
	},
});
