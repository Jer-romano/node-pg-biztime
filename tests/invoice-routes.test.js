process.env.NODE_ENV = "test";
const request = require("supertest");

const app = require("../app");
const db = require("../db");

function getTodaysDate() {

    const formattedDate = new Date();
    formattedDate.setUTCHours(4);
    formattedDate.setUTCMinutes(0);
    formattedDate.setUTCSeconds(0);
    formattedDate.setUTCMilliseconds(0);
    return formattedDate.toISOString();
}
const today = getTodaysDate();

beforeAll(async() => {
    await db.query(
        `INSERT INTO companies
        VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
        ('ibm', 'IBM', 'Big blue.')
        `);
    await db.query(`
    INSERT INTO invoices (comp_Code, amt, paid, paid_date)
    VALUES ('apple', 100, false, null),
         ('apple', 300, true, '2018-01-01')
         `);
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

describe("GET /invoices", function() {
    test("Gets all invoices", async function() {
        const resp = await request(app)
        .get("/invoices");

        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({
            invoices: [{"id":1,"comp_code":"apple","amt":100,"paid":false,"add_date":today,"paid_date":null},
            {"id":2,"comp_code":"apple","amt":300,"paid":true,"add_date":today,"paid_date":"2018-01-01T05:00:00.000Z"}]
        });

    });

    test("Get specific invoice", async function() {
        const resp = await request(app)
        .get("/invoices/1");

        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({
            invoice: {"id":1,
                    "amt":100,
                    "paid":false,
                    "add_date":today,
                    "paid_date":null,
                    "company": {"code":"apple",
                                "name":"Apple Computer",
                                "description":"Maker of OSX."}
            }});

    })
})

describe("POST /invoices", function() {
    test("Creates a new invoice", async function() {
        const resp = await request(app)
        .post("/invoices")
        .send({
         comp_code: "ibm",
         amt: 500
        });

        expect(resp.statusCode).toBe(201);
        expect(resp.body).toEqual({
            invoice: {
                id: 3,
                "comp_code":"ibm",
                "amt":500,
                "paid":false,
                "add_date": today,
                "paid_date":null
            }
        });
    })
    test("Attempt to create invoice without proper info", async function() {
        const resp = await request(app)
        .post("/invoices")
        .send({
         stuff: "blah"
        });

        expect(resp.statusCode).toBe(400);
    })
})

describe("PUT /invoices/:id", function() {
    test("Updates an invoice", async function() {
        const resp = await request(app)
        .put("/invoices/3")
        .send({
           amt: 500,
           paid: true
        });

        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({
            invoice: {
                id: 3,
                "comp_code":"ibm",
                "amt":500,
                "paid":true,
                "add_date": today,
                "paid_date": today
            }
        });
    })
});

describe("DELETE /invoices/:id", function() {
    test("Deletes an invoice", async function() {
        const resp = await request(app)
        .delete("/invoices/3");

        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({"status": "deleted"});

        const resp2 = await request(app).get("/invoices");
        //Should still be two invoices remaining
        expect(resp2.body.invoices.length).toBe(2);

    });

    test("Trying to delete nonexistent invoice returns 404",
    async function() {
        const resp = await request(app)
        .delete("/invoices/0");

        expect(resp.statusCode).toBe(404);
    })
   
});
