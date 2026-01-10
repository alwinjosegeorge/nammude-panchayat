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
    "Anjuthengu", "Andoorkonam", "Athiyannur", "Aruvikkara", "Balaramapuram",
    "Chemmaruthy", "Chirayinkeezhu", "Edava", "Elakamon", "Kadinamkulam",
    "Kallara", "Kalliyoor", "Karakulam", "Karode", "Kilimanoor",
    "Kizhuvilam", "Kottukal", "Kulathoor", "Madavoor", "Malayinkeezhu",
    "Mangalapuram", "Maranalloor", "Nagaroor", "Nanniyode",
    "Nedumangad", "Ottoor", "Pallichal", "Panavoor",
    "Pangode", "Parassala", "Pazhayakunnummel", "Pothencode",
    "Pullampara", "Thirupuram", "Vamanapuram",
    "Vellanad", "Vembayam", "Vilappil", "Vilavoorkkal"
  ],

  "Kollam": [
    "Adichanalloor", "Alappad", "Chadayamangalam", "Chathannoor",
    "Chavara", "Chirakkara", "Clappana", "Ezhukone",
    "Ittiva", "Kallada", "Kottamkara", "Kulakkada",
    "Kulasekharapuram", "Kummil", "Mayyanad", "Melila",
    "Mynagappally", "Neduvathur", "Neendakara",
    "Nedumpana", "Oachira", "Panayam", "Perayam",
    "Perinad", "Poothakkulam", "Sooranad North",
    "Sooranad South", "Thazhava", "Thrikkaruva",
    "Thrikkovilvattom", "Velinalloor", "Vettikkavala"
  ],

  "Pathanamthitta": [
    "Aruvappulam", "Chenneerkara", "Cherukole", "Elanthoor",
    "Enadimangalam", "Erathu", "Ezhamkulam", "Kadampanad",
    "Kalanjoor", "Kodumon", "Konni", "Kottanad",
    "Kozhencherry", "Kulanada", "Kuttoor",
    "Mallappally", "Mezhuveli", "Mylapra",
    "Naranammoozhy", "Naranganam", "Nedumpuram",
    "Niranam", "Omalloor", "Pallickal",
    "Pandalam", "Parakode", "Perunad",
    "Pramadom", "Ranni Angadi", "Ranni Pazhavangadi",
    "Ranni Perunad", "Thiruvalla", "Thumpamon",
    "Vadasserikkara", "Vallicode", "Vechoochira"
  ],

  "Alappuzha": [
    "Arookutty", "Aroor", "Aryad", "Bharanickavu",
    "Champakulam", "Chennithala Thripperumthura",
    "Chettikulangara", "Cheriyanad", "Cherthala South",
    "Edathua", "Ezhupunna", "Kadakkarappally",
    "Kainakary", "Kanjikuzhy", "Karthikappally",
    "Kavalam", "Kumarapuram", "Mannar",
    "Mararikulam North", "Mararikulam South",
    "Mavelikkara Thekkekara", "Muhamma",
    "Mulakuzha", "Nedumudi", "Nooranad",
    "Pallippad", "Panavally", "Pulincunnu",
    "Punnapra North", "Punnapra South",
    "Ramankary", "Thakazhy", "Thiruvanvandoor",
    "Thuravoor", "Veeyapuram", "Vellavoor"
  ],

  "Kottayam": [
    "Akalakkunnam", "Arpookkara", "Athirampuzha", "Aymanam", "Ayarkunnam",
    "Bharananganam", "Chempu", "Chirakkadavu", "Erumely", "Elikkulam",
    "Kadanadu", "Kadaplamattom", "Kaduthuruthy", "Kallara", "Kanakkary",
    "Kangazha", "Karoor", "Karukachal", "Kidangoor", "Koottickal",
    "Kooroppada", "Koruthodu", "Kozhuvanal", "Kuravilangadu", "Kurichy",
    "Madappally", "Manarcadu", "Manimala", "Manjoor", "Marangattupally",
    "Maravanthuruthu", "Meenachil", "Meenadom", "Melukavu", "Monnilavu",
    "Mundakkayam", "Mutholy", "Nedumkunnam", "Neendoor", "Njeezhoor",
    "Pallickathodu", "Pampady", "Paippadu", "Panachicadu", "Parathodu",
    "Poonjar", "Poonjar Thekkekkara", "Puthuppally", "Ramapuram",
    "Thalanadu", "Thalappalam", "Thalayazham", "Thekkoy", "Thidanadu",
    "Thrikkodithanam", "Thiruvarppu", "Udayanapuram", "Uzhavoor",
    "Vakathanam", "Vazhappally", "Vechoor", "Veliyanoor", "Vellavoor",
    "Velloor", "Vijayapuram", "Vazhoor"
  ],

  "Idukki": [
    "Adimali", "Alakode", "Arakulam", "Ayyappancoil", "Bisonvalley",
    "Chakkupallam", "Elappara", "Idukki-Kanjikuzhy", "Kamakshy",
    "Karimannoor", "Kattappana", "Konnathady", "Kudayathoor",
    "Mariyapuram", "Munnar", "Nedumkandam", "Pallivasal",
    "Peruvanthanam", "Rajakumari", "Santhanpara", "Udumbannoor",
    "Vandiperiyar", "Vathikudy", "Vazhathope", "Vellathooval",
    "Velliyamattom", "Vannappuram"
  ],

  "Ernakulam": [
    "Alangad", "Amballur", "Asamannoor", "Ayyampuzha", "Chengamanad",
    "Chellanam", "Chendamangalam", "Chittattukara", "Chowwara",
    "Edakkattuvayal", "Edathala", "Elankunnapuzha", "Kadamakkudy",
    "Kanjiramattom", "Karumalloor", "Kavalangad", "Keerampara",
    "Kizhakkambalam", "Koonammavu", "Kottuvally", "Kumbalangi",
    "Kunnathunad", "Maneed", "Manjalloor", "Mulanthuruthy",
    "Mulavukad", "Nayarambalam", "Nedumbassery", "Paingottoor",
    "Pallarimangalam", "Pallippuram", "Parakkadavu", "Poothrikka",
    "Pothanikkad", "Thirumarady", "Thuravoor", "Tripunithura",
    "Varapuzha", "Vazhakkulam", "Vengola", "Vypin"
  ],

  "Thrissur": [
    "Adat", "Alagappanagar", "Anandapuram", "Anthikad", "Avanoor",
    "Chelakkara", "Chazhoor", "Chiramanangad", "Desamangalam",
    "Edavilangu", "Engandiyur", "Eriyad", "Guruvayur",
    "Kadappuram", "Kaiparambu", "Kodakara", "Kolazhy",
    "Kondazhy", "Koratty", "Kuzhur", "Madakkathara",
    "Manalur", "Mathilakam", "Mullassery", "Mulakunnathukavu",
    "Nadathara", "Nattika", "Orumanayur", "Padiyur",
    "Pananchery", "Panjal", "Paralam", "Pavaratty",
    "Peringottukara", "Poyya", "Puthur", "Sreenarayanapuram",
    "Thalikulam", "Thanniyam", "Tholur", "Vallathol Nagar",
    "Varandarappilly", "Vatanappally", "Vellangallur"
  ],
  "Palakkad": [
    "Agali", "Alanallur", "Ambalapara", "Anakkara", "Ananganadi", "Ayiloor",
    "Chalavara", "Elappully", "Erimayur", "Kanjirapuzha", "Karakurissi",
    "Karimba", "Keralassery", "Kizhakkanchery", "Kodumba", "Kongad",
    "Koppam", "Kottayi", "Kottoppadam", "Kulukkallur", "Kumaramputhur",
    "Lakkidi-Perur", "Mannur", "Mankara", "Muthalamada", "Nellaya",
    "Nenmara", "Pallassena", "Parudur", "Peruvemba", "Pudussery",
    "Puthunagaram", "Sholayur", "Tachampara", "Thirumittakode",
    "Thiruvalathur", "Vaniyamkulam", "Vandazhi", "Vilayur"
  ],

  "Malappuram": [
    "Aliparamba", "Amarambalam", "Anakkayam", "Areacode", "Athavanad",
    "Chekkode", "Chemmad", "Chokkad", "Edakkara", "Edappatta",
    "Elamkulam", "Irimbiliyam", "Kalady", "Kalpakanchery", "Karulai",
    "Koottilangadi", "Kuruva", "Makkaraparamba", "Mankada",
    "Marakkara", "Melattur", "Moorkanad", "Moothedam", "Nannambra",
    "Neduva", "Oorakam", "Othukkungal", "Pallippuram",
    "Perinthalmanna", "Pookkottur", "Pulamanthole",
    "Puzhakkattiri", "Thalakkad", "Thirunavaya", "Trikkalangode",
    "Urangattiri", "Vazhakkad", "Vengara", "Vettathur"
  ],

  "Kozhikode": [
    "Arikkulam", "Atholi", "Ayancheri", "Balussery", "Chekkiad",
    "Chemancheri", "Chengottukavu", "Chorode", "Edacheri", "Eramala",
    "Feroke", "Kadalundi", "Kakkur", "Kattippara", "Kizhakkoth",
    "Kodenchery", "Kodiyathur", "Koodaranji", "Koorachundu",
    "Kottur", "Kunnamangalam", "Madavoor", "Mavoor", "Moodadi",
    "Nadapuram", "Naduvannur", "Narikkuni", "Omassery",
    "Panangad", "Payyoli", "Perambra", "Purameri", "Thiruvallur",
    "Thuneri", "Ulliyeri", "Valayam", "Vanimel", "Vellimadukunnu"
  ],

  "Wayanad": [
    "Ambalavayal", "Edavaka", "Kaniyambetta", "Kottathara",
    "Krishnagiri", "Mananthavady", "Meenangadi", "Meppadi",
    "Moopainad", "Muttil", "Nenmeni", "Noolpuzha",
    "Panamaram", "Pozhuthana", "Pulpally", "Sulthan Bathery",
    "Thavinhal", "Thirunelly", "Thondernad", "Vellamunda"
  ],

  "Kannur": [
    "Ancharakandi", "Aralam", "Ayyankunnu", "Azhikode", "Chapparapadava",
    "Chengalai", "Cherukunnu", "Cheruthazham", "Chembilode",
    "Chirakkal", "Dharmadam", "Eramam-Kuttoor", "Irikkur",
    "Kadambur", "Kalliasseri", "Kanichar", "Kannapuram",
    "Kanhirangad", "Kanhiraram", "Keezhallur", "Koodali",
    "Kottiyoor", "Kunhimangalam", "Kurumathur", "Madayi",
    "Malappattam", "Mayyil", "Mokeri", "Munderi", "Muzhakkunnu",
    "Nadapuram", "Naduvil", "Narath", "New Mahe", "Pappinisseri",
    "Panoor", "Payam", "Peralassery", "Pinarayi", "Ramanthali",
    "Taliparamba", "Thillankeri", "Valapattanam"
  ],

  "Kasaragod": [
    "Ajanur", "Balal", "Badiyadka", "Bellur", "Bedadka", "Chemnad",
    "Delampady", "Enmakaje", "Kallar", "Karadka", "Kayyur-Cheemeni",
    "Kodom-Belur", "Kumbadaje", "Kuttikol", "Madhur", "Madikai",
    "Mangalpady", "Manjeshwaram", "Mogral-Puthur", "Muliyar",
    "Panathady", "Pullur-Periya", "Trikaripur", "Udma", "Vorkady"
  ]
};