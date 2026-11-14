import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../../../shared/widgets/sahl_ui.dart';
import '../../auth/application/auth_controller.dart';
import '../../company/application/company_controller.dart';
import '../../company/application/company_members_controller.dart';
import '../../company/application/company_sent_invitations_controller.dart';
import '../../company/domain/company.dart';
import '../../company/domain/company_invitation.dart';
import '../../notification/presentation/widgets/notification_bell_button.dart';

/// Company › Dashboard tab: company overview, team numbers, verification.
class CompanyHomeScreen extends ConsumerWidget {
  const CompanyHomeScreen({super.key, required this.companyId});

  final String companyId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final user = ref.watch(authControllerProvider).user;
    final company = ref.watch(companyProvider(companyId));

    return Scaffold(
      body: SafeArea(
        child: AsyncValueView<Company>(
          value: company,
          loading: const SkeletonList(itemCount: 3),
          onRetry: () => ref.invalidate(companyProvider(companyId)),
          data: (context, data) => RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(companyProvider(companyId));
              ref.invalidate(companyMembersControllerProvider(companyId));
              ref.invalidate(companySentInvitationsControllerProvider(companyId));
            },
            child: ListView(
              padding: const EdgeInsets.fromLTRB(AppSpacing.base, AppSpacing.md, AppSpacing.base, AppSpacing.xl),
              children: [
                Row(
                  children: [
                    SahlAvatar(name: data.name),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Text(
                        user != null ? l10n.homeGreeting(user.fullName) : data.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                      ),
                    ),
                    const NotificationBellButton(),
                  ],
                ),
                const SizedBox(height: AppSpacing.lg),
                GradientCard(
                  child: Row(
                    children: [
                      const Icon(Symbols.apartment, size: 36, fill: 1),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(data.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                            const SizedBox(height: 4),
                            Text(
                              l10n.companyVerificationStatus(data.verificationStatus),
                              style: TextStyle(color: Colors.white.withValues(alpha: 0.9)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                _CompanyStats(companyId: companyId),
                const SizedBox(height: AppSpacing.md),
                ActionGroup(
                  children: [
                    ActionTile(
                      icon: Symbols.groups,
                      color: Theme.of(context).colorScheme.primary,
                      title: l10n.companyMembersTitle,
                      subtitle: l10n.companyTeamSubtitle,
                      onTap: () => context.go('/co/team'),
                    ),
                    ActionTile(
                      icon: Symbols.verified_user,
                      color: context.sahl.success,
                      title: l10n.companyDocumentsTitle,
                      subtitle: l10n.companyVerificationSubtitle,
                      onTap: () => context.push('/company/$companyId/verification'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CompanyStats extends ConsumerWidget {
  const _CompanyStats({required this.companyId});

  final String companyId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final tokens = context.sahl;
    final members = ref.watch(companyMembersControllerProvider(companyId));
    final invitations = ref.watch(companySentInvitationsControllerProvider(companyId));
    final memberCount = members.whenOrNull(data: (m) => '${m.length}') ?? '—';
    final pendingCount = invitations.whenOrNull(
          data: (list) => '${list.where((i) => i.status == CompanyInvitationStatus.pending).length}',
        ) ??
        '—';

    return Row(
      children: [
        Expanded(
          child: StatTile(
            icon: Symbols.groups,
            color: tokens.info,
            value: memberCount,
            label: l10n.companyStatMembers,
            onTap: () => context.go('/co/team'),
          ),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: StatTile(
            icon: Symbols.mail,
            color: tokens.warning,
            value: pendingCount,
            label: l10n.companyStatPendingInvites,
            onTap: () => context.go('/co/team'),
          ),
        ),
      ],
    );
  }
}

/// Company tabs whose backend is not built yet (jobs, finance). Shows an
/// honest, explicit empty state — no fake data, no dead buttons.
class CompanyFeatureUnavailableScreen extends StatelessWidget {
  const CompanyFeatureUnavailableScreen({super.key, required this.title, required this.heading, required this.message, required this.icon});

  final String title;
  final String heading;
  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: EmptyStateView(icon: icon, title: heading, message: message),
    );
  }
}
