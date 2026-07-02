# WFRP 3e Campaign Creator (Foundry VTT Module)

This module provides an AI-powered campaign creator directly inside Foundry VTT, specifically tailored for the Warhammer Fantasy Roleplay 3rd Edition (`wfrp3e`) system. It uses Google's Gemini API to generate Characters, Items, Story Beats, and Quests with flavorful formatting natively inside your Foundry UI.

## Features
- **Character Generator:** Creates a character actor with stats and a backstory.
- **Item Generator:** Generates a trapping/item with immersive descriptions.
- **Story Generator:** Generates campaign events formatted as Foundry Journal Entries.
- **Quest Generator:** Creates a shared quest (with default "Owner" permissions for players) featuring a checklist of objectives that players can view and interact with.

## Prerequisites
- A **Google AI Studio** account to obtain a free Gemini API key.

## Installation

### Via GitHub Release (Recommended)
1. In Foundry VTT, go to the **Add-on Modules** tab in the Setup menu.
2. Click **Install Module**.
3. In the Manifest URL field, paste the link to the `module.json` from the latest release:
   `https://raw.githubusercontent.com/<YOUR_USERNAME>/whfrpg3dcampaignCreator/main/module.json`
   *(Note: You will need to replace `<YOUR_USERNAME>` with your actual GitHub username or use the zip download method below once published).*
4. Click **Install**.

### Manual Installation
1. Go to the [Releases](https://github.com/<YOUR_USERNAME>/whfrpg3dcampaignCreator/releases) page of this repository.
2. Download the `module.zip` from the latest release.
3. Extract the contents into your Foundry VTT `Data/modules/whfrpg3dcampaigncreator` folder.
4. Restart your Foundry server.

## Setup and Usage

1. **Enable the Module:** Launch your world and go to **Manage Modules** (under Game Settings). Enable **WFRP 3e Campaign Creator**.
2. **Configure API Key:**
   - Go to **Game Settings** -> **Configure Settings** -> **Module Settings**.
   - Locate the **Gemini API Key** setting.
   - Paste your Google Gemini API Key here. (You can get one for free at [Google AI Studio](https://aistudio.google.com/)).
   - Set the **Gemini Model** (default is `gemini-1.5-pro-latest`, but you can also use `gemini-1.5-flash` for faster generation).
3. **Open the Generator:**
   - As a GM, look at your Token Controls toolbar on the left side of the screen.
   - Click the magic wand icon (`WFRP 3e Campaign Creator`).
   - Use the tabs to generate characters, items, story beats, or quests by simply typing a prompt and hitting "Generate".

## Automation
This repository uses a GitHub Action to automatically build and release the module on every push to the `main` branch. It will bump the minor version, zip the files, and create a GitHub Release automatically.
