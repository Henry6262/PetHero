import {
	createContext,
	useContext,
	useState,
	type ReactNode,
} from "react";
import type { Event } from "../types";

interface EventContextValue {
	selectedEvent: Event | null;
	setSelectedEvent: (event: Event | null) => void;
}

const EventContext = createContext<EventContextValue | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

	return (
		<EventContext.Provider value={{ selectedEvent, setSelectedEvent }}>
			{children}
		</EventContext.Provider>
	);
}

export function useEvent() {
	const ctx = useContext(EventContext);
	if (!ctx) throw new Error("useEvent must be used inside EventProvider");
	return ctx;
}
