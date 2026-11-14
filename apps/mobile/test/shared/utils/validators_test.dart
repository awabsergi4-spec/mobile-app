import 'package:flutter_test/flutter_test.dart';
import 'package:sahl_mobile/core/l10n/generated/app_localizations_en.dart';
import 'package:sahl_mobile/shared/utils/validators.dart';

void main() {
  final l10n = AppLocalizationsEn();

  group('Validators.phone', () {
    test('rejects empty input', () {
      expect(Validators.phone('', l10n), l10n.validationRequired);
    });

    test('rejects a too-short number', () {
      expect(Validators.phone('123', l10n), l10n.validationPhoneInvalid);
    });

    test('accepts a plausible international number', () {
      expect(Validators.phone('+249900000000', l10n), isNull);
    });
  });

  group('Validators.password', () {
    test('rejects a password under 8 characters', () {
      expect(Validators.password('short', l10n), l10n.validationPasswordTooShort);
    });

    test('accepts an 8+ character password', () {
      expect(Validators.password('password123', l10n), isNull);
    });
  });

  group('Validators.fullName', () {
    test('rejects a single character', () {
      expect(Validators.fullName('A', l10n), l10n.validationFullNameTooShort);
    });

    test('accepts a real name', () {
      expect(Validators.fullName('Ahmad Ali', l10n), isNull);
    });
  });

  group('Validators.optionalEmail', () {
    test('empty is allowed', () {
      expect(Validators.optionalEmail('', l10n), isNull);
    });

    test('rejects a malformed address and accepts a valid one', () {
      expect(Validators.optionalEmail('not-an-email', l10n), l10n.validationEmailInvalid);
      expect(Validators.optionalEmail('a@b.co', l10n), isNull);
    });
  });

  group('Validators.confirmPassword', () {
    test('must match the password', () {
      expect(Validators.confirmPassword('Secret123', 'Secret124', l10n), l10n.validationPasswordsDontMatch);
      expect(Validators.confirmPassword('Secret123', 'Secret123', l10n), isNull);
    });
  });
}
