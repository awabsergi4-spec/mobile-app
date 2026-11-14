import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/l10n/locale_controller.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/theme_controller.dart';
import '../../../shared/widgets/sahl_ui.dart';
import '../../auth/application/auth_controller.dart';
import '../../auth/domain/current_user.dart';

/// Profile tab shared by all three roles: account summary, role-specific
/// shortcuts, activity, appearance/language settings and logout.
class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final user = ref.watch(authControllerProvider).user;
    final tokens = context.sahl;
    final colorScheme = Theme.of(context).colorScheme;
    if (user == null) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    final workspace = user.workspace;
    final roleLabel = switch (workspace) {
      UserWorkspace.customer => l10n.roleCustomer,
      UserWorkspace.provider => l10n.roleProvider,
      UserWorkspace.company => l10n.roleCompany,
    };

    return Scaffold(
      appBar: AppBar(title: Text(l10n.profileTitle)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(AppSpacing.base, AppSpacing.sm, AppSpacing.base, AppSpacing.xxl),
        children: [
          SahlCard(
            child: Row(
              children: [
                SahlAvatar(name: user.fullName, imageUrl: user.profilePictureUrl, size: 60),
                const SizedBox(width: AppSpacing.base),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user.fullName, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                      const SizedBox(height: 2),
                      Text(user.phone, textDirection: TextDirection.ltr, style: TextStyle(color: tokens.textMuted)),
                      const SizedBox(height: AppSpacing.sm),
                      StatusChip(label: roleLabel, tone: StatusTone.brand),
                    ],
                  ),
                ),
              ],
            ),
          ),
          SectionHeader(title: l10n.accountSection),
          ActionGroup(
            children: [
              ActionTile(
                icon: Symbols.edit,
                color: colorScheme.primary,
                title: l10n.editProfile,
                onTap: () => context.push('/account/edit'),
              ),
              if (workspace == UserWorkspace.provider) ...[
                ActionTile(
                  icon: Symbols.badge,
                  color: tokens.accent,
                  title: l10n.providerProfileTitle,
                  onTap: () => context.push('/provider/profile'),
                ),
                ActionTile(
                  icon: Symbols.account_balance,
                  color: tokens.info,
                  title: l10n.providerPayoutAccountsTitle,
                  onTap: () => context.push('/provider/payout-accounts'),
                ),
              ],
              if (workspace == UserWorkspace.company)
                ActionTile(
                  icon: Symbols.verified_user,
                  color: tokens.success,
                  title: l10n.companyDocumentsTitle,
                  onTap: () => context.push('/company/${user.companyId}/verification'),
                ),
              ActionTile(
                icon: Symbols.lock,
                color: tokens.warning,
                title: l10n.changePassword,
                onTap: () => context.push('/account/password'),
              ),
              ActionTile(
                icon: Symbols.notifications_active,
                color: tokens.info,
                title: l10n.notificationPrefsTitle,
                onTap: () => context.push('/account/notifications'),
              ),
            ],
          ),
          SectionHeader(title: l10n.activitySection),
          ActionGroup(
            children: [
              ActionTile(
                icon: Symbols.notifications,
                color: colorScheme.primary,
                title: l10n.notificationsTitle,
                onTap: () => context.push('/notifications'),
              ),
              ActionTile(
                icon: Symbols.report,
                color: tokens.warning,
                title: l10n.disputeMyDisputes,
                onTap: () => context.push('/disputes'),
              ),
              if (workspace != UserWorkspace.company)
                ActionTile(
                  icon: Symbols.mail,
                  color: tokens.info,
                  title: l10n.companyMyInvitationsTitle,
                  onTap: () => context.push('/company/invitations'),
                ),
              ActionTile(
                icon: Symbols.support_agent,
                color: tokens.success,
                title: l10n.helpSupport,
                onTap: () => context.push('/support'),
              ),
            ],
          ),
          SectionHeader(title: l10n.settingsSection),
          const _AppearanceCard(),
          const SizedBox(height: AppSpacing.lg),
          ActionGroup(
            children: [
              ActionTile(
                icon: Symbols.logout,
                color: colorScheme.error,
                title: l10n.logout,
                destructive: true,
                onTap: () async {
                  final confirmed = await showConfirmDialog(
                    context,
                    title: l10n.logoutConfirmTitle,
                    message: l10n.logoutConfirmMessage,
                    confirmLabel: l10n.logout,
                    destructive: true,
                  );
                  if (confirmed) await ref.read(authControllerProvider.notifier).logout();
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AppearanceCard extends ConsumerWidget {
  const _AppearanceCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final themeMode = ref.watch(themeModeControllerProvider);
    final locale = ref.watch(localeControllerProvider);
    final labelStyle = Theme.of(context).textTheme.labelLarge?.copyWith(color: context.sahl.textMuted);

    return SahlCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(l10n.appearance, style: labelStyle),
          const SizedBox(height: AppSpacing.sm),
          SegmentedButton<ThemeMode>(
            showSelectedIcon: false,
            // Label-only segments: icons + labels wrap on narrow phones.
            segments: [
              ButtonSegment(value: ThemeMode.system, label: Text(l10n.themeSystem, maxLines: 1)),
              ButtonSegment(value: ThemeMode.light, label: Text(l10n.themeLight, maxLines: 1)),
              ButtonSegment(value: ThemeMode.dark, label: Text(l10n.themeDark, maxLines: 1)),
            ],
            selected: {themeMode},
            onSelectionChanged: (s) => ref.read(themeModeControllerProvider.notifier).setThemeMode(s.first),
          ),
          const SizedBox(height: AppSpacing.lg),
          Text(l10n.language, style: labelStyle),
          const SizedBox(height: AppSpacing.sm),
          SegmentedButton<String>(
            showSelectedIcon: false,
            segments: [
              ButtonSegment(value: 'ar', label: Text(l10n.languageArabic)),
              ButtonSegment(value: 'en', label: Text(l10n.languageEnglish)),
            ],
            selected: {locale.languageCode},
            onSelectionChanged: (s) => ref.read(localeControllerProvider.notifier).setLocale(Locale(s.first)),
          ),
        ],
      ),
    );
  }
}
