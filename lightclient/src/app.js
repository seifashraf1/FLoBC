import * as exonum from 'exonum-client'
import * as proto from './proto'
import fetchPythonWeights from './utils/fetchPythonWeights';
import fetchDatasetDirectory from './utils/fetchDatasetDirectory';
import fetchLatestModel from './utils/fetchLatestModel';

const INTERVAL_DURATION = 5000

function trainNewModel(modelWeights){
    const explorerPath = 'http://127.0.0.1:9000/api/explorer/v1/transactions'

    require("regenerator-runtime/runtime");

    // Numeric identifier of the machinelearning service
    const SERVICE_ID = 3

    // Numeric ID of the `TxShareUpdates` transaction within the service
    const SHAREUPDATES_ID = 0

    let dataset_directory = fetchDatasetDirectory();

    fetchPythonWeights(dataset_directory, modelWeights, (model_weights) => {
        const ShareUpdates = new exonum.Transaction({
        schema: proto.TxShareUpdates,
        serviceId: SERVICE_ID,
        methodId: SHAREUPDATES_ID,
        })

        // Assume key for the owner:
        const alice = exonum.keyPair()

        const shareUpdatesPayload = {
        gradients: model_weights,
        seed: exonum.randomUint64(),
        }

        const transaction = ShareUpdates.create(shareUpdatesPayload, alice)
        const serialized = transaction.serialize()
        console.log(serialized)

        exonum.send(explorerPath, serialized)
        .then((obj) => console.log(obj))
        .catch((obj) => console.log(obj))
    });
}

setInterval(() => {
    fetchLatestModel()
    .then(newModel => {
        if(newModel !== -1){
            console.log("New model fetched")
            trainNewModel(newModel)
        }
        else console.log("No New model to fetch, will retry in a bit")
    })
}, INTERVAL_DURATION)
