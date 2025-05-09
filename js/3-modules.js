// Common JS, every file is module (by default)
// Modules - Encapsulated Code (only share minimum)
const names = require('./4-names');
const sayHi = require('./5-utils');
const mumu = require('./6-alternate-flavor');
require('./7-mind-grenade');
// console.log(mumu);
sayHi('susan');
sayHi(names.john);
sayHi(names.peter);