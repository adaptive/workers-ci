#!/usr/bin/env node
"use strict";
const webpack = require("webpack");
const fetch = require("isomorphic-fetch");
const fsp = require("fs").promises;
const argv = require("yargs/yargs")(process.argv.slice(2))
  .scriptName("workers-ci")
  .command(
    "build <script>",
    "🚧 Build your worker in development mode",
    yargs => {
      yargs.positional("script", {
        describe: "script to build",
        type: "string"
      });
    }
  )
  .command(
    "deploy <script> <script_name>",
    "🚀 Deploy your worker across the edge",
    yargs => {
      yargs
        .positional("script", {
          describe: "script to deploys",
          type: "string"
        })
        .positional("script_name", {
          describe: "script name at the provider",
          type: "string"
        });
    }
  )
  .example([["$0 build script.js"], ["$0 deploy script.js script_name"]])
  .demandCommand(
    1,
    1,
    "use one of the available commands",
    "use one of the available commands"
  )
  .env("CF")
  .alias("h", "help")
  .epilogue("more information at https://github.com/adaptive/workers-ci")
  .help("help").argv;

const useragent = "workers-ci/0.2.0 (https://github.com/adaptive/workers-ci)";

const token = argv.apiToken;
const account = argv.account;
const script = argv.script;
const script_name = argv.script_name;

if (argv._[0] === "deploy") {
  if (!token) {
    console.error("⚠️  Missing environment variable CF_API_TOKEN");
    process.exit();
  }
  if (!account) {
    console.error("⚠️  Missing environment variable CF_ACCOUNT");
    process.exit();
  }

  const compiler = webpack({
    mode: "production",
    target: "webworker",
    performance: {
      hints: false,
      maxAssetSize: 2500000
    },
    devtool: false,
    entry: `./${script}`,
    output: { filename: "../dist/worker.js" }
  });

  const promise = new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        return reject(err);
      }
      if (stats) {
        //process.stdout.write(stats.toString({ colors: true }) + "\n");
        console.log("📦 Bundled");
        resolve(stats);
      }
    });
  });

  promise.then(
    result => {
      fsp
        .readFile("./dist/worker.js", "utf8")
        .then(data => {
          return fetch(
            `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${script_name}`,
            {
              method: "PUT",
              headers: {
                "User-Agent": useragent,
                Authorization: `Bearer ${token}`,
                "Content-Type": `application/javascript`
              },
              body: `${data}`
            }
          );
        })
        .then(res => {
          if (res.status === 200) {
            console.log("🌍 Deployed");
          } else if (res.status === 403) {
            console.log("⚠️  Invalid Credentials");
          } else {
            console.log("⚠️  Failed");
          }
        });
    },
    err => {
      console.log("Failed");
    }
  );
} else if (argv._[0] === "build") {
  const compiler = webpack({
    mode: "development",
    target: "webworker",
    devtool: false,
    entry: `./${script}`,
    output: { filename: "../dist/worker.js" }
  });

  compiler.run((err, stats) => {
    if (err) {
      return reject(err);
    }
    if (stats) {
      //process.stdout.write(stats.toString({ colors: true }) + "\n");
      console.log("📦 Bundled (dist/worker.js)");
    }
  });
}
