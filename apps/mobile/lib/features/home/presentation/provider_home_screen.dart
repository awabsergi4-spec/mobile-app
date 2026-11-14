import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/sahl_ui.dart';
import '../../auth/application/auth_controller.dart';
import '../../notification/presentation/widgets/notification_bell_button.dart';
import '../../provider/application/provider_controller.dart';
import '../../provider/domain/provider_profile.dart';
import '../../wallet/application/wallet_controller.dart';

/// Provider › Dashboard tab: business summary, key numbers and availability.
class ProviderHomeScreen extends ConsumerWidget {
  const ProviderHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final user = ref.watch(authControllerProvider).user;
    final profile = ref.watch(providerProfileControllerProvider);

    return Scaffold(
      body: SafeArea(
        child: AsyncValueView<ProviderProfile>(
          value: profile,
          loading: const SkeletonList(itemCount: 4),
          onRetry: () => ref.invalidate(providerProfileControllerProvider),
          data: (context, data) => RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(providerProfileControllerProvider);
              ref.invalidate(myWalletProvider);
            },
            child: ListView(
              padding: const EdgeInsets.fromLTRB(AppSpacing.base, AppSpacing.md, AppSpacing.base, AppSpacing.xl),
              children: [
                Row(
                  children: [
                    SahlAvatar(name: user?.fullName ?? data.businessName, imageUrl: user?.profilePictureUrl),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Text(
                        user != null ? l10n.homeGreeting(user.fullName) : data.businessName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                      ),
                    ),
                    const NotificationBellButton(),
                  ],
                ),
                const SizedBox(height: AppSpacing.lg),
                _BusinessCard(profile: data),
                const SizedBox(height: AppSpacing.md),
                _StatsRow(profile: data),
                SectionHeader(title: l10n.availabilityLabel),
                _AvailabilityCard(profile: data),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _BusinessCard extends StatelessWidget {
  const _BusinessCard({required this.profile});

  final ProviderProfile profile;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final online = profile.availabilityMode == AvailabilityMode.online;
    final modeLabel = switch (profile.availabilityMode) {
      AvailabilityMode.online => l10n.availabilityOnline,
      AvailabilityMode.offline => l10n.availabilityOffline,
      AvailabilityMode.vacation => l10n.availabilityVacation,
      AvailabilityMode.temporarilyUnavailable => l10n.availabilityTemporarilyUnavailable,
      AvailabilityMode.emergencyOffline => l10n.availabilityEmergencyOffline,
    };
    return GradientCard(
      child: Row(
        children: [
          const Icon(Symbols.storefront, size: 36, fill: 1),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  profile.businessName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 4),
                Text(modeLabel, style: TextStyle(color: Colors.white.withValues(alpha: 0.9))),
              ],
            ),
          ),
          Container(
            height: 14,
            width: 14,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: online ? const Color(0xFF7CFFB2) : Colors.white.withValues(alpha: 0.5),
              border: Border.all(color: Colors.white, width: 2),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsRow extends ConsumerWidget {
  const _StatsRow({required this.profile});

  final ProviderProfile profile;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final tokens = context.sahl;
    final wallet = ref.watch(myWalletProvider);
    final balance = wallet.whenOrNull(data: (w) => '${w.availableBalance} ${w.currency}') ?? '—';

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: StatTile(
            icon: Symbols.star,
            color: tokens.accent,
            value: profile.ratingAverage.toStringAsFixed(1),
            label: l10n.providerStatRating,
          ),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: StatTile(
            icon: Symbols.task_alt,
            color: tokens.success,
            value: '${profile.completedJobsCount}',
            label: l10n.providerStatCompleted,
          ),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: StatTile(
            icon: Symbols.account_balance_wallet,
            color: tokens.info,
            value: balance,
            label: l10n.providerStatBalance,
          ),
        ),
      ],
    );
  }
}

class _AvailabilityCard extends ConsumerWidget {
  const _AvailabilityCard({required this.profile});

  final ProviderProfile profile;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final options = [
      (AvailabilityMode.online, l10n.availabilityOnline),
      (AvailabilityMode.offline, l10n.availabilityOffline),
      (AvailabilityMode.vacation, l10n.availabilityVacation),
      (AvailabilityMode.temporarilyUnavailable, l10n.availabilityTemporarilyUnavailable),
      (AvailabilityMode.emergencyOffline, l10n.availabilityEmergencyOffline),
    ];
    return SahlCard(
      child: DropdownButtonFormField<AvailabilityMode>(
        // Keyed by the saved mode so the field re-syncs after an update.
        key: ValueKey(profile.availabilityMode),
        isExpanded: true,
        initialValue: profile.availabilityMode,
        decoration: const InputDecoration(prefixIcon: Icon(Symbols.schedule)),
        items: [for (final (mode, label) in options) DropdownMenuItem(value: mode, child: Text(label))],
        onChanged: (mode) {
          if (mode != null) ref.read(providerProfileControllerProvider.notifier).setAvailability(mode);
        },
      ),
    );
  }
}
