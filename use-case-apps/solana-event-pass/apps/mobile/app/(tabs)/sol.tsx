import { useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWallet } from "../../lib/wallet";
import { SolMascot } from "../../components/SolMascot";
import { useTabBarOffset } from "../../components/useTabBarOffset";
import { colors, fonts, radii, spacing } from "../theme";

interface Message {
	id: string;
	text: string;
	sender: "user" | "sol";
	items?: { time: string; title: string; active?: boolean }[];
	actions?: { label: string; active?: boolean }[];
}

const suggestions = [
	{ label: "What's on now?", active: false },
	{ label: "Plan my day", active: true },
	{ label: "Top up 50", active: false },
];

const initialConversation: Message[] = [
	{
		id: "1",
		text: "What's my afternoon look like across both events?",
		sender: "user",
	},
	{
		id: "2",
		text: "You've got 3 things lined up:",
		sender: "sol",
		items: [
			{ time: "14:00", title: "cNFT workshop", active: true },
			{ time: "17:00", title: "Superteam side event", active: false },
		],
		actions: [
			{ label: "Yes, do it", active: true },
			{ label: "Not now", active: false },
		],
	},
];

export default function SolScreen() {
	const insets = useSafeAreaInsets();
	const tabBarOffset = useTabBarOffset();
	const { disconnect } = useWallet();
	const [active, setActive] = useState(false);
	const [messages, setMessages] = useState<Message[]>(initialConversation);
	const [input, setInput] = useState("");

	const send = () => {
		if (!input.trim()) return;
		setMessages((m) => [
			...m,
			{ id: Date.now().toString(), text: input, sender: "user" },
			{
				id: (Date.now() + 1).toString(),
				text: "Got it — I'll add that to your agenda and remind you 10 min before.",
				sender: "sol",
			},
		]);
		setInput("");
		setActive(true);
	};

	const suggestionPress = (label: string) => {
		setMessages((m) => [
			...m,
			{ id: Date.now().toString(), text: label, sender: "user" },
			{
				id: (Date.now() + 1).toString(),
				text: "Here's what I found for you:",
				sender: "sol",
				items: [
					{ time: "14:00", title: "cNFT workshop", active: true },
					{ time: "17:00", title: "Superteam side event", active: false },
				],
				actions: [
					{ label: "Yes, do it", active: true },
					{ label: "Not now", active: false },
				],
			},
		]);
		setActive(true);
	};

	return (
		<View style={[styles.container, { paddingTop: insets.top + 12 }]}>
			<View style={styles.header}>
				<View style={styles.headerIcon} />
				<Text style={styles.headerTitle}>Sol</Text>
				<TouchableOpacity
					style={[styles.headerIcon, styles.headerIconRound]}
					onPress={disconnect}
				/>
			</View>

			{!active ? (
				<View style={styles.idle}>
					<SolMascot size={220} />
					<Text style={styles.idleTitle}>
						What can I help{"\n"}you find?
					</Text>

					<View style={[styles.suggestions, { bottom: tabBarOffset + 82 }]}>
						{suggestions.map((s) => (
							<TouchableOpacity
								key={s.label}
								style={[
									styles.suggestion,
									s.active && styles.suggestionActive,
								]}
								onPress={() => suggestionPress(s.label)}
							>
								<Text
									style={[
										styles.suggestionText,
										s.active && styles.suggestionTextActive,
									]}
								>
									{s.label}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>
			) : (
				<ScrollView
					style={styles.chat}
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: tabBarOffset + 20 }}
				>
					{messages.map((msg) => (
						<View key={msg.id} style={styles.messageWrap}>
							<View
								style={[
									styles.message,
									msg.sender === "user" ? styles.userMessage : styles.solMessage,
								]}
							>
								<Text
									style={[
										styles.messageText,
										msg.sender === "user" && styles.userMessageText,
									]}
								>
									{msg.text}
								</Text>
								{msg.items && (
									<View style={styles.itemList}>
										{msg.items.map((item) => (
											<View key={item.time} style={styles.item}>
												<Text
													style={[
														styles.itemTime,
														item.active && styles.itemTimeActive,
													]}
												>
													{item.time}
												</Text>
												<Text style={styles.itemTitle}>{item.title}</Text>
												<View
													style={[
														styles.itemDot,
														item.active && styles.itemDotActive,
													]}
												/>
											</View>
										))}
										</View>
									)}
									{msg.actions && (
										<View style={styles.actions}>
											{msg.actions.map((a) => (
												<TouchableOpacity
													key={a.label}
													style={[
														styles.actionPill,
														a.active && styles.actionPillActive,
													]}
												>
													<Text
														style={[
															styles.actionPillText,
															a.active && styles.actionPillTextActive,
														]}
													>
														{a.label}
													</Text>
												</TouchableOpacity>
											))}
										</View>
									)}
							</View>
						</View>
					))}
				</ScrollView>
			)}

			<View style={[styles.inputBar, { bottom: tabBarOffset + 8 }]}>
				<TextInput
					style={styles.input}
					placeholder="Ask Sol anything…"
					placeholderTextColor={colors.textDim}
					value={input}
					onChangeText={setInput}
					onSubmitEditing={send}
					returnKeyType="send"
				/>
				<TouchableOpacity style={styles.sendButton} onPress={send}>
					<View style={styles.sendArrow} />
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.bg,
		paddingHorizontal: 18,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 20,
	},
	headerTitle: {
		fontFamily: fonts.space,
		fontSize: 13,
		fontWeight: "600",
		color: colors.textSecondary,
	},
	headerIcon: {
		width: 40,
		height: 40,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.12)",
	},
	headerIconRound: {
		borderRadius: 20,
	},
	idle: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingBottom: 0,
	},
	idleTitle: {
		fontFamily: fonts.space,
		fontSize: 30,
		fontWeight: "700",
		color: colors.textPrimary,
		textAlign: "center",
		marginTop: 40,
		letterSpacing: -0.5,
	},
	suggestions: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 110,
		flexDirection: "row",
		gap: 10,
		flexWrap: "wrap",
		justifyContent: "center",
	},
	suggestion: {
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.14)",
		borderRadius: radii.full,
		paddingHorizontal: 18,
		paddingVertical: 12,
	},
	suggestionActive: {
		borderColor: "rgba(20,241,149,0.4)",
		backgroundColor: "rgba(20,241,149,0.08)",
	},
	suggestionText: {
		fontFamily: fonts.inter,
		fontSize: 15,
		fontWeight: "500",
		color: colors.textSecondary,
	},
	suggestionTextActive: {
		color: colors.green,
	},
	chat: {
		flex: 1,
	},
	messageWrap: {
		marginBottom: 12,
	},
	message: {
		maxWidth: "80%",
		borderRadius: 20,
		paddingHorizontal: 18,
		paddingVertical: 14,
	},
	userMessage: {
		alignSelf: "flex-end",
		backgroundColor: colors.purple,
		borderBottomRightRadius: 5,
	},
	solMessage: {
		alignSelf: "flex-start",
		backgroundColor: colors.card,
		borderWidth: 1,
		borderColor: colors.border,
		borderBottomLeftRadius: 5,
	},
	messageText: {
		fontFamily: fonts.inter,
		fontSize: 14,
		color: colors.textPrimary,
		lineHeight: 21,
	},
	userMessageText: {
		color: colors.textPrimary,
	},
	itemList: {
		marginTop: 14,
		gap: 10,
	},
	item: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		backgroundColor: colors.cardSecondary,
		borderRadius: radii.md,
		padding: 12,
	},
	itemTime: {
		fontFamily: fonts.space,
		fontSize: 12,
		fontWeight: "700",
		color: colors.textMuted,
		width: 40,
	},
	itemTimeActive: {
		color: colors.purple,
	},
	itemTitle: {
		flex: 1,
		fontFamily: fonts.inter,
		fontSize: 13,
		fontWeight: "600",
		color: colors.textPrimary,
	},
	itemDot: {
		width: 22,
		height: 22,
		borderRadius: 7,
		backgroundColor: "#14233f",
	},
	itemDotActive: {
		backgroundColor: colors.purple,
	},
	actions: {
		flexDirection: "row",
		gap: 10,
		marginTop: 12,
	},
	actionPill: {
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.14)",
		borderRadius: radii.lg,
		paddingHorizontal: 16,
		paddingVertical: 10,
	},
	actionPillActive: {
		borderColor: "rgba(20,241,149,0.4)",
		backgroundColor: "rgba(20,241,149,0.08)",
	},
	actionPillText: {
		fontFamily: fonts.inter,
		fontSize: 14,
		fontWeight: "500",
		color: colors.textSecondary,
	},
	actionPillTextActive: {
		color: colors.green,
	},
	inputBar: {
		position: "absolute",
		left: 18,
		right: 18,
		flexDirection: "row",
		alignItems: "center",
		height: 62,
		borderRadius: 31,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.14)",
		backgroundColor: "rgba(22,18,31,0.8)",
		paddingHorizontal: 10,
	},
	input: {
		flex: 1,
		paddingHorizontal: 16,
		color: colors.textPrimary,
		fontFamily: fonts.inter,
		fontSize: 16,
	},
	sendButton: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: colors.purple,
		alignItems: "center",
		justifyContent: "center",
	},
	sendArrow: {
		width: 14,
		height: 14,
		borderTopWidth: 3,
		borderRightWidth: 3,
		borderColor: colors.textPrimary,
		transform: [{ rotate: "-45deg" }],
		marginTop: 3,
	},
});
