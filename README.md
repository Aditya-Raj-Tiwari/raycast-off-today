# Staff on Leave Extension Setup Guide

This guide will help you set up and share the "Staff on Leave" Raycast extension.

## Installation and Setup

1. **Clone or download** the extension to your local machine.

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Notion Integration**:

   a. Create a Notion integration at [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations):
      - Click "New integration"
      - Name it "Staff on Leave"
      - Set the capabilities needed (Read content, Read user information, etc.)
      - Submit to get your integration token

   b. Share your database with the integration:
      - Go to your leave database page in Notion
      - Click "Share" in the top right corner
      - Click "Add connections"
      - Search for your integration and select it

   c. Get your database ID:
      - Open your database in Notion
      - Look at the URL: `https://www.notion.so/workspace/1b8ca847220d80d883acce80437d1bf4?v=...`
      - The database ID is the part after the workspace name (format it as `1b8ca847-220d-80d8-83ac-ce80437d1bf4` with hyphens)

4. **Build and run** the extension:
   ```bash
   npm run dev
   ```

## Required Database Structure

Your Notion database should have the following properties:
- "Employee Name" (Title type)
- "Start Date" (Date type)
- "End Date" (Date type)
- "Status" (Status type with options: Pending, Approved, Rejected)
- "Reason" (Text type)

## Sharing the Extension

### Option 1: Share Directly with Raycast Store

If you want to publish your extension to the Raycast Store:

1. Create a store submission:
   ```bash
   npm run publish
   ```

2. Follow the prompts to complete the submission process.

### Option 2: Share with Your Team

To share with your team without publishing to the store:

1. Build the extension:
   ```bash
   npm run build
   ```

2. Package your extension:
   ```bash
   raycast extension pack
   ```

3. This will create a `.rsx` file that you can share with your team members.

4. Team members can install the extension by:
   - Double-clicking the `.rsx` file
   - Opening Raycast and going to Extensions → Add Extension → Open Extension File
   - After installation, they need to configure the Notion API key and database ID in the extension preferences

## Troubleshooting

- If you see "Could not find database with ID", make sure:
  - The database ID is formatted correctly with hyphens
  - The integration has been granted access to the database
  - The API key is valid

- If data isn't displaying correctly, verify:
  - The database structure matches the expected property names and types
  - There are current or upcoming leave records in the database

For more help, visit [Raycast Developer Documentation](https://developers.raycast.com/).