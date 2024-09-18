"use strict";

const { ServiceBroker } = require("moleculer");
const DbService = require("moleculer-db");
const MongooseAdapter = require("moleculer-db-adapter-mongoose");
const mongoose = require("mongoose");
const streamingService = require("../services/streaming.service");

const broker = new ServiceBroker({
	logger: false,
});

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

beforeAll(async () => {
	await broker.createService({
		name: "service-streaming",
		mixins: [DbService],
		adapter: new MongooseAdapter(process.env.MONGO_URL),
		collection: "catalogs",
		model: mongoose.model("testCatalog", ContentSchema),
		actions: streamingService.actions,
	});

	await broker.start();
});

afterAll(async () => {
	await broker.stop();
});

describe("service-streaming", () => {
	describe("get_catalog endpoint", () => {
		it("should return a metadata chunk", async () => {
			const ctx = {
				params: {
					page: 1,
					pageSize: 10,
				},
			};

			const res = await broker.call("service-streaming.get_catalog", ctx);

			expect(res).toBeDefined();
			expect(Array.isArray(res)).toBe(true);
			expect(res.length).toBe(1);
		});
	});

	describe("get_selected endpoint", () => {
		it("should return a content object", async () => {
			const ctx = {
				params: {
					movieID: "648eddc1228d378a51646f5a",
				},
			};

			const res = await broker.call(
				"service-streaming.get_selected",
				ctx
			);

			expect(res).toBeDefined();
			console.log(res);
			expect(res._id).toBe("648eddc1228d378a51646f5a");
			expect(res.display_title).toBe("Dishonored Lady");
			// Add more assertions as needed
		});

		it("should handle error if content object is not found", async () => {
			const ctx = {
				params: {
					movieID: "non-existent-movie-id",
				},
			};

			await expect(
				broker.call("service-streaming.get_selected", ctx)
			).rejects.toThrowError("Error retrieving content object:");
		});
	});

	describe("get_src_link endpoint", () => {
		it("should return a source link", async () => {
			const ctx = {
				params: {
					versionHash:
						"hq__DS1v8hb78Fs9L7LNvEdsJDXB6fSKH8j1usBXvATGJY7hxdgxNv2YqTzuxYQYCi3DNwZhSAjrT8",
				},
			};

			const res = await broker.call(
				"service-streaming.get_src_link",
				ctx
			);

			expect(res).toBeDefined();
			expect(res).toContain(
				"https://host-154-14-240-131.contentfabric.io/qlibs/"
			);
			// Add more assertions as needed
		});

		it("should handle error if source link retrieval fails", async () => {
			const ctx = {
				params: {
					versionHash: "invalid-version-hash",
				},
			};

			await expect(
				broker.call("service-streaming.get_src_link", ctx)
			).rejects.toThrowError("Error retrieving content source link:");
		});
	});
});
