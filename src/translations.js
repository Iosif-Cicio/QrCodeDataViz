// ---------------------------------------------------------------------------
// UI strings in English + German. The DE/EN toggle switches language.lang and
// the page re-renders. Student tweets are left as written (not translated).
// {n} in the title is replaced with the live student count.
// ---------------------------------------------------------------------------

export const translations = {
    en: {
        title: "What {n} students say about <br> FH Gänsendorf",
        intro:
            "Students from across Europe and beyond study at FH Gänsendorf. This is where they're from.",
        note: "Each dot represents a student",
        formTitle: "Add your dot",
        fName: "Name or nickname*",
        fCountry: "Country*",
        fCountryErr: "Pick a country from the list.",
        fCity: "City",
        fCityOpt: "(optional)",
        fText: "One line about the FH Gänsendorf*",
        textPlaceholder: "What do you like most about it?",
        submit: "Submit quote",
        countryPlaceholder: "Start typing…",
        cityDisabled: "Pick your country first",
        cityEnabled: "Start typing…",
        required: "*Required",
        add: "Add quote",
        wall: "Quote Wall",
        wallTitle: "What our students say:",
        wallSub: "quotes",
        allRegions: "All regions",
        allCountries: "All countries",
        searchName: "Search a name…",
    },
    de: {
        title: "Was {n} Studierende über die <br> FH Gänsendorf sagen",
        intro:
            "Studierende aus ganz Europa und darüber hinaus studieren an der FH Gänsendorf. Von hier kommen sie.",
        note: "Jeder Punkt steht für eine*n Studierende*n",
        formTitle: "Deinen Punkt hinzufügen",
        fName: "Name oder Spitzname*",
        fCountry: "Land*",
        fCountryErr: "Bitte ein Land aus der Liste wählen.",
        fCity: "Stadt",
        fCityOpt: "(optional)",
        fText: "Ein Satz über die FH Gänsendorf*",
        textPlaceholder: "Was gefällt dir am besten?",
        submit: "Eintrag bestätigen",
        countryPlaceholder: "Tippen…",
        cityDisabled: "Zuerst das Land wählen",
        cityEnabled: "Tippen…",
        required: "*Pflichtfeld",
        add: "Zitat hinzufügen",
        wall: "Zitatwand",
        wallTitle: "Was unsere Studierenden sagen:",
        wallSub: "Zitate",
        allRegions: "Alle Regionen",
        allCountries: "Alle Länder",
        searchName: "Namen suchen…",
    },
};

export const language = { lang: "en" };

export function t(key) {
    const table = translations[language.lang] || translations.en;
    return key in table ? table[key] : key;
}