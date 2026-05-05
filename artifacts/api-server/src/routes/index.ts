import { Router, type IRouter } from "express";
import healthRouter from "./health";
import statsRouter from "./stats";
import blogRouter from "./blog";
import jobsRouter from "./jobs";
import contactRouter from "./contact";
import statusRouter from "./status";
import partnersRouter from "./partners";
import countriesRouter from "./countries";

const router: IRouter = Router();

router.use(healthRouter);
router.use(statsRouter);
router.use(blogRouter);
router.use(jobsRouter);
router.use(contactRouter);
router.use(statusRouter);
router.use(partnersRouter);
router.use(countriesRouter);

export default router;
