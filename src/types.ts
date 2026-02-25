export interface Scheme {
  id: number;
  name: string;
  category: string;
  description: string;
  eligibility: string;
  benefits: string;
  state: string;
  language: string;
}

export interface PortalStatus {
  id: number;
  name: string;
  url: string;
  status: 'Online' | 'Offline' | 'Maintenance';
  last_checked: string;
}

export type Language = 'English' | 'Hindi' | 'Bengali' | 'Telugu' | 'Marathi' | 'Tamil' | 'Gujarati' | 'Urdu' | 'Kannada' | 'Odia' | 'Punjabi' | 'Malayalam' | 'Assamese' | 'Maithili' | 'Konkani' | 'Kashmiri' | 'Nepali' | 'Sindhi' | 'Sanskrit' | 'Manipuri';

export const LANGUAGES: { code: string; name: Language; native: string }[] = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
  { code: 'mai', name: 'Maithili', native: 'মৈথিলী' },
  { code: 'kok', name: 'Konkani', native: 'कोंकणी' },
  { code: 'ks', name: 'Kashmiri', native: 'کٲশُر' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली' },
  { code: 'sd', name: 'Sindhi', native: 'سنڌي' },
  { code: 'sa', name: 'Sanskrit', native: 'संस्कृतम्' },
  { code: 'mni', name: 'Manipuri', native: 'মণিপুরী' },
];

export const STATES = [
  'Central', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];
