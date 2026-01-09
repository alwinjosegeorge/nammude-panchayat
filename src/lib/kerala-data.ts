export const KERALA_DISTRICTS = [
    "Thiruvananthapuram",
    "Kollam",
    "Pathanamthitta",
    "Alappuzha",
    "Kottayam",
    "Idukki",
    "Ernakulam",
    "Thrissur",
    "Palakkad",
    "Malappuram",
    "Kozhikode",
    "Wayanad",
    "Kannur",
    "Kasaragod"
] as const;

export type District = typeof KERALA_DISTRICTS[number];

// Sample data - In a real app, this would be a full database or large JSON
// Excluding Municipalities and Corporations as per requirements
export const KERALA_PANCHAYATS: Record<District, string[]> = {
    "Thiruvananthapuram": [
        "Athiyannur", "Chenkal", "Karode", "Kulathoor", "Parassala", "Thirupuram",
        "Balaramapuram", "Kalliyoor", "Malayinkeezhu", "Maranalloor", "Vilappil", "Vilavoorkkal",
        "Andoorkonam", "Kadinamkulam", "Mangalapuram", "Pothencode",
        "Aruvikkara", "Karakulam", "Panavoor", "Vembayam", "Vellanad"
    ],
    "Kollam": [
        "Adichanalloor", "Chathannoor", "Chirakkara", "Poothakkulam",
        "East Kallada", "Kundara", "Munroe Island", "Perayam", "Perinad",
        "Mayyanad", "Panayam", "Thrikkaruva", "Thrikkovilvattom"
    ],
    "Pathanamthitta": [
        "Adoor", "Pandalam", "Parakode", "Ezhamkulam", "Kodumon",
        "Konni", "Aruvappulam", "Pramadom", "Mylapra", "Vallicode",
        "Ranni", "Pazhavangadi", "Vadasserikkara", "Naranammoozhy"
    ],
    "Alappuzha": [
        "Ambalapuzha North", "Ambalapuzha South", "Punnapra North", "Punnapra South",
        "Aryad", "Mannancherry", "Mararikulam North", "Mararikulam South",
        "Champakulam", "Edathua", "Kainakary", "Nedumudi", "Thakazhy"
    ],
    "Kottayam": [
        "Poonjar", "Poonjar Thekkekara", "Teekoy", "Thidanad",
        "Bharananganam", "Kadanad", "Karoor", "Kozhuvanal", "Meenachil", "Mutholy",
        "Aymanam", "Kumarakom", "Thiruvarppu", "Vijayapuram"
    ],
    "Idukki": [
        "Adimali", "Bisonvalley", "Konnathady", "Pallivasal", "Vellathooval",
        "Karimannoor", "Kudayathoor", "Udumbannoor", "Vannappuram", "Velliyamattom",
        "Arakkulam", "Idukki-Kanjikuzhy", "Kamakshy", "Mariyapuram", "Vathikudy"
    ],
    "Ernakulam": [
        "Alangad", "Karumalloor", "Koonammavu", "Varapuzha",
        "Chellanam", "Kumbalangi", "Pallippuram",
        "Amballur", "Edakkattuvayal", "Kanjiramattom", "Mulanthuruthy"
    ],
    "Thrissur": [
        "Adat", "Avanoor", "Kaiparambu", "Kolazhy", "Mulakunnathukavu", "Tholur",
        "Annamanada", "Kuzhur", "Mala", "Poyya",
        "Anthikad", "Chazhoor", "Manalur", "Thanniyam"
    ],
    "Palakkad": [
        "Agali", "Pudur", "Sholayur",
        "Alanallur", "Kottoppadam", "Kumaramputhur", "Thachampara",
        "Ambalapara", "Ananganadi", "Chalavara", "Lakkidi-Perur", "Vaniyamkulam"
    ],
    "Malappuram": [
        "Amarambalam", "Chokkad", "Edakkara", "Karulai", "Moothedam",
        "Anakkayam", "Areacode", "Cheekkode", "Keezhuparamba", "Urangattiri",
        "Angadippuram", "Kuruva", "Mankada", "Moorkanad", "Puzhakkattiri"
    ],
    "Kozhikode": [
        "Arikkulam", "Chemancheri", "Chengottukavu", "Moodadi",
        "Atholi", "Balussery", "Koorachund", "Kottur", "Naduvannur",
        "Ayancheri", "Chekkiad", "Edacheri", "Purameri", "Thuneri"
    ],
    "Wayanad": [
        "Ambalavayal", "Meppadi", "Moopainad", "Muttil",
        "Edavaka", "Mananthavady", "Thavinhal", "Thirunelly",
        "Kaniyambetta", "Kottathara", "Meenangadi", "Panamaram"
    ],
    "Kannur": [
        "Anjarakkandy", "Chembilode", "Kadambur", "Munderi", "Peralassery",
        "Aralam", "Ayyankunnu", "Keezhallur", "Koodali", "Payam", "Thillankeri",
        "Azhikode", "Chirakkal", "Pappinisseri", "Valapattanam"
    ],
    "Kasaragod": [
        "Ajanur", "Balal", "Kallar", "Kodom-Belur", "Madikai", "Panathady",
        "Badiyadka", "Bellur", "Enmakaje", "Kumbadaje", "Madhur", "Mogral-Puthur",
        "Bedadka", "Chemnad", "Delampady", "Kuttikol", "Muliyar"
    ]
};
