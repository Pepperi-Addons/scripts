#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const packageJson = require('./package.json');
const fetch = require('node-fetch');
const cwd = process.cwd();
const path = require('path');
const uuid = require('uuid').v4;
const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
// const files = require('./lib/files');
const inquirer = require('./lib/inquirer');
const Spinner = require('cli-spinner').Spinner;

console.log('cwd', cwd);

async function createAddon(baseURL, body) {
    const url = baseURL + '/var/sk/addons/upsert'

    const options = {
        method: 'POST',
        body: JSON.stringify(body)
    };

    console.log("calling", url);
    const res = await fetch(url, options);
    const json = await res.json();
    console.log('API response', json);
}

async function writeFile(data, path) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, data, (err) => {
            if (err) {
                console.error(err);
                reject(err);
            }
            else {
                resolve();
            }
        })
    })
}


async function run(options) {
    try {

        const userInput = await runWizard();

        // const serverSideTmp = userInput.template.serverLanguage || 'typescript';
        const configPath = path.join(cwd, 'addon.config.json');
        const config = require(configPath);
        if (!config) {
            throw new Error('Error reading config file');
        }
        
        const secretPath = path.join(cwd, 'var_sk');
        const secretKey = uuid();


        const addon = {
            UUID: userInput.metadata.addonuuid || options.uuid,
            Name: userInput.metadata.addonname || options.name,
            Description: userInput.metadata.addondescription || options.description,
            SystemData: "{ \"AngularPlugin\":true, \"EditorName\":\"editor\"  }",
            Hidden: false,
            SecretKey: secretKey,
            Type: userInput
        };
        
        await Promise.all([
            createAddon('https://papi.staging.pepperi.com/v1.0', addon),
            createAddon('https://papi.pepperi.com/v1.0', addon),
        ]);

        config.AddonUUID = options.uuid;
        config.AddonName = userInput.metadata.addonname;
        config.AddonDescription = userInput.metadata.addondescription;
        // config.AddonType = userInput.metadata.addontype;
        
        await Promise.all([
            writeFile(JSON.stringify(config, null, 2), configPath),
            writeFile(secretKey, secretPath)
        ]);
    }
    catch (err) {
        console.error(err);
        console.log('run with --help to get help.')
        process.exit(-1);
    }
}


async function runWizard() {
    // console.log(chalk.red('\n --- Write your credentials for a token: \n'));
    // const credentials = await inquirer.askPepperiCredentials();
    console.log(chalk.yellow('\n --- Pepperi - New Addon Wizard: \n'));
    const metadata = await inquirer.askForAddonMetadata();
  
    // const template = { servertemplate: 'typescript', framework: 'angular', version: '10' };
    // const credentials = { username: 'lk', password: 'l' };
    // const addonMetadata = {
    //     addonname: 'l',
    //     addondescription: 'l',
    //     addontype: 'Sytem',
    //     addonuuid: 'l',
    //     usengxlib: true
    // };

    return { metadata };


}


const program = new Command(packageJson.name)
    .version(packageJson.version)
    .description('A script for publishing the Pepperi addon to the var API')
    .option(
        '-n, --addon-name',
        'The addon name. By default uses the current dir name.'
    )
    .option(
        '-d, --addon-description',
        'The addon description. Empty by default.'
    )
    .option(
        '-u, --addon-uuid',
        'Use you own custom uuid from the Addon. By default, we generate one for you'
    )


program.parse(process.argv);

run({
    name: program['addonName'] || path.basename(cwd),
    uuid: program['addonUuid'] || uuid(),
    description: program['addonDescription'] || ''
});