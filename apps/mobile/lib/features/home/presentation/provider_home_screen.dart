import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../auth/application/auth_controller.dart';
import '../../notification/presentation/widgets/notification_bell_button.dart';
import '../../provider/application/provider_controller.dart';
import '../../provider/domain/provider_profile.dart';

enum _ProviderMenuAction {
  onDemandOffers,
  contractsBrowse,
  remoteBookings,
  disputes,
  companyInvitations,
  providerProfile,
  providerVerification,
  providerPortfolio,
  providerPayoutAccounts,
  logout,
}

class ProviderHomeScreen extends ConsumerWidget {
  const ProviderHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final user = ref.watch(authControllerProvider).user;
    final profile = ref.watch(providerProfileControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(user != null ? l10n.homeGreeting(user.fullName) : l10n.homePlaceholderTitle),
        actions: [
          const NotificationBellButton(),
          IconButton(
            icon: const Icon(Icons.account_balance_wallet_outlined),
            tooltip: l10n.walletTitle,
            onPressed: () => context.push('/wallet'),
          ),
          PopupMenuButton<_ProviderMenuAction>(
            onSelected: (action) {
              switch (action) {
                case _ProviderMenuAction.onDemandOffers:
                  context.push('/on-demand/offers');
                case _ProviderMenuAction.contractsBrowse:
                  context.push('/contracts/browse');
                case _ProviderMenuAction.remoteBookings:
                  context.push('/remote/bookings');
                case _ProviderMenuAction.disputes:
                  context.push('/disputes');
                case _ProviderMenuAction.companyInvitations:
                  context.push('/company/invitations');
                case _ProviderMenuAction.providerProfile:
                  context.push('/provider/profile');
                case _ProviderMenuAction.providerVerification:
                  context.push('/provider/verification');
                case _ProviderMenuAction.providerPortfolio:
                  context.push('/provider/portfolio');
                case _ProviderMenuAction.providerPayoutAccounts:
                  context.push('/provider/payout-accounts');
                case _ProviderMenuAction.logout:
                  ref.read(authControllerProvider.notifier).logout();
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(value: _ProviderMenuAction.onDemandOffers, child: Text(l10n.onDemandJobOffers)),
              PopupMenuItem(value: _ProviderMenuAction.contractsBrowse, child: Text(l10n.contractBrowseProjects)),
              PopupMenuItem(value: _ProviderMenuAction.remoteBookings, child: Text(l10n.remoteMyBookings)),
              PopupMenuItem(value: _ProviderMenuAction.disputes, child: Text(l10n.disputeMyDisputes)),
              PopupMenuItem(value: _ProviderMenuAction.companyInvitations, child: Text(l10n.companyMyInvitationsTitle)),
              const PopupMenuDivider(),
              PopupMenuItem(value: _ProviderMenuAction.providerProfile, child: Text(l10n.providerProfileTitle)),
              PopupMenuItem(value: _ProviderMenuAction.providerVerification, child: Text(l10n.providerDocumentsTitle)),
              PopupMenuItem(value: _ProviderMenuAction.providerPortfolio, child: Text(l10n.providerPortfolioTitle)),
              PopupMenuItem(value: _ProviderMenuAction.providerPayoutAccounts, child: Text(l10n.providerPayoutAccountsTitle)),
              const PopupMenuDivider(),
              PopupMenuItem(value: _ProviderMenuAction.logout, child: Text(l10n.logout)),
            ],
          ),
        ],
      ),
      body: AsyncValueView<ProviderProfile>(
        value: profile,
        onRetry: () => ref.invalidate(providerProfileControllerProvider),
        data: (context, data) => _ProviderDashboard(profile: data),
      ),
    );
  }
}

class _ProviderDashboard extends ConsumerWidget {
  const _ProviderDashboard({required this.profile});

  final ProviderProfile profile;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.base),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.base),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(profile.businessName, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: AppSpacing.xs),
                Row(
                  children: [
                    Icon(Icons.star, size: 18, color: colorScheme.tertiary),
                    const SizedBox(width: AppSpacing.xs),
                    Text(profile.ratingAverage.toStringAsFixed(1)),
                    const SizedBox(width: AppSpacing.md),
                    Text(l10n.providerJobsCompleted(profile.completedJobsCount)),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.base),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l10n.availabilityLabel, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: AppSpacing.sm),
                DropdownButton<AvailabilityMode>(
                  isExpanded: true,
                  value: profile.availabilityMode,
                  items: [
                    DropdownMenuItem(value: AvailabilityMode.online, child: Text(l10n.availabilityOnline)),
                    DropdownMenuItem(value: AvailabilityMode.offline, child: Text(l10n.availabilityOffline)),
                    DropdownMenuItem(value: AvailabilityMode.vacation, child: Text(l10n.availabilityVacation)),
                    DropdownMenuItem(
                      value: AvailabilityMode.temporarilyUnavailable,
                      child: Text(l10n.availabilityTemporarilyUnavailable),
                    ),
                    DropdownMenuItem(value: AvailabilityMode.emergencyOffline, child: Text(l10n.availabilityEmergencyOffline)),
                  ],
                  onChanged: (mode) {
                    if (mode != null) {
                      ref.read(providerProfileControllerProvider.notifier).setAvailability(mode);
                    }
                  },
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
