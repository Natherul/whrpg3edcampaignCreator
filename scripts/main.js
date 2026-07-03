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
const sheetClasses = ["ActorSheet", "CharacterSheet", "CreatureSheet", "GroupSheet", "PartySheet"];
for (const cls of sheetClasses) {
    Hooks.on(`getHeaderControls${cls}`, (app, controls) => {
        if (game.user && !game.user.isGM) return;
        controls.unshift({
            action: "aiModify",
            icon: "fa-solid fa-magic",
            label: "AI Modify"
        });
    });
    
    Hooks.on(`render${cls}`, (app, html) => {
        const windowFrame = app.element || (html.length ? html[0] : html);
        if (!windowFrame) return;
        const btn = windowFrame.querySelector('[data-action="aiModify"]');
        if (btn && !btn.dataset.aiBound) {
            btn.dataset.aiBound = "true";
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const actor = app.document || app.actor;
                if (actor) openAIModifyDialog(actor);
            });
        }
    });
}

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

    const tool = {
        name: "campaign-creator",
        title: "WHFRPG3E.App.Title",
        icon: "fas fa-magic",
        button: true,
        visible: true,
        onClick: () => {
            new CampaignCreatorApp().render(true);
        }
    };

    if (Array.isArray(controls)) {
        // Foundry V13 and older
        const tokenControls = controls.find(c => c.name === "token");
        if (tokenControls) {
            tokenControls.tools.push(tool);
        }
    } else {
        // Foundry V14+
        const tokenControls = controls.token || controls.tokens;
        if (tokenControls && tokenControls.tools) {
            if (Array.isArray(tokenControls.tools)) {
                tokenControls.tools.push(tool);
            } else {
                tokenControls.tools["campaign-creator"] = tool;
            }
        }
    }
});

Hooks.once("ready", () => {
    if (game.user.isGM) {
        setupQuestTracker();
    }
});
