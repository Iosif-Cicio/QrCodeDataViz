// ---------------------------------------------------------------------------
// UI strings in English + German. The DE/EN toggle switches language.lang and
// the page re-renders. Student tweets are left as written (not translated).
// {n} in the title is replaced with the live student count.
// ---------------------------------------------------------------------------

export const translations = {
    en: {
        title: "What {n} students say about the USTP St.\u00a0Pölten",
        intro:
            "Students from across Europe and beyond study at the University of Applied Sciences St.\u00a0Pölten. This is where they're from.",
        add: "Add a dot",
        note: "Each dot represents a student",
        formTitle: "Add your dot",
        fName: "Name or nickname*",
        fCountry: "Country*",
        fCountryErr: "Pick a country from the list.",
        fCity: "City",
        fCityOpt: "(optional)",
        fText: "One line about the USTP*",
        textPlaceholder: "What do you like most about it?",
        submit: "Add my dot",
        countryPlaceholder: "Start typing…",
        cityDisabled: "Pick your country first",
        cityEnabled: "Start typing…",
        required: "*Required",
    },
    de: {
        title: "Was {n} Studierende über die USTP St.\u00a0Pölten sagen",
        intro:
            "Studierende aus ganz Europa und darüber hinaus studieren an der Fachhochschule St.\u00a0Pölten. Von hier kommen sie.",
        add: "Punkt hinzufügen",
        note: "Jeder Punkt steht für eine*n Studierende*n",
        formTitle: "Deinen Punkt hinzufügen",
        fName: "Name oder Spitzname*",
        fCountry: "Land*",
        fCountryErr: "Bitte ein Land aus der Liste wählen.",
        fCity: "Stadt",
        fCityOpt: "(optional)",
        fText: "Ein Satz über die USTP*",
        textPlaceholder: "Was gefällt dir am besten?",
        submit: "Punkt hinzufügen",
        countryPlaceholder: "Tippen…",
        cityDisabled: "Zuerst das Land wählen",
        cityEnabled: "Tippen…",
        required: "*Pflichtfeld",
    },
};

export const language = { lang: "en" };

export function t(key) {
    const table = translations[language.lang] || translations.en;
    return key in table ? table[key] : key;
}