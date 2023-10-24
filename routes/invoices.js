const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.get("/", async function(req, res, next) {
    try {
        const results = await db.query("SELECT * FROM invoices");
        return res.json({invoices: results.rows});

    } catch(err) {
        next(err);
    }

});

router.get("/:id", async function(req, res, next) {
    try {
        const results = 
        await db.query(`SELECT * FROM invoices
                        JOIN companies on comp_code = code
                        WHERE id=$1`, [req.params.id]);
        if(results.rows.length === 0) {
            throw new ExpressError(`Invoice with id '${req.params.id}' could not be found`, 404);
        }
        else {
            const { id, amt, paid, add_date, paid_date,
                code, name, description } = results.rows[0];

             return res.json({invoice: {id, amt, paid, add_date, paid_date,
                                    company: {code, name, description}}});
        }
       
    } catch(err) {
        next(err);
    }

});

router.post("/", async function(req, res, next) {
    try {
        if(!req.body.comp_code || !req.body.amt) {
            throw new ExpressError("Missing required information for invoice", 400);
        }
        
        const { comp_code, amt } = req.body;
        const result = await db.query(
            `INSERT INTO invoices(comp_code, amt)
            VALUES ($1, $2)
            RETURNING comp_code, amt`,
            [comp_code, amt]
        );
        return res.status(201).json(result.rows[0]);

    } catch(err) {
        next(err);
    }

});

router.put("/:id", async function(req, res, next) {
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

router.delete("/:id", async function(req, res, next) {
    try {
        const id = req.params.id;
        const result = await db.query(
            `DELETE FROM invoices
            WHERE id=$1
            RETURNING id, amt`,
            [id]
        );
        if(result.rows.length === 0) {
            throw new ExpressError(`Invoice with id '${id}' could not be found`, 404);
        }
        else return res.json({status: "deleted"});

    } catch(err) {
        next(err);
    }
});

router.get("/companies/:code", async function(req, res, next) {
    try {
        const results = 
        await db.query(`SELECT * FROM invoices
                        JOIN companies on comp_code = code
                        WHERE id=$1`, [req.params.id]);
        if(results.rows.length === 0) {
            throw new ExpressError(`Invoice with id '${req.params.id}' could not be found`, 404);
        }
        else {
            const { id, amt, paid, add_date, paid_date,
                code, name, description } = results.rows[0];

             return res.json({invoice: {id, amt, paid, add_date, paid_date,
                                    company: {code, name, description}}});
        }
       
    } catch(err) {
        next(err);
    }

});

module.exports = router;