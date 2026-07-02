import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radii, spacing } from "../theme";

const nowEvent = {
	title: "DeFi Builders Mixer",
	meta: "Now · Hall C · 320m away",
	going: 62,
};

const later = [
	{ day: "19", month: "JUN", title: "Superteam After-Hours", meta: "19:00 · Kreuzberg · free", color: colors.purple },
	{ day: "20", month: "JUN", title: "W3 Hub Closing Party", meta: "22:00 · Mitte · pass only", color: colors.orange },
];

export default function SideEventsScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();

	return (
		<View style={[styles.container, { paddingTop: insets.top + 16 }]}>
			<View style={styles.header}>
				<Text style={styles.title}>Side events</Text>
				<Text style={styles.subtitle}>Auto-invited as a main-event attendee</Text>
			</View>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.scroll}
			>
				<View style={styles.nowTag}>
					<View style={styles.nowDot} />
					<Text style={styles.nowTagText}>HAPPENING NOW</Text>
				</View>

				<TouchableOpacity style={styles.nowCard}>
					<View style={styles.nowHero}>
						<View style={styles.goingBadge}>
							<Text style={styles.goingText}>{nowEvent.going} going</Text>
						</View>
					</View>
					<View style={styles.nowBody}>
						<Text style={styles.nowTitle}>{nowEvent.title}</Text>
						<Text style={styles.nowMeta}>{nowEvent.meta}</Text>
					</View>
				</TouchableOpacity>

				<Text style={styles.laterTitle}>LATER TODAY</Text>

				{later.map((item) => (
					<View key={item.title} style={styles.laterRow}>
						<View style={[styles.dateBox, { backgroundColor: item.color }]}>
							<Text style={styles.dateDay}>{item.day}</Text>
							<Text style={styles.dateMonth}>{item.month}</Text>
						</View>
						<View style={styles.laterBody}>
							<Text style={styles.laterRowTitle}>{item.title}</Text>
							<Text style={styles.laterRowMeta}>{item.meta}</Text>
						</View>
						<TouchableOpacity style={styles.rsvpButton}>
							<Text style={styles.rsvpText}>RSVP</Text>
						</TouchableOpacity>
					</View>
				))}
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
		marginBottom: 18,
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
		marginTop: 2,
	},
	scroll: {
		paddingBottom: 100,
	},
	nowTag: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginBottom: 11,
	},
	nowDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: colors.green,
		shadowColor: colors.green,
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 1,
		shadowRadius: 8,
	},
	nowTagText: {
		fontFamily: fonts.space,
		fontSize: 11,
		fontWeight: "600",
		color: colors.green,
		letterSpacing: 0.5,
	},
	nowCard: {
		borderRadius: radii["4xl"],
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "rgba(20,241,149,0.3)",
		marginBottom: 20,
	},
	nowHero: {
		height: 96,
		backgroundColor: colors.green,
		padding: 10,
		alignItems: "flex-end",
	},
	goingBadge: {
		backgroundColor: "rgba(0,0,0,0.3)",
		borderRadius: radii.full,
		paddingHorizontal: 10,
		paddingVertical: 4,
	},
	goingText: {
		fontFamily: fonts.inter,
		fontSize: 10,
		fontWeight: "700",
		color: colors.textPrimary,
	},
	nowBody: {
		backgroundColor: colors.card,
		padding: 12,
		paddingHorizontal: 13,
	},
	nowTitle: {
		fontFamily: fonts.space,
		fontSize: 15,
		fontWeight: "700",
		color: colors.textPrimary,
	},
	nowMeta: {
		fontFamily: fonts.inter,
		fontSize: 11,
		color: colors.textMuted,
		marginTop: 3,
	},
	laterTitle: {
		fontFamily: fonts.space,
		fontSize: 11,
		fontWeight: "600",
		color: colors.textMuted,
		letterSpacing: 0.5,
		marginTop: 6,
		marginBottom: 11,
	},
	laterRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.card,
		borderRadius: radii.xl,
		padding: 11,
		marginBottom: 11,
	},
	dateBox: {
		width: 50,
		height: 50,
		borderRadius: radii.lg,
		alignItems: "center",
		justifyContent: "center",
	},
	dateDay: {
		fontFamily: fonts.space,
		fontSize: 15,
		fontWeight: "700",
		color: colors.textPrimary,
		lineHeight: 17,
	},
	dateMonth: {
		fontFamily: fonts.inter,
		fontSize: 8,
		fontWeight: "600",
		color: "rgba(255,255,255,0.7)",
		marginTop: 1,
	},
	laterBody: {
		flex: 1,
	},
	laterRowTitle: {
		fontFamily: fonts.space,
		fontSize: 14,
		fontWeight: "700",
		color: colors.textPrimary,
	},
	laterRowMeta: {
		fontFamily: fonts.inter,
		fontSize: 10,
		color: colors.textMuted,
		marginTop: 2,
	},
	rsvpButton: {
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.16)",
		borderRadius: 11,
		paddingHorizontal: 11,
		paddingVertical: 6,
	},
	rsvpText: {
		fontFamily: fonts.inter,
		fontSize: 10,
		fontWeight: "600",
		color: colors.textSecondary,
	},
});
