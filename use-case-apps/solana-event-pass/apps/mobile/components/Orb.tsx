import { View, StyleSheet, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { colors } from "../app/theme";

interface OrbProps {
	size?: number;
	face?: boolean;
	color?: "purple" | "green";
}

export function Orb({ size = 128, face = true, color = "purple" }: OrbProps) {
	const scale = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		const pulse = Animated.loop(
			Animated.sequence([
				Animated.timing(scale, {
					toValue: 1.05,
					duration: 1700,
					useNativeDriver: true,
				}),
				Animated.timing(scale, {
					toValue: 1,
					duration: 1700,
					useNativeDriver: true,
				}),
			]),
		);
		pulse.start();
		return () => pulse.stop();
	}, [scale]);

	const isPurple = color === "purple";
	const gradientColors = isPurple
		? ["#cba6ff", colors.purple, "#3a1d80"]
		: ["#1bf6a0", colors.green, "#0b9c62"];

	return (
		<Animated.View
			style={[
				styles.orb,
				{
					width: size,
					height: size,
					borderRadius: size / 2,
					backgroundColor: gradientColors[1],
					shadowColor: gradientColors[1],
					shadowOffset: { width: 0, height: 18 },
					shadowOpacity: 0.4,
					shadowRadius: 50,
					elevation: 12,
					transform: [{ scale }],
				},
			]}
		>
			{face && (
				<>
					<View
						style={[
							styles.eye,
							{ top: size * 0.36, left: size * 0.27 },
						]}
					/>
					<View
						style={[
							styles.eye,
							{ top: size * 0.36, right: size * 0.27 },
						]}
					/>
					<View
						style={[
							styles.mouth,
							{
								width: size * 0.28,
								height: size * 0.14,
								borderRadius: size * 0.14,
								bottom: size * 0.27,
							},
						]}
					/>
				</>
			)}
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	orb: {
		position: "relative",
	},
	eye: {
		position: "absolute",
		width: 14,
		height: 14,
		borderRadius: 7,
		backgroundColor: colors.black,
	},
	mouth: {
		position: "absolute",
		alignSelf: "center",
		borderWidth: 3,
		borderColor: colors.black,
		borderTopWidth: 0,
		backgroundColor: "transparent",
	},
});
