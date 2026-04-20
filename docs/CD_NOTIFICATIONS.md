# 📢 CD Workflow Notifications - Integration Guide

This guide shows how to integrate deployment notifications with Discord, Slack, and other services.

---

## 🔗 Discord Webhook Integration

### 1. Create Discord Webhook

1. **Open your Discord server** → Right-click channel
2. **Edit Channel** → **Integrations** → **Webhooks** → **New Webhook**
3. **Copy Webhook URL** — Save as GitHub secret `DISCORD_WEBHOOK_URL`

### 2. Add to GitHub Secrets

```bash
Settings → Secrets and variables → Actions → New repository secret
Name: DISCORD_WEBHOOK_URL
Value: https://discordapp.com/api/webhooks/...
```

### 3. Add Discord Step to cd.yml

Replace the `notify-deployment` job's `Send deployment notification` step:

```yaml
- name: Send Discord notification
  if: always()
  uses: stegzilla/github-action-discord@v0.0.2
  with:
    webhook-url: ${{ secrets.DISCORD_WEBHOOK_URL }}
    username: "GitHub Actions"
    avatar-url: "https://www.github.com/fluidicon.png"
    embed: |
      {
        "title": "Deployment: ${{ job.status == 'success' && '✅ Success' || '❌ Failed' }}",
        "description": "Micro-Gestion-Facile deployment on production",
        "color": ${{ job.status == 'success' && "3066993" || "15158332" }},
        "fields": [
          {
            "name": "Branch",
            "value": "${{ github.ref_name }}",
            "inline": true
          },
          {
            "name": "Commit",
            "value": "${{ github.sha }}",
            "inline": true
          },
          {
            "name": "Author",
            "value": "${{ github.actor }}",
            "inline": true
          },
          {
            "name": "Action URL",
            "value": "[View Workflow](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }})",
            "inline": false
          }
        ],
        "timestamp": "${{ github.event.head_commit.timestamp }}"
      }
```

**Or simpler version:**

```yaml
- name: Send Discord notification
  if: always()
  run: |
    STATUS="${{ job.status }}"
    EMOJI=$([ "$STATUS" = "success" ] && echo "✅" || echo "❌")

    curl -X POST "${{ secrets.DISCORD_WEBHOOK_URL }}" \
      -H "Content-Type: application/json" \
      -d @- << EOF
    {
      "embeds": [{
        "title": "$EMOJI Micro-Gestion-Facile Deployment",
        "description": "Production deployment $([ "$STATUS" = "success" ] && echo "successful" || echo "failed")",
        "color": $([ "$STATUS" = "success" ] && echo "3066993" || echo "15158332"),
        "fields": [
          {"name": "Status", "value": "$STATUS", "inline": true},
          {"name": "Branch", "value": "${{ github.ref_name }}", "inline": true},
          {"name": "Commit", "value": "${{ github.sha }}", "inline": false},
          {"name": "Author", "value": "${{ github.actor }}", "inline": true},
          {"name": "Workflow", "value": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}", "inline": false}
        ]
      }]
    }
    EOF
```

---

## 🎯 Slack Integration

### 1. Create Slack Webhook

