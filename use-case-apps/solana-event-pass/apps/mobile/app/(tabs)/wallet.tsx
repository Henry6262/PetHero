import { useEffect, useState, useCallback } from "react";
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
	RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWallet } from "../../lib/wallet";
import { useEvent } from "../../lib/event";
import { getWallet, getWalletHistory } from "../../lib/api";
import { Button } from "../../components/Button";
import { useTabBarOffset } from "../../components/useTabBarOffset";
import { colors, fonts, radii, spacing } from "../theme";
import type { EventWallet, HistoryItem } from "../../types";

const mockHistory: HistoryItem[] = [
	{
		id: "h1",
		type: "payment",
		amount: "12",
		status: "finalized",
		createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
		terminalId: "Brezel Bar",
	},
	{
		id: "h2",
		type: "topup",
		amount: "50",
		status: "finalized",
		createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
		paymentMethod: "USDC",
	},
];

export default function WalletScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const tabBarOffset = useTabBarOffset();
	const { token } = useWallet();
	const { selectedEvent } = useEvent();
	const [wallet, setWallet] = useState<EventWallet | null>(null);
	const [history, setHistory] = useState<HistoryItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const eventId = selectedEvent?.id;

	const load = useCallback(async () => {
		if (!token || !eventId) {
			setLoading(false);
			return;
		}
		try {
			const [walletRes, historyRes] = await Promise.all([
				getWallet(token, eventId),
				getWalletHistory(token, eventId),
			]);
			setWallet(walletRes.wallet);
			setHistory(historyRes.history.length ? historyRes.history : mockHistory);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load wallet");
			setHistory(mockHistory);
		}
	}, [token, eventId]);

	useEffect(() => {
		load().finally(() => setLoading(false));
	}, [load]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await load();
		setRefreshing(false);
	}, [load]);

	const formatTime = (iso: string) => {
		const d = new Date(iso);
		return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
	};

	if (loading) {
		return (
			<View style={[styles.container, { paddingTop: insets.top + 60, alignItems: "center" }]}>
				<ActivityIndicator color={colors.green} />
			</View>
		);
	}

	if (!selectedEvent) {
		return (
			<View style={[styles.container, { paddingTop: insets.top + 60, alignItems: "center" }]}>
				<Text style={styles.emptyTitle}>No event selected</Text>
				<Text style={styles.emptySubtitle}>Pick an event from the home tab first.</Text>
				<TouchableOpacity onPress={() => router.push("/")}>
					<Text style={styles.emptyLink}>View events →</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<View style={[styles.container, { paddingTop: insets.top + 16 }]}>
			<Text style={styles.title}>Wallet</Text>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={[styles.scroll, { paddingBottom: tabBarOffset + 20 }]}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />
				}
			>
				<View style={styles.balanceCard}>
					<View style={styles.glow} />
					<Text style={styles.balanceLabel}>
						{selectedEvent.tokenSymbol?.toUpperCase() || "EVENT"} BALANCE
					</Text>
					<Text style={styles.balanceValue}>
						{wallet?.balance || "0"}{" "}
						<Text style={styles.balanceSymbol}>{wallet?.tokenSymbol || "BRK"}</Text>
					</Text>
					<Text style={styles.balanceUsd}>
						≈ ${wallet?.balance || "0.00"} · 1 {wallet?.tokenSymbol || "BRK"} = $1 USDC
					</Text>
				</View>

				<View style={styles.actionRow}>
					<Button
						title="Top Up"
						variant="green"
						style={styles.actionButton}
						onPress={() => router.push("/topup")}
					/>
					<Button
						title="Pay"
						variant="secondary"
						style={styles.actionButton}
						onPress={() => router.push("/pay")}
					/>
				</View>

				<Text style={styles.sectionTitle}>RECENT</Text>

				{history.map((item) => {
					const isPayment = item.type === "payment";
					const emoji = isPayment ? "🥨" : "⬆";
					const label = isPayment
						? item.terminalId || "Vendor"
						: `Top up · ${item.paymentMethod || "USDC"}`;
					return (
						<View key={item.id} style={styles.historyRow}>
							<View style={styles.historyIcon}>
								<Text style={styles.historyEmoji}>{emoji}</Text>
							</View>
							<View style={styles.historyBody}>
								<Text style={styles.historyLabel}>{label}</Text>
								<Text style={styles.historyMeta}>
									{formatTime(item.createdAt)} · {item.status}
								</Text>
							</View>
							<Text style={[styles.historyAmount, isPayment ? styles.negative : styles.positive]}>
								{isPayment ? "-" : "+"}
								{item.amount}
							</Text>
						</View>
					);
				})}

				{error && <Text style={styles.error}>{error}</Text>}
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
	title: {
		fontFamily: fonts.space,
		fontSize: 20,
		fontWeight: "700",
		color: colors.textPrimary,
		letterSpacing: -0.5,
		marginBottom: 14,
	},
	scroll: {
		paddingBottom: 0,
	},
	balanceCard: {
		borderRadius: radii["5xl"],
		padding: 20,
		backgroundColor: colors.purple,
		overflow: "hidden",
		marginBottom: 14,
	},
	glow: {
		position: "absolute",
		top: -30,
		right: -20,
		width: 140,
		height: 140,
		borderRadius: 70,
		backgroundColor: "rgba(20,241,149,0.35)",
	},
	balanceLabel: {
		fontFamily: fonts.inter,
		fontSize: 11,
		fontWeight: "600",
		color: "rgba(255,255,255,0.7)",
		letterSpacing: 0.5,
	},
	balanceValue: {
		fontFamily: fonts.space,
		fontSize: 40,
		fontWeight: "700",
		color: colors.textPrimary,
		marginTop: 6,
		letterSpacing: -1,
	},
	balanceSymbol: {
		fontSize: 18,
		opacity: 0.8,
	},
	balanceUsd: {
		fontFamily: fonts.inter,
		fontSize: 13,
		color: "rgba(255,255,255,0.75)",
		marginTop: 2,
	},
	actionRow: {
		flexDirection: "row",
		gap: 11,
		marginBottom: 22,
	},
	actionButton: {
		flex: 1,
		height: 48,
		borderRadius: radii.xl,
	},
	sectionTitle: {
		fontFamily: fonts.space,
		fontSize: 12,
		fontWeight: "600",
		color: colors.textMuted,
		letterSpacing: 0.5,
		marginBottom: 12,
	},
	historyRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		marginBottom: 14,
	},
	historyIcon: {
		width: 38,
		height: 38,
		borderRadius: radii.sm,
		backgroundColor: colors.cardSecondary,
		alignItems: "center",
		justifyContent: "center",
	},
	historyEmoji: {
		fontSize: 15,
	},
	historyBody: {
		flex: 1,
	},
	historyLabel: {
		fontFamily: fonts.inter,
		fontSize: 13,
		fontWeight: "600",
		color: colors.textPrimary,
	},
	historyMeta: {
		fontFamily: fonts.inter,
		fontSize: 11,
		color: colors.textMuted,
		marginTop: 2,
	},
	historyAmount: {
		fontFamily: fonts.space,
		fontSize: 14,
		fontWeight: "700",
	},
	positive: {
		color: colors.green,
	},
	negative: {
		color: colors.textPrimary,
	},
	emptyTitle: {
		fontFamily: fonts.space,
		fontSize: 18,
		fontWeight: "700",
		color: colors.textPrimary,
	},
	emptySubtitle: {
		fontFamily: fonts.inter,
		fontSize: 13,
		color: colors.textMuted,
		marginTop: 6,
	},
	emptyLink: {
		fontFamily: fonts.inter,
		fontSize: 13,
		fontWeight: "600",
		color: colors.purple,
		marginTop: 16,
	},
	error: {
		fontFamily: fonts.inter,
		fontSize: 13,
		color: colors.live,
		marginTop: 12,
	},
});
