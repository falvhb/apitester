#!/usr/bin/env node
import traverse from "traverse";
import walk from "walkdir";
import fetch from "node-fetch";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import jsonDiff from "json-diff";
import { dirname } from "path";
import { Test } from "./src/test.js";
import { fetchJSONFile } from "./src/helper.js";

const BASE_URL = process.env.BASE_URL || "http://localhost:8080";

const BASE_FOLDER = process.env.BASE_FOLDER || "baseline";
const REMOVE_PATH = process.env.REMOVE_PATH || "";

function clean(json) {
  delete json._meta;

  //strip domains
  traverse(json).forEach(function (x) {
    if (typeof x === "string" && x.startsWith("http")) {
      const newUrl = new URL(x);
      newUrl.host = "home";
      newUrl.port = 80;
      this.update(newUrl.toString());
    }
  });
}

const myArgs = process.argv.slice(2);

switch (myArgs[0]) {
  case "add":
    const urlCandidate = myArgs[1];
    if (!urlCandidate) {
      console.error("Use: apitester add https://www.test.de/path/to/file");
      process.exit(1);
    }

    let url;
    try {
      url = new URL(urlCandidate);
    } catch (e) {
      console.error(`Can not determine url path`, e);
      process.exit(1);
    }

    const urlWithRemovedPath = url.pathname.replace(REMOVE_PATH, "");
    console.log(`Adding new test: ${urlWithRemovedPath}...`);

    if (url && !url.pathname) {
      console.error(`Can not determine url path`);
      process.exit(1);
    }

    const json = await fetchJSONFile(url);

    const usePath = "./" + BASE_FOLDER + urlWithRemovedPath + ".json";

    mkdirSync(
      dirname(usePath),
      {
        recursive: true,
      },
      (err) => {
        if (err) throw err;
      }
    );
    writeFileSync(usePath, JSON.stringify(json, undefined, 2));

    break;
  default:
    await test();
}

async function test() {
  const meta = {
    succeeded: 0,
    failed: 0,
  };

  const files = await walk.async("./" + BASE_FOLDER);

  for await (const path of files) {
    // only json files
    if (!path.endsWith(".json")) {
      continue;
    }

    // convert path to urlPath
    const urlPath = path
      .replace(/\*slash\*/gm, "/")
      .replace(".json", "")
      .split("/baseline")
      .pop();

    const urlFull = BASE_URL + urlPath;
    const test = new Test(urlFull);

    // read json file
    const fileRaw = readFileSync(path);

    let fileJson;
    try {
      fileJson = JSON.parse(fileRaw);
    } catch (e) {
      test.fail(`Failed conversation of file ${path} to JSON: ${e}`);
      meta.failed += 1;
    }

    // fetch remote file
    let remoteJson;

    let response;
    try {
      response = await fetch(urlFull);
    } catch (error) {
      test.fail(`Failed fetch of file ${urlFull}: ${error}`);
      meta.failed += 1;
    }

    if (response) {
      const body = await response.text();
      try {
        remoteJson = JSON.parse(body);
      } catch (e) {
        test.fail(`Failed conversation of remote ${urlFull} to JSON: ${e}`);
        meta.failed += 1;
      }
    }

    if (fileJson && remoteJson) {
      clean(remoteJson);
      clean(fileJson);

      // compare files
      if (jsonDiff.diff(fileJson, remoteJson)) {
        test.fail(jsonDiff.diffString(fileJson, remoteJson));
        meta.failed += 1;

        // write current

        const isPath = path.replace(BASE_FOLDER, BASE_FOLDER + "_is");
        mkdirSync(
          dirname(isPath),
          {
            recursive: true,
          },
          (err) => {
            if (err) throw err;
          }
        );
        writeFileSync(isPath, JSON.stringify(remoteJson, undefined, 2));
      } else {
        test.success();
        meta.succeeded += 1;
      }
    }

    test.print();
  }

  console.log("Done", meta);
  if (meta.failed > 0) {
    process.exit(1);
  }
}
