import { Tabs } from "expo-router";
import { CustomTabBar } from "../../components/TabBar";

export default function TabsLayout() {
	return (
		<Tabs
			initialRouteName="sol"
			tabBar={() => <CustomTabBar />}
			screenOptions={{
				headerShown: false,
			}}
		/>
	);
}
