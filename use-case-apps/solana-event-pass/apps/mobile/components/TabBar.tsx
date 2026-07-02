import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { colors, fonts } from "../app/theme";

export const TAB_BAR_HEIGHT = 88;

const tabs = [
	{ name: "Events", path: "/", icon: "events" },
	{ name: "Wallet", path: "/wallet", icon: "wallet" },
	{ name: "Pay", path: "/pay", icon: "pay", center: true },
	{ name: "POAPs", path: "/poaps", icon: "poaps" },
	{ name: "Sol", path: "/sol", icon: "sol" },
];

function TabIcon({ icon, active }: { icon: string; active: boolean }) {
	if (icon === "pay") {
		return (
			<View style={styles.payOrb}>
				<View style={styles.paySquare} />
			</View>
		);
	}

	const baseStyle = [
		styles.iconBase,
		icon === "events" && styles.eventsIcon,
		icon === "wallet" && styles.walletIcon,
		icon === "poaps" && styles.poapsIcon,
		icon === "sol" && styles.solIcon,
		active && styles.iconActive,
	];

	return <View style={baseStyle} />;
}

export function CustomTabBar() {
	const router = useRouter();
	const pathname = usePathname();

	return (
		<View style={styles.container}>
			{tabs.map((tab) => {
				const active = pathname === tab.path || pathname.startsWith(tab.path + "/");
				if (tab.center) {
					return (
						<TouchableOpacity
							key={tab.name}
							activeOpacity={0.8}
							onPress={() => router.push(tab.path as any)}
							style={styles.centerWrap}
						>
							<View style={styles.payButton}>
								<TabIcon icon={tab.icon} active={active} />
							</View>
						</TouchableOpacity>
					);
				}
				return (
					<TouchableOpacity
						key={tab.name}
						activeOpacity={0.7}
						onPress={() => router.push(tab.path as any)}
						style={styles.tab}
					>
						<TabIcon icon={tab.icon} active={active} />
						<Text style={[styles.label, active && styles.labelActive]}>
							{tab.name}
						</Text>
					</TouchableOpacity>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		height: TAB_BAR_HEIGHT,
		backgroundColor: "rgba(11,9,19,0.85)",
		borderTopWidth: 1,
		borderTopColor: "rgba(255,255,255,0.06)",
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-around",
		paddingTop: 16,
		paddingHorizontal: 14,
	},
	tab: {
		alignItems: "center",
		gap: 6,
		flex: 1,
	},
	label: {
		fontFamily: fonts.inter,
		fontSize: 11,
		fontWeight: "600",
		color: colors.textDim,
	},
	labelActive: {
		color: colors.textPrimary,
	},
	iconBase: {
		width: 26,
		height: 26,
		borderRadius: 7,
		borderWidth: 2,
		borderColor: "#4b4560",
		backgroundColor: "transparent",
	},
	iconActive: {
		borderWidth: 0,
	},
	eventsIcon: {
		borderRadius: 6,
	},
	walletIcon: {
		borderRadius: 6,
	},
	poapsIcon: {
		borderRadius: 11,
	},
	solIcon: {
		borderRadius: 11,
	},
	centerWrap: {
		alignItems: "center",
		marginTop: -20,
		flex: 1,
	},
	payButton: {
		width: 58,
		height: 58,
		borderRadius: 29,
		backgroundColor: colors.purple,
		borderWidth: 4,
		borderColor: colors.bg,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: colors.purple,
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.5,
		shadowRadius: 26,
		elevation: 10,
	},
	payOrb: {
		width: 22,
		height: 22,
		borderRadius: 6,
		borderWidth: 2.5,
		borderColor: colors.textPrimary,
		alignItems: "center",
		justifyContent: "center",
	},
	paySquare: {
		width: 8,
		height: 8,
		backgroundColor: colors.textPrimary,
		borderRadius: 1,
	},
});
