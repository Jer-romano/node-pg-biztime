const express = require("express");
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
        const results = await db.query(
            "SELECT * FROM companies WHERE code=$1", [code]);
        if(results.rows.length === 0) {
            throw new ExpressError(`Company with code '${code}' could not be found`, 404);
        }
         else return res.json({company: results.rows[0]});

    } catch(err) {
        next(err);
    }
 
});

router.post("/", async function(req, res, next) {
    try {
        if(!req.body.code || !req.body.name || !req.body.description) {
            throw new ExpressError("Missing required information for company", 400);
        }
        
        const { name, code, description } = req.body;
        const result = await db.query(
            `INSERT INTO companies(code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
            [code, name, description]
        );
        return res.status(201).json(result.rows[0]);

    } catch(err) {
        next(err);
    }
});

router.put("/:code", async function(req, res, next) {
    try {
        if(!req.query) {
            throw new ExpressError("Missing required information to edit company", 400);
        }

        const code = req.params.code;
        const { name, description } = req.query;
        const result = await db.query(
            `UPDATE companies
            SET name=$1,
            description=$2,
            WHERE code=$3
            RETURNING code, name, description`,
            [name, description, code]
        );
        return res.json(result.rows[0]);

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