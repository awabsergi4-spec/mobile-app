import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../application/company_invitations_controller.dart';
import '../domain/company_invitation.dart';
import 'widgets/company_role_label.dart';

class MyCompanyInvitationsScreen extends ConsumerWidget {
  const MyCompanyInvitationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final invitations = ref.watch(myCompanyInvitationsControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.companyMyInvitationsTitle)),
      body: AsyncValueView<List<CompanyInvitation>>(
        value: invitations,
        onRetry: () => ref.invalidate(myCompanyInvitationsControllerProvider),
        data: (context, data) {
          if (data.isEmpty) {
            return EmptyStateView(message: l10n.companyNoInvitations);
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(myCompanyInvitationsControllerProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.base),
              itemCount: data.length,
              separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
              itemBuilder: (context, index) {
                final invitation = data[index];
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.base),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(l10n.companyInvitedToJoin(invitation.companyName ?? '', companyRoleText(l10n, invitation.role))),
                        const SizedBox(height: AppSpacing.sm),
                        Align(
                          alignment: Alignment.centerRight,
                          child: FilledButton(
                            onPressed: () => ref.read(myCompanyInvitationsControllerProvider.notifier).accept(invitation.id),
                            child: Text(l10n.companyAccept),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
