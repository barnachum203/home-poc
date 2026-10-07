export interface MockHomeInsight {
  icon: string;
  title: string;
  value: string;
}

// POC-only presentation data. These values do not come from Google Maps.
export const MOCK_HOME_INSIGHTS: readonly MockHomeInsight[] = [
  { icon: '🚒', title: 'תחנת כיבוי קרובה', value: 'כ־2.8 ק״מ' },
  { icon: '🌳', title: 'שטח פתוח', value: 'כ־900 מטר' },
  { icon: '🌊', title: 'מקור מים משמעותי', value: 'לא זוהה בסביבה הקרובה' },
];
