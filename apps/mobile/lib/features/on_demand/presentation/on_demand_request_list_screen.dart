import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../application/on_demand_controller.dart';
import '../domain/on_demand_request.dart';
import 'widgets/on_demand_status_label.dart';

class OnDemandRequestListScreen extends ConsumerWidget {
  const OnDemandRequestListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final requests = ref.watch(myOnDemandRequestsControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.onDemandMyRequests)),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/book'),
        icon: const Icon(Icons.add),
        label: Text(l10n.onDemandNewRequest),
      ),
      body: AsyncValueView<List<OnDemandRequest>>(
        value: requests,
        onRetry: () => ref.invalidate(myOnDemandRequestsControllerProvider),
        data: (context, data) {
          if (data.isEmpty) {
            return EmptyStateView(message: l10n.onDemandNoRequests);
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(myOnDemandRequestsControllerProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.base),
              itemCount: data.length,
              separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
              itemBuilder: (context, index) {
                final request = data[index];
                return Card(
                  child: ListTile(
                    onTap: () => context.push('/on-demand/${request.id}'),
                    title: Text(request.description, maxLines: 1, overflow: TextOverflow.ellipsis),
                    subtitle: Text(request.createdAt.toLocal().toString()),
                    trailing: Chip(
                      label: Text(onDemandStatusText(l10n, request.status)),
                      backgroundColor: onDemandStatusColor(context, request.status).withValues(alpha: 0.15),
                      labelStyle: TextStyle(color: onDemandStatusColor(context, request.status)),
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
