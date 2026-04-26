# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2026-04-26

### Fixed
- **Module Path Errors**: Resolved `MODULE_NOT_FOUND` errors by fixing incorrect relative paths for `db.js` and `config.js` in several command subdirectories (`staff`, `session`, `utility`).
- **Giveaway Utils Path**: Fixed `giveaway-reroll.js` to correctly point to `src/utils/giveawayUtil.js`.
- **Graceful Intent Handling**: Added custom error handling for "Disallowed Intents" to provide clear setup instructions instead of a crash stack trace.

## [1.0.0] - 2026-04-26
- Initial release of Nova ERLC Manager.
- Features: Session Management, Staff Moderation, Giveaways, and Live Dashboards.
