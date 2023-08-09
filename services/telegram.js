const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.TG_TOKEN);

module.exports = bot;
