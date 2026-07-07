import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import countriesRouter from "./countries";
import productsRouter from "./products";
import storeRouter from "./store";
import uploadRouter from "./upload";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(countriesRouter);
router.use(productsRouter);
router.use(storeRouter);
router.use(uploadRouter);
router.use(adminRouter);

export default router;
