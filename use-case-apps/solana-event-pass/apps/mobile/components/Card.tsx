import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from "react-native";
import { colors, fonts, radii, spacing } from "../app/theme";

interface EventCardProps {
	title: string;
	subtitle?: string;
	badge?: string;
	badgeColor?: "purple" | "green";
	gradient?: "purple" | "green" | "orange";
	onPress?: () => void;
	style?: ViewStyle;
	children?: React.ReactNode;
	live?: boolean;
}

const gradients = {
	purple: [colors.purple, colors.purpleDeeper, "#14233f"] as const,
	green: [colors.green, colors.greenDeeper] as const,
	orange: [colors.orange, colors.orangeDark] as const,
};

export function EventCard({
	title,
	subtitle,
	badge,
	badgeColor = "green",
	gradient = "purple",
	onPress,
	style,
	children,
	live,
}: EventCardProps) {
	return (
		<TouchableOpacity
			activeOpacity={0.85}
			onPress={onPress}
			style={[styles.card, style]}
		>
			<View
				style={[
					styles.hero,
					{
						backgroundColor: gradients[gradient][0],
					},
				]}
			>
				{live && (
					<View style={styles.liveBadge}>
						<View style={styles.liveDot} />
						<Text style={styles.liveText}>LIVE · DAY 2</Text>
					</View>
				)}
				{badge && (
					<View
						style={[
							styles.badge,
							badgeColor === "green" && styles.badgeGreen,
							badgeColor === "purple" && styles.badgePurple,
						]}
					>
						<Text
							style={[
								styles.badgeText,
								badgeColor === "green" && styles.badgeGreenText,
								badgeColor === "purple" && styles.badgePurpleText,
							]}
						>
							{badge}
						</Text>
					</View>
				)}
			</View>
			<View style={styles.body}>
				<Text style={styles.title}>{title}</Text>
				{subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
				{children}
			</View>
		</TouchableOpacity>
	);
}

export function CompactEventCard({
	title,
	subtitle,
	badge,
	gradient = "green",
	onPress,
	style,
}: EventCardProps) {
	return (
		<TouchableOpacity
			activeOpacity={0.85}
			onPress={onPress}
			style={[styles.compact, style]}
		>
			<View
				style={[
					styles.compactThumb,
					{ backgroundColor: gradients[gradient][0] },
				]}
			/>
			<View style={styles.compactBody}>
				<Text style={styles.compactTitle}>{title}</Text>
				{subtitle && <Text style={styles.compactSubtitle}>{subtitle}</Text>}
			</View>
			{badge && (
				<View style={styles.compactBadge}>
					<Text style={styles.compactBadgeText}>{badge}</Text>
				</View>
			)}
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	card: {
		borderRadius: radii["5xl"],
		overflow: "hidden",
		borderWidth: 1,
		borderColor: colors.border,
		marginBottom: spacing.base,
	},
	hero: {
		height: 158,
		padding: 13,
		justifyContent: "space-between",
		flexDirection: "row",
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
	},
	liveDot: {
		width: 7,
		height: 7,
		borderRadius: 4,
		backgroundColor: colors.live,
		shadowColor: colors.live,
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 1,
		shadowRadius: 8,
	},
	liveText: {
		fontFamily: fonts.inter,
		fontSize: 10,
		fontWeight: "700",
		color: colors.textPrimary,
		letterSpacing: 0.5,
	},
	badge: {
		borderRadius: radii.full,
		paddingHorizontal: 11,
		paddingVertical: 5,
		alignSelf: "flex-start",
	},
	badgeGreen: {
		backgroundColor: "rgba(20,241,149,0.16)",
		borderWidth: 1,
		borderColor: "rgba(20,241,149,0.5)",
	},
	badgePurple: {
		backgroundColor: "rgba(153,69,255,0.16)",
		borderWidth: 1,
		borderColor: "rgba(153,69,255,0.5)",
	},
	badgeText: {
		fontFamily: fonts.space,
		fontSize: 11,
		fontWeight: "700",
	},
	badgeGreenText: {
		color: colors.green,
	},
	badgePurpleText: {
		color: "#bd95ff",
	},
	body: {
		backgroundColor: colors.card,
		padding: spacing.lg,
	},
	title: {
		fontFamily: fonts.space,
		fontSize: 17,
		fontWeight: "700",
		color: colors.textPrimary,
		letterSpacing: -0.3,
	},
	subtitle: {
		fontFamily: fonts.inter,
		fontSize: 12,
		color: colors.textMuted,
		marginTop: 3,
	},
	compact: {
		flexDirection: "row",
		gap: 13,
		borderRadius: radii["4xl"],
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.card,
		padding: 11,
		marginBottom: spacing.base,
		alignItems: "center",
	},
	compactThumb: {
		width: 64,
		height: 64,
		borderRadius: radii.lg,
	},
	compactBody: {
		flex: 1,
		justifyContent: "center",
	},
	compactTitle: {
		fontFamily: fonts.space,
		fontSize: 14,
		fontWeight: "700",
		color: colors.textPrimary,
	},
	compactSubtitle: {
		fontFamily: fonts.inter,
		fontSize: 11,
		color: colors.textMuted,
		marginTop: 3,
	},
	compactBadge: {
		borderWidth: 1,
		borderColor: colors.borderStrong,
		borderRadius: radii.full,
		paddingHorizontal: 10,
		paddingVertical: 5,
	},
	compactBadgeText: {
		fontFamily: fonts.space,
		fontSize: 10,
		fontWeight: "600",
		color: colors.textMuted,
	},
});
