const express = require('express')
const ActivitypubExpress = require('activitypub-express')
const ApexStore = require('./store')

const port = process.argv.length > 2 ? process.argv[2] : 8080

const app = express()
app.set('env', 'testing')

const routes = {
    actor: '/u/:actor',
    object: '/o/:id',
    activity: '/s/:id',
    inbox: '/u/:actor/inbox',
    outbox: '/u/:actor/outbox',
    followers: '/u/:actor/followers',
    following: '/u/:actor/following',
    liked: '/u/:actor/liked',
    collections: '/u/:actor/c/:id',
    blocked: '/u/:actor/blocked',
    rejections: '/u/:actor/rejections',
    rejected: '/u/:actor/rejected',
    shares: '/s/:id/shares',
    likes: '/s/:id/likes'
}

const apex = ActivitypubExpress({
    name: 'Apex Example',
    version: '1.0.0',
    domain: 'localhost',
    baseUrl: `http://localhost:${port}`,
    actorParam: 'actor',
    objectParam: 'id',
    activityParam: 'id',
    store: new ApexStore(),
    routes,
    endpoints: {
        proxyUrl: 'https://localhost/proxy'
    }
})

//const client = new MongoClient('mongodb://localhost:27017')

app.use(
    express.json({ type: apex.consts.jsonldTypes }),
    express.urlencoded({ extended: true }),
    apex,
    function testActorAuthorization(req, res, next) {
        // For testing, any authorization header is fine
        if (req.headers.authorization) {
            res.locals.apex.authorized = true
        }
        else {
            apex.logger.info('No authorization header')
        }
        //}
        next()
    },
    // Debug logging
    (req, res, next) => {
        apex.logger.info('Request:', req.method, req.url);
        next();
        apex.logger.info('Response:', res.statusCode, res.statusMessage);
    }
)


// define routes using prepacakged middleware collections
app.route(routes.inbox)
    .get(apex.net.inbox.get)
    .post(apex.net.inbox.post)
app.route(routes.outbox)
    .get(apex.net.outbox.get)
    .post(apex.net.outbox.post)
app.get(routes.actor, apex.net.actor.get)
app.get(routes.followers, apex.net.followers.get)
app.get(routes.following, apex.net.following.get)
app.get(routes.liked, apex.net.liked.get)
app.get(routes.object, apex.net.object.get)
app.get(routes.activity, apex.net.activityStream.get)
app.get(routes.shares, apex.net.shares.get)
app.get(routes.likes, apex.net.likes.get)
app.get('/.well-known/webfinger', apex.net.webfinger.get)
app.get('/.well-known/nodeinfo', apex.net.nodeInfoLocation.get)
app.get('/nodeinfo/:version', apex.net.nodeInfo.get)
app.post('/proxy', apex.net.proxy.post)

app.get(routes.collections, apex.net.object.get)

async function testControl(req, res) {
    const apex = req.app.locals.apex
    const command = req.params.command
    switch (command) {
        case 'reset':
            apex.store.reset()
            apex.logger.info("Test control: reset")
            break;
        case 'objects':
            let objects = apex.store.objects
            if (req.query.type) {
                objects = Object.values(objects).filter(o => o.type == req.query.type)
            }
            res.status(200).send(JSON.stringify(objects))
            return
        default:
            apex.logger.info(`Test control: ${command}`)
            break
    }

    await res.status(200).send("OK")
}

app.get("/test/:command", [testControl])

// custom side-effects for your app
app.on('apex-outbox', msg => {
    apex.logger.info(`Outbox post: ${msg.activity.type}/${msg.object.type} ${msg.object.id} from ${msg.actor.id}`)
})

app.on('apex-inbox', msg => {
    apex.logger.info(`Inbox post: ${msg.activity.type}/${msg.object.type} ${msg.object.id} from ${msg.actor.id} to ${msg.recipient.id}`)
})

// Abusing the "initialUser" argument
apex.store.setup(apex)
    .then(() => {
        app.listen(port, () => {
            apex.logger.info(`apex app listening on port ${port}`)
        })
    })
