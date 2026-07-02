import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useWallet } from "../lib/wallet";
import { colors, fonts, radii, spacing } from "./theme";

export default function SuccessScreen() {
	const router = useRouter();
	const { type, amount, signature, vendor } = useLocalSearchParams<{
		type?: string;
		amount?: string;
		signature?: string;
		vendor?: string;
	}>();
	const { publicKey } = useWallet();

	const isPayment = type === "payment";
	const title = isPayment ? `Paid ${amount || "0"} BRK` : `Added ${amount || "0"} BRK`;
	const subtitle = isPayment
		? "Finalized in 0.4s · fee < $0.001"
		: "Ready to spend at any vendor";

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<View style={styles.orb}>
					<View style={styles.check} />
				</View>
				<Text style={styles.title}>{title}</Text>
				<Text style={styles.subtitle}>{subtitle}</Text>

				{isPayment && (
					<View style={styles.poapCard}>
						<View style={styles.poapAvatar} />
						<View>
							<Text style={styles.poapTitle}>POAP unlocked!</Text>
							<Text style={styles.poapSubtitle}>Tap to view your new badge</Text>
						</View>
					</View>
				)}
			</View>

			<View style={styles.footer}>
				{signature && (
					<TouchableOpacity
						onPress={() =>
							Linking.openURL(`https://solscan.io/tx/${signature}?cluster=devnet`)
						}
						style={styles.link}
					>
						<Text style={styles.linkText}>View on Solscan ↗</Text>
					</TouchableOpacity>
				)}
				<TouchableOpacity
					style={styles.button}
					onPress={() => router.replace("/")}
				>
					<Text style={styles.buttonText}>Back to events</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.bg,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 30,
	},
	content: {
		alignItems: "center",
	},
	orb: {
		width: 104,
		height: 104,
		borderRadius: 52,
		backgroundColor: colors.green,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: colors.green,
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.3,
		shadowRadius: 40,
		marginBottom: 28,
	},
	check: {
		width: 38,
		height: 22,
		borderLeftWidth: 5,
		borderBottomWidth: 5,
		borderColor: colors.black,
		transform: [{ rotate: "-45deg" }],
		marginTop: -8,
	},
	title: {
		fontFamily: fonts.space,
		fontSize: 26,
		fontWeight: "700",
		color: colors.textPrimary,
		letterSpacing: -0.5,
	},
	subtitle: {
		fontFamily: fonts.inter,
		fontSize: 13,
		color: "#9fe8c6",
		marginTop: 8,
	},
	poapCard: {
		flexDirection: "row",
		alignItems: "center",
		gap: 11,
		borderWidth: 1,
		borderColor: "rgba(20,241,149,0.4)",
		backgroundColor: "rgba(20,241,149,0.07)",
		borderRadius: radii.xl,
		paddingHorizontal: 16,
		paddingVertical: 13,
		marginTop: 22,
	},
	poapAvatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: colors.purple,
		borderWidth: 2,
		borderColor: "rgba(255,255,255,0.3)",
	},
	poapTitle: {
		fontFamily: fonts.inter,
		fontSize: 13,
		fontWeight: "600",
		color: colors.textPrimary,
	},
	poapSubtitle: {
		fontFamily: fonts.inter,
		fontSize: 11,
		color: "#9fe8c6",
		marginTop: 2,
	},
	footer: {
		position: "absolute",
		left: 20,
		right: 20,
		bottom: 30,
		alignItems: "center",
		gap: 16,
	},
	link: {
		padding: 8,
	},
	linkText: {
		fontFamily: fonts.inter,
		fontSize: 12,
		fontWeight: "500",
		color: "#6f8a7e",
	},
	button: {
		width: "100%",
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
	buttonText: {
		fontFamily: fonts.inter,
		fontSize: 15,
		fontWeight: "600",
		color: colors.textPrimary,
	},
});
