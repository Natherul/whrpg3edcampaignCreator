import { generateJSONWithGemini, callGemini } from "./api.js";

export class CampaignCreatorApp extends Application {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "campaign-creator-app",
            title: game.i18n.localize("WHFRPG3E.App.Title"),
            template: "modules/whfrpg3dcampaigncreator/templates/generator.html",
            width: 600,
            height: "auto",
            tabs: [{ navSelector: ".tabs", contentSelector: ".content", initial: "characters" }],
            classes: ["campaign-creator"]
        });
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('.generate-btn').click(this._onGenerate.bind(this));
    }

    async _onGenerate(event) {
        event.preventDefault();
        const button = $(event.currentTarget);
        const type = button.data("type");
        const form = button.closest(".tab");
        const promptInput = form.find(".prompt-input").val();
        
        button.prop("disabled", true);
        button.text("Generating...");

        try {
            if (type === "character") {
                await this._generateCharacter(promptInput);
            } else if (type === "item") {
                await this._generateItem(promptInput);
            } else if (type === "story") {
                await this._generateStory(promptInput);
            } else if (type === "quest") {
                await this._generateQuest(promptInput);
            }
        } finally {
            button.prop("disabled", false);
            button.text(game.i18n.localize("WHFRPG3E.Button.Generate"));
        }
    }

    async _generateCharacter(prompt) {
        const instruction = `You are a WFRP 3e assistant. Create a character based on the prompt. Output JSON with the following structure:
{
  "name": "Character Name",
  "type": "character",
  "system": {
    "characteristics": {
      "strength": { "value": 3 },
      "toughness": { "value": 3 },
      "agility": { "value": 3 },
      "intelligence": { "value": 3 },
      "willpower": { "value": 3 },
      "fellowship": { "value": 3 }
    },
    "biography": "Flavorful background"
  }
}`;
        const data = await generateJSONWithGemini(prompt, instruction);
        if (data) {
            const actor = await Actor.create(data);
            ui.notifications.info(`Created character: ${actor.name}`);
            actor.sheet.render(true);
        }
    }

    async _generateItem(prompt) {
        const instruction = `You are a WFRP 3e assistant. Create an item based on the prompt. Output JSON with structure:
{
  "name": "Item Name",
  "type": "item",
  "system": {
    "description": "Flavorful item description and stats."
  }
}`;
        const data = await generateJSONWithGemini(prompt, instruction);
        if (data) {
            if(data.type === "item") data.type = "trapping";
            const item = await Item.create(data);
            ui.notifications.info(`Created item: ${item.name}`);
            item.sheet.render(true);
        }
    }

    async _generateStory(prompt) {
        const instruction = "You are a WFRP 3e GM. Write a compelling story beat or campaign event. Format as HTML for a journal entry.";
        const text = await callGemini(prompt, instruction);
        if (text) {
            const folder = await this._getOrCreateFolder("Campaign Story");
            const entry = await JournalEntry.create({
                name: "Story Beat: " + new Date().toLocaleDateString(),
                folder: folder.id,
                pages: [{
                    name: "Content",
                    type: "text",
                    text: { content: text, format: 1 }
                }]
            });
            ui.notifications.info("Created Story Beat Journal");
            entry.sheet.render(true);
        }
    }

    async _generateQuest(prompt) {
        const instruction = `You are a WFRP 3e GM. Generate a new quest. Output JSON with:
{
  "title": "Quest Title",
  "description": "HTML description of the quest, with nice flavor text",
  "objectives": [
    "Objective 1",
    "Objective 2"
  ]
}`;
        const data = await generateJSONWithGemini(prompt, instruction);
        if (data) {
            const folder = await this._getOrCreateFolder("Quests");
            
            let htmlContent = `<h2>${data.title}</h2><div>${data.description}</div><h3>Objectives</h3><ul>`;
            for (const obj of data.objectives) {
                htmlContent += `<li><input type="checkbox"> ${obj}</li>`;
            }
            htmlContent += `</ul>`;

            const entry = await JournalEntry.create({
                name: data.title,
                folder: folder.id,
                pages: [{
                    name: "Quest Details",
                    type: "text",
                    text: { content: htmlContent, format: 1 }
                }],
                ownership: {
                    default: 3 
                }
            });
            ui.notifications.info(`Created Quest: ${data.title}`);
            entry.sheet.render(true);
        }
    }

    async _getOrCreateFolder(folderName) {
        let folder = game.folders.find(f => f.name === folderName && f.type === "JournalEntry");
        if (!folder) {
            folder = await Folder.create({
                name: folderName,
                type: "JournalEntry",
                color: "#5b1414"
            });
        }
        return folder;
    }
}
