<!-- markdownlint-disable -->
# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Set "kv-user" cookie on sign-in and registration
- Implement handling of redirects on login/logout

### Changed
- Pass around search params on redirects
- Autofill email for change password form
- Form handling function can now set input values and `readonly` state

### Fixed
- [#7 Change password redirect does not update URL](https://github.com/kernvalley/accounts.kernvalley.us/issues/7)

## [v1.0.1] - 2020-12-27

### Added
- Password reset/change form
- `/.well-known/change-password`
- Redirects for serveral actions (`/login`, `/register`, `/change-password`)
- Additional handling of password reset links (`?action=reset&token&email`)
- Handle query strings for `?action=`
- Check for exposed passwords using [HaveIBeenPwned](https://haveibeenpwned.com/)

### Changed
- Update icons list
- Misc. design changes

## [v1.0.0] - 2020-12-26

### Added
- Login and Registration forms with event handling
- Support for `navigator.credentials`
- Various formats and sizes for icons
- Custom site theme and metadata

<!-- markdownlint-restore -->
