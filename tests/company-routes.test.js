process.env.NODE_ENV = "test";
const request = require("supertest");

const app = require("../app");
const db = require("../db");

beforeAll(async() => {
    await db.query(
        `INSERT INTO companies
        VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
        ('ibm', 'IBM', 'Big blue.')
        `);
    await db.query(`
    INSERT INTO invoices (comp_Code, amt, paid, paid_date)
    VALUES ('apple', 100, false, null),
         ('apple', 300, true, '2018-01-01'),
         ('ibm', 400, false, null)`);
})

afterAll(async() => {
    await db.query(
        `DELETE FROM companies;
        DELETE FROM invoices;`
    );
    await db.query(`
        ALTER SEQUENCE invoices_id_seq RESTART WITH 1`);
    await db.end();
})



describe("GET /companies", function() {
    test("Gets all companies", async function() {
        const resp = await request(app).get("/companies");

        expect(resp.statusCode).toBe(200);
        expect(resp.body.companies.length).toBe(2);
    });

    test("Gets a specific company", async function() {
        const resp = await request(app)
        .get("/companies/apple");

        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({
            "company":
            {"code":"apple",
            "name":"Apple Computer",
            "description":"Maker of OSX.",
            "invoices":[1,2]}
        });
    });
   
});

describe("POST /companies", function() {
    test("Creates a new company", async function() {
        const resp = await request(app)
        .post("/companies")
        .send({
            code: "targ",
            name: "Target",
            description: "A national chain of department stores."
        });

        expect(resp.statusCode).toBe(201);
        expect(resp.body).toEqual({
            company: {
                code: "targ",
                name: "Target",
                description: "A national chain of department stores."
            }
        });
    })
})

describe("PUT /companies/:code", function() {
    test("Edits a company", async function() {
        const resp = await request(app)
        .put("/companies/apple")
        .send({
            name: "Apple Computer",
            description: "Makes computers, phones, and other electronics."
        });

        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({
            company: {
                code: "apple",
                name: "Apple Computer",
                description: "Makes computers, phones, and other electronics."
            }
        });
    })
})

describe("DELETE /companies/:code", function() {
    test("Deletes a company", async function() {
        const resp = await request(app)
        .delete("/companies/ibm");

        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({"status": "deleted"});

        const resp2 = await request(app).get("/companies");
        //Target should still be in the DB from POST test
        expect(resp2.body.companies.length).toBe(2);

    });

    test("Trying to delete nonexistent company returns 404",
    async function() {
        const resp = await request(app)
        .delete("/companies/hahaha");

        expect(resp.statusCode).toBe(404);
    })

   
});



