import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useRef } from "react";
import { colors, fonts, radii, spacing } from "../theme";

export default function RewardPoolScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const scale = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		const pulse = Animated.loop(
			Animated.sequence([
				Animated.timing(scale, { toValue: 1.04, duration: 1800, useNativeDriver: true }),
				Animated.timing(scale, { toValue: 1, duration: 1800, useNativeDriver: true }),
			]),
		);
		pulse.start();
		return () => pulse.stop();
	}, [scale]);

	return (
		<View style={[styles.container, { paddingTop: insets.top + 16 }]}>
			<View style={styles.header}>
				<Text style={styles.title}>Reward Pool</Text>
				<Text style={styles.subtitle}>Breakpoint 2026 · ends in 2d 14h</Text>
			</View>

			<View style={styles.sphereWrap}>
				<Animated.View style={[styles.sphere, { transform: [{ scale }] }]}>
					<View style={styles.solanaMark}>
						<View style={styles.markBar} />
						<View style={[styles.markBar, styles.markBarReverse]} />
						<View style={styles.markBar} />
					</View>
					<View style={styles.sphereHighlight} />
				</Animated.View>
			</View>

			<View style={styles.poolInfo}>
				<Text style={styles.poolAmount}>
					12,500 <Text style={styles.poolSymbol}>USDC</Text>
				</Text>
				<Text style={styles.poolExtras}>+ 50 exclusive POAPs · 3 hardware wallets</Text>
			</View>

			<View style={[styles.tiers, { bottom: insets.bottom + 90 }]}>
				<View style={[styles.tier, styles.tierGold]}>
					<Text style={styles.tierEmoji}>🥇</Text>
					<Text style={styles.tierLabel}>Top 1–3</Text>
					<Text style={styles.tierValue}>1,500 USDC + Ledger</Text>
				</View>
				<View style={styles.tier}>
					<Text style={styles.tierEmoji}>🎖️</Text>
					<Text style={styles.tierLabel}>Top 4–25</Text>
					<Text style={styles.tierValue}>200 USDC + POAP</Text>
				</View>
				<View style={styles.tier}>
					<Text style={styles.tierEmoji}>✨</Text>
					<Text style={styles.tierLabel}>Everyone who plays</Text>
					<Text style={styles.tierValue}>Collector POAP</Text>
				</View>
			</View>

			<TouchableOpacity
				style={[styles.button, { bottom: insets.bottom + 24 }]}
				onPress={() => router.push("/quests")}
			>
				<Text style={styles.buttonText}>View my quests →</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.bg,
		paddingHorizontal: 20,
		alignItems: "center",
	},
	header: {
		alignItems: "center",
		marginTop: 8,
	},
	title: {
		fontFamily: fonts.space,
		fontSize: 19,
		fontWeight: "700",
		color: colors.textPrimary,
		letterSpacing: -0.5,
	},
	subtitle: {
		fontFamily: fonts.inter,
		fontSize: 11,
		color: colors.textMuted,
		marginTop: 2,
	},
	sphereWrap: {
		marginTop: 24,
		alignItems: "center",
	},
	sphere: {
		width: 184,
		height: 184,
		borderRadius: 92,
		backgroundColor: "rgba(153,69,255,0.35)",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.25)",
		alignItems: "center",
		justifyContent: "center",
		shadowColor: colors.purple,
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.5,
		shadowRadius: 60,
		elevation: 12,
	},
	solanaMark: {
		gap: 5,
	},
	markBar: {
		width: 58,
		height: 11,
		borderRadius: 3,
		backgroundColor: colors.purple,
		transform: [{ skewX: "-22deg" }],
	},
	markBarReverse: {
		backgroundColor: colors.green,
	},
	sphereHighlight: {
		position: "absolute",
		top: 20,
		left: 34,
		width: 40,
		height: 24,
		borderRadius: 20,
		backgroundColor: "rgba(255,255,255,0.4)",
	},
	poolInfo: {
		alignItems: "center",
		marginTop: 20,
	},
	poolAmount: {
		fontFamily: fonts.space,
		fontSize: 34,
		fontWeight: "700",
		color: colors.textPrimary,
		letterSpacing: -1,
	},
	poolSymbol: {
		fontSize: 16,
		color: colors.green,
	},
	poolExtras: {
		fontFamily: fonts.inter,
		fontSize: 11,
		color: colors.textMuted,
		marginTop: 2,
	},
	tiers: {
		position: "absolute",
		left: 20,
		right: 20,
		gap: 8,
	},
	tier: {
		flexDirection: "row",
		alignItems: "center",
		gap: 11,
		borderRadius: radii.md,
		paddingHorizontal: 12,
		paddingVertical: 10,
		backgroundColor: colors.card,
		borderWidth: 1,
		borderColor: colors.border,
	},
	tierGold: {
		backgroundColor: "rgba(255,210,76,0.1)",
		borderColor: "rgba(255,210,76,0.35)",
	},
	tierEmoji: {
		fontSize: 15,
	},
	tierLabel: {
		flex: 1,
		fontFamily: fonts.inter,
		fontSize: 12,
		fontWeight: "600",
		color: colors.textPrimary,
	},
	tierValue: {
		fontFamily: fonts.space,
		fontSize: 11,
		fontWeight: "700",
		color: colors.textSecondary,
	},
	tierGoldValue: {
		color: colors.gold,
	},
	button: {
		position: "absolute",
		left: 20,
		right: 20,
		height: 52,
		borderRadius: radii["3xl"],
		backgroundColor: colors.purple,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: colors.purple,
		shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 0.45,
		shadowRadius: 30,
		elevation: 12,
	},
	buttonText: {
		fontFamily: fonts.inter,
		fontSize: 15,
		fontWeight: "600",
		color: colors.textPrimary,
	},
});
