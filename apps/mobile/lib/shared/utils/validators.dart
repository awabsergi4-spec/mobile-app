import '../../core/l10n/generated/app_localizations.dart';

/// Shared form-field validators — every auth/profile/etc. form uses these
/// rather than re-writing the same regex/length checks per screen, so
/// validation rules can't drift between forms.
abstract final class Validators {
  static String? required(String? value, AppLocalizations l10n) {
    if (value == null || value.trim().isEmpty) return l10n.validationRequired;
    return null;
  }

  static String? phone(String? value, AppLocalizations l10n) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return l10n.validationRequired;
    final digitsOnly = trimmed.replaceAll(RegExp(r'[^0-9+]'), '');
    if (digitsOnly.length < 8 || digitsOnly.length > 16) return l10n.validationPhoneInvalid;
    return null;
  }

  static String? password(String? value, AppLocalizations l10n) {
    if (value == null || value.isEmpty) return l10n.validationRequired;
    if (value.length < 8) return l10n.validationPasswordTooShort;
    return null;
  }

  static String? fullName(String? value, AppLocalizations l10n) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return l10n.validationRequired;
    if (trimmed.length < 2) return l10n.validationFullNameTooShort;
    return null;
  }

  static String? optionalEmail(String? value, AppLocalizations l10n) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return null;
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(trimmed)) return l10n.validationEmailInvalid;
    return null;
  }

  static String? confirmPassword(String? value, String password, AppLocalizations l10n) {
    if (value == null || value.isEmpty) return l10n.validationRequired;
    if (value != password) return l10n.validationPasswordsDontMatch;
    return null;
  }
}
