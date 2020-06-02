#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const packageJson = require('./package.json');
const semver = require('semver');
const fetch = require('node-fetch');
const cwd = process.cwd();
const path = require('path');

console.log('cwd', cwd);

async function getSecret() {
    return new Promise ((resolve, reject) => {
        const secretFile = path.join(cwd, 'var_sk');
        if (fs.exists(secretFile, exist => {
            if (!exist) {
                reject(new Error(`Missing var_sk file in current directory`));
            }
            else {
                fs.readFile(secretFile, (err, data) => {
                    if (err) {
                        reject(new Error(`Error reading var_sk file: ${er}`));
                    }
                    else if (!data) {
                        reject(new Error('Secret is empty. Are you sure you have it?'));
                    }
                    else {
                        resolve(data.toString());
                    }
                })
            }
        }));
    });
}

async function bumpVersion(config, configPath) {
    return new Promise((resolve, reject) => {
        if (semver.valid(config.AddonVersion)) {
            const bumpedVersion = semver.inc(config.AddonVersion, 'patch');
            console.log(`Bumping addon version from ${config.AddonVersion} to ${bumpedVersion}`)
            config.AddonVersion = bumpedVersion;

            // save the config to file with the new version
            fs.writeFile(configPath, JSON.stringify(config, null, 2), (err) => {
                if (err) {
                    console.log('error saving new version to file');
                    console.error(err);
                }
                resolve(config);
            })
        }
        else {
            reject(new Error(config.AddonVersion) + ' isn\'t a valid version. See https://semver.org/.');
        }
    })
}

function getFile(name, path) {
    return {
        FileName: name,
        URL: '',
        Base64Content: fs.readFileSync(path, { encoding: 'base64' })
    };
}

function getFiles(config) {
    const res = [];

    if (config.Endpoints && config.Endpoints.length) {
        config.Endpoints.forEach(endpoint => {

            // replace ts with js
            const file = path.parse(endpoint).name + '.js'
            const filePath = path.join(cwd ,'publish', 'api', file);
            if (fs.existsSync(filePath)) {
                res.push(getFile(file, filePath));
            }
            else {
                console.log(`Skipping API file ${endpoint} - couldn't be found at path ${filePath}`);
            }
        });
    }

    if (config.Editors && config.Editors.length) {
        config.Editors.forEach(editor => {
            // replace ts with js
            const file = editor + '.plugin.bundle.js';
            const filePath = path.join(cwd,'publish','editors', file);
            if (fs.existsSync(filePath)) {
                res.push(getFile(file, filePath));
            }
            else {
                console.log(`Skipping Editor file ${editor} - couldn't be found at path ${filePath}`);
            }
        });
    }

    if (config.Assets && config.Assets.length) {
        config.Assets.forEach(asset => {
            const file = path.join(cwd, 'publish', 'assets', asset);
            if (fs.existsSync(file)) {
                res.push(getFile(asset, file));
            }
            else {
                console.log(`Skipping Editor file ${asset} - couldn't be found at path ${file}`);
            }
        });
    }

    return res;
}

async function run(secret, bump, configFile) {
    try {
        if (configFile === undefined) {
            configFile = 'addon.config.json'
        }

        const configPath = path.join(cwd, configFile);
        const config = require(configPath);
        if (!config) {
            throw new Error('Error reading config file');
        }

        if (secret === undefined) {
            secret = await getSecret()
        }

        if (bump) {
            await bumpVersion(config, configPath);
        }

        const files = getFiles(config);
        console.log('files.length', files.length);

        const papiBaseUrl = config.PapiBaseUrl || 'https://papi.pepperi.com/v1.0';
        const url = papiBaseUrl + '/var/sk/addons/versions'
        const body = JSON.stringify({
            Hidden: false,
            Version: config.AddonVersion,
            Description: "",
            Available: true,
            Phased: false,
            AddonUUID: config.AddonUUID,
            Files: files
        });
        console.log(body);

        const options = {
            method: 'POST',
            body: body,
            headers: {
                'xx-pepperi-addon-secret-key': secret
            }
        };
        // console.log('options', options)

        console.log("calling", url);
        fetch(url, options)
        .then(res => res.json())
        .then(json => {
            console.log('API response', json);
        });
    }
    catch (err) {
        console.error(err);
        console.log('run with --help to get help.')
        process.exit(-1);
    }
}

const program = new Command(packageJson.name)
    .version(packageJson.version)
    .description('A script for publishing the Pepperi addon to the var API')
    .option(
        '-sk, --secret-key', 
        'The secret key for publishing the addon. By default, looks for file ./var_sk`'
    )
    .option(
        '-b, --bump-version',
        'Bump the version number (eg. 1.0.3 -> 1.0.4). Only works if the version is a valid ver-sem. true by default.'
    )
    .option(
        '-c, --config',
        'The addon config json file relative to the current working directory. By default looks for addon.local.config.json'
    )


program.parse(process.argv);

run(program['secret-key'], program['bump-version'] === undefined || program['bump-version'] === true  , program.config);