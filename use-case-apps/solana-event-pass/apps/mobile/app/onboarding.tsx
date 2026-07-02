import { useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useWallet } from "../lib/wallet";
import { Orb } from "../components/Orb";
import { Button } from "../components/Button";
import { colors, fonts, radii, spacing } from "./theme";

type Step = "welcome" | "connect" | "devkey" | "success";

export default function OnboardingScreen() {
	const router = useRouter();
	const { publicKey, connect, login, isConnecting } = useWallet();
	const [step, setStep] = useState<Step>("welcome");
	const [secret, setSecret] = useState("");
	const [error, setError] = useState<string | null>(null);

	const handleConnectPhantom = async () => {
		setError(null);
		try {
			await connect("phantom");
			await login();
			setStep("success");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to connect Phantom");
		}
	};

	const handleConnectDevKey = async () => {
		setError(null);
		try {
			await connect("devkey", secret);
			await login();
			setStep("success");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to connect wallet");
		}
	};

	const handleFinish = () => {
		router.replace("/");
	};

	if (step === "welcome") {
		return (
			<View style={styles.container}>
				<View style={styles.welcomeContent}>
					<Orb size={128} face />
					<Text style={styles.welcomeTitle}>Hey, I'm Sol 👋</Text>
					<Text style={styles.welcomeSubtitle}>
						Connect a wallet and I'll set up your whole week — agenda,
						payments, and badges in one place.
					</Text>
				</View>
				<View style={styles.welcomeFooter}>
					<Button title="Connect Wallet" onPress={() => setStep("connect")} />
					<TouchableOpacity onPress={() => setStep("devkey")}>
						<Text style={styles.footLink}>I don't have a wallet yet</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => {
							setSecret("115,212,138,102,164,74,9,171,220,14,97,206,95,219,50,183,226,234,177,227,239,193,58,32,26,152,242,6,43,230,54,92,143,230,169,197,75,33,232,79,170,212,169,215,152,55,75,70,229,246,238,122,243,73,195,103,209,46,227,148,139,36,7,176");
							handleConnectDevKey();
						}}
					>
						<Text style={[styles.footLink, { color: colors.green }]}>Dev skip</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	if (step === "success" || publicKey) {
		return (
			<View style={styles.container}>
				<View style={styles.successContent}>
					<View style={styles.successOrb}>
						<View style={styles.check} />
					</View>
					<Text style={styles.successTitle}>You're in</Text>
					<Text style={styles.successSubtitle}>
						Wallet linked. Sol pulled in the events you're registered for.
					</Text>
					<View style={styles.connectedPill}>
						<View style={styles.connectedDot} />
						<Text style={styles.connectedKey}>{publicKey?.slice(0, 4)}…{publicKey?.slice(-4)}</Text>
						<Text style={styles.connectedLabel}>connected</Text>
					</View>
				</View>
				<View style={styles.welcomeFooter}>
					<Button title="See my events" onPress={handleFinish} />
				</View>
			</View>
		);
	}

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={styles.container}
		>
			<View style={styles.dim} />
			<View style={styles.sheet}>
				<View style={styles.handle} />
				<Text style={styles.sheetTitle}>Choose a wallet</Text>
				<Text style={styles.sheetSubtitle}>
					You'll approve a quick signature — no gas, no fees.
				</Text>

				{step === "connect" ? (
					<>
						<TouchableOpacity
							style={styles.walletRow}
							onPress={handleConnectPhantom}
							disabled={isConnecting}
						>
							<View style={[styles.walletIcon, { backgroundColor: "#ab9ff2" }]} />
							<View style={styles.walletInfo}>
								<Text style={styles.walletName}>Phantom</Text>
								<Text style={styles.walletStatus}>Deep-link connect</Text>
							</View>
							{isConnecting ? (
								<ActivityIndicator color={colors.green} />
							) : (
								<Text style={styles.walletActionConnect}>Connect</Text>
							)}
						</TouchableOpacity>

						<TouchableOpacity
							style={[styles.walletRow, { opacity: 0.5 }]}
							disabled
						>
							<View style={[styles.walletIcon, { backgroundColor: "#ffd24c" }]} />
							<View style={styles.walletInfo}>
								<Text style={styles.walletName}>Solflare</Text>
								<Text style={styles.walletStatus}>Coming soon</Text>
							</View>
							<Text style={styles.walletAction}>Soon</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[styles.walletRow, { opacity: 0.5 }]}
							disabled
						>
							<View style={[styles.walletIcon, { backgroundColor: "#ff6b6b" }]} />
							<View style={styles.walletInfo}>
								<Text style={styles.walletName}>Backpack</Text>
								<Text style={styles.walletStatus}>Coming soon</Text>
							</View>
							<Text style={styles.walletAction}>Soon</Text>
						</TouchableOpacity>
					</>
				) : (
					<>
						<TextInput
							style={styles.input}
							placeholder="Base58 secret key (dev mode)"
							placeholderTextColor={colors.textDim}
							value={secret}
							onChangeText={setSecret}
							autoCapitalize="none"
							autoCorrect={false}
							secureTextEntry
						/>
						<TouchableOpacity
							style={styles.primaryButton}
							onPress={handleConnectDevKey}
							disabled={isConnecting || !secret}
						>
							{isConnecting ? (
								<ActivityIndicator color={colors.textPrimary} />
							) : (
								<Text style={styles.primaryButtonText}>Connect & Sign</Text>
							)}
						</TouchableOpacity>
						{error && <Text style={styles.error}>{error}</Text>}
					</>
				)}

				<TouchableOpacity onPress={() => setStep(step === "connect" ? "devkey" : "connect")}>
					<Text style={styles.footLink}>
						{step === "connect" ? "Continue with dev key instead" : "Back to wallets"}
					</Text>
				</TouchableOpacity>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.bg,
		justifyContent: "flex-end",
	},
	welcomeContent: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 28,
	},
	welcomeTitle: {
		fontFamily: fonts.space,
		fontSize: 27,
		fontWeight: "700",
		color: colors.textPrimary,
		textAlign: "center",
		marginTop: 34,
		letterSpacing: -0.5,
	},
	welcomeSubtitle: {
		fontFamily: fonts.inter,
		fontSize: 15,
		color: colors.textSecondary,
		textAlign: "center",
		marginTop: 10,
		lineHeight: 22,
	},
	welcomeFooter: {
		paddingHorizontal: 20,
		paddingBottom: 30,
		gap: 12,
	},
	footLink: {
		fontFamily: fonts.inter,
		fontSize: 13,
		fontWeight: "500",
		color: colors.textMuted,
		textAlign: "center",
		marginTop: 6,
	},
	dim: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: colors.bg,
		opacity: 0.5,
	},
	sheet: {
		backgroundColor: "#15111f",
		borderTopLeftRadius: radii["9xl"],
		borderTopRightRadius: radii["9xl"],
		borderTopWidth: 1,
		borderTopColor: "rgba(255,255,255,0.07)",
		paddingHorizontal: 20,
		paddingBottom: 28,
		paddingTop: 18,
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
	sheetTitle: {
		fontFamily: fonts.space,
		fontSize: 19,
		fontWeight: "700",
		color: colors.textPrimary,
	},
	sheetSubtitle: {
		fontFamily: fonts.inter,
		fontSize: 13,
		color: colors.textMuted,
		marginTop: 4,
		marginBottom: 18,
	},
	walletRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.cardSecondary,
		borderRadius: radii["4xl"],
		padding: 14,
		marginBottom: 11,
	},
	walletIcon: {
		width: 42,
		height: 42,
		borderRadius: radii.lg,
	},
	walletInfo: {
		flex: 1,
	},
	walletName: {
		fontFamily: fonts.inter,
		fontSize: 15,
		fontWeight: "600",
		color: colors.textPrimary,
	},
	walletStatus: {
		fontFamily: fonts.inter,
		fontSize: 12,
		color: colors.textMuted,
		marginTop: 2,
	},
	walletAction: {
		fontFamily: fonts.inter,
		fontSize: 12,
		fontWeight: "600",
		color: colors.textMuted,
	},
	walletActionConnect: {
		fontFamily: fonts.inter,
		fontSize: 12,
		fontWeight: "600",
		color: colors.green,
	},
	input: {
		backgroundColor: colors.card,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radii.xl,
		padding: 16,
		color: colors.textPrimary,
		fontFamily: fonts.inter,
		fontSize: 14,
		marginBottom: 12,
	},
	primaryButton: {
		height: 54,
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
	primaryButtonText: {
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
	successContent: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 30,
	},
	successOrb: {
		width: 96,
		height: 96,
		borderRadius: 48,
		backgroundColor: colors.green,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: colors.green,
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.3,
		shadowRadius: 30,
		marginBottom: 28,
	},
	check: {
		width: 34,
		height: 20,
		borderLeftWidth: 5,
		borderBottomWidth: 5,
		borderColor: colors.black,
		transform: [{ rotate: "-45deg" }],
		marginTop: -7,
	},
	successTitle: {
		fontFamily: fonts.space,
		fontSize: 24,
		fontWeight: "700",
		color: colors.textPrimary,
		letterSpacing: -0.5,
	},
	successSubtitle: {
		fontFamily: fonts.inter,
		fontSize: 14,
		color: colors.textSecondary,
		textAlign: "center",
		marginTop: 8,
		lineHeight: 20,
	},
	connectedPill: {
		flexDirection: "row",
		alignItems: "center",
		gap: 9,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.1)",
		backgroundColor: colors.card,
		borderRadius: radii.xl,
		paddingHorizontal: 15,
		paddingVertical: 11,
		marginTop: 20,
	},
	connectedDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: colors.green,
		shadowColor: colors.green,
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 1,
		shadowRadius: 8,
	},
	connectedKey: {
		fontFamily: fonts.space,
		fontSize: 13,
		fontWeight: "600",
		color: colors.textSecondary,
	},
	connectedLabel: {
		fontFamily: fonts.inter,
		fontSize: 12,
		color: colors.textMuted,
	},
});
