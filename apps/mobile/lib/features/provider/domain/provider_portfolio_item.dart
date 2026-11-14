/// Mirrors apps/backend/src/domain/provider/provider-portfolio.repository.ts's
/// ProviderPortfolioItem.
class ProviderPortfolioItem {
  const ProviderPortfolioItem({
    required this.id,
    required this.providerId,
    required this.mediaUrl,
    required this.createdAt,
    this.title,
    this.description,
  });

  factory ProviderPortfolioItem.fromJson(Map<String, dynamic> json) {
    return ProviderPortfolioItem(
      id: json['id'] as String,
      providerId: json['providerId'] as String,
      mediaUrl: json['mediaUrl'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      title: json['title'] as String?,
      description: json['description'] as String?,
    );
  }

  final String id;
  final String providerId;
  final String mediaUrl;
  final DateTime createdAt;
  final String? title;
  final String? description;
}
