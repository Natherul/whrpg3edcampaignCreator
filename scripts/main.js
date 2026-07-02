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
    const isGM = game.user.isGM;
    if (!isGM) return;

    const tokenControls = controls.find(c => c.name === "token");
    if (tokenControls) {
        tokenControls.tools.push({
            name: "campaign-creator",
            title: "WHFRPG3E.App.Title",
            icon: "fas fa-magic",
            button: true,
            onClick: () => {
                new CampaignCreatorApp().render(true);
            }
        });
    }
});

Hooks.once("ready", () => {
    if (game.user.isGM) {
        setupQuestTracker();
    }
});
