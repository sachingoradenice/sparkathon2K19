'use strict'
const shim = require('fabric-shim');
const util = require('util');

/**
 * Executes a query based on a provided queryString
 * 
 * I originally wrote this function to handle rich queries via CouchDB, but subsequently needed
 * to support LevelDB range queries where CouchDB was not available.
 * 
 * @param {*} queryString - the query string to execute
 */
async function queryByString(stub, queryString) {
    console.log('============= START : queryByString ===========');
    console.log("##### queryByString queryString: " + queryString);
  
    // CouchDB Query
    // let iterator = await stub.getQueryResult(queryString);
  
    // Equivalent LevelDB Query. We need to parse queryString to determine what is being queried
    // In this chaincode, all queries will either query ALL records for a specific entity, or
    // they will filter ALL the records looking for a specific NGO, Donor, Donation, etc. So far, 
    // in this chaincode there is a maximum of one filter parameter in addition to the entity.
    let entity = "";
    let startKey = "";
    let endKey = "";
    let jsonQueryString = JSON.parse(queryString);
    if (jsonQueryString['selector'] && jsonQueryString['selector']['entity']) {
      entity = jsonQueryString['selector']['entity'];
      startKey = entity + "0";
      endKey = entity + "z";
    }
    else {
      throw new Error('##### queryByString - Cannot call queryByString without a entity element: ' + queryString);   
    }
  
    let iterator = await stub.getStateByRange(startKey, endKey);
  
    // Iterator handling is identical for both CouchDB and LevelDB result sets, with the 
    // exception of the filter handling in the commented section below
    let allResults = [];
    while (true) {
      let res = await iterator.next();
  
      if (res.value && res.value.value.toString()) {
        let jsonRes = {};
        console.log('##### queryByString iterator: ' + res.value.value.toString('utf8'));
  
        jsonRes.Key = res.value.key;
        try {
          jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
        } 
        catch (err) {
          console.log('##### queryByString error: ' + err);
          jsonRes.Record = res.value.value.toString('utf8');
        }
        // ******************* LevelDB filter handling ******************************************
        // LevelDB: additional code required to filter out records we don't need
        // Check that each filter condition in jsonQueryString can be found in the iterator json
        // If we are using CouchDB, this isn't required as rich query supports selectors
        let jsonRecord = jsonQueryString['selector'];
        // If there is only a entity, no need to filter, just return all
        console.log('##### queryByString jsonRecord - number of JSON keys: ' + Object.keys(jsonRecord).length);
        if (Object.keys(jsonRecord).length == 1) {
          allResults.push(jsonRes);
          continue;
        }
        for (var key in jsonRecord) {
          if (jsonRecord.hasOwnProperty(key)) {
            console.log('##### queryByString jsonRecord key: ' + key + " value: " + jsonRecord[key]);
            if (key == "entity") {
              continue;
            }
            console.log('##### queryByString json iterator has key: ' + jsonRes.Record[key]);
            if (!(jsonRes.Record[key] && jsonRes.Record[key] == jsonRecord[key])) {
              // we do not want this record as it does not match the filter criteria
              continue;
            }
            allResults.push(jsonRes);
          }
        }
        // ******************* End LevelDB filter handling ******************************************
        // For CouchDB, push all results
        // allResults.push(jsonRes);
      }
      if (res.done) {
        await iterator.close();
        console.log('##### queryByString all results: ' + JSON.stringify(allResults));
        console.log('============= END : queryByString ===========');
        return Buffer.from(JSON.stringify(allResults));
      }
    }
  }

let Chaincode = class {

    /**
     * This method is called when the chaincode is either initialized or upgraded.
     * @param {*} stub 
     */
    async Init(stub) {
        console.log('=========== Init: Instantiated / Upgraded audit chaincode ===========');
        return shim.success();
    }

    async Invoke(stub) {
        console.log('============= START : Invoke ===========');
        let ret = stub.getFunctionAndParameters();
        console.log('##### Invoke args: ' + JSON.stringify(ret));

        let method = this[ret.fcn];
        if (!method) {
            console.error('##### Invoke - error: no chaincode function with name: ' + ret.fcn + ' found');
            throw new Error('No chaincode function with name: ' + ret.fcn + ' found');
        }
        try {
            let response = await method(stub, ret.params);
            console.log('##### Invoke response payload: ' + response);
            return shim.success(response);
        } catch (err) {
            console.log('##### Invoke - error: ' + err);
            return shim.error(err);
        }
    }

    /**
     * Initialize the state. This should be explicitly called if required.
     * 
     * @param {*} stub 
     * @param {*} args 
     */
    async initLedger(stub, args) {
        console.log('============= START : initLedger ===========')
        console.log('============= END : initLedger ===========');
    }

    async createEntity(stub, args) {
        console.log('============= START : createEntity ===========')
        console.log('##### createEntity arguments: ' + JSON.stringify(args));

        // args is passed as a JSON string
        let json = JSON.parse(args);
        let key = json['entity'] + json['entity_instance_id'];

        // Check if the NGO already exists
        let eventQuery = await stub.getState(key);
        if (eventQuery.toString()) {
            throw new Error('##### createEntity - This event already exists: ' + key);
        }
        await stub.putState(key, Buffer.from(JSON.stringify(json)));
        console.log('============= END : createEntity ===========');
    }

    async queryEventByEntityType(stub, args) {
        console.log('============= START : queryEntity ===========')
        console.log('##### queryEntity arguments: ' + JSON.stringify(args));

        let json = JSON.parse(args);
        let key = json['entity'];

        let queryString = '{"selector": {"entity": '+ key + '}}';
        return queryByString(stub, queryString);
    }

}
shim.start(new Chaincode());