import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/networking/providers.dart';
import '../../../core/utils/result.dart';
import '../data/provider_repository.dart';
import '../data/provider_repository_impl.dart';
import '../domain/provider_profile.dart';

final providerRepositoryProvider = Provider<ProviderRepository>((ref) {
  return ProviderRepositoryImpl(apiClient: ref.watch(apiClientProvider));
});

class ProviderProfileController extends AsyncNotifier<ProviderProfile> {
  @override
  Future<ProviderProfile> build() async {
    final result = await ref.read(providerRepositoryProvider).fetchMyProfile();
    return result.when(success: (profile) => profile, failure: (failure) => throw failure);
  }

  Future<Result<void>> setAvailability(AvailabilityMode mode) async {
    final result = await ref.read(providerRepositoryProvider).setAvailability(mode);
    if (result.isSuccess) {
      // Optimistic-free refresh — small payload, correctness over one
      // extra round trip.
      ref.invalidateSelf();
      await future;
    }
    return result;
  }

  Future<Result<ProviderProfile>> updateProfile({
    String? businessName,
    String? bio,
    int? yearsOfExperience,
    List<String>? skills,
    double? travelDistanceKm,
    bool? remoteAvailable,
    bool? emergencyAvailable,
    String? emergencyContactName,
    String? emergencyContactPhone,
  }) async {
    final result = await ref.read(providerRepositoryProvider).updateProfile(
          businessName: businessName,
          bio: bio,
          yearsOfExperience: yearsOfExperience,
          skills: skills,
          travelDistanceKm: travelDistanceKm,
          remoteAvailable: remoteAvailable,
          emergencyAvailable: emergencyAvailable,
          emergencyContactName: emergencyContactName,
          emergencyContactPhone: emergencyContactPhone,
        );
    if (result.isSuccess) {
      ref.invalidateSelf();
    }
    return result;
  }
}

final providerProfileControllerProvider = AsyncNotifierProvider<ProviderProfileController, ProviderProfile>(
  ProviderProfileController.new,
);
