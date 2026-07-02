import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radii, spacing } from "../theme";

const categories = [
	{ emoji: "🎤", title: "Stages", meta: "6 live now", color: colors.purple },
	{ emoji: "🍜", title: "Food & Drink", meta: "pay with BRK", color: colors.green },
	{ emoji: "🛍️", title: "Partner Shops", meta: "offers inside", color: "default" },
	{ emoji: "🎉", title: "Side Events", meta: "you're invited", color: "default" },
];

export default function ExploreScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();

	return (
		<View style={[styles.container, { paddingTop: insets.top + 16 }]}>
			<View style={styles.header}>
				<Text style={styles.title}>Explore</Text>
				<Text style={styles.subtitle}>Berlin · around Funkhaus</Text>
			</View>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.scroll}
			>
				<View style={styles.grid}>
					{categories.map((cat) => (
						<TouchableOpacity
							key={cat.title}
							style={[
								styles.category,
								cat.color !== "default" && {
									backgroundColor:
										cat.color === colors.purple
											? "rgba(153,69,255,0.12)"
											: "rgba(20,241,149,0.1)",
									borderColor:
										cat.color === colors.purple
											? "rgba(153,69,255,0.3)"
											: "rgba(20,241,149,0.3)",
								},
							]}
							onPress={() => {
								if (cat.title === "Partner Shops") router.push("/explore/partner");
								if (cat.title === "Side Events") router.push("/explore/side-events");
							}}
						>
							<Text style={styles.categoryEmoji}>{cat.emoji}</Text>
							<Text style={styles.categoryTitle}>{cat.title}</Text>
							<Text
								style={[
									styles.categoryMeta,
									cat.color === colors.green && styles.categoryMetaGreen,
								]}
							>
								{cat.meta}
							</Text>
						</TouchableOpacity>
					))}
				</View>

				<TouchableOpacity
					style={styles.banner}
					onPress={() => router.push("/explore/side-events")}
				>
					<View style={styles.bannerGlow} />
					<View style={styles.bannerTag}>
						<View style={styles.bannerDot} />
						<Text style={styles.bannerTagText}>AUTO-INVITED · MAIN EVENT PERK</Text>
					</View>
					<Text style={styles.bannerTitle}>Superteam After-Hours</Text>
					<Text style={styles.bannerSubtitle}>
						Tonight 19:00 · Kreuzberg · free entry with your pass
					</Text>
				</TouchableOpacity>

				<Text style={styles.sectionTitle}>RECOMMENDED FOR YOU</Text>
				<TouchableOpacity
					style={styles.recommendRow}
					onPress={() => router.push("/explore/partner")}
				>
					<View style={styles.recommendThumb} />
					<View style={styles.recommendBody}>
						<Text style={styles.recommendTitle}>Sunrise Coffee Cart</Text>
						<Text style={styles.recommendMeta}>120m · open · pays BRK</Text>
					</View>
					<View style={styles.discountBadge}>
						<Text style={styles.discountText}>-15%</Text>
					</View>
				</TouchableOpacity>
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
		marginBottom: 16,
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
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 11,
	},
	category: {
		width: "47%",
		borderRadius: radii.xl,
		padding: 13,
		backgroundColor: colors.card,
		borderWidth: 1,
		borderColor: colors.border,
	},
	categoryEmoji: {
		fontSize: 20,
	},
	categoryTitle: {
		fontFamily: fonts.inter,
		fontSize: 13,
		fontWeight: "600",
		color: colors.textPrimary,
		marginTop: 8,
	},
	categoryMeta: {
		fontFamily: fonts.inter,
		fontSize: 10,
		color: colors.textMuted,
		marginTop: 2,
	},
	categoryMetaGreen: {
		color: colors.green,
	},
	banner: {
		borderRadius: radii.xl,
		padding: 13,
		backgroundColor: colors.purple,
		marginTop: 14,
		overflow: "hidden",
		position: "relative",
	},
	bannerGlow: {
		position: "absolute",
		top: -20,
		right: -10,
		width: 90,
		height: 90,
		borderRadius: 45,
		backgroundColor: "rgba(20,241,149,0.4)",
	},
	bannerTag: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginBottom: 6,
	},
	bannerDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: colors.green,
	},
	bannerTagText: {
		fontFamily: fonts.inter,
		fontSize: 9,
		fontWeight: "700",
		color: "#d9ffee",
		letterSpacing: 0.5,
	},
	bannerTitle: {
		fontFamily: fonts.space,
		fontSize: 15,
		fontWeight: "700",
		color: colors.textPrimary,
		marginTop: 6,
	},
	bannerSubtitle: {
		fontFamily: fonts.inter,
		fontSize: 11,
		color: "rgba(255,255,255,0.8)",
		marginTop: 2,
	},
	sectionTitle: {
		fontFamily: fonts.space,
		fontSize: 12,
		fontWeight: "600",
		color: colors.textMuted,
		letterSpacing: 0.5,
		marginTop: 18,
		marginBottom: 11,
	},
	recommendRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 11,
	},
	recommendThumb: {
		width: 48,
		height: 48,
		borderRadius: radii.lg,
		backgroundColor: colors.orange,
	},
	recommendBody: {
		flex: 1,
	},
	recommendTitle: {
		fontFamily: fonts.inter,
		fontSize: 13,
		fontWeight: "600",
		color: colors.textPrimary,
	},
	recommendMeta: {
		fontFamily: fonts.inter,
		fontSize: 10,
		color: colors.textMuted,
		marginTop: 2,
	},
	discountBadge: {
		backgroundColor: "rgba(20,241,149,0.14)",
		borderWidth: 1,
		borderColor: "rgba(20,241,149,0.4)",
		borderRadius: 11,
		paddingHorizontal: 9,
		paddingVertical: 5,
	},
	discountText: {
		fontFamily: fonts.inter,
		fontSize: 10,
		fontWeight: "700",
		color: colors.green,
	},
});
