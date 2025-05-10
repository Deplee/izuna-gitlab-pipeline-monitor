# GitLab Pipeline Monitor

A Next.js application to monitor GitLab pipelines and receive notifications in Zulip and Telegram.

## Features

- Monitor pipelines from multiple GitLab repositories
- Filter pipelines by status, repository, and branch
- Configure notifications for Zulip and Telegram
- Choose which pipeline statuses trigger notifications
- Dark theme by default

## Running with Docker

The easiest way to run the application is using Docker Compose:

\`\`\`bash
docker-compose up -d
\`\`\`

This will:
1. Build the Docker image
2. Start the container
3. Make the application available at http://localhost:3000

The application data (settings) will be stored in the `./data` directory.

## Development

To run the application in development mode:

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

## Configuration

1. Configure your GitLab settings in the Settings dialog:
   - GitLab URL (e.g., https://gitlab.com)
   - Personal Access Token with API access
   - Repository IDs to monitor (comma-separated)

2. Configure notification preferences:
   - Choose which pipeline statuses trigger notifications
   - By default, only failed pipelines trigger notifications

3. For Zulip notifications:
   - Enable Zulip integration
   - Provide Zulip URL, bot email, API key
   - Specify stream and topic for notifications

4. For Telegram notifications:
   - Enable Telegram integration
   - Provide bot token (created via @BotFather)
   - Provide chat ID where notifications should be sent

## GitLab Webhook Setup (Optional)

For real-time notifications, you can set up a GitLab webhook:

1. Go to your GitLab repository > Settings > Webhooks
2. Add a new webhook with the URL: `https://your-app-url/api/webhook`
3. Select "Pipeline events" as the trigger
4. Save the webhook
