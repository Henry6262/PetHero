import { TouchableOpacity, Text, StyleSheet, type ViewStyle, type TextStyle } from "react-native";
import { colors, fonts, radii } from "../app/theme";

interface ButtonProps {
	title: string;
	onPress?: () => void;
	variant?: "primary" | "secondary" | "green" | "ghost";
	disabled?: boolean;
	loading?: boolean;
	style?: ViewStyle;
	textStyle?: TextStyle;
	icon?: React.ReactNode;
}

export function Button({
	title,
	onPress,
	variant = "primary",
	disabled,
	style,
	textStyle,
	icon,
}: ButtonProps) {
	return (
		<TouchableOpacity
			activeOpacity={0.8}
			onPress={onPress}
			disabled={disabled}
			style={[
				styles.base,
				variant === "primary" && styles.primary,
				variant === "secondary" && styles.secondary,
				variant === "green" && styles.green,
				variant === "ghost" && styles.ghost,
				disabled && styles.disabled,
				style,
			]}
		>
			{icon}
			<Text style={[styles.text, styles[`${variant}Text` as const], textStyle]}>
				{title}
			</Text>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	base: {
		height: 54,
		borderRadius: radii["3xl"],
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 8,
	},
	primary: {
		backgroundColor: colors.purple,
		shadowColor: colors.purple,
		shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 0.45,
		shadowRadius: 30,
		elevation: 12,
	},
	secondary: {
		backgroundColor: colors.card,
		borderWidth: 1,
		borderColor: colors.borderStrong,
	},
	green: {
		backgroundColor: colors.green,
		shadowColor: colors.green,
		shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 0.35,
		shadowRadius: 28,
		elevation: 10,
	},
	ghost: {
		backgroundColor: "transparent",
	},
	disabled: {
		opacity: 0.5,
	},
	text: {
		fontFamily: fonts.inter,
		fontSize: 15,
		fontWeight: "600",
	},
	primaryText: {
		color: colors.textPrimary,
	},
	secondaryText: {
		color: colors.textPrimary,
	},
	greenText: {
		color: colors.black,
	},
	ghostText: {
		color: colors.textMuted,
	},
});
