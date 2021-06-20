const faunadb = require('faunadb')
const q = faunadb.query;

exports.handler = async(event, context) => {
    const dbClient = new faunadb.Client({ secret: process.env.FAUNADB_SERVER_SECRET });
    const data = {
        key: "somekey",
        payerEmail: "email@example.com",
        payerGivenName: "John",
        payerSurname: "Doe",
    };

    const dbResult = dbClient.query(q.Create(q.Collection("keys"), {data: data}))
        .then((response) => console.log("db success. " + JSON.stringify(response)))
        .catch((error) => console.log("db failure. " + JSON.stringify(error)));

    console.log(dbResult);
    return { statusCode: 200, body: "" }
}