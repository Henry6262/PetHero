// Professional coaches. PLACEHOLDER content — organiser to replace names,
// credentials and (optionally) photos. `credentialKey` / `roleKey` resolve via
// i18n (coaching.coaches.<id>.*) so credentials translate cleanly EN/DE.

export interface Coach {
  id: string;
  /** Real name (not translated). */
  name: string;
  /** Initials shown in the avatar tile when there is no photo. */
  initials: string;
}

export const COACHES: Coach[] = [
  { id: "marco", name: "Marco Brunner", initials: "MB" },
  { id: "amir", name: "Amir Said", initials: "AS" },
  { id: "lena", name: "Lena Frei", initials: "LF" },
];
