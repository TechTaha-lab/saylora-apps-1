import { db } from "@workspace/db";
import {
  categoriesTable,
  countriesTable,
  citiesTable,
} from "@workspace/db";
import { logger } from "./logger";

const CATEGORIES = [
  { name: "Restaurant", slug: "restaurant", icon: "restaurant" },
  { name: "Cafe", slug: "cafe", icon: "cafe" },
  { name: "Bakery", slug: "bakery", icon: "bakery" },
  { name: "Clothing Store", slug: "clothing-store", icon: "shirt" },
  { name: "Supermarket", slug: "supermarket", icon: "supermarket" },
  { name: "Beauty", slug: "beauty", icon: "beauty" },
  { name: "Flower Shop", slug: "flower-shop", icon: "flower" },
  { name: "Gym", slug: "gym", icon: "gym" },
  { name: "Salon", slug: "salon", icon: "salon" },
  { name: "Electronics", slug: "electronics", icon: "electronics" },
  { name: "Service Business", slug: "service-business", icon: "service" },
  { name: "Pet Shop", slug: "pet-shop", icon: "paw" },
  { name: "Pharmacy", slug: "pharmacy", icon: "pharmacy" },
  { name: "Jewelry", slug: "jewelry", icon: "jewelry" },
  { name: "Furniture", slug: "furniture", icon: "furniture" },
  { name: "Other", slug: "other", icon: "other" },
];

const COUNTRIES_WITH_CITIES = [
  {
    name: "Saudi Arabia",
    code: "SA",
    flag: "🇸🇦",
    dialCode: "+966",
    cities: ["Riyadh", "Jeddah", "Makkah"],
  },
  {
    name: "United Arab Emirates",
    code: "AE",
    flag: "🇦🇪",
    dialCode: "+971",
    cities: ["Dubai", "Abu Dhabi", "Sharjah"],
  },
  {
    name: "Kuwait",
    code: "KW",
    flag: "🇰🇼",
    dialCode: "+965",
    cities: ["Kuwait City", "Hawally", "Salmiya"],
  },
  {
    name: "Qatar",
    code: "QA",
    flag: "🇶🇦",
    dialCode: "+974",
    cities: ["Doha", "Al Wakrah", "Al Khor"],
  },
  {
    name: "Bahrain",
    code: "BH",
    flag: "🇧🇭",
    dialCode: "+973",
    cities: ["Manama", "Riffa", "Muharraq"],
  },
  {
    name: "Oman",
    code: "OM",
    flag: "🇴🇲",
    dialCode: "+968",
    cities: ["Muscat", "Salalah", "Sohar"],
  },
  {
    name: "Egypt",
    code: "EG",
    flag: "🇪🇬",
    dialCode: "+20",
    cities: ["Cairo", "Alexandria", "Giza"],
  },
  {
    name: "Jordan",
    code: "JO",
    flag: "🇯🇴",
    dialCode: "+962",
    cities: ["Amman", "Zarqa", "Irbid"],
  },
  {
    name: "Lebanon",
    code: "LB",
    flag: "🇱🇧",
    dialCode: "+961",
    cities: ["Beirut", "Tripoli", "Sidon"],
  },
  {
    name: "Morocco",
    code: "MA",
    flag: "🇲🇦",
    dialCode: "+212",
    cities: ["Casablanca", "Rabat", "Marrakech"],
  },
  {
    name: "Iraq",
    code: "IQ",
    flag: "🇮🇶",
    dialCode: "+964",
    cities: ["Baghdad", "Basra", "Mosul"],
  },
  {
    name: "Pakistan",
    code: "PK",
    flag: "🇵🇰",
    dialCode: "+92",
    cities: ["Karachi", "Lahore", "Islamabad"],
  },
  {
    name: "India",
    code: "IN",
    flag: "🇮🇳",
    dialCode: "+91",
    cities: ["Mumbai", "Delhi", "Bangalore"],
  },
  {
    name: "Turkey",
    code: "TR",
    flag: "🇹🇷",
    dialCode: "+90",
    cities: ["Istanbul", "Ankara", "Izmir"],
  },
  {
    name: "United Kingdom",
    code: "GB",
    flag: "🇬🇧",
    dialCode: "+44",
    cities: ["London", "Manchester", "Birmingham"],
  },
  {
    name: "United States",
    code: "US",
    flag: "🇺🇸",
    dialCode: "+1",
    cities: ["New York", "Los Angeles", "Chicago"],
  },
];

export async function seedDatabase(): Promise<void> {
  try {
    const existingCategories = await db.select().from(categoriesTable).limit(1);
    if (existingCategories.length > 0) {
      return;
    }

    logger.info("Seeding database...");

    await db.insert(categoriesTable).values(CATEGORIES);

    for (const countryData of COUNTRIES_WITH_CITIES) {
      const { cities, ...country } = countryData;
      const [inserted] = await db
        .insert(countriesTable)
        .values(country)
        .returning();

      await db.insert(citiesTable).values(
        cities.map((name) => ({ name, countryId: inserted.id }))
      );
    }

    logger.info("Database seeded successfully");
  } catch (err) {
    logger.error({ err }, "Failed to seed database");
  }
}
