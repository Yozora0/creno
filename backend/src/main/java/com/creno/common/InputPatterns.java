package com.creno.common;

/**
 * Listes blanches de caractères pour les champs texte (utilisées avec @Pattern).
 *
 * <p>Ce n'est pas la protection principale contre les injections : les requêtes SQL sont toutes
 * paramétrées (JPA) et React échappe tout ce qu'il affiche. Ces règles ajoutent une défense en
 * profondeur : les données stockées restent propres, quel que soit l'endroit où elles seront
 * réutilisées plus tard (email, export, logs, autre client de l'API…).
 */
public final class InputPatterns {

    private InputPatterns() {
    }

    /**
     * Prénom / nom : lettres (tous alphabets, accents compris), espaces, apostrophes, points et tirets.
     * Refuse chiffres, chevrons, guillemets, points-virgules… Ex. accepté : « Jean-Éloïse O'Neil ».
     */
    public static final String PERSON_NAME = "^\\p{L}[\\p{L}\\p{M} '’.-]*$";
    public static final String PERSON_NAME_MESSAGE = "ne doit contenir que des lettres, espaces, apostrophes ou tirets";

    /**
     * Texte libre sur une ligne : tout caractère imprimable, mais aucun caractère de contrôle
     * (retour à la ligne, tabulation, octet nul…). Empêche notamment l'injection d'en-têtes
     * dans les emails et la falsification de lignes dans les logs.
     */
    public static final String SINGLE_LINE_TEXT = "^[^\\p{Cntrl}]*$";
    public static final String SINGLE_LINE_TEXT_MESSAGE = "contient des caractères non autorisés";
}
