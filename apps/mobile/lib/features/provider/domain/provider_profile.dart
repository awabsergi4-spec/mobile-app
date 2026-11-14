enum AvailabilityMode { online, offline, vacation, temporarilyUnavailable, emergencyOffline }

extension AvailabilityModeWire on AvailabilityMode {
  static AvailabilityMode fromWire(String value) {
    return switch (value) {
      'ONLINE' => AvailabilityMode.online,
      'VACATION' => AvailabilityMode.vacation,
      'TEMPORARILY_UNAVAILABLE' => AvailabilityMode.temporarilyUnavailable,
      'EMERGENCY_OFFLINE' => AvailabilityMode.emergencyOffline,
      _ => AvailabilityMode.offline,
    };
  }

  String get wireValue => switch (this) {
        AvailabilityMode.online => 'ONLINE',
        AvailabilityMode.offline => 'OFFLINE',
        AvailabilityMode.vacation => 'VACATION',
        AvailabilityMode.temporarilyUnavailable => 'TEMPORARILY_UNAVAILABLE',
        AvailabilityMode.emergencyOffline => 'EMERGENCY_OFFLINE',
      };
}

/// Mirrors apps/backend/src/domain/provider/provider-profile.entity.ts —
/// only the fields the app renders (Home shell card + the profile/edit,
/// verification and portfolio screens). Admin-only fields (cancellationRate,
/// avgResponseSeconds, suspendedAt/Reason, deletedAt, status) are left out
/// since no self-service screen shows them.
class ProviderProfile {
  const ProviderProfile({
    required this.id,
    required this.businessName,
    required this.verificationStatus,
    required this.isAvailable,
    required this.availabilityMode,
    required this.ratingAverage,
    required this.ratingCount,
    required this.completedJobsCount,
    required this.skills,
    required this.remoteAvailable,
    required this.emergencyAvailable,
    this.bio,
    this.businessLogoUrl,
    this.taxNumber,
    this.yearsOfExperience,
    this.travelDistanceKm,
    this.emergencyContactName,
    this.emergencyContactPhone,
  });

  factory ProviderProfile.fromJson(Map<String, dynamic> json) {
    return ProviderProfile(
      id: json['id'] as String,
      businessName: json['businessName'] as String,
      verificationStatus: json['verificationStatus'] as String,
      isAvailable: json['isAvailable'] as bool,
      availabilityMode: AvailabilityModeWire.fromWire(json['availabilityMode'] as String),
      ratingAverage: (json['ratingAverage'] as num).toDouble(),
      ratingCount: json['ratingCount'] as int,
      completedJobsCount: json['completedJobsCount'] as int,
      skills: (json['skills'] as List<dynamic>? ?? const []).cast<String>(),
      remoteAvailable: json['remoteAvailable'] as bool? ?? false,
      emergencyAvailable: json['emergencyAvailable'] as bool? ?? false,
      bio: json['bio'] as String?,
      businessLogoUrl: json['businessLogoUrl'] as String?,
      taxNumber: json['taxNumber'] as String?,
      yearsOfExperience: json['yearsOfExperience'] as int?,
      travelDistanceKm: (json['travelDistanceKm'] as num?)?.toDouble(),
      emergencyContactName: json['emergencyContactName'] as String?,
      emergencyContactPhone: json['emergencyContactPhone'] as String?,
    );
  }

  final String id;
  final String businessName;
  final String verificationStatus;
  final bool isAvailable;
  final AvailabilityMode availabilityMode;
  final double ratingAverage;
  final int ratingCount;
  final int completedJobsCount;
  final List<String> skills;
  final bool remoteAvailable;
  final bool emergencyAvailable;
  final String? bio;
  final String? businessLogoUrl;
  final String? taxNumber;
  final int? yearsOfExperience;
  final double? travelDistanceKm;
  final String? emergencyContactName;
  final String? emergencyContactPhone;
}
