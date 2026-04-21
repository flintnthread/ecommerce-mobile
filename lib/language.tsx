import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import * as JSXRuntime from "react/jsx-runtime";
import * as JSXDevRuntime from "react/jsx-dev-runtime";

export type SupportedLanguage =
  | "English"
  | "Telugu"
  | "Hindi"
  | "Tamil"
  | "Malayalam"
  | "Kannada"
  | "Marathi"
  | "Bengali";

type TranslationMap = Record<string, string>;
type Dictionary = Partial<Record<SupportedLanguage, TranslationMap>>;

const LANGUAGE_STORAGE_KEY = "app:selectedLanguage";
const LANGUAGE_SELECTED_STORAGE_KEY = "app:languageSelected";
const TRANSLATION_CACHE_STORAGE_KEY = "app:translationCache:v1";
const DEFAULT_LANGUAGE: SupportedLanguage = "English";
const BASE_LANGUAGE_CODE = "en";

const languageCodeMap: Record<SupportedLanguage, string> = {
  English: "en",
  Telugu: "te",
  Hindi: "hi",
  Tamil: "ta",
  Malayalam: "ml",
  Kannada: "kn",
  Marathi: "mr",
  Bengali: "bn",
};

const dictionary: Dictionary = {
  Telugu: {
    "Select Language": "భాషను ఎంచుకోండి",
    "Choose your preferred language": "మీకు ఇష్టమైన భాషను ఎంచుకోండి",
    "Go back": "వెనక్కి వెళ్లండి",
    "Search..": "వెతకండి..",
    "View all": "అన్నీ చూడండి",
    "Shop now": "ఇప్పుడే కొనండి",
    "Add to Cart": "కార్ట్‌లో చేర్చండి",
    "Explore": "అన్వేషించండి",
    "Shop All": "అన్నీ కొనండి",
    "See all": "అన్నీ చూడండి",
    "Loading products...": "ఉత్పత్తులు లోడ్ అవుతున్నాయి...",
    "No products found.": "ఉత్పత్తులు కనబడలేదు.",
    "Allow FlintnThread to send you notifications?": "FlintnThread మీకు నోటిఫికేషన్లు పంపడానికి అనుమతించాలా?",
    "Allow": "అనుమతించు",
    "Don't Allow": "అనుమతించవద్దు",
    "Allow Maps to access this device's precise location?": "ఈ పరికరపు ఖచ్చితమైన స్థానాన్ని Maps యాక్సెస్ చేయడానికి అనుమతించాలా?",
    "Precise": "ఖచ్చితమైనది",
    "Approximate": "సుమారుగా",
    "While using the app": "యాప్ ఉపయోగిస్తున్నప్పుడు",
    "Only this time": "ఈసారి మాత్రమే",
    "Don't allow": "అనుమతించవద్దు",
    "Please enter Email or Mobile Number": "దయచేసి ఇమెయిల్ లేదా మొబైల్ నంబర్ నమోదు చేయండి",
    "Invalid Input": "చెల్లని ఇన్‌పుట్",
    "Enter valid Email or 10-digit Mobile Number": "చెల్లుబాటు అయ్యే ఇమెయిల్ లేదా 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి",
    "Please accept terms & conditions": "దయచేసి నియమాలు మరియు షరతులను అంగీకరించండి",
    "OTP Sent": "OTP పంపబడింది",
    "OTP sent to your email": "OTP మీ ఇమెయిల్‌కు పంపబడింది",
    "OTP sent to your mobile": "OTP మీ మొబైల్‌కు పంపబడింది",
    "Failed to send OTP": "OTP పంపడం విఫలమైంది",
    "Server not reachable": "సర్వర్ అందుబాటులో లేదు",
    "welcome back 👋": "తిరిగి స్వాగతం 👋",
    "Sign In or create account": "సైన్ ఇన్ చేయండి లేదా ఖాతా సృష్టించండి",
    "Email or Mobile Number": "ఇమెయిల్ లేదా మొబైల్ నంబర్",
    "By continue you agree to flint & thread terms & conditions": "కొనసాగించడం ద్వారా మీరు flint & thread నియమాలు మరియు షరతులను అంగీకరిస్తారు",
    "and along with privacy policy": "అలాగే గోప్యతా విధానాన్ని కూడా",
    "Sign in to continue": "కొనసాగడానికి సైన్ ఇన్ చేయండి",
    "New to FlintThread?": "FlintThread‌కు కొత్తవారా?",
    "Create an account": "ఖాతా సృష్టించండి",
    "Continue with Google": "Google తో కొనసాగించండి",
    "Open promotional offer": "ప్రచార ఆఫర్‌ను తెరువు",
    "Hi, ": "హాయ్, ",
    "New finds await": "కొత్త ఎంపికలు ఎదురుచూస్తున్నాయి",
    "Top Picks for You": "మీ కోసం టాప్ ఎంపికలు",
    "View all top picks": "అన్ని టాప్ ఎంపికలను చూడండి",
    "Suggested For You": "మీ కోసం సూచించినవి",
    "Handpicked just for you": "మీ కోసం ప్రత్యేకంగా ఎంపిక చేసినవి",
    "Rate Your Recent Purchase": "మీ ఇటీవల కొనుగోలును రేట్ చేయండి",
    "Recommended for you": "మీ కోసం సిఫార్సు చేసినవి",
    "More picks": "మరిన్ని ఎంపికలు",
    "Deals and essentials picked today": "ఈరోజు ఎంపిక చేసిన డీల్స్ మరియు అవసరమైనవి",
    "See all recommended products": "సిఫార్సు చేసిన అన్ని ఉత్పత్తులను చూడండి",
    "Load more recommended products": "మరిన్ని సిఫార్సు ఉత్పత్తులను లోడ్ చేయండి",
    "Load more": "ఇంకా లోడ్ చేయండి",
    "Search by area, street name, pin code": "ప్రాంతం, వీధి పేరు, పిన్ కోడ్ ద్వారా వెతకండి",
    "Use my current location": "నా ప్రస్తుత స్థానాన్ని ఉపయోగించు",
    "Allow access to location": "స్థానానికి యాక్సెస్ అనుమతించు",
    "Saved addresses": "సేవ్ చేసిన చిరునామాలు",
    "+ Add New": "+ కొత్తది జోడించండి",
    "Festive Picks": "పండుగ ఎంపికలు",
    "ACCESSORIES GIFTING GUIDE": "యాక్సెసరీస్ గిఫ్టింగ్ గైడ్",
    "Shop Festive": "పండుగ కొనుగోలు చేయండి",
    "FESTIVE EDIT": "పండుగ ప్రత్యేక ఎడిట్",
    "Festivities, but make it": "పండుగ వేళలు, కానీ దీనిని చేయండి",
    "stylish": "స్టైలిష్",
    "HOME GLOW": "ఇంటి మెరుపు",
    "Light up Home": "ఇంటిని వెలిగించండి",
    "STYLE DROP": "స్టైల్ డ్రాప్",
    "Festive Glam": "పండుగ గ్లామ్",
    "Top Collection": "టాప్ కలెక్షన్",
    "Accessories you will love": "మీరు ఇష్టపడే యాక్సెసరీస్",
    "Accessories Spotlight": "యాక్సెసరీస్ స్పాట్‌లైట్",
    "Shop the look": "ఈ లుక్‌ను కొనండి",
    "Bags": "బ్యాగులు",
    "Handbags, totes & everyday style": "హ్యాండ్‌బ్యాగ్స్, టోట్స్ మరియు రోజువారీ స్టైల్",
    "Accessory Style Lab": "యాక్సెసరీ స్టైల్ ల్యాబ్",
    "Create your signature look": "మీ సిగ్నేచర్ లుక్ సృష్టించండి",
    "Try now": "ఇప్పుడే ప్రయత్నించండి",
    "Style": "స్టైల్",
    "Lab": "ల్యాబ్",
    "Ad": "ప్రకటన",
    "Watch and shop accessories": "చూసి యాక్సెసరీస్ కొనండి",
    "Discover your next signature style": "మీ తదుపరి సిగ్నేచర్ స్టైల్‌ను కనుగొనండి",
    "Belts & Caps": "బెల్ట్స్ & క్యాప్స్",
    "Leather belts, buckles & headwear": "లెదర్ బెల్ట్స్, బకిల్స్ మరియు హెడ్వేర్",
    "HOT PICKS": "హాట్ పిక్స్",
    "Offer price": "ఆఫర్ ధర",
    "GADGETS & ADD-ONS": "గ్యాడ్జెట్లు & యాడ్-ఆన్స్",
    "Gadgets Accessories": "గ్యాడ్జెట్ యాక్సెసరీస్",
    "GADGET SUBCATEGORIES": "గ్యాడ్జెట్ ఉపవర్గాలు",
    "Gadget highlights": "గ్యాడ్జెట్ ముఖ్యాంశాలు",
    "For the": "కోసం",
    "Jewellery": "నగలు",
    "ACCESSORIES": "యాక్సెసరీస్",
    "WATCHES": "గడియారాలు",
    "Unique": "ప్రత్యేకమైన",
    "Picks": "ఎంపికలు",
    "Fresh accessories to finish your look": "మీ లుక్ పూర్తి చేయడానికి తాజా యాక్సెసరీస్",
    "Hide": "దాచు",
    "View All": "అన్నీ చూడండి",
    "Shop": "కొనండి",
    "view details": "వివరాలు చూడండి",
    "wishlist": "విష్‌లిస్ట్",
    "Add to cart": "కార్ట్‌లో చేర్చండి",
    "ALL": "అన్నీ",
    "PRODUCTS": "ఉత్పత్తులు",
    "items": "అంశాలు",
    "Loading products…": "ఉత్పత్తులు లోడ్ అవుతున్నాయి…",
    "CATEGORY": "వర్గం",
    "BEST OF DRESS": "ఉత్తమ దుస్తులు",
    "TRENDING DRESSES": "ట్రెండింగ్ దుస్తులు",
    "LATEST PRODUCTS": "తాజా ఉత్పత్తులు",
    "SIMILAR PRODUCTS": "సమాన ఉత్పత్తులు",
    "WISHLIST": "విష్‌లిస్ట్",
    "Your wishlist is empty": "మీ విష్‌లిస్ట్ ఖాళీగా ఉంది",
    "Tap the heart on a product to save it here": "ఇక్కడ సేవ్ చేయడానికి ఉత్పత్తిపై హార్ట్ గుర్తును నొక్కండి",
    "Choose options": "ఎంపికలను ఎంచుకోండి",
    "Open the product page, pick size and color, then add to wishlist.": "ఉత్పత్తి పేజీని తెరచి, సైజ్ మరియు రంగు ఎంచుకుని, తరువాత విష్‌లిస్ట్‌కు జోడించండి.",
    "was removed from your wishlist.": "మీ విష్‌లిస్ట్ నుండి తొలగించబడింది.",
    "Wishlist could not be updated. Please try again.": "విష్‌లిస్ట్ నవీకరించలేకపోయాం. దయచేసి మళ్లీ ప్రయత్నించండి.",
    "Remove item": "అంశాన్ని తొలగించండి",
    "Remove": "తొలగించు",
    "from your wishlist?": "మీ విష్‌లిస్ట్ నుండి?",
    "Cancel": "రద్దు",
    "Item has been removed from your wishlist.": "అంశం మీ విష్‌లిస్ట్ నుండి తొలగించబడింది.",
    "Could not remove this item.": "ఈ అంశాన్ని తొలగించలేకపోయాం.",
    "Cart": "కార్ట్",
    "SHOP BY": "ద్వారా కొనండి",
  },
  Hindi: {
    "Select Language": "भाषा चुनें",
    "Choose your preferred language": "अपनी पसंदीदा भाषा चुनें",
    "Go back": "वापस जाएं",
    "Search..": "खोजें..",
    "View all": "सभी देखें",
    "Shop now": "अभी खरीदें",
    "Add to Cart": "कार्ट में जोड़ें",
    "Explore": "एक्सप्लोर करें",
    "Shop All": "सभी खरीदें",
    "See all": "सभी देखें",
    "Loading products...": "प्रोडक्ट लोड हो रहे हैं...",
    "No products found.": "कोई प्रोडक्ट नहीं मिला।",
    "Allow FlintnThread to send you notifications?": "क्या FlintnThread आपको नोटिफिकेशन भेजने की अनुमति दे?",
    "Allow": "अनुमति दें",
    "Don't Allow": "अनुमति न दें",
    "Allow Maps to access this device's precise location?": "क्या Maps को इस डिवाइस की सटीक लोकेशन एक्सेस करने दें?",
    "Precise": "सटीक",
    "Approximate": "अनुमानित",
    "While using the app": "ऐप का उपयोग करते समय",
    "Only this time": "केवल इस बार",
    "Don't allow": "अनुमति न दें",
    "Please enter Email or Mobile Number": "कृपया ईमेल या मोबाइल नंबर दर्ज करें",
    "Invalid Input": "अमान्य इनपुट",
    "Enter valid Email or 10-digit Mobile Number": "मान्य ईमेल या 10 अंकों का मोबाइल नंबर दर्ज करें",
    "Please accept terms & conditions": "कृपया नियम और शर्तें स्वीकार करें",
    "OTP Sent": "OTP भेजा गया",
    "OTP sent to your email": "OTP आपके ईमेल पर भेजा गया",
    "OTP sent to your mobile": "OTP आपके मोबाइल पर भेजा गया",
    "Failed to send OTP": "OTP भेजने में विफल",
    "Server not reachable": "सर्वर तक पहुंच नहीं है",
    "welcome back 👋": "वापसी पर स्वागत है 👋",
    "Sign In or create account": "साइन इन करें या अकाउंट बनाएं",
    "Email or Mobile Number": "ईमेल या मोबाइल नंबर",
    "By continue you agree to flint & thread terms & conditions": "जारी रखकर आप flint & thread के नियम और शर्तों से सहमत होते हैं",
    "and along with privacy policy": "और साथ ही गोपनीयता नीति से भी",
    "Sign in to continue": "जारी रखने के लिए साइन इन करें",
    "New to FlintThread?": "FlintThread पर नए हैं?",
    "Create an account": "अकाउंट बनाएं",
    "Continue with Google": "Google के साथ जारी रखें",
    "Open promotional offer": "प्रमोशनल ऑफर खोलें",
    "Hi, ": "नमस्ते, ",
    "New finds await": "नई पसंद आपका इंतजार कर रही है",
    "Top Picks for You": "आपके लिए शीर्ष पसंद",
    "View all top picks": "सभी शीर्ष पसंद देखें",
    "Suggested For You": "आपके लिए सुझाया गया",
    "Handpicked just for you": "सिर्फ आपके लिए चुना गया",
    "Rate Your Recent Purchase": "अपनी हाल की खरीदारी को रेट करें",
    "Recommended for you": "आपके लिए अनुशंसित",
    "More picks": "और चुनिंदा विकल्प",
    "Deals and essentials picked today": "आज चुने गए ऑफर और जरूरी सामान",
    "See all recommended products": "सभी अनुशंसित प्रोडक्ट देखें",
    "Load more recommended products": "और अनुशंसित प्रोडक्ट लोड करें",
    "Load more": "और लोड करें",
    "Search by area, street name, pin code": "क्षेत्र, सड़क नाम, पिन कोड से खोजें",
    "Use my current location": "मेरा वर्तमान स्थान उपयोग करें",
    "Allow access to location": "लोकेशन एक्सेस की अनुमति दें",
    "Saved addresses": "सेव किए गए पते",
    "+ Add New": "+ नया जोड़ें",
    "Festive Picks": "त्योहारी पसंद",
    "ACCESSORIES GIFTING GUIDE": "एक्सेसरीज़ गिफ्टिंग गाइड",
    "Shop Festive": "त्योहारी खरीदारी करें",
    "FESTIVE EDIT": "फेस्टिव एडिट",
    "Festivities, but make it": "त्योहारों को बनाएं",
    "stylish": "स्टाइलिश",
    "HOME GLOW": "होम ग्लो",
    "Light up Home": "घर को रोशन करें",
    "STYLE DROP": "स्टाइल ड्रॉप",
    "Festive Glam": "फेस्टिव ग्लैम",
    "Top Collection": "शीर्ष कलेक्शन",
    "Accessories you will love": "एक्सेसरीज़ जिन्हें आप पसंद करेंगे",
    "Accessories Spotlight": "एक्सेसरीज़ स्पॉटलाइट",
    "Shop the look": "यह लुक खरीदें",
    "Bags": "बैग्स",
    "Handbags, totes & everyday style": "हैंडबैग्स, टोट्स और रोज़मर्रा का स्टाइल",
    "Accessory Style Lab": "एक्सेसरी स्टाइल लैब",
    "Create your signature look": "अपना सिग्नेचर लुक बनाएं",
    "Try now": "अभी आज़माएं",
    "Style": "स्टाइल",
    "Lab": "लैब",
    "Ad": "विज्ञापन",
    "Watch and shop accessories": "देखें और एक्सेसरीज़ खरीदें",
    "Discover your next signature style": "अपना अगला सिग्नेचर स्टाइल खोजें",
    "Belts & Caps": "बेल्ट्स और कैप्स",
    "Leather belts, buckles & headwear": "लेदर बेल्ट्स, बकल्स और हेडवियर",
    "HOT PICKS": "हॉट पिक्स",
    "Offer price": "ऑफर कीमत",
    "GADGETS & ADD-ONS": "गैजेट्स और ऐड-ऑन्स",
    "Gadgets Accessories": "गैजेट एक्सेसरीज़",
    "GADGET SUBCATEGORIES": "गैजेट उपश्रेणियां",
    "Gadget highlights": "गैजेट हाइलाइट्स",
    "For the": "के लिए",
    "Jewellery": "ज्वेलरी",
    "ACCESSORIES": "एक्सेसरीज़",
    "WATCHES": "घड़ियां",
    "Unique": "अनोखे",
    "Picks": "चयन",
    "Fresh accessories to finish your look": "आपका लुक पूरा करने के लिए ताज़ा एक्सेसरीज़",
    "Hide": "छुपाएं",
    "View All": "सभी देखें",
    "Shop": "खरीदें",
    "view details": "विवरण देखें",
    "wishlist": "विशलिस्ट",
    "Add to cart": "कार्ट में जोड़ें",
    "ALL": "सभी",
    "PRODUCTS": "प्रोडक्ट्स",
    "items": "आइटम्स",
    "Loading products…": "प्रोडक्ट्स लोड हो रहे हैं…",
    "CATEGORY": "श्रेणी",
    "BEST OF DRESS": "बेहतरीन ड्रेसें",
    "TRENDING DRESSES": "ट्रेंडिंग ड्रेसें",
    "LATEST PRODUCTS": "नवीनतम प्रोडक्ट्स",
    "SIMILAR PRODUCTS": "मिलते-जुलते प्रोडक्ट्स",
    "WISHLIST": "विशलिस्ट",
    "Your wishlist is empty": "आपकी विशलिस्ट खाली है",
    "Tap the heart on a product to save it here": "यहां सेव करने के लिए प्रोडक्ट पर हार्ट दबाएं",
    "Choose options": "विकल्प चुनें",
    "Open the product page, pick size and color, then add to wishlist.": "प्रोडक्ट पेज खोलें, साइज और रंग चुनें, फिर विशलिस्ट में जोड़ें।",
    "was removed from your wishlist.": "आपकी विशलिस्ट से हटा दिया गया।",
    "Wishlist could not be updated. Please try again.": "विशलिस्ट अपडेट नहीं हो सकी। कृपया फिर से कोशिश करें।",
    "Remove item": "आइटम हटाएं",
    "Remove": "हटाएं",
    "from your wishlist?": "आपकी विशलिस्ट से?",
    "Cancel": "रद्द करें",
    "Item has been removed from your wishlist.": "आइटम आपकी विशलिस्ट से हटा दिया गया है।",
    "Could not remove this item.": "इस आइटम को हटाया नहीं जा सका।",
    "Cart": "कार्ट",
    "SHOP BY": "के अनुसार खरीदें",
  },
  Tamil: {
    "Select Language": "மொழியைத் தேர்ந்தெடுக்கவும்",
    "Choose your preferred language": "உங்களுக்கு விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்",
    "Go back": "பின்செல்",
  },
  Malayalam: {
    "Select Language": "ഭാഷ തിരഞ്ഞെടുക്കുക",
    "Choose your preferred language": "നിങ്ങൾക്ക് ഇഷ്ടമുള്ള ഭാഷ തിരഞ്ഞെടുക്കുക",
    "Go back": "തിരികെ പോകുക",
  },
  Kannada: {
    "Select Language": "ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    "Choose your preferred language": "ನಿಮ್ಮ ಇಷ್ಟದ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    "Go back": "ಹಿಂದೆ ಹೋಗಿ",
  },
  Marathi: {
    "Select Language": "भाषा निवडा",
    "Choose your preferred language": "तुमची पसंतीची भाषा निवडा",
    "Go back": "मागे जा",
  },
  Bengali: {
    "Select Language": "ভাষা নির্বাচন করুন",
    "Choose your preferred language": "আপনার পছন্দের ভাষা নির্বাচন করুন",
    "Go back": "পিছনে যান",
  },
};

