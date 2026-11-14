enum CompanyDocumentStatus { pending, approved, rejected }

extension CompanyDocumentStatusWire on CompanyDocumentStatus {
  static CompanyDocumentStatus fromWire(String value) {
    return switch (value) {
      'APPROVED' => CompanyDocumentStatus.approved,
      'REJECTED' => CompanyDocumentStatus.rejected,
      _ => CompanyDocumentStatus.pending,
    };
  }
}

/// Mirrors apps/backend/src/domain/company/company-document.repository.ts's
/// CompanyDocument.
class CompanyDocument {
  const CompanyDocument({
    required this.id,
    required this.companyId,
    required this.type,
    required this.fileUrl,
    required this.status,
    required this.createdAt,
  });

  factory CompanyDocument.fromJson(Map<String, dynamic> json) {
    return CompanyDocument(
      id: json['id'] as String,
      companyId: json['companyId'] as String,
      type: json['type'] as String,
      fileUrl: json['fileUrl'] as String,
      status: CompanyDocumentStatusWire.fromWire(json['status'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  final String id;
  final String companyId;
  final String type;
  final String fileUrl;
  final CompanyDocumentStatus status;
  final DateTime createdAt;
}
