import { CampaignCreatorApp } from "./app.js";
import { setupQuestTracker } from "./quest-tracker.js";

Hooks.once("init", () => {
    console.log("WHFRPG 3e Campaign Creator | Initializing");

    game.settings.register("whfrpg3dcampaigncreator", "geminiApiKey", {
        name: "WHFRPG3E.Settings.GeminiAPIKey.Name",
        hint: "WHFRPG3E.Settings.GeminiAPIKey.Hint",
        scope: "world",
        config: true,
        type: String,
        default: ""
    });

    game.settings.register("whfrpg3dcampaigncreator", "geminiModel", {
        name: "WHFRPG3E.Settings.GeminiModel.Name",
        hint: "WHFRPG3E.Settings.GeminiModel.Hint",
        scope: "world",
        config: true,
        type: String,
        default: "gemini-2.5-flash"
    });
});

async function openAIModifyDialog(actor) {
    const d = new Dialog({
        title: "AI Modify: " + actor.name,
        content: `
            <p>Describe how you want to modify this character. For example: <i>'Level them up to be a boss', 'Add a poisoned dagger action', 'Make them a spellcaster'</i>.</p>
            <div class="form-group">
                <textarea id="ai-fix-prompt" rows="4" style="width: 100%;"></textarea>
            </div>
        `,
        buttons: {
            generate: {
                icon: '<i class="fas fa-magic"></i>',
                label: "Modify",
                callback: async (html) => {
                    const prompt = html.find("#ai-fix-prompt").val();
                    if (prompt) {
                        const { fixActorWithAI } = await import("./app.js");
                        await fixActorWithAI(actor, prompt);
                    }
                }
            }
        },
        default: "generate"
    });
    d.render(true);
}

// 1. Add to the V2 Actor Sheets "Toggle Controls" menu (the 3 vertical dots)
function addV2HeaderButton(app, buttons) {
    // Determine the actor robustly
    const actor = app.document || app.actor;
    if (!actor || !(actor instanceof Actor)) return;
    
    // Only GMs should see this
    if (game.user && !game.user.isGM) return;

    // Prevent duplicates if multiple hooks fire
    if (buttons.some(b => b.action === "aiModify")) return;

    // Register the action handler dynamically for this specific app instance
    if (!app.options.actions) app.options.actions = {};
    app.options.actions["aiModify"] = function() {
        const currentActor = this.document || this.actor;
        if (currentActor) openAIModifyDialog(currentActor);
    };

    // Add the button
    buttons.unshift({
        action: "aiModify",
        icon: "fa-solid fa-magic",
        label: "AI Modify"
    });
}

// Foundry V12+ ApplicationV2 hooks fire for the exact class name and all parent classes
const v2Hooks = [
    "getApplicationHeaderControls",
    "getHeaderControlsApplicationV2",
    "getHeaderControlsDocumentSheetV2",
    "getHeaderControlsActorSheetV2",
    "getHeaderControlsActorSheet",
    "getHeaderControlsCharacterSheet",
    "getHeaderControlsCreatureSheet",
    "getHeaderControlsGroupSheet",
    "getHeaderControlsPartySheet",
    "getHeaderControlsNPCSheet"
];

v2Hooks.forEach(hookName => {
    Hooks.on(hookName, addV2HeaderButton);
});

// 2. Fallback for V1 Sheets just in case any mods use them
Hooks.on("getActorSheetHeaderButtons", (sheet, buttons) => {
    if (game.user && !game.user.isGM) return;
    buttons.unshift({
        label: "AI Modify",
        icon: "fas fa-magic",
        class: "campaign-creator-fix",
        onclick: () => {
            if (sheet.actor) openAIModifyDialog(sheet.actor);
        }
    });
});

Hooks.on("getSceneControlButtons", (controls) => {
    // game.user might not be initialized yet when this hook first fires
    if (game.user && !game.user.isGM) return;

    const generatorTool = {
        name: "campaign-creator",
        title: "Generate New Character (AI)",
        icon: "fas fa-magic",
        button: true,
        visible: true,
        onClick: () => {
            new CampaignCreatorApp().render(true);
        }
    };

    if (Array.isArray(controls)) {
        const tokenControls = controls.find(c => c.name === "token");
        if (tokenControls && tokenControls.tools) {
            tokenControls.tools.push(generatorTool);
        }
    } else {
        // V14 compatibility: object-keyed structure
        if (controls.token && controls.token.tools) {
            controls.token.tools["campaign-creator"] = generatorTool;
        }
    }
});

Hooks.once("ready", () => {
    if (game.user.isGM) {
        setupQuestTracker();
    }
});
