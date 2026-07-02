import { useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWallet } from "../lib/wallet";
import { useEvent } from "../lib/event";
import {
	createTopUpOrder,
	getTopUpTransaction,
	verifyTopUpOnChain,
} from "../lib/api";
import { colors, fonts, radii, spacing } from "./theme";

const presets = [25, 50, 100];

export default function TopUpScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { token, publicKey, signAndSendTransaction } = useWallet();
	const { selectedEvent } = useEvent();
	const [amount, setAmount] = useState(50);
	const [method, setMethod] = useState<"usdc" | "card">("usdc");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const eventId = selectedEvent?.id;

	const handleTopUp = async () => {
		if (!token || !publicKey || !eventId) return;
		setError(null);
		setLoading(true);
		try {
			const { order } = await createTopUpOrder(
				token,
				eventId,
				amount.toString(),
				method as "usdc" | "fiat",
			);
			const tx = await getTopUpTransaction(token, order.id, publicKey);
			const signature = await signAndSendTransaction(tx.transactionBase64);
			await verifyTopUpOnChain(token, order.id, signature);
			router.replace({ pathname: "/success", params: { type: "topup", amount: amount.toString() } });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Top-up failed");
			setLoading(false);
		}
	};

	const symbol = selectedEvent?.tokenSymbol || "BRK";

	return (
		<View style={[styles.container, { paddingBottom: insets.bottom }]}>
			<View style={styles.dim} />
			<View style={styles.sheet}>
				<View style={styles.handle} />
				<Text style={styles.title}>Add credits</Text>

				<View style={styles.amountWrap}>
					<Text style={styles.amount}>{amount}</Text>
					<Text style={styles.amountSymbol}> {symbol}</Text>
				</View>
				<Text style={styles.usd}>≈ ${amount.toFixed(2)}</Text>

				<View style={styles.presetRow}>
					{presets.map((p) => (
						<TouchableOpacity
							key={p}
							style={[styles.preset, amount === p && styles.presetActive]}
							onPress={() => setAmount(p)}
						>
							<Text style={[styles.presetText, amount === p && styles.presetTextActive]}>
								{p}
							</Text>
						</TouchableOpacity>
					))}
				</View>

				<TouchableOpacity
					style={[styles.method, method === "usdc" && styles.methodActive]}
					onPress={() => setMethod("usdc")}
				>
					<View style={styles.usdcIcon} />
					<View style={styles.methodInfo}>
						<Text style={styles.methodTitle}>USDC balance</Text>
						<Text style={styles.methodSubtitle}>$340.00 available</Text>
					</View>
					<View style={[styles.radio, method === "usdc" && styles.radioActive]} />
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.method, method === "card" && styles.methodActive]}
					onPress={() => setMethod("card")}
				>
					<View style={styles.cardIcon}>
						<Text style={styles.cardEmoji}>💳</Text>
					</View>
					<View style={styles.methodInfo}>
						<Text style={styles.methodTitle}>Card · Kado</Text>
					</View>
					<View style={[styles.radio, method === "card" && styles.radioActive]} />
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.button, loading && styles.buttonDisabled]}
					onPress={handleTopUp}
					disabled={loading}
				>
					{loading ? (
						<ActivityIndicator color={colors.textPrimary} />
					) : (
						<Text style={styles.buttonText}>Add {amount} {symbol}</Text>
					)}
				</TouchableOpacity>

				{error && <Text style={styles.error}>{error}</Text>}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "transparent",
		justifyContent: "flex-end",
	},
	dim: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: colors.bg,
		opacity: 0.6,
	},
	sheet: {
		backgroundColor: "#15111f",
		borderTopLeftRadius: radii["9xl"],
		borderTopRightRadius: radii["9xl"],
		borderTopWidth: 1,
		borderTopColor: "rgba(255,255,255,0.07)",
		paddingHorizontal: 20,
		paddingTop: 18,
		paddingBottom: 26,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: -20 },
		shadowOpacity: 0.5,
		shadowRadius: 50,
	},
	handle: {
		width: 42,
		height: 5,
		borderRadius: 4,
		backgroundColor: "rgba(255,255,255,0.18)",
		alignSelf: "center",
		marginBottom: 18,
	},
	title: {
		fontFamily: fonts.space,
		fontSize: 19,
		fontWeight: "700",
		color: colors.textPrimary,
	},
	amountWrap: {
		flexDirection: "row",
		alignItems: "baseline",
		justifyContent: "center",
		marginTop: 22,
		marginBottom: 6,
	},
	amount: {
		fontFamily: fonts.space,
		fontSize: 52,
		fontWeight: "700",
		color: colors.textPrimary,
		letterSpacing: -2,
	},
	amountSymbol: {
		fontFamily: fonts.inter,
		fontSize: 18,
		fontWeight: "600",
		color: colors.textMuted,
	},
	usd: {
		fontFamily: fonts.inter,
		fontSize: 12,
		color: colors.textMuted,
		textAlign: "center",
		marginBottom: 18,
	},
	presetRow: {
		flexDirection: "row",
		gap: 9,
		marginBottom: 20,
	},
	preset: {
		flex: 1,
		height: 42,
		borderRadius: radii.lg,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.1)",
		alignItems: "center",
		justifyContent: "center",
	},
	presetActive: {
		borderWidth: 1.5,
		borderColor: colors.purple,
		backgroundColor: "rgba(153,69,255,0.12)",
	},
	presetText: {
		fontFamily: fonts.space,
		fontSize: 14,
		fontWeight: "600",
		color: colors.textMuted,
	},
	presetTextActive: {
		color: colors.textPrimary,
	},
	method: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.08)",
		borderRadius: radii.xl,
		padding: 13,
		marginBottom: 10,
	},
	methodActive: {
		borderWidth: 1.5,
		borderColor: colors.purple,
	},
	usdcIcon: {
		width: 34,
		height: 34,
		borderRadius: radii.md,
		backgroundColor: colors.usdc,
	},
	cardIcon: {
		width: 34,
		height: 34,
		borderRadius: radii.md,
		backgroundColor: colors.cardSecondary,
		alignItems: "center",
		justifyContent: "center",
	},
	cardEmoji: {
		fontSize: 15,
	},
	methodInfo: {
		flex: 1,
	},
	methodTitle: {
		fontFamily: fonts.inter,
		fontSize: 13,
		fontWeight: "600",
		color: colors.textPrimary,
	},
	methodSubtitle: {
		fontFamily: fonts.inter,
		fontSize: 11,
		color: colors.textMuted,
		marginTop: 2,
	},
	radio: {
		width: 18,
		height: 18,
		borderRadius: 9,
		borderWidth: 1.5,
		borderColor: "rgba(255,255,255,0.2)",
	},
	radioActive: {
		borderWidth: 5,
		borderColor: colors.purple,
	},
	button: {
		height: 54,
		borderRadius: radii["3xl"],
		backgroundColor: colors.purple,
		alignItems: "center",
		justifyContent: "center",
		marginTop: 8,
		shadowColor: colors.purple,
		shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 0.4,
		shadowRadius: 30,
		elevation: 12,
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	buttonText: {
		fontFamily: fonts.inter,
		fontSize: 15,
		fontWeight: "600",
		color: colors.textPrimary,
	},
	error: {
		fontFamily: fonts.inter,
		fontSize: 13,
		color: colors.live,
		textAlign: "center",
		marginTop: 10,
	},
});
