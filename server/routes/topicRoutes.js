import express from "express";
import { semanticKGSearch } from "../controllers/kgSearchController.js";

const router = express.Router();

router.get("/semantic", semanticKGSearch);

export default router;