// Models for the customer-facing catalog endpoints in apps/api
// (`routers/catalog.py`). Only public-safe provider fields exist here.

int? _int(Object? v) => (v as num?)?.toInt();
double _double(Object? v) => (v as num?)?.toDouble() ?? 0;
DateTime? _date(Object? v) => v == null ? null : DateTime.parse(v as String);

/// A provider as listed in Explore / search (`GET /explore/providers`, `GET /search`).
class ProviderSummary {
  const ProviderSummary({
    required this.id,
    required this.businessName,
    required this.ratingAverage,
    required this.ratingCount,
    required this.completedJobsCount,
    required this.skills,
    required this.remoteAvailable,
    required this.isAvailable,
    this.bio,
    this.businessLogoUrl,
    this.yearsOfExperience,
    this.companyId,
    this.priceMin,
    this.priceMax,
  });

  factory ProviderSummary.fromJson(Map<String, dynamic> json) => ProviderSummary(
        id: json['id'] as String,
        businessName: json['businessName'] as String,
        bio: json['bio'] as String?,
        businessLogoUrl: json['businessLogoUrl'] as String?,
        ratingAverage: _double(json['ratingAverage']),
        ratingCount: _int(json['ratingCount']) ?? 0,
        completedJobsCount: _int(json['completedJobsCount']) ?? 0,
        skills: ((json['skills'] as List?) ?? const []).cast<String>(),
        yearsOfExperience: _int(json['yearsOfExperience']),
        remoteAvailable: json['remoteAvailable'] as bool? ?? false,
        isAvailable: json['isAvailable'] as bool? ?? false,
        companyId: json['companyId'] as String?,
        priceMin: _int(json['priceMin']),
        priceMax: _int(json['priceMax']),
      );

  final String id;
  final String businessName;
  final String? bio;
  final String? businessLogoUrl;
  final double ratingAverage;
  final int ratingCount;
  final int completedJobsCount;
  final List<String> skills;
  final int? yearsOfExperience;
  final bool remoteAvailable;
  final bool isAvailable;
  final String? companyId;

  /// Price range for the category being browsed (minor units), when known.
  final int? priceMin;
  final int? priceMax;
}

/// `GET /service-categories/{id}`.
class CategoryDetail {
  const CategoryDetail({
    required this.id,
    required this.type,
    required this.name,
    required this.providerCount,
    this.description,
    this.priceMin,
    this.priceMax,
    this.key,
    this.imageUrl,
  });

  factory CategoryDetail.fromJson(Map<String, dynamic> json) => CategoryDetail(
        id: json['id'] as String,
        type: json['type'] as String,
        name: json['name'] as String,
        description: json['description'] as String?,
        providerCount: _int(json['providerCount']) ?? 0,
        priceMin: _int(json['priceMin']),
        priceMax: _int(json['priceMax']),
        key: json['key'] as String?,
        imageUrl: json['imageUrl'] as String?,
      );

  final String id;

  /// `ON_DEMAND` | `REMOTE` | `CONTRACT`.
  final String type;
  final String name;
  final String? description;
  final int providerCount;
  final int? priceMin;
  final int? priceMax;
  final String? key;
  final String? imageUrl;
}

class SearchCategoryHit {
  const SearchCategoryHit({required this.id, required this.type, required this.name, this.key, this.imageUrl});

  factory SearchCategoryHit.fromJson(Map<String, dynamic> json) =>
      SearchCategoryHit(id: json['id'] as String, type: json['type'] as String, name: json['name'] as String, key: json['key'] as String?, imageUrl: json['imageUrl'] as String?);

  final String id;
  final String type;
  final String name;
  final String? key;
  final String? imageUrl;
}

/// `GET /search`.
class SearchResults {
  const SearchResults({required this.categories, required this.providers});

  factory SearchResults.fromJson(Map<String, dynamic> json) => SearchResults(
        categories: (json['categories'] as List).cast<Map<String, dynamic>>().map(SearchCategoryHit.fromJson).toList(),
        providers: (json['providers'] as List).cast<Map<String, dynamic>>().map(ProviderSummary.fromJson).toList(),
      );

