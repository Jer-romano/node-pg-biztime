const express = require("express");
const slugify = require('slugify');
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");



router.get("/", async function(req, res, next) {
    try {
        const results = await db.query("SELECT * FROM companies");
        return res.json({companies: results.rows});
    } catch(err) {
        next(err);
    }

});

router.get("/:code", async function(req, res, next) {
    try {
        const code = req.params.code;
        const cResult = await db.query(
           `SELECT code, name, description 
            FROM companies
            WHERE code=$1`, [code]);

        const invResult = await db.query(
            `SELECT id
            FROM invoices
            WHERE comp_code=$1`,
            [code]
        );
        if(cResult.rows.length === 0) {
            throw new ExpressError(`Company with code '${code}' could not be found`, 404);
        }

        const indResult = await db.query(
            `SELECT i.industry
            FROM companies AS c
            LEFT JOIN companies_industries AS ci
                ON c.code = ci.comp_code
            LEFT JOIN industries AS i ON ci.ind_code = i.code
            WHERE c.code = $1;`,
            [code]);

        const company = cResult.rows[0];
        const invoices = invResult.rows;
        const industries = indResult.rows;

        company.invoices = invoices.map(inv => inv.id);
        company.industries = industries.map(ind => ind.industry);
        
        return res.json({"company": company});

    } catch(err) {
        next(err);
    }
 
});

router.post("/", async function(req, res, next) {
    try {
        if(!req.body.name || !req.body.description) {
            throw new ExpressError("Missing required information for company", 400);
        }
        
        let { name, description } = req.body;
        let code = slugify(name, {lower: true, remove: /[*+~.()'"!:@]/g});
        const result = await db.query(
            `INSERT INTO companies(code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
            [code, name, description]
        );
        return res.status(201).json({company: result.rows[0]});

    } catch(err) {
        next(err);
    }
});

router.put("/:code", async function(req, res, next) {
    try {
        if(!req.body) {
            throw new ExpressError("Missing required information to edit company", 400);
        }

        const code = req.params.code;
        const { name, description } = req.body;
        const result = await db.query(
            `UPDATE companies
            SET name=$1,
            description=$2
            WHERE code = $3
            RETURNING code, name, description`,
            [name, description, code]
        );
        return res.json({company: result.rows[0]});

    } catch(err) {
        next(err);
    }
});

router.delete("/:code", async function(req, res, next) {
    try {
        const code = req.params.code;
        const result = await db.query(
           `DELETE FROM companies
            WHERE code=$1
            RETURNING code, name, description`,
            [code]
        );
        if(result.rows.length === 0) {
            throw new ExpressError(`Company with code '${code}' could not be found`, 404);
        }
        else return res.json({status: "deleted"});

    } catch(err) {
        next(err);
    }
});
module.exports = router;