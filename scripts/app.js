import { generateJSONWithGemini, callGemini } from "./api.js";

export async function fixActorWithAI(actor, prompt) {
    ui.notifications.info(`AI modifying ${actor.name}... please wait.`);
    
    // Create a simplified clone for the prompt to save tokens and confusion
    const actorData = actor.toObject();
    
    const instruction = `You are a WFRP 3e assistant. You are given the JSON representation of an existing Actor, and a prompt describing how to modify it.
Return the complete, modified JSON object representing the Actor.
Make sure to output valid WFRP3e data model structure.

Existing Actor JSON:
${JSON.stringify(actorData)}

Requested Modification:
${prompt}`;

    // Note: use generateJSONWithGemini with the context builder attached if desired, 
    // but the full prompt is passed into generateJSONWithGemini.
    const data = await generateJSONWithGemini(prompt, instruction);
    if (data) {
        const newItems = data.items;
        delete data.items;
        
        await actor.update(data);
        
        if (newItems && Array.isArray(newItems)) {
            // Remove _id to prevent validation errors on creation
            newItems.forEach(i => delete i._id);

            const existingIds = actor.items.map(i => i.id);
            if (existingIds.length > 0) {
                await actor.deleteEmbeddedDocuments("Item", existingIds);
            }
            await actor.createEmbeddedDocuments("Item", newItems);
        }
        ui.notifications.info(`${actor.name} successfully modified!`);
    } else {
        ui.notifications.error(`Failed to modify ${actor.name}.`);
    }
}

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

    _getRelevantJournalContext(prompt) {
        const stopWords = new Set(["this", "that", "with", "from", "your", "what", "have", "they", "will", "would", "could", "should", "their", "them", "then", "than", "there", "these", "those", "were", "been", "much", "many", "some", "very", "upon", "into", "about", "like", "just", "only", "also"]);
        
        const promptWords = (prompt.toLowerCase().match(/\b[a-z]{4,}\b/g) || [])
            .filter(w => !stopWords.has(w));

        let context = "";

        for (let journal of game.journal) {
            for (let page of journal.pages) {
                if (page.type === "text" && page.text.content) {
                    const contentStr = page.text.content.toLowerCase();
                    
                    const isRelevant = promptWords.length === 0 || promptWords.some(word => contentStr.includes(word));
                    
                    if (isRelevant) {
                        const cleanText = page.text.content.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
                        context += `\n--- Source: ${journal.name} (${page.name}) ---\n${cleanText}\n`;
                    }
                }
            }
        }
        
        if (context) {
            return `\n\n=== RELEVANT CAMPAIGN LORE ===\nUse the following excerpts from the GM's campaign journals to seamlessly weave the generated content into the existing world. Ensure names, locations, relationships, and events align with this lore:\n${context}\n==============================\n`;
        }
        return "";
    }

    async _generateCharacter(prompt) {
        const instruction = `You are a WFRP 3e assistant. Create an NPC or Creature based on the prompt. Output JSON with the exact WFRP3e data model structure.
CRITICAL: You MUST include at least one action in the 'items' array. Fill the 'effects' object for actions using exactly these keys: success, righteousSuccess, boon, sigmarsComet, challenge, bane, chaosStar, delay, exertion. Each key should be an array of effect objects.
For effect descriptions, use mechanical terminology suitable for WFRP3e: e.g. "Deal 1 extra damage", "Recover 1 fatigue or stress", "Target suffers 1 critical wound", "Perform a free maneuver", "Gain 1 fortune", "Add 1 misfortune die to the target's next check", "Ignore 1 soak", etc. Do NOT invent generic DnD-style spells or mechanics.

Example Structure:
{
  "name": "Creature Name",
  "type": "creature",
  "system": {
    "characteristics": {
      "strength": { "rating": 3, "fortune": 0 },
      "toughness": { "rating": 3, "fortune": 0 },
      "agility": { "rating": 3, "fortune": 0 },
      "intelligence": { "rating": 3, "fortune": 0 },
      "willpower": { "rating": 3, "fortune": 0 },
      "fellowship": { "rating": 3, "fortune": 0 }
    },
    "attributes": {
      "aggression": { "max": 1, "value": 1 },
      "cunning": { "max": 0, "value": 0 },
      "expertise": { "max": 1, "value": 1 }
    },
    "wounds": { "max": 12, "value": 12 },
    "damageRating": 4,
    "threatRating": 2,
    "defenceValue": 1,
    "soakValue": 1,
    "description": "Flavorful background HTML"
  },
  "items": [
    {
      "name": "Savage Strike",
      "type": "action",
      "system": {
        "type": "melee",
        "conservative": {
          "name": "Savage Strike",
          "rechargeRating": 0,
          "difficultyModifiers": { "challengeDice": 1, "misfortuneDice": 0 },
          "check": "Strength vs Defense",
          "effects": {
            "success": [{ "description": "Deal 1 extra damage", "symbolAmount": 1 }]
          }
        },
        "reckless": {
          "name": "Savage Strike",
          "rechargeRating": 0,
          "difficultyModifiers": { "challengeDice": 1, "misfortuneDice": 0 },
          "check": "Strength vs Defense",
          "effects": {
            "boon": [{ "description": "Recover 1 fatigue", "symbolAmount": 1 }],
            "sigmarsComet": [{ "description": "Critical Hit!", "symbolAmount": 1 }]
          }
        }
      }
    }
  ]
}`;
        const lore = this._getRelevantJournalContext(prompt);
        const data = await generateJSONWithGemini(prompt + lore, instruction);
        if (data) {
            const items = data.items;
            delete data.items;
            
            const actor = await Actor.create(data);
            
            if (items && items.length > 0) {
                // Remove _id to prevent validation errors on creation
                items.forEach(i => delete i._id);
                await actor.createEmbeddedDocuments("Item", items);
            }
            
            ui.notifications.info(`Created character: ${actor.name}`);
            actor.sheet.render(true);
        }
    }

    async _generateItem(prompt) {
        const instruction = `You are a WFRP 3e assistant. Create an item based on the prompt. Decide if it is a "weapon", "armour", or generic "trapping" (like potions/tools).
Output exactly one JSON object using the exact WFRP3e data model structure for the chosen type:

For weapons:
{ "name": "Sword", "type": "weapon", "system": { "description": "Desc", "encumbrance": 1, "rarity": "common", "cost": {"gold": 0, "silver": 1, "brass": 0}, "criticalRating": 4, "damageRating": 5, "equipped": "unequipped", "group": "ordinary", "range": "close", "qualities": [ { "name": "pierce", "rating": 1 } ] } }

For armour (types: armour, shield):
{ "name": "Leather Armor", "type": "armour", "system": { "description": "Desc", "encumbrance": 2, "rarity": "common", "cost": {"gold": 0, "silver": 2, "brass": 0}, "defenceValue": 1, "soakValue": 1, "equipped": false, "type": "armour" } }

For other items (potions, tools, etc.):
{ "name": "Healing Potion", "type": "trapping", "system": { "description": "Desc", "encumbrance": 0, "rarity": "common", "cost": {"gold": 0, "silver": 0, "brass": 5} } }

Note: valid weapon groups include blackpowder, bow, cavalry, crossbow, fencing, flail, greatWeapon, ordinary, polearm, sling, spear, staff, thrown, unarmed.
Valid weapon qualities include attuned, blast, defensive, entangling, fast, pierce, reload, slow, thrown, twoHanded, unreliable, vicious.
Valid rarities: abundant, plentiful, common, rare, exotic.`;
        const data = await generateJSONWithGemini(prompt, instruction);
        if (data) {
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
        const lore = this._getRelevantJournalContext(prompt);
        const data = await generateJSONWithGemini(prompt + lore, instruction);
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