  final List<SearchCategoryHit> categories;
  final List<ProviderSummary> providers;

  bool get isEmpty => categories.isEmpty && providers.isEmpty;
}

class ProviderService {
  const ProviderService({required this.categoryId, required this.type, required this.name, this.priceMin, this.priceMax, this.key, this.imageUrl});

  factory ProviderService.fromJson(Map<String, dynamic> json) => ProviderService(
        categoryId: json['categoryId'] as String,
        type: json['type'] as String,
        name: json['name'] as String,
        priceMin: _int(json['priceMin']),
        priceMax: _int(json['priceMax']),
        key: json['key'] as String?,
        imageUrl: json['imageUrl'] as String?,
      );

  final String categoryId;
  final String type;
  final String name;
  final int? priceMin;
  final int? priceMax;
  final String? key;
  final String? imageUrl;
}

class PortfolioEntry {
  const PortfolioEntry({required this.id, required this.mediaUrl, this.title, this.description});

  factory PortfolioEntry.fromJson(Map<String, dynamic> json) => PortfolioEntry(
        id: json['id'] as String,
        mediaUrl: json['mediaUrl'] as String,
        title: json['title'] as String?,
        description: json['description'] as String?,
      );

  final String id;
  final String mediaUrl;
  final String? title;
  final String? description;
}

class ReviewEntry {
  const ReviewEntry({required this.id, required this.rating, required this.authorName, this.comment, this.createdAt});

  factory ReviewEntry.fromJson(Map<String, dynamic> json) => ReviewEntry(
        id: json['id'] as String,
        rating: _int(json['rating']) ?? 0,
        comment: json['comment'] as String?,
        authorName: json['authorName'] as String? ?? '',
        createdAt: _date(json['createdAt']),
      );

  final String id;
  final int rating;
  final String? comment;
  final String authorName;
  final DateTime? createdAt;
}

/// `GET /providers/{id}/profile`.
class ProviderPublicProfile {
  const ProviderPublicProfile({
    required this.summary,
    required this.ownerName,
    required this.services,
    required this.portfolio,
    required this.recentReviews,
    this.profilePictureUrl,
    this.city,
    this.companyName,
  });

  factory ProviderPublicProfile.fromJson(Map<String, dynamic> json) => ProviderPublicProfile(
        summary: ProviderSummary.fromJson(json),
        ownerName: json['ownerName'] as String? ?? '',
        profilePictureUrl: json['profilePictureUrl'] as String?,
        city: json['city'] as String?,
        companyName: json['companyName'] as String?,
        services: (json['services'] as List).cast<Map<String, dynamic>>().map(ProviderService.fromJson).toList(),
        portfolio: (json['portfolio'] as List).cast<Map<String, dynamic>>().map(PortfolioEntry.fromJson).toList(),
        recentReviews: (json['recentReviews'] as List).cast<Map<String, dynamic>>().map(ReviewEntry.fromJson).toList(),
      );

  final ProviderSummary summary;
  final String ownerName;
  final String? profilePictureUrl;
  final String? city;
  final String? companyName;
  final List<ProviderService> services;
  final List<PortfolioEntry> portfolio;
  final List<ReviewEntry> recentReviews;
}

/// `GET /promotions` — an active promotional campaign.
class Promotion {
  const Promotion({required this.id, required this.name, required this.discountType, required this.discountValue, this.description, this.categoryId});

  factory Promotion.fromJson(Map<String, dynamic> json) => Promotion(
        id: json['id'] as String,
        name: json['name'] as String,
        description: json['description'] as String?,
        discountType: json['discountType'] as String,
        discountValue: _int(json['discountValue']) ?? 0,
        categoryId: json['categoryId'] as String?,
      );

  final String id;
  final String name;
  final String? description;

  /// `PERCENTAGE` | `FLAT`.
  final String discountType;
  final int discountValue;
  final String? categoryId;
}
