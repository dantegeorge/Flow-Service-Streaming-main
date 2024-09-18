"use strict";
// Import dotenv
require("dotenv").config();
// Import the Eluvio CLient
const ElvModules = require("./modules/eluvio.consumer.modules");
// Import the moleculer db
const DbService = require("moleculer-db");
// Import the mongoose adapter for moleculer db
const MongooseAdapter = require("moleculer-db-adapter-mongoose");
// import the mongoose library for creating models and schemas
const mongoose = require("mongoose");

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

/**
 * @type {ServiceSchema}
 */
const ContentSchema = new mongoose.Schema({
	elv_object_id: { type: String, required: true },
	object_name: { type: String, required: true },
	display_title: { type: String, required: true },
	version_hash: { type: String, required: true },
	image: { type: Buffer, required: false },
	copyright: { type: String, required: false },
	creator: { type: String, required: false },
	release_date: { type: String, required: false },
	runtime: { type: String, required: false },
	synopsis: { type: String, required: false },
});

module.exports = {
	name: "service-streaming",
	mixins: [DbService],
	adapter: new MongooseAdapter(process.env.MONGO_URL),
	collection: "catalogs",
	model: mongoose.model("Catalog", ContentSchema),
	actions: {
		/**
		 * Get catalog metadata with pagination.
		 *
		 * @param {Context} ctx - Moleculer's context, pagination definition
		 * @returns {Object} - Metadata chunk from catalog
		 */
		get_catalog: {
			rest: {
				method: "GET",
				path: "/catalog",
			},
			params: {
				page: { type: "number", optional: true },
				pageSize: { type: "number", optional: true },
			},
			authorize: ["consumer"],
			async handler(ctx) {
				const page = ctx.params.page || 1;
				const pageSize = ctx.params.pageSize || 10; // Update with your desired chunk size

				// Calculate the starting index for the current chunk
				const startIndex = (page - 1) * pageSize;

				// Fetch a chunk of metadata from the database
				const metadataChunk = await this.adapter.find(
					{},
					{
						skip: startIndex,
						limit: pageSize,
					}
				);
				console.log(metadataChunk);
				// Return the metadata chunk to the client
				return metadataChunk;
			},
		},
		/**
		 * Get selected content object by ID.
		 *
		 * @param {Context} ctx - Moleculer's context, movieID: _id from mongoDB
		 * @returns {Object} - Content object metadata
		 */
		get_selected: {
			rest: {
				method: "GET",
				path: "/select", // Updated path to include the MongoDB _id parameter
			},
			authorize: ["consumer"],
			async handler(ctx) {
				try {
					const id = ctx.params.movieID; // Get the MongoDB _id from the request parameters

					const res = await this.adapter.findOne({ _id: id }); // Use findOne to retrieve a single document based on _id

					return res;
				} catch (error) {
					console.error("Error retrieving content object:", error);
				}
			},
		},
		/**
		 * Get source link for content with the specified version hash.
		 *
		 * @param {Context} ctx - Moleculer's context, versionHash: versionHash (Content metadata)
		 * @returns {string} - Source link to stream selected content
		 */
		get_src_link: {
			rest: {
				method: "GET",
				path: "/source", // Updated path to include the MongoDB _id parameter
			},
			authorize: ["consumer"],
			async handler(ctx) {
				try {
					const versionHash = ctx.params.versionHash; // Get the MongoDB _id from the request parameters
					const res = await ElvModules.getPlayouts(versionHash);
					const hlsClearPlayoutUrl =
						res.hls.playoutMethods.clear.playoutUrl;
					return hlsClearPlayoutUrl;
				} catch (error) {
					console.error(
						"Error retrieving content source link:",
						error
					);
				}
			},
		},
	},
	methods: {},
	async started() {
		console.log("service-streaming has started!");
	},
};
