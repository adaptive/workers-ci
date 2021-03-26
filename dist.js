#!/usr/bin/env node
"use strict";const webpack=require("webpack"),fetch=require("isomorphic-fetch"),fsp=require("fs").promises,argv=require("yargs/yargs")(process.argv.slice(2)).scriptName("workers-ci").command("build <script>","\u{1F6A7} Build your worker in development mode",e=>{e.positional("script",{describe:"script to build",type:"string"})}).command("deploy <script> <script_name>","\u{1F680} Deploy your worker across the edge",e=>{e.positional("script",{describe:"script to deploys",type:"string"}).positional("script_name",{describe:"script name at the provider",type:"string"})}).example([["$0 build script.js"],["$0 deploy script.js script_name"]]).demandCommand(1,1,"use one of the available commands","use one of the available commands").env("CF").alias("h","help").epilogue("more information at https://github.com/adaptive/workers-ci").help("help").argv,useragent="workers-ci/0.2.0 (https://github.com/adaptive/workers-ci)",token=argv.apiToken,account=argv.account,script=argv.script,script_name=argv.script_name;if(argv._[0]==="deploy"){token||(console.error("\u26A0\uFE0F  Missing environment variable CF_API_TOKEN"),process.exit()),account||(console.error("\u26A0\uFE0F  Missing environment variable CF_ACCOUNT"),process.exit());const e=webpack({mode:"production",target:"webworker",performance:{hints:!1,maxAssetSize:25e5},devtool:!1,entry:`./${script}`,output:{filename:"../dist/worker.js"}});new Promise((r,o)=>{e.run((t,i)=>{if(t)return o(t);i&&(console.log("\u{1F4E6} Bundled"),r(i))})}).then(r=>{fsp.readFile("./dist/worker.js","utf8").then(o=>fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${script_name}`,{method:"PUT",headers:{"User-Agent":useragent,Authorization:`Bearer ${token}`,"Content-Type":"application/javascript"},body:`${o}`})).then(o=>{o.status===200?console.log("\u{1F30D} Deployed"):o.status===403?console.log("\u26A0\uFE0F  Invalid Credentials"):console.log("\u26A0\uFE0F  Failed")})},r=>{console.log("Failed")})}else argv._[0]==="build"&&webpack({mode:"development",target:"webworker",devtool:!1,entry:`./${script}`,output:{filename:"../dist/worker.js"}}).run((s,r)=>{if(s)return reject(s);r&&console.log("\u{1F4E6} Bundled (dist/worker.js)")});
