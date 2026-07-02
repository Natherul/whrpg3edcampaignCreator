export async function callGemini(prompt, systemInstruction = "") {
    const apiKey = game.settings.get("whfrpg3dcampaigncreator", "geminiApiKey");
    const model = game.settings.get("whfrpg3dcampaigncreator", "geminiModel");

    if (!apiKey) {
        ui.notifications.error("Please set your Gemini API Key in the module settings.");
        return null;
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const payload = {
        contents: [{ parts: [{ text: prompt }] }]
    };

    if (systemInstruction) {
        payload.systemInstruction = {
            parts: [{ text: systemInstruction }]
        };
    }

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            console.error("Gemini API Error:", err);
            ui.notifications.error("Error communicating with Gemini API.");
            return null;
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (e) {
        console.error("Gemini API Exception:", e);
        ui.notifications.error("Exception communicating with Gemini API.");
        return null;
    }
}

export async function generateJSONWithGemini(prompt, systemInstruction) {
    const fullPrompt = `${prompt}\n\nPlease output valid JSON only, without markdown code blocks.`;
    const response = await callGemini(fullPrompt, systemInstruction);
    if (!response) return null;
    
    try {
        let jsonStr = response.replace(/```json\n/g, "").replace(/```/g, "").trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to parse Gemini response as JSON:", response, e);
        ui.notifications.error("Failed to parse generation result. See console for details.");
        return null;
    }
}
