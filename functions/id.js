const faunadb = require('faunadb');
const dbClient = new faunadb.Client({ secret: process.env.FAUNADB_SERVER_SECRET });
const q = faunadb.query;

exports.handler = async(event, context) => {
    const id = event.queryStringParameters.id;
    const action = event.queryStringParameters.action;

    console.log("id: " + id + "\naction: " + action);

    if (!id)
        return { statusCode: 400, body: JSON.stringify({error: "missing_id"}) }

    if (!action)
        return { statusCode: 400, body: JSON.stringify({error: "missing_action"}) }

    if (action == "get_time")
        return await getRegisterTime(id);

    if (action == "register")
        return await registerId(id);

    return { statusCode: 400, body: JSON.stringify({error: "invalid_action"}) }
}

async function registerId(id) {
    console.log("Registering id: " + id);
    if ((await getRegisterTime(id)).statusCode != "400")
        return { statusCode: 400, body: JSON.stringify({data: "id_already_registered"}) };

    const expr = (q.Create(q.Collection("ids"), {data: { id: id }}));
    const result = await dbClient.query(expr);
    console.log("Id register result: " + JSON.stringify(result.data));

    return { statusCode: 200, body: JSON.stringify({data: "success"}) };
}

async function getRegisterTime(id) {
    console.log("Getting register time for id: " + id);

    const expr = q.Map(
        q.Paginate(q.Documents(q.Collection('ids'))),
        q.Lambda(x => q.Get(x))
    )

    const result = await dbClient.query(expr);
    console.log("Got ids from database. " + JSON.stringify(result));

    for (let i = 0; i < result.data.length; ++i) {
        const dbId = result.data[i].data.id;
        if (dbId == id) {
            console.log("Found matching id. Time: " + result.data[i].ts);
            return { statusCode: 200, body: JSON.stringify({data: result.data[i].ts}) }
        }
    }

    console.log("Did not find any matching id.");
    return { statusCode: 400, body: JSON.stringify({error: "invalid_id"}) }
}