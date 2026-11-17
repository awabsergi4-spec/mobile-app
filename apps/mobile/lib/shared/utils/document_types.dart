import '../../core/l10n/generated/app_localizations.dart';

/// Identity documents a provider can submit (must match the API's list).
const providerDocumentTypes = ['NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE'];

/// Documents a company can submit for verification.
const companyDocumentTypes = ['COMMERCIAL_REGISTRATION', 'TAX_CERTIFICATE', 'NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE'];

/// Localised label; older free-text types are shown as they were entered.
String documentTypeLabel(AppLocalizations l10n, String type) => switch (type) {
      'PASSPORT' => l10n.docTypePassport,
      'NATIONAL_ID' => l10n.docTypeNationalId,
      'DRIVER_LICENSE' => l10n.docTypeDriverLicense,
      'COMMERCIAL_REGISTRATION' => l10n.docTypeCommercialRegistration,
      'TAX_CERTIFICATE' => l10n.docTypeTaxCertificate,
      _ => type,
    };
