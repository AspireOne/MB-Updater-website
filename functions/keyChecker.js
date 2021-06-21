const faunadb = require('faunadb')
const q = faunadb.query;

exports.handler = async(event, context) => {
    const dbClient = new faunadb.Client({ secret: process.env.FAUNADB_SERVER_SECRET });
    const keyToCheck = event.queryStringParameters.key;

    if (!keyToCheck || !keyToCheck.length || keyToCheck.length !== 4)
        return { statusCode: 400, body: JSON.stringify({error: "invalid key format"}) }

    const expr = q.Map(
        q.Paginate(q.Documents(q.Collection('keys'))),
        q.Lambda(x => q.Get(x))
    )

    const result = await dbClient.query(expr);

    for (let i = 0; i < result.data.length; ++i) {
        const key = result.data[i].data.key;
        if (keyToCheck == key)
            return { statusCode: 200, body: JSON.stringify({valid: true}) }
    }

    return { statusCode: 200, body: JSON.stringify({valid: false}) }
}