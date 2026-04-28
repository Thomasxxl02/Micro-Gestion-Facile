import type { UserProfile } from "../types";

/**
 * Calcule la date d'échéance d'une facture en fonction des préférences de l'utilisateur
 * @param issueDate Date d'émission au format YYYY-MM-DD
 * @param userProfile Profil de l'utilisateur contenant les préférences d'automatisation
 * @returns Date d'échéance au format YYYY-MM-DD
 */
export function calculateDueDate(
  issueDate: string,
  userProfile: UserProfile,
): string {
  const date = new Date(issueDate);
  const delayType = userProfile.automation?.defaultPaymentDelay ?? "30_DAYS";

  let daysToAdd: number;

  switch (delayType) {
    case "RECEIPT":
      daysToAdd = 0;
      break;
    case "30_DAYS":
      daysToAdd = 30;
      break;
    case "45_DAYS":
      daysToAdd = 45;
      break;
    case "60_DAYS":
      daysToAdd = 60;
      break;
    case "CUSTOM":
      daysToAdd = userProfile.automation?.customPaymentDelayDays ?? 30;
      break;
    default:
      daysToAdd = 30;
  }

  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split("T")[0];
}
