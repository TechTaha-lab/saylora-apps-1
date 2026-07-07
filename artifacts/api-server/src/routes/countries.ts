import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { countriesTable, citiesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/countries", async (_req, res): Promise<void> => {
  const countries = await db
    .select()
    .from(countriesTable)
    .orderBy(countriesTable.name);
  res.json(countries);
});

router.get("/cities", async (req, res): Promise<void> => {
  const countryIdRaw = req.query["countryId"];
  const countryId = countryIdRaw ? parseInt(String(countryIdRaw), 10) : null;

  let cities;
  if (countryId && !isNaN(countryId)) {
    cities = await db
      .select()
      .from(citiesTable)
      .where(eq(citiesTable.countryId, countryId))
      .orderBy(citiesTable.name);
  } else {
    cities = await db.select().from(citiesTable).orderBy(citiesTable.name);
  }

  res.json(cities);
});

export default router;
