import { useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWallet } from "../lib/wallet";
import { useEvent } from "../lib/event";
import { buildPaymentTransaction, verifyPayment } from "../lib/api";
import { colors, fonts, radii, spacing } from "./theme";

export default function PayScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { token, publicKey, signAndSendTransaction } = useWallet();
	const { selectedEvent } = useEvent();
	const [terminalId, setTerminalId] = useState("");
	const [amount, setAmount] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handlePay = async () => {
		if (!token || !publicKey || !terminalId || !amount) return;
		setError(null);
		setLoading(true);
		try {
			const txPayload = await buildPaymentTransaction(token, terminalId, amount, publicKey);
			const signature = await signAndSendTransaction(txPayload.transactionBase64);
			await verifyPayment(
				token,
				signature,
				txPayload.terminalId,
				txPayload.eventTokenId,
				txPayload.amount,
			);
			router.replace({
				pathname: "/success",
				params: { type: "payment", amount, vendor: terminalId },
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Payment failed");
			setLoading(false);
		}
	};

	const symbol = selectedEvent?.tokenSymbol || "BRK";

	return (
		<View style={[styles.container, { paddingBottom: insets.bottom }]}>
			{/* Scan background */}
			<View style={styles.scanBg}>
				<View style={styles.toggle}>
					<View style={styles.toggleActive}>
						<Text style={styles.toggleActiveText}>Scan</Text>
					</View>
					<View style={styles.toggleInactive}>
						<Text style={styles.toggleInactiveText}>My QR</Text>
					</View>
				</View>

				<View style={styles.frame}>
					<View style={[styles.corner, styles.topLeft]} />
					<View style={[styles.corner, styles.topRight]} />
					<View style={[styles.corner, styles.bottomLeft]} />
					<View style={[styles.corner, styles.bottomRight]} />
					<View style={styles.scanLine} />
				</View>

				<View style={styles.scanText}>
					<Text style={styles.scanTitle}>Scan to pay</Text>
					<Text style={styles.scanSubtitle}>Point at the vendor's Solana Pay QR</Text>
				</View>
			</View>

			{/* Confirm sheet */}
			<View style={styles.sheet}>
				<View style={styles.handle} />

				<View style={styles.vendorRow}>
					<View style={styles.vendorIcon}>
						<Text style={styles.vendorEmoji}>🥨</Text>
					</View>
					<View>
						<Text style={styles.vendorName}>
							{terminalId || "Brezel Bar"}
						</Text>
						<Text style={styles.vendorMeta}>Vendor #{terminalId ? "#" + terminalId.slice(0, 4) : "14"} · verified</Text>
					</View>
				</View>

				<View style={styles.amountWrap}>
					<Text style={styles.amount}>
						{amount || "12"} <Text style={styles.amountSymbol}>{symbol}</Text>
					</Text>
					<Text style={styles.usd}>≈ ${amount ? Number(amount).toFixed(2) : "12.00"}</Text>
				</View>

				<View style={styles.statusRow}>
					<View style={styles.statusDot} />
					<Text style={styles.statusText}>pending → confirmed → finalized</Text>
				</View>

				<TextInput
					style={styles.input}
					placeholder="Terminal ID"
					placeholderTextColor={colors.textDim}
					value={terminalId}
					onChangeText={setTerminalId}
					autoCapitalize="none"
				/>
				<TextInput
					style={styles.input}
					placeholder="Amount"
					placeholderTextColor={colors.textDim}
					value={amount}
					onChangeText={setAmount}
					keyboardType="decimal-pad"
				/>

				<TouchableOpacity
					style={[styles.payButton, loading && styles.payButtonDisabled]}
					onPress={handlePay}
					disabled={loading || !terminalId || !amount}
				>
					{loading ? (
						<ActivityIndicator color={colors.textPrimary} />
					) : (
						<Text style={styles.payButtonText}>Slide to pay →</Text>
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
		backgroundColor: colors.black,
		justifyContent: "flex-end",
	},
	scanBg: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: colors.black,
		alignItems: "center",
		paddingTop: 54,
	},
	toggle: {
		flexDirection: "row",
		backgroundColor: "rgba(255,255,255,0.08)",
		borderRadius: radii.lg,
		padding: 4,
	},
	toggleActive: {
		backgroundColor: colors.purple,
		borderRadius: radii.md,
		paddingHorizontal: 20,
		paddingVertical: 7,
	},
	toggleActiveText: {
		fontFamily: fonts.inter,
		fontSize: 12,
		fontWeight: "600",
		color: colors.textPrimary,
	},
	toggleInactive: {
		paddingHorizontal: 20,
		paddingVertical: 7,
	},
	toggleInactiveText: {
		fontFamily: fonts.inter,
		fontSize: 12,
		fontWeight: "600",
		color: colors.textMuted,
	},
	frame: {
		width: 210,
		height: 210,
		marginTop: 60,
		position: "relative",
	},
	corner: {
		position: "absolute",
		width: 46,
		height: 46,
		borderColor: colors.green,
		borderWidth: 4,
	},
	topLeft: {
		top: 0,
		left: 0,
		borderTopLeftRadius: 12,
		borderRightWidth: 0,
		borderBottomWidth: 0,
	},
	topRight: {
		top: 0,
		right: 0,
		borderTopRightRadius: 12,
		borderLeftWidth: 0,
		borderBottomWidth: 0,
	},
	bottomLeft: {
		bottom: 0,
		left: 0,
		borderBottomLeftRadius: 12,
		borderRightWidth: 0,
		borderTopWidth: 0,
	},
	bottomRight: {
		bottom: 0,
		right: 0,
		borderBottomRightRadius: 12,
		borderLeftWidth: 0,
		borderTopWidth: 0,
	},
	scanLine: {
		position: "absolute",
		left: 10,
		right: 10,
		top: "50%",
		height: 2,
		backgroundColor: colors.green,
		shadowColor: colors.green,
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 1,
		shadowRadius: 14,
	},
	scanText: {
		position: "absolute",
		left: 30,
		right: 30,
		bottom: 220,
		alignItems: "center",
	},
	scanTitle: {
		fontFamily: fonts.inter,
		fontSize: 15,
		fontWeight: "600",
		color: colors.textPrimary,
	},
	scanSubtitle: {
		fontFamily: fonts.inter,
		fontSize: 13,
		color: colors.textMuted,
		marginTop: 5,
		textAlign: "center",
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
	},
	handle: {
		width: 42,
		height: 5,
		borderRadius: 4,
		backgroundColor: "rgba(255,255,255,0.18)",
		alignSelf: "center",
		marginBottom: 16,
	},
	vendorRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		marginBottom: 18,
	},
	vendorIcon: {
		width: 46,
		height: 46,
		borderRadius: radii.lg,
		backgroundColor: colors.cardSecondary,
		alignItems: "center",
		justifyContent: "center",
	},
	vendorEmoji: {
		fontSize: 20,
	},
	vendorName: {
		fontFamily: fonts.inter,
		fontSize: 15,
		fontWeight: "600",
		color: colors.textPrimary,
	},
	vendorMeta: {
		fontFamily: fonts.inter,
		fontSize: 12,
		color: colors.textMuted,
		marginTop: 2,
	},
	amountWrap: {
		alignItems: "center",
		marginBottom: 18,
	},
	amount: {
		fontFamily: fonts.space,
		fontSize: 54,
		fontWeight: "700",
		color: colors.textPrimary,
		letterSpacing: -2,
	},
	amountSymbol: {
		fontSize: 20,
		color: colors.textMuted,
	},
	usd: {
		fontFamily: fonts.inter,
		fontSize: 13,
		color: colors.textMuted,
		marginTop: 2,
	},
	statusRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 9,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radii.md,
		padding: 10,
		marginBottom: 18,
	},
	statusDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: colors.goldDim,
	},
	statusText: {
		fontFamily: fonts.inter,
		fontSize: 11,
		fontWeight: "500",
		color: colors.textSecondary,
	},
	input: {
		backgroundColor: colors.card,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radii.xl,
		padding: 14,
		color: colors.textPrimary,
		fontFamily: fonts.inter,
		fontSize: 14,
		marginBottom: 10,
	},
	payButton: {
		height: 56,
		borderRadius: 30,
		backgroundColor: colors.purple,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 8,
		marginTop: 8,
		shadowColor: colors.purple,
		shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 0.4,
		shadowRadius: 30,
		elevation: 12,
	},
	payButtonDisabled: {
		opacity: 0.6,
	},
	payButtonText: {
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
