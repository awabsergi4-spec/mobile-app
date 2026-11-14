import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../application/remote_controller.dart';
import '../domain/remote_engagement.dart';
import 'widgets/remote_status_label.dart';

class MyRemoteEngagementsScreen extends ConsumerWidget {
  const MyRemoteEngagementsScreen({super.key, required this.asProvider});

  final bool asProvider;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final engagements = ref.watch(myRemoteEngagementsControllerProvider(asProvider));

    return Scaffold(
      appBar: AppBar(title: Text(asProvider ? l10n.remoteMyBookings : l10n.remoteMyEngagements)),
      floatingActionButton: asProvider
          ? null
          : FloatingActionButton.extended(
              onPressed: () => context.push('/remote/new'),
              icon: const Icon(Icons.add),
              label: Text(l10n.remoteNewEngagement),
            ),
      body: AsyncValueView<List<RemoteEngagement>>(
        value: engagements,
        onRetry: () => ref.invalidate(myRemoteEngagementsControllerProvider(asProvider)),
        data: (context, data) {
          if (data.isEmpty) {
            return EmptyStateView(message: l10n.remoteNoEngagements);
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(myRemoteEngagementsControllerProvider(asProvider)),
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.base),
              itemCount: data.length,
              separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
              itemBuilder: (context, index) {
                final engagement = data[index];
                return Card(
                  child: ListTile(
                    onTap: () => context.push('/remote/${engagement.id}'),
                    title: Text(engagement.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                    subtitle: Text(engagement.amount.toString()),
                    trailing: Chip(
                      label: Text(remoteEngagementStatusText(l10n, engagement.status)),
                      backgroundColor: remoteEngagementStatusColor(context, engagement.status).withValues(alpha: 0.15),
                      labelStyle: TextStyle(color: remoteEngagementStatusColor(context, engagement.status)),
                      side: BorderSide.none,
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
