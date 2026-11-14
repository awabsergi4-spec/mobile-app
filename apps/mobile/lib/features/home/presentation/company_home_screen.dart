import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../auth/application/auth_controller.dart';
import '../../company/application/company_controller.dart';
import '../../company/domain/company.dart';
import '../../notification/presentation/widgets/notification_bell_button.dart';

enum _CompanyMenuAction { members, verification, logout }

class CompanyHomeScreen extends ConsumerWidget {
  const CompanyHomeScreen({super.key, required this.companyId});

  final String companyId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final user = ref.watch(authControllerProvider).user;
    final company = ref.watch(companyProvider(companyId));

    return Scaffold(
      appBar: AppBar(
        title: Text(user != null ? l10n.homeGreeting(user.fullName) : l10n.companyDashboardTitle),
        actions: [
          const NotificationBellButton(),
          PopupMenuButton<_CompanyMenuAction>(
            onSelected: (action) {
              switch (action) {
                case _CompanyMenuAction.members:
                  context.push('/company/$companyId/members');
                case _CompanyMenuAction.verification:
                  context.push('/company/$companyId/verification');
                case _CompanyMenuAction.logout:
                  ref.read(authControllerProvider.notifier).logout();
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(value: _CompanyMenuAction.members, child: Text(l10n.companyMembersTitle)),
              PopupMenuItem(value: _CompanyMenuAction.verification, child: Text(l10n.companyDocumentsTitle)),
              const PopupMenuDivider(),
              PopupMenuItem(value: _CompanyMenuAction.logout, child: Text(l10n.logout)),
            ],
          ),
        ],
      ),
      body: AsyncValueView<Company>(
        value: company,
        onRetry: () => ref.invalidate(companyProvider(companyId)),
        data: (context, data) => Padding(
          padding: const EdgeInsets.all(AppSpacing.base),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.base),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(data.name, style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: AppSpacing.xs),
                  Text(l10n.companyVerificationStatus(data.verificationStatus)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
