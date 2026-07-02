import "../lib/polyfills";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from "@expo-google-fonts/inter";
import { SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";
import { View, ActivityIndicator } from "react-native";
import { WalletProvider, useWallet } from "../lib/wallet";
import { EventProvider } from "../lib/event";
import { colors } from "./theme";

function AuthGate({ children }: { children: React.ReactNode }) {
	const { publicKey } = useWallet();
	const router = useRouter();
	const segments = useSegments();
	const [ready, setReady] = useState(false);

	useEffect(() => {
		// Give router a tick to mount before redirecting
		const t = setTimeout(() => setReady(true), 50);
		return () => clearTimeout(t);
	}, []);

	useEffect(() => {
		if (!ready) return;
		const inOnboarding = segments[0] === "onboarding";
		if (!__DEV__ && !publicKey && !inOnboarding) {
			router.replace("/onboarding");
		} else if (publicKey && inOnboarding) {
			router.replace("/");
		}
	}, [publicKey, segments, ready, router]);

	return <>{children}</>;
}

function RootLayoutNav() {
	const [fontsLoaded] = useFonts({
		Inter_400Regular,
		Inter_500Medium,
		Inter_600SemiBold,
		Inter_700Bold,
		Inter_800ExtraBold,
		SpaceGrotesk_500Medium,
		SpaceGrotesk_600SemiBold,
		SpaceGrotesk_700Bold,
	});

	if (!fontsLoaded) {
		return (
			<View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
				<ActivityIndicator color={colors.green} />
			</View>
		);
	}

	return (
		<Stack
			screenOptions={{
				headerShown: false,
				contentStyle: { backgroundColor: colors.bg },
			}}
		>
			<Stack.Screen name="onboarding" options={{ animation: "fade" }} />
			<Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
			<Stack.Screen name="event/[id]" options={{ animation: "slide_from_right", presentation: "card" }} />
			<Stack.Screen name="topup" options={{ animation: "slide_from_bottom", presentation: "modal" }} />
			<Stack.Screen name="pay" options={{ animation: "slide_from_bottom", presentation: "modal" }} />
			<Stack.Screen name="success" options={{ animation: "fade" }} />
			<Stack.Screen name="explore/index" options={{ animation: "slide_from_right" }} />
			<Stack.Screen name="explore/partner" options={{ animation: "slide_from_right" }} />
			<Stack.Screen name="explore/side-events" options={{ animation: "slide_from_right" }} />
			<Stack.Screen name="quests/index" options={{ animation: "slide_from_right" }} />
			<Stack.Screen name="quests/leaderboard" options={{ animation: "slide_from_right" }} />
			<Stack.Screen name="quests/reward-pool" options={{ animation: "slide_from_right" }} />
		</Stack>
	);
}

export default function RootLayout() {
	return (
		<WalletProvider>
			<EventProvider>
				<SafeAreaProvider>
					<AuthGate>
						<RootLayoutNav />
					</AuthGate>
					<StatusBar style="light" />
				</SafeAreaProvider>
			</EventProvider>
		</WalletProvider>
	);
}
