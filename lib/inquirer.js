const inquirer = require('inquirer');

module.exports = {
    askForAddonMetadata: () => {
        const questions = [{
                name: 'addonname',
                type: 'input',
                message: 'Please write your addon`s name:',
                validate: function(value) {
                    if (value.length) {
                        return true;
                    } else {
                        return 'Addon`s name cannot be empty.';
                    }
                }
            },
            {
                name: 'addondescription',
                type: 'input',
                message: 'Please write your addon`s description:',
                validate: function(value) {
                    if (value.length) {
                        return true;
                    } else {
                        return 'Addon`s description cannot be empty.';
                    }
                }
            },
            // {
            //     name: 'addontype',
            //     type: 'list',
            //     choices: ['Sytem', 'Public', 'Dev', 'Distributor'],
            //     message: 'Please choose your addon type:',
            //     validate: function(value) {
            //         if (value.length) {
            //             return true;
            //         } else {
            //             return 'No type was chosen.';
            //         }
            //     }
            // },
            {
                name: 'addonuuid',
                type: 'input',
                message: 'Write your addon`s UUID(optional):',
                validate: function(value) {
                    return true;

                }
            },
            // {
            //     name: 'usengxlib',
            //     type: 'confirm',
            //     message: 'Would you like to use our components library (@pepperi-addons/ngx-lib) ?',
            //     validate: function(value) {
            //         return true;

            //     }
            // }
        ];
        return inquirer.prompt(questions);
    }
};