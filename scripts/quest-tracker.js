export async function setupQuestTracker() {
    let folder = game.folders.find(f => f.name === "Quests" && f.type === "JournalEntry");
    if (!folder) {
        await Folder.create({
            name: "Quests",
            type: "JournalEntry",
            color: "#5b1414"
        });
    }
}
