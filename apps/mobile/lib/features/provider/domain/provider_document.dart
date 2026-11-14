enum ProviderDocumentStatus { pending, approved, rejected }

extension ProviderDocumentStatusWire on ProviderDocumentStatus {
  static ProviderDocumentStatus fromWire(String value) {
    return switch (value) {
      'APPROVED' => ProviderDocumentStatus.approved,
      'REJECTED' => ProviderDocumentStatus.rejected,
      _ => ProviderDocumentStatus.pending,
    };
  }
}

/// Mirrors apps/backend/src/domain/provider/provider-document.repository.ts's
/// ProviderDocument.
class ProviderDocument {
  const ProviderDocument({
    required this.id,
    required this.providerId,
    required this.type,
    required this.fileUrl,
    required this.status,
    required this.createdAt,
  });

  factory ProviderDocument.fromJson(Map<String, dynamic> json) {
    return ProviderDocument(
      id: json['id'] as String,
      providerId: json['providerId'] as String,
      type: json['type'] as String,
      fileUrl: json['fileUrl'] as String,
      status: ProviderDocumentStatusWire.fromWire(json['status'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  final String id;
  final String providerId;
  final String type;
  final String fileUrl;
  final ProviderDocumentStatus status;
  final DateTime createdAt;
}