1. **Go to** [api.slack.com/apps](https://api.slack.com/apps) → **Create New App**
2. **From scratch** → Name: "GitHub Actions", Workspace: yours
3. **Incoming Webhooks** → **Add New Webhook to Workspace**
4. Select channel → **Authorize**
5. Copy **Webhook URL** → Save as GitHub secret `SLACK_WEBHOOK_URL`

### 2. Add to GitHub Secrets

```
Settings → Secrets and variables → Actions → New repository secret
Name: SLACK_WEBHOOK_URL
Value: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX
```

### 3. Add Slack Step

```yaml
- name: Send Slack notification
  if: always()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "Micro-Gestion-Facile Deployment",
        "blocks": [
          {
            "type": "header",
            "text": {
              "type": "plain_text",
              "text": "${{ job.status == 'success' && '✅ Deployment Successful' || '❌ Deployment Failed' }}"
            }
          },
          {
            "type": "section",
            "fields": [
              {
                "type": "mrkdwn",
                "text": "*Branch:*\n${{ github.ref_name }}"
              },
              {
                "type": "mrkdwn",
                "text": "*Author:*\n${{ github.actor }}"
              },
              {
                "type": "mrkdwn",
                "text": "*Commit:*\n`${{ github.sha }}`"
              },
              {
                "type": "mrkdwn",
                "text": "*Status:*\n${{ job.status }}"
              }
            ]
          },
          {
            "type": "actions",
            "elements": [
              {
                "type": "button",
                "text": {
                  "type": "plain_text",
                  "text": "View Workflow"
                },
                "url": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
              }
            ]
          }
        ]
      }
```

---

## 📧 Email Notification

### Via GitHub Actions (simple)

```yaml
- name: Send email notification
  if: always()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: ${{ secrets.EMAIL_SERVER }}
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: "🚀 Deployment ${{ job.status == 'success' && '✅ Success' || '❌ Failed' }}"
    to: ${{ secrets.EMAIL_RECIPIENTS }}
    from: "GitHub Actions <${{ secrets.EMAIL_FROM }}>"
    body: |
      Deployment Summary
      ==================

      Status: ${{ job.status }}
      Repository: ${{ github.repository }}
      Branch: ${{ github.ref_name }}
      Commit: ${{ github.sha }}
      Author: ${{ github.actor }}

      Workflow: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

---

## 📲 Telegram Notification

### 1. Create Telegram Bot

1. **Chat with @BotFather** on Telegram
2. `/newbot` → Follow prompts
3. Copy **Bot Token** → Save as `TELEGRAM_BOT_TOKEN`
4. Create private group or channel
5. Add bot to group
6. Get **Chat ID**: `@userinfobot` or `@getidsbot`
7. Save as `TELEGRAM_CHAT_ID`

### 2. Add to GitHub Secrets

```
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

### 3. Add Telegram Step

```yaml
- name: Send Telegram notification
  if: always()
  run: |
    STATUS="${{ job.status }}"
    EMOJI=$([ "$STATUS" = "success" ] && echo "✅" || echo "❌")

    curl -X POST "https://api.telegram.org/bot${{ secrets.TELEGRAM_BOT_TOKEN }}/sendMessage" \
      -d chat_id="${{ secrets.TELEGRAM_CHAT_ID }}" \
      -d parse_mode="HTML" \
      -d text="
    <b>$EMOJI Deployment: $STATUS</b>

    <b>Repository:</b> ${{ github.repository }}
    <b>Branch:</b> ${{ github.ref_name }}
    <b>Author:</b> ${{ github.actor }}
    <b>Commit:</b> <code>${{ github.sha }}</code>

    <a href='${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}'>View Workflow →</a>
    "
```

---

## 🚀 Microsoft Teams Integration

### 1. Create Incoming Webhook

1. **Open Teams Channel** → Click **⋯** → **Connectors**
2. Search "Incoming Webhook" → **Configure**
3. Name: "GitHub Actions", Upload image
4. Copy **Webhook URL** → Save as `TEAMS_WEBHOOK_URL`

### 2. Add to GitHub Secrets

```
TEAMS_WEBHOOK_URL
```

### 3. Add Teams Step

```yaml
- name: Send Teams notification
  if: always()
  run: |
    STATUS="${{ job.status }}"
    COLOR=$([ "$STATUS" = "success" ] && echo "00B050" || echo "E81123")

    curl -X POST "${{ secrets.TEAMS_WEBHOOK_URL }}" \
      -H "Content-Type: application/json" \
      -d @- << EOF
    {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      "summary": "Micro-Gestion-Facile Deployment",
      "themeColor": "$COLOR",
      "sections": [
        {
          "activityTitle": "🚀 Deployment: $STATUS",
          "activitySubtitle": "Micro-Gestion-Facile",
          "facts": [
            {
              "name": "Branch:",
              "value": "${{ github.ref_name }}"
            },
            {
              "name": "Author:",
              "value": "${{ github.actor }}"
            },
            {
              "name": "Commit:",
              "value": "${{ github.sha }}"
            }
          ],
          "potentialAction": [
            {
              "@type": "OpenUri",
              "name": "View Workflow",
              "targets": [
                {
                  "os": "default",
                  "uri": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
                }
              ]
            }
          ]
        }
      ]
    }
    EOF
```

---

## 📊 PagerDuty On-Call Alert (Critical Deployments)

```yaml
- name: Notify PagerDuty on failure
  if: failure()
  uses: morrissimo/pagerduty-action@v1
  with:
    routing_key: ${{ secrets.PAGERDUTY_ROUTING_KEY }}
    event_action: trigger
    dedup_key: micro-gestion-facile-${{ github.run_id }}
    severity: critical
    summary: "Deployment failed for Micro-Gestion-Facile"
    source: "GitHub Actions"
    custom_details: |
      {
        "repository": "${{ github.repository }}",
        "branch": "${{ github.ref_name }}",
        "commit": "${{ github.sha }}",
        "author": "${{ github.actor }}",
        "workflow": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
      }
```

---

## 🎨 Complete Notification Template (Multi-Channel)

Add this to your `cd.yml` in the `notify-deployment` job:

```yaml
notify-deployment:
  name: Notify Deployment Status
  runs-on: ubuntu-latest
  needs: [deploy-ssh]
  if: always()

  steps:
    - name: Check deployment status
      id: status
      run: |
        if [ "${{ needs.deploy-ssh.result }}" == "success" ]; then
          echo "OUTCOME=✅ Deployment Successful" >> $GITHUB_OUTPUT
          echo "COLOR=success" >> $GITHUB_OUTPUT
          echo "EMOJI=✅" >> $GITHUB_OUTPUT
        else
          echo "OUTCOME=❌ Deployment Failed" >> $GITHUB_OUTPUT
          echo "COLOR=failure" >> $GITHUB_OUTPUT
          echo "EMOJI=❌" >> $GITHUB_OUTPUT
        fi

    # Discord
    - name: Send Discord notification
      if: env.DISCORD_WEBHOOK_URL != ''
      continue-on-error: true
      run: |
        curl -X POST "${{ secrets.DISCORD_WEBHOOK_URL }}" \
          -H "Content-Type: application/json" \
          -d @- << 'EOF'
        {
          "embeds": [{
            "title": "${{ steps.status.outputs.OUTCOME }}",
            "description": "Micro-Gestion-Facile production deployment",
            "color": $([ "${{ steps.status.outputs.COLOR }}" = "success" ] && echo "3066993" || echo "15158332"),
            "fields": [
              {"name": "Branch", "value": "${{ github.ref_name }}", "inline": true},
              {"name": "Author", "value": "${{ github.actor }}", "inline": true},
              {"name": "Commit", "value": "${{ github.sha }}", "inline": false},
              {"name": "Workflow", "value": "[${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }})", "inline": false}
            ]
          }]
        }
        EOF
      env:
        DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}

    # Slack
    - name: Send Slack notification
      if: env.SLACK_WEBHOOK_URL != ''
      continue-on-error: true
      uses: slackapi/slack-github-action@v1
      with:
        webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
        payload: |
          {
            "text": "${{ steps.status.outputs.OUTCOME }}",
            "blocks": [
              {"type": "divider"},
              {"type": "section", "text": {"type": "mrkdwn", "text": "*${{ steps.status.outputs.OUTCOME }}*\n`${{ github.repository }}`"}}
            ]
          }
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

    # Telegram
    - name: Send Telegram notification
      if: env.TELEGRAM_BOT_TOKEN != ''
      continue-on-error: true
      run: |
        curl -X POST "https://api.telegram.org/bot${{ secrets.TELEGRAM_BOT_TOKEN }}/sendMessage" \
          -d chat_id="${{ secrets.TELEGRAM_CHAT_ID }}" \
          -d text="${{ steps.status.outputs.EMOJI }} ${{ steps.status.outputs.OUTCOME }}"
      env:
        TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
```

---

## 🔐 Secrets Required (Optional)

Add to GitHub secrets as needed:

```
DISCORD_WEBHOOK_URL
SLACK_WEBHOOK_URL
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
EMAIL_SERVER
EMAIL_USERNAME
EMAIL_PASSWORD
EMAIL_FROM
EMAIL_RECIPIENTS
TEAMS_WEBHOOK_URL
PAGERDUTY_ROUTING_KEY
```

---

## 📚 References

- [Discord Webhooks](https://discord.com/developers/docs/resources/webhook)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Microsoft Teams Webhooks](https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/connectors-using)

---

**Choose the notification channels you need and add the corresponding GitHub secrets!**
