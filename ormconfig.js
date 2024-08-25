const { readFileSync } = require('fs');
const yaml = require('js-yaml');
const { join } = require('path');
const { DataSource } = require('typeorm');
let yamlConfigFileName = 'config.migration.yaml';
let config = yaml.load(
    readFileSync(join(__dirname, yamlConfigFileName), 'utf8'),
);

module.exports = new DataSource(config.database)