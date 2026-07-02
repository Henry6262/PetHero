import { useEffect, useState, useCallback } from "react";
import {
	View,
	Text,
	ScrollView,
	StyleSheet,
	RefreshControl,
	TouchableOpacity,
	ActivityIndicator,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWallet } from "../../lib/wallet";
import { useEvent } from "../../lib/event";
import { getEvents } from "../../lib/api";
import { EventCard, CompactEventCard } from "../../components/Card";
import { useTabBarOffset } from "../../components/useTabBarOffset";
import { colors, fonts, spacing } from "../theme";
import type { Event } from "../../types";

const fallbackEvents: Event[] = [
	{
		id: "breakpoint",
		name: "Solana Breakpoint",
		description: "The annual Solana ecosystem conference.",
		startAt: "2026-06-18T09:00:00Z",
		endAt: "2026-06-20T18:00:00Z",
		location: "Funkhaus · Berlin",
		tokenBalance: "120",
		tokenSymbol: "BRK",
	},
	{
		id: "superteam",
		name: "Superteam Side Event",
		startAt: "2026-06-19T19:00:00Z",
		endAt: "2026-06-19T23:00:00Z",
		location: "Kreuzberg",
		tokenBalance: "0",
		tokenSymbol: "BRK",
	},
	{
		id: "w3hub",
		name: "W3 Hub Mixer",
		startAt: "2026-06-20T20:00:00Z",
		endAt: "2026-06-20T23:00:00Z",
		location: "Mitte",
		tokenBalance: "0",
		tokenSymbol: "BRK",
	},
];

export default function EventsScreen() {
	if (__DEV__) return <Redirect href="/sol" />;
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const tabBarOffset = useTabBarOffset();
	const { token, user } = useWallet();
	const { setSelectedEvent } = useEvent();
	const [events, setEvents] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		if (!token) return;
		try {
			const res = await getEvents(token);
			setEvents(res.events.length ? res.events : fallbackEvents);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load events");
			setEvents(fallbackEvents);
		}
	}, [token]);

	useEffect(() => {
		load().finally(() => setLoading(false));
	}, [load]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await load();
		setRefreshing(false);
	}, [load]);

	const openEvent = (event: Event) => {
		setSelectedEvent(event);
		router.push(`/event/${event.id}`);
	};

	const featured = events[0];
	const others = events.slice(1);

	if (loading) {
		return (
			<View style={[styles.container, { paddingTop: insets.top + 60, alignItems: "center" }]}>
				<ActivityIndicator color={colors.green} />
			</View>
		);
	}

	return (
		<View style={[styles.container, { paddingTop: insets.top + 8 }]}>
			<View style={styles.header}>
				<View>
					<Text style={styles.greeting}>Welcome back</Text>
					<Text style={styles.city}>Berlin 2026</Text>
				</View>
				<View style={styles.walletPill}>
					<View style={styles.walletDot} />
					<Text style={styles.walletKey}>
						{user?.publicKey.slice(0, 4)}…{user?.publicKey.slice(-4)}
					</Text>
				</View>
			</View>

			<ScrollView
				contentContainerStyle={[styles.scroll, { paddingBottom: tabBarOffset + 20 }]}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />
				}
			>
				{featured && (
					<EventCard
						title={featured.name}
						subtitle={`${featured.location || "TBA"} · ${new Date(featured.startAt).toLocaleDateString(undefined, {
							month: "short",
							day: "numeric",
						})}–${new Date(featured.endAt).toLocaleDateString(undefined, {
							month: "short",
							day: "numeric",
						})}`}
						badge={`${featured.tokenBalance || 0} ${featured.tokenSymbol || "BRK"}`}
						badgeColor="green"
						gradient="purple"
						live
						onPress={() => openEvent(featured)}
					/>
				)}

				{others.map((event, i) => (
					<CompactEventCard
						key={event.id}
						title={event.name}
						subtitle={`${new Date(event.startAt).toLocaleDateString(undefined, {
							weekday: "short",
						})} · ${new Date(event.startAt).toLocaleTimeString(undefined, {
							hour: "2-digit",
							minute: "2-digit",
						})} · ${event.location || "TBA"}`}
						badge={`${event.tokenBalance || 0} ${event.tokenSymbol || "BRK"}`}
						gradient={i % 2 === 0 ? "green" : "orange"}
						onPress={() => openEvent(event)}
					/>
				))}

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
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 18,
		paddingTop: 8,
	},
	greeting: {
		fontFamily: fonts.inter,
		fontSize: 13,
		color: colors.textMuted,
	},
	city: {
		fontFamily: fonts.space,
		fontSize: 22,
		fontWeight: "700",
		color: colors.textPrimary,
		letterSpacing: -0.5,
	},
	walletPill: {
		flexDirection: "row",
		alignItems: "center",
		gap: 7,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.12)",
		borderRadius: 20,
		paddingHorizontal: 11,
		paddingVertical: 6,
	},
	walletDot: {
		width: 7,
		height: 7,
		borderRadius: 4,
		backgroundColor: colors.green,
	},
	walletKey: {
		fontFamily: fonts.space,
		fontSize: 11,
		fontWeight: "600",
		color: colors.textSecondary,
	},
	scroll: {
		paddingBottom: 0,
		paddingTop: 6,
	},
	error: {
		fontFamily: fonts.inter,
		fontSize: 13,
		color: colors.live,
		marginTop: 12,
	},
});
