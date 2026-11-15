// Models for service listings (apps/api `routers/listings.py`).

enum ListingStatus { pendingReview, published, rejected, paused }

ListingStatus _status(String? v) => switch (v) {
      'PUBLISHED' => ListingStatus.published,
      'REJECTED' => ListingStatus.rejected,
      'PAUSED' => ListingStatus.paused,
      _ => ListingStatus.pendingReview,
    };

class ListingCategory {
  const ListingCategory({required this.id, required this.type, required this.name, this.key});

  factory ListingCategory.fromJson(Map<String, dynamic> json) => ListingCategory(
        id: json['id'] as String,
        type: json['type'] as String? ?? 'REMOTE',
        name: json['name'] as String? ?? '',
        key: json['key'] as String?,
      );

  final String id;
  final String type;
  final String name;
  final String? key;
}

class ListingProvider {
  const ListingProvider({
    required this.id,
    required this.businessName,
    required this.ratingAverage,
    required this.ratingCount,
    this.businessLogoUrl,
  });

  factory ListingProvider.fromJson(Map<String, dynamic> json) => ListingProvider(
        id: json['id'] as String,
        businessName: json['businessName'] as String? ?? '',
        businessLogoUrl: json['businessLogoUrl'] as String?,
        ratingAverage: (json['ratingAverage'] as num?)?.toDouble() ?? 0,
        ratingCount: (json['ratingCount'] as num?)?.toInt() ?? 0,
      );

  final String id;
  final String businessName;
  final String? businessLogoUrl;
  final double ratingAverage;
  final int ratingCount;
}

class ServiceListing {
  const ServiceListing({
    required this.id,
    required this.title,
    required this.priceFrom,
    required this.coverUrl,
    required this.status,
    this.deliveryDays,
    this.category,
    this.provider,
    this.description,
    this.images = const [],
    this.rejectionReason,
  });

  factory ServiceListing.fromJson(Map<String, dynamic> json) => ServiceListing(
        id: json['id'] as String,
        title: json['title'] as String,
        priceFrom: (json['priceFrom'] as num).toInt(),
        deliveryDays: (json['deliveryDays'] as num?)?.toInt(),
        coverUrl: json['coverUrl'] as String,
        status: _status(json['status'] as String?),
        category: json['category'] == null ? null : ListingCategory.fromJson(json['category'] as Map<String, dynamic>),
        provider: json['provider'] == null ? null : ListingProvider.fromJson(json['provider'] as Map<String, dynamic>),
        description: json['description'] as String?,
        images: ((json['images'] as List?) ?? const []).cast<String>(),
        rejectionReason: json['rejectionReason'] as String?,
      );

  final String id;
  final String title;
  final int priceFrom;
  final int? deliveryDays;
  final String coverUrl;
  final ListingStatus status;
  final ListingCategory? category;
  final ListingProvider? provider;
  final String? description;
  final List<String> images;
  final String? rejectionReason;
}

/// What the provider fills in on the post/edit form.
class ListingDraft {
  const ListingDraft({
    required this.categoryId,
    required this.title,
    required this.description,
    required this.priceFrom,
    required this.coverUrl,
    required this.images,
    this.deliveryDays,
  });

  final String categoryId;
  final String title;
  final String description;
  final int priceFrom;
  final int? deliveryDays;
  final String coverUrl;
  final List<String> images;

  Map<String, dynamic> toJson() => {
        'categoryId': categoryId,
        'title': title,
        'description': description,
        'priceFrom': priceFrom,
        'deliveryDays': deliveryDays,
        'coverUrl': coverUrl,
        'images': images,
      };
}

/// Cloudinary delivery variant: inserts a transformation after `/upload/`
/// so every cover is served at 16:9 and a sensible size, whatever was
/// uploaded. Non-Cloudinary URLs are returned unchanged.
String cloudinaryVariant(String url, {int width = 1280, bool fill16x9 = true}) {
  const marker = '/image/upload/';
  final i = url.indexOf(marker);
  if (i < 0) return url;
  final transform = fill16x9 ? 'c_fill,g_auto,ar_16:9,w_$width,q_auto,f_auto' : 'c_limit,w_$width,q_auto,f_auto';
  return '${url.substring(0, i + marker.length)}$transform/${url.substring(i + marker.length)}';
}
