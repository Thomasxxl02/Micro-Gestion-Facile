/**
 * SireneService - Service de vérification du SIRET via l'API Sirene (INSEE)
 * En production, utiliserait un proxy sécurisé pour ne pas exposer de clés API côté client.
 */

export interface SireneCompany {
  siret: string;
  siren: string;
  name: string;
  address: string;
  city: string;
  zipCode: string;
  legalForm?: string;
  activityCode?: string;
  creationDate?: string;
}

export const SireneService = {
  /**
   * Vérifie un numéro SIRET et récupère les informations légales
   */
  async verifySiret(siret: string): Promise<SireneCompany | null> {
    const cleanSiret = siret.replace(/\s/g, "");
    if (!/^\d{14}$/.test(cleanSiret)) {
      throw new Error("SIRET invalide : doit contenir 14 chiffres.");
    }

    try {
      // Simulation d'appel API Sirene (INSEE)
      // En production : fetch(`https://api.insee.fr/entreprises/sirene/V3/siret/${cleanSiret}`, { headers: { 'Authorization': 'Bearer ...' } })

      // Mock pour démonstration / développement
      await new Promise((resolve) => window.window.setTimeout(resolve, 800));

      // Exemple de données retournées pour certains SIRET de test
      if (cleanSiret === "12345678900013") {
        return {
          siret: cleanSiret,
          siren: "123456789",
          name: "MICRO-ENTREPRISE THOMAS DESIGN",
          address: "123 RUE DE LA PAIX",
          city: "PARIS",
          zipCode: "75002",
          legalForm: "Entrepreneur individuel",
          activityCode: "6201Z",
          creationDate: "2024-01-01",
        };
      }

      if (cleanSiret.startsWith("800")) {
        return {
          siret: cleanSiret,
          siren: cleanSiret.substring(0, 9),
          name: "ETABLISSEMENTS TEST FRANCE",
          address: "45 AVENUE DES CHAMPS ELYSEES",
          city: "PARIS",
          zipCode: "75008",
          legalForm: "Société par actions simplifiée",
          activityCode: "7010Z",
        };
      }

      // Par défaut, génère quelque chose de plausible pour la démo si le SIRET est valide Luhn
      // (En production, on retournerait null si l'API ne trouve rien)
      return {
        siret: cleanSiret,
        siren: cleanSiret.substring(0, 9),
        name: "ENTREPRISE VALIDE (PROVISOIRE)",
        address: "ADRESSE RECUPEREE VIA SIRENE",
        city: "VILLE",
        zipCode: "00000",
      };
    } catch (error) {
      console.error("SireneService error:", error);
      throw new Error("Erreur de connexion à l'API Sirene.", { cause: error });
    }
  },
};
