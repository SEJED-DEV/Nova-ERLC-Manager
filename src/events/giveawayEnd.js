const { endGiveaway } = require("../utils/giveawayUtil");

module.exports = {
    name: "giveawayEnd",
    async execute(messageId, client) {
        await endGiveaway(client, messageId);
    },
};