type LanguageContextValue = {
  selectedLanguage: SupportedLanguage;
  setSelectedLanguage: (language: SupportedLanguage) => Promise<void>;
  tr: (key: string) => string;
  isHydrated: boolean;
  hasSelectedLanguage: boolean;
  translationRevision: number;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

let runtimeTranslator: ((value: string) => string) | null = null;
let runtimeTranslationEnabled = true;
let runtimePatchInstalled = false;
let originalCreateElement: typeof React.createElement | null = null;
let originalJsx: ((type: unknown, props: Record<string, unknown> | null, key?: string) => unknown) | null = null;
let originalJsxs: ((type: unknown, props: Record<string, unknown> | null, key?: string) => unknown) | null = null;
let originalJsxDev:
  | ((type: unknown, props: Record<string, unknown> | null, key: string | undefined, isStaticChildren: boolean, source: unknown, self: unknown) => unknown)
  | null = null;
let originalAlert: typeof Alert.alert | null = null;
const translatablePropKeys = new Set([
  "children",
  "placeholder",
  "accessibilityLabel",
  "accessibilityHint",
  "title",
  "subtitle",
  "label",
  "description",
  "text",
  "headerTitle",
  "tabBarLabel",
  "buttonText",
  "message",
  "confirmText",
  "cancelText",
  "okText",
]);

function isLikelyTranslatableKey(key: string) {
  if (translatablePropKeys.has(key)) return true;
  const lower = key.toLowerCase();
  if (
    lower.includes("url") ||
    lower.includes("uri") ||
    lower.includes("path") ||
    lower.includes("image") ||
    lower.includes("icon") ||
    lower.includes("id") ||
    lower.includes("sku") ||
    lower.includes("code")
  ) {
    return false;
  }
  return (
    lower.endsWith("title") ||
    lower.endsWith("label") ||
    lower.endsWith("text") ||
    lower.endsWith("message") ||
    lower.endsWith("placeholder") ||
    lower.endsWith("subtitle") ||
    lower === "name" ||
    lower.endsWith("name") ||
    lower === "brand" ||
    lower.endsWith("brand") ||
    lower.includes("description") ||
    lower.includes("category")
  );
}

function isTechnicalKey(key: string) {
  const lower = key.toLowerCase();
  return (
    lower === "name" ||
    lower === "route" ||
    lower === "routename" ||
    lower === "screen" ||
    lower === "screenname" ||
    lower === "pathname" ||
    lower === "href" ||
    lower === "key" ||
    lower === "id" ||
    lower.endsWith("id") ||
    lower.includes("url") ||
    lower.includes("uri") ||
    lower.includes("path") ||
    lower.includes("image") ||
    lower.includes("icon") ||
    lower.includes("sku") ||
    lower.includes("code") ||
    lower.includes("style") ||
    lower.includes("class") ||
    lower === "testid"
  );
}

function shouldTranslateFreeText(value: string) {
  const s = value.trim();
  if (!s) return false;
  if (/^#?[0-9a-f]{3,8}$/i.test(s)) return false;
  if (/^[\d\s.,:%+\-_/()[\]{}]+$/.test(s)) return false;
  return /[A-Za-z\u00C0-\u024F\u0400-\u04FF\u0900-\u097F]/.test(s);
}

async function translateViaGoogle(source: string, target: string, text: string) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(
    text
  )}`;
  const response = await fetch(url);
  if (!response.ok) return "";
  const payload = await response.json();
  const translated = Array.isArray(payload?.[0])
    ? payload[0].map((part: unknown[]) => (Array.isArray(part) ? String(part[0] ?? "") : "")).join("")
    : "";
  return translated.trim();
}

async function translateViaMyMemory(source: string, target: string, text: string) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
  const response = await fetch(url);
  if (!response.ok) return "";
  const payload = await response.json();
  const translated = String(payload?.responseData?.translatedText ?? "").trim();
  return translated;
}

async function translateViaLibreTranslate(source: string, target: string, text: string) {
  const response = await fetch("https://libretranslate.com/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: text,
      source,
      target,
      format: "text",
    }),
  });
  if (!response.ok) return "";
  const payload = await response.json();
  return String(payload?.translatedText ?? "").trim();
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function translateStringRuntime(value: string) {
  if (!runtimeTranslationEnabled || !runtimeTranslator) return value;
  if (!value.trim()) return value;
  return runtimeTranslator(value);
}

function translateChildrenRuntime(children: unknown): unknown {
  if (typeof children === "string") return translateStringRuntime(children);
  if (Array.isArray(children)) return children.map((item) => translateChildrenRuntime(item));
  return children;
}

function translateNestedObjectRuntime(obj: Record<string, unknown>, depth: number): Record<string, unknown> {
  if (depth > 4) return obj;
  const next: Record<string, unknown> = { ...obj };
  for (const key of Object.keys(next)) {
    const value = next[key];
    if (typeof value === "string" && isLikelyTranslatableKey(key)) {
      next[key] = translateStringRuntime(value);
      continue;
    }
    if (Array.isArray(value)) {
      next[key] = value.map((item) => {
        if (typeof item === "string" && isLikelyTranslatableKey(key)) {
          return translateStringRuntime(item);
        }
        if (item && typeof item === "object" && !Array.isArray(item)) {
          return translateNestedObjectRuntime(item as Record<string, unknown>, depth + 1);
        }
        return item;
      });
      continue;
    }
    if (value && typeof value === "object") {
      next[key] = translateNestedObjectRuntime(value as Record<string, unknown>, depth + 1);
    }
  }
  return next;
}

function translateDynamicContentRuntime(value: unknown, depth: number): unknown {
  if (depth > 4) return value;
  if (typeof value === "string") return translateStringRuntime(value);
  if (Array.isArray(value)) {
    return value.map((item) => translateDynamicContentRuntime(item, depth + 1));
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const next: Record<string, unknown> = { ...obj };
    for (const key of Object.keys(next)) {
      const item = next[key];
      if (typeof item === "string" && !isTechnicalKey(key) && (isLikelyTranslatableKey(key) || shouldTranslateFreeText(item))) {
        next[key] = translateStringRuntime(item);
      } else if (Array.isArray(item) || (item && typeof item === "object")) {
        next[key] = translateDynamicContentRuntime(item, depth + 1);
      }
    }
    return next;
  }
  return value;
}

function translatePropsRuntime(props: Record<string, unknown> | null) {
  if (!props) return props;
  const nextProps: Record<string, unknown> = { ...props };
  for (const key of Object.keys(nextProps)) {
    const value = nextProps[key];
    // Never translate navigation/screen identity keys (route ids, screen names).
    if (
      key === "name" ||
      key === "routeName" ||
      key === "screen" ||
      key === "screenName"
    ) {
      continue;
    }
    if (typeof value === "string" && !isTechnicalKey(key) && (translatablePropKeys.has(key) || isLikelyTranslatableKey(key) || shouldTranslateFreeText(value))) {
      nextProps[key] = translateStringRuntime(value);
      continue;
    }
    if (Array.isArray(value) && !isTechnicalKey(key)) {
      nextProps[key] = value.map((item) => (typeof item === "string" && shouldTranslateFreeText(item) ? translateStringRuntime(item) : item));
      continue;
    }
    if (value && typeof value === "object" && (key === "options" || key === "screenOptions" || key === "headerSearchBarOptions")) {
      nextProps[key] = translateNestedObjectRuntime(value as Record<string, unknown>, 0);
      continue;
    }
    if (
      key === "item" ||
      key === "items" ||
      key === "product" ||
      key === "products" ||
      key === "data" ||
      key === "result" ||
      key === "results" ||
      key === "payload" ||
      key === "row" ||
      key === "rows" ||
      key === "category" ||
      key === "categories" ||
      key === "subcategory" ||
      key === "subcategories" ||
      key === "content" ||
      key === "list"
    ) {
      nextProps[key] = translateDynamicContentRuntime(value, 0);
      continue;
    }
    if (value && typeof value === "object" && (key.toLowerCase().includes("product") || key.toLowerCase().includes("category"))) {
      nextProps[key] = translateDynamicContentRuntime(value, 0);
    }
  }
  return nextProps;
}

export function installRuntimeTranslationPatch() {
  if (runtimePatchInstalled) return;
  runtimePatchInstalled = true;
  originalCreateElement = React.createElement;
  originalAlert = Alert.alert;

  React.createElement = ((type: unknown, props: Record<string, unknown> | null, ...children: unknown[]) => {
    const nextProps = translatePropsRuntime(props);
    const nextChildren = children.map((child) => translateChildrenRuntime(child));
    return originalCreateElement!(type as never, nextProps as never, ...(nextChildren as never[]));
  }) as typeof React.createElement;

  // React Native with automatic JSX transform uses jsx/jsxs from react/jsx-runtime.
  // Patch those too so screens not using React.createElement are translated.
  originalJsx = JSXRuntime.jsx as typeof originalJsx;
  originalJsxs = JSXRuntime.jsxs as typeof originalJsxs;
  originalJsxDev = JSXDevRuntime.jsxDEV as typeof originalJsxDev;

  const runtimeWrapper = (originalFn: typeof originalJsx) =>
    ((type: unknown, props: Record<string, unknown> | null, key?: string) => {
      const nextProps = translatePropsRuntime(props);
      return originalFn?.(type, nextProps, key);
    }) as typeof originalJsx;

  try {
    Object.defineProperty(JSXRuntime, "jsx", {
      configurable: true,
      writable: true,
      value: runtimeWrapper(originalJsx),
    });
    Object.defineProperty(JSXRuntime, "jsxs", {
      configurable: true,
      writable: true,
      value: runtimeWrapper(originalJsxs),
    });
  } catch {
    // If runtime export is locked, keep createElement patch as fallback.
  }

  // Dev runtime (Expo/React development build) uses jsxDEV.
  try {
    Object.defineProperty(JSXDevRuntime, "jsxDEV", {
      configurable: true,
      writable: true,
      value: (
        type: unknown,
        props: Record<string, unknown> | null,
        key: string | undefined,
        isStaticChildren: boolean,
        source: unknown,
        self: unknown
      ) => {
        const nextProps = translatePropsRuntime(props);
        return originalJsxDev?.(type, nextProps, key, isStaticChildren, source, self);
      },
    });
  } catch {
    // If jsxDEV export is locked, keep other patches as fallback.
  }

  // Imperative React Native alerts are outside JSX and need explicit translation.
  try {
    Alert.alert = ((title, message, buttons, options) => {
      const translatedTitle = typeof title === "string" ? translateStringRuntime(title) : title;
      const translatedMessage = typeof message === "string" ? translateStringRuntime(message) : message;
      const translatedButtons = Array.isArray(buttons)
        ? buttons.map((button) => {
            if (!button) return button;
            return {
              ...button,
              text: typeof button.text === "string" ? translateStringRuntime(button.text) : button.text,
            };
          })
        : buttons;
      return originalAlert?.(translatedTitle, translatedMessage, translatedButtons, options);
    }) as typeof Alert.alert;
  } catch {
    // If Alert API is locked, keep JSX patch paths as fallback.
  }
}

export function setRuntimeTranslationConfig(config: { enabled: boolean; translator: (value: string) => string }) {
  runtimeTranslationEnabled = config.enabled;
  runtimeTranslator = config.translator;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [selectedLanguage, setSelectedLanguageState] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);
  const [translationCache, setTranslationCache] = useState<Record<string, string>>({});
  const [translationRevision, setTranslationRevision] = useState(0);
  const pendingTranslationsRef = useRef<Set<string>>(new Set());

  const saveTranslationCache = useCallback(async (cache: Record<string, string>) => {
    try {
      await AsyncStorage.setItem(TRANSLATION_CACHE_STORAGE_KEY, JSON.stringify(cache));
    } catch {
      // Ignore cache write failures; translation still works for current session.
    }
  }, []);

  const fetchAndCacheTranslation = useCallback(
    async (language: SupportedLanguage, key: string) => {
      const targetCode = languageCodeMap[language];
      if (!targetCode || targetCode === BASE_LANGUAGE_CODE) return;

      const cacheKey = `${targetCode}::${key}`;
      if (pendingTranslationsRef.current.has(cacheKey)) return;
      pendingTranslationsRef.current.add(cacheKey);

      try {
        let translated = "";
        try {
          translated = await withTimeout(
            translateViaGoogle(BASE_LANGUAGE_CODE, targetCode, key),
            3500
          );
        } catch {
          translated = "";
        }
        if (!translated) {
          try {
            translated = await withTimeout(
              translateViaMyMemory(BASE_LANGUAGE_CODE, targetCode, key),
              4000
            );
          } catch {
            translated = "";
          }
        }
        if (!translated) {
          try {
            translated = await withTimeout(
              translateViaLibreTranslate(BASE_LANGUAGE_CODE, targetCode, key),
              4000
            );
          } catch {
            translated = "";
          }
        }
        if (!translated.trim()) return;

        setTranslationCache((prev) => {
          if (prev[cacheKey]) return prev;
          const next = { ...prev, [cacheKey]: translated };
          void saveTranslationCache(next);
          setTranslationRevision((v) => v + 1);
          return next;
        });
      } catch {
        // Ignore network/parse failures and keep fallback text.
      } finally {
        pendingTranslationsRef.current.delete(cacheKey);
      }
    },
    [saveTranslationCache]
  );

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      AsyncStorage.getItem(LANGUAGE_STORAGE_KEY),
      AsyncStorage.getItem(LANGUAGE_SELECTED_STORAGE_KEY),
      AsyncStorage.getItem(TRANSLATION_CACHE_STORAGE_KEY),
    ])
      .then(([languageValue, selectedFlagValue, cacheValue]) => {
        if (!isMounted) return;
        if (languageValue) {
          setSelectedLanguageState(languageValue as SupportedLanguage);
        }
        if (selectedFlagValue === "1" || selectedFlagValue === "true") {
          setHasSelectedLanguage(true);
        }
        if (cacheValue) {
          try {
            const parsed = JSON.parse(cacheValue) as Record<string, string>;
            if (parsed && typeof parsed === "object") {
              setTranslationCache(parsed);
            }
          } catch {
            // Ignore malformed stored cache and rebuild gradually.
          }
        }
      })
      .finally(() => {
        if (isMounted) setIsHydrated(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const setSelectedLanguage = useCallback(async (language: SupportedLanguage) => {
    setSelectedLanguageState(language);
    setHasSelectedLanguage(true);
    await Promise.all([
      AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language),
      AsyncStorage.setItem(LANGUAGE_SELECTED_STORAGE_KEY, "1"),
    ]);
  }, []);

  const tr = useCallback(
    (key: string) => {
      if (!hasSelectedLanguage) return key;
      if (selectedLanguage === "English") return key;

      const translated = dictionary[selectedLanguage]?.[key];
      if (translated) return translated;

      const langCode = languageCodeMap[selectedLanguage];
      const cacheKey = `${langCode}::${key}`;
      const cached = translationCache[cacheKey];
      if (cached) return cached;

      void fetchAndCacheTranslation(selectedLanguage, key);
      return translated ?? key;
    },
    [fetchAndCacheTranslation, hasSelectedLanguage, selectedLanguage, translationCache]
  );

  const value = useMemo(
    () => ({
      selectedLanguage,
      setSelectedLanguage,
      tr,
      isHydrated,
      hasSelectedLanguage,
      translationRevision,
    }),
    [selectedLanguage, setSelectedLanguage, tr, isHydrated, hasSelectedLanguage, translationRevision]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
