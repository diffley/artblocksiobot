require("dotenv").config();
const {
  MessageEmbed
} = require("discord.js");
const fetch = require("node-fetch");
const Web3 = require("web3");
const getArtBlocksPlatform = require("../Utils/parseArtBlocksAPI").getArtBlocksPlatform;
const getArtBlocksProject = require("../Utils/parseArtBlocksAPI").getArtBlocksProject;
const isFactoryProject = require("../Utils/parseArtBlocksAPI").isFactoryProject;
const ProjectBot = require("./ProjectBot").ProjectBot;

const web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");

const V2_MINTING_CONTRACT_ADDRESS = "0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270";

// Refresh takes around one minute, so recommend setting this to 60 minutes
const METADATA_REFRESH_INTERVAL_MINUTES = process.env.METADATA_REFRESH_INTERVAL_MINUTES;

// This array will hold ProjectBot classes for all the Factory Projects we find
let factoryBotList = [];

class FactoryBot {
  constructor(projectNumber, mintContract, editionNumber, projectName) {
    this.initialize();
    setInterval(this.initialize, METADATA_REFRESH_INTERVAL_MINUTES * 60000);
  }

  async initialize() {

    let projectList = await getArtBlocksPlatform();

    for (let i = 0; i < projectList.length; i++) {
       let projectData = await getArtBlocksProject(projectList[i]);

       if (projectData && isFactoryProject(projectList[i])) {
	   console.log(`Refreshing project cache for Project ${projectList[i]} ${projectData.name}`);
           let newBot = new ProjectBot(
                   projectList[i]*1000000,
                   V2_MINTING_CONTRACT_ADDRESS,
                   projectData.invocations,
                   projectData.name
                   );
           let nameIndex = projectData.name.toLowerCase().replace(/\s+/g, '');
           factoryBotList[nameIndex] = newBot;
       }

    }

  }

  async handleNumberMessage(msg) {

    let content = msg.content;

    if (content.length <= 1) {
      msg.channel.send(
        `Invalid format, enter # followed by the piece number of interest.`
      );
      return;
    }

    let afterTheHash = content.substring(1);
    let nameIndex = content.substr(content.indexOf(" ")+1).toLowerCase().replace(/\s+/g, '');
    console.log(`Searching for project ${nameIndex}`);
    let projBot = factoryBotList[nameIndex];
    if (projBot) {
       projBot.handleNumberMessage(msg);
    }
  }

}

module.exports.FactoryBot = FactoryBot;
