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
        default: "gemini-1.5-pro-latest"
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
