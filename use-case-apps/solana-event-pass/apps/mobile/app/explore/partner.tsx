import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radii, spacing } from "../theme";

export default function PartnerScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();

	return (
		<View style={styles.container}>
			<View style={[styles.hero, { paddingTop: insets.top + 12, height: 200 + insets.top }]}>
				<TouchableOpacity style={styles.back} onPress={() => router.back()}>
					<View style={styles.backArrow} />
				</TouchableOpacity>
				<View style={styles.heroContent}>
					<View style={styles.tag}>
						<Text style={styles.tagText}>PARTNER · FOOD</Text>
					</View>
					<Text style={styles.heroTitle}>Sunrise Coffee Cart</Text>
				</View>
			</View>

			<View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
				<View style={styles.discountBanner}>
					<Text style={styles.discountAmount}>15% OFF</Text>
					<Text style={styles.discountSub}>
						for Breakpoint pass holders · pay in BRK
					</Text>
				</View>

				<View style={styles.statsRow}>
					<View style={styles.stat}>
						<Text style={styles.statValue}>120m</Text>
						<Text style={styles.statLabel}>2 min walk</Text>
					</View>
					<View style={styles.stat}>
						<Text style={[styles.statValue, styles.statGreen]}>Open</Text>
						<Text style={styles.statLabel}>until 18:00</Text>
					</View>
					<View style={styles.stat}>
						<Text style={styles.statValue}>4.8★</Text>
						<Text style={styles.statLabel}>86 reviews</Text>
					</View>
				</View>

				<Text style={styles.description}>
					Specialty espresso & pastries, two minutes from the main stage.
					Show your pass at the counter or pay in BRK for the discount to
					apply automatically.
				</Text>

				<View style={styles.actions}>
					<TouchableOpacity style={styles.secondaryAction}>
						<Text style={styles.secondaryActionText}>Directions</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.primaryAction}>
						<Text style={styles.primaryActionText}>Pay 12 BRK</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.bg,
	},
	hero: {
		backgroundColor: colors.orange,
		paddingHorizontal: 18,
		justifyContent: "flex-end",
	},
	back: {
		position: "absolute",
		top: 50,
		left: 16,
		width: 34,
		height: 34,
		borderRadius: 17,
		backgroundColor: "rgba(0,0,0,0.25)",
		alignItems: "center",
		justifyContent: "center",
	},
	backArrow: {
		width: 9,
		height: 9,
		borderLeftWidth: 2,
		borderBottomWidth: 2,
		borderColor: colors.textPrimary,
		transform: [{ rotate: "45deg" }],
		marginLeft: 3,
	},
	heroContent: {
		marginBottom: 18,
	},
	tag: {
		alignSelf: "flex-start",
		backgroundColor: "rgba(255,255,255,0.2)",
		borderRadius: radii.md,
		paddingHorizontal: 9,
		paddingVertical: 4,
		marginBottom: 8,
	},
	tagText: {
		fontFamily: fonts.inter,
		fontSize: 10,
		fontWeight: "700",
		color: colors.textPrimary,
	},
	heroTitle: {
		fontFamily: fonts.space,
		fontSize: 21,
		fontWeight: "700",
		color: colors.textPrimary,
		letterSpacing: -0.3,
	},
	sheet: {
		flex: 1,
		backgroundColor: colors.bg,
		borderTopLeftRadius: radii["8xl"],
		borderTopRightRadius: radii["8xl"],
		marginTop: -18,
		paddingHorizontal: 20,
		paddingTop: 18,
	},
	discountBanner: {
		borderRadius: radii.xl,
		padding: 16,
		backgroundColor: "rgba(20,241,149,0.12)",
		borderWidth: 1,
		borderStyle: "dashed",
		borderColor: "rgba(20,241,149,0.5)",
		alignItems: "center",
	},
	discountAmount: {
		fontFamily: fonts.space,
		fontSize: 28,
		fontWeight: "700",
		color: colors.green,
		letterSpacing: -0.5,
	},
	discountSub: {
		fontFamily: fonts.inter,
		fontSize: 11,
		color: "#9fe8c6",
		marginTop: 2,
	},
	statsRow: {
		flexDirection: "row",
		gap: 18,
		marginTop: 18,
		marginBottom: 16,
	},
	stat: {},
	statValue: {
		fontFamily: fonts.space,
		fontSize: 16,
		fontWeight: "700",
		color: colors.textPrimary,
	},
	statGreen: {
		color: colors.green,
	},
	statLabel: {
		fontFamily: fonts.inter,
		fontSize: 10,
		color: colors.textMuted,
		marginTop: 2,
	},
	description: {
		fontFamily: fonts.inter,
		fontSize: 13,
		color: colors.textSecondary,
		lineHeight: 20,
	},
	actions: {
		position: "absolute",
		left: 20,
		right: 20,
		bottom: 24,
		flexDirection: "row",
		gap: 11,
	},
	secondaryAction: {
		flex: 1,
		height: 52,
		borderRadius: radii["2xl"],
		backgroundColor: colors.card,
		borderWidth: 1,
		borderColor: colors.borderStrong,
		alignItems: "center",
		justifyContent: "center",
	},
	secondaryActionText: {
		fontFamily: fonts.inter,
		fontSize: 14,
		fontWeight: "600",
		color: colors.textPrimary,
	},
	primaryAction: {
		flex: 1.3,
		height: 52,
		borderRadius: radii["2xl"],
		backgroundColor: colors.green,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: colors.green,
		shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 0.35,
		shadowRadius: 28,
		elevation: 10,
	},
	primaryActionText: {
		fontFamily: fonts.inter,
		fontSize: 14,
		fontWeight: "600",
		color: colors.black,
	},
});
