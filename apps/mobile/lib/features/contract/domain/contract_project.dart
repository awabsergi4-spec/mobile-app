enum ContractProjectStatus { openForBids, awarded, cancelled }

extension ContractProjectStatusWire on ContractProjectStatus {
  static ContractProjectStatus fromWire(String value) {
    return switch (value) {
      'AWARDED' => ContractProjectStatus.awarded,
      'CANCELLED' => ContractProjectStatus.cancelled,
      _ => ContractProjectStatus.openForBids,
    };
  }
}

/// Mirrors apps/backend/src/domain/contract/contract-project.entity.ts.
class ContractProject {
  const ContractProject({
    required this.id,
    required this.customerId,
    required this.categoryId,
    required this.title,
    required this.description,
    required this.status,
    required this.createdAt,
    this.budgetMin,
    this.budgetMax,
  });

  factory ContractProject.fromJson(Map<String, dynamic> json) {
    return ContractProject(
      id: json['id'] as String,
      customerId: json['customerId'] as String,
      categoryId: json['categoryId'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      status: ContractProjectStatusWire.fromWire(json['status'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
      budgetMin: (json['budgetMin'] as num?)?.toInt(),
      budgetMax: (json['budgetMax'] as num?)?.toInt(),
    );
  }

  final String id;
  final String customerId;
  final String categoryId;
  final String title;
  final String description;
  final ContractProjectStatus status;
  final DateTime createdAt;
  final int? budgetMin;
  final int? budgetMax;
}
