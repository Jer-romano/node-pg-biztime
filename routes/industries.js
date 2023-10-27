const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");


router.get("/", async function(req, res, next) {
    try {
        const results = await db.query(
            `SELECT i.industry, ARRAY_AGG(ci.comp_code) AS comp_codes
             FROM industries AS i
             LEFT JOIN companies_industries AS ci
                ON i.code = ci.ind_code
             GROUP BY i.industry`
            );
        return res.json({industries: results.rows});
    } catch(err) {
        next(err);
    }
});


router.post("/", async function(req, res, next) {
    try {
      if(!req.body.code || !req.body.industry) {
        throw new ExpressError("Missing required information for industry.", 400);
      }

      const {code, industry} = req.body;
      const result = await db.query(
        `INSERT INTO industries(code, industry)
        VALUES ($1, $2)
        RETURNING code, industry`,
        [code, industry]
      );

      return res.status(201).json({industry: result.rows[0]});

    } catch(err) {
        next(err);
    }
});

/**
 * Associating an industry to a company. I know this should be a 
 * POST request. But I wasn't sure if the parameters should be 
 * specified in the URL or the request body.
 */
router.post("/:ind_code/:comp_code", async function(req, res, next) {
    try {

        const industry = req.params.ind_code;
        const company = req.params.comp_code;

        const ind_check = await db.query(
            `SELECT * 
            FROM industries
            WHERE code = $1`,
            [industry]
        );

        const comp_check = await db.query(
            `SELECT * 
            FROM companies
            WHERE code = $1`,
            [company]
        );

        if(ind_check.rows.length === 0) {
            throw new ExpressError(`Industry with code '${industry}' could not be found`, 404);
        }
        if(comp_check.rows.length === 0) {
            throw new ExpressError(`Company with code '${company}' could not be found`, 404);
        }

      const result = await db.query(
        `INSERT INTO companies_industries(comp_code, ind_code)
        VALUES ($1, $2)
        RETURNING comp_code, ind_code`,
        [company, industry]
      );

      return res.status(201).json({"Added Association": result.rows[0]});

    } catch(err) {
        next(err);
    }
});


module.exports = router;