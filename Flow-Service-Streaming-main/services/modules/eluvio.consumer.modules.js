require("dotenv").config();
// Import the Eluvio CLient
const { ElvClient } = require("@eluvio/elv-client-js");

// Import necessary IDs
const ElvPrivKey = process.env.ELV_PRIVKEY;
const ElvUrl = process.env.ELV_URL;

module.exports = {
	/**
	 * Get playout options for a given Eluvio version hash.
	 *
	 * @param {string} elvVersionHash - Eluvio version hash
	 * @returns {Promise<Object>} - Playout options
	 */
	async getPlayouts(elvVersionHash) {
		try {
			// Initialize the Eluvio client
			const client = await ElvClient.FromConfigurationUrl({
				configUrl: ElvUrl,
			});

			// Authenticate the wallet and signer
			const wallet = client.GenerateWallet();
			const signer = wallet.AddAccount({
				privateKey: ElvPrivKey,
			});
			client.SetSigner({ signer });

			// Retrieve the playout options
			const playoutOptions = await client.PlayoutOptions({
				versionHash: elvVersionHash,
			});

			return playoutOptions;
		} catch (error) {
			console.error("Error retrieving playout links:", error);
		}
	},
};
