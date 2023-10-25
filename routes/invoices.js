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
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [comp_code, amt]
        );
        return res.status(201).json({ invoice: result.rows[0]});

    } catch(err) {
        next(err);
    }

});

/** 
 * I've borrowed some of the code for this method from the solution,
 * as it wasn't explained in the instructions that the method 
 * should update the paid_date, if applicable.
 * PUT /[code] => update invoice
 *
 * {amt, paid}  =>  {id, comp_code, amt, paid, add_date, paid_date}
 *
 * If paying unpaid invoice, set paid_date; if marking as unpaid, clear paid_date.
 * */
router.put("/:id", async function(req, res, next) {
    try {
        if(!req.body) {
            throw new ExpressError("Missing required information to edit invoice", 400);
        }

        const id = req.params.id;
        const {amt, paid} = req.body;
        let paidDate = null;

        const result1 = await db.query(
            `SELECT paid 
            FROM invoices
            WHERE id = $1`,
            [id]);
        if (result1.rows.length === 0) {
            throw new ExpressError(`No such invoice: ${id}`, 404)
        }

        const currPaidDate = result1.rows[0].paid_date;

        if (!currPaidDate && paid) {
            paidDate = new Date();
        } else if (!paid) {
            paidDate = null;
        } else {
            paidDate = currPaidDate;
        }
        const result2 = await db.query(
            `UPDATE invoices
            SET amt=$1, paid=$2, paid_date=$3
            WHERE id=$4
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, paid, paidDate, id]
        );
    
        return res.json({"invoice": result2.rows[0]});

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

module.exports = router;