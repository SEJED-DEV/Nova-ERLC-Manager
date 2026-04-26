# Changelog

All notable changes to this project will be documented in this file.
 
## [1.0.2] - 2026-04-26
 
### Added
- **Multiple Notification Roles**: `NOTIFICATIONS_ROLE_ID` now supports a comma-separated list of IDs.
- **Special Pings**: Added support for `everyone` and `here` keywords in the notification role list.
- **Expanded Intents**: Included `DirectMessages` and `GuildPresences` in the bot configuration to ensure full functionality and smoother handshakes.
- **Environment Template**: Created `.env.example` to simplify initial setup for new users.
 
### Changed
- **Role Toggle Logic**: The notification role button now intelligently toggles the first valid role ID found in the configuration list, skipping special identifiers.
 
## [1.0.1] - 2026-04-26

### Fixed
- **Module Path Errors**: Resolved `MODULE_NOT_FOUND` errors by fixing incorrect relative paths for `db.js` and `config.js` in several command subdirectories (`staff`, `session`, `utility`).
- **Giveaway Utils Path**: Fixed `giveaway-reroll.js` to correctly point to `src/utils/giveawayUtil.js`.
- **Graceful Intent Handling**: Added custom error handling for "Disallowed Intents" to provide clear setup instructions instead of a crash stack trace.

## [1.0.0]
- Initial release of Nova ERLC Manager.
- Features: Session Management, Staff Moderation, Giveaways, and Live Dashboards.
