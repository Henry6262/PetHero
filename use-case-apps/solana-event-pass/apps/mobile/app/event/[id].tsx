import { useEffect, useState, useCallback } from "react";
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWallet } from "../../lib/wallet";
import { useEvent } from "../../lib/event";
import { getEvent } from "../../lib/api";
import { colors, fonts, radii, spacing } from "../theme";
import type { Event } from "../../types";

const tabs = ["Agenda", "Wallet", "POAPs"];
const days = ["Day 2", "Day 3"];

const agenda = [
	{ time: "10:00", title: "Scaling Solana to a billion users", meta: "Main Stage · Anatoly Y.", checked: true },
	{ time: "11:30", title: "Solana Pay in the real world", meta: "Stage B · Panel", checked: false },
	{ time: "14:00", title: "Workshop: mint your first cNFT", meta: "Lab · Hands-on", checked: false },
];

export default function EventDetailScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const insets = useSafeAreaInsets();
	const { token } = useWallet();
	const { selectedEvent, setSelectedEvent } = useEvent();
	const [event, setEvent] = useState<Event | null>(selectedEvent);
	const [activeTab, setActiveTab] = useState("Agenda");
	const [activeDay, setActiveDay] = useState("Day 2");
	const [loading, setLoading] = useState(!selectedEvent);

	const load = useCallback(async () => {
		if (!token || !id) return;
		try {
			const res = await getEvent(token, id);
			setEvent(res.event);
			setSelectedEvent(res.event);
		} finally {
			setLoading(false);
		}
	}, [token, id, setSelectedEvent]);

	useEffect(() => {
		if (!selectedEvent || selectedEvent.id !== id) {
			load();
		}
	}, [selectedEvent, id, load]);

	const handleTabChange = (tab: string) => {
		if (tab === "Wallet") {
			router.push("/wallet");
		} else if (tab === "POAPs") {
			router.push("/poaps");
		} else {
			setActiveTab(tab);
		}
	};

	if (loading || !event) {
		return (
			<View style={[styles.container, { paddingTop: insets.top + 60, alignItems: "center" }]}>
				<ActivityIndicator color={colors.green} />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={[styles.hero, { paddingTop: insets.top + 12, height: 268 + insets.top }]}>
				<TouchableOpacity style={styles.back} onPress={() => router.back()}>
					<View style={styles.backArrow} />
				</TouchableOpacity>
				<View style={styles.heroContent}>
					<View style={styles.liveBadge}>
						<View style={styles.liveDot} />
						<Text style={styles.liveText}>LIVE · DAY 2</Text>
					</View>
					<Text style={styles.heroTitle}>{event.name}</Text>
					<Text style={styles.heroMeta}>{event.location || "Berlin"}</Text>
				</View>
			</View>

			<View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
				<View style={styles.tabRow}>
					{tabs.map((tab) => (
						<TouchableOpacity
							key={tab}
							style={[styles.tab, activeTab === tab && styles.tabActive]}
							onPress={() => handleTabChange(tab)}
						>
							<Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
								{tab}
							</Text>
						</TouchableOpacity>
					))}
				</View>

				<View style={styles.dayRow}>
					{days.map((day) => (
						<TouchableOpacity
							key={day}
							style={[styles.dayPill, activeDay === day && styles.dayPillActive]}
							onPress={() => setActiveDay(day)}
						>
							<Text style={[styles.dayText, activeDay === day && styles.dayTextActive]}>
								{day}
							</Text>
						</TouchableOpacity>
					))}
				</View>

				<ScrollView showsVerticalScrollIndicator={false}>
					{agenda.map((item) => (
						<View key={item.time} style={styles.agendaRow}>
							<Text style={styles.agendaTime}>{item.time}</Text>
							<View style={styles.agendaLine} />
							<View style={styles.agendaBody}>
								<Text style={styles.agendaTitle}>{item.title}</Text>
								<Text style={styles.agendaMeta}>{item.meta}</Text>
							</View>
							<View
								style={[
									styles.checkBox,
									item.checked && styles.checkBoxActive,
								]}
							>
								{item.checked && <View style={styles.checkMark} />}
							</View>
						</View>
					))}
				</ScrollView>
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
		backgroundColor: colors.purple,
		paddingHorizontal: 18,
		justifyContent: "space-between",
	},
	back: {
		width: 34,
		height: 34,
		borderRadius: 17,
		backgroundColor: "rgba(0,0,0,0.3)",
		alignItems: "center",
		justifyContent: "center",
		marginTop: 8,
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
		marginBottom: 48,
	},
	liveBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		backgroundColor: "rgba(0,0,0,0.3)",
		borderRadius: radii.full,
		paddingHorizontal: 11,
		paddingVertical: 5,
		alignSelf: "flex-start",
		marginBottom: 9,
	},
	liveDot: {
		width: 7,
		height: 7,
		borderRadius: 4,
		backgroundColor: colors.live,
	},
	liveText: {
		fontFamily: fonts.inter,
		fontSize: 10,
		fontWeight: "700",
		color: colors.textPrimary,
		letterSpacing: 0.5,
	},
	heroTitle: {
		fontFamily: fonts.space,
		fontSize: 23,
		fontWeight: "700",
		color: colors.textPrimary,
		letterSpacing: -0.5,
	},
	heroMeta: {
		fontFamily: fonts.inter,
		fontSize: 13,
		color: "rgba(255,255,255,0.8)",
		marginTop: 3,
	},
	sheet: {
		flex: 1,
		backgroundColor: colors.bg,
		borderTopLeftRadius: radii["8xl"],
		borderTopRightRadius: radii["8xl"],
		marginTop: -20,
		paddingHorizontal: 18,
		paddingTop: 16,
	},
	tabRow: {
		flexDirection: "row",
		backgroundColor: colors.card,
		borderRadius: radii.lg,
		padding: 4,
		marginBottom: 15,
	},
	tab: {
		flex: 1,
		paddingVertical: 9,
		borderRadius: radii.md,
		alignItems: "center",
	},
	tabActive: {
		backgroundColor: colors.purple,
	},
	tabText: {
		fontFamily: fonts.inter,
		fontSize: 12,
		fontWeight: "600",
		color: colors.textMuted,
	},
	tabTextActive: {
		color: colors.textPrimary,
	},
	dayRow: {
		flexDirection: "row",
		gap: 8,
		marginBottom: 14,
	},
	dayPill: {
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.1)",
		borderRadius: radii.full,
		paddingHorizontal: 14,
		paddingVertical: 6,
	},
	dayPillActive: {
		borderColor: colors.purple,
		backgroundColor: colors.cardSecondary,
	},
	dayText: {
		fontFamily: fonts.space,
		fontSize: 11,
		fontWeight: "600",
		color: colors.textMuted,
	},
	dayTextActive: {
		color: colors.textPrimary,
	},
	agendaRow: {
		flexDirection: "row",
		gap: 13,
		marginBottom: 14,
		alignItems: "flex-start",
	},
	agendaTime: {
		fontFamily: fonts.space,
		fontSize: 12,
		fontWeight: "700",
		color: colors.purple,
		paddingTop: 2,
		width: 38,
	},
	agendaLine: {
		width: 2,
		backgroundColor: "rgba(255,255,255,0.08)",
		alignSelf: "stretch",
	},
	agendaBody: {
		flex: 1,
		paddingLeft: 13,
	},
	agendaTitle: {
		fontFamily: fonts.inter,
		fontSize: 14,
		fontWeight: "600",
		color: colors.textPrimary,
	},
	agendaMeta: {
		fontFamily: fonts.inter,
		fontSize: 11,
		color: colors.textMuted,
		marginTop: 3,
	},
	checkBox: {
		width: 26,
		height: 26,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.14)",
		alignItems: "center",
		justifyContent: "center",
		marginTop: 2,
	},
	checkBoxActive: {
		backgroundColor: colors.purple,
		borderColor: colors.purple,
	},
	checkMark: {
		width: 9,
		height: 9,
		borderWidth: 2,
		borderColor: colors.textPrimary,
		borderRadius: 2,
	},
});
