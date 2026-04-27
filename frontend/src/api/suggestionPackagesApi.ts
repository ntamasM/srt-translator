import { get } from "./client";
import type { SuggestionPackage } from "../types/settings";

export const suggestionPackagesApi = {
  list: () => get<SuggestionPackage[]>("/suggestion-packages"),
};
