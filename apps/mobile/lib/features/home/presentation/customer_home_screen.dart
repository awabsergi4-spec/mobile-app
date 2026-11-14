import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/remote_config/remote_config_providers.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/sahl_ui.dart';
import '../../auth/application/auth_controller.dart';
import '../../notification/presentation/widgets/notification_bell_button.dart';
import 'widgets/home_layout_block_list.dart';

/// Customer › Home tab: greeting, search, the three service types and the
/// admin-published "For you" blocks.
class CustomerHomeScreen extends ConsumerWidget {
  const CustomerHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final user = ref.watch(authControllerProvider).user;
    final tokens = context.sahl;
    final colorScheme = Theme.of(context).colorScheme;

    final serviceTypes = [
      (Symbols.bolt, colorScheme.primary, l10n.serviceTypeOnDemand, l10n.serviceTypeOnDemandHint, 'onDemand'),
      (Symbols.laptop_mac, tokens.info, l10n.serviceTypeShortTerm, l10n.serviceTypeShortTermHint, 'remote'),
      (Symbols.handshake, tokens.success, l10n.serviceTypeLongTerm, l10n.serviceTypeLongTermHint, 'contract'),
    ];

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async => ref.invalidate(homeLayoutProvider),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(AppSpacing.base, AppSpacing.md, AppSpacing.base, AppSpacing.xl),
            children: [
              Row(
                children: [
                  SahlAvatar(name: user?.fullName ?? '', imageUrl: user?.profilePictureUrl),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Text(
                      user != null ? l10n.homeGreeting(user.fullName) : l10n.homePlaceholderTitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                    ),
                  ),
                  const NotificationBellButton(),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),
              SearchBarButton(hint: l10n.homeSearchHint, onTap: () => context.go('/c/explore')),
              SectionHeader(title: l10n.homeServiceTypesTitle),
              for (final (icon, color, title, hint, type) in serviceTypes) ...[
                SahlCard(
                  onTap: () => context.go('/c/explore?type=$type'),
                  child: Row(
                    children: [
                      IconBadge(icon: icon, color: color, size: 52),
                      const SizedBox(width: AppSpacing.base),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                            const SizedBox(height: 2),
                            Text(hint, style: TextStyle(color: tokens.textMuted)),
                          ],
                        ),
                      ),
                      Icon(Icons.chevron_right_rounded, color: tokens.textMuted),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
              ],
              const HomeLayoutBlockList(),
            ],
          ),
        ),
      ),
    );
  }
}
