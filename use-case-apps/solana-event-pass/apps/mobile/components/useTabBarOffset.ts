import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TAB_BAR_HEIGHT } from "./TabBar";

export function useTabBarOffset() {
	const insets = useSafeAreaInsets();
	return TAB_BAR_HEIGHT + insets.bottom;
}
