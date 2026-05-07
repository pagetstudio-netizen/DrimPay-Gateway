import { Router, type IRouter } from "express";
import healthRouter from "./health";
import statsRouter from "./stats";
import blogRouter from "./blog";
import jobsRouter from "./jobs";
import contactRouter from "./contact";
import statusRouter from "./status";
import partnersRouter from "./partners";
import countriesRouter from "./countries";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import v2payinRouter from "./v2payin";
import adminRouter from "./admin";
import clapayWebhookRouter from "./clapay-webhook";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(statsRouter);
router.use(blogRouter);
router.use(jobsRouter);
router.use(contactRouter);
router.use(statusRouter);
router.use(partnersRouter);
router.use(countriesRouter);
router.use(dashboardRouter);
router.use(v2payinRouter);
router.use(adminRouter);
router.use(clapayWebhookRouter);

export default router;
