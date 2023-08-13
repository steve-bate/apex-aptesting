const IApexStore = require('activitypub-express/store/interface')
const { buildTombstone } = require('activitypub-express/pub/activity')
const uuid = require('uuid')


function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

const compareDescending = (a, b) => {
    if (a.sort_key > b.sort_key) {
        return -1; // Negative value to indicate a should come before b
    } else if (a.sort_key < b.sort_key) {
        return 1; // Positive value to indicate b should come before a
    }
    return 0; // 0 if the values are equal
};

class StubApexStore extends IApexStore {
    async setup(apex) {
        this.logger = apex.logger
        this.actors = []
        // Create 5 local actors
        for (let i = 1; i < 5; i++) {
            this.actors.push(await apex.createActor(`local_actor_${i}`, `Local Actor ${i}`, '', null))
        }
        this.actors.push(await apex.createActor(`unauthenticated_actor`, 'Unauthenticated Local Actor', '', null))
        this.reset()
    }

    reset() {
        this.logger.info('Store: reset')
        this.pendingDeliveries = []
        this.objects = new Object()
        this.sort_key = 1
        for (const actor of this.actors) {
            this.objects[actor.id] = actor
        }
    }

    async deliveryEnqueue(actorId, body, addresses, signingKey) {
        //throw {'message': 'deliveryEnqueue NotImplemented'}
        this.logger.info(`Store: deliveryEnqueue addresses=${addresses}`)
        for (const address of addresses) {
            this.pendingDeliveries.push({ actorId, body, address, signingKey })
        }
    }

    async deliveryDequeue() {
        this.logger.info('Store: deliveryDequeue')
        return this.pendingDeliveries.pop()
    }

    async deliveryRequeue(delivery) {
        //throw { 'message': "deliveryRequeue NotImplemented" }
        this.logger.info(`Store: deliveryRequeue ${delivery}`)
    }

    async getObject(id, includeMeta) {
        this.logger.info(`Store: getObject ${id}`)
        return this.objects[id]
    }

    async saveObject(object) {
        this.logger.info(`Store: saveObject ${object.type} ${object.id}`)
        this.objects[object.id] = object
    }

    async updateObject(obj, actorId, fullReplace) {
        this.logger.info(`Store: updateObject ${obj.type} ${obj.id}`)
        const stored_object = this.objects[obj.id]
        if (fullReplace || !stored_object) {
            this.objects[obj.id] = obj
        }
        else {
            stored_object.merge(obj)
        }
    }

    findActivityByCollectionAndObjectId(collection, objectId, includeMeta) {
        this.logger.info(`Store: findActivityByCollectionAndObjectId ${objectId}`)
        return this.getObject(objectId)
    }

    findActivityByCollectionAndActorId(collection, actorId, includeMeta) {
        throw { 'message': "findActivityByCollectionAndActorId NotImplemented" }
    }

    getContext(documentUrl) {
        throw { 'message': "getContext NotImplemented" }
    }

    saveContext({ contextUrl, documentUrl, document }) {
        throw { 'message': "saveContext NotImplemented" }
    }

    /**
     * Return a specific collection (stream of activitites), e.g. a user's inbox
     * @param  {string} collectionId - _meta.collection identifier
     * @param  {number} limit - max number of activities to return
     * @param  {string} [after] - mongodb _id to begin querying after (i.e. last item of last page)
     * @param  {string[]} [blockList] - list of ids of actors whose activities should be excluded
     * @param  {object[]} [query] - additional aggretation pipeline stages to include
     * @returns {Promise<object[]>}
     */
    async getStream(collectionId, limit, after, blockList, query) {
        this.logger.info(`Store: getStream ${collectionId}`)
        let stream = this.objects[collectionId]
        if (!stream) {
            stream = []
            for (const key of Object.keys(this.objects)) {
                const obj = this.objects[key]
                const meta = obj._meta
                if (meta) {
                    const collections = meta.collection
                    if (collections && collections.includes(collectionId)) {
                        stream.push(obj)
                    }
                }
            }
            stream.sort(compareDescending)
        }
        return stream
    }

    async getStreamCount(collectionId) {
        this.logger.info(`Store: getStreamCount ${collectionId}`)
        const stream = await this.getStream(collectionId, null, null, null, null)
        return stream.length
    }

    getUserCount() {
        throw { 'message': "getUserCount NotImplemented" }
    }

    getActivity(id, includeMeta) {
        this.logger.info(`Store: getActivity ${id}`)
        return this.objects[id]
    }

    async saveActivity(activity) {
        this.logger.info(`Store: saveActivity ${activity.type} ${activity.id}`)
        activity.sort_key = this.sort_key++
        this.objects[activity.id] = activity
    }

    async removeActivity(activity, actorId) {
        this.logger.info(`Store: removeActivity ${activity.type} ${activity.id}`)
        delete this.objects[activity.id]
        // Not sure about having this logic here
        if (activity.type.toLowerCase() == 'create') {
            this.objects[activity.object[0].id] = await buildTombstone(activity.object[0])
        }
    }

    async updateActivity(activity, fullReplace) {
        this.logger.info(`Store: (ERROR) updateActivity ${activity.id} fullReplace=${fullReplace}`)
        throw { 'message': "updateActivity NotImplemented" }
    }

    async updateActivityMeta(activity, key, value, remove) {
        this.logger.info(`Store: updateActivityMeta ${activity.type} ${activity.id} key=${key} value=${value} remove=${remove}`)
        const meta = activity._meta
        if (meta) {
            const data = meta[key]
            if (data) {
                if (!data.includes(value)) {
                    data.push(value)
                }
            }
            else {
                meta[key] = [value]
            }
        }
        else {
            activity._meta = { [key]: [value] }
        }
        return activity
    }

    generateId() {
        return uuid.v4()
    }

    // class methods
    objectToUpdateDoc(object) {
        throw { 'message': "objectToUpdateDoc NotImplemented" }
    }

    updateObjectSource(object, actorId, fullReplace) {
        throw { 'message': "updateObjectSource NotImplemented" }
    }

    // for denormalized storage model, must update all activities with copy of updated object
    async updateObjectCopies(object) {
        throw { 'message': "updateObjectCopies NotImplemented" }
    }
}

module.exports = StubApexStore
