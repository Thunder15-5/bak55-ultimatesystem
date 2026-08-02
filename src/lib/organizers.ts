export const ORGANIZER_TYPES = [
  { value: "studio", label: "Recording Studio" },
  { value: "producer", label: "Music Producer" },
  { value: "label", label: "Record Label" },
  { value: "brand", label: "Brand" },
  { value: "event_organizer", label: "Event Organizer" },
  { value: "university", label: "University" },
  { value: "college", label: "College" },
  { value: "ngo", label: "NGO" },
  { value: "talent_agency", label: "Talent Agency" },
  { value: "government", label: "Government Organization" },
  { value: "festival", label: "Festival" },
  { value: "other", label: "Other" },
] as const;

export type OrganizerTypeValue = (typeof ORGANIZER_TYPES)[number]["value"];

export const organizerTypeLabel = (value?: string | null) =>
  ORGANIZER_TYPES.find((t) => t.value === value)?.label ?? "Organizer";

export const COMPETITION_TYPES = [
  { value: "music", label: "Music Competition" },
  { value: "talent", label: "Talent Search" },
  { value: "beat", label: "Beat Battle" },
  { value: "songwriting", label: "Songwriting" },
  { value: "dance", label: "Dance" },
  { value: "campus", label: "Campus Challenge" },
  { value: "brand", label: "Branded Campaign" },
] as const;

export const JUDGING_METHODS = [
  { value: "fan_votes", label: "Fan votes only", description: "100% of the score comes from fan voting." },
  { value: "judges", label: "Judges only", description: "Appointed judges decide the winners." },
  { value: "hybrid", label: "Hybrid (70% fans / 30% judges)", description: "The BAK55 standard scoring model." },
] as const;

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
