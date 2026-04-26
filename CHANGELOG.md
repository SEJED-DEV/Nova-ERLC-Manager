# Changelog

All notable changes to this project will be documented in this file.
 
## [1.0.2] - 2026-04-26
 
### Added
- **Multiple Notification Roles**: `NOTIFICATIONS_ROLE_ID` now supports a comma-separated list of IDs.
- **Special Pings**: Added support for `everyone` and `here` keywords in the notification role list.
- **Manual Giveaway Control**: Added `/giveaway end` command to manually conclude giveaways.
- **DM Notifications**: Added automatic direct messages to users for infractions and promotions.
- **Enhanced Logging**: Infraction logs now include a mention/ping of the target user for easier tracking.
- **Expanded Intents**: Included `DirectMessages` and `GuildMembers` in the bot configuration to ensure full functionality.
- **Environment Template**: Created `.env.example` to simplify initial setup for new users.

### Fixed
- **Image Validation**: Fixed a crash caused by invalid image URLs by adding optional-chaining validation before calling `setImage`.
- **Header/Footer Images**: `HEADER_IMAGE` and `FOOTER_IMAGE` now correctly display on session embeds (`/session-vote`, `/session-start`, `/session-boost`, and the vote auto-start announcement).
- **Interaction Timeouts**: Added `deferReply()` to all slow commands (`/session-vote`, `/session-start`, `/session-shutdown`) to prevent Discord's `Unknown Interaction (10062)` error.
- **Double Acknowledgement**: Fixed `Interaction already acknowledged (40060)` error on `/session-vote` caused by a reply/deferReply conflict.
- **Command Registration**: Fixed a bug where slash commands failed to register due to incorrect argument passing during the `ready` event.

### Changed
- **Role Toggle Logic**: The notification role button now intelligently toggles the first valid role ID found in the configuration list.
 
## [1.0.1] - 2026-04-26

### Fixed
- **Module Path Errors**: Resolved `MODULE_NOT_FOUND` errors by fixing incorrect relative paths for `db.js` and `config.js` in several command subdirectories (`staff`, `session`, `utility`).
- **Giveaway Utils Path**: Fixed `giveaway-reroll.js` to correctly point to `src/utils/giveawayUtil.js`.
- **Graceful Intent Handling**: Added custom error handling for "Disallowed Intents" to provide clear setup instructions instead of a crash stack trace.

## [1.0.0]
- Initial release of Nova ERLC Manager.
- Features: Session Management, Staff Moderation, Giveaways, and Live Dashboards.
