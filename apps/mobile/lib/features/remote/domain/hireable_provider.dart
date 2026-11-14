/// Mirrors the shape returned by `GET /api/v1/providers` (see
/// apps/backend/src/app/api/v1/providers/route.ts) — already output-shaped
/// to public-safe fields server-side, nothing internal to strip here.
class HireableProvider {
  const HireableProvider({required this.id, required this.businessName, required this.ratingAverage, this.bio});

  factory HireableProvider.fromJson(Map<String, dynamic> json) {
    return HireableProvider(
      id: json['id'] as String,
      businessName: json['businessName'] as String,
      ratingAverage: (json['ratingAverage'] as num).toDouble(),
      bio: json['bio'] as String?,
    );
  }

  final String id;
  final String businessName;
  final double ratingAverage;
  final String? bio;
}
