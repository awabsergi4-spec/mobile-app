import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../auth/application/auth_controller.dart';
import '../../notification/presentation/widgets/notification_bell_button.dart';
import 'widgets/home_layout_block_list.dart';

enum _CustomerMenuAction { onDemand, contracts, remote, disputes, companyInvitations, logout }

class CustomerHomeScreen extends ConsumerWidget {
  const CustomerHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final user = ref.watch(authControllerProvider).user;

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
          PopupMenuButton<_CustomerMenuAction>(
            onSelected: (action) {
              switch (action) {
                case _CustomerMenuAction.onDemand:
                  context.push('/on-demand');
                case _CustomerMenuAction.contracts:
                  context.push('/contracts');
                case _CustomerMenuAction.remote:
                  context.push('/remote');
                case _CustomerMenuAction.disputes:
                  context.push('/disputes');
                case _CustomerMenuAction.companyInvitations:
                  context.push('/company/invitations');
                case _CustomerMenuAction.logout:
                  ref.read(authControllerProvider.notifier).logout();
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(value: _CustomerMenuAction.onDemand, child: Text(l10n.onDemandMyRequests)),
              PopupMenuItem(value: _CustomerMenuAction.contracts, child: Text(l10n.contractMyProjects)),
              PopupMenuItem(value: _CustomerMenuAction.remote, child: Text(l10n.remoteMyEngagements)),
              PopupMenuItem(value: _CustomerMenuAction.disputes, child: Text(l10n.disputeMyDisputes)),
              PopupMenuItem(value: _CustomerMenuAction.companyInvitations, child: Text(l10n.companyMyInvitationsTitle)),
              const PopupMenuDivider(),
              PopupMenuItem(value: _CustomerMenuAction.logout, child: Text(l10n.logout)),
            ],
          ),
        ],
      ),
      body: const HomeLayoutBlockList(),
    );
  }
}
