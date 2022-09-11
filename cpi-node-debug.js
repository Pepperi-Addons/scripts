#!/usr/bin/env node

const path = require('path');
const fs =  require('fs');
const util = require('util');
const fetch = require('node-fetch');
const read = util.promisify(fs.readFile);
const cwd = process.cwd();

async function run() {
    try {
        const configPath = path.join(cwd, 'cpi-side', 'debugger.config.json');
        const config = require(configPath);
        if (!config) {
            throw new Error('Error reading config file');
        }
        
        const baseURL = config.BaseURL;
        const jwt = config.JWT;
        const sessionToken = config.SessionToken;
        const fileName = config.FileName;
        const addonUUID = config.AddonUUID;
        
        const code = await read(path.join(cwd, 'publish', fileName), { encoding: 'base64' });

        const options = {
            method: 'POST',
            body: JSON.stringify({
                files: [{
                    AddonUUID: addonUUID,
                    Name: fileName,
                    Code: code
                }]
            }),
            headers: {
                'PepperiSessionToken': sessionToken,
                'Authorization': 'Bearer ' + jwt,
                'Content-Type': 'application/json'
            }
        };
        // console.log(options);
        if (process.platform === 'darwin') {
            // debugging on mac catalyist
            url = baseURL + '/debugger/files';
        }
        else {
            url = baseURL + '/Service1.svc/v1' + '/Addons/Api/4b133404-ca94-4fb7-8845-4ac0a501423c/cpi-node-debugger/files';
        }
        console.log("calling", url);
        const res = await fetch(url, options);
    
        if (!res.ok) {
            throw new Error(`${url} returned status: ${res.status} - ${res.statusText} error: ${await res.text()}`);
        }
    
        const json = await res.json();
        console.log('API response', json);
    }
    catch (err) {
        console.error(err);
        process.exit(-1);
    }
}

run();
